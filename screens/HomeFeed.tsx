import React, { useState, useEffect, useRef } from 'react';
import { Post, Goal, Story, User, Domain, Comment, Screen } from '../types';
import { Heart, MessageCircle, PartyPopper, Plus, Check, ChevronRight, Zap, Settings, X, Send, UserPlus, UserCheck, Camera, Image as ImageIcon, PlusCircle } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface HomeFeedProps {
  posts: Post[];
  activeGoals: Goal[];
  user: User;
  onEncourage: (postId: string) => void;
  onViewGoal: (goal: Goal) => void;
  onToggleTask: (goalId: string, taskId: string) => void;
  onUserUpdate?: (updatedUser: User) => void;
  onNavigate: (screen: Screen) => void;
}

const getDomainColor = (domain: Domain) => {
  switch (domain) {
    case 'Fitness': return 'text-emerald-600 bg-emerald-100';
    case 'Career': return 'text-blue-600 bg-blue-100';
    case 'Learning': return 'text-amber-600 bg-amber-100';
    case 'Mental Health': return 'text-rose-600 bg-rose-100';
    default: return 'text-teal-600 bg-teal-100';
  }
};

// --- Sub Components ---

const StoriesRail: React.FC<{ 
  user: User; 
  stories: Story[]; 
  onOpenStory: (s: Story) => void;
  onAddStory: () => void; 
}> = ({ user, stories, onOpenStory, onAddStory }) => {
  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 py-4 pb-2">
      {/* My Story (Add Button) */}
      <button onClick={onAddStory} className="flex flex-col items-center gap-1 shrink-0 group">
        <div className="relative">
          <img src={user.avatar} alt="My Story" className="w-16 h-16 rounded-full border-2 border-slate-200 group-hover:border-teal-200 shadow-md object-cover transition-all" />
          <div className="absolute bottom-0 right-0 bg-teal-500 text-white p-0.5 rounded-full border-2 border-white group-hover:scale-110 transition-transform">
            <Plus size={14} strokeWidth={3} />
          </div>
        </div>
        <span className="text-xs font-medium text-slate-600">My Story</span>
      </button>

      {/* Other Stories */}
      {stories.map(story => (
        <button key={story.id} onClick={() => onOpenStory(story)} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
          <div className={`p-[3px] rounded-full transition-all ${story.hasUnseen ? 'bg-gradient-to-tr from-teal-400 to-blue-500' : 'bg-slate-200'}`}>
            <div className="bg-white p-[2px] rounded-full">
               <img src={story.userAvatar} alt={story.userName} className="w-[3.6rem] h-[3.6rem] rounded-full object-cover group-hover:scale-105 transition-transform" />
            </div>
          </div>
          <span className="text-xs font-medium text-slate-600 max-w-[4rem] truncate">{story.userName}</span>
        </button>
      ))}
    </div>
  );
};

const TodaysActionList: React.FC<{ goals: Goal[]; onViewGoal: (g: Goal) => void; onToggleTask: (gid: string, tid: string) => void }> = ({ goals, onViewGoal, onToggleTask }) => {
  const actions = goals.map(g => {
    if (!g.tasks) return null;
    const setupTask = g.tasks.find(t => t.title.startsWith("Setup:") && !t.completed);
    if (setupTask) return { goal: g, task: setupTask, isSetup: true };

    const start = new Date(g.startDate);
    start.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (today < start) return null;

    const isTodaySkipped = (g.skippedDates || []).some(d => {
        const skipDate = new Date(d);
        skipDate.setHours(0,0,0,0);
        return skipDate.getTime() === today.getTime();
    });

    if (isTodaySkipped) return null;

    const oneDay = 1000 * 60 * 60 * 24;
    const rawDay = Math.floor((today.getTime() - start.getTime()) / oneDay) + 1;
    const skipsBefore = (g.skippedDates || []).filter(d => {
         const skipDate = new Date(d);
         skipDate.setHours(0,0,0,0);
         return skipDate.getTime() < today.getTime();
    }).length;

    const effectiveDay = rawDay - skipsBefore;
    const prefix = `Day ${effectiveDay}`;
    const dayTask = g.tasks.find(t => !t.completed && (t.title.startsWith(`${prefix}:`) || t.title.startsWith(`${prefix} `)));

    if (dayTask) return { goal: g, task: dayTask, isSetup: false };
    return null;
  }).filter((item): item is { goal: Goal, task: { id: string, title: string, completed: boolean }, isSetup: boolean } => item !== null);

  if (actions.length === 0) return null;

  return (
    <div className="px-6 py-2 mb-2">
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
         <div className="flex items-center gap-2 mb-4 text-slate-800">
            <div className="p-1.5 bg-teal-50 rounded-lg text-teal-600">
               <Zap size={16} fill="currentColor" />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wide">Today's Focus</h3>
         </div>
         <div className="space-y-3">
            {actions.map(({ goal, task, isSetup }) => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-teal-200 hover:bg-white transition-all group">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(goal.id, task.id);
                  }}
                  className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.completed ? 'bg-teal-500 border-teal-500' : 'border-slate-300 bg-white hover:border-teal-400'}`}
                >
                    {task.completed && <Check size={14} className="text-white" />}
                </button>
                <div className="flex-1 cursor-pointer" onClick={() => onViewGoal(goal)}>
                   <p className="text-sm font-semibold text-slate-800 leading-snug mb-1">
                     {isSetup ? task.title.replace('Setup: ', 'Setup: ') : task.title.replace(/^Day \d+.*?: /, '')}
                   </p>
                   <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${getDomainColor(goal.domain)}`}>
                        {goal.domain}
                      </span>
                      <span className="text-xs text-slate-400 font-medium truncate">• {goal.title}</span>
                   </div>
                </div>
                <button onClick={() => onViewGoal(goal)} className="mt-1 text-slate-300 group-hover:text-teal-400 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

const PostCard: React.FC<{ post: Post; currentUser: User; onRefresh: () => void; onUserClick: (userId: string) => void; onEncourage: (postId: string) => void }> = ({ post, currentUser, onRefresh, onUserClick, onEncourage }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  const isStarted = post.type === 'STARTED';
  const isCompleted = post.type === 'COMPLETED';
  const isLiked = post.likedBy?.includes(currentUser.id);

  const handleLike = () => {
    StorageService.toggleLike(post.id);
    onRefresh();
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    StorageService.addComment(post.id, commentText);
    setCommentText('');
    onRefresh();
  };

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-4 fade-in">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => onUserClick(post.userId)}>
          <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm" />
        </button>
        <div className="flex-1">
           <button onClick={() => onUserClick(post.userId)} className="font-bold text-slate-900 text-sm hover:underline">{post.userName}</button>
           <p className="text-xs text-slate-400 font-medium">{post.timestamp}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border 
          ${isStarted ? 'bg-blue-50 text-blue-600 border-blue-100' : isCompleted ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
          {post.domain}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-slate-700 leading-relaxed mb-3 text-sm">{post.content}</p>
        {post.image && (
          <div className="rounded-2xl overflow-hidden shadow-sm mb-3">
             <img src={post.image} alt="Update" className="w-full h-48 object-cover" />
          </div>
        )}
        
        {post.progressUpdate !== undefined && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
             <div className="flex justify-between text-xs text-slate-500 mb-1 font-semibold">
               <span>Goal Progress</span>
               <span>{post.progressUpdate}%</span>
             </div>
             <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
               <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${post.progressUpdate}%` }}></div>
             </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <button 
          onClick={handleLike}
          className={`flex items-center gap-2 transition-colors group ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
        >
          <div className={`p-2 rounded-full transition-colors ${isLiked ? 'bg-rose-50' : 'bg-slate-50 group-hover:bg-rose-50'}`}>
            {isCompleted ? <PartyPopper size={18} /> : <Heart size={18} fill={isLiked ? "currentColor" : "none"} />}
          </div>
          <span className="text-sm font-medium">{post.likes}</span>
        </button>

        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors group"
        >
          <div className="p-2 bg-slate-50 rounded-full group-hover:bg-blue-50 transition-colors">
            <MessageCircle size={18} />
          </div>
           <span className="text-sm font-medium">{post.comments}</span>
        </button>

        <button 
          onClick={() => onEncourage(post.id)}
          className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-bold hover:bg-teal-100 hover:shadow-sm transition-all border border-teal-100"
        >
          Encourage
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-2">
           {/* Comment List */}
           {post.commentsList && post.commentsList.length > 0 && (
             <div className="space-y-3 mb-4 max-h-40 overflow-y-auto no-scrollbar">
               {post.commentsList.map(comment => (
                 <div key={comment.id} className="flex gap-2">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userName}`} alt="Avatar" className="w-6 h-6 rounded-full" />
                    <div className="bg-slate-50 px-3 py-2 rounded-2xl rounded-tl-none">
                      <p className="text-xs font-bold text-slate-700">{comment.userName}</p>
                      <p className="text-xs text-slate-600">{comment.text}</p>
                    </div>
                 </div>
               ))}
             </div>
           )}

           {/* Input */}
           <form onSubmit={handleComment} className="flex items-center gap-2">
              <input 
                type="text" 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:border-teal-400"
              />
              <button 
                type="submit" 
                disabled={!commentText.trim()}
                className="p-2 bg-teal-600 text-white rounded-full disabled:opacity-50"
              >
                <Send size={14} />
              </button>
           </form>
        </div>
      )}
    </div>
  );
};

const StoryViewer: React.FC<{ story: Story; onClose: () => void }> = ({ story, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in duration-200">
      <div className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between">
         <div className="flex items-center gap-3">
           <img src={story.userAvatar} alt={story.userName} className="w-10 h-10 rounded-full border-2 border-white/50" />
           <div>
             <h4 className="text-white font-bold text-sm">{story.userName}</h4>
             <p className="text-white/70 text-xs">{story.timestamp}</p>
           </div>
         </div>
         <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md">
           <X size={24} />
         </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
         <img src={story.imageUrl} alt="Story" className="max-w-full max-h-full object-contain" />
         {story.caption && (
            <div className="absolute bottom-16 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-xl max-w-[80%] text-center">
              <p className="text-white font-medium text-lg shadow-black/50 drop-shadow-md">{story.caption}</p>
            </div>
         )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
         <div className="flex items-center gap-4">
            <input type="text" placeholder="Send message..." className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/50 outline-none backdrop-blur-md" />
            <button className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20">
               <Heart size={24} />
            </button>
         </div>
      </div>
    </div>
  );
};

const UserProfileModal: React.FC<{ targetUserId: string; currentUserId: string; onClose: () => void; onFollowToggle: () => void }> = ({ targetUserId, currentUserId, onClose, onFollowToggle }) => {
  const [targetUser, setTargetUser] = useState<User | null>(null);

  useEffect(() => {
    // Fetch user details locally
    const u = StorageService.getUserById(targetUserId);
    setTargetUser(u);
  }, [targetUserId]);

  if (!targetUser) return null;

  const isFollowing = StorageService.getUserById(currentUserId)?.following.includes(targetUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 fade-in" onClick={onClose}>
       <div className="bg-white rounded-[2.5rem] w-full max-w-xs p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>

          <div className="flex flex-col items-center text-center mt-2">
             <img src={targetUser.avatar} alt={targetUser.name} className="w-24 h-24 rounded-full border-4 border-slate-50 shadow-lg object-cover mb-4" />
             <h2 className="text-xl font-bold text-slate-900">{targetUser.name}</h2>
             <p className="text-slate-500 text-sm mb-6">{targetUser.bio || 'Productivity enthusiast.'}</p>

             <div className="flex gap-4 w-full mb-6 text-center">
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{targetUser.stats.goalsCompleted}</p>
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Goals</p>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{targetUser.stats.currentStreak}</p>
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Streak</p>
                </div>
             </div>

             {targetUser.id !== currentUserId && (
               <button 
                 onClick={onFollowToggle}
                 className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                   isFollowing 
                     ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                     : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-200'
                 }`}
               >
                 {isFollowing ? <><UserCheck size={18} /> Following</> : <><UserPlus size={18} /> Follow</>}
               </button>
             )}
          </div>
       </div>
    </div>
  );
};

const AddStoryModal: React.FC<{ onClose: () => void; onSelectImage: (file: File) => void }> = ({ onClose, onSelectImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSelectImage(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 space-y-4 animate-in slide-in-from-bottom">
        <div className="relative">
          <button onClick={onClose} className="absolute top-0 right-0 text-slate-400 hover:text-slate-600"><X size={20} /></button>
          <h3 className="text-xl font-bold text-slate-800 text-center">Add to Story</h3>
        </div>
        
        <input 
          type="file" 
          accept="image/*" 
          capture="user" 
          ref={cameraInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
        />
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
        />

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600 transition-all"
          >
            <Camera size={32} />
            <span className="font-bold">Camera</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600 transition-all"
          >
            <ImageIcon size={32} />
            <span className="font-bold">Gallery</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const StoryPreviewModal: React.FC<{ image: string; onClose: () => void; onPost: (caption: string) => void }> = ({ image, onClose, onPost }) => {
    const [caption, setCaption] = useState('');

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in">
            <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center">
                <button onClick={onClose} className="p-2 bg-black/20 rounded-full text-white backdrop-blur-md">
                    <X size={24} />
                </button>
                <button 
                    onClick={() => onPost(caption)} 
                    className="px-6 py-2 bg-teal-600 text-white rounded-full font-bold shadow-lg shadow-teal-500/30"
                >
                    Share
                </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center bg-black">
                <img src={image} alt="Preview" className="max-w-full max-h-full object-contain" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <input 
                    type="text" 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..." 
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white placeholder:text-white/50 outline-none backdrop-blur-md text-center font-medium" 
                    autoFocus
                />
            </div>
        </div>
    );
};

export default function HomeFeed({ posts, activeGoals, user, onEncourage, onViewGoal, onToggleTask, onUserUpdate, onNavigate }: HomeFeedProps) {
  const [feedPosts, setFeedPosts] = useState<Post[]>(posts);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  
  // Local state for stories to manage updates/additions
  const [stories, setStories] = useState<Story[]>([]);
  const [showAddStory, setShowAddStory] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Keep feed synced with props, but allow local refresh
  useEffect(() => {
    setFeedPosts(posts);
  }, [posts]);

  useEffect(() => {
    setStories(StorageService.getStories());
  }, []);

  const refreshFeed = () => {
    setFeedPosts(StorageService.getPosts());
  };

  const refreshStories = () => {
    setStories(StorageService.getStories());
  };

  const handleFollowToggle = () => {
    if (!viewingUserId) return;
    const currentUserData = StorageService.getCurrentUser();
    if (!currentUserData) return;

    const isFollowing = currentUserData.following.includes(viewingUserId);
    
    let res;
    if (isFollowing) {
      res = StorageService.unfollowUser(viewingUserId);
    } else {
      res = StorageService.followUser(viewingUserId);
    }
    
    if (res.success && onUserUpdate) {
      onUserUpdate(res.updatedUser); // Update global user state
    }
  };

  const handleOpenStory = (story: Story) => {
    setActiveStory(story);
    // Mark as seen locally and in DB
    StorageService.markStorySeen(story.id);
    setStories(prev => prev.map(s => s.id === story.id ? { ...s, hasUnseen: false } : s));
  };

  const handleSelectImage = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setPreviewImage(reader.result);
        setShowAddStory(false); // Close selection modal
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePostStory = (caption: string) => {
      if (previewImage) {
          StorageService.addStory(user.id, previewImage, caption);
          refreshStories();
          setPreviewImage(null);
      }
  };

  return (
    <div className="min-h-full bg-slate-50">
      {/* Custom Header with Post Button */}
      <div className="px-6 pt-8 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 flex justify-between items-center">
        <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Community</h1>
            <p className="text-sm text-slate-500 font-medium">Your productivity circle</p>
        </div>
        <button 
            onClick={() => onNavigate(Screen.CREATE_POST)}
            className="p-2 bg-teal-50 text-teal-600 rounded-full hover:bg-teal-100 hover:scale-105 transition-all shadow-sm"
        >
            <PlusCircle size={24} />
        </button>
      </div>
      
      {/* Stories Rail */}
      <StoriesRail 
        user={user} 
        stories={stories} 
        onOpenStory={handleOpenStory} 
        onAddStory={() => setShowAddStory(true)}
      />

      {/* Today's Action Plan List */}
      <TodaysActionList goals={activeGoals} onViewGoal={onViewGoal} onToggleTask={onToggleTask} />

      {/* Feed */}
      <div className="px-4 pb-24 pt-2">
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="font-bold text-slate-800">Latest Updates</h3>
        </div>
        {feedPosts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            currentUser={user} 
            onRefresh={refreshFeed}
            onUserClick={setViewingUserId}
            onEncourage={onEncourage}
          />
        ))}
      </div>

      {/* Story Viewer Overlay */}
      {activeStory && (
        <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />
      )}

      {/* Add Story Selection Modal */}
      {showAddStory && (
        <AddStoryModal 
          onClose={() => setShowAddStory(false)} 
          onSelectImage={handleSelectImage} 
        />
      )}

      {/* Story Preview & Caption Modal */}
      {previewImage && (
          <StoryPreviewModal 
            image={previewImage} 
            onClose={() => setPreviewImage(null)} 
            onPost={handlePostStory} 
          />
      )}

      {/* User Profile Modal */}
      {viewingUserId && (
        <UserProfileModal 
          targetUserId={viewingUserId} 
          currentUserId={user.id} 
          onClose={() => setViewingUserId(null)}
          onFollowToggle={handleFollowToggle}
        />
      )}
    </div>
  );
}