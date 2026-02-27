import Link from "next/link";
import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-black/40">
      <div className="absolute top-0 right-0 p-8 flex gap-4">
        <Link href="/login" className="px-5 py-2 text-sm font-medium micro-hover border border-white/10 rounded-full hover:bg-white/10 transition-colors">
          Login
        </Link>
        <Link href="/register" className="px-5 py-2 text-sm font-medium btn-primary rounded-full">
          Start Project
        </Link>
      </div>

      <main className="max-w-4xl text-center flex flex-col items-center gap-8 mt-16 glass-panel p-16 rounded-[2.5rem]">
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white/80 to-blue-500/50 pb-2">
          Your Creative Vision.
          <br /> Brought to Life.
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
          Stunning photography and cinematic videography tailored to your needs.
          Manage your projects seamlessly through our dedicated client portal.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-md justify-center">
          <Link href="/register" className="glass-panel w-full px-8 py-4 rounded-xl text-center micro-hover hover:border-blue-500/50 transition-colors font-medium relative group overflow-hidden">
            <span className="relative z-10">Start Project</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Link>
          <Link href="/portfolio" className="glass-panel w-full px-8 py-4 rounded-xl text-center micro-hover hover:border-white/20 transition-colors font-medium">
            View Portfolio
          </Link>
        </div>
      </main>
    </div>
  );
}
