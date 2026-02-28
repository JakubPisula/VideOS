import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/notion-sync';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const payload = await request.json();

        console.log('--- FRAME.IO WEBHOOK RECEIVED ---');
        console.log('Event Type:', payload.type);
        console.log('Resource ID:', payload.resource?.id);

        const config = getConfig();
        if (!config || !config.frameioToken || !config.notionToken) {
            return NextResponse.json({ error: 'System not fully configured' }, { status: 500 });
        }

        // --- Handle Comment Creation ---
        if (payload.type === 'comment.created' && payload.resource?.id) {
            console.log('A new comment was added! Fetching details from Frame.io...');

            // 1. Fetch comment details from Frame.io
            const commentRes = await fetch(`https://api.frame.io/v2/comments/${payload.resource.id}`, {
                headers: { 'Authorization': `Bearer ${config.frameioToken}` }
            });

            if (!commentRes.ok) {
                console.error('Failed to fetch comment from Frame.io', await commentRes.text());
                return NextResponse.json({ error: 'Failed to fetch comment' }, { status: 500 });
            }

            const commentData = await commentRes.json();
            const commentText = commentData.text || '';
            const authorName = commentData.owner?.name || 'Unknown User';
            const projectId = payload.project?.id || commentData.project_id;

            console.log(`Comment by ${authorName}: ${commentText}`);

            // 2. Find matching local project
            const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
            if (fs.existsSync(projectsPath)) {
                const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));

                // Try to find by frameioId
                const localProj = projects.find((p: any) => p.frameioId === projectId || (p.properties && p.properties['Frame.io'] && p.properties['Frame.io'].includes(projectId)));

                if (localProj && localProj.notionId) {
                    console.log(`Syncing comment to Notion Page: ${localProj.notionId}`);

                    // 3. Post comment to Notion Page
                    const notionRes = await fetch('https://api.notion.com/v1/comments', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${config.notionToken}`,
                            'Notion-Version': '2022-06-28',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            parent: { page_id: localProj.notionId },
                            rich_text: [
                                {
                                    text: { content: `[Frame.io - ${authorName}]\n` },
                                    annotations: { bold: true, color: 'blue' }
                                },
                                { text: { content: commentText } }
                            ]
                        })
                    });

                    if (notionRes.ok) {
                        console.log('✅ Comment successfully synced to Notion!');
                    } else {
                        console.error('❌ Failed to sync to Notion:', await notionRes.text());
                    }
                } else {
                    console.log('No matching local project with a configured Notion ID found for this Frame.io project.');
                }
            }
        }

        return NextResponse.json({ received: true, status: 'acknowledged' });
    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
