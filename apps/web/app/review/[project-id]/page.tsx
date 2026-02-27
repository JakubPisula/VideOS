import React from 'react';

interface ReviewPageProps {
    params: {
        'project-id': string;
    };
}

export default async function ReviewPage({ params }: ReviewPageProps) {
    const projectId = params['project-id'];

    // TODO: Fetch project details from Notion / Shared API
    // const projectData = await getProjectById(projectId);

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-[#0a0a0a] text-white">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-sans text-sm">
                <header className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tight">Project Review</h1>
                    <p className="text-gray-400 mt-2">Client review portal for ongoing video projects</p>
                </header>

                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">Project ID: {projectId}</h2>
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium border border-yellow-500/30">
                            Pending Review
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-gray-300">
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                            <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Frame.io Integration</span>
                            <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">Open in Frame.io &rarr;</a>
                        </div>
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                            <span className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Local Asset Path</span>
                            <code className="text-emerald-400 text-xs">/Volumes/Storage/Projects/{projectId}</code>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                        <h3 className="text-lg font-medium mb-4">Latest Render</h3>
                        <div className="aspect-video bg-black/60 rounded-xl flex items-center justify-center border border-white/5 overflow-hidden relative group cursor-pointer hover:border-white/20 transition-all">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all">
                                    <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[14px] border-l-white border-b-8 border-b-transparent ml-1"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
