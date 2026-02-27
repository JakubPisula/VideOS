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

export async function GET() {
    try {
        const config = getConfig();

        return NextResponse.json({
            notionConfigured: !!(config && config.notionToken && config.selectedDatabase),
            frameioConfigured: !!(config && config.frameioToken),
            nextcloudConfigured: !!(config && config.nextcloudUrl),
            syncInterval: config && config.syncInterval ? Number(config.syncInterval) : 30
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
