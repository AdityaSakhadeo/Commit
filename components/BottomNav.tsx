import React from 'react';
import { Home, CheckSquare, PlusCircle, Gift, User } from 'lucide-react';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const navItems = [
    { screen: Screen.HOME, icon: Home, label: 'Feed' },
    { screen: Screen.GOAL_SELECTION, icon: CheckSquare, label: 'Goals' }, // Loops back to create flow if no active goal, simplified for demo
    { screen: Screen.CREATE_POST, icon: PlusCircle, label: 'Post', primary: true },
    { screen: Screen.REWARDS, icon: Gift, label: 'Rewards' },
    { screen: Screen.PROFILE, icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-lg border-t border-slate-100 px-6 py-4 flex justify-between items-center z-30 pb-safe">
      {navItems.map((item) => {
        const isActive = currentScreen === item.screen;
        if (item.primary) {
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.screen)}
              className="bg-teal-600 text-white p-4 rounded-full shadow-lg shadow-teal-600/30 transform hover:scale-105 active:scale-95 transition-all -mt-8"
            >
              <item.icon size={24} strokeWidth={2.5} />
            </button>
          );
        }
        return (
          <button
            key={item.label}
            onClick={() => onNavigate(item.screen)}
            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};