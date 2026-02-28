import { NextResponse } from 'next/server';
import { getSession, type UserRole } from './auth';

/**
 * Auth guard for API routes. Checks session cookie, optionally restricts by role.
 * Usage:
 *   const session = await requireAuth(request, ['admin']);
 *   if (session instanceof NextResponse) return session; // 401/403
 *   // session is SessionPayload
 */
export async function requireAuth(
    _request: Request,
    allowedRoles?: UserRole[]
) {
    const session = await getSession();

    if (!session) {
        return NextResponse.json(
            { error: 'Not authenticated. Please log in.' },
            { status: 401 }
        );
    }

    if (allowedRoles && !allowedRoles.includes(session.role)) {
        return NextResponse.json(
            { error: 'Insufficient permissions.' },
            { status: 403 }
        );
    }

    return session;
}
