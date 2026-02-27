import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET /api/brief-config
// Returns the publicly visible brief field configuration (for /register and /brief/* pages)
export async function GET() {
    try {
        const configPath = path.join(process.cwd(), 'data', 'config.json');
        if (!fs.existsSync(configPath)) {
            return NextResponse.json({ briefFields: [], configured: false });
        }
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return NextResponse.json({
            configured: true,
            briefFields: config.briefFields || [],
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
