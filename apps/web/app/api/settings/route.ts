import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the path for our local configuration storage
const configPath = path.join(process.cwd(), 'data', 'config.json');

// Ensure the data directory exists
const ensureDataDir = () => {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
};

export async function GET() {
    try {
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            return NextResponse.json(JSON.parse(configData));
        }
        return NextResponse.json({ message: 'No configuration found' }, { status: 404 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const payload = await request.json();

        ensureDataDir();

        // Save the configuration to a local JSON file
        fs.writeFileSync(configPath, JSON.stringify(payload, null, 2), 'utf8');

        return NextResponse.json({ success: true, message: 'Configuration saved successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
