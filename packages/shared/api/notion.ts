import { Client } from '@notionhq/client';
import { NotionProjectRecord, ProjectMetadata } from '../types';

export class NotionService {
    private client: Client;
    private databaseId: string;

    constructor(token: string, databaseId: string) {
        this.client = new Client({ auth: token });
        this.databaseId = databaseId;
    }

    /**
     * Fetches project details from Notion using the unified Project ID
     */
    async getProjectById(projectId: string): Promise<NotionProjectRecord | null> {
        try {
            const response = await this.client.databases.query({
                database_id: this.databaseId,
                filter: {
                    property: 'Project ID',
                    rich_text: {
                        equals: projectId,
                    },
                },
            });

            if (response.results.length === 0) {
                return null;
            }

            const page = response.results[0] as any;

            const record: NotionProjectRecord = {
                notionId: page.id,
                projectId: page.properties['Project ID']?.rich_text[0]?.plain_text || '',
                metadata: {
                    id: page.id,
                    name: page.properties['Name']?.title[0]?.plain_text || 'Untitled',
                    status: page.properties['Status']?.select?.name?.toLowerCase() || 'planning',
                    createdAt: page.created_time,
                    updatedAt: page.last_edited_time,
                },
                links: {
                    frameIoUrl: page.properties['Frame.io Link']?.url || undefined,
                    nextcloudUrl: page.properties['Nextcloud Link']?.url || undefined,
                    localPathId: page.properties['Local Path']?.rich_text[0]?.plain_text || undefined,
                }
            };

            return record;
        } catch (error) {
            console.error(`Failed to fetch project ${projectId} from Notion:`, error);
            throw error;
        }
    }

    /**
     * Creates a new project in Notion based on client brief
     */
    async createProject(name: string, clientEmail: string, brief: string): Promise<string> {
        try {
            const projectId = `PRJ-${Date.now().toString().slice(-6)}`;

            const response = await this.client.pages.create({
                parent: { database_id: this.databaseId },
                properties: {
                    'Name': { title: [{ text: { content: name } }] },
                    'Project ID': { rich_text: [{ text: { content: projectId } }] },
                    'Client Email': { email: clientEmail },
                    'Status': { select: { name: 'Planning' } }
                },
                children: [
                    {
                        object: 'block',
                        type: 'heading_2',
                        heading_2: { rich_text: [{ text: { content: 'Client Brief' } }] }
                    },
                    {
                        object: 'block',
                        type: 'paragraph',
                        paragraph: { rich_text: [{ text: { content: brief } }] }
                    }
                ]
            });

            return projectId;
        } catch (error) {
            console.error('Failed to create project in Notion:', error);
            throw error;
        }
    }

    /**
     * Updates task time tracking (used by Premiere Pro Extension)
     */
    async updateTaskTime(taskId: string, timeSpentMinutes: number): Promise<void> {
        try {
            // In a real setup, tasks might be inside a separate DB or as sub-items
            await this.client.pages.update({
                page_id: taskId,
                properties: {
                    'Time Spent (mins)': { number: timeSpentMinutes }
                }
            });
        } catch (error) {
            console.error(`Failed to update time for task ${taskId}:`, error);
            throw error;
        }
    }
}
