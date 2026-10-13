import React, { useState } from 'react';
import { Star, Heart, MessageSquare, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ActivityCard = ({ activity, onContentClick }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  
  
  const user = activity.User;
  const item = activity.Content;

  if (!user || !item) return null;

  const isReview = activity.type === 'review';
  const timestamp = new Date(activity.createdAt).toLocaleDateString('tr-TR');

  const getActionText = () => {
      if (activity.type === 'review') return 'yorumladı';
      if (activity.type === 'rating') return 'puanladı';
      if (activity.type === 'status_change') {
          if (activity.detail.includes('watched')) return 'izledi';
          if (activity.detail.includes('read')) return 'okudu';
          return 'izledi'; 
      }
      return 'bir işlem yaptı';
  };

  const goToProfile = () => {
      navigate(`/profile/${user.id}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 hover:shadow-md transition-shadow duration-300">
      {}
      <div className="p-4 flex items-center space-x-3 border-b border-slate-50 bg-slate-50/50">
        <img 
            src={user.avatar || 'https://placehold.co/40'} 
            alt={user.username} 
            className="h-10 w-10 rounded-full border border-slate-200 cursor-pointer" 
            onClick={goToProfile}
        />
        <div>
          <div className="flex items-center flex-wrap gap-1">
            <span onClick={goToProfile} className="font-bold text-slate-800 hover:underline cursor-pointer">{user.username}</span>
            <span className="text-slate-500 text-sm">
              {getActionText()}
            </span>
            <span onClick={() => onContentClick && onContentClick(item)} className="font-semibold text-blue-600 hover:underline cursor-pointer">
              {item.title}
            </span>
          </div>
          <span className="text-xs text-slate-400">{timestamp}</span>
        </div>
      </div>

      {}
      <div className="p-0 flex flex-col sm:flex-row">
        {}
        <div onClick={() => onContentClick && onContentClick(item)} className="w-full sm:w-32 h-48 sm:h-auto bg-slate-200 flex-shrink-0 cursor-pointer relative group">
          <img src={item.poster || 'https://placehold.co/150'} alt={item.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
             {}
          </div>
        </div>

        {}
        <div className="p-4 flex-grow flex flex-col justify-center">
           <div className="mb-2">
             <h3 onClick={() => onContentClick && onContentClick(item)} className="text-lg font-bold text-slate-800 hover:text-blue-600 cursor-pointer">{item.title}</h3>
             <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                {item.type === 'movie' ? 'Film' : 'Kitap'}
             </span>
           </div>

           {}
           {activity.rating && (
            <div className="flex items-center mb-3">
                <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill={i < activity.rating / 2 ? "currentColor" : "none"} />
                    ))}
                </div>
                <span className="ml-2 text-sm font-bold text-slate-700">{activity.rating}/10</span>
            </div>
           )}
           
           {}
           {isReview && activity.detail && (
             <div className="text-slate-600 text-sm italic border-l-2 border-blue-200 pl-3 py-1 mb-3">
               <p className={`${!isExpanded ? "line-clamp-3" : ""} whitespace-pre-wrap break-words`}>
                 "{activity.detail}"
               </p>
               {activity.detail.length > 150 && (
                   <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-blue-500 text-xs font-semibold mt-1 hover:underline focus:outline-none"
                   >
                       {isExpanded ? "Daha az göster" : "Daha fazla göster"}
                   </button>
               )}
             </div>
           )}
           
           {}
           {activity.type === 'status_change' && (
               <p className="text-slate-600 text-sm">
                   {(() => {
                       const status = activity.detail.replace('Changed status to ', '');
                       const map = {
                           'watched': 'İzledi',
                           'plan_to_watch': 'İzleyecek',
                           'read': 'Okudu',
                           'reading': 'Okuyor',
                           'on_hold': 'Beklemeye Aldı',
                           'dropped': 'Bıraktı'
                       };
                       return map[status] || 'İşlem yaptı';
                   })()}
               </p>
           )}

           {}
           <div className="flex items-center space-x-4 mt-2 pt-3 border-t border-slate-50">
             <button className="flex items-center space-x-1 text-slate-400 hover:text-red-500 transition text-sm">
               <Heart size={16} />
               <span>Beğen</span>
             </button>
             <button className="flex items-center space-x-1 text-slate-400 hover:text-blue-500 transition text-sm">
               <MessageSquare size={16} />
               <span>Yorum</span>
             </button>
             <button className="flex items-center space-x-1 text-slate-400 hover:text-green-500 transition text-sm ml-auto">
               <Share2 size={16} />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
