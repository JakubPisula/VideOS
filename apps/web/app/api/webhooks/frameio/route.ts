import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const payload = await request.json();

        // --- 1. Validate Webhook Origin (Basic example) ---
        // Frame.io sends specific headers you should ideally verify with a webhook secret.
        // const signature = request.headers.get('x-frameio-signature');

        console.log('--- FRAME.IO WEBHOOK RECEIVED ---');
        console.log('Event Type:', payload.type);
        console.log('Resource ID:', payload.resource.id);

        // --- 2. Handle specific event types ---
        if (payload.type === 'comment.created') {
            console.log('A new comment was added!');
            // Here: Logic to fetch comment details from Frame.io using API v4
            // And push update to Notion
        } else if (payload.type === 'asset.updated') {
            console.log('An asset was updated/approved!');
            // Here: Logic to update "Status" property in Notion Database
        }

        return NextResponse.json({ received: true, status: 'acknowledged' });
    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
