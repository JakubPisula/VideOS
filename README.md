# Creative Second Brain (CSB)

## Overview
Creative Second Brain is a comprehensive system designed for a freelance filmmaker and photographer. It encompasses a public-facing portfolio website, a client portal, a backend for content and project management, and an Adobe Premiere Pro extension to streamline the editing workflow.

## System Architecture & Workflow

### 1. Web Application (Next.js)
The web application serves two main purposes:
*   **Public Website & Portfolio:** A space to showcase work, publish simple blog posts (via a basic CMS editor), and provide a contact form.
*   **Client Portal:** Clients can register (e.g., after filling out the contact form), log in, and manage their projects.
    *   **Brief Submission:** Clients can fill out a project brief.
    *   **File Uploads:** A drag-and-drop interface allows clients to upload source files directly to configured cloud storage (Google Drive or Nextcloud).
    *   **Project Review:** An integrated Frame.io overlay allows clients to review ongoing and completed work directly within the portal.

### 2. Automation & Backend System
When a client submits a brief and uploads files, the system triggers several automated actions:
*   **Notion Integration:** A new project is automatically created in Notion (the central database/CRM) containing all brief details.
*   **Folder Creation:** Corresponding project folders are created in Frame.io and the designated cloud storage (Google Drive/Nextcloud).
*   **Notifications:** The freelancer receives an immediate notification about the new project.
*   **Mailing:** The system captures client emails for future mailing lists.

### 3. Local Workflow & Sync
*   **Storage Synchronization:** The freelancer syncs the cloud storage (Google Drive/Nextcloud) directly to their local editing machine's project folder to access source files.
*   **Notion To-Do Generation:** Based on the submitted brief, a work structure and task list are automatically generated within the Notion project.

### 4. Adobe Premiere Pro Extension (UXP)
The custom Premiere Pro plugin connects directly to the system to assist the editing process:
*   **Task Management:** Displays the to-do list fetched from Notion directly inside Premiere Pro.
*   **Time Tracking:** Tracks the start and end times for specific tasks and the overall project.
*   **Dynamic Estimation:** Time data is saved back to Notion to help estimate the time and cost for future, similar projects (dynamic pricing).
*   **Comment Syncing:** Client comments and feedback from Frame.io are synchronized with Notion to keep all project context in one place.

## Core Technologies
*   **Frontend & Web Backend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
*   **Database & CRM:** Notion API
*   **Video Review:** Frame.io API
*   **Cloud Storage:** Google Drive API / Nextcloud API
*   **Editing Integration:** Adobe UXP (Premiere Pro)
