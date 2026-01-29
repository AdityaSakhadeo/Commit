import React, { useState, useEffect } from 'react';
import { Screen, Domain, Goal, Post, User, Reward, Task } from './types';
import { MobileContainer, Header } from './components/Layout';
import { BottomNav } from './components/BottomNav';
import { PartyPopper, Gift, X } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';

// Screens
import Onboarding from './screens/Onboarding';
import GoalSelection from './screens/GoalSelection';
import AIGoalSetup from './screens/AIGoalSetup';
import HomeFeed from './screens/HomeFeed';
import CreatePost from './screens/CreatePost';
import GoalDetail from './screens/GoalDetail';
import Rewards from './screens/Rewards';
import Profile from './screens/Profile';

// Mock Data
const MOCK_USER: User = {
  id: 'u1',
  name: 'Alex Rivera',
  bio: 'Building better habits, one day at a time.',
  avatar: 'https://picsum.photos/200',
  stats: {
    goalsCompleted: 3,
    currentStreak: 12,
    totalDays: 45
  }
};

const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'u2',
    userName: 'Sarah Jenkins',
    userAvatar: 'https://picsum.photos/201',
    domain: 'Fitness',
    type: 'UPDATE',
    content: 'Just finished my 5k run! Feeling exhausted but accomplished. 🏃‍♀️💨',
    likes: 24,
    comments: 4,
    timestamp: '2h ago',
    progressUpdate: 65,
    image: 'https://picsum.photos/800/600'
  },
  {
    id: 'p2',
    userId: 'u3',
    userName: 'Mike Chen',
    userAvatar: 'https://picsum.photos/202',
    domain: 'Learning',
    type: 'STARTED',
    content: 'Starting my journey to learn Python today. Wish me luck!',
    likes: 56,
    comments: 12,
    timestamp: '5h ago'
  }
];

const MOCK_REWARDS: Reward[] = [
  { id: 'r1', title: 'Free Espresso', brand: 'Coffee House', logo: '☕', validity: 'Valid 7 Days', unlocked: true },
  { id: 'r2', title: '20% Off Gym Gear', brand: 'FitStore', logo: '💪', validity: 'Valid 30 Days', unlocked: true },
  { id: 'r3', title: 'Free Audiobook', brand: 'Audible', logo: '🎧', validity: 'Locked', unlocked: false },
  { id: 'r4', title: 'Healthy Meal Box', brand: 'FreshEats', logo: '🥗', validity: 'Locked', unlocked: false },
];

// Simple confetti component replacement
const ConfettiRain = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
    {[...Array(20)].map((_, i) => (
      <div 
        key={i}
        className="absolute animate-bounce"
        style={{
          left: `${Math.random() * 100}%`,
          top: `-20px`,
          animationDuration: `${2 + Math.random() * 3}s`,
          animationDelay: `${Math.random() * 2}s`
        }}
      >
         <div 
           className="w-3 h-3 rounded-full" 
           style={{ backgroundColor: ['#FCD34D', '#F87171', '#60A5FA', '#34D399'][Math.floor(Math.random() * 4)] }} 
         />
      </div>
    ))}
  </div>
);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>(Screen.ONBOARDING);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [rewards, setRewards] = useState<Reward[]>(MOCK_REWARDS);
  const [user, setUser] = useState<User>(MOCK_USER);
  const [showCelebration, setShowCelebration] = useState(false);
  const [justCompletedGoal, setJustCompletedGoal] = useState<Goal | null>(null);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Helper to add a goal
  const handleAddGoal = (goal: Goal) => {
    setGoals(prev => [goal, ...prev]);
    setActiveGoal(goal);
    
    // Auto-create a "Started" post
    const newPost: Post = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      domain: goal.domain,
      type: 'STARTED',
      content: `I just committed to a new goal: ${goal.title}. Let's do this! 💪`,
      likes: 0,
      comments: 0,
      timestamp: 'Just now'
    };
    setPosts(prev => [newPost, ...prev]);
    setScreen(Screen.HOME);
  };

  const handlePostCreate = (post: Post) => {
    setPosts(prev => [post, ...prev]);
    setScreen(Screen.HOME);
  };

  const handleTaskToggle = (goalId: string, taskId: string) => {
    let goalCompleted = false;
    let completedGoalObj: Goal | null = null;

    setGoals(prevGoals => {
      return prevGoals.map(goal => {
        if (goal.id !== goalId) return goal;

        const updatedTasks = goal.tasks.map(t =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );

        const completedCount = updatedTasks.filter(t => t.completed).length;
        const progress = Math.round((completedCount / updatedTasks.length) * 100);

        // Streak Logic: If we toggle a task to TRUE, increment streak if it wasn't already incremented? 
        // For simplicity: specific streak logic can be complex, here we just check if progress improved.
        const taskJustCompleted = updatedTasks.find(t => t.id === taskId)?.completed;
        const newStreak = taskJustCompleted ? goal.streak + 1 : Math.max(0, goal.streak - 1);

        const updatedGoal = { ...goal, tasks: updatedTasks, progress, streak: newStreak, completed: progress === 100 };

        if (progress === 100 && goal.progress < 100) {
          goalCompleted = true;
          completedGoalObj = updatedGoal;
        }

        return updatedGoal;
      });
    });

    if (goalCompleted && completedGoalObj) {
      setJustCompletedGoal(completedGoalObj);
      setShowCelebration(true);
      
      // Unlock reward logic
      setRewards(prev => {
        const locked = prev.filter(r => !r.unlocked);
        if (locked.length > 0) {
          const toUnlock = locked[0];
          return prev.map(r => r.id === toUnlock.id ? { ...r, unlocked: true } : r);
        }
        return prev;
      });
      
      setUser(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          goalsCompleted: prev.stats.goalsCompleted + 1
        }
      }));
    }
  };

  const handleUpdateDayTasks = (goalId: string, dayNumber: number, newTasks: string[]) => {
    setGoals(prevGoals => {
      return prevGoals.map(goal => {
        if (goal.id !== goalId) return goal;

        // Filter OUT the old tasks for this specific day
        const prefix = `Day ${dayNumber}`;
        const otherTasks = goal.tasks.filter(t => !t.title.startsWith(`${prefix}:`) && !t.title.startsWith(`${prefix} `));

        // Create new tasks objects
        const addedTasks: Task[] = newTasks.map((txt, idx) => ({
          id: `t-updated-${Date.now()}-${idx}`,
          title: `Day ${dayNumber}: ${txt}`,
          completed: false
        }));

        const updatedTasks = [...otherTasks, ...addedTasks];
        // Sort to keep order? simplified: just appending/filtering is risky for order, but functionally ok.
        // Better to insert them where the old ones were? Too complex for this demo. Appending is fine as long as list view sorts or filters correctly.

        return { ...goal, tasks: updatedTasks };
      });
    });
  };

  const closeCelebration = (goToRewards: boolean) => {
    setShowCelebration(false);
    if (goToRewards) {
      setScreen(Screen.REWARDS);
    } else {
      setScreen(Screen.HOME);
    }
  };

  const handleProfileGoalSelect = (goal: Goal) => {
    setActiveGoal(goal);
    setScreen(Screen.GOAL_DETAIL);
  };

  const renderScreen = () => {
    switch (screen) {
      case Screen.ONBOARDING:
        return <Onboarding onStart={() => setScreen(Screen.GOAL_SELECTION)} />;
      case Screen.GOAL_SELECTION:
        return (
          <GoalSelection 
            onSelect={(domain) => {
              setSelectedDomain(domain);
              setScreen(Screen.AI_SETUP);
            }} 
            onBack={goals.length > 0 ? () => setScreen(Screen.HOME) : undefined}
          />
        );
      case Screen.AI_SETUP:
        return (
          <AIGoalSetup 
            domain={selectedDomain || 'Habits'} 
            onGoalCreated={handleAddGoal} 
            onBack={() => setScreen(Screen.GOAL_SELECTION)}
          />
        );
      case Screen.HOME:
        return (
          <HomeFeed 
            posts={posts} 
            activeGoals={goals} 
            user={user}
            onEncourage={(id) => console.log('Liked', id)} 
            onViewGoal={handleProfileGoalSelect}
            onToggleTask={handleTaskToggle}
          />
        );
      case Screen.CREATE_POST:
        return (
          <CreatePost 
            user={user} 
            activeGoals={goals} 
            onPost={handlePostCreate} 
            onCancel={() => setScreen(Screen.HOME)}
          />
        );
      case Screen.GOAL_DETAIL:
        return activeGoal ? (
          <GoalDetail 
            goal={goals.find(g => g.id === activeGoal.id) || activeGoal} 
            onToggleTask={handleTaskToggle}
            onBack={() => setScreen(Screen.HOME)}
            onUpdateTasks={handleUpdateDayTasks}
          />
        ) : (
           <GoalSelection onSelect={() => {}} /> 
        );
      case Screen.REWARDS:
        return <Rewards rewards={rewards} />;
      case Screen.PROFILE:
        return <Profile user={user} goals={goals} onGoalSelect={handleProfileGoalSelect} />;
      default:
        return <HomeFeed posts={posts} activeGoals={goals} user={user} onEncourage={() => {}} onViewGoal={handleProfileGoalSelect} onToggleTask={handleTaskToggle} />;
    }
  };

  if (loading) {
    return <SplashScreen />;
  }

  const showNav = screen !== Screen.ONBOARDING && screen !== Screen.AI_SETUP;

  return (
    <MobileContainer hasNav={showNav}>
      {renderScreen()}
      {showNav && <BottomNav currentScreen={screen} onNavigate={setScreen} />}
      
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 fade-in">
           <ConfettiRain />
           <div className="bg-white rounded-[2.5rem] p-8 text-center w-full max-w-sm relative shadow-2xl transform scale-100 transition-all">
              <button 
                onClick={() => closeCelebration(false)} 
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500"
              >
                <X size={24} />
              </button>
              
              <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
                <PartyPopper size={40} />
              </div>
              
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Goal Crushed!</h2>
              <p className="text-slate-500 mb-8">
                You completed <span className="text-teal-600 font-bold">{justCompletedGoal?.title}</span>. 
                That's a huge milestone!
              </p>
              
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4 rounded-2xl text-white mb-6 shadow-lg shadow-purple-200">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-white/20 rounded-xl">
                     <Gift size={24} />
                   </div>
                   <div className="text-left">
                     <p className="text-xs font-medium text-purple-100">Reward Unlocked</p>
                     <p className="font-bold">New Voucher Available</p>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => closeCelebration(true)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/20 hover:scale-105 transition-transform"
              >
                Claim Reward
              </button>
           </div>
        </div>
      )}
    </MobileContainer>
  );
}
