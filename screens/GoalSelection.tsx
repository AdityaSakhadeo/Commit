import React from 'react';
import { Domain } from '../types';
import { Header } from '../components/Layout';
import { Briefcase, BookOpen, Dumbbell, Heart, Wallet, Sparkles, Plus } from 'lucide-react';

interface GoalSelectionProps {
  onSelect: (domain: Domain) => void;
  onBack?: () => void;
}

export default function GoalSelection({ onSelect, onBack }: GoalSelectionProps) {
  const domains: { id: Domain; icon: React.ReactNode; color: string; bg: string }[] = [
    { id: 'Fitness', icon: <Dumbbell size={24} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'Career', icon: <Briefcase size={24} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'Learning', icon: <BookOpen size={24} />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'Mental Health', icon: <Heart size={24} />, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'Finance', icon: <Wallet size={24} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'Habits', icon: <Sparkles size={24} />, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="min-h-full bg-slate-50 pb-8">
      <Header title="Choose a Domain" subtitle="What area do you want to improve?" onBack={onBack} />
      
      <div className="p-6 grid grid-cols-2 gap-4 fade-in">
        {domains.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className="group flex flex-col items-start p-5 bg-white rounded-3xl shadow-sm border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all text-left"
          >
            <div className={`p-3 rounded-2xl ${d.bg} ${d.color} mb-4 group-hover:scale-110 transition-transform`}>
              {d.icon}
            </div>
            <span className="font-semibold text-slate-800">{d.id}</span>
            <span className="text-xs text-slate-400 mt-1">Start journey</span>
          </button>
        ))}
        
        <button
          onClick={() => onSelect('Habits')} // Defaulting to generic for custom
          className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-200 rounded-3xl hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-400"
        >
           <Plus size={32} />
           <span className="text-sm font-medium mt-2">Custom</span>
        </button>
      </div>
    </div>
  );
}