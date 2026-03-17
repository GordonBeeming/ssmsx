import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function handlePing() {
    setLoading(true);
    setError("");
    try {
      const result = await invoke<string>("ping");
      setResponse(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>SSMSX</h1>
      <p className="subtitle">SQL Server Management Studio — Cross Platform</p>

      <div className="card">
        <button onClick={handlePing} disabled={loading}>
          {loading ? "Pinging..." : "Ping Sidecar"}
        </button>

        {response && (
          <div className="response">
            <h3>Sidecar Response:</h3>
            <pre>{response}</pre>
          </div>
        )}

        {error && (
          <div className="error">
            <h3>Error:</h3>
            <pre>{error}</pre>
          </div>
        )}
      </div>
    </main>
  );
}

export default App;
