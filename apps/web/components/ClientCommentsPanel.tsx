"use client";

import React, { useState, useEffect } from 'react';

interface Comment {
    id: string;
    text: string;
    createdAt: string;
    author: string;
}

export default function ClientCommentsPanel({ projectId }: { projectId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMsg, setLoadingMsg] = useState('Loading project chat...');
    const [newText, setNewText] = useState('');
    const [posting, setPosting] = useState(false);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}/comments`);
            const data = await res.json();
            if (data.comments) setComments(data.comments.reverse()); // Show newest at bottom usually, but let's see how Notion sorts them
            setLoadingMsg(data.error || '');
        } catch {
            setLoadingMsg('Failed to load chat.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
        const pinger = setInterval(fetchComments, 10000); // Polling every 10s
        return () => clearInterval(pinger);
    }, [projectId]);

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newText.trim() || posting) return;
        setPosting(true);

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        setComments(prev => [...prev, { id: tempId, text: newText, createdAt: new Date().toISOString(), author: '[Client: You]' }]);

        try {
            const res = await fetch(`/api/projects/${projectId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newText })
            });
            if (res.ok) fetchComments();
        } catch {
            // Revert on failure
            setComments(prev => prev.filter(c => c.id !== tempId));
        } finally {
            setPosting(false);
            setNewText('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-white font-medium flex items-center gap-2">
                    💬 Project Updates
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[300px]">
                {loading ? (
                    <div className="text-gray-500 animate-pulse text-center mt-10 text-sm">Loading project chat...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10 text-sm">
                        No messages yet. Send a message to your editor.
                    </div>
                ) : (
                    comments.map(c => {
                        const isClient = c.text.includes('[Client:');
                        return (
                            <div key={c.id} className={`flex flex-col max-w-[85%] ${isClient ? 'self-end items-end' : 'self-start items-start'}`}>
                                <div className={`px-4 py-2 rounded-2xl ${isClient ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>
                                    {c.text.replace(/\[Client:.*?\]/g, '').replace(/\[Admin\]/g, '').replace(/\[Frame.io - .*?\]/g, '').trim()}
                                </div>
                                <div className="text-[10px] text-gray-500 mt-1 px-1 flex gap-2">
                                    <span className="font-medium text-gray-400">
                                        {isClient ? 'You' : c.text.includes('[Frame.io') ? 'Frame.io Webhook' : 'Editor'}
                                    </span>
                                    <span>• {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-4 bg-white/5 border-t border-white/5">
                <form onSubmit={handlePost} className="flex gap-2">
                    <input
                        className="flex-1 glass-input px-4 py-2 rounded-xl text-sm"
                        placeholder="Message your editor..."
                        value={newText}
                        onChange={e => setNewText(e.target.value)}
                    />
                    <button type="submit" disabled={posting || !newText.trim()} className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition px-4 py-2 rounded-xl font-medium text-sm shadow-lg text-white">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
