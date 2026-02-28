"use client";

import React, { useState, useEffect } from 'react';
import FileUploadArea from '@/components/FileUploadArea';
import ClientCommentsPanel from '@/components/ClientCommentsPanel';

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

export default function ClientProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const [projectId, setProjectId] = useState('');
    const [project, setProject] = useState<ProjectData | null>(null);
    const [briefFields, setBriefFields] = useState<BriefField[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Check auth
        fetch('/api/auth/me').then(r => r.json()).then(d => {
            if (!d.authenticated) { window.location.href = '/login'; return; }
        });

        // Unwrap params
        params.then(({ id }) => {
            setProjectId(id);
            fetch(`/api/projects/${id}/brief`)
                .then(r => r.json())
                .then(data => {
                    if (data.error) { setError(data.error); return; }
                    setProject(data.project);
                    setBriefFields(data.briefFields);
                })
                .catch(() => setError('Could not load project.'))
                .finally(() => setLoading(false));
        });
    }, [params]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-400 animate-pulse text-lg">Loading project…</div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="text-red-400 font-medium">{error || 'Project not found'}</p>
                    <a href="/client" className="text-blue-400 hover:underline text-sm mt-4 inline-block">← Back to portal</a>
                </div>
            </div>
        );
    }

    const filledProps = Object.entries(project.properties).filter(([, v]) => v && v.trim());
    const frameioUrl = project.properties['Frame.io'];

    return (
        <div className="min-h-screen py-12 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Back link */}
                <a href="/client" className="text-sm text-gray-400 hover:text-white transition mb-6 inline-block">← Back to portal</a>

                {/* Header */}
                <div className="glass-panel p-8 rounded-3xl mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white">{project.projectName}</h1>
                            <p className="text-gray-400 mt-1">{project.clientName}</p>
                        </div>
                        <span className="font-mono text-xs text-gray-500 bg-white/5 px-3 py-1.5 rounded-full">{project.id}</span>
                    </div>

                    {project.properties.Status && (
                        <span className="inline-block mt-4 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                            {project.properties.Status}
                        </span>
                    )}

                    {/* Brief status */}
                    <div className={`mt-6 p-4 rounded-2xl border ${project.briefSubmitted ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-orange-500/20 bg-orange-500/5'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${project.briefSubmitted ? 'text-emerald-300' : 'text-orange-300'}`}>
                                    {project.briefSubmitted ? '✓ Brief Submitted' : '⚡ Brief Required'}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {project.briefSubmitted
                                        ? `Received ${project.briefSubmittedAt ? new Date(project.briefSubmittedAt).toLocaleDateString('pl-PL') : ''}`
                                        : 'Fill in your project details to get started'}
                                </p>
                            </div>
                            {briefFields.length > 0 && (
                                <a href={`/brief/${project.id}`}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium ${project.briefSubmitted ? 'border border-white/10 hover:bg-white/5' : 'btn-primary'} transition`}>
                                    {project.briefSubmitted ? 'View / Edit →' : 'Fill Brief →'}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Workspace Grid (Frame.io + Comments) */}
                <div className={`grid gap-6 mb-6 ${frameioUrl ? 'lg:grid-cols-[2fr_1fr]' : 'grid-cols-1'}`}>

                    {/* Left Column: Frame.io Embed or Properties */}
                    <div className="flex flex-col gap-6">
                        {frameioUrl && (
                            <div className="glass-panel p-6 rounded-3xl border-l-4 border-l-blue-500 flex-1">
                                <h3 className="text-lg font-semibold mb-2">Frame.io Review</h3>
                                <div className="aspect-video bg-black/60 rounded-xl overflow-hidden border border-white/5 mb-3">
                                    <iframe
                                        src={frameioUrl}
                                        className="w-full h-full"
                                        allow="fullscreen"
                                        title="Frame.io Review"
                                    />
                                </div>
                                <a href={frameioUrl} target="_blank" className="text-blue-400 hover:underline text-sm inline-block">
                                    Open entirely in Frame.io ↗
                                </a>
                            </div>
                        )}

                        {filledProps.length > 0 && (
                            <div className="glass-panel p-6 rounded-3xl">
                                <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {filledProps.map(([key, val]) => (
                                        <div key={key} className="bg-white/5 rounded-xl p-3">
                                            <p className="text-gray-400 text-xs mb-1">{key}</p>
                                            {String(val).startsWith('http') ? (
                                                <a href={val as string} target="_blank" className="text-blue-400 hover:underline truncate block">{val}</a>
                                            ) : (
                                                <p className="text-white font-medium truncate">{val}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Chat/Comments overlay */}
                    <div className="h-[600px] lg:h-auto overflow-hidden">
                        <ClientCommentsPanel projectId={projectId} />
                    </div>

                </div>

                {/* File Upload full width */}
                <div className="glass-panel p-8 rounded-3xl">
                    <FileUploadArea projectId={projectId} />
                </div>
            </div>
        </div>
    );
}
