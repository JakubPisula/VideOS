import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/middleware';
import { getProjects, saveProjects } from '@/lib/notion-sync';
import { getUsers, saveUsers } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
    const authRes = await requireAuth(request, ['admin']);
    if (authRes instanceof NextResponse) return authRes;

    try {
        const { projectId } = await params;
        const { assignedTo, clientVisibility } = await request.json();

        const projects = getProjects();
        const projectIdx = projects.findIndex(p => p.id === projectId);

        if (projectIdx === -1) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        if (assignedTo !== undefined) {
            projects[projectIdx].assignedTo = assignedTo;

            // Update user record: ensure project is added
            const users = getUsers();
            const clientIdx = users.findIndex(u => u.id === assignedTo && u.role === 'client');
            if (clientIdx !== -1) {
                if (!users[clientIdx].assignedProjects) users[clientIdx].assignedProjects = [];
                if (!users[clientIdx].assignedProjects!.includes(projectId)) {
                    users[clientIdx].assignedProjects!.push(projectId);
                    saveUsers(users);
                }
            }
        }

        if (clientVisibility !== undefined) {
            projects[projectIdx].clientVisibility = clientVisibility;
        }

        saveProjects(projects);

        return NextResponse.json({ success: true, project: projects[projectIdx] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
