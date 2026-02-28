"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────
interface Statuses {
    firstRun: boolean;
    notionConfigured: boolean;
    frameioConfigured: boolean;
    nextcloudConfigured: boolean;
    syncInterval: number;
}

interface Project {
    id: string;
    clientName: string;
    projectName: string;
    description: string;
    status: string;
    createdAt: string;
    notionSynced: boolean;
    frameioSynced: boolean;
    notionId?: string;
    notionLastEditedTime?: string;
    properties?: Record<string, string>;
    assignedTo?: string;
}

interface CreateResult {
    success: boolean;
    message: string;
}

// ── Skeleton row ───────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="border-b border-white/5 animate-pulse">
            <td className="py-4"><div className="h-4 w-20 bg-white/10 rounded" /></td>
            <td className="py-4">
                <div className="h-4 w-28 bg-white/10 rounded mb-1" />
                <div className="h-3 w-20 bg-white/5 rounded" />
            </td>
            <td className="py-4"><div className="h-5 w-16 bg-white/10 rounded-full" /></td>
            <td className="py-4"><div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-white/10" /><div className="w-3 h-3 rounded-full bg-white/10" /></div></td>
            <td className="py-4"><div className="h-4 w-16 bg-white/5 rounded" /></td>
        </tr>
    );
}

const MAX_DEBUG_LOGS = 100;

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {

    const [statuses, setStatuses] = useState<Statuses>({
        firstRun: false,
        notionConfigured: false,
        frameioConfigured: false,
        nextcloudConfigured: false,
        syncInterval: 30,
    });
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);

    // Create modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [createResult, setCreateResult] = useState<CreateResult | null>(null);

    // Debug console
    const [isDebugMode, setIsDebugMode] = useState(false);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const [isSyncingId, setIsSyncingId] = useState<string | null>(null);

    // Ref to track mounted state (prevent state updates after unmount)
    const mountedRef = useRef(true);
    useEffect(() => { return () => { mountedRef.current = false; }; }, []);

    // ── Helpers ─────────────────────────────────────────────────────────────
    const logDebug = useCallback((msg: string) => {
        const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
        setDebugLogs(prev => [entry, ...prev].slice(0, MAX_DEBUG_LOGS));
    }, []);

    const batchLogDebug = useCallback((lines: string[]) => {
        setDebugLogs(prev => [...lines, ...prev].slice(0, MAX_DEBUG_LOGS));
    }, []);

    // ── Data loading ─────────────────────────────────────────────────────────
    const loadProjects = useCallback(() => {
        fetch('/api/projects')
            .then(res => res.json())
            .then(data => {
                if (!mountedRef.current) return;
                if (Array.isArray(data)) setProjects(data);
            })
            .catch(() => { })
            .finally(() => {
                if (mountedRef.current) setIsLoadingProjects(false);
            });
    }, []);

    const loadStatuses = useCallback(() => {
        fetch('/api/status')
            .then(res => res.json())
            .then((data: Statuses) => {
                if (!mountedRef.current) return;
                if (data.firstRun) {
                    window.location.href = '/setup';
                    return;
                }
                setStatuses(data);
            })
            .catch(() => { });
    }, []);

    const loadData = useCallback(() => {
        loadStatuses();
        loadProjects();
    }, [loadStatuses, loadProjects]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ── Background Notion sync ───────────────────────────────────────────────
    useEffect(() => {
        if (!statuses.notionConfigured || !statuses.syncInterval) return;

        const intervalId = setInterval(() => {
            // Skip if no projects or if a manual sync is in progress
            if (!mountedRef.current) return;

            const controller = new AbortController();

            fetch('/api/notion/sync', { method: 'POST', signal: controller.signal })
                .then(res => res.json())
                .then(data => {
                    if (!mountedRef.current) return;
                    if (data.logs?.length > 0) batchLogDebug(data.logs);
                    // Only refresh project list if actual changes were applied
                    if (data.message?.includes('Applied')) {
                        const n = parseInt(data.message.match(/Applied (\d+)/)?.[1] || '0');
                        if (n > 0) loadProjects();
                    }
                })
                .catch(() => { });

            // Clean up the fetch if the interval fires again before the previous completes
            return () => controller.abort();
        }, statuses.syncInterval * 1000);

        return () => clearInterval(intervalId);
    }, [statuses.notionConfigured, statuses.syncInterval, batchLogDebug, loadProjects]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleCreateProject = useCallback(async (e: React.FormEvent) => {
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
                    description: newProjectDesc,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setCreateResult({ success: true, message: data.message });
                loadProjects();
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
        } catch {
            setCreateResult({ success: false, message: 'Network error occurred' });
        } finally {
            setIsCreating(false);
        }
    }, [newClientName, newProjectName, newProjectDesc, loadProjects]);

    const handleSyncProject = useCallback(async (projectId: string) => {
        setIsSyncingId(projectId);
        logDebug(`Initiating manual sync for project ${projectId}…`);
        try {
            const res = await fetch('/api/projects/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId }),
            });
            const data = await res.json();
            if (data.logs?.length > 0) batchLogDebug(data.logs);
            if (res.ok) {
                logDebug(`Sync completed for ${projectId}. Refreshing…`);
                loadProjects();
            } else {
                logDebug(`Sync failed for ${projectId}: ${data.error}`);
            }
        } catch (err: any) {
            logDebug(`Network error during sync: ${err.message}`);
        } finally {
            setIsSyncingId(null);
        }
    }, [logDebug, batchLogDebug, loadProjects]);

    const handleVerifyNotionChanges = useCallback(async () => {
        setIsSyncingId('verify-all');
        logDebug('Running full bidirectional Notion sync…');
        try {
            const res = await fetch('/api/notion/sync', { method: 'POST' });
            const data = await res.json();
            if (data.logs?.length > 0) batchLogDebug(data.logs);
            if (res.ok) { logDebug(data.message); loadProjects(); }
            else logDebug(`Sync error: ${data.error}`);
        } catch (err: any) {
            logDebug(`Network error during sync: ${err.message}`);
        } finally {
            setIsSyncingId(null);
        }
    }, [logDebug, batchLogDebug, loadProjects]);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen p-8 md:p-16 relative">
            <header className="mb-12 flex justify-between items-center border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">Freelancer Admin Panel</h1>
                    <p className="text-gray-400 mt-2">Manage your creative projects. Database synced with Notion.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <span className="text-sm font-medium flex items-center gap-2">
                        {statuses.notionConfigured ? (
                            <><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> <span className="text-emerald-400">Notion Connected</span></>
                        ) : (
                            <><span className="w-2 h-2 rounded-full bg-red-400" /> <span className="text-red-400">Notion Unconfigured</span></>
                        )}
                    </span>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-lg border border-white/20 flex items-center justify-center font-bold text-lg">
                        AD
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main table */}
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
                                    {isSyncingId === 'verify-all' ? 'Verifying…' : 'Force Notion Sync'}
                                </button>
                                <button
                                    onClick={() => setIsDebugMode(v => !v)}
                                    className={`text-sm border px-4 py-2 rounded-lg transition ${isDebugMode ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300' : 'border-white/20 hover:bg-white/10'}`}
                                >
                                    {isDebugMode ? 'Disable Debug Console' : 'Enable Debug Console'}
                                </button>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition shadow-lg shadow-blue-500/20"
                                >
                                    + New Project
                                </button>
                            </div>
                        </div>

                        {/* Debug Console */}
                        {isDebugMode && (
                            <div className="mb-6 p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-xs max-h-48 overflow-y-auto">
                                <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                                    <h3 className="text-yellow-400">Debug Console</h3>
                                    <button onClick={() => setDebugLogs([])} className="text-gray-500 hover:text-gray-300 text-xs">Clear</button>
                                </div>
                                {debugLogs.length === 0 ? (
                                    <span className="text-gray-500">Waiting for API events…</span>
                                ) : (
                                    debugLogs.map((log, i) => <div key={i} className="text-gray-300 leading-relaxed">{log}</div>)
                                )}
                            </div>
                        )}

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-gray-400 text-sm">
                                        <th className="pb-4 font-medium">Project ID</th>
                                        <th className="pb-4 font-medium">Client & Project</th>
                                        <th className="pb-4 font-medium">Status</th>
                                        <th className="pb-4 font-medium">Sync</th>
                                        <th className="pb-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {isLoadingProjects ? (
                                        <>{[1, 2, 3].map(i => <SkeletonRow key={i} />)}</>
                                    ) : projects.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-gray-500">
                                                No projects yet.{' '}
                                                <button onClick={() => setIsCreateModalOpen(true)} className="text-blue-400 hover:underline">Create your first →</button>
                                            </td>
                                        </tr>
                                    ) : (
                                        projects.map(project => (
                                            <tr key={project.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-4 font-mono text-blue-400 text-xs">{project.id}</td>
                                                <td className="py-4">
                                                    <div className="font-medium text-white">{project.clientName}</div>
                                                    <div className="text-xs text-gray-400">{project.projectName}</div>
                                                </td>
                                                <td className="py-4">
                                                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">{project.status}</span>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex gap-2 items-center">
                                                        <span title={project.notionSynced ? 'Notion OK' : 'Notion Failed'} className={`w-3 h-3 rounded-full ${project.notionSynced ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                        <span title={project.frameioSynced ? 'Frame.io OK' : 'Frame.io Failed'} className={`w-3 h-3 rounded-full ${project.frameioSynced ? 'bg-blue-500' : 'bg-red-500'}`} />
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex gap-2">
                                                        {(!project.notionSynced || !project.frameioSynced) && (
                                                            <button
                                                                onClick={() => handleSyncProject(project.id)}
                                                                disabled={isSyncingId === project.id}
                                                                className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition disabled:opacity-50 text-xs"
                                                            >
                                                                {isSyncingId === project.id ? 'Syncing…' : 'Resync'}
                                                            </button>
                                                        )}
                                                        {project.notionId && (
                                                            <a
                                                                href={`https://notion.so/${project.notionId.replace(/-/g, '')}`}
                                                                target="_blank"
                                                                className="px-3 py-1 bg-white/5 rounded-lg hover:bg-white/10 transition text-xs"
                                                                title="Open in Notion"
                                                            >
                                                                Notion ↗
                                                            </a>
                                                        )}
                                                        <a
                                                            href={`/admin/projects/${project.id}/config`}
                                                            className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition text-xs"
                                                            title="Configure Access"
                                                        >
                                                            ⚙️ Portal Config
                                                        </a>
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

                {/* Sidebar */}
                <div className="flex flex-col gap-6">
                    <div className="glass-panel p-8 rounded-3xl">
                        <h3 className="text-lg font-semibold mb-4 text-white">System Status</h3>
                        <div className="flex flex-col gap-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Notion API</span>
                                {statuses.notionConfigured ? <span className="text-emerald-400">Online & Mapped</span> : <span className="text-red-400">Not Configured</span>}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Frame.io</span>
                                {statuses.frameioConfigured ? <span className="text-emerald-400">Authorized</span> : <span className="text-yellow-400">Unauthorized</span>}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Nextcloud</span>
                                {statuses.nextcloudConfigured ? <span className="text-emerald-400">Linked</span> : <span className="text-red-400">Not Set</span>}
                            </div>
                            <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                <span className="text-gray-400">Auto-sync</span>
                                <span className="text-gray-300 text-xs">every {statuses.syncInterval}s</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-3xl">
                        <h3 className="text-lg font-semibold mb-4 text-white">Quick Actions</h3>
                        <div className="flex flex-col gap-3">
                            <a href="/admin/clients" className="block text-left p-3 w-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-medium rounded-xl transition text-sm">
                                Manage Client Portal Access
                            </a>
                            <a href="/admin/settings" className="block text-left p-3 w-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 font-medium rounded-xl transition text-sm">
                                Configure Integrations
                            </a>
                            <a href="/setup" className="block text-left p-3 w-full bg-white/5 hover:bg-white/10 rounded-xl transition text-sm">
                                Re-run Setup Wizard
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="glass-panel max-w-lg w-full p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">New Client Project</h2>
                            <button onClick={() => { setIsCreateModalOpen(false); setCreateResult(null); }} className="text-gray-400 hover:text-white p-2 text-xl">&times;</button>
                        </div>
                        <p className="text-sm text-gray-400 mb-6">
                            Automatically provisions a Frame.io project workspace and syncs a record to your Notion database.
                        </p>
                        <form onSubmit={handleCreateProject} className="flex flex-col gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Client / Brand Name</label>
                                <input type="text" required value={newClientName} onChange={e => setNewClientName(e.target.value)}
                                    className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. Nike, TechCorp…" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                                <input type="text" required value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
                                    className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. Summer Commercial 2026" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Brief Description (optional)</label>
                                <textarea value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)}
                                    className="glass-input w-full px-4 py-3 rounded-xl text-sm min-h-[90px]" placeholder="Short summary of deliverables…" />
                            </div>
                            {createResult && (
                                <div className={`p-4 rounded-xl text-sm ${createResult.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                                    {createResult.message}
                                </div>
                            )}
                            <div className="mt-2 flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 rounded-xl hover:bg-white/5 transition text-sm">Cancel</button>
                                <button type="submit" disabled={isCreating} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                                    {isCreating ? 'Provisioning…' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
