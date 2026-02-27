import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Load our configuration to get the Frame.io token
const getConfig = () => {
    const configPath = path.join(process.cwd(), 'data', 'config.json');
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return null;
};

// Create a new Frame.io project (which acts like a folder for a specific client/job)
export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const { clientName, projectName } = payload;

        const config = getConfig();

        if (!config || !config.frameioToken) {
            return NextResponse.json({ error: 'Frame.io token not configured. Please visit settings first.' }, { status: 400 });
        }

        // 1. Fetch Accounts to find Teams
        let accountsResponse = await fetch('https://api.frame.io/v2/accounts', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.frameioToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!accountsResponse.ok) {
            return NextResponse.json({ error: 'Failed to fetch Frame.io accounts.' }, { status: accountsResponse.status });
        }

        const accounts = await accountsResponse.json();
        if (accounts.length === 0) {
            return NextResponse.json({ error: 'No Frame.io accounts found.' }, { status: 404 });
        }

        const accountId = accounts[0].id; // Use the first available account

        // 2. Fetch Teams within the Account
        let teamsResponse = await fetch(`https://api.frame.io/v2/accounts/${accountId}/teams`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.frameioToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!teamsResponse.ok) {
            return NextResponse.json({ error: 'Failed to fetch Teams.' }, { status: teamsResponse.status });
        }

        const teams = await teamsResponse.json();
        if (teams.length === 0) {
            return NextResponse.json({ error: 'No Teams found in your Frame.io account.' }, { status: 404 });
        }

        const teamId = teams[0].id; // Use the first available Team

        // 3. Create a new Project
        // Note: In Frame.io, "Projects" often act as the top-level client folder
        const createProjectResponse = await fetch(`https://api.frame.io/v2/teams/${teamId}/projects`, {
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

        if (!createProjectResponse.ok) {
            const err = await createProjectResponse.text();
            return NextResponse.json({ error: 'Failed to create Frame.io project.', details: err }, { status: createProjectResponse.status });
        }

        const newProject = await createProjectResponse.json();

        // 4. (Optional) Create a specific upload folder inside the project immediately
        // In Frame.io V2, a new project creates an implicit root_asset_id
        const rootFolderId = newProject.root_asset_id;

        const createFolderResponse = await fetch(`https://api.frame.io/v2/assets/${rootFolderId}/children`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.frameioToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: `Uploads - ${clientName}`,
                type: 'folder'
            })
        });

        let uploadFolder = null;
        if (createFolderResponse.ok) {
            uploadFolder = await createFolderResponse.json();
        }

        return NextResponse.json({
            success: true,
            message: 'Client project & folder created successfully!',
            project: newProject,
            folder: uploadFolder
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
