import React, { useState } from 'react';
import { Reward } from '../types';
import { Header } from '../components/Layout';
import { Gift, Lock, MapPin, X, Check } from 'lucide-react';

export default function Rewards({ rewards }: { rewards: Reward[] }) {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  const handleRedeem = (reward: Reward) => {
    if (reward.unlocked) {
      setSelectedReward(reward);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      <Header title="Rewards" subtitle="Earned from your hard work" />
      
      <div className="p-6">
        <div className="mb-8 p-6 bg-gradient-to-r from-violet-600 to-purple-600 rounded-3xl text-white shadow-lg shadow-purple-500/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
             <Gift size={120} />
           </div>
           <div className="flex items-center gap-4 mb-4 relative z-10">
             <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
               <Gift size={24} className="text-white" />
             </div>
             <div>
               <p className="text-purple-100 text-sm font-medium">Available Points</p>
               <h2 className="text-3xl font-bold">1,250</h2>
             </div>
           </div>
           <p className="text-xs text-purple-200 opacity-80 relative z-10">Complete goals to unlock more exclusive deals near you.</p>
        </div>

        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          Your Vouchers 
          <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{rewards.filter(r => r.unlocked).length} available</span>
        </h3>
        
        <div className="space-y-4">
          {rewards.map(reward => (
            <button 
              key={reward.id} 
              onClick={() => handleRedeem(reward)}
              className={`w-full text-left relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                reward.unlocked 
                  ? 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-teal-200 hover:scale-[1.02]' 
                  : 'bg-slate-50 border-transparent cursor-not-allowed'
              }`}
            >
              <div className={`flex items-center p-4 gap-4 ${!reward.unlocked && 'opacity-50 blur-[0.5px]'}`}>
                 <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center text-2xl border border-slate-100 shrink-0">
                   {reward.logo}
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="font-bold text-slate-800 truncate">{reward.title}</h4>
                   <p className="text-xs text-slate-500 mb-2 truncate">{reward.brand}</p>
                   <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wide ${
                     reward.unlocked ? 'bg-green-50 text-green-700' : 'bg-slate-200 text-slate-500'
                   }`}>
                     {reward.validity}
                   </span>
                 </div>
                 {reward.unlocked && <div className="text-slate-300"><Check size={20} /></div>}
              </div>
              
              {!reward.unlocked && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-100/10">
                   <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm flex items-center gap-2 border border-slate-200">
                     <Lock size={14} className="text-slate-500" />
                     <span className="text-xs font-bold text-slate-600">Locked</span>
                   </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Redeem Modal */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative shadow-2xl animate-in slide-in-from-bottom duration-300">
             <button 
               onClick={() => setSelectedReward(null)}
               className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600"
             >
               <X size={20} />
             </button>

             <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-4xl mb-4 shadow-sm">
                  {selectedReward.logo}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{selectedReward.title}</h3>
                <p className="text-slate-500 text-sm mb-6">{selectedReward.brand}</p>

                <div className="w-full bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                   <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                     <MapPin size={12} /> Locations
                   </div>
                   <p className="text-sm text-slate-700 font-medium">Valid at all downtown locations.</p>
                </div>

                <div className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 mb-6 bg-slate-50/50">
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Voucher Code</p>
                  <p className="text-2xl font-mono font-bold text-slate-800 tracking-widest">SAVE-2025</p>
                </div>

                <button className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-colors">
                  Redeem Now
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}