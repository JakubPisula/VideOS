import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/middleware';

export async function POST(request: Request) {
    try {
        const sessionRes = await requireAuth(request);
        if (sessionRes instanceof NextResponse) return sessionRes;
        const session = sessionRes;

        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }

        // Make sure the client's dedicated folder exists
        const { getUsers } = await import('@/lib/auth');
        const user = getUsers().find(u => u.id === session.userId);
        if (!user || user.role !== 'client') {
            return NextResponse.json({ error: 'Invalid user session' }, { status: 403 });
        }

        const projectDir = formData.get('projectId') as string || 'default';
        const storageFolder = user.storageFolder || `/uploads/${user.id}`;
        const uploadPath = path.join(process.cwd(), 'public', storageFolder, projectDir);

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        const uploadedNames = [];

        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            // Sanitize filename
            const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = path.join(uploadPath, `${Date.now()}_${cleanName}`);

            fs.writeFileSync(filePath, buffer);
            uploadedNames.push(cleanName);
        }

        return NextResponse.json({
            success: true,
            message: `Successfully uploaded ${uploadedNames.length} files.`,
            files: uploadedNames
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
