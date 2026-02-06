export enum Screen {
  ONBOARDING = 'ONBOARDING',
  GOAL_SELECTION = 'GOAL_SELECTION',
  AI_SETUP = 'AI_SETUP',
  HOME = 'HOME',
  CREATE_POST = 'CREATE_POST',
  GOAL_DETAIL = 'GOAL_DETAIL',
  REWARDS = 'REWARDS',
  PROFILE = 'PROFILE'
}

export type Domain = 'Fitness' | 'Career' | 'Learning' | 'Mental Health' | 'Finance' | 'Habits';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  domain: Domain;
  progress: number; // 0 to 100
  tasks: Task[];
  streak: number;
  completed: boolean;
  startDate: string;
  totalSkipsAllowed: number;
  skippedDates: string[]; // ISO date strings of days that were skipped/shifted
  // Helper for streak calculation (optional persistence, mostly computed)
  completedDayNumbers?: number[]; 
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  goalId?: string;
  linkedGoals?: { goalId: string; progress?: number }[];
  domain: Domain;
  type: 'STARTED' | 'UPDATE' | 'COMPLETED';
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
  progressUpdate?: number;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  hasUnseen: boolean;
}

export interface Reward {
  id: string;
  title: string;
  brand: string;
  logo: string;
  validity: string;
  unlocked: boolean;
  code?: string;
}

export interface User {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  stats: {
    goalsCompleted: number;
    currentStreak: number;
    totalDays: number;
  };
}