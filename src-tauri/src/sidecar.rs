use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use tokio::sync::{Mutex, oneshot};
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use serde_json::Value;

/// Timeout for sidecar requests in seconds.
/// Kept at 30s to accommodate slow initial connections while still failing fast for hangs.
const REQUEST_TIMEOUT_SECS: u64 = 30;

#[derive(Clone)]
pub struct SidecarManager {
    child: Arc<Mutex<Option<CommandChild>>>,
    pending: Arc<Mutex<HashMap<String, oneshot::Sender<Result<Value, String>>>>>,
    running: Arc<AtomicBool>,
}

impl SidecarManager {
    pub fn new() -> Self {
        Self {
            child: Arc::new(Mutex::new(None)),
            pending: Arc::new(Mutex::new(HashMap::new())),
            running: Arc::new(AtomicBool::new(false)),
        }
    }

    pub async fn start(&self, app: &AppHandle) -> Result<(), String> {
        let sidecar_command = app
            .shell()
            .sidecar("ssmsx-sidecar")
            .map_err(|e| format!("Failed to create sidecar command: {}", e))?;

        let (mut rx, child) = sidecar_command
            .spawn()
            .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;

        *self.child.lock().await = Some(child);
        self.running.store(true, Ordering::SeqCst);

        let pending = self.pending.clone();
        let running = self.running.clone();
        let child_handle = self.child.clone();

        // Spawn reader task for sidecar stdout
        tauri::async_runtime::spawn(async move {
            while let Some(event) = rx.recv().await {
                match event {
                    CommandEvent::Stdout(line_bytes) => {
                        let line = String::from_utf8_lossy(&line_bytes);
                        let line = line.trim();
                        if line.is_empty() {
                            continue;
                        }

                        // Parse JSON response
                        match serde_json::from_str::<Value>(line) {
                            Ok(response) => {
                                if let Some(id) = response.get("id").and_then(|v| v.as_str()) {
                                    let mut pending = pending.lock().await;
                                    if let Some(sender) = pending.remove(id) {
                                        if let Some(error) = response.get("error") {
                                            let msg = error
                                                .get("message")
                                                .and_then(|v| v.as_str())
                                                .unwrap_or("Unknown error");
                                            let _ = sender.send(Err(msg.to_string()));
                                        } else if let Some(result) = response.get("result") {
                                            let _ = sender.send(Ok(result.clone()));
                                        } else {
                                            let _ = sender.send(Ok(Value::Null));
                                        }
                                    }
                                }
                            }
                            Err(e) => {
                                log::error!("Failed to parse sidecar response: {} — line: {}", e, line);
                            }
                        }
                    }
                    CommandEvent::Stderr(err_bytes) => {
                        let err = String::from_utf8_lossy(&err_bytes);
                        log::warn!("Sidecar stderr: {}", err);
                    }
                    CommandEvent::Terminated(payload) => {
                        log::info!("Sidecar terminated with code: {:?}", payload.code);
                        // Mark as not running and clear child handle
                        running.store(false, Ordering::SeqCst);
                        *child_handle.lock().await = None;
                        // Drain all pending requests so callers fail fast
                        let mut pending = pending.lock().await;
                        for (_, sender) in pending.drain() {
                            let _ = sender.send(Err("Sidecar process terminated".to_string()));
                        }
                        break;
                    }
                    _ => {}
                }
            }
        });

        Ok(())
    }

    pub async fn send_request(
        &self,
        method: &str,
        params: Option<Value>,
    ) -> Result<Value, String> {
        let id = uuid::Uuid::new_v4().to_string();

        let request = serde_json::json!({
            "id": id,
            "method": method,
            "params": params
        });

        let request_line = format!("{}\n", serde_json::to_string(&request).map_err(|e| e.to_string())?);

        let (tx, rx) = oneshot::channel();

        if !self.running.load(Ordering::SeqCst) {
            return Err(format!(
                "Sidecar not running — cannot send request for method '{}'",
                method
            ));
        }

        log::debug!("Sending request '{}' for method '{}'", id, method);

        // Insert into pending before write so the reader task can match the response
        {
            let mut pending = self.pending.lock().await;
            pending.insert(id.clone(), tx);
        }

        // Write to sidecar — clean up pending on failure
        {
            let mut child_lock = self.child.lock().await;
            if let Some(child) = child_lock.as_mut() {
                if let Err(e) = child.write(request_line.as_bytes()) {
                    let mut pending = self.pending.lock().await;
                    pending.remove(&id);
                    return Err(format!(
                        "Failed to write to sidecar for method '{}': {}",
                        method, e
                    ));
                }
            } else {
                let mut pending = self.pending.lock().await;
                pending.remove(&id);
                return Err(format!(
                    "Sidecar not running — cannot send request for method '{}'",
                    method
                ));
            }
        }

        // Wait for response with timeout
        match tokio::time::timeout(std::time::Duration::from_secs(REQUEST_TIMEOUT_SECS), rx).await {
            Ok(Ok(result)) => result,
            Ok(Err(_)) => Err(format!(
                "Response channel closed for request '{}' (method: '{}')",
                id, method
            )),
            Err(_) => {
                // Clean up pending request on timeout
                let mut pending = self.pending.lock().await;
                pending.remove(&id);
                log::warn!(
                    "Request '{}' for method '{}' timed out after {}s",
                    id,
                    method,
                    REQUEST_TIMEOUT_SECS
                );
                Err(format!(
                    "Request timed out after {}s for method '{}'",
                    REQUEST_TIMEOUT_SECS, method
                ))
            }
        }
    }
}
