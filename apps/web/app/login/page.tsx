"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('admin@admin.com');
    const [password, setPassword] = useState('admin');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (email === 'admin@admin.com' || email === 'admin') {
            window.location.href = '/admin/dashboard';
        } else {
            window.location.href = '/dashboard';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <div className="glass-panel p-10 rounded-3xl w-full max-w-md">
                <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
                <p className="text-gray-400 mb-8 text-sm">Sign in to your client portal to review projects.</p>

                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl"
                            placeholder="client@studio.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full py-3 rounded-xl font-medium mt-4">
                        Sign In
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-gray-400">
                    Don't have an account? <Link href="/register" className="text-blue-400 hover:text-blue-300">Start a project</Link>
                </p>
            </div>
        </div>
    );
}
