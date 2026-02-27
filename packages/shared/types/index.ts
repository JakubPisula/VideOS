/**
 * Shared Type Definitions for Creative Second Brain
 */

export interface ProjectMetadata {
    id: string;
    name: string;
    status: 'planning' | 'shooting' | 'editing' | 'review' | 'completed';
    createdAt: string;
    updatedAt: string;
}

export interface ProjectLinks {
    frameIoUrl?: string;
    nextcloudUrl?: string;
    localPathId?: string;
}

export interface NotionProjectRecord {
    notionId: string;
    projectId: string; // The unified internal project ID
    metadata: ProjectMetadata;
    links: ProjectLinks;
}
