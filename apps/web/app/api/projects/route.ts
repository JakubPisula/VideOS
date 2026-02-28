import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/middleware';

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

export async function GET(request: Request) {
    try {
        const sessionRes = await requireAuth(request);
        if (sessionRes instanceof NextResponse) return sessionRes;
        const session = sessionRes;

        ensureDataDir();
        const projectsData = fs.readFileSync(projectsPath, 'utf8');
        let projects = JSON.parse(projectsData);

        if (session.role === 'client') {
            projects = projects
                .filter((p: any) => p.assignedTo === session.userId)
                .map((p: any) => {
                    // Filter properties based on visibility config
                    const visibility = p.clientVisibility || Object.keys(p.properties || {});
                    const filteredProps: Record<string, string> = {};
                    if (p.properties) {
                        for (const key of visibility) {
                            if (p.properties[key] !== undefined) {
                                filteredProps[key] = p.properties[key];
                            }
                        }
                    }
                    return { ...p, properties: filteredProps };
                });
        }

        return NextResponse.json(projects);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
