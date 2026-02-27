"use client";

import React, { useState, useRef } from 'react';

export default function FileUploadArea() {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFiles([...files, ...Array.from(e.dataTransfer.files)]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles([...files, ...Array.from(e.target.files)]);
        }
    };

    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-white">Upload Project Files</h3>
            <p className="text-gray-400 text-sm mb-6">Drag & drop your source files here. They will be securely synced to your dedicated cloud folder.</p>

            <div
                className={`glass-panel border-dashed border-2 rounded-2xl p-12 flex flex-col items-center justify-center transition-all ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/20'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <svg className="w-12 h-12 text-blue-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="font-medium text-lg text-white">Drop files to upload</span>
                <span className="text-sm text-gray-400 mt-2">or click to browse</span>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                />
            </div>

            {files.length > 0 && (
                <div className="mt-6 glass-panel rounded-xl p-6">
                    <h4 className="font-medium mb-3">Queued Files ({files.length})</h4>
                    <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {files.map((file, i) => (
                            <li key={i} className="flex justify-between items-center text-sm p-3 bg-black/20 rounded-lg border border-white/5">
                                <span className="truncate max-w-[70%]">{file.name}</span>
                                <span className="text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </li>
                        ))}
                    </ul>
                    <button className="btn-primary w-full mt-4 py-3 rounded-xl font-medium">Sync to Cloud Storage</button>
                </div>
            )}
        </div>
    );
}
