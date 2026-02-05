import React, { useState, useEffect } from 'react';
import { Domain, Goal, Task } from '../types';
import { Header } from '../components/Layout';
import { generateGoalPlan, suggestGoals, AIPlanResponse } from '../services/geminiService';
import { Wand2, RefreshCw, ChevronRight, X, Sparkles, CalendarDays, Repeat, ClipboardList } from 'lucide-react';

interface AIGoalSetupProps {
  domain: Domain;
  onGoalCreated: (goal: Goal) => void;
  onBack: () => void;
}

export default function AIGoalSetup({ domain, onGoalCreated, onBack }: AIGoalSetupProps) {
  const [userInput, setUserInput] = useState('');
  const [duration, setDuration] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [generatedPlan, setGeneratedPlan] = useState<AIPlanResponse | null>(null);
  
  // Load suggestions on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      setLoading(true);
      const items = await suggestGoals(domain);
      setSuggestions(items);
      setLoading(false);
    };
    loadSuggestions();
  }, [domain]);

  const handleGenerate = async () => {
    if (!userInput.trim()) return;
    setGenerating(true);
    const plan = await generateGoalPlan(domain, userInput, duration);
    if (plan) {
      setGeneratedPlan(plan);
    }
    setGenerating(false);
  };

  const handleConfirm = () => {
    if (!generatedPlan) return;

    // Generate the full task list
    const finalTasks: Task[] = [];
    let taskIdCounter = 0;

    // 1. Add Setup Tasks
    if (generatedPlan.setup_tasks) {
      generatedPlan.setup_tasks.forEach(task => {
        finalTasks.push({
          id: `t-${taskIdCounter++}`,
          title: `Setup: ${task}`,
          completed: false
        });
      });
    }

    // 2. Add Routine Tasks based on the cycle
    // Limit duration to 60 days max for this demo
    const actualDuration = Math.min(generatedPlan.duration_days || 30, 60);
    const cycle = generatedPlan.schedule_cycle || [];
    const cycleLength = cycle.length;
    
    if (cycleLength > 0) {
      for (let day = 1; day <= actualDuration; day++) {
        // 0-based index for the cycle array
        const cycleIndex = (day - 1) % cycleLength;
        const dayPlan = cycle[cycleIndex];
        
        if (dayPlan && dayPlan.tasks) {
          dayPlan.tasks.forEach(taskStr => {
            finalTasks.push({
              id: `t-${taskIdCounter++}`,
              // If it's a 1-day cycle, don't show "Day Title" if it's generic
              title: cycleLength > 1 
                ? `Day ${day} (${dayPlan.day_title}): ${taskStr}`
                : `Day ${day}: ${taskStr}`,
              completed: false
            });
          });
        }
      }
    }

    const newGoal: Goal = {
      id: Date.now().toString(),
      title: generatedPlan.title,
      domain: domain,
      progress: 0,
      streak: 0,
      completed: false,
      startDate: new Date().toISOString(),
      tasks: finalTasks
    };

    onGoalCreated(newGoal);
  };

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      <Header title="Set Your Goal" subtitle={`AI Coach for ${domain}`} onBack={onBack} />

      <div className="p-6 space-y-6 fade-in">
        
        {/* Input Section */}
        {!generatedPlan ? (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">What is your main goal?</label>
                <div className="relative">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="e.g., Build muscle, Learn Spanish..."
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duration (e.g. 14 days, 1 month)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 30 days..."
                    className="w-full p-4 pl-12 rounded-2xl border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all shadow-sm"
                  />
                  <CalendarDays size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <button 
                  onClick={handleGenerate}
                  disabled={generating || !userInput}
                  className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 mt-4"
              >
                {generating ? <RefreshCw className="animate-spin" size={20} /> : <Wand2 size={20} />}
                {generating ? 'Designing Detailed Plan...' : 'Create Action Plan'}
              </button>
            </div>

            {/* Suggestions */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Sparkles size={12} /> Popular in {domain}
              </p>
              <div className="flex flex-wrap gap-2">
                {loading ? (
                   <div className="text-sm text-slate-400 italic">Loading ideas...</div>
                ) : (
                  suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setUserInput(s)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-all shadow-sm"
                    >
                      {s}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          /* Plan Preview Section */
          <div className="space-y-6 fade-in">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex justify-between items-start">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{generatedPlan.title}</h2>
                    <span className="inline-block mt-2 px-3 py-1 bg-teal-50 text-teal-700 text-xs rounded-full font-bold uppercase tracking-wide border border-teal-100">{domain}</span>
                 </div>
                 <button onClick={() => setGeneratedPlan(null)} className="text-sm text-slate-400 hover:text-slate-600 underline">Edit</button>
              </div>
              
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl italic border border-slate-100">
                "{generatedPlan.description}"
              </p>

              {/* Setup Tasks */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold">
                   <ClipboardList size={16} className="text-teal-500" />
                   <h3>Initial Setup</h3>
                </div>
                {generatedPlan.setup_tasks && generatedPlan.setup_tasks.length > 0 ? (
                  <ul className="space-y-2 mb-3">
                    {generatedPlan.setup_tasks.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="bg-teal-100 text-teal-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{idx + 1}</span>
                        <span className="text-slate-700">{task}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400 italic mb-3">No setup tasks needed.</p>
                )}
              </div>

              {/* Recurring Habits / Cycle */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold">
                   <Repeat size={16} className="text-purple-500" />
                   <h3>{generatedPlan.schedule_cycle && generatedPlan.schedule_cycle.length > 1 ? 'Schedule Cycle' : 'Daily Routine'}</h3>
                </div>
                <div className="space-y-3">
                    {generatedPlan.schedule_cycle && generatedPlan.schedule_cycle.map((dayPlan, idx) => (
                      <div key={idx} className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <div className="flex items-center justify-between mb-2">
                           <span className="font-bold text-purple-800 text-sm">{generatedPlan.schedule_cycle.length > 1 ? `Day ${idx + 1}: ${dayPlan.day_title}` : 'Every Day'}</span>
                        </div>
                        <ul className="space-y-1.5 pl-2">
                           {dayPlan.tasks.map((t, i) => (
                             <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-purple-300 mt-1.5 shrink-0"></span>
                               <span>{t}</span>
                             </li>
                           ))}
                        </ul>
                      </div>
                    ))}
                </div>
              </div>

            </div>

            <button 
              onClick={handleConfirm}
              className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
            >
              Commit to Routine <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}