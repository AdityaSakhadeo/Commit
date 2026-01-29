import React from 'react';
import { ArrowRight, Activity, Users } from 'lucide-react';

export default function Onboarding({ onStart }: { onStart: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-between p-8 bg-gradient-to-b from-teal-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 w-full">
        <div className="w-full relative h-64 flex items-center justify-center">
            {/* Abstract Shapes */}
            <div className="absolute top-0 right-10 w-32 h-32 bg-teal-200/40 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-10 w-40 h-40 bg-purple-200/40 rounded-full blur-3xl"></div>
            
            {/* Icon Graphic */}
            <div className="relative bg-white p-8 rounded-[2rem] shadow-xl shadow-teal-100 flex flex-col items-center gap-4 border border-slate-50">
               <div className="flex -space-x-4">
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center">
                    <span className="text-xl">👩‍💻</span>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center">
                    <span className="text-xl">🏋️‍♂️</span>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-teal-100 flex items-center justify-center text-teal-600">
                    <Activity size={20} />
                  </div>
               </div>
               <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full w-2/3 bg-teal-500 rounded-full"></div>
               </div>
               <div className="text-xs text-slate-400 font-medium">Progress Together</div>
            </div>
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Commit. Progress. <br />
            <span className="text-teal-600">Achieve.</span>
          </h1>
          <p className="text-slate-500 leading-relaxed max-w-xs mx-auto">
            The social productivity app that turns personal goals into shared success stories.
          </p>
        </div>
      </div>

      <div className="w-full space-y-4">
        <button 
          onClick={onStart}
          className="w-full py-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-2xl font-semibold shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all"
        >
          Get Started <ArrowRight size={20} />
        </button>
        <button className="w-full py-4 text-slate-500 font-medium hover:text-slate-900 transition-colors">
          Already have an account? Login
        </button>
      </div>
    </div>
  );
}