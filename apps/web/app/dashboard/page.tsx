import React from 'react';
import FileUploadArea from '@/components/FileUploadArea';

export default function DashboardPage() {
    return (
        <div className="min-h-screen p-8 md:p-16">
            <header className="mb-12 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Client Portal</h1>
                    <p className="text-gray-400 mt-2">Manage your creative projects and provide feedback.</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg border border-white/20 flex items-center justify-center font-bold text-lg">
                    JD
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <div className="glass-panel p-8 rounded-3xl">
                        <h2 className="text-2xl font-semibold mb-2">Active Project: "Summer Campaign 2026"</h2>
                        <div className="flex gap-4 mb-6">
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium border border-yellow-500/30">
                                In Editing Phase
                            </span>
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-medium border border-emerald-500/30">
                                Notion Synced
                            </span>
                        </div>

                        <p className="text-gray-300 text-sm leading-relaxed max-w-2xl mb-8">
                            We've received your brief and source files. The initial rough cut is currently being assembled according to your specifications.
                            You will be notified here once the first review link is ready on Frame.io.
                        </p>

                        <FileUploadArea />
                    </div>

                    <div className="glass-panel p-8 rounded-3xl border-l-4 border-l-blue-500">
                        <h3 className="text-xl font-semibold mb-4 text-white">Frame.io Review Dashboard</h3>
                        <p className="text-sm text-gray-400 mb-6">Review your final renders directly here once they are published.</p>
                        <div className="aspect-video bg-black/60 rounded-xl flex items-center justify-center border border-white/5 relative group cursor-not-allowed">
                            <p className="text-gray-500 font-medium z-10">No videos ready for review yet.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="glass-panel p-8 rounded-3xl">
                        <h3 className="text-lg font-semibold mb-4 text-white">Project Timeline</h3>
                        <div className="flex flex-col gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] mt-1.5 shrink-0"></div>
                                <div>
                                    <h4 className="font-medium text-sm text-white">Brief Submitted</h4>
                                    <p className="text-xs text-gray-400 mt-1">Oct 24, 2026</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] mt-1.5 shrink-0"></div>
                                <div>
                                    <h4 className="font-medium text-sm text-white">Files Uploaded to Cloud</h4>
                                    <p className="text-xs text-gray-400 mt-1">Oct 25, 2026</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 opacity-50 pl-1.5 border-l border-white/10 ml-[5px]">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0 -ml-[5px]"></div>
                                <div>
                                    <h4 className="font-medium text-sm text-white">First Cut Review</h4>
                                    <p className="text-xs text-gray-400 mt-1">Expected: Nov 02, 2026</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-3xl">
                        <h3 className="text-lg font-semibold mb-4 text-white">Cloud Storage Links</h3>
                        <div className="space-y-4">
                            <a href="#" className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <span className="text-sm font-medium">Source Files (Nextcloud)</span>
                                <span className="text-blue-400 text-xs text-right">Open &rarr;</span>
                            </a>
                            <a href="#" className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <span className="text-sm font-medium">Deliverables Folder</span>
                                <span className="text-blue-400 text-xs text-right">Open &rarr;</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
