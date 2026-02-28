import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { fullSync } from '@/lib/notion-sync';

// Trigger full bidirectional sync with Notion
export async function POST(request: Request) {
    try {
        // Only admins can trigger manual sync (or a webhook with a secret)
        const authRes = await requireAuth(request, ['admin']);
        if (authRes instanceof NextResponse) {
            // Check if it's an automated call with a secret (optional, for cron jobs)
            const authHeader = request.headers.get('authorization');
            if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'videos-cron-secret'}`) {
                return authRes;
            }
        }

        const { logs, pulled, pushed } = await fullSync();

        return NextResponse.json({
            success: true,
            message: `Sync complete. Pulled: ${pulled}, Pushed: ${pushed}`,
            logs,
            stats: { pulled, pushed }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
