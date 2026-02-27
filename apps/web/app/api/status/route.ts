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

        if (!config) {
            return NextResponse.json({
                firstRun: true,
                notionConfigured: false,
                frameioConfigured: false,
                nextcloudConfigured: false,
                syncInterval: 30
            });
        }

        return NextResponse.json({
            firstRun: false,
            notionConfigured: !!(config.notionToken && config.selectedDatabase),
            frameioConfigured: !!(config.frameioToken),
            nextcloudConfigured: !!(config.nextcloudUrl),
            syncInterval: config.syncInterval ? Number(config.syncInterval) : 30
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
