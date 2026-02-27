"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        brief: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate API call to Notion
        setTimeout(() => {
            router.push('/dashboard');
        }, 1000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 py-20">
            <div className="glass-panel p-10 rounded-3xl w-full max-w-2xl relative overflow-hidden">
                <h2 className="text-4xl font-extrabold mb-4 pb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Start Your Project</h2>
                <p className="text-gray-400 mb-8 max-w-lg">Tell us about your creative vision. Submitting this brief automatically creates your dedicated client space.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="glass-input w-full px-4 py-3 rounded-xl"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="glass-input w-full px-4 py-3 rounded-xl"
                                placeholder="john@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Company (Optional)</label>
                        <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            className="glass-input w-full px-4 py-3 rounded-xl"
                            placeholder="Creative Agency"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Project Brief</label>
                        <textarea
                            value={formData.brief}
                            onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                            className="glass-input w-full px-4 py-3 rounded-xl min-h-32"
                            placeholder="Describe what you're looking for, constraints, visual style, etc..."
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full py-4 rounded-xl font-medium mt-4 text-lg">
                        Submit Brief & Create Account
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-gray-400">
                    Already a client? <Link href="/login" className="text-blue-400 hover:text-blue-300">Sign in to portal</Link>
                </p>
            </div>
        </div>
    );
}
