import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const getConfig = () => {
    const configPath = path.join(process.cwd(), 'data', 'config.json');
    if (fs.existsSync(configPath)) return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return null;
};

// POST /api/projects/[projectId]/brief
// Receives { answers: { [notionProperty]: string } }
// Saves to local project + syncs to Notion
export async function POST(
    request: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { answers } = await request.json();
        const { projectId } = await params;

        if (!answers || typeof answers !== 'object') {
            return NextResponse.json({ error: 'Invalid answers payload' }, { status: 400 });
        }

        const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
        if (!fs.existsSync(projectsPath)) {
            return NextResponse.json({ error: 'Project database not found' }, { status: 404 });
        }

        const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
        const idx = projects.findIndex((p: any) => p.id === projectId);
        if (idx === -1) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Merge answers into project properties
        const project = projects[idx];
        project.properties = { ...(project.properties || {}), ...answers };
        project.briefSubmittedAt = new Date().toISOString();
        project.briefSubmitted = true;
        projects[idx] = project;

        fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2), 'utf8');

        // Sync to Notion if project has a notionId
        if (project.notionId) {
            const config = getConfig();
            if (config?.notionToken) {
                const notionProperties: any = {};

                // Build Notion patch payload using config mappings + notionProperties schema
                if (config.notionProperties) {
                    for (const prop of config.notionProperties) {
                        const propName = typeof prop === 'string' ? prop : prop.name;
                        const propType = typeof prop === 'string' ? 'rich_text' : prop.type;
                        const val = answers[propName];
                        if (val === undefined || val === '') continue;

                        if (propType === 'title') {
                            notionProperties[propName] = { title: [{ text: { content: val } }] };
                        } else if (propType === 'rich_text') {
                            notionProperties[propName] = { rich_text: [{ text: { content: val } }] };
                        } else if (propType === 'select') {
                            notionProperties[propName] = { select: { name: val } };
                        } else if (propType === 'status') {
                            notionProperties[propName] = { status: { name: val } };
                        } else if (propType === 'date') {
                            notionProperties[propName] = { date: { start: val } };
                        } else if (propType === 'number') {
                            notionProperties[propName] = { number: parseFloat(val) || 0 };
                        } else if (propType === 'url') {
                            notionProperties[propName] = { url: val };
                        } else if (propType === 'email') {
                            notionProperties[propName] = { email: val };
                        }
                    }
                }

                if (Object.keys(notionProperties).length > 0) {
                    await fetch(`https://api.notion.com/v1/pages/${project.notionId}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${config.notionToken}`,
                            'Notion-Version': '2022-06-28',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ properties: notionProperties }),
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Brief submitted and synced to Notion.',
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET /api/projects/[projectId]/brief
// Returns the project's current properties + which fields are configured for brief
export async function GET(
    request: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { requireAuth } = await import('@/lib/middleware');
        const sessionRes = await requireAuth(request);
        if (sessionRes instanceof NextResponse) return sessionRes;
        const session = sessionRes;

        const { projectId } = await params;
        const config = getConfig();
        const projectsPath = path.join(process.cwd(), 'data', 'projects.json');

        if (!fs.existsSync(projectsPath)) {
            return NextResponse.json({ error: 'No projects found' }, { status: 404 });
        }

        const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
        const project = projects.find((p: any) => p.id === projectId);

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Enforce permissions: admin can see all, client can only see their assigned projects
        if (session.role === 'client' && project.assignedTo !== session.userId) {
            return NextResponse.json({ error: 'Access denied to this project.' }, { status: 403 });
        }

        // Apply field visibility rules for clients
        let properties = project.properties || {};
        if (session.role === 'client') {
            const visibility = project.clientVisibility || Object.keys(properties);
            const filteredProps: Record<string, string> = {};
            for (const key of visibility) {
                if (properties[key] !== undefined) {
                    filteredProps[key] = properties[key];
                }
            }
            properties = filteredProps;
        }

        const briefFields = config?.briefFields || [];

        return NextResponse.json({
            project: {
                id: project.id,
                clientName: project.clientName,
                projectName: project.projectName,
                briefSubmitted: project.briefSubmitted || false,
                briefSubmittedAt: project.briefSubmittedAt,
                properties,
            },
            briefFields,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
