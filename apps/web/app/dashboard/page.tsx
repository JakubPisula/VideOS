"use client";

import React, { useState, useEffect, useCallback } from 'react';

interface ProjectData {
    id: string;
    clientName: string;
    projectName: string;
    briefSubmitted: boolean;
    briefSubmittedAt?: string;
    properties: Record<string, string>;
}

interface BriefField {
    notionProperty: string;
    label: string;
    type: string;
    required: boolean;
}

const STATUS_COLORS: Record<string, string> = {
    'Not Started': 'bg-gray-500/20 text-gray-300',
    'In Progress': 'bg-blue-500/20 text-blue-300',
    'In Editing Phase': 'bg-yellow-500/20 text-yellow-300',
    'Review': 'bg-purple-500/20 text-purple-300',
    'Done': 'bg-emerald-500/20 text-emerald-300',
    'Cancelled': 'bg-red-500/20 text-red-300',
};

export default function ClientDashboardPage() {
    const [projectId, setProjectId] = useState('');
    const [project, setProject] = useState<ProjectData | null>(null);
    const [briefFields, setBriefFields] = useState<BriefField[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    const doSearch = useCallback(async (id: string) => {
        if (!id.trim()) return;
        setLoading(true);
        setError('');
        setProject(null);
        setSearched(true);
        try {
            const res = await fetch(`/api/projects/${id.trim()}/brief`);
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Project not found.'); return; }
            setProject(data.project);
            setBriefFields(data.briefFields);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-load from URL query param (?projectId=PRJ-...) — safe client-side only
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('projectId');
        if (id) {
            setProjectId(id);
            doSearch(id);
        }
    }, [doSearch]);

    const handleSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        doSearch(projectId);
    }, [projectId, doSearch]);

    return (
        <div className="min-h-screen py-16 px-6">
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
                        Client Portal
                    </h1>
                    <p className="text-gray-400">Enter your Project ID to view your project status and details.</p>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-3 mb-10">
                    <input
                        type="text"
                        value={projectId}
                        onChange={e => setProjectId(e.target.value.toUpperCase())}
                        className="glass-input flex-1 px-4 py-3 rounded-xl text-sm"
                        placeholder="PRJ-123456"
                        maxLength={12}
                    />
                    <button
                        type="submit"
                        disabled={loading || !projectId.trim()}
                        className="btn-primary px-6 py-3 rounded-xl font-medium disabled:opacity-50"
                    >
                        {loading ? 'Searching…' : 'Find Project'}
                    </button>
                </form>

                {/* Error */}
                {error && (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-4">🔍</div>
                        <p className="text-red-400 font-medium">{error}</p>
                        <p className="text-gray-500 text-sm mt-2">Double-check the ID sent by your project manager.</p>
                    </div>
                )}

                {/* Project Card */}
                {project && (
                    <div className="flex flex-col gap-6">
                        {/* Header Card */}
                        <div className="glass-panel p-8 rounded-3xl">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Welcome back,</p>
                                    <h2 className="text-2xl font-bold text-white">{project.clientName}</h2>
                                    <p className="text-gray-300 mt-1">{project.projectName}</p>
                                </div>
                                <span className="font-mono text-xs text-gray-500 bg-white/5 px-3 py-1.5 rounded-full">{project.id}</span>
                            </div>

                            {project.properties.Status && (
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[project.properties.Status] || 'bg-white/10 text-gray-300'}`}>
                                    {project.properties.Status}
                                </span>
                            )}

                            {/* Brief CTA */}
                            <div className={`mt-6 p-4 rounded-2xl border ${project.briefSubmitted ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-orange-500/20 bg-orange-500/5'}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`text-sm font-medium ${project.briefSubmitted ? 'text-emerald-300' : 'text-orange-300'}`}>
                                            {project.briefSubmitted ? '✓ Brief Submitted' : '⚡ Brief Required'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {project.briefSubmitted
                                                ? `Received ${project.briefSubmittedAt ? new Date(project.briefSubmittedAt).toLocaleDateString('pl-PL') : ''}`
                                                : 'Please fill in your project details'}
                                        </p>
                                    </div>
                                    {!project.briefSubmitted && briefFields.length > 0 && (
                                        <a href={`/brief/${project.id}`} className="btn-primary px-4 py-2 rounded-xl text-sm font-medium">
                                            Fill Brief →
                                        </a>
                                    )}
                                    {project.briefSubmitted && (
                                        <a href={`/brief/${project.id}`} className="px-4 py-2 rounded-xl text-sm border border-white/10 hover:bg-white/5 transition">
                                            View / Edit →
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Project Properties */}
                        {Object.entries(project.properties).filter(([, v]) => v && v.trim()).length > 0 && (
                            <div className="glass-panel p-8 rounded-3xl">
                                <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {Object.entries(project.properties)
                                        .filter(([, val]) => val && val.trim() !== '')
                                        .map(([key, val]) => (
                                            <div key={key} className="bg-white/5 rounded-xl p-3">
                                                <p className="text-gray-400 text-xs mb-1">{key}</p>
                                                {val.startsWith('http') ? (
                                                    <a href={val} target="_blank" className="text-blue-400 hover:underline truncate block">{val}</a>
                                                ) : (
                                                    <p className="text-white font-medium truncate">{val}</p>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Frame.io link */}
                        {project.properties['Frame.io'] && (
                            <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-blue-500">
                                <h3 className="text-lg font-semibold mb-2">Review Link</h3>
                                <p className="text-gray-400 text-sm mb-4">Your video is ready for review on Frame.io.</p>
                                <a href={project.properties['Frame.io']} target="_blank"
                                    className="btn-primary px-6 py-3 rounded-xl font-medium inline-block">
                                    Open Frame.io Review →
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty state */}
                {!searched && !project && (
                    <div className="text-center py-12 text-gray-600">
                        <div className="text-4xl mb-4">📋</div>
                        <p className="text-sm">Your Project ID was sent by your project manager via email.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
