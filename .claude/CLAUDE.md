# SSMSX Project Guidelines

## Architecture: Vertical Slice Architecture (VSA)

This project follows **Vertical Slice Architecture** (VSA). Code is organized by **feature/slice** rather than by technical layer. Each feature contains all the code it needs — from UI components to Tauri commands to sidecar handlers — co-located in a single directory.

### Frontend (React/TypeScript) — Feature Organization

```
src/
├── features/
│   ├── connection/            # Connection management slice
│   │   ├── api/               # Tauri invoke wrappers for this feature
│   │   │   └── connectionApi.ts
│   │   ├── components/        # React components for this feature
│   │   │   ├── ConnectionDialog.tsx
│   │   │   ├── ConnectionList.tsx
│   │   │   ├── PropertiesTab.tsx
│   │   │   ├── ConnectionStringTab.tsx
│   │   │   └── CustomTab.tsx
│   │   ├── store/             # Zustand store for this feature
│   │   │   └── connectionStore.ts
│   │   ├── types.ts           # Types specific to this feature
│   │   └── index.ts           # Public API barrel export
│   │
│   ├── explorer/              # Object Explorer slice
│   │   ├── api/
│   │   │   └── explorerApi.ts
│   │   ├── components/
│   │   │   ├── ObjectExplorerTree.tsx
│   │   │   ├── TreeNode.tsx
│   │   │   ├── NodeIcon.tsx
│   │   │   └── useExplorerContextMenu.ts
│   │   ├── hooks/
│   │   │   └── useTreeKeyboard.ts
│   │   ├── store/
│   │   │   └── explorerStore.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── query/                 # Query Editor slice
│       ├── api/
│       ├── components/
│       ├── store/
│       │   └── queryStore.ts
│       ├── types.ts
│       └── index.ts
│
├── shared/                    # Truly shared code (used by 2+ features)
│   ├── components/            # Reusable UI primitives (ContextMenu, ConfirmDialog, ErrorBoundary)
│   ├── hooks/                 # Shared hooks
│   ├── types/                 # Shared type definitions
│   └── utils/                 # Shared utilities (e.g., quoteSqlName)
│
├── app/                       # App shell (layout, routing, top-level composition)
│   └── App.tsx
│
├── main.tsx                   # Entry point
└── index.css                  # Global styles
```

### Key VSA Rules for Frontend

1. **Feature folders are the primary organizing unit.** Each feature owns its components, store, API calls, hooks, and types.
2. **Features export through `index.ts` barrel files.** Other features import only from the barrel — never reach into a feature's internal files.
3. **Shared code goes in `shared/` only when used by 2+ features.** Don't preemptively extract. Start in the feature, extract when reuse is proven.
4. **Features can import from `shared/` but never from other features' internals.** Cross-feature communication happens through stores or events, not direct imports.
5. **Zustand stores are per-feature.** One store per feature slice. If features need to coordinate, they subscribe to each other's stores via selectors (not by importing actions directly).

### Rust Layer (Tauri Commands)

Organized by feature module matching the frontend slices:

```
src-tauri/src/
├── commands/
│   ├── mod.rs
│   ├── connection.rs          # Connection feature commands
│   ├── explorer.rs            # Explorer feature commands
│   └── ping.rs                # Health check
├── sidecar.rs                 # Sidecar process management (shared infrastructure)
├── lib.rs
└── main.rs
```

The Rust layer is thin (pass-through to sidecar), so feature separation at the module level is sufficient.

### C# Sidecar

Organized by feature within the Core project:

```
sidecar/src/
├── Ssmsx.Protocol/            # Shared protocol types (messages, models)
│   ├── Models/                # DTOs grouped by feature
│   ├── Messages/              # Request/response params grouped by feature
│   └── JsonRpc.cs             # Protocol infrastructure
│
├── Ssmsx.Core/                # Business logic by feature
│   ├── Connections/           # Connection feature
│   ├── Explorer/              # Explorer feature
│   ├── Credentials/           # Credential storage (shared infrastructure)
│   ├── Auth/                  # Authentication (shared infrastructure)
│   └── Storage/               # Persistence (shared infrastructure)
│
└── Ssmsx.Sidecar/             # Entry point + handler registration
    └── Program.cs
```

## Code Quality Standards

### TypeScript / React

- **No unsafe casts.** Never use `as unknown as SomeType` or `as Record<string, unknown>`. Use type guards, discriminated unions, or proper generic typing.
- **No non-null assertions (`!`) on optional properties.** Always validate before accessing. Use early returns with proper error handling.
- **All async operations must have try/catch.** Especially in event handlers and context menu actions. Display errors to the user via the store's error state or toast notifications.
- **No empty catch blocks.** Always log errors with `console.error()` at minimum. Prefer propagating errors to the UI.
- **Use type guards for runtime type checking.** Instead of casting, verify the shape of data:
  ```typescript
  // BAD: const val = data as unknown as Record<string, unknown>;
  // GOOD: if (typeof data === 'object' && data !== null && 'key' in data) { ... }
  ```
- **Separator items in ContextMenu should be typed properly.** Use a discriminated union type, not objects with dummy `label`/`onClick` fields.

### Rust

- **Include context in error messages.** Instead of `"Request timed out"`, use `format!("Request timed out after {}s for method '{}'", timeout_secs, method)`.
- **Use structured logging.** Always include relevant identifiers (connection IDs, method names) in log messages.

### C# (.NET)

- **Never use empty catch blocks.** Log all caught exceptions, even if the operation is non-critical.
- **Validate all inputs at service boundaries.** Use guard clauses at the top of public methods.
- **Use `is string result` pattern instead of `result as string`.** The `as` pattern silently returns null on failure; `is` makes intent explicit.
- **Hardcoded values (timeouts, sizes) should be constants with descriptive names** and documented defaults. Move to configuration when the value needs to change per-environment.

### General

- **DRY: Extract shared utilities when logic is duplicated.** SQL identifier quoting (`quoteSqlName` / `QuoteName`) should exist once in `shared/utils/` for TypeScript and once in a shared C# utility.
- **Feature code should be self-contained.** When adding a new feature, create the full vertical slice: API, components, store, types.
- **Never take shortcuts.** Write production-quality code from the start. If proper implementation requires significantly more code, flag it for discussion rather than implementing a shortcut.

## File Naming Conventions

- **TypeScript**: PascalCase for components (`ConnectionDialog.tsx`), camelCase for utilities and hooks (`connectionApi.ts`, `useTreeKeyboard.ts`)
- **Rust**: snake_case for everything (`connection.rs`, `sidecar.rs`)
- **C#**: PascalCase for everything (`ConnectionManager.cs`, `SchemaDiscoveryService.cs`)

## Testing

- Tests mirror the feature structure. Each feature has its own test directory.
- Integration tests that cross feature boundaries go in a top-level `tests/` directory.

## Adding a New Feature

1. Create the feature directory under `src/features/<feature-name>/`
2. Add `api/`, `components/`, `store/`, `types.ts`, and `index.ts`
3. Add corresponding Rust commands in `src-tauri/src/commands/<feature>.rs`
4. Add corresponding C# handler methods and register in `Program.cs`
5. Add protocol types in `Ssmsx.Protocol/Messages/` and `Ssmsx.Protocol/Models/`
6. Register the Rust commands in `lib.rs`
