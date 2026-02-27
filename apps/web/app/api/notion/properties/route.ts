import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { token, databaseId } = await request.json();

        if (!token || !databaseId) {
            return NextResponse.json({ error: 'Token and databaseId are required' }, { status: 400 });
        }

        const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Notion-Version': '2022-06-28'
            }
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch database properties' }, { status: response.status });
        }

        const data = await response.json();
        const properties = Object.keys(data.properties);

        return NextResponse.json({ properties });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
