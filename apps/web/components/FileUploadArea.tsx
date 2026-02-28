"use client";

import React, { useState, useRef } from 'react';

export default function FileUploadArea({ projectId }: { projectId: string }) {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        if (e.dataTransfer.files?.length) setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files || [])]);
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) setFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);
        setMessage('');
        const formData = new FormData();
        formData.append('projectId', projectId);
        files.forEach(f => formData.append('files', f));

        try {
            const res = await fetch('/api/files/upload', { method: 'POST', body: formData });
            if (res.ok) {
                setMessage('Files uploaded successfully!');
                setFiles([]);
            } else {
                const data = await res.json();
                setMessage(data.error || 'Upload failed');
            }
        } catch {
            setMessage('Network error during upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-white">Upload Project Files</h3>
            <p className="text-gray-400 text-sm mb-6">Drag & drop your source files here. They will be securely synced to your dedicated cloud folder.</p>

            <div
                className={`glass-panel border-dashed border-2 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-white/40'}`}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
            >
                <span className="font-medium text-lg text-white">Drop files to upload</span>
                <span className="text-sm text-gray-400 mt-2">or click to browse</span>
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
            </div>

            {files.length > 0 && (
                <div className="mt-6 glass-panel rounded-xl p-6">
                    <h4 className="font-medium mb-3">Queued Files ({files.length})</h4>
                    <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 mb-4">
                        {files.map((file, i) => (
                            <li key={i} className="flex justify-between items-center text-sm p-3 bg-black/20 rounded-lg border border-white/5">
                                <span className="truncate max-w-[70%] text-gray-300">{file.name}</span>
                                <span className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </li>
                        ))}
                    </ul>
                    <button onClick={handleUpload} disabled={uploading} className="btn-primary w-full py-3 rounded-xl font-medium disabled:opacity-50">
                        {uploading ? 'Uploading...' : 'Sync to Cloud Storage'}
                    </button>
                </div>
            )}
            {message && <p className={`mt-4 text-sm ${message.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>{message}</p>}
        </div>
    );
}
