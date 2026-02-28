import { NextResponse } from 'next/server';
import { findUserByEmail, verifyPassword, setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
        }

        const user = findUserByEmail(email);
        if (!user) {
            return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
            return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        await setSessionCookie({
            userId: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
