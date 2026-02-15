import React, { useState, useEffect, useRef } from 'react';
import { Goal, Task } from '../types';
import { Header } from '../components/Layout';
import { Check, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ArrowLeft, Trophy, Flame, Sparkles, Zap, List, MessageCircle, Send, Bot, Lock, Clock, SkipForward, Play, Pause, RotateCcw } from 'lucide-react';
import { getGoalCoachTip, chatWithDayCoach } from '../services/geminiService';

interface GoalDetailProps {
  goal: Goal;
  onToggleTask: (goalId: string, taskId: string) => void;
  onBack: () => void;
  onUpdateTasks?: (goalId: string, dayNumber: number, newTasks: string[]) => void;
  onSkipDay: (goalId: string, date: Date) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  isSystem?: boolean;
}

// Timer Component
const FocusTimer = ({ onClose }: { onClose: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6 animate-in fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-xs p-8 flex flex-col items-center relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
        <h3 className="text-xl font-bold text-slate-800 mb-6">Focus Timer</h3>
        <div className="text-6xl font-mono font-bold text-slate-900 mb-8 tracking-wider">
          {formatTime(timeLeft)}
        </div>
        <div className="flex gap-4">
          <button onClick={toggleTimer} className={`p-4 rounded-full text-white transition-all shadow-lg hover:scale-105 active:scale-95 ${isActive ? 'bg-amber-500 shadow-amber-200' : 'bg-teal-500 shadow-teal-200'}`}>
            {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
          </button>
          <button onClick={resetTimer} className="p-4 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
            <RotateCcw size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function GoalDetail({ goal, onToggleTask, onBack, onUpdateTasks, onSkipDay }: GoalDetailProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewSetup, setViewSetup] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  
  // AI Tip
  const [aiTip, setAiTip] = useState<string>('');
  const [loadingTip, setLoadingTip] = useState(false);

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Safety check
  if (!goal) return null;

  useEffect(() => {
    const loadTip = async () => {
      if (!goal.id) return;
      setLoadingTip(true);
      const tip = await getGoalCoachTip(goal.title, goal.domain, goal.progress);
      setAiTip(tip);
      setLoadingTip(false);
    };
    loadTip();
  }, [goal.id, goal.title, goal.domain, goal.progress]);

  useEffect(() => {
    if (showChat) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

  // Calendar Logic
  let startDate = new Date(goal.startDate);
  if (isNaN(startDate.getTime())) {
    startDate = new Date(); // Fallback
  }
  startDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse skipped dates for easier lookup
  const skippedDatesSet = new Set((goal.skippedDates || []).map(d => new Date(d).setHours(0,0,0,0)));

  // Calculate Goal Duration / Range
  const taskDays = goal.tasks.map(t => {
      const match = t.title.match(/^Day (\d+)/);
      return match ? parseInt(match[1]) : 0;
  });
  const maxDayTaskIndex = Math.max(0, ...taskDays);
  
  // Total days to display = Task Days + Skipped Days so far (since skips extend the calendar)
  const totalDaysNeeded = maxDayTaskIndex + (goal.skippedDates?.length || 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Math.max(0, totalDaysNeeded - 1));
  endDate.setHours(23, 59, 59, 999);

  // Helper: Count how many skips happened ON or BEFORE this specific date
  const getSkipsBeforeOrOn = (date: Date) => {
    const checkTime = date.getTime();
    return (goal.skippedDates || []).filter(d => {
      const skipTime = new Date(d).setHours(0,0,0,0);
      return skipTime <= checkTime;
    }).length;
  };

  const getDayTasks = (date: Date) => {
    if (!date) return { dayNum: 0, tasks: [], isSkipped: false, effectiveDayNum: 0 };
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    
    // Check if THIS specific date is skipped
    const isSkipped = skippedDatesSet.has(d.getTime());
    
    const oneDay = 24 * 60 * 60 * 1000;
    const diffTime = d.getTime() - startDate.getTime();
    
    // Raw calendar days since start
    const daysSinceStart = Math.floor(diffTime / oneDay) + 1;
    
    if (isSkipped) {
      return { dayNum: daysSinceStart, tasks: [], isSkipped: true, effectiveDayNum: 0 };
    }

    // Task Shift Logic:
    // The "Task Day" we should show is (CalendarDaysSinceStart) - (SkipsThatHappenedBeforeToday)
    // If today is skipped, we handled it above.
    const skipsPrior = getSkipsBeforeOrOn(new Date(d.getTime() - oneDay)); // strictly before today
    const effectiveDayNum = daysSinceStart - skipsPrior;
    
    const dayTasks = (goal.tasks || []).filter(t => {
       if (!t.title) return false;
       const prefix = `Day ${effectiveDayNum}`;
       return t.title.startsWith(`${prefix}:`) || t.title.startsWith(`${prefix} `);
    });
    
    return { dayNum: daysSinceStart, tasks: dayTasks, isSkipped: false, effectiveDayNum };
  };

  const getDayStatus = (date: Date) => {
    const { tasks, isSkipped } = getDayTasks(date);
    
    if (isSkipped) return 'skipped';
    
    // Check if in goal range
    // Allow seeing past even if before startDate if user hacked it, but generally range is startDate -> Today -> Future
    if (date < startDate) return 'out-of-range';

    if (tasks.length === 0) return 'none'; // No tasks mapped to this day (could be end of goal)

    const completed = tasks.filter(t => t.completed).length;
    if (completed === tasks.length) return 'complete';
    if (completed > 0) return 'partial';
    if (date < today) return 'missed';
    return 'pending';
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedDate) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userMsg }]);
    setChatLoading(true);

    const { effectiveDayNum, tasks } = getDayTasks(selectedDate);
    
    const response = await chatWithDayCoach(goal.title, goal.domain, effectiveDayNum, tasks, userMsg);
    
    setChatLoading(false);
    setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'coach', text: response.message }]);

    if (response.suggested_tasks && response.suggested_tasks.length > 0 && onUpdateTasks) {
       onUpdateTasks(goal.id, effectiveDayNum, response.suggested_tasks);
       
       const tasksList = response.suggested_tasks.map(t => `• ${t}`).join('\n');
       
       setTimeout(() => {
          setChatMessages(prev => [...prev, { 
             id: (Date.now() + 2).toString(), 
             sender: 'coach', 
             text: `I've updated your plan for today:\n${tasksList}`,
             isSystem: true
          }]);
       }, 500);
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const padDays = firstDay.getDay();
    for (let i = 0; i < padDays; i++) {
      days.push(null);
    }
    const numDays = lastDay.getDate();
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(year, month, i));
    }

    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-2 text-slate-400 hover:text-slate-800"><ChevronLeft size={20} /></button>
          <h3 className="font-bold text-slate-800 text-lg">{monthName}</h3>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-2 text-slate-400 hover:text-slate-800"><ChevronRight size={20} /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-center text-xs font-bold text-slate-300 py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
          {days.map((date, i) => {
            if (!date) return <div key={i} className="aspect-square" />;
            
            date.setHours(0, 0, 0, 0);
            
            const status = getDayStatus(date);
            const isToday = date.getTime() === today.getTime();
            const isSelected = selectedDate?.getTime() === date.getTime();
            const inRange = date >= startDate; // Allow clicking future to see plan
            
            let bgClass = 'bg-transparent text-slate-300';
            
            if (inRange) {
                if (status === 'skipped') bgClass = 'bg-slate-100 text-slate-400 border border-dashed border-slate-300';
                else if (status === 'complete') bgClass = 'bg-teal-500 text-white shadow-md shadow-teal-200';
                else if (status === 'partial') bgClass = 'bg-orange-100 text-orange-600 border border-orange-200';
                else if (status === 'missed') bgClass = 'bg-red-50 text-red-400 border border-red-100';
                else if (isToday) bgClass = 'bg-slate-900 text-white shadow-lg';
                else if (status === 'pending' || status === 'none') bgClass = 'bg-white border border-slate-200 text-slate-600';
            } else {
                 bgClass = 'opacity-30 text-slate-300'; // Before start
            }

            return (
              <button
                key={i}
                onClick={() => inRange && setSelectedDate(date)}
                disabled={!inRange}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-bold relative transition-all ${bgClass} ${isSelected ? 'ring-2 ring-offset-2 ring-slate-900 z-10' : ''}`}
              >
                {date.getDate()}
                {status !== 'none' && status !== 'out-of-range' && status !== 'missed' && status !== 'pending' && status !== 'skipped' && (
                  <div className="w-1 h-1 rounded-full bg-current opacity-50 mt-1"></div>
                )}
                {status === 'skipped' && <SkipForward size={10} className="mt-1 opacity-50" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Setup Tasks View
  if (viewSetup) {
    const setupTasks = (goal.tasks || []).filter(t => t.title && t.title.startsWith('Setup:'));
    return (
      <div className="min-h-full bg-slate-50 pb-20">
        <Header title="Setup Tasks" onBack={() => setViewSetup(false)} />
        <div className="p-6">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
             <div className="flex items-center gap-3 mb-6">
               <div className="p-3 bg-teal-50 text-teal-600 rounded-xl"><Sparkles size={24} /></div>
               <div>
                 <h2 className="text-xl font-bold text-slate-800">Get Ready</h2>
                 <p className="text-slate-500 text-sm">One-time preparation tasks.</p>
               </div>
             </div>
             <div className="space-y-3">
               {setupTasks.length > 0 ? setupTasks.map(task => (
                 <button
                   key={task.id}
                   onClick={() => onToggleTask(goal.id, task.id)}
                   className={`w-full flex items-center p-4 rounded-xl border text-left transition-all ${
                     task.completed ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-100 hover:border-teal-200'
                   }`}
                 >
                   <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${
                     task.completed ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300'
                   }`}>
                     {task.completed && <Check size={14} />}
                   </div>
                   <span className={`font-medium ${task.completed ? 'text-teal-800 line-through' : 'text-slate-700'}`}>
                     {task.title.replace('Setup: ', '')}
                   </span>
                 </button>
               )) : (
                 <p className="text-slate-400 italic text-center p-4">No setup tasks for this goal.</p>
               )}
             </div>
           </div>
        </div>
      </div>
    );
  }

  // Day Detail View (Drill Down)
  if (selectedDate) {
    const { effectiveDayNum, tasks, isSkipped } = getDayTasks(selectedDate);
    const dateStr = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const isToday = selectedDate.getTime() === today.getTime();
    const isFuture = selectedDate > today;
    const allDone = tasks.length > 0 && tasks.every(t => t.completed);

    const skipsUsed = (goal.skippedDates || []).length;
    const skipsLeft = Math.max(0, (goal.totalSkipsAllowed || 0) - skipsUsed);

    return (
      <div className="min-h-full bg-slate-50 flex flex-col relative">
        <div className="bg-white sticky top-0 z-20 px-6 py-4 border-b border-slate-100 flex items-center gap-4 justify-between">
           <div className="flex items-center gap-4">
             <button onClick={() => setSelectedDate(null)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600">
               <ArrowLeft size={24} />
             </button>
             <div>
               <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                 {isSkipped ? 'Skipped' : `Day ${effectiveDayNum}`}
               </div>
               <div className="text-lg font-bold text-slate-800">{dateStr}</div>
             </div>
           </div>
           <div className="flex gap-2">
             {isToday && !isSkipped && (
               <button onClick={() => setShowTimer(true)} className="p-2 bg-amber-50 text-amber-600 rounded-full hover:bg-amber-100 transition-colors">
                 <Clock size={24} />
               </button>
             )}
             {/* Header Chat Button */}
             <button onClick={() => setShowChat(true)} className="p-2 bg-teal-50 text-teal-600 rounded-full hover:bg-teal-100">
               <Bot size={24} />
             </button>
           </div>
        </div>

        <div className="p-6 flex-1 flex flex-col pb-24">
           {isSkipped ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center">
               <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                 <SkipForward size={40} />
               </div>
               <h3 className="text-xl font-bold text-slate-700">Rest Day</h3>
               <p className="text-slate-500 mt-2 max-w-xs mx-auto">You used a skip for this day. Enjoy your break and come back stronger!</p>
               <button onClick={() => setSelectedDate(null)} className="mt-8 text-teal-600 font-bold hover:underline">Return to Calendar</button>
             </div>
           ) : (
             <>
               {!isToday && (
                 <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2 text-amber-700 text-sm font-medium">
                   {isFuture ? <Clock size={16} /> : <Lock size={16} />}
                   <span>{isFuture ? "This day is in the future." : "This day has passed."} Tasks are read-only.</span>
                 </div>
               )}

               {tasks.length > 0 ? (
                 <>
                   <div className="mb-8">
                     <div className={`rounded-3xl p-6 text-white shadow-xl relative overflow-hidden ${
                        isToday ? 'bg-gradient-to-br from-slate-900 to-slate-800 shadow-slate-200' : 'bg-slate-200 shadow-none'
                     }`}>
                        <div className="absolute top-0 right-0 p-6 opacity-10"><Zap size={100} className={isToday ? "text-white" : "text-slate-500"} /></div>
                        <div className="relative z-10">
                          <h2 className={`text-2xl font-bold mb-2 ${isToday ? 'text-white' : 'text-slate-500'}`}>
                            {isToday ? "Today's Focus" : "Daily Plan"}
                          </h2>
                          <p className={`leading-relaxed ${isToday ? 'text-slate-300' : 'text-slate-400'}`}>
                            {isToday 
                              ? "Consistency is what turns average into excellence. Complete these habits to win the day."
                              : "View the tasks scheduled for this day."}
                          </p>
                        </div>
                     </div>
                   </div>

                   <div className="space-y-4 mb-8">
                     {tasks.map(task => (
                       <button
                         key={task.id}
                         onClick={() => isToday && onToggleTask(goal.id, task.id)}
                         disabled={!isToday}
                         className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between group text-left ${
                           task.completed 
                             ? 'bg-teal-50 border-teal-500 shadow-none' 
                             : isToday 
                                ? 'bg-white border-slate-100 shadow-sm hover:border-teal-200 hover:shadow-md'
                                : 'bg-slate-50 border-slate-100 opacity-70 cursor-not-allowed'
                         }`}
                       >
                         <div className="flex items-center gap-4 flex-1">
                           <div className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                             task.completed 
                               ? 'bg-teal-500 border-teal-500 text-white' 
                               : isToday
                                 ? 'bg-slate-50 border-slate-200 text-transparent group-hover:border-teal-300'
                                 : 'bg-slate-100 border-slate-200 text-transparent'
                           }`}>
                             <Check size={16} strokeWidth={3} />
                           </div>
                           <div className="flex-1">
                              <p className={`font-bold text-lg transition-colors ${task.completed ? 'text-teal-900' : 'text-slate-800'}`}>
                                 {task.title ? task.title.replace(/^Day \d+.*?: /, '') : 'Untitled Task'}
                              </p>
                              {task.completed && <p className="text-xs text-teal-600 font-bold uppercase tracking-wider mt-0.5">Completed</p>}
                           </div>
                           {!isToday && !task.completed && (
                             <Lock size={16} className="text-slate-300" />
                           )}
                         </div>
                       </button>
                     ))}
                   </div>

                   {/* Skip Button (Only Today, Not Done) */}
                   {isToday && !allDone && (
                      <div className="mb-8">
                         <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
                           <span>Difficulty keeping up?</span>
                           <span>{skipsLeft} Skips Left</span>
                         </div>
                         <button 
                           onClick={() => {
                             if(skipsLeft > 0) {
                               onSkipDay(goal.id, selectedDate);
                               setSelectedDate(null); // Go back to calendar to see update
                             }
                           }}
                           disabled={skipsLeft === 0}
                           className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-400 hover:text-slate-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                         >
                           <SkipForward size={18} />
                           {skipsLeft > 0 ? "Skip this Day (Shift Tasks)" : "No Skips Remaining"}
                         </button>
                         <p className="text-[10px] text-slate-400 text-center mt-2">Skipping shifts today's tasks to tomorrow and pauses your streak.</p>
                      </div>
                   )}

                   {allDone && isToday && (
                      <div className="mt-auto animate-in slide-in-from-bottom fade-in duration-500">
                        <div className="bg-green-50 border border-green-100 rounded-3xl p-6 text-center">
                           <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                             <Trophy size={32} />
                           </div>
                           <h3 className="text-xl font-bold text-green-800 mb-1">Day Complete!</h3>
                           <p className="text-green-600">Great work keeping your streak alive.</p>
                           <button onClick={() => setSelectedDate(null)} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-full font-bold shadow-lg shadow-green-200 hover:scale-105 transition-transform">
                             Back to Calendar
                           </button>
                        </div>
                      </div>
                   )}
                 </>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center">
                    <CalendarIcon size={48} className="mb-4 opacity-20" />
                    <p>No tasks scheduled for this day.</p>
                    {isToday && (
                      <button 
                        onClick={() => setShowChat(true)} 
                        className="mt-6 px-6 py-3 bg-teal-600 text-white rounded-full font-bold shadow-lg shadow-teal-200 flex items-center gap-2"
                      >
                        <Bot size={20} /> Ask Coach to Plan Day
                      </button>
                    )}
                 </div>
               )}
             </>
           )}
        </div>

        {/* Coach Floating Button */}
        <button 
          onClick={() => setShowChat(true)}
          className="fixed bottom-24 right-6 bg-teal-600 text-white px-5 py-4 rounded-full shadow-xl shadow-teal-600/30 hover:scale-105 active:scale-95 transition-all z-40 flex items-center gap-2 font-bold"
        >
          <MessageCircle size={24} />
          Take Help
        </button>

        {/* Focus Timer Modal */}
        {showTimer && <FocusTimer onClose={() => setShowTimer(false)} />}

        {/* Chat Bottom Sheet */}
        {showChat && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white rounded-t-[2.5rem] h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                
                {/* Chat Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100">
                       <Bot size={24} />
                     </div>
                     <div>
                       <h3 className="font-bold text-slate-800 text-lg">Coach AI</h3>
                       <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                         <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online • Day {effectiveDayNum} Context
                       </p>
                     </div>
                   </div>
                   <button onClick={() => setShowChat(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100">
                     <X size={24} />
                   </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                   {chatMessages.length === 0 && (
                     <div className="text-center text-slate-400 my-8">
                       <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                         <Sparkles size={32} className="text-teal-400" />
                       </div>
                       <h4 className="font-bold text-slate-700 mb-2">How can I help with Day {effectiveDayNum}?</h4>
                       <p className="text-sm max-w-xs mx-auto mb-6">Ask for advice on exercises, tips for focus, or request to modify today's plan.</p>
                       {!isToday && (
                          <div className="bg-amber-50 p-2 rounded-lg text-amber-600 text-xs mb-4 inline-block">
                             Note: You are viewing a {isFuture ? 'future' : 'past'} date. I can give advice, but editing this day is restricted.
                          </div>
                       )}
                       <div className="flex flex-wrap gap-2 justify-center">
                         <button onClick={() => setChatInput("Make today's tasks harder")} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium hover:border-teal-400 hover:text-teal-600 transition-colors">💪 Make it harder</button>
                         <button onClick={() => setChatInput("I don't have much time today")} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium hover:border-teal-400 hover:text-teal-600 transition-colors">⏱️ Short on time</button>
                         <button onClick={() => setChatInput("Why is this important?")} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium hover:border-teal-400 hover:text-teal-600 transition-colors">🤔 Why this task?</button>
                       </div>
                     </div>
                   )}
                   
                   {chatMessages.map(msg => (
                     <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                         msg.isSystem 
                           ? 'bg-blue-50 text-blue-800 border border-blue-100 w-full text-center' 
                           : msg.sender === 'user' 
                             ? 'bg-teal-600 text-white rounded-br-none shadow-md shadow-teal-100' 
                             : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none shadow-sm'
                       }`}>
                         {msg.text}
                       </div>
                     </div>
                   ))}

                   {chatLoading && (
                     <div className="flex justify-start">
                        <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm flex gap-1">
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                     </div>
                   )}
                   <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100 pb-8">
                   <div className="relative">
                     <input
                       type="text"
                       value={chatInput}
                       onChange={(e) => setChatInput(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                       placeholder="Message your coach..."
                       className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-base"
                     />
                     <button 
                       onClick={handleSendMessage}
                       disabled={!chatInput.trim() || chatLoading}
                       className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 transition-colors shadow-sm"
                     >
                       <Send size={20} />
                     </button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  // Main Calendar View - Code unchanged but included for file completeness
  const setupPendingCount = (goal.tasks || []).filter(t => t.title && t.title.startsWith('Setup:') && !t.completed).length;

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      <Header title="Goal Progress" subtitle={goal.title} onBack={onBack} />
      
      <div className="p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Progress Summary */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                    <circle cx="32" cy="32" r="28" stroke="#14b8a6" strokeWidth="6" fill="transparent" strokeDasharray={175.9} strokeDashoffset={175.9 - (175.9 * goal.progress) / 100} strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-sm font-bold text-slate-700">{goal.progress}%</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Consistency</p>
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xl">
                  <Flame size={20} className={goal.streak > 0 ? "text-orange-500 fill-orange-500" : "text-slate-300"} />
                  {goal.streak} Day Streak
                </div>
              </div>
           </div>
        </div>
        
        {/* Setup Tasks Banner */}
        <button 
          onClick={() => setViewSetup(true)}
          className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${
            setupPendingCount > 0 
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200' 
              : 'bg-white border border-slate-100 text-slate-500'
          }`}
        >
           <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl ${setupPendingCount > 0 ? 'bg-white/20' : 'bg-slate-100'}`}>
               <List size={20} />
             </div>
             <div className="text-left">
               <p className="font-bold text-sm">Setup Tasks</p>
               <p className={`text-xs ${setupPendingCount > 0 ? 'text-blue-100' : 'text-slate-400'}`}>
                 {setupPendingCount > 0 ? `${setupPendingCount} tasks remaining` : 'All prepared!'}
               </p>
             </div>
           </div>
           <ChevronRight size={20} className={setupPendingCount > 0 ? 'text-blue-100' : 'text-slate-300'} />
        </button>

        {/* AI Tip */}
        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-3xl flex gap-3 items-start">
           <Zap size={20} className="text-indigo-500 shrink-0 mt-0.5" fill="currentColor" />
           <p className="text-sm text-indigo-900 font-medium italic">
              {loadingTip ? "Coach is thinking..." : `"${aiTip}"`}
           </p>
        </div>

        {/* Calendar */}
        {renderCalendar()}

        {/* Legend */}
        <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-wrap">
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-teal-500"></div> Done</div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-200"></div> Partial</div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-900"></div> Today</div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300 border border-dashed border-slate-400"></div> Skip</div>
        </div>

      </div>
    </div>
  );
}