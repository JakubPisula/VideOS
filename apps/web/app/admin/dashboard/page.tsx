import React from 'react';

export default function AdminDashboardPage() {
    return (
        <div className="min-h-screen p-8 md:p-16">
            <header className="mb-12 flex justify-between items-center border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">Freelancer Admin Panel</h1>
                    <p className="text-gray-400 mt-2">Manage your creative projects. Database synced with Notion.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <span className="text-sm text-emerald-400 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Notion Connected
                    </span>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-lg border border-white/20 flex items-center justify-center font-bold text-lg">
                        AD
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 flex flex-col gap-8">
                    <div className="glass-panel p-8 rounded-3xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">Recent Client Projects</h2>
                            <button className="text-sm border border-white/20 px-4 py-2 rounded-lg hover:bg-white/10 transition">Force Notion Sync</button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-gray-400 text-sm">
                                        <th className="pb-4 font-medium">Project ID</th>
                                        <th className="pb-4 font-medium">Client</th>
                                        <th className="pb-4 font-medium">Status</th>
                                        <th className="pb-4 font-medium">Brief</th>
                                        <th className="pb-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="py-4 font-mono text-blue-400">PRJ-123456</td>
                                        <td className="py-4">John Doe</td>
                                        <td className="py-4"><span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">Editing</span></td>
                                        <td className="py-4 text-gray-400 truncate max-w-[200px]">Summer Campaign 2026 footage...</td>
                                        <td className="py-4 flex gap-2">
                                            <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition" title="Open Notion Record">Notion</a>
                                            <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-400 transition" title="Open Cloud Storage">Files</a>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="py-4 font-mono text-blue-400">PRJ-987654</td>
                                        <td className="py-4">Acme Corp</td>
                                        <td className="py-4"><span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-medium">Completed</span></td>
                                        <td className="py-4 text-gray-400 truncate max-w-[200px]">Corporate interview shots...</td>
                                        <td className="py-4 flex gap-2">
                                            <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition" title="Open Notion Record">Notion</a>
                                            <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-400 transition" title="Open Cloud Storage">Files</a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="glass-panel p-8 rounded-3xl">
                        <h3 className="text-lg font-semibold mb-4 text-white">System Status</h3>
                        <div className="flex flex-col gap-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Notion API</span>
                                <span className="text-emerald-400">Online</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Frame.io Integration</span>
                                <span className="text-yellow-400">Config Missing</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Nextcloud Storage</span>
                                <span className="text-emerald-400">Online</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-3xl">
                        <h3 className="text-lg font-semibold mb-4 text-white">Quick Actions</h3>
                        <div className="flex flex-col gap-3">
                            <button className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-xl transition text-sm">Generate New Client Portal Link</button>
                            <button className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-xl transition text-sm">Review Time Tracking Logs</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
