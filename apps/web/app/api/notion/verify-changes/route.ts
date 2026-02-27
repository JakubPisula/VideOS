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
        console.log(`[VERIFY-NOTION] ${msg}`);
    };

    try {
        log('Starting verification of Notion changes for local projects...');
        const config = getConfig();

        if (!config || !config.notionToken) {
            log('Error: Configuration or Notion Token not found. Aborting.');
            return NextResponse.json({ error: 'System not configured.', logs }, { status: 400 });
        }

        const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
        if (!fs.existsSync(projectsPath)) {
            log('Notice: Local projects database not found. Nothing to check.');
            return NextResponse.json({ message: 'No projects to check.', logs }, { status: 200 });
        }

        let localProjects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
        let updateCount = 0;

        for (let i = 0; i < localProjects.length; i++) {
            const project = localProjects[i];
            if (!project.notionId) continue; // Skip projects not linked to Notion

            log(`Checking project ${project.id} (Notion ID: ${project.notionId})...`);

            try {
                const res = await fetch(`https://api.notion.com/v1/pages/${project.notionId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${config.notionToken}`,
                        'Notion-Version': '2022-06-28'
                    }
                });

                if (res.ok) {
                    const notionData = await res.json();

                    const remoteLastEdited = notionData.last_edited_time;
                    const localLastEdited = project.notionLastEditedTime;

                    if (!localLastEdited || new Date(remoteLastEdited) > new Date(localLastEdited)) {
                        log(`Change detected for ${project.id}! Updating local record...`);

                        if (!project.properties) {
                            project.properties = {};
                        }

                        // We can also extract updated fields here (e.g., status, description) if mappings correlate
                        if (notionData.properties && config.mappings) {
                            for (const map of config.mappings) {
                                if (!map.notionProperty || !map.frameioField) continue;

                                const notionProp = notionData.properties[map.notionProperty];
                                if (!notionProp) continue;

                                let extractedValue = '';

                                // Extract value based on Notion property type
                                if (notionProp.type === 'title') {
                                    extractedValue = notionProp.title?.[0]?.plain_text || '';
                                } else if (notionProp.type === 'rich_text') {
                                    extractedValue = notionProp.rich_text?.[0]?.plain_text || '';
                                } else if (notionProp.type === 'select') {
                                    extractedValue = notionProp.select?.name || '';
                                } else if (notionProp.type === 'status') {
                                    extractedValue = notionProp.status?.name || '';
                                } else if (notionProp.type === 'number') {
                                    extractedValue = notionProp.number?.toString() || '';
                                }

                                if (extractedValue) {
                                    project.properties[map.notionProperty] = extractedValue;

                                    // Special case handling for the title formatting logic
                                    if (map.frameioField === 'Project Name') {
                                        const titleParts = extractedValue.split(' | ');
                                        if (titleParts.length === 2) {
                                            project.clientName = titleParts[0].trim();
                                            project.projectName = titleParts[1].trim();
                                        }
                                    }
                                }
                            }
                        }

                        project.notionLastEditedTime = remoteLastEdited;
                        localProjects[i] = project;
                        updateCount++;
                    } else {
                        log(`No newer changes in Notion for ${project.id}.`);
                    }
                } else {
                    const errorText = await res.text();
                    log(`Warning: Could not fetch Notion page ${project.notionId}. Error: ${res.status} - ${errorText}`);
                }
            } catch (err: any) {
                log(`Exception fetching Notion page for ${project.id}: ${err.message}`);
            }
        }

        if (updateCount > 0) {
            fs.writeFileSync(projectsPath, JSON.stringify(localProjects, null, 2), 'utf8');
            log(`Successfully applied ${updateCount} updates from Notion to local DB.`);
        } else {
            log('No properties to update from Notion.');
        }

        return NextResponse.json({
            success: true,
            message: `Verification complete. Applied ${updateCount} updates.`,
            logs
        });

    } catch (error: any) {
        log(`Fatal verification error: ${error.message}`);
        return NextResponse.json({ error: error.message, logs }, { status: 500 });
    }
}
