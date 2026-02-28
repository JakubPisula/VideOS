"use client";

import React, { useState, useEffect, useCallback } from 'react';

interface BriefField {
    notionProperty: string;
    label: string;
    type: string;
    required: boolean;
}

interface ProjectInfo {
    id: string;
    clientName: string;
    projectName: string;
    briefSubmitted: boolean;
    briefSubmittedAt?: string;
    properties: Record<string, string>;
}

// ── Input renderer based on Notion property type ───────────────────────────
function FieldInput({
    field,
    value,
    onChange,
}: {
    field: BriefField;
    value: string;
    onChange: (v: string) => void;
}) {
    const base = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/60 transition text-sm";

    if (field.type === 'date') {
        return (
            <input type="date" value={value} onChange={e => onChange(e.target.value)}
                className={base} required={field.required} />
        );
    }
    if (field.type === 'number') {
        return (
            <input type="number" value={value} onChange={e => onChange(e.target.value)}
                placeholder="0" className={base} required={field.required} />
        );
    }
    if (field.type === 'url') {
        return (
            <input type="url" value={value} onChange={e => onChange(e.target.value)}
                placeholder="https://..." className={base} required={field.required} />
        );
    }
    if (field.type === 'email') {
        return (
            <input type="email" value={value} onChange={e => onChange(e.target.value)}
                placeholder="email@example.com" className={base} required={field.required} />
        );
    }
    if (field.type === 'rich_text' || field.type === 'title') {
        return (
            <textarea value={value} onChange={e => onChange(e.target.value)}
                rows={3} className={`${base} resize-none`} required={field.required} />
        );
    }
    // Default: text input
    return (
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
            className={base} required={field.required} />
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function BriefPage({ params }: { params: Promise<{ projectId: string }> }) {
    const [projectId, setProjectId] = useState<string | null>(null);

    const [project, setProject] = useState<ProjectInfo | null>(null);
    const [briefFields, setBriefFields] = useState<BriefField[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        params.then(p => setProjectId(p.projectId));
    }, [params]);

    const loadBrief = useCallback(async () => {
        if (!projectId) return;
        try {
            const res = await fetch(`/api/projects/${projectId}/brief`);
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Project not found'); return; }

            setProject(data.project);
            setBriefFields(data.briefFields);

            // Pre-fill answers from existing properties
            const prefilled: Record<string, string> = {};
            for (const f of data.briefFields) {
                prefilled[f.notionProperty] = data.project.properties[f.notionProperty] || '';
            }
            setAnswers(prefilled);
            if (data.project.briefSubmitted) setSubmitted(true);
        } catch {
            setError('Could not load project brief.');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => { loadBrief(); }, [loadBrief]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/brief`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers }),
            });
            if (res.ok) {
                setSubmitted(true);
            } else {
                const d = await res.json();
                setError(d.error || 'Submission failed. Please try again.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }, [projectId, answers]);

    // ── States ─────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-400 animate-pulse text-lg">Loading your brief…</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="text-5xl mb-4">🔍</div>
                    <h1 className="text-2xl font-bold text-white mb-2">Project not found</h1>
                    <p className="text-gray-400">{error}</p>
                    <p className="text-sm text-gray-600 mt-4">Check your link or contact your project manager.</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center max-w-lg">
                    <div className="text-6xl mb-6">🎉</div>
                    <h1 className="text-3xl font-bold text-white mb-3">Brief submitted!</h1>
                    <p className="text-gray-300 text-lg mb-4">Thank you, <strong>{project?.clientName}</strong>. Your details have been received and synced to the project.</p>
                    <div className="glass-panel p-6 rounded-2xl mt-6 text-left text-sm">
                        <p className="text-gray-400 mb-2 font-medium">Project</p>
                        <p className="text-white font-semibold">{project?.projectName}</p>
                        <p className="text-gray-500 text-xs mt-1">ID: {project?.id}</p>
                    </div>
                    <p className="text-gray-600 text-xs mt-6">You'll receive an email once your project is ready for review.</p>
                </div>
            </div>
        );
    }

    if (briefFields.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="text-5xl mb-4">⚙️</div>
                    <h1 className="text-2xl font-bold text-white mb-2">Brief not configured</h1>
                    <p className="text-gray-400">Your project manager hasn't set up the brief form yet. Please check back soon.</p>
                </div>
            </div>
        );
    }

    // ── Form ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen py-16 px-6">
            <div className="max-w-xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/20 text-orange-300 text-xs font-semibold mb-4 tracking-wide uppercase">
                        Project Brief
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {project?.projectName}
                    </h1>
                    <p className="text-gray-400">
                        Hi <strong className="text-white">{project?.clientName}</strong>! Please fill in the details below so we can get started on your project.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {briefFields.map(field => (
                        <div key={field.notionProperty}>
                            <label className="block text-sm font-medium text-gray-200 mb-2">
                                {field.label || field.notionProperty}
                                {field.required && <span className="text-red-400 ml-1">*</span>}
                            </label>
                            <FieldInput
                                field={field}
                                value={answers[field.notionProperty] || ''}
                                onChange={v => setAnswers(prev => ({ ...prev, [field.notionProperty]: v }))}
                            />
                        </div>
                    ))}

                    {error && (
                        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary w-full py-4 rounded-xl font-semibold text-base disabled:opacity-50 mt-4"
                    >
                        {submitting ? 'Sending…' : 'Submit Brief →'}
                    </button>
                    <p className="text-center text-xs text-gray-600">
                        Your answers are saved securely and shared only with your project manager.
                    </p>
                </form>
            </div>
        </div>
    );
}
