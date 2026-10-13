import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, List, X, ChevronDown, ChevronUp, Trash2, Activity, BookOpen } from "lucide-react";
import { activityService, userService } from "../services/api";
import ActivityCard from "../components/ActivityCard";

const LibraryPage = ({ currentUser }) => {
  const navigate = useNavigate();
  const [library, setLibrary] = useState([]);
  const [lists, setLists] = useState([]);
  const [activeTab, setActiveTab] = useState("activities"); 
  const [activeListId, setActiveListId] = useState(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        
        const activitiesData = await activityService.getMyActivities();
        setLibrary(activitiesData);

        
        const listsData = await userService.getUserLists(currentUser.id);
        setLists(listsData);
      } catch (err) {
        console.error("Kütüphane verileri alınamadı:", err);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      const createdList = await userService.createList(currentUser.id, newListName);
      setLists([...lists, createdList]);
      setNewListName("");
      setIsListModalOpen(false);
    } catch (err) {
      console.error("Liste oluşturulamadı:", err);
    }
  };

  const handleDeleteList = async (listId) => {
      if (!window.confirm('Bu listeyi silmek istediğinize emin misiniz?')) return;
      try {
          await userService.deleteList(listId);
          setLists(lists.filter(l => l.id !== listId));
      } catch (error) {
          console.error("Liste silinemedi", error);
      }
  };

  const handleRemoveFromList = async (listId, contentId) => {
      if (!window.confirm('Bu içeriği listeden kaldırmak istediğinize emin misiniz?')) return;
      try {
          await userService.removeContentFromList(listId, contentId);
          
          setLists(lists.map(list => {
              if (list.id === listId) {
                  return {
                      ...list,
                      Contents: list.Contents.filter(c => c.id !== contentId)
                  };
              }
              return list;
          }));
      } catch (error) {
          console.error("İçerik kaldırılamadı", error);
      }
  };

  const handleContentClick = (content) => {
    navigate(`/content/${content.apiId}`, { state: { type: content.type, content } });
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-screen text-slate-500">
        Lütfen giriş yapın.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {}
         <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
                <img src={currentUser.avatar || 'https://placehold.co/150'} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-slate-50" />
                <h2 className="font-bold text-xl text-slate-800">{currentUser.username}</h2>
                <div className="flex justify-center space-x-4 mt-4 text-sm border-t border-slate-50 pt-4">
                    <div>
                        <div className="font-bold text-lg text-slate-800">{library.length}</div>
                        <div className="text-slate-500 text-xs uppercase tracking-wide">Aktivite</div>
                    </div>
                    <div>
                        <div className="font-bold text-lg text-slate-800">{lists.length}</div>
                        <div className="text-slate-500 text-xs uppercase tracking-wide">Liste</div>
                    </div>
                </div>
            </div>
            
            {}
            <nav className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button 
                    onClick={() => setActiveTab('activities')} 
                    className={`w-full text-left px-6 py-4 font-medium flex items-center transition-colors ${activeTab === 'activities' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'}`}
                >
                    <Activity size={20} className="mr-3" /> Aktivitelerim
                </button>
                <button 
                    onClick={() => setActiveTab('lists')} 
                    className={`w-full text-left px-6 py-4 font-medium flex items-center transition-colors ${activeTab === 'lists' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'}`}
                >
                    <List size={20} className="mr-3" /> Listelerim
                </button>
            </nav>
         </div>

         {}
         <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                    {activeTab === 'activities' ? 'Son Aktivitelerim' : 'Listelerim'}
                </h2>
                {activeTab === 'lists' && (
                    <button
                        onClick={() => setIsListModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition shadow-sm"
                    >
                        <Plus size={16} className="mr-2" />
                        Yeni Liste
                    </button>
                )}
            </div>

            {activeTab === "activities" && (
              library.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {library.map((item) => (
                    <ActivityCard key={item.id} activity={item} onContentClick={handleContentClick} />
                    ))}
                </div>
              ) : (
                  <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-sm">
                      <Activity size={48} className="mx-auto text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium text-slate-800">Henüz bir aktivite yok</h3>
                      <p className="text-slate-500 mt-2">İçerikleri puanlayarak veya yorum yaparak aktivite oluşturabilirsin.</p>
                  </div>
              )
            )}

            {activeTab === "lists" && (
              <div className="space-y-4">
                {lists.map((list) => (
                  <div key={list.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
                      <div 
                        className="p-5 flex justify-between items-center cursor-pointer bg-white hover:bg-slate-50 transition"
                        onClick={() => {
                            if (activeListId === list.id) setActiveListId(null);
                            else setActiveListId(list.id);
                        }}
                      >
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                <List size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">{list.name}</h3>
                                <p className="text-sm text-slate-500">{list.Contents?.length || 0} içerik</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteList(list.id);
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                                title="Listeyi Sil"
                            >
                                <Trash2 size={18} />
                            </button>
                            {activeListId === list.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                        </div>
                      </div>
                      
                      {activeListId === list.id && (
                          <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                              {list.Contents && list.Contents.length > 0 ? (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                      {list.Contents.map(content => (
                                          <div 
                                            key={content.id} 
                                            className="relative group cursor-pointer bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
                                            onClick={() => navigate(`/content/${content.apiId}`, { state: { type: content.type, content } })}
                                          >
                                              <div className="aspect-[2/3] relative">
                                                  <img 
                                                    src={content.poster || 'https://placehold.co/150'} 
                                                    alt={content.title} 
                                                    className="w-full h-full object-cover"
                                                  />
                                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                              </div>
                                              <div className="p-2">
                                                  <div className="text-xs font-bold text-slate-800 truncate">{content.title}</div>
                                              </div>
                                              <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveFromList(list.id, content.id);
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 shadow-sm"
                                                title="Listeden Kaldır"
                                              >
                                                  <X size={12} />
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              ) : (
                                  <div className="text-center text-slate-500 text-sm py-8 flex flex-col items-center">
                                      <BookOpen size={32} className="mb-2 opacity-20" />
                                      Bu listede henüz içerik yok.
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
                ))}
                {lists.length === 0 && (
                    <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-sm">
                        <List size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-800">Henüz bir listeniz yok</h3>
                        <p className="text-slate-500 mt-2">Yeni bir liste oluşturarak içeriklerinizi düzenleyebilirsiniz.</p>
                    </div>
                )}
              </div>
            )}
         </div>
      </div>

      {}
      {isListModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Yeni Liste Oluştur</h3>
              <button onClick={() => setIsListModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Liste Adı</label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-slate-50 focus:bg-white"
                  placeholder="Örn: Favori Filmlerim"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsListModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateList}
                  disabled={!newListName.trim()}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;