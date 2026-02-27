"use client";

import React, { useState, useEffect } from 'react';

export default function AdminDashboardPage() {
    const [statuses, setStatuses] = useState({
        notionConfigured: false,
        frameioConfigured: false,
        nextcloudConfigured: false,
        syncInterval: 30
    });

    // Local projects state
    const [projects, setProjects] = useState<any[]>([]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [createResult, setCreateResult] = useState<{ success?: boolean, message?: string } | null>(null);

    // Debug Console States
    const [isDebugMode, setIsDebugMode] = useState(false);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const [isSyncingId, setIsSyncingId] = useState<string | null>(null);

    const logDebug = (msg: string) => {
        setDebugLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    const loadData = () => {
        // Fetch statuses
        fetch('/api/status')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) setStatuses(data);
            })
            .catch(err => console.error("Could not fetch statuses", err));

        // Fetch local projects
        fetch('/api/projects')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setProjects(data);
            })
            .catch(err => console.error("Could not fetch projects", err));
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!statuses.notionConfigured || !statuses.syncInterval) return;

        const intervalId = setInterval(async () => {
            try {
                const res = await fetch('/api/notion/verify-changes', { method: 'POST' });
                const data = await res.json();

                if (data.logs && Array.isArray(data.logs)) {
                    data.logs.forEach((log: string) => setDebugLogs(prev => [log, ...prev]));
                }

                if (res.ok && data.message && data.message.includes('Applied')) {
                    const match = data.message.match(/Applied (\d+)/);
                    if (match && parseInt(match[1]) > 0) {
                        // Refresh data if something was applied
                        fetch('/api/projects')
                            .then(r => r.json())
                            .then(d => { if (Array.isArray(d)) setProjects(d); });
                    }
                }
            } catch (err) {
                // Ignore background task errors
            }
        }, statuses.syncInterval * 1000);

        return () => clearInterval(intervalId);
    }, [statuses.notionConfigured, statuses.syncInterval]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setCreateResult(null);

        try {
            const res = await fetch('/api/projects/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName: newClientName,
                    projectName: newProjectName,
                    description: newProjectDesc
                })
            });
            const data = await res.json();

            if (res.ok) {
                setCreateResult({ success: true, message: data.message });
                loadData(); // Refresh the table
                setTimeout(() => {
                    setIsCreateModalOpen(false);
                    setCreateResult(null);
                    setNewClientName('');
                    setNewProjectName('');
                    setNewProjectDesc('');
                }, 2000);
            } else {
                setCreateResult({ success: false, message: data.error || 'Failed to create project' });
            }
        } catch (error: any) {
            setCreateResult({ success: false, message: 'Network error occurred' });
        } finally {
            setIsCreating(false);
        }
    };

    const handleSyncProject = async (projectId: string) => {
        setIsSyncingId(projectId);
        logDebug(`Initiating manual sync for project ${projectId}...`);

        try {
            const res = await fetch('/api/projects/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            });

            const data = await res.json();

            if (data.logs && Array.isArray(data.logs)) {
                data.logs.forEach((log: string) => setDebugLogs(prev => [log, ...prev]));
            }

            if (res.ok) {
                logDebug(`Sync completed for ${projectId}. Refreshing data...`);
                loadData();
            } else {
                logDebug(`Sync failed for ${projectId}: ${data.error}`);
            }
        } catch (error: any) {
            logDebug(`Network error during sync: ${error.message}`);
        } finally {
            setIsSyncingId(null);
        }
    };

    const handleVerifyNotionChanges = async () => {
        setIsSyncingId('verify-all');
        logDebug('Verifying all projects for remote Notion changes...');

        try {
            const res = await fetch('/api/notion/verify-changes', { method: 'POST' });
            const data = await res.json();

            if (data.logs && Array.isArray(data.logs)) {
                data.logs.forEach((log: string) => setDebugLogs(prev => [log, ...prev]));
            }

            if (res.ok) {
                logDebug(data.message);
                loadData();
            } else {
                logDebug(`Verification error: ${data.error}`);
            }
        } catch (error: any) {
            logDebug(`Network error during verification: ${error.message}`);
        } finally {
            setIsSyncingId(null);
        }
    };

    return (
        <div className="min-h-screen p-8 md:p-16 relative">
            <header className="mb-12 flex justify-between items-center border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">Freelancer Admin Panel</h1>
                    <p className="text-gray-400 mt-2">Manage your creative projects. Database synced with Notion.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <span className="text-sm text-emerald-400 font-medium flex items-center gap-2">
                        {statuses.notionConfigured ? (
                            <><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Notion Connected</>
                        ) : (
                            <><span className="w-2 h-2 rounded-full bg-red-400"></span> Notion Unconfigured</>
                        )}
                    </span>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-lg border border-white/20 flex items-center justify-center font-bold text-lg">
                        AD
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 flex flex-col gap-8">
                    <div className="glass-panel p-8 rounded-3xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">Recent Client Projects</h2>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleVerifyNotionChanges}
                                    disabled={isSyncingId === 'verify-all'}
                                    className="text-sm border border-white/20 px-4 py-2 rounded-lg hover:bg-white/10 transition disabled:opacity-50"
                                >
                                    {isSyncingId === 'verify-all' ? 'Verifying...' : 'Force Notion Sync'}
                                </button>
                                <button
                                    onClick={() => setIsDebugMode(!isDebugMode)}
                                    className={`text-sm border px-4 py-2 rounded-lg transition ${isDebugMode ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300' : 'border-white/20 hover:bg-white/10'}`}
                                >
                                    {isDebugMode ? 'Disable Debug Logs' : 'Enable API Debug Console'}
                                </button>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition shadow-lg shadow-blue-500/20"
                                >
                                    + New Project
                                </button>
                            </div>
                        </div>

                        {isDebugMode && (
                            <div className="mb-6 p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-xs max-h-48 overflow-y-auto">
                                <h3 className="text-yellow-400 mb-2 border-b border-white/5 pb-2">Debug Console Output:</h3>
                                <div className="flex flex-col gap-1">
                                    {debugLogs.length === 0 ? (
                                        <span className="text-gray-500">Waiting for API events...</span>
                                    ) : (
                                        debugLogs.map((log, i) => (
                                            <div key={i} className="text-gray-300">{log}</div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-gray-400 text-sm">
                                        <th className="pb-4 font-medium">Project ID</th>
                                        <th className="pb-4 font-medium">Client & Project</th>
                                        <th className="pb-4 font-medium">Status</th>
                                        <th className="pb-4 font-medium">Sync Status</th>
                                        <th className="pb-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {projects.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-500">No projects created yet. Click "+ New Project" to start.</td>
                                        </tr>
                                    ) : (
                                        projects.map(project => (
                                            <tr key={project.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                <td className="py-4 font-mono text-blue-400">{project.id}</td>
                                                <td className="py-4">
                                                    <div className="font-medium text-white">{project.clientName}</div>
                                                    <div className="text-xs text-gray-400">{project.projectName}</div>
                                                </td>
                                                <td className="py-4"><span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">{project.status}</span></td>
                                                <td className="py-4 flex gap-2 items-center h-full pt-6">
                                                    {project.notionSynced ?
                                                        <span title="Notion Success" className="w-3 h-3 rounded-full bg-emerald-500"></span> :
                                                        <span title="Notion Failed" className="w-3 h-3 rounded-full bg-red-500"></span>
                                                    }
                                                    {project.frameioSynced ?
                                                        <span title="Frame.io Success" className="w-3 h-3 rounded-full bg-blue-500"></span> :
                                                        <span title="Frame.io Failed" className="w-3 h-3 rounded-full bg-red-500"></span>
                                                    }
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex gap-2">
                                                        {(!project.notionSynced || !project.frameioSynced) && (
                                                            <button
                                                                onClick={() => handleSyncProject(project.id)}
                                                                disabled={isSyncingId === project.id}
                                                                className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition disabled:opacity-50"
                                                                title="Force Resync"
                                                            >
                                                                {isSyncingId === project.id ? 'Syncing...' : 'Resync API'}
                                                            </button>
                                                        )}
                                                        <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition" title="Open Notion Record">Notion</a>
                                                        <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-400 transition" title="Open Cloud Storage">Files</a>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="glass-panel p-8 rounded-3xl">
                        <h3 className="text-lg font-semibold mb-4 text-white">System Status</h3>
                        <div className="flex flex-col gap-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Notion API</span>
                                {statuses.notionConfigured ? <span className="text-emerald-400">Online & Mapped</span> : <span className="text-red-400">Missing Config</span>}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Frame.io</span>
                                {statuses.frameioConfigured ? <span className="text-emerald-400">Authorized</span> : <span className="text-yellow-400">Unauthorized</span>}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Nextcloud Storage</span>
                                {statuses.nextcloudConfigured ? <span className="text-emerald-400">Linked</span> : <span className="text-red-400">Missing URL</span>}
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-3xl">
                        <h3 className="text-lg font-semibold mb-4 text-white">Quick Actions</h3>
                        <div className="flex flex-col gap-3">
                            <a href="/admin/settings" className="block text-left p-3 w-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 font-medium rounded-xl transition text-sm">
                                Configure Integrations
                            </a>
                            <button className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-xl transition text-sm">Generate New Client Portal Link</button>
                            <button className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-xl transition text-sm">Review Time Tracking Logs</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="glass-panel max-w-lg w-full p-8 rounded-3xl shadow-2xl scale-100 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">New Client Project</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white p-2 text-xl">&times;</button>
                        </div>

                        <p className="text-sm text-gray-400 mb-6">
                            This will automatically provision a new Frame.io project workspace and synchronize a matching record into your mapped Notion Database.
                        </p>

                        <form onSubmit={handleCreateProject} className="flex flex-col gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Client / Brand Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newClientName}
                                    onChange={(e) => setNewClientName(e.target.value)}
                                    className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                                    placeholder="e.g. Nike, TechCorp..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                                    placeholder="e.g. Summer Commercial 2026"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Brief Description (Optional)</label>
                                <textarea
                                    value={newProjectDesc}
                                    onChange={(e) => setNewProjectDesc(e.target.value)}
                                    className="glass-input w-full px-4 py-3 rounded-xl text-sm min-h-[100px]"
                                    placeholder="Short summary of deliverables..."
                                ></textarea>
                            </div>

                            {createResult && (
                                <div className={`p-4 rounded-xl text-sm ${createResult.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                                    {createResult.message}
                                </div>
                            )}

                            <div className="mt-4 flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 rounded-xl hover:bg-white/5 transition text-sm">Cancel</button>
                                <button type="submit" disabled={isCreating} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                                    {isCreating ? 'Provisioning...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
