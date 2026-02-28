import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

// ── Constants ──────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'videos-secret-change-in-production-2026';
const COOKIE_NAME = 'videos_session';
const USERS_PATH = path.join(process.cwd(), 'data', 'users.json');

// ── Types ──────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'client';

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    name: string;
    assignedProjects?: string[];
    storageFolder?: string;
    createdAt: string;
}

export interface SessionPayload {
    userId: string;
    email: string;
    role: UserRole;
    name: string;
}

// ── Password helpers (native scrypt — fast, no native addon) ───────────────
export async function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.scrypt(password, salt, 64, (err, key) => {
            if (err) reject(err);
            resolve(`${salt}:${key.toString('hex')}`);
        });
    });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const [salt, key] = hash.split(':');
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
        });
    });
}

// ── JWT helpers ────────────────────────────────────────────────────────────
export function createToken(payload: SessionPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): SessionPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as SessionPayload;
    } catch {
        return null;
    }
}

// ── Cookie helpers ─────────────────────────────────────────────────────────
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
    const token = createToken(payload);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });
}

export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
}

// ── User DB helpers ────────────────────────────────────────────────────────
function ensureDataDir() {
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function getUsers(): User[] {
    ensureDataDir();
    if (!fs.existsSync(USERS_PATH)) {
        fs.writeFileSync(USERS_PATH, '[]', 'utf8');
        return [];
    }
    try {
        return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
    } catch {
        return [];
    }
}

export function saveUsers(users: User[]): void {
    ensureDataDir();
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf8');
}

export function findUserByEmail(email: string): User | undefined {
    return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): User | undefined {
    return getUsers().find(u => u.id === id);
}

export function generateUserId(role: UserRole): string {
    const prefix = role === 'admin' ? 'adm' : 'cli';
    return `usr_${prefix}_${Date.now().toString(36)}`;
}
