export enum Screen {
  ONBOARDING = 'ONBOARDING',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  GOAL_SELECTION = 'GOAL_SELECTION',
  AI_SETUP = 'AI_SETUP',
  HOME = 'HOME',
  SEARCH = 'SEARCH',
  GOALS = 'GOALS',
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
  userId: string; // Linked to specific user
  title: string;
  domain: Domain;
  progress: number; // 0 to 100
  tasks: Task[];
  streak: number;
  completed: boolean;
  startDate: string;
  totalSkipsAllowed: number;
  skippedDates: string[]; // ISO date strings of days that were skipped/shifted
  completedDayNumbers?: number[]; 
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  goalId?: string;
  domain: Domain;
  type: 'STARTED' | 'UPDATE' | 'COMPLETED';
  content: string;
  image?: string;
  likes: number;
  likedBy: string[]; // Array of user IDs
  comments: number;
  commentsList: Comment[];
  timestamp: string;
  progressUpdate?: number;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl: string; // The story content
  caption?: string; // Optional text caption
  hasUnseen: boolean;
  timestamp: string;
}

export interface Reward {
  id: string;
  title: string;
  brand: string;
  logo: string;
  validity: string;
  unlocked: boolean;
  code?: string;
  userId?: string; // Optional: track which user unlocked it
}

export interface User {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatar: string;
  following: string[]; // Array of user IDs
  followers: string[]; // Array of user IDs
  stats: {
    goalsCompleted: number;
    currentStreak: number;
    totalDays: number;
  };
}