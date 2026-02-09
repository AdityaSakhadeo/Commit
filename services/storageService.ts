import { User, Goal, Post, Reward, Story, Comment } from '../types';

// Extended User Type for Storage (includes password)
interface StoredUser extends User {
  password: string; // In a real app, this would be hashed.
}

interface DB {
  users: StoredUser[]; // All registered users
  currentUser: string | null; // ID of currently logged in user
  goals: Goal[]; // All goals from all users
  posts: Post[]; // All posts
  rewards: Reward[]; // All rewards
  stories: Story[]; // Stories
  version: number;
}

const DB_KEY = 'COMMIT_APP_LOCAL_DB_V5'; // Incremented version to force refresh if needed

const DEFAULT_REWARDS: Reward[] = [
  { id: 'r1', title: 'Free Espresso', brand: 'Coffee House', logo: '☕', validity: 'Valid 7 Days', unlocked: true },
  { id: 'r2', title: '20% Off Gym Gear', brand: 'FitStore', logo: '💪', validity: 'Valid 30 Days', unlocked: true },
  { id: 'r3', title: 'Free Audiobook', brand: 'Audible', logo: '🎧', validity: 'Locked', unlocked: false },
  { id: 'r4', title: 'Healthy Meal Box', brand: 'FreshEats', logo: '🥗', validity: 'Locked', unlocked: false },
];

// --- EXTENSIVE DUMMY DATA GENERATION ---

const NAMES = ['Sarah', 'Mike', 'Jessica', 'Alex', 'Emma', 'David', 'Olivia', 'James', 'Sophia', 'Daniel', 'Liam', 'Maya', 'Noah', 'Isabella', 'Ethan'];
const DOMAINS = ['Fitness', 'Career', 'Learning', 'Mental Health', 'Finance', 'Habits'];
const BIOS = [
  'Fitness Enthusiast 💪', 'Learning React Native ⚛️', 'Marathon Runner 🏃‍♂️', 'Mindfulness & Yoga 🧘‍♀️', 
  'Financial Freedom 2025 🚀', 'Bookworm 📚', 'Digital Nomad 🌍', 'Health is Wealth 🥗', 'Coding Ninja 💻'
];

// Generate Users
const SEED_USERS: StoredUser[] = NAMES.map((name, i) => ({
  id: `u-${name.toLowerCase()}`,
  name: name,
  email: `${name.toLowerCase()}@test.com`,
  password: '123',
  bio: BIOS[i % BIOS.length],
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
  following: [],
  followers: [],
  stats: { 
    goalsCompleted: Math.floor(Math.random() * 10), 
    currentStreak: Math.floor(Math.random() * 30), 
    totalDays: Math.floor(Math.random() * 100) 
  }
}));

// Generate Posts
const GENERATED_POSTS: Post[] = [];
SEED_USERS.forEach((user, i) => {
  // Each user gets 1-3 posts
  const numPosts = Math.floor(Math.random() * 3) + 1;
  for (let j = 0; j < numPosts; j++) {
    const type = j === 0 ? 'STARTED' : (Math.random() > 0.7 ? 'COMPLETED' : 'UPDATE');
    const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)] as any;
    
    let content = '';
    let image = undefined;

    if (type === 'STARTED') content = `I'm committing to a new ${domain} goal! Wish me luck.`;
    else if (type === 'COMPLETED') {
        content = `I did it! 🎉 Completed my 30-day ${domain} challenge.`;
        image = `https://picsum.photos/id/${i * 10 + j + 50}/800/600`;
    }
    else {
        content = `Day ${Math.floor(Math.random() * 20) + 1} update: Feeling great about my progress.`;
        if (Math.random() > 0.5) image = `https://picsum.photos/id/${i * 10 + j + 10}/800/600`;
    }

    GENERATED_POSTS.push({
      id: `p-${user.id}-${j}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      domain: domain,
      type: type,
      content: content,
      image: image,
      likes: Math.floor(Math.random() * 50),
      likedBy: [],
      comments: Math.floor(Math.random() * 10),
      commentsList: [],
      timestamp: `${Math.floor(Math.random() * 24)}h ago`,
      progressUpdate: type === 'UPDATE' ? Math.floor(Math.random() * 90) : undefined
    });
  }
});

// Generate Stories
const GENERATED_STORIES: Story[] = SEED_USERS.slice(0, 8).map((user, i) => ({
  id: `s-${user.id}`,
  userId: user.id,
  userName: user.name,
  userAvatar: user.avatar,
  imageUrl: `https://picsum.photos/id/${i * 15 + 100}/600/1200`,
  caption: i % 2 === 0 ? "Morning routine ✅" : undefined,
  hasUnseen: Math.random() > 0.3,
  timestamp: `${i + 1}h ago`
}));


class LocalDatabase {
  private data: DB;

  constructor() {
    this.data = this.load();
  }

  private load(): DB {
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Merge seeded users if they don't exist (prevents overwriting real data on reload but ensures dummy data exists)
        SEED_USERS.forEach(seedUser => {
          if (!parsed.users.find((u: User) => u.id === seedUser.id)) {
            parsed.users.push(seedUser);
          }
        });

        // If posts are empty, re-seed
        if (parsed.posts.length < 5) {
             parsed.posts = [...GENERATED_POSTS, ...parsed.posts];
        }

        // If stories are empty/low, re-seed
        if (!parsed.stories || parsed.stories.length < 3) {
            parsed.stories = GENERATED_STORIES;
        }

        return parsed;
      }
    } catch (e) {
      console.error("Failed to load DB", e);
    }
    
    // Initial Load
    return {
      users: [...SEED_USERS],
      currentUser: null,
      goals: [],
      posts: GENERATED_POSTS.sort(() => 0.5 - Math.random()), // Shuffle posts
      rewards: DEFAULT_REWARDS,
      stories: GENERATED_STORIES,
      version: 5
    };
  }

  private save() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error("Failed to save DB", e);
    }
  }

  // --- Auth Methods ---

  signup(name: string, email: string, password: string): { success: boolean; message?: string; user?: User } {
    if (this.data.users.find(u => u.email === email)) {
      return { success: false, message: 'Email already exists' };
    }

    const newUser: StoredUser = {
      id: `u-${Date.now()}`,
      name,
      email,
      password,
      bio: 'Ready to commit!',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      following: [],
      followers: [],
      stats: { goalsCompleted: 0, currentStreak: 0, totalDays: 1 }
    };

    this.data.users.push(newUser);
    this.data.currentUser = newUser.id;
    this.save();

    const { password: _, ...safeUser } = newUser;
    return { success: true, user: safeUser };
  }

  login(email: string, password: string): { success: boolean; message?: string; user?: User } {
    const user = this.data.users.find(u => u.email === email && u.password === password);
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    this.data.currentUser = user.id;
    this.save();

    const { password: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  logout() {
    this.data.currentUser = null;
    this.save();
  }

  getCurrentUser(): User | null {
    if (!this.data.currentUser) return null;
    const user = this.data.users.find(u => u.id === this.data.currentUser);
    if (!user) return null;
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  getUserById(id: string): User | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  updateCurrentUser(updates: Partial<User>) {
    if (!this.data.currentUser) return;
    this.data.users = this.data.users.map(u => 
      u.id === this.data.currentUser ? { ...u, ...updates } : u
    );
    this.save();
  }

  searchUsers(query: string): User[] {
    const q = query.toLowerCase();
    const currentUserId = this.data.currentUser;
    return this.data.users
      .filter(u => 
        u.id !== currentUserId && 
        (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      )
      .map(u => {
        const { password, ...safe } = u;
        return safe;
      });
  }

  getSuggestedUsers(): User[] {
    const currentUserId = this.data.currentUser;
    return this.data.users
      .filter(u => u.id !== currentUserId)
      .slice(0, 10) // Return first 10 for now as suggestions
      .map(u => {
        const { password, ...safe } = u;
        return safe;
      });
  }

  // --- Social Actions ---

  toggleLike(postId: string): Post | null {
    const userId = this.data.currentUser;
    if (!userId) return null;

    const postIndex = this.data.posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return null;

    const post = this.data.posts[postIndex];
    const likedBy = post.likedBy || [];
    const isLiked = likedBy.includes(userId);

    let newLikedBy;
    if (isLiked) {
      newLikedBy = likedBy.filter(id => id !== userId);
    } else {
      newLikedBy = [...likedBy, userId];
    }

    const updatedPost = {
      ...post,
      likedBy: newLikedBy,
      likes: newLikedBy.length
    };

    this.data.posts[postIndex] = updatedPost;
    this.save();
    return updatedPost;
  }

  addComment(postId: string, text: string): Post | null {
    const userId = this.data.currentUser;
    if (!userId) return null;

    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;

    const postIndex = this.data.posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return null;

    const post = this.data.posts[postIndex];
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      text: text,
      timestamp: 'Just now'
    };

    const updatedPost = {
      ...post,
      commentsList: [newComment, ...(post.commentsList || [])],
      comments: (post.comments || 0) + 1
    };

    this.data.posts[postIndex] = updatedPost;
    this.save();
    return updatedPost;
  }

  followUser(targetUserId: string): { success: boolean, updatedUser: User } {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) throw new Error("Not logged in");

    // Update current user (Follower)
    this.data.users = this.data.users.map(u => {
      if (u.id === currentUserId) {
        if (!u.following.includes(targetUserId)) {
          return { ...u, following: [...u.following, targetUserId] };
        }
      }
      return u;
    });

    // Update target user (Following)
    this.data.users = this.data.users.map(u => {
      if (u.id === targetUserId) {
        if (!u.followers.includes(currentUserId)) {
          return { ...u, followers: [...u.followers, currentUserId] };
        }
      }
      return u;
    });

    this.save();
    return { success: true, updatedUser: this.getCurrentUser()! };
  }

  unfollowUser(targetUserId: string): { success: boolean, updatedUser: User } {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) throw new Error("Not logged in");

    this.data.users = this.data.users.map(u => {
      if (u.id === currentUserId) {
        return { ...u, following: u.following.filter(id => id !== targetUserId) };
      }
      return u;
    });

    this.data.users = this.data.users.map(u => {
      if (u.id === targetUserId) {
        return { ...u, followers: u.followers.filter(id => id !== currentUserId) };
      }
      return u;
    });

    this.save();
    return { success: true, updatedUser: this.getCurrentUser()! };
  }

  // --- Data Methods ---

  getGoalsForUser(): Goal[] {
    if (!this.data.currentUser) return [];
    return this.data.goals.filter(g => g.userId === this.data.currentUser);
  }

  saveGoalsForUser(userGoals: Goal[]) {
    if (!this.data.currentUser) return;
    const otherGoals = this.data.goals.filter(g => g.userId !== this.data.currentUser);
    this.data.goals = [...otherGoals, ...userGoals];
    this.save();
  }

  getPosts(): Post[] {
    return this.data.posts.map(p => ({
      ...p,
      likedBy: p.likedBy || [],
      commentsList: p.commentsList || []
    }));
  }

  addPost(post: Post) {
    const postWithDefaults = { ...post, likedBy: [], commentsList: [] };
    this.data.posts.unshift(postWithDefaults);
    this.save();
  }

  getRewards(): Reward[] {
    return this.data.rewards;
  }
  
  getStories(): Story[] {
    return this.data.stories;
  }

  addStory(userId: string, image: string, text?: string): Story {
    const user = this.getUserById(userId);
    const newStory: Story = {
      id: `s-${Date.now()}`,
      userId: userId,
      userName: user?.name || 'User',
      userAvatar: user?.avatar || '',
      imageUrl: image,
      caption: text,
      hasUnseen: true,
      timestamp: 'Just now'
    };
    this.data.stories.unshift(newStory);
    this.save();
    return newStory;
  }

  markStorySeen(storyId: string) {
    this.data.stories = this.data.stories.map(s => s.id === storyId ? { ...s, hasUnseen: false } : s);
    this.save();
  }

  init() {}
}

const db = new LocalDatabase();

export const StorageService = {
  init: () => db.init(),
  
  // Auth
  signup: (n: string, e: string, p: string) => db.signup(n, e, p),
  login: (e: string, p: string) => db.login(e, p),
  logout: () => db.logout(),
  getCurrentUser: () => db.getCurrentUser(),
  getUserById: (id: string) => db.getUserById(id),
  updateUser: (u: User) => db.updateCurrentUser(u),

  // Social
  searchUsers: (q: string) => db.searchUsers(q),
  getSuggestedUsers: () => db.getSuggestedUsers(),
  toggleLike: (postId: string) => db.toggleLike(postId),
  addComment: (postId: string, text: string) => db.addComment(postId, text),
  followUser: (targetId: string) => db.followUser(targetId),
  unfollowUser: (targetId: string) => db.unfollowUser(targetId),

  // Data
  getGoals: () => db.getGoalsForUser(),
  saveGoals: (goals: Goal[]) => db.saveGoalsForUser(goals),
  getPosts: () => db.getPosts(),
  addPost: (p: Post) => db.addPost(p),
  getRewards: () => db.getRewards(),
  getStories: () => db.getStories(),
  addStory: (userId: string, img: string, txt?: string) => db.addStory(userId, img, txt),
  markStorySeen: (id: string) => db.markStorySeen(id),
};