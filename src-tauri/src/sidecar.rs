use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{Mutex, oneshot};
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use serde_json::Value;

#[derive(Clone)]
pub struct SidecarManager {
    child: Arc<Mutex<Option<CommandChild>>>,
    pending: Arc<Mutex<HashMap<String, oneshot::Sender<Result<Value, String>>>>>,
}

impl SidecarManager {
    pub fn new() -> Self {
        Self {
            child: Arc::new(Mutex::new(None)),
            pending: Arc::new(Mutex::new(HashMap::new())),
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

        let pending = self.pending.clone();

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
                                eprintln!("Failed to parse sidecar response: {} — line: {}", e, line);
                            }
                        }
                    }
                    CommandEvent::Stderr(err_bytes) => {
                        let err = String::from_utf8_lossy(&err_bytes);
                        eprintln!("Sidecar stderr: {}", err);
                    }
                    CommandEvent::Terminated(payload) => {
                        eprintln!("Sidecar terminated with code: {:?}", payload.code);
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

        {
            let mut pending = self.pending.lock().await;
            pending.insert(id.clone(), tx);
        }

        {
            let mut child_lock = self.child.lock().await;
            if let Some(child) = child_lock.as_mut() {
                child
                    .write(request_line.as_bytes())
                    .map_err(|e| format!("Failed to write to sidecar: {}", e))?;
            } else {
                return Err("Sidecar not running".to_string());
            }
        }

        // Wait for response with timeout
        match tokio::time::timeout(std::time::Duration::from_secs(30), rx).await {
            Ok(Ok(result)) => result,
            Ok(Err(_)) => Err("Response channel closed".to_string()),
            Err(_) => {
                // Clean up pending request on timeout
                let mut pending = self.pending.lock().await;
                pending.remove(&id);
                Err("Request timed out".to_string())
            }
        }
    }
}
