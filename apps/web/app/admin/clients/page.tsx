"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Client {
    id: string;
    email: string;
    name: string;
    assignedProjects: string[];
    storageFolder?: string;
    createdAt: string;
}

export default function AdminClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

    const loadClients = useCallback(async () => {
        try {
            const res = await fetch('/api/clients');
            const data = await res.json();
            if (res.ok && data.clients) {
                setClients(data.clients);
            } else {
                setError(data.error || 'Failed to load clients');
            }
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Authenticate admin first
        fetch('/api/auth/me')
            .then(r => r.json())
            .then(d => {
                if (!d.authenticated || d.user.role !== 'admin') {
                    window.location.href = '/login';
                } else {
                    loadClients();
                }
            })
            .catch(() => { window.location.href = '/login'; });
    }, [loadClients]);

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveResult(null);

        try {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail, name: newName, password: newPassword }),
            });
            const data = await res.json();

            if (res.ok) {
                setSaveResult({ success: true, message: 'Client account created!' });
                loadClients();
                setTimeout(() => {
                    setIsModalOpen(false);
                    setNewEmail(''); setNewName(''); setNewPassword('');
                    setSaveResult(null);
                }, 1500);
            } else {
                setSaveResult({ success: false, message: data.error });
            }
        } catch {
            setSaveResult({ success: false, message: 'Network error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen p-8 md:p-16 relative">
            <header className="mb-12 flex justify-between items-center border-b border-white/10 pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/admin/dashboard" className="text-gray-400 hover:text-white transition">← Admin Panel</Link>
                        <span className="text-gray-600">/</span>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Client Manager</h1>
                    </div>
                    <p className="text-gray-400">Manage client portal access and accounts.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-sm bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-5 py-2.5 rounded-lg hover:from-blue-600 hover:to-emerald-600 transition shadow-lg shadow-blue-500/20 font-medium"
                >
                    + Create Client Account
                </button>
            </header>

            <div className="glass-panel p-8 rounded-3xl">
                {error && <p className="text-red-400 mb-6">{error}</p>}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400 text-sm">
                                <th className="pb-4 font-medium">Client / Name</th>
                                <th className="pb-4 font-medium">Email</th>
                                <th className="pb-4 font-medium">Assigned Projects</th>
                                <th className="pb-4 font-medium">Joined</th>
                                <th className="pb-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                <tr><td colSpan={5} className="py-8 text-center text-gray-500 animate-pulse">Loading clients…</td></tr>
                            ) : clients.length === 0 ? (
                                <tr><td colSpan={5} className="py-12 text-center text-gray-500">No client accounts yet.</td></tr>
                            ) : (
                                clients.map(client => (
                                    <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-4">
                                            <div className="font-medium text-white">{client.name}</div>
                                            <div className="text-xs text-gray-500 font-mono mt-0.5">{client.id}</div>
                                        </td>
                                        <td className="py-4 text-gray-300">{client.email}</td>
                                        <td className="py-4">
                                            <div className="flex gap-1 flex-wrap">
                                                {client.assignedProjects.length > 0 ? (
                                                    client.assignedProjects.map(p => (
                                                        <span key={p} className="text-xs px-2 py-1 bg-white/10 rounded-md text-gray-300">{p}</span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-500 text-xs italic">None</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 text-gray-400">{new Date(client.createdAt).toLocaleDateString()}</td>
                                        <td className="py-4">
                                            <button className="text-xs border border-white/20 px-3 py-1.5 rounded-lg hover:bg-white/10 transition text-gray-300">
                                                Edit Access
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Client Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="glass-panel max-w-md w-full p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">New Client Account</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-2 text-xl">&times;</button>
                        </div>
                        <form onSubmit={handleCreateClient} className="flex flex-col gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Company / Name</label>
                                <input type="text" required value={newName} onChange={e => setNewName(e.target.value)}
                                    className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="Nike, Jan Kowalski…" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
                                    className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="client@company.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Temporary Password</label>
                                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={4}
                                    className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="••••••••" />
                            </div>

                            {saveResult && (
                                <div className={`p-4 rounded-xl text-sm ${saveResult.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                    {saveResult.message}
                                </div>
                            )}

                            <div className="mt-2 flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl hover:bg-white/5 transition text-sm">Cancel</button>
                                <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                                    {saving ? 'Saving…' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
