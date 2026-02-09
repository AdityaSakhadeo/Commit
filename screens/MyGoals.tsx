import React from 'react';
import { Goal } from '../types';
import { Header } from '../components/Layout';
import { Plus, Target, Flame, ChevronRight } from 'lucide-react';

interface MyGoalsProps {
  goals: Goal[];
  onGoalSelect: (goal: Goal) => void;
  onAddGoal: () => void;
}

export default function MyGoals({ goals, onGoalSelect, onAddGoal }: MyGoalsProps) {
  return (
    <div className="min-h-full bg-slate-50 pb-20">
      <Header title="My Goals" subtitle="Track your commitments" />
      
      <div className="p-6 space-y-4 animate-in fade-in">
        {goals.length === 0 ? (
           <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 mt-8">
             <Target size={48} className="mx-auto mb-4 opacity-20" />
             <h3 className="text-lg font-bold text-slate-600 mb-2">No active goals</h3>
             <p className="text-sm mb-6">Start a new journey today.</p>
             <button 
               onClick={onAddGoal}
               className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-200 hover:scale-105 transition-transform"
             >
               Create Goal
             </button>
           </div>
        ) : (
          <>
            {goals.map(goal => (
              <button 
                key={goal.id} 
                onClick={() => onGoalSelect(goal)}
                className="w-full group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all flex items-center justify-between text-left"
              >
                <div className="flex-1">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 mb-2 uppercase tracking-wide group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">{goal.domain}</span>
                  <h4 className="font-bold text-slate-800 text-lg">{goal.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Flame size={12} className={goal.streak > 0 ? "text-orange-500" : ""} /> {goal.streak} day streak
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="relative w-12 h-12 flex items-center justify-center">
                       <svg className="w-full h-full transform -rotate-90">
                         <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                         <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-teal-500 transition-all duration-1000" strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * goal.progress) / 100} strokeLinecap="round" />
                       </svg>
                       <span className="absolute text-[10px] font-bold text-slate-700">{goal.progress}%</span>
                   </div>
                   <ChevronRight size={20} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                </div>
              </button>
            ))}

            <button 
               onClick={onAddGoal}
               className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:bg-white hover:border-teal-300 hover:text-teal-600 transition-all flex items-center justify-center gap-2 font-bold mt-4"
            >
              <Plus size={20} /> Add New Goal
            </button>
          </>
        )}
      </div>
    </div>
  );
}