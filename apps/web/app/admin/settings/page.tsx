"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminSettingsPage() {
    const [notionToken, setNotionToken] = useState('');
    const [frameioToken, setFrameioToken] = useState('');
    const [nextcloudUrl, setNextcloudUrl] = useState('');
    const [syncInterval, setSyncInterval] = useState(30);

    const [isTestingFrameio, setIsTestingFrameio] = useState(false);
    const [frameioStatus, setFrameioStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const [isTestingNotion, setIsTestingNotion] = useState(false);
    const [notionStatus, setNotionStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // New states for databases and properties
    const [availableDatabases, setAvailableDatabases] = useState<{ id: string, name: string }[]>([]);
    const [selectedDatabase, setSelectedDatabase] = useState('');
    const [notionProperties, setNotionProperties] = useState<string[]>([]);

    // Mapping state
    const [mappings, setMappings] = useState([
        { id: 1, notionProperty: '', frameioField: 'Project Name' },
        { id: 2, notionProperty: '', frameioField: 'Folder Status' },
    ]);

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error && !data.message) {
                    if (data.notionToken) setNotionToken(data.notionToken);
                    if (data.frameioToken) setFrameioToken(data.frameioToken);
                    if (data.nextcloudUrl) setNextcloudUrl(data.nextcloudUrl);
                    if (data.selectedDatabase) setSelectedDatabase(data.selectedDatabase);
                    if (data.mappings && data.mappings.length > 0) setMappings(data.mappings);
                    if (data.notionProperties) setNotionProperties(data.notionProperties);
                    if (data.syncInterval) setSyncInterval(Number(data.syncInterval));
                }
            })
            .catch(() => console.log('No prior config found or error parsing'));
    }, []);

    const testNotionConnection = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsTestingNotion(true);
        setNotionStatus('idle');
        setSelectedDatabase('');
        setNotionProperties([]);

        try {
            const res = await fetch('/api/notion/databases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: notionToken })
            });

            if (res.ok) {
                const data = await res.json();
                setAvailableDatabases(data.databases);
                setNotionStatus('success');
            } else {
                setNotionStatus('error');
                setAvailableDatabases([]);
            }
        } catch {
            setNotionStatus('error');
            setAvailableDatabases([]);
        } finally {
            setIsTestingNotion(false);
        }
    };

    const testFrameioConnection = async () => {
        setIsTestingFrameio(true);
        setFrameioStatus('idle');

        try {
            const res = await fetch('/api/frameio/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: frameioToken })
            });

            if (res.ok) {
                setFrameioStatus('success');
            } else {
                setFrameioStatus('error');
            }
        } catch {
            setFrameioStatus('error');
        } finally {
            setIsTestingFrameio(false);
        }
    };

    const handleSelectDatabase = async (dbId: string) => {
        setSelectedDatabase(dbId);
        setNotionProperties([]); // Clear old properties

        try {
            const res = await fetch('/api/notion/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: notionToken, databaseId: dbId })
            });

            if (res.ok) {
                const data = await res.json();
                setNotionProperties(data.properties);

                // Re-initialize mappings if not saved
                if (mappings[0].notionProperty === '') {
                    setMappings([
                        { id: 1, notionProperty: '', frameioField: 'Project Name' },
                        { id: 2, notionProperty: '', frameioField: 'Folder Status' },
                    ]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch properties');
        }
    };

    const handleSaveAll = async () => {
        setSaveStatus('saving');
        try {
            const payload = { notionToken, frameioToken, nextcloudUrl, selectedDatabase, notionProperties, mappings, syncInterval };
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                setSaveStatus('error');
            }
        } catch {
            setSaveStatus('error');
        }
    };

    const updateMapping = (id: number, type: 'notionProperty' | 'frameioField', value: string) => {
        setMappings(prev => prev.map(m => m.id === id ? { ...m, [type]: value } : m));
    };

    const addMapping = () => {
        setMappings(prev => [...prev, { id: Date.now(), notionProperty: '', frameioField: '' }]);
    };

    return (
        <div className="min-h-screen p-8 md:p-16">
            <header className="mb-12 flex justify-between items-center border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">Settings & Integrations</h1>
                    <p className="text-gray-400 mt-2">Configure API keys and field mappings between platforms.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <Link href="/admin/dashboard" className="text-sm px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition">
                        Back to Dashboard
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Integrations Form */}
                <div className="glass-panel p-8 rounded-3xl flex flex-col gap-8 h-fit">
                    <h2 className="text-2xl font-semibold">Integrations</h2>

                    <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); /* Prevent default form submission */ }}>
                        <div className="p-6 bg-black/20 rounded-2xl border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                Notion Database
                                {notionStatus === 'success' && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Connected</span>}
                                {notionStatus === 'error' && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Error</span>}
                            </h3>
                            <div className="flex gap-3">
                                <input
                                    type="password"
                                    value={notionToken}
                                    onChange={(e) => setNotionToken(e.target.value)}
                                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                                    placeholder="secret_..."
                                />
                                <button
                                    type="button"
                                    onClick={testNotionConnection}
                                    disabled={isTestingNotion || !notionToken}
                                    className="btn-primary px-6 py-2.5 rounded-xl text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isTestingNotion ? 'Testing...' : 'Test Connection'}
                                </button>
                            </div>
                        </div>

                        {availableDatabases.length > 0 && (
                            <div className="p-6 bg-black/20 rounded-2xl border border-emerald-500/20 relative overflow-hidden">
                                <h3 className="text-lg font-medium mb-4 text-emerald-400">Select Primary Database</h3>
                                <div className="flex flex-col gap-2">
                                    {availableDatabases.map(db => (
                                        <button
                                            key={db.id}
                                            type="button"
                                            onClick={() => handleSelectDatabase(db.id)}
                                            className={`text-left px-4 py-3 rounded-xl transition font-medium ${selectedDatabase === db.id ? 'bg-emerald-500/20 border-emerald-500/30 border text-emerald-300' : 'bg-white/5 border border-transparent hover:bg-white/10 text-gray-300'}`}
                                        >
                                            {db.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-6 bg-black/20 rounded-2xl border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                Frame.io
                                {frameioStatus === 'success' && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Connected</span>}
                                {frameioStatus === 'error' && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Error</span>}
                            </h3>
                            <div className="flex gap-3">
                                <input
                                    type="password"
                                    value={frameioToken}
                                    onChange={(e) => setFrameioToken(e.target.value)}
                                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                                    placeholder="fio_..."
                                />
                                <button
                                    type="button"
                                    onClick={testFrameioConnection}
                                    disabled={isTestingFrameio || !frameioToken}
                                    className="btn-primary px-6 py-2.5 rounded-xl text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isTestingFrameio ? 'Testing...' : 'Test Connection'}
                                </button>
                            </div>
                        </div>

                        <div className="p-6 bg-black/20 rounded-2xl border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-300"></div>
                            <h3 className="text-lg font-medium mb-4">Nextcloud Storage</h3>
                            <input
                                type="url"
                                value={nextcloudUrl}
                                onChange={(e) => setNextcloudUrl(e.target.value)}
                                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                                placeholder="https://cloud.yourdomain.com"
                            />
                        </div>

                        <div className="p-6 bg-black/20 rounded-2xl border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                Automation Settings
                            </h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Background Sync Interval (seconds)</label>
                                <input
                                    type="number"
                                    min="10"
                                    value={syncInterval}
                                    onChange={(e) => setSyncInterval(Number(e.target.value))}
                                    className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                                    placeholder="30"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSaveAll}
                            disabled={saveStatus === 'saving'}
                            className={`btn-primary w-full py-3 rounded-xl font-medium mt-2 transition-all ${saveStatus === 'saved' ? 'bg-emerald-500 hover:bg-emerald-400' : ''}`}
                        >
                            {saveStatus === 'saving' && 'Saving Capabilities...'}
                            {saveStatus === 'saved' && '✓ Configuration Saved!'}
                            {saveStatus === 'error' && 'Error Saving. Try Again.'}
                            {saveStatus === 'idle' && 'Save All Integrations'}
                        </button>
                    </form>
                </div>

                {/* Field Mappings - Conditionally rendered based on selected database */}
                <div className={`glass-panel p-8 rounded-3xl transition-all duration-500 ${(selectedDatabase && notionProperties.length > 0) ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <h2 className="text-2xl font-semibold mb-2">Property Synchronisation</h2>
                    <p className="text-gray-400 text-sm mb-8">Map Notion database properties to Frame.io project fields. This ensures data flows correctly when projects update.</p>

                    <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                        <div className="grid grid-cols-5 gap-4 mb-4 text-xs tracking-wider uppercase text-gray-500 font-medium">
                            <div className="col-span-2">Notion Property</div>
                            <div className="col-span-1 text-center">Dir</div>
                            <div className="col-span-2">Frame.io Field</div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {mappings.map((map) => (
                                <div key={map.id} className="grid grid-cols-5 gap-4 items-center">
                                    <div className="col-span-2">
                                        <select
                                            className="glass-input w-full px-3 py-2 rounded-lg text-sm bg-black/50"
                                            value={map.notionProperty}
                                            onChange={(e) => updateMapping(map.id, 'notionProperty', e.target.value)}
                                        >
                                            <option value="" disabled>Select property...</option>
                                            {notionProperties.map(prop => (
                                                <option key={prop} value={prop}>{prop}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-1 flex justify-center text-gray-500">
                                        &rarr;
                                    </div>
                                    <div className="col-span-2">
                                        <select
                                            className="glass-input w-full px-3 py-2 rounded-lg text-sm bg-black/50"
                                            value={map.frameioField}
                                            onChange={(e) => updateMapping(map.id, 'frameioField', e.target.value)}
                                        >
                                            <option value="" disabled>Select Frame.io field...</option>
                                            <option value="Project Name">Project Name</option>
                                            <option value="Folder Name">Folder Name</option>
                                            <option value="Folder Status">Folder Status</option>
                                            <option value="Asset Name / Video">Asset Name / Video</option>
                                            <option value="Asset Status">Asset Status</option>
                                            <option value="Comment Text">Comment Text</option>
                                            <option value="Comment Status">Comment Status</option>
                                            <option value="Description">Description</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addMapping}
                            className="mt-6 text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2"
                        >
                            + Add New Mapping
                        </button>
                    </div>

                    {(!selectedDatabase || notionProperties.length === 0) && (
                        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-300 text-sm">
                            Connect Notion and select a database to fetch available properties.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
