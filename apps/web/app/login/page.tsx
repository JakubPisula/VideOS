"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Login failed.');
                return;
            }

            // Redirect based on role
            if (data.user.role === 'admin') {
                window.location.href = '/admin/dashboard';
            } else {
                window.location.href = '/client';
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <div className="glass-panel p-10 rounded-3xl w-full max-w-md">
                <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
                <p className="text-gray-400 mb-8 text-sm">Sign in to your portal.</p>

                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                            placeholder="client@studio.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-3 rounded-xl font-medium mt-2 disabled:opacity-50"
                    >
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-gray-400">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-blue-400 hover:text-blue-300">Start a project</Link>
                </p>
            </div>
        </div>
    );
}
