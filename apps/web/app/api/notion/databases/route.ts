import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        const response = await fetch('https://api.notion.com/v1/search', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filter: { value: 'database', property: 'object' }
            })
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch from Notion' }, { status: response.status });
        }

        const data = await response.json();
        const databases = data.results.map((db: any) => ({
            id: db.id,
            name: db.title && db.title.length > 0 ? db.title[0].plain_text : 'Untitled'
        }));

        return NextResponse.json({ databases });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
