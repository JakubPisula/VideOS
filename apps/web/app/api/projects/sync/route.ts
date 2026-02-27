import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const getConfig = () => {
    const configPath = path.join(process.cwd(), 'data', 'config.json');
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return null;
};

export async function POST(request: Request) {
    const logs: string[] = [];
    const log = (msg: string) => {
        const time = new Date().toISOString();
        logs.push(`[${time}] ${msg}`);
        console.log(`[SYNC] ${msg}`);
    };

    try {
        const payload = await request.json();
        const { projectId } = payload;

        log(`Starting sync for project ID: ${projectId}`);
        const config = getConfig();

        if (!config) {
            log('Error: Configuration not found. Aborting.');
            return NextResponse.json({ error: 'System not configured.', logs }, { status: 400 });
        }

        const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
        if (!fs.existsSync(projectsPath)) {
            log('Error: Local projects database not found.');
            return NextResponse.json({ error: 'Projects DB not found.', logs }, { status: 400 });
        }

        let localProjects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
        const projectIndex = localProjects.findIndex((p: any) => p.id === projectId);

        if (projectIndex === -1) {
            log(`Error: Project ${projectId} not found in local DB.`);
            return NextResponse.json({ error: 'Project not found.', logs }, { status: 404 });
        }

        const project = localProjects[projectIndex];
        let frameioResponse = null;
        let notionResponse = null;

        // --- 1. Frame.io Sync ---
        if (!project.frameioSynced && config.frameioToken) {
            log('Attempting to synchronize with Frame.io...');
            try {
                const accounts = await fetch('https://api.frame.io/v2/accounts', {
                    headers: { 'Authorization': `Bearer ${config.frameioToken}` }
                }).then(res => res.json());

                if (accounts.length > 0) {
                    const teams = await fetch(`https://api.frame.io/v2/accounts/${accounts[0].id}/teams`, {
                        headers: { 'Authorization': `Bearer ${config.frameioToken}` }
                    }).then(res => res.json());

                    if (teams.length > 0) {
                        const createProjectRes = await fetch(`https://api.frame.io/v2/teams/${teams[0].id}/projects`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${config.frameioToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                name: `${project.clientName} | ${project.projectName}`,
                                private: false
                            })
                        });

                        if (createProjectRes.ok) {
                            frameioResponse = await createProjectRes.json();
                            log('Successfully created Frame.io project.');
                            project.frameioSynced = true;

                            // Create standard Uploads folder
                            await fetch(`https://api.frame.io/v2/assets/${frameioResponse.root_asset_id}/children`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${config.frameioToken}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ name: `Uploads - ${project.clientName}`, type: 'folder' })
                            });
                            log('Created Uploads folder in Frame.io.');
                        } else {
                            const errTxt = await createProjectRes.text();
                            log(`Frame.io API Error: ${createProjectRes.status} - ${errTxt}`);
                        }
                    } else {
                        log('No Frame.io teams found.');
                    }
                } else {
                    log('No Frame.io accounts found. Check permissions or token.');
                }
            } catch (err: any) {
                log(`Frame.io synchronization Exception: ${err.message}`);
            }
        } else {
            if (project.frameioSynced) log('Frame.io already synchronized. Skipping.');
            if (!config.frameioToken) log('Frame.io token missing. Skipping.');
        }

        // --- 2. Notion Sync ---
        if (!project.notionSynced && config.notionToken && config.selectedDatabase) {
            log('Attempting to synchronize with Notion...');
            try {
                const properties: any = {};

                if (config.mappings) {
                    for (const map of config.mappings) {
                        if (!map.notionProperty || !map.frameioField) continue;

                        let valueToInsert = '';
                        if (map.frameioField === 'Project Name') valueToInsert = `${project.clientName} | ${project.projectName}`;
                        if (map.frameioField === 'Description') valueToInsert = project.description || '';
                        if (map.frameioField === 'Folder Status') valueToInsert = 'Not Started';

                        if (valueToInsert) {
                            // If this maps to Project Name, it's highly likely to be the database's primary title property.
                            if (map.frameioField === 'Project Name') {
                                properties[map.notionProperty] = {
                                    title: [{ text: { content: valueToInsert } }]
                                };
                            } else {
                                properties[map.notionProperty] = {
                                    rich_text: [{ text: { content: valueToInsert } }]
                                };
                            }
                        }
                    }
                }

                const createNotionRes = await fetch('https://api.notion.com/v1/pages', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${config.notionToken}`,
                        'Notion-Version': '2022-06-28',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        parent: { database_id: config.selectedDatabase },
                        properties: properties
                    })
                });

                if (createNotionRes.ok) {
                    notionResponse = await createNotionRes.json();
                    log(`Successfully created Notion row with ID: ${notionResponse.id}`);
                    project.notionSynced = true;
                    project.notionId = notionResponse.id;
                    project.notionLastEditedTime = notionResponse.last_edited_time;
                } else {
                    const errorText = await createNotionRes.text();
                    log(`Notion API Error: ${createNotionRes.status} - ${errorText}`);
                }
            } catch (err: any) {
                log(`Notion synchronization Exception: ${err.message}`);
            }
        } else {
            if (project.notionSynced) log('Notion already synchronized. Skipping.');
            if (!config.notionToken || !config.selectedDatabase) log('Notion config incomplete. Skipping.');
        }

        // Save updated project back to database
        localProjects[projectIndex] = project;
        fs.writeFileSync(projectsPath, JSON.stringify(localProjects, null, 2), 'utf8');
        log('Local project record updated.');

        return NextResponse.json({
            success: true,
            logs,
            project
        });

    } catch (error: any) {
        log(`Fatal sync error: ${error.message}`);
        return NextResponse.json({ error: error.message, logs }, { status: 500 });
    }
}
