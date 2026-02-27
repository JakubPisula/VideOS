"use client";

import React, { useState, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────
interface NotionProperty {
    name: string;
    type: string;
}

interface Database {
    id: string;
    name: string;
}

interface PropertyMapping {
    notionProperty: string;
    localAlias: string;
    type: string;
    include: boolean;
}

// Types that make sense to sync (trackable text/value fields)
const SYNCABLE_TYPES = new Set([
    'title', 'rich_text', 'select', 'multi_select', 'status',
    'number', 'date', 'checkbox', 'url', 'email', 'phone_number'
]);

const TYPE_COLORS: Record<string, string> = {
    title: 'bg-yellow-500/20 text-yellow-300',
    rich_text: 'bg-blue-500/20 text-blue-300',
    select: 'bg-purple-500/20 text-purple-300',
    multi_select: 'bg-indigo-500/20 text-indigo-300',
    status: 'bg-green-500/20 text-green-300',
    number: 'bg-red-500/20 text-red-300',
    date: 'bg-orange-500/20 text-orange-300',
    checkbox: 'bg-teal-500/20 text-teal-300',
    url: 'bg-cyan-500/20 text-cyan-300',
    email: 'bg-pink-500/20 text-pink-300',
};

// ── Step Indicator ─────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
    const steps = ['Notion Token', 'Database', 'Properties', 'Frame.io', 'Review'];
    return (
        <div className="flex items-center gap-2 mb-10">
            {steps.map((label, i) => {
                const idx = i + 1;
                const active = idx === current;
                const done = idx < current;
                return (
                    <React.Fragment key={idx}>
                        <div className="flex flex-col items-center gap-1">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                    ${done ? 'bg-emerald-500 text-white' : active ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white/10 text-gray-500'}`}
                            >
                                {done ? '✓' : idx}
                            </div>
                            <span className={`text-xs whitespace-nowrap ${active ? 'text-white' : 'text-gray-500'}`}>
                                {label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`flex-1 h-px mb-4 ${done ? 'bg-emerald-500' : 'bg-white/10'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ── Main Wizard ────────────────────────────────────────────────────────────
export default function SetupPage() {
    const [step, setStep] = useState(1);

    // Step 1: Notion Token
    const [notionToken, setNotionToken] = useState('');
    const [notionTokenStatus, setNotionTokenStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
    const [databases, setDatabases] = useState<Database[]>([]);

    // Step 2: Database
    const [selectedDb, setSelectedDb] = useState<Database | null>(null);
    const [properties, setProperties] = useState<NotionProperty[]>([]);
    const [loadingProps, setLoadingProps] = useState(false);

    // Step 3: Property mappings
    const [mappings, setMappings] = useState<PropertyMapping[]>([]);

    // Step 4: Frame.io Token
    const [frameioToken, setFrameioToken] = useState('');
    const [frameioStatus, setFrameioStatus] = useState<'idle' | 'testing' | 'ok' | 'error' | 'skipped'>('idle');

    // Step 5: Saving
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState('');

    // ── Step 1 handler ──────────────────────────────────────────────────────
    const handleTestNotion = useCallback(async () => {
        setNotionTokenStatus('testing');
        try {
            const res = await fetch('/api/notion/databases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: notionToken }),
            });
            const data = await res.json();
            if (res.ok && data.databases?.length > 0) {
                setDatabases(data.databases);
                setNotionTokenStatus('ok');
            } else {
                setNotionTokenStatus('error');
            }
        } catch {
            setNotionTokenStatus('error');
        }
    }, [notionToken]);

    // ── Step 2 handler ──────────────────────────────────────────────────────
    const handleSelectDatabase = useCallback(async (db: Database) => {
        setSelectedDb(db);
        setLoadingProps(true);
        try {
            const res = await fetch('/api/notion/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: notionToken, databaseId: db.id }),
            });
            const data = await res.json();
            if (res.ok) {
                const props: NotionProperty[] = data.properties;
                setProperties(props);
                // Auto-include only trackable types; exclude relational/formula/button
                setMappings(props.map(p => ({
                    notionProperty: p.name,
                    localAlias: p.name,
                    type: p.type,
                    include: SYNCABLE_TYPES.has(p.type),
                })));
            }
        } catch {
            // Keep empty
        } finally {
            setLoadingProps(false);
        }
    }, [notionToken]);

    // ── Step 4 handler ──────────────────────────────────────────────────────
    const handleTestFrameio = useCallback(async () => {
        setFrameioStatus('testing');
        try {
            const res = await fetch('/api/frameio/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: frameioToken }),
            });
            setFrameioStatus(res.ok ? 'ok' : 'error');
        } catch {
            setFrameioStatus('error');
        }
    }, [frameioToken]);

    // ── Step 5 save ──────────────────────────────────────────────────────────
    const handleFinish = useCallback(async () => {
        setSaving(true);
        setSaveError('');
        // Build mappings: title type → Project Name, others → their local alias
        const includedMappings = mappings
            .filter(m => m.include)
            .map((m, i) => ({
                id: i + 1,
                notionProperty: m.notionProperty,
                frameioField: m.type === 'title' ? 'Project Name' : m.localAlias,
                localAlias: m.localAlias,
            }));

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notionToken,
                    frameioToken: frameioStatus === 'ok' ? frameioToken : '',
                    nextcloudUrl: '',
                    selectedDatabase: selectedDb?.id,
                    notionProperties: mappings.filter(m => m.include).map(m => ({ name: m.notionProperty, type: m.type })),
                    mappings: includedMappings,
                    syncInterval: 60,
                }),
            });
            if (res.ok) {
                setSaved(true);
                // Hard redirect — avoids client-side router conflicts with firstRun guard
                setTimeout(() => { window.location.href = '/admin/dashboard'; }, 1200);
            } else {
                const errData = await res.json().catch(() => ({}));
                setSaveError(errData.error || `Server error ${res.status}. Try again.`);
            }
        } catch (e: any) {
            setSaveError(`Network error: ${e.message}`);
        } finally {
            setSaving(false);
        }
    }, [notionToken, frameioToken, frameioStatus, selectedDb, mappings]);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400 mb-2">
                        wideOS Setup
                    </h1>
                    <p className="text-gray-400">Configure your integrations to get started.</p>
                </div>

                <div className="glass-panel p-8 rounded-3xl">
                    <StepIndicator current={step} total={5} />

                    {/* ── Step 1: Notion Token ── */}
                    {step === 1 && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h2 className="text-xl font-semibold mb-1">Connect Notion</h2>
                                <p className="text-sm text-gray-400">
                                    Go to{' '}
                                    <a href="https://www.notion.so/my-integrations" target="_blank" className="text-blue-400 underline">notion.so/my-integrations</a>
                                    {' '}→ New Integration → copy the secret.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <input
                                    type="password"
                                    value={notionToken}
                                    onChange={e => setNotionToken(e.target.value)}
                                    className="glass-input flex-1 px-4 py-3 rounded-xl text-sm"
                                    placeholder="secret_..."
                                />
                                <button
                                    onClick={handleTestNotion}
                                    disabled={!notionToken || notionTokenStatus === 'testing'}
                                    className="btn-primary px-5 py-3 rounded-xl text-sm font-medium disabled:opacity-50"
                                >
                                    {notionTokenStatus === 'testing' ? 'Testing…' : 'Verify'}
                                </button>
                            </div>
                            {notionTokenStatus === 'ok' && (
                                <p className="text-emerald-400 text-sm">✓ Connected! Found {databases.length} database(s).</p>
                            )}
                            {notionTokenStatus === 'error' && (
                                <p className="text-red-400 text-sm">✗ Could not connect. Check the token and that the integration has access to a database.</p>
                            )}
                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={notionTokenStatus !== 'ok'}
                                    className="btn-primary px-6 py-3 rounded-xl font-medium disabled:opacity-30"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Choose Database ── */}
                    {step === 2 && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h2 className="text-xl font-semibold mb-1">Choose your projects database</h2>
                                <p className="text-sm text-gray-400">This is where new client projects will be stored in Notion.</p>
                            </div>
                            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                                {databases.map(db => (
                                    <button
                                        key={db.id}
                                        onClick={() => handleSelectDatabase(db)}
                                        className={`text-left px-4 py-3 rounded-xl border transition font-medium text-sm
                                            ${selectedDb?.id === db.id
                                                ? 'border-orange-500/50 bg-orange-500/10 text-orange-300'
                                                : 'border-white/10 hover:bg-white/5 text-gray-300'}`}
                                    >
                                        {db.name}
                                    </button>
                                ))}
                            </div>
                            {loadingProps && <p className="text-gray-400 text-sm animate-pulse">Loading properties…</p>}
                            <div className="flex justify-between mt-4">
                                <button onClick={() => setStep(1)} className="px-4 py-2 rounded-xl hover:bg-white/5 text-sm">← Back</button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={!selectedDb || properties.length === 0}
                                    className="btn-primary px-6 py-3 rounded-xl font-medium disabled:opacity-30"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Import Properties ── */}
                    {step === 3 && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h2 className="text-xl font-semibold mb-1">Import properties</h2>
                                <p className="text-sm text-gray-400 mb-1">
                                    Choose which columns from <span className="text-white font-medium">{selectedDb?.name}</span> should be tracked.
                                    You can give each a local alias.
                                </p>
                                <p className="text-xs text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                                    ⚡ Types like <code>relation</code>, <code>formula</code>, <code>people</code> and <code>button</code> are auto-deselected — they can&apos;t be reliably synced as text values.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                                {mappings.map((m, i) => (
                                    <div
                                        key={m.notionProperty}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition
                                            ${m.include ? 'border-white/10 bg-white/5' : 'border-white/5 opacity-40'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={m.include}
                                            onChange={() => setMappings(prev =>
                                                prev.map((x, j) => j === i ? { ...x, include: !x.include } : x)
                                            )}
                                            className="w-4 h-4 accent-orange-500 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white truncate">{m.notionProperty}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLORS[m.type] || 'bg-white/10 text-gray-400'}`}>
                                                    {m.type}
                                                </span>
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            value={m.localAlias}
                                            onChange={e => setMappings(prev =>
                                                prev.map((x, j) => j === i ? { ...x, localAlias: e.target.value } : x)
                                            )}
                                            disabled={!m.include}
                                            className="glass-input w-36 px-3 py-1.5 rounded-lg text-sm flex-shrink-0 disabled:opacity-40"
                                            placeholder="Local alias"
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500">{mappings.filter(m => m.include).length} of {mappings.length} properties selected.</p>
                            <div className="flex justify-between mt-4">
                                <button onClick={() => setStep(2)} className="px-4 py-2 rounded-xl hover:bg-white/5 text-sm">← Back</button>
                                <button
                                    onClick={() => setStep(4)}
                                    disabled={mappings.filter(m => m.include).length === 0}
                                    className="btn-primary px-6 py-3 rounded-xl font-medium disabled:opacity-30"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 4: Frame.io Token ── */}
                    {step === 4 && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h2 className="text-xl font-semibold mb-1">Connect Frame.io <span className="text-gray-400 font-normal text-base">(optional)</span></h2>
                                <p className="text-sm text-gray-400">
                                    Go to{' '}
                                    <a href="https://developer.frame.io" target="_blank" className="text-blue-400 underline">developer.frame.io</a>
                                    {' '}→ create a token with project read/write scopes.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <input
                                    type="password"
                                    value={frameioToken}
                                    onChange={e => setFrameioToken(e.target.value)}
                                    className="glass-input flex-1 px-4 py-3 rounded-xl text-sm"
                                    placeholder="fio-u-..."
                                />
                                <button
                                    onClick={handleTestFrameio}
                                    disabled={!frameioToken || frameioStatus === 'testing'}
                                    className="btn-primary px-5 py-3 rounded-xl text-sm font-medium disabled:opacity-50"
                                >
                                    {frameioStatus === 'testing' ? 'Testing…' : 'Verify'}
                                </button>
                            </div>
                            {frameioStatus === 'ok' && <p className="text-emerald-400 text-sm">✓ Frame.io connected!</p>}
                            {frameioStatus === 'error' && <p className="text-red-400 text-sm">✗ Invalid token. Check permissions (account.read, project.write).</p>}
                            <div className="flex justify-between mt-4">
                                <button onClick={() => setStep(3)} className="px-4 py-2 rounded-xl hover:bg-white/5 text-sm">← Back</button>
                                <div className="flex gap-2">
                                    <button onClick={() => { setFrameioStatus('skipped'); setStep(5); }} className="px-4 py-2 rounded-xl hover:bg-white/5 text-sm text-gray-400">
                                        Skip
                                    </button>
                                    <button
                                        onClick={() => setStep(5)}
                                        disabled={frameioStatus !== 'ok' && frameioStatus !== 'skipped' && frameioToken !== ''}
                                        className="btn-primary px-6 py-3 rounded-xl font-medium disabled:opacity-30"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 5: Review & Save ── */}
                    {step === 5 && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h2 className="text-xl font-semibold mb-1">Review & Finish</h2>
                                <p className="text-sm text-gray-400">Everything looks good? Hit Finish to save and go to your dashboard.</p>
                            </div>

                            <div className="flex flex-col gap-3 bg-black/20 rounded-2xl p-5 border border-white/5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Notion</span>
                                    <span className="text-emerald-400 font-medium">✓ Connected</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Database</span>
                                    <span className="text-white font-medium">{selectedDb?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Properties imported</span>
                                    <span className="text-white font-medium">{mappings.filter(m => m.include).length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Frame.io</span>
                                    <span className={frameioStatus === 'ok' ? 'text-emerald-400' : 'text-gray-500'}>
                                        {frameioStatus === 'ok' ? '✓ Connected' : 'Skipped'}
                                    </span>
                                </div>
                            </div>

                            {/* Preview of included properties */}
                            <div className="flex flex-wrap gap-2">
                                {mappings.filter(m => m.include).map(m => (
                                    <span key={m.notionProperty} className={`text-xs px-2 py-1 rounded-full ${TYPE_COLORS[m.type] || 'bg-white/10 text-gray-400'}`}>
                                        {m.localAlias !== m.notionProperty ? `${m.localAlias} ← ${m.notionProperty}` : m.notionProperty}
                                    </span>
                                ))}
                            </div>

                            {saveError && (
                                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{saveError}</p>
                            )}

                            {saved && (
                                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-medium text-center animate-pulse">
                                    ✓ Configuration saved! Redirecting to dashboard…
                                </div>
                            )}

                            <div className="flex justify-between mt-4">
                                <button onClick={() => setStep(4)} disabled={saving || saved} className="px-4 py-2 rounded-xl hover:bg-white/5 text-sm disabled:opacity-30">← Back</button>
                                <button
                                    onClick={handleFinish}
                                    disabled={saving || saved}
                                    className="btn-primary px-8 py-3 rounded-xl font-medium disabled:opacity-50 text-base"
                                >
                                    {saving ? 'Saving…' : '🚀 Finish Setup'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-gray-600 mt-6">
                    Already configured?{' '}
                    <a href="/admin/settings" className="text-gray-400 underline hover:text-white transition">Open Settings</a>
                </p>
            </div>
        </div>
    );
}
