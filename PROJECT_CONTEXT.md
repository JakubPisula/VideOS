# Creative Second Brain (CSB) - Project Context

## Overview
This monorepo constitutes the "Creative Second Brain" system, specifically designed for filmmakers and photographers. It integrates various platforms to streamline the creative workflow, asset management, and client review process.

## Architecture & Integration
*   **Source of Truth:** Notion acts as the primary database and CRM. All authoritative data resides here.
*   **System Integration:** The system seamlessly connects a unique Project ID with its corresponding:
    *   **Frame.io Links:** For client reviews and feedback.
    *   **Local Storage Paths:** For immediate access to high-resolution raw files and project files.
    *   **Nextcloud URLs:** For general file sharing and backups.

## Monorepo Structure
*   `apps/web`: Next.js 14 web application for client portfolio and review panel.
*   `apps/adobe-extension`: Adobe UXP plugin for Premiere Pro integration.
*   `packages/shared`: Shared TypeScript types and Notion API logic.
*   `docker`: Docker configuration for self-hosting.
*   `docs`: Technical documentation.
