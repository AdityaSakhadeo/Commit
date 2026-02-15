import React from 'react';
import { Home, Search, Gift, User, Target } from 'lucide-react';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const navItems = [
    { screen: Screen.HOME, icon: Home, label: 'Feed' },
    { screen: Screen.SEARCH, icon: Search, label: 'Search' }, 
    { screen: Screen.GOALS, icon: Target, label: 'Goals' },
    { screen: Screen.REWARDS, icon: Gift, label: 'Rewards' },
    { screen: Screen.PROFILE, icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-lg border-t border-slate-100 px-2 py-3 flex justify-around items-end z-30 pb-safe">
      {navItems.map((item) => {
        const isActive = currentScreen === item.screen;
        return (
          <button
            key={item.label}
            onClick={() => onNavigate(item.screen)}
            className={`flex flex-col items-center gap-1 p-2 transition-colors min-w-[3.5rem] ${isActive ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[9px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};