import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Star, Film, BookOpen, Plus, Check, MessageSquare, List as ListIcon, X } from 'lucide-react';
import { contentService, activityService, userService } from '../services/api';

const ContentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [libraryStatus, setLibraryStatus] = useState(null); 
  const [reviews, setReviews] = useState([]);
  
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [userLists, setUserLists] = useState([]);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  useEffect(() => {
      const fetchDetails = async () => {
          try {
              const type = location.state?.type || 'movie'; 
              
              
              if (location.state?.content) {
                  setContent(location.state.content);
                  setLoading(false); 
              }

              
              let profile = null;
              try {
                  profile = await userService.getProfile();
              } catch (e) {
                  
              }

              const promises = [
                  contentService.getDetails(id, type),
                  activityService.getUserLibrary(),
                  activityService.getContentActivities(id, type)
              ];

              if (profile) {
                  promises.push(userService.getUserLists(profile.id));
              }

              const results = await Promise.all(promises);
              const details = results[0];
              const library = results[1];
              const contentReviews = results[2];
              if (profile) {
                  setUserLists(results[3]);
              }
              
              if (details) {
                  setContent(details);
              }
              setReviews(contentReviews);
              
              
              if (details) {
                const found = library.find(item => item.Content.apiId === details.apiId.toString() && item.Content.type === details.type);
                if (found) {
                    setLibraryStatus(found.status);
                }
              }
          } catch (error) {
              console.error(error);
          } finally {
              setLoading(false);
          }
      };
      fetchDetails();
  }, [id, location.state]);

  const handleAddToLibrary = async (status) => {
      try {
          await activityService.addToLibrary({
              apiId: content.apiId,
              type: content.type,
              title: content.title,
              poster: content.poster,
              status
          });
          setLibraryStatus(status);

          
          if (status === 'watched') {
              const listName = content.type === 'movie' ? 'İzlediklerim' : 'Okuduklarım';
              const targetList = userLists.find(l => l.name === listName);
              if (targetList) {
                  try {
                    await userService.addContentToList(targetList.id, {
                        apiId: content.apiId,
                        type: content.type,
                        title: content.title,
                        poster: content.poster
                    });
                  } catch (e) {
                      
                      console.log('Listeye eklenirken hata veya zaten ekli:', e);
                  }
              }
          }
      } catch (error) {
          console.error(error);
          alert('Hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
      }
  };

  const handleSubmitReview = async (e) => {
      e.preventDefault();
      if (!userRating && !comment) return;
      
      setSubmitting(true);
      try {
          const newActivity = await activityService.addReview({
              apiId: content.apiId,
              type: content.type,
              title: content.title,
              poster: content.poster,
              rating: userRating,
              comment
          });
          
          
          
          
          const type = location.state?.type || 'movie';
          const updatedReviews = await activityService.getContentActivities(id, type);
          setReviews(updatedReviews);
          
          setComment('');
          setUserRating(0);
          alert('Yorumunuz eklendi!');
      } catch (error) {
          alert('Yorum eklenirken hata oluştu');
      } finally {
          setSubmitting(false);
      }
  };

  const handleAddToList = async (listId) => {
      try {
          await userService.addContentToList(listId, {
              apiId: content.apiId,
              type: content.type,
              title: content.title,
              poster: content.poster
          });
          alert('İçerik listeye eklendi!');
          setIsListModalOpen(false);
      } catch (error) {
          console.error(error);
          alert('Hata: ' + error.message);
      }
  };

  if (loading) return <div>Yükleniyor...</div>;
  if (!content) return <div>İçerik bulunamadı</div>;
  
  const onBack = () => navigate(-1);

  return (
    <div className="animate-fade-in pb-10">
      <button onClick={onBack} className="mb-4 flex items-center text-slate-500 hover:text-slate-800 transition">
        <ChevronRight className="rotate-180" size={20} />
        Geri Dön
      </button>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-8">
        {}
        <div className="md:flex">
          <div className="md:w-1/3 lg:w-1/4 h-96 md:h-auto relative">
             <img src={content.poster || 'https://placehold.co/300x450'} alt={content.title} className="w-full h-full object-cover" />
          </div>
          
          <div className="p-6 md:w-2/3 lg:w-3/4 flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">{content.title}</h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mb-4">
                   <span className="px-2 py-1 bg-slate-100 rounded">{content.releaseDate ? content.releaseDate.substring(0, 4) : 'N/A'}</span>
                   <span className="px-2 py-1 bg-slate-100 rounded uppercase">{content.type === 'movie' ? 'Film' : 'Kitap'}</span>
                   {content.duration && <span className="px-2 py-1 bg-slate-100 rounded">{content.duration} dk</span>}
                   {content.pageCount && <span className="px-2 py-1 bg-slate-100 rounded">{content.pageCount} sayfa</span>}
                   {content.genre && <span className="px-2 py-1 bg-slate-100 rounded">{content.genre}</span>}
                   <span className="font-medium ml-2">{content.type === 'movie' ? content.director : content.author}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                  <div className="flex items-center space-x-1 bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-100">
                      <Star className="text-yellow-500 fill-yellow-500" size={20} />
                      <span className="text-xl font-bold text-slate-800">{content.rating || '0.0'}</span>
                      <span className="text-xs text-slate-400">/10</span>
                  </div>
              </div>
            </div>

            <p className="text-slate-600 mb-6 leading-relaxed">
               {content.description || 'Açıklama bulunamadı.'}
            </p>

            <div className="mt-auto flex space-x-4">
               <button 
                 onClick={() => handleAddToLibrary('watched')}
                 className={`flex-1 py-3 rounded-xl font-bold transition shadow-lg flex items-center justify-center space-x-2 ${
                     libraryStatus === 'watched' 
                     ? 'bg-green-600 text-white shadow-green-200' 
                     : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'
                 }`}
               >
                 {libraryStatus === 'watched' ? <Check size={20} /> : <Plus size={20} />}
                 <span>{libraryStatus === 'watched' ? (content.type === 'movie' ? 'İzlendi' : 'Okundu') : (content.type === 'movie' ? 'İzledim' : 'Okudum')}</span>
               </button>

               <button 
                 onClick={() => setIsListModalOpen(true)}
                 className="flex-1 border py-3 rounded-xl font-bold transition flex items-center justify-center space-x-2 bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
               >
                 <ListIcon size={20} />
                 <span>Listeye Ekle</span>
               </button>
            </div>
          </div>
        </div>
      </div>

      {}
      {isListModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-80 border border-slate-300">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Listeye Ekle</h2>
                <button onClick={() => setIsListModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                    <X size={20} />
                </button>
            </div>
            
            {userLists.length > 0 ? (
                <div className="space-y-2">
                    {userLists.map(list => (
                        <button 
                            key={list.id}
                            onClick={() => handleAddToList(list.id)}
                            className="w-full text-left px-4 py-3 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-between group"
                        >
                            <span className="font-medium">{list.name}</span>
                            <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-center py-4 text-slate-500">
                    <p>Henüz bir listeniz yok.</p>
                    <p className="text-xs mt-1">Profil sayfasından liste oluşturabilirsiniz.</p>
                </div>
            )}
          </div>
        </div>
      )}

      {}
      <div className="grid md:grid-cols-3 gap-8">
          {}
          <div className="md:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-4">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                      <Star className="mr-2 text-yellow-500" size={20} />
                      Puanla & Yorum Yap
                  </h3>
                  <form onSubmit={handleSubmitReview}>
                      <div className="mb-4">
                          <label className="block text-sm font-medium text-slate-600 mb-2">Puanın</label>
                          <div className="flex space-x-2">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => setUserRating(num)}
                                    className={`w-8 h-8 rounded-full text-sm font-bold transition ${
                                        userRating >= num 
                                        ? 'bg-yellow-400 text-white' 
                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                    }`}
                                  >
                                      {num}
                                  </button>
                              ))}
                          </div>
                          <div className="text-center mt-1 font-bold text-yellow-600">{userRating > 0 ? `${userRating}/10` : '-'}</div>
                      </div>
                      
                      <div className="mb-4">
                          <label className="block text-sm font-medium text-slate-600 mb-2">Yorumun</label>
                          <textarea 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none text-sm"
                            placeholder="Bu içerik hakkında ne düşünüyorsun?"
                          />
                      </div>

                      <button 
                        type="submit" 
                        disabled={submitting || (!userRating && !comment)}
                        className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {submitting ? 'Gönderiliyor...' : 'Gönder'}
                      </button>
                  </form>
              </div>
          </div>

          {}
          <div className="md:col-span-2">
              <h3 className="font-bold text-slate-800 mb-4 text-xl">Kullanıcı Yorumları ({reviews.length})</h3>
              <div className="space-y-4">
                  {reviews.length > 0 ? (
                      reviews.map(review => (
                          <div key={review.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                              <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center space-x-3">
                                      <img src={review.User?.avatar || 'https://placehold.co/40'} className="w-10 h-10 rounded-full bg-slate-100" />
                                      <div>
                                          <div className="font-bold text-slate-800">{review.User?.username || 'Anonim'}</div>
                                          <div className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString('tr-TR')}</div>
                                      </div>
                                  </div>
                                  {review.rating && (
                                      <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded text-yellow-600 font-bold text-sm">
                                          <Star size={14} className="fill-yellow-600" />
                                          <span>{review.rating}</span>
                                      </div>
                                  )}
                              </div>
                              <p className="text-slate-600 leading-relaxed break-words whitespace-pre-wrap">
                                  {review.detail}
                              </p>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                          <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                          <p>Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default ContentDetail;
