import React from 'react';
import { Activity } from 'lucide-react';

export const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-teal-500 to-teal-700 flex flex-col items-center justify-center text-white fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
        <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center relative z-10 animate-bounce">
           <Activity size={48} className="text-teal-600" />
        </div>
      </div>
      
      <div className="mt-8 text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Commit</h1>
        <p className="text-teal-100 font-medium tracking-wide text-sm uppercase">Progress Together</p>
      </div>

      <div className="absolute bottom-12 flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        <p className="text-xs text-white/80 font-medium">Preparing your journey...</p>
      </div>
    </div>
  );
};