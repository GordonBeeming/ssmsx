# SSMSX

A fast, cross-platform SQL Server Management Studio built for developers who are tired of waiting.

SSMS is Windows-only. Azure Data Studio is nearing end-of-life. Neither feels fast. SSMSX fixes all three problems.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Tauri v2 Shell                      │
│  ┌────────────┐    ┌───────────────────┐             │
│  │ Rust Core  │◄──►│  React Frontend   │             │
│  │ (Tauri IPC │ cmd│  (Monaco, Zustand, │             │
│  │  commands) │    │   TanStack Table) │             │
│  └─────┬──────┘    └───────────────────┘             │
│        │ stdio/JSON                                   │
│  ┌─────▼──────────────────┐                          │
│  │  C# AOT Sidecar        │                          │
│  │  (SqlClient, MSAL,     │                          │
│  │   schema discovery)    │                          │
│  └────────────────────────┘                          │
│  Native OS WebView (WebView2/WKWebView/WebKitGTK)   │
└──────────────────────────────────────────────────────┘
```

- **Tauri v2 (Rust)** — native OS webview shell, tiny footprint, proven architecture (same as GitButler)
- **React + TypeScript** — Monaco Editor for SQL, Zustand for state, TanStack for virtualized results
- **C# Native AOT sidecar** — Microsoft.Data.SqlClient for SQL Server, MSAL for Entra MFA auth

The Rust layer handles the window and IPC. The C# sidecar handles everything SQL Server. They communicate via newline-delimited JSON over stdio. The React frontend talks to Rust via Tauri commands.

## MVP Features

- **Connection Management** — SQL Server Auth, connection strings, Microsoft Entra MFA with saved/recent connections and color coding
- **Object Explorer** — lazy-loaded database tree (databases, tables, views, stored procedures, functions, columns, keys, indexes)
- **Query Editor** — Monaco-powered SQL editor with tabs, IntelliSense, keyboard shortcuts (F5 execute, Ctrl+Shift+E execute selection)
- **Results Viewer** — virtualized grid handling 100K+ rows, messages tab, CSV export, clipboard copy

## Performance Targets

| Metric | Target |
|--------|--------|
| Startup to window visible | < 300ms |
| Sidecar ready | < 500ms |
| Connection establishment | < 2s |
| First result row | < 100ms |
| Object Explorer node expansion | < 300ms |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Shell | Tauri v2 (Rust) |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| SQL Editor | Monaco Editor |
| Results Grid | TanStack Table + TanStack Virtual |
| State | Zustand |
| Sidecar | C# .NET 9, Native AOT |
| SQL Driver | Microsoft.Data.SqlClient 6.x |
| Auth | MSAL (Microsoft.Identity.Client) |
| Credentials | OS Keychain (macOS/Windows/Linux) |

## Project Structure

```
ssmsx/
├── src-tauri/              # Tauri v2 Rust app (shell, IPC, sidecar management)
├── src/                    # React + TypeScript frontend
├── sidecar/                # C# Native AOT sidecar (SQL operations, auth)
├── build/                  # Cross-platform build scripts
└── docs/
    └── SPEC.md             # High-level spec and milestone plan
```

## Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) 20+
- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- Platform-specific Tauri dependencies — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## Development

```bash
# Coming soon — see docs/SPEC.md for the roadmap
```

## Roadmap

See [docs/SPEC.md](docs/SPEC.md) for the full specification and milestone plan. Issues are tracked on [GitHub Issues](https://github.com/GordonBeeming/ssmsx/issues) with milestones matching the spec.

## License

TBD
