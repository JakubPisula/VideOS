import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Load our configuration
const getConfig = () => {
    const configPath = path.join(process.cwd(), 'data', 'config.json');
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return null;
};

// Create a new Client project in Notion and Frame.io
export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const { clientName, projectName, description } = payload;

        const config = getConfig();

        if (!config) {
            return NextResponse.json({ error: 'System not configured. Visit settings first.' }, { status: 400 });
        }

        let frameioResponse = null;
        let notionResponse = null;

        // --- 1. Frame.io Project Creation ---
        if (config.frameioToken) {
            // First get account id and team id (this simplifies error handling for demonstration)
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
                            name: `${clientName} | ${projectName}`,
                            private: false
                        })
                    });

                    if (createProjectRes.ok) {
                        frameioResponse = await createProjectRes.json();
                        // Create standard Uploads folder
                        await fetch(`https://api.frame.io/v2/assets/${frameioResponse.root_asset_id}/children`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${config.frameioToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ name: `Uploads - ${clientName}`, type: 'folder' })
                        });
                    }
                }
            }
        }

        // --- 2. Notion Database Entry Creation ---
        if (config.notionToken && config.selectedDatabase) {

            // Build Notion properties dynamically based on mapping
            const properties: any = {};

            // Iterate over mappings to correctly attach values to matching Notion property type.
            // (Note: To keep this robust we default to rich_text/title. A production system needs to read the schema.)
            if (config.mappings) {
                for (const map of config.mappings) {
                    if (!map.notionProperty || !map.frameioField) continue;

                    let valueToInsert = '';
                    if (map.frameioField === 'Project Name') valueToInsert = `${clientName} | ${projectName}`;
                    if (map.frameioField === 'Description') valueToInsert = description || '';
                    if (map.frameioField === 'Folder Status') valueToInsert = 'Not Started'; // Or some default

                    if (valueToInsert) {
                        // Very basic property injection (assuming rich_text for non-title fields)
                        // Real implementation would need the actual property type (select, multi_select, title, etc)
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
            } else {
                console.error("Notion Error:", await createNotionRes.text());
            }
        }

        // --- 3. Save to Local JSON Database ---
        const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
        let localProjects = [];

        // Ensure data directory exists
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        if (fs.existsSync(projectsPath)) {
            try {
                localProjects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
            } catch (e) {
                // Keep empty array on parse error
            }
        }

        // Create the property structure dynamically based on the mappings
        const localProperties: any = {};
        if (config.mappings) {
            for (const map of config.mappings) {
                if (!map.notionProperty || !map.frameioField) continue;

                let val = '';
                if (map.frameioField === 'Project Name') val = `${clientName} | ${projectName}`;
                if (map.frameioField === 'Description') val = description || '';
                if (map.frameioField === 'Folder Status') val = 'Not Started';

                if (val) localProperties[map.notionProperty] = val;
            }
        }

        const newProjectEntry: any = {
            id: `PRJ-${Date.now().toString().slice(-6)}`,
            clientName,
            projectName,
            description: description || '',
            status: 'Setup',
            properties: localProperties,
            createdAt: new Date().toISOString(),
            notionSynced: !!notionResponse,
            frameioSynced: !!frameioResponse,
        };

        if (notionResponse) {
            newProjectEntry.notionId = notionResponse.id;
            newProjectEntry.notionLastEditedTime = notionResponse.last_edited_time;
        }

        localProjects.unshift(newProjectEntry); // Add to beginning of array
        fs.writeFileSync(projectsPath, JSON.stringify(localProjects, null, 2), 'utf8');

        return NextResponse.json({
            success: true,
            message: 'Project created successfully!',
            project: newProjectEntry,
            frameio: frameioResponse ? 'Created' : 'Skipped/Error',
            notion: notionResponse ? 'Created' : 'Skipped/Error'
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
