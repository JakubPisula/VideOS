# Architectural Overview

## Separation of Concerns

### Web Application (`apps/web`)
Handles all user interface for the client review pane and portfolio. It uses the `shared` package to fetch data, keeping business logic outside of the view components.

### Adobe UXP Extension (`apps/adobe-extension`)
Handles direct interaction with Adobe Premiere Pro. It reads local paths and injects task lists dynamically. It communicates with Notion through the `shared` module.

### Shared Logic (`packages/shared`)
Contains the core business logic, API clients (Notion, Frame.io), and TypeScript interfaces. This ensures that both the Next.js app and the Adobe Extension work with the same data structures and single source of truth logic.
