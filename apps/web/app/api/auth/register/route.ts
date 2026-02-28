import { NextResponse } from 'next/server';
import {
    hashPassword, findUserByEmail, getUsers, saveUsers,
    generateUserId, setSessionCookie, type UserRole
} from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { email, password, name, role } = await request.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Email, password and name are required.' }, { status: 400 });
        }

        if (password.length < 4) {
            return NextResponse.json({ error: 'Password must be at least 4 characters.' }, { status: 400 });
        }

        // Check for duplicate email
        if (findUserByEmail(email)) {
            return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
        }

        // Default role is 'client' — only existing admins can create admin accounts
        const userRole: UserRole = role === 'admin' ? 'admin' : 'client';
        const passwordHash = await hashPassword(password);
        const userId = generateUserId(userRole);

        const newUser = {
            id: userId,
            email: email.toLowerCase().trim(),
            passwordHash,
            role: userRole,
            name: name.trim(),
            assignedProjects: [],
            storageFolder: `/uploads/${userId}`,
            createdAt: new Date().toISOString(),
        };

        const users = getUsers();
        users.push(newUser);
        saveUsers(users);

        // Auto-login after registration
        await setSessionCookie({
            userId: newUser.id,
            email: newUser.email,
            role: newUser.role,
            name: newUser.name,
        });

        return NextResponse.json({
            success: true,
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                name: newUser.name,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
