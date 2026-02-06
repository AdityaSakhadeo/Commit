import React, { useState } from 'react';
import { Post, User, Goal } from '../types';
import { Header } from '../components/Layout';
import { Image as ImageIcon, X, Award, ChevronDown } from 'lucide-react';

interface CreatePostProps {
  user: User;
  activeGoals: Goal[];
  onPost: (post: Post) => void;
  onCancel: () => void;
}

export default function CreatePost({ user, activeGoals, onPost, onCancel }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>(
    activeGoals[0]?.id ? [activeGoals[0].id] : []
  );
  const [postType, setPostType] = useState<'UPDATE' | 'COMPLETED'>('UPDATE');
  const [hasImage, setHasImage] = useState(false);
  
  const selectedGoals = activeGoals.filter(g => selectedGoalIds.includes(g.id));

  const handleSubmit = () => {
    if (!content || selectedGoals.length === 0) return;

    const primaryGoal = selectedGoals[0];
    const relatedGoals = selectedGoals.map(g => ({
      goalId: g.id,
      title: g.title,
      progress: g.progress,
    }));

    const newPost: Post = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      goalId: primaryGoal.id,
      domain: primaryGoal.domain,
      type: postType,
      content,
      likes: 0,
      comments: 0,
      timestamp: new Date().toISOString(),
      progressUpdate: primaryGoal.progress,
      relatedGoals,
      image: hasImage
        ? (postType === 'COMPLETED'
            ? 'https://picsum.photos/id/102/800/600'
            : 'https://picsum.photos/id/180/800/600')
        : undefined
    };

    onPost(newPost);
  };

  if (activeGoals.length === 0) {
    return (
      <div className="min-h-full bg-white flex flex-col items-center justify-center p-8 text-center">
         <p className="text-slate-500 mb-4">You need to start a goal before you can post updates!</p>
         <button onClick={onCancel} className="text-teal-600 font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white z-50 flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
        <button 
          onClick={handleSubmit} 
          disabled={!content}
          className="bg-teal-600 text-white px-6 py-2 rounded-full text-sm font-bold disabled:opacity-50 hover:bg-teal-700 shadow-md shadow-teal-100 transition-all"
        >
          Post
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="flex gap-3 mb-6">
           <img src={user.avatar} alt="Me" className="w-12 h-12 rounded-full border border-slate-100 object-cover" />
           <div className="flex-1">
             <h3 className="font-bold text-slate-800 text-lg">{user.name}</h3>
             
             {/* Goal Selector - multi-select via toggle pills */}
             <div className="mt-2">
               <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                 Tag goals you worked on
               </p>
               <div className="flex flex-wrap gap-2">
                 {activeGoals.map(g => {
                   const isSelected = selectedGoalIds.includes(g.id);
                   return (
                     <button
                       key={g.id}
                       type="button"
                       onClick={() => {
                         setSelectedGoalIds(prev =>
                           prev.includes(g.id)
                             ? prev.filter(id => id !== g.id)
                             : [...prev, g.id]
                         );
                       }}
                       className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                         isSelected
                           ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                           : 'bg-teal-50 text-teal-700 border-teal-100 hover:border-teal-300'
                       }`}
                     >
                       {g.title}
                     </button>
                   );
                 })}
               </div>
             </div>
           </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={postType === 'COMPLETED' ? "How does it feel to achieve this? Share your journey!" : "Share your progress..."}
          className="w-full h-40 text-lg text-slate-700 placeholder:text-slate-300 outline-none resize-none mb-4"
          autoFocus
        />

        {hasImage && (
          <div className="relative mb-6 rounded-2xl overflow-hidden shadow-sm group">
            <img 
              src={postType === 'COMPLETED' ? 'https://picsum.photos/id/102/800/600' : 'https://picsum.photos/id/180/800/600'} 
              alt="Preview" 
              className="w-full h-48 object-cover" 
            />
            <button 
              onClick={() => setHasImage(false)}
              className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={16} />
            </button>
            {postType === 'COMPLETED' && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center gap-2 text-amber-300 font-bold">
                <Award size={20} />
                <span>Completion Certificate Attached</span>
              </div>
            )}
          </div>
        )}

        {/* Options */}
        <div className="space-y-4">
           <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
              <button 
                onClick={() => setPostType('UPDATE')}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${postType === 'UPDATE' ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                Progress Update
              </button>
              <button 
                onClick={() => setPostType('COMPLETED')}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${postType === 'COMPLETED' ? 'bg-amber-400 text-white border-amber-400 shadow-md' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                🎉 Goal Completed
              </button>
           </div>
           
           {!hasImage && (
             <button 
               onClick={() => setHasImage(true)}
               className="flex items-center gap-3 w-full p-4 border border-dashed border-slate-300 rounded-2xl text-slate-400 hover:bg-slate-50 hover:border-teal-300 hover:text-teal-600 transition-all group"
             >
                <div className="p-2 bg-slate-100 rounded-full group-hover:bg-teal-50 text-slate-400 group-hover:text-teal-500 transition-colors">
                  {postType === 'COMPLETED' ? <Award size={20} /> : <ImageIcon size={20} />}
                </div>
                <span className="text-sm font-medium">
                  {postType === 'COMPLETED' ? 'Upload Certificate / Photo' : 'Add Photo or Screenshot'}
                </span>
             </button>
           )}
        </div>
      </div>
    </div>
  );
}