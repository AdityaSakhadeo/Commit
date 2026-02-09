import React, { useState, useEffect } from 'react';
import { Header } from '../components/Layout';
import { Search, UserPlus, UserCheck } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { User } from '../types';

interface SearchUsersProps {
  user: User; // Current user
  onUserUpdate: (updatedUser: User) => void;
}

export default function SearchUsers({ user, onUserUpdate }: SearchUsersProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  
  useEffect(() => {
    // Initial load: show suggested users
    setUsers(StorageService.getSuggestedUsers());
  }, []);

  useEffect(() => {
    if (query.trim()) {
      setUsers(StorageService.searchUsers(query));
    } else {
      setUsers(StorageService.getSuggestedUsers());
    }
  }, [query]);

  const handleFollowToggle = (targetId: string) => {
    const isFollowing = user.following.includes(targetId);
    let res;
    if (isFollowing) {
       res = StorageService.unfollowUser(targetId);
    } else {
       res = StorageService.followUser(targetId);
    }

    if (res.success) {
      onUserUpdate(res.updatedUser);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      <Header title="Discover" subtitle="Find friends and accountability partners" />
      
      <div className="p-4 sticky top-20 z-10 bg-slate-50/95 backdrop-blur-sm">
        <div className="relative">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
          />
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {users.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
             <p>No users found matching "{query}"</p>
          </div>
        ) : (
          users.map(u => {
            const isFollowing = user.following.includes(u.id);
            return (
              <div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                 <div className="flex items-center gap-4">
                    <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-full border border-slate-100 object-cover" />
                    <div>
                      <h4 className="font-bold text-slate-800">{u.name}</h4>
                      <p className="text-xs text-slate-500 max-w-[150px] truncate">{u.bio || 'Ready to achieve.'}</p>
                      <div className="flex gap-2 mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                         <span>{u.stats.goalsCompleted} Goals</span>
                         <span>•</span>
                         <span>{u.stats.currentStreak} Day Streak</span>
                      </div>
                    </div>
                 </div>
                 
                 <button 
                   onClick={() => handleFollowToggle(u.id)}
                   className={`p-3 rounded-xl transition-all ${
                     isFollowing 
                       ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                       : 'bg-teal-600 text-white shadow-lg shadow-teal-200 hover:scale-105 active:scale-95'
                   }`}
                 >
                   {isFollowing ? <UserCheck size={20} /> : <UserPlus size={20} />}
                 </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}