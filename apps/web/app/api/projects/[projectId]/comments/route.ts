import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { getConfig } from '@/lib/notion-sync';
import fs from 'fs';
import path from 'path';

// Fetch comments from Notion page for this project
export async function GET(
    request: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const sessionRes = await requireAuth(request);
        if (sessionRes instanceof NextResponse) return sessionRes;
        const session = sessionRes;

        const { projectId } = await params;
        const config = getConfig();

        const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
        if (!fs.existsSync(projectsPath)) return NextResponse.json({ error: 'Projects not found' }, { status: 404 });

        const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
        const project = projects.find((p: any) => p.id === projectId);

        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        // Enforce permissions for client
        if (session.role === 'client' && project.assignedTo !== session.userId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        if (!project.notionId || !config?.notionToken) {
            return NextResponse.json({ comments: [] });
        }

        // Fetch comments from Notion page block
        const notionRes = await fetch(`https://api.notion.com/v1/comments?block_id=${project.notionId}`, {
            headers: {
                'Authorization': `Bearer ${config.notionToken}`,
                'Notion-Version': '2022-06-28'
            }
        });

        if (!notionRes.ok) {
            console.error('Failed to fetch Notion comments:', await notionRes.text());
            return NextResponse.json({ comments: [] }); // Soft fail
        }

        const data = await notionRes.json();
        const comments = data.results.map((c: any) => {
            const text = c.rich_text.map((t: any) => t.plain_text).join('');
            return {
                id: c.id,
                text,
                createdAt: c.created_time,
                author: c.created_by?.id === config.notionBotId ? 'System/Editor' : 'Editor'
                // Here we could extract [Frame.io - Author] format if we want
            };
        });

        return NextResponse.json({ comments });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Post a new comment to Notion from the Client Portal
export async function POST(
    request: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const sessionRes = await requireAuth(request);
        if (sessionRes instanceof NextResponse) return sessionRes;
        const session = sessionRes;

        const { text } = await request.json();
        const { projectId } = await params;

        if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 });

        const config = getConfig();
        const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
        const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
        const project = projects.find((p: any) => p.id === projectId);

        if (!project || (session.role === 'client' && project.assignedTo !== session.userId)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        if (!project.notionId || !config?.notionToken) {
            return NextResponse.json({ error: 'Notion not configured for this project' }, { status: 400 });
        }

        const authorPrefix = session.role === 'client' ? `[Client: ${session.name}]` : `[Admin]`;

        const notionRes = await fetch('https://api.notion.com/v1/comments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.notionToken}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                parent: { page_id: project.notionId },
                rich_text: [
                    {
                        text: { content: `${authorPrefix} ` },
                        annotations: { bold: true, color: session.role === 'client' ? 'green' : 'red' }
                    },
                    { text: { content: text } }
                ]
            })
        });

        if (!notionRes.ok) throw new Error('Failed to post comment to Notion');
        const data = await notionRes.json();

        return NextResponse.json({ success: true, commentId: data.id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
