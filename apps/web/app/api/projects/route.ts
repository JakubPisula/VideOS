import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the path for our local projects cache
const projectsPath = path.join(process.cwd(), 'data', 'projects.json');

// Ensure the data directory exists
const ensureDataDir = () => {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(projectsPath)) {
        fs.writeFileSync(projectsPath, JSON.stringify([]), 'utf8');
    }
};

export async function GET() {
    try {
        ensureDataDir();
        const projectsData = fs.readFileSync(projectsPath, 'utf8');
        return NextResponse.json(JSON.parse(projectsData));
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
