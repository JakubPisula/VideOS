"use client";

import React, { useState, useEffect, useCallback } from 'react';

interface BriefField {
    notionProperty: string;
    label: string;
    type: string;
    required: boolean;
}

function FieldInput({ field, value, onChange }: { field: BriefField; value: string; onChange: (v: string) => void }) {
    const base = "glass-input w-full px-4 py-3 rounded-xl text-sm";
    if (field.type === 'date') return <input type="date" value={value} onChange={e => onChange(e.target.value)} className={base} required={field.required} />;
    if (field.type === 'number') return <input type="number" value={value} onChange={e => onChange(e.target.value)} className={base} required={field.required} placeholder="0" />;
    if (field.type === 'url') return <input type="url" value={value} onChange={e => onChange(e.target.value)} className={base} required={field.required} placeholder="https://..." />;
    if (field.type === 'email') return <input type="email" value={value} onChange={e => onChange(e.target.value)} className={base} required={field.required} placeholder="email@example.com" />;
    if (field.type === 'rich_text') return <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className={`${base} resize-none`} required={field.required} />;
    return <input type="text" value={value} onChange={e => onChange(e.target.value)} className={base} required={field.required} />;
}

export default function RegisterPage() {
    // Account fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [projectName, setProjectName] = useState('');

    // Dynamic Notion fields
    const [briefFields, setBriefFields] = useState<BriefField[]>([]);
    const [briefAnswers, setBriefAnswers] = useState<Record<string, string>>({});
    const [loadingFields, setLoadingFields] = useState(true);

    // State
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [createdProjectId, setCreatedProjectId] = useState('');

    useEffect(() => {
        fetch('/api/brief-config')
            .then(r => r.json())
            .then(data => {
                if (data.briefFields?.length > 0) {
                    setBriefFields(data.briefFields);
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
            // 1. Create account
            const regRes = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, role: 'client' }),
            });
            const regData = await regRes.json();
            if (!regRes.ok) {
                setError(regData.error || 'Registration failed.');
                return;
            }

            // 2. Create project
            const createRes = await fetch('/api/projects/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientName: name, projectName, description: email }),
            });
            const createData = await createRes.json();
            const projectId = createData.projectId || createData.project?.id;

            // 3. Submit brief if fields exist
            if (projectId && briefFields.length > 0) {
                await fetch(`/api/projects/${projectId}/brief`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ answers: briefAnswers }),
                });
            }

            setCreatedProjectId(projectId || '');
            setStep('success');

        } catch (err: any) {
            setError(`Network error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    }, [name, email, password, projectName, briefFields, briefAnswers]);

    // ── Success screen ─────────────────────────────────────────────────────
    if (step === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="glass-panel p-12 rounded-3xl max-w-lg text-center">
                    <div className="text-6xl mb-6">🎉</div>
                    <h2 className="text-3xl font-bold text-white mb-3">Account Created!</h2>
                    <p className="text-gray-300 mb-2">Welcome, <strong>{name}</strong>.</p>
                    {createdProjectId && (
                        <p className="text-sm text-gray-400 mb-6">
                            Your Project ID: <code className="bg-white/10 px-2 py-1 rounded text-orange-300">{createdProjectId}</code>
                        </p>
                    )}
                    <a href="/client" className="btn-primary px-8 py-3 rounded-xl font-medium inline-block">
                        Go to your Portal →
                    </a>
                </div>
            </div>
        );
    }

    // ── Registration form ──────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex items-center justify-center p-8 py-20">
            <div className="glass-panel p-10 rounded-3xl w-full max-w-2xl relative overflow-hidden">
                <h2 className="text-4xl font-extrabold mb-2 pb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    Start Your Project
                </h2>
                <p className="text-gray-400 mb-8 max-w-lg text-sm">
                    Create your account and tell us about your project.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Account fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Full Name / Company <span className="text-red-400">*</span></label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)}
                                className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="Nike, Jan Kowalski…" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Email <span className="text-red-400">*</span></label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="jan@firma.pl" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Password <span className="text-red-400">*</span></label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="Min. 4 characters" required minLength={4} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Project Name <span className="text-red-400">*</span></label>
                            <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)}
                                className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="Summer Campaign 2026" required />
                        </div>
                    </div>

                    {/* Dynamic Notion fields */}
                    {!loadingFields && briefFields.length > 0 && (
                        <div className="border-t border-white/10 pt-6">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-5">Project Details</p>
                            <div className="flex flex-col gap-5">
                                {briefFields.map(field => (
                                    <div key={field.notionProperty}>
                                        <label className="block text-sm font-medium mb-2 text-gray-300">
                                            {field.label || field.notionProperty}
                                            {field.required && <span className="text-red-400 ml-1">*</span>}
                                        </label>
                                        <FieldInput field={field}
                                            value={briefAnswers[field.notionProperty] || ''}
                                            onChange={v => setBriefAnswers(prev => ({ ...prev, [field.notionProperty]: v }))} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {loadingFields && <div className="text-gray-500 text-sm animate-pulse">Loading project fields…</div>}

                    {error && (
                        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>
                    )}

                    <button type="submit" disabled={submitting}
                        className="btn-primary w-full py-4 rounded-xl font-medium mt-2 text-lg disabled:opacity-50">
                        {submitting ? 'Creating your account…' : 'Create Account & Start Project →'}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-gray-400">
                    Already have an account?{' '}
                    <a href="/login" className="text-blue-400 hover:text-blue-300">Sign in →</a>
                </p>
            </div>
        </div>
    );
}
