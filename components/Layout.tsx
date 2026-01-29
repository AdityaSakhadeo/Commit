import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  hasNav?: boolean;
}

export const MobileContainer: React.FC<LayoutProps> = ({ children, className = '', hasNav = true }) => {
  return (
    <div className={`w-full max-w-md mx-auto bg-slate-50 min-h-screen relative shadow-2xl shadow-slate-200 flex flex-col ${className}`}>
      <div className={`flex-1 overflow-y-auto no-scrollbar ${hasNav ? 'pb-24' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export const Header: React.FC<{ title: string; subtitle?: string; onBack?: () => void }> = ({ title, subtitle, onBack }) => (
  <div className="px-6 pt-8 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100">
    <div className="flex items-center gap-3">
      {onBack && (
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      )}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
      </div>
    </div>
  </div>
);
