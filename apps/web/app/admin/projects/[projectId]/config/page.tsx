"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminProjectConfigPage({ params }: { params: Promise<{ projectId: string }> }) {
    const [projectId, setProjectId] = useState('');
    const [project, setProject] = useState<any>(null);
    const [clients, setClients] = useState<any[]>([]);

    const [selectedClient, setSelectedClient] = useState('');
    const [visibility, setVisibility] = useState<string[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();

    useEffect(() => {
        // Authenticate admin first
        fetch('/api/auth/me')
            .then(r => r.json())
            .then(d => {
                if (!d.authenticated || d.user.role !== 'admin') {
                    window.location.href = '/login';
                }
            })
            .catch(() => { window.location.href = '/login'; });

        params.then(({ projectId }) => {
            setProjectId(projectId);
            Promise.all([
                fetch(`/api/projects`).then(r => r.json()),
                fetch('/api/clients').then(r => r.json())
            ]).then(([projectsData, clientsData]) => {
                const proj = projectsData.find((p: any) => p.id === projectId);
                setProject(proj);
                if (proj) {
                    setSelectedClient(proj.assignedTo || '');
                    setVisibility(proj.clientVisibility || Object.keys(proj.properties || {}));
                }
                if (clientsData.clients) setClients(clientsData.clients);
                setLoading(false);
            });
        });
    }, [params]);

    const handleToggleField = (field: string) => {
        if (visibility.includes(field)) {
            setVisibility(visibility.filter(f => f !== field));
        } else {
            setVisibility([...visibility, field]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            const res = await fetch(`/api/projects/${projectId}/config`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignedTo: selectedClient, clientVisibility: visibility })
            });
            if (res.ok) {
                setMessage('Configuration saved successfully.');
                setTimeout(() => router.push('/admin/dashboard'), 1500);
            } else {
                const data = await res.json();
                setMessage(`Error: ${data.error}`);
            }
        } catch {
            setMessage('Network error.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-gray-500 animate-pulse">Loading...</div>;
    if (!project) return <div className="p-8 text-red-500">Project not found.</div>;

    const availableFields = Object.keys(project.properties || {});

    return (
        <div className="min-h-screen p-8 md:p-16 relative">
            <header className="mb-12 border-b border-white/10 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Link href="/admin/dashboard" className="text-gray-400 hover:text-white transition">← Admin Panel</Link>
                    <span className="text-gray-600">/</span>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Project Configuration</h1>
                </div>
                <p className="text-gray-400">Configure client access and data visibility for <strong className="text-white">{project.projectName}</strong>.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                {/* Assignment */}
                <div className="glass-panel p-8 rounded-3xl">
                    <h2 className="text-lg font-semibold mb-4 text-white">Assign to Client Portal</h2>
                    <p className="text-sm text-gray-400 mb-6">Select which client can see this project when they log in.</p>

                    <select
                        value={selectedClient}
                        onChange={e => setSelectedClient(e.target.value)}
                        className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                    >
                        <option value="">-- No Client Assigned --</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                        ))}
                    </select>

                    {!selectedClient && (
                        <p className="text-xs text-orange-400 mt-3 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse inline-block" />
                            This project is currently hidden from all clients.
                        </p>
                    )}
                </div>

                {/* Visibility */}
                <div className="glass-panel p-8 rounded-3xl">
                    <h2 className="text-lg font-semibold mb-4 text-white">Field Visibility</h2>
                    <p className="text-sm text-gray-400 mb-6">Select which Notion properties the client can see in their portal.</p>

                    <div className="flex flex-col gap-3">
                        {availableFields.map(field => (
                            <label key={field} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${visibility.includes(field) ? 'bg-blue-500 border-blue-500' : 'border-gray-500 group-hover:border-gray-400'
                                    }`}>
                                    {visibility.includes(field) && <span className="text-white text-xs font-bold">✓</span>}
                                </div>
                                <span className={`text-sm ${visibility.includes(field) ? 'text-white' : 'text-gray-400'}`}>
                                    {field}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary px-8 py-3 rounded-xl font-medium disabled:opacity-50"
                >
                    {saving ? 'Saving…' : 'Save Configuration'}
                </button>
                {message && (
                    <span className={`text-sm ${message.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                        {message}
                    </span>
                )}
            </div>
        </div>
    );
}
