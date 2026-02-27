import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // First try API V4
        let response = await fetch('https://api.frame.io/v4/accounts', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // If V4 fails with Unauthorized, fallback to trying V2 (for older or differently scoped fio-u- tokens)
        if (!response.ok) {
            response = await fetch('https://api.frame.io/v2/accounts', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        }

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Frame.io OAuth Error Details:', errorData);
            return NextResponse.json({ error: 'Failed to authenticate with Frame.io', details: errorData }, { status: response.status });
        }

        const data = await response.json();

        return NextResponse.json({ user: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
