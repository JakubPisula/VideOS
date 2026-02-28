import { NextResponse } from 'next/server';
import { getUsers, saveUsers, hashPassword, generateUserId, findUserByEmail, UserRole } from '@/lib/auth';
import { requireAuth } from '@/lib/middleware';

// Get list of all clients (admins only see list)
export async function GET(request: Request) {
    const authRes = await requireAuth(request, ['admin']);
    if (authRes instanceof NextResponse) return authRes;

    const users = getUsers();
    const clients = users.filter((u: any) => u.role === 'client').map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        assignedProjects: u.assignedProjects || [],
        storageFolder: u.storageFolder,
        createdAt: u.createdAt,
    }));

    return NextResponse.json({ clients });
}

// Create a new client from admin dashboard
export async function POST(request: Request) {
    const authRes = await requireAuth(request, ['admin']);
    if (authRes instanceof NextResponse) return authRes;

    try {
        const { email, name, password } = await request.json();

        if (!email || !name || !password) {
            return NextResponse.json({ error: 'Email, name and password are required' }, { status: 400 });
        }

        if (findUserByEmail(email)) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
        }

        const passwordHash = await hashPassword(password);
        const userId = generateUserId('client');

        const newUser = {
            id: userId,
            email: email.toLowerCase().trim(),
            passwordHash,
            role: 'client' as UserRole,
            name: name.trim(),
            assignedProjects: [],
            storageFolder: `/uploads/${userId}`,
            createdAt: new Date().toISOString(),
        };

        const users = getUsers();
        users.push(newUser);
        saveUsers(users);

        return NextResponse.json({ success: true, client: newUser });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
