"use client";

import React, { useState, useEffect, useCallback } from 'react';

interface UserInfo {
    userId: string;
    email: string;
    role: string;
    name: string;
}

interface ProjectData {
    id: string;
    clientName: string;
    projectName: string;
    briefSubmitted: boolean;
    briefSubmittedAt?: string;
    properties: Record<string, string>;
}

export default function ClientPortalPage() {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showNewProject, setShowNewProject] = useState(false);
    const [newProjName, setNewProjName] = useState('');
    const [creatingProj, setCreatingProj] = useState(false);

    // Check session
    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.json())
            .then(data => {
                if (!data.authenticated) {
                    window.location.href = '/login';
                    return;
                }
                if (data.user.role === 'admin') {
                    window.location.href = '/admin/dashboard';
                    return;
                }
                setUser(data.user);
            })
            .catch(() => { window.location.href = '/login'; });
    }, []);

    // Load client's projects
    const loadProjects = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/projects');
            const data = await res.json();
            if (Array.isArray(data)) {
                // Filter projects assigned to this client (by clientName match for now)
                setProjects(data);
            }
        } catch {
            setError('Could not load projects.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { if (user) loadProjects(); }, [user, loadProjects]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjName.trim() || !user) return;
        setCreatingProj(true);
        setError('');
        try {
            const res = await fetch('/api/projects/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName: user.name,
                    projectName: newProjName,
                    description: ''
                }),
            });
            if (res.ok) {
                setShowNewProject(false);
                setNewProjName('');
                loadProjects();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to create project');
            }
        } catch {
            setError('Network error creating project');
        } finally {
            setCreatingProj(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-400 animate-pulse text-lg">Loading…</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                            Client Portal
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Welcome back, <strong className="text-white">{user.name}</strong>
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowNewProject(true)} className="btn-primary text-sm px-4 py-2 rounded-lg font-medium">
                            + New Project
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <button onClick={handleLogout}
                            className="text-sm text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5">
                            Logout
                        </button>
                    </div>
                </header>

                {showNewProject && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="glass-panel p-8 rounded-3xl w-full max-w-md">
                            <h3 className="text-xl font-bold text-white mb-4">Start a New Project</h3>
                            <form onSubmit={handleCreateProject}>
                                <div className="mb-6">
                                    <label className="block text-sm text-gray-400 mb-2">Project Name</label>
                                    <input
                                        autoFocus
                                        value={newProjName}
                                        onChange={e => setNewProjName(e.target.value)}
                                        className="glass-input w-full px-4 py-3 rounded-xl"
                                        placeholder="e.g. Summer Campaign Video"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button type="button" onClick={() => setShowNewProject(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={creatingProj} className="btn-primary px-6 py-2 rounded-xl">
                                        {creatingProj ? 'Creating...' : 'Create Project'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20">{error}</p>}

                {loading ? (
                    <div className="flex flex-col gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="glass-panel rounded-2xl p-6 animate-pulse">
                                <div className="h-5 w-48 bg-white/10 rounded mb-3" />
                                <div className="h-3 w-32 bg-white/5 rounded" />
                            </div>
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <div className="text-5xl mb-4">📂</div>
                        <p className="text-lg font-medium">No projects yet</p>
                        <p className="text-sm mt-2">Your projects will appear here once assigned.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {projects.map(project => (
                            <a key={project.id} href={`/client/project/${project.id}`}
                                className="glass-panel rounded-2xl p-6 hover:border-blue-500/30 transition-all group cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition">
                                            {project.projectName}
                                        </h3>
                                        <p className="text-sm text-gray-400 mt-1">{project.clientName}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {project.properties?.Status && (
                                            <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300">
                                                {project.properties.Status}
                                            </span>
                                        )}
                                        {project.briefSubmitted ? (
                                            <span className="text-xs text-emerald-400">✓ Brief</span>
                                        ) : (
                                            <span className="text-xs text-orange-400">⚡ Brief needed</span>
                                        )}
                                        <span className="font-mono text-xs text-gray-600">{project.id}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
