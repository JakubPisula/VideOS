"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface BriefField {
    notionProperty: string;
    label: string;
    type: string;
    required: boolean;
}

// ── Input component based on Notion property type ─────────────────────────
function FieldInput({
    field,
    value,
    onChange,
}: {
    field: BriefField;
    value: string;
    onChange: (v: string) => void;
}) {
    const base = "glass-input w-full px-4 py-3 rounded-xl text-sm";

    if (field.type === 'date') {
        return <input type="date" value={value} onChange={e => onChange(e.target.value)} className={base} required={field.required} />;
    }
    if (field.type === 'number') {
        return <input type="number" value={value} onChange={e => onChange(e.target.value)} className={base} required={field.required} placeholder="0" />;
    }
    if (field.type === 'url') {
        return <input type="url" value={value} onChange={e => onChange(e.target.value)} className={base} required={field.required} placeholder="https://..." />;
    }
    if (field.type === 'email') {
        return <input type="email" value={value} onChange={e => onChange(e.target.value)} className={base} required={field.required} placeholder="email@example.com" />;
    }
    if (field.type === 'rich_text') {
        return <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className={`${base} resize-none`} required={field.required} />;
    }
    // title, select, multi_select, text
    return <input type="text" value={value} onChange={e => onChange(e.target.value)} className={base} required={field.required} />;
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function RegisterPage() {
    const router = useRouter();

    // Fixed identity fields
    const [clientName, setClientName] = useState('');
    const [email, setEmail] = useState('');
    const [projectName, setProjectName] = useState('');

    // Dynamic Notion fields
    const [briefFields, setBriefFields] = useState<BriefField[]>([]);
    const [briefAnswers, setBriefAnswers] = useState<Record<string, string>>({});
    const [loadingFields, setLoadingFields] = useState(true);

    // Submission
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Load brief field config from API
    useEffect(() => {
        fetch('/api/brief-config')
            .then(res => res.json())
            .then(data => {
                if (data.briefFields?.length > 0) {
                    setBriefFields(data.briefFields);
                    // Init all answers to empty
                    const init: Record<string, string> = {};
                    data.briefFields.forEach((f: BriefField) => { init[f.notionProperty] = ''; });
                    setBriefAnswers(init);
                }
            })
            .catch(() => { })
            .finally(() => setLoadingFields(false));
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            // Step 1: Create the project (provisions Notion page + local DB entry)
            const createRes = await fetch('/api/projects/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName,
                    projectName,
                    description: email, // store email in description for now
                }),
            });
            const createData = await createRes.json();

            if (!createRes.ok) {
                setError(createData.error || 'Failed to create project. Please try again.');
                return;
            }

            const projectId = createData.projectId || createData.project?.id;

            // Step 2: If there are brief answers and a project ID, submit the brief
            if (projectId && briefFields.length > 0) {
                // Merge email into answers
                const allAnswers = { ...briefAnswers };
                await fetch(`/api/projects/${projectId}/brief`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ answers: allAnswers }),
                });
            }

            // Redirect to client portal with their project ID pre-filled
            router.push(`/dashboard?projectId=${projectId}`);

        } catch (err: any) {
            setError(`Network error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    }, [clientName, email, projectName, briefFields, briefAnswers, router]);

    return (
        <div className="min-h-screen flex items-center justify-center p-8 py-20">
            <div className="glass-panel p-10 rounded-3xl w-full max-w-2xl relative overflow-hidden">
                <h2 className="text-4xl font-extrabold mb-2 pb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    Start Your Project
                </h2>
                <p className="text-gray-400 mb-8 max-w-lg text-sm">
                    Fill in your details and project brief below. This automatically creates your dedicated client space.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">

                    {/* ── Identity fields (always shown) ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">
                                Full Name / Company <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={e => setClientName(e.target.value)}
                                className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                                placeholder="Nike, Jan Kowalski…"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">
                                Email Address <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                                placeholder="jan@firma.pl"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                            Project Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={e => setProjectName(e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                            placeholder="Summer Campaign 2026, Reklama TV…"
                            required
                        />
                    </div>

                    {/* ── Dynamic Notion DB fields ── */}
                    {!loadingFields && briefFields.length > 0 && (
                        <>
                            <div className="border-t border-white/10 pt-6">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-5">Project Details</p>
                                <div className="flex flex-col gap-5">
                                    {briefFields.map(field => (
                                        <div key={field.notionProperty}>
                                            <label className="block text-sm font-medium mb-2 text-gray-300">
                                                {field.label || field.notionProperty}
                                                {field.required && <span className="text-red-400 ml-1">*</span>}
                                            </label>
                                            <FieldInput
                                                field={field}
                                                value={briefAnswers[field.notionProperty] || ''}
                                                onChange={v => setBriefAnswers(prev => ({ ...prev, [field.notionProperty]: v }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {loadingFields && (
                        <div className="text-gray-500 text-sm animate-pulse">Loading project fields…</div>
                    )}

                    {error && (
                        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary w-full py-4 rounded-xl font-medium mt-2 text-lg disabled:opacity-50"
                    >
                        {submitting ? 'Creating your project…' : 'Submit Brief & Create Project →'}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-gray-400">
                    Already a client?{' '}
                    <a href="/dashboard" className="text-blue-400 hover:text-blue-300">
                        View your project →
                    </a>
                </p>
            </div>
        </div>
    );
}
