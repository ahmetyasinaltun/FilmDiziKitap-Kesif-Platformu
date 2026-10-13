import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Settings, UserPlus, UserMinus, Save, ChevronDown, ChevronUp, X } from "lucide-react";
import { activityService, userService } from "../services/api";
import ActivityCard from "../components/ActivityCard";

const ProfilePage = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const targetId = id || currentUser?.id;

  const [viewedUser, setViewedUser] = useState(null);
  const [library, setLibrary] = useState([]);
  const [lists, setLists] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("library");
  const [activeListId, setActiveListId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", bio: "", avatar: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [followModal, setFollowModal] = useState({ isOpen: false, type: 'followers', data: [] });

  const openFollowModal = async (type) => {
      try {
          let data = [];
          if (type === 'followers') {
              data = await userService.getFollowers(targetId);
          } else {
              data = await userService.getFollowing(targetId);
          }
          setFollowModal({ isOpen: true, type, data });
      } catch (error) {
          console.error("Liste alınamadı", error);
      }
  };

  useEffect(() => {
    if (!targetId) return;

    const fetchData = async () => {
      try {
        const userData = await userService.getUserById(targetId);
        setViewedUser(userData);
        setEditForm({ username: userData.username, bio: userData.bio || "", avatar: userData.avatar || "" });
        setSelectedFile(null);

        const libraryData = await activityService.getUserLibrary(targetId);
        setLibrary(libraryData);

        const listsData = await userService.getUserLists(targetId);
        setLists(listsData);

        if (currentUser && currentUser.id !== parseInt(targetId)) {
           setIsFollowing(userData.isFollowing);
        }
      } catch (err) {
        console.error("Profil verileri alınamadı:", err);
      }
    };

    fetchData();
  }, [targetId, currentUser]);

  const handleFollowToggle = async () => {
    if (!currentUser) return;

    try {
      if (isFollowing) {
        await userService.unfollowUser(targetId);
      } else {
        await userService.followUser(targetId);
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error("Takip işlemi başarısız:", err);
    }
  };

  const handleUpdateProfile = async () => {
      try {
          const formData = new FormData();
          formData.append('username', editForm.username);
          formData.append('bio', editForm.bio);
          if (selectedFile) {
              formData.append('avatar', selectedFile);
          } else if (editForm.avatar) {
              formData.append('avatar', editForm.avatar);
          }

          const updatedUser = await userService.updateProfile(formData);
          setViewedUser({ ...viewedUser, ...updatedUser });
          setIsEditModalOpen(false);
      } catch (error) {
          console.error("Profil güncellenemedi", error);
      }
  };

  if (!viewedUser) {
    return (
      <div className="flex justify-center items-center h-screen text-slate-500">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {}
      <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
          
          {}
          <div className="flex justify-center md:justify-start mb-6 md:mb-0">
            {viewedUser.avatar ? (
                <img 
                    src={viewedUser.avatar} 
                    alt={viewedUser.username} 
                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                />
            ) : (
                <div className="w-28 h-28 rounded-full bg-slate-200 flex items-center justify-center text-4xl font-semibold text-slate-700 select-none shadow-inner">
                {viewedUser.username.charAt(0).toUpperCase()}
                </div>
            )}
          </div>

          {}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-slate-900">{viewedUser.username}</h1>
            {viewedUser.bio && <p className="text-slate-600 mt-2">{viewedUser.bio}</p>}

            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              {currentUser?.id === viewedUser.id ? (
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-slate-100 text-slate-800 rounded-lg text-sm hover:bg-slate-200 transition"
                >
                  <Settings size={16} className="mr-2" />
                  Profili Düzenle
                </button>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm transition ${
                    isFollowing
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus size={16} className="mr-2" /> Takibi Bırak
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} className="mr-2" /> Takip Et
                    </>
                  )}
                </button>
              )}
            </div>

            {}
            <div className="flex justify-center md:justify-start space-x-8 mt-6 pt-6 border-t border-slate-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">{viewedUser.libraryCount || 0}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">İçerik</div>
              </div>
              <div className="text-center cursor-pointer hover:opacity-75 transition" onClick={() => openFollowModal('followers')}>
                <div className="text-2xl font-bold text-slate-800">{viewedUser.followersCount || 0}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Takipçi</div>
              </div>
              <div className="text-center cursor-pointer hover:opacity-75 transition" onClick={() => openFollowModal('following')}>
                <div className="text-2xl font-bold text-slate-800">{viewedUser.followingCount || 0}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Takip</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="flex space-x-1 bg-slate-100 p-1 mt-10 rounded-xl overflow-x-auto w-fit mx-auto md:mx-0">
        <button
          onClick={() => setActiveTab("library")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "library" ? "bg-white shadow text-slate-900" : "text-slate-600"
          }`}
        >
          Aktiviteler
        </button>

        <button
          onClick={() => setActiveTab("lists")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "lists" ? "bg-white shadow text-slate-900" : "text-slate-600"
          }`}
        >
          Listeler
        </button>
      </div>

      {}
      <div className="mt-6">
        {activeTab === "library" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {library.map((item) => (
              <ActivityCard key={item.id} activity={item} />
            ))}
            {library.length === 0 && (
                <div className="col-span-full text-center text-slate-500 py-10">Henüz bir aktivite yok.</div>
            )}
          </div>
        )}

        {activeTab === "lists" && (
          <div className="space-y-4">
            {lists.map((list) => (
              <div key={list.id} className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                  <div 
                    className="p-4 flex justify-between items-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition"
                    onClick={() => {
                        if (activeListId === list.id) setActiveListId(null);
                        else setActiveListId(list.id);
                    }}
                  >
                    <div>
                        <h3 className="font-semibold text-slate-800">{list.name}</h3>
                        <p className="text-xs text-slate-500">{list.Contents?.length || 0} içerik</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {activeListId === list.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                    </div>
                  </div>
                  
                  {activeListId === list.id && (
                      <div className="p-4 border-t border-slate-100">
                          {list.Contents && list.Contents.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                  {list.Contents.map(content => (
                                      <div 
                                        key={content.id} 
                                        className="relative group cursor-pointer"
                                        onClick={() => navigate(`/content/${content.apiId}`, { state: { type: content.type, content } })}
                                      >
                                          <img 
                                            src={content.poster || 'https://placehold.co/150'} 
                                            alt={content.title} 
                                            className="w-full h-32 object-cover rounded-md"
                                          />
                                          <div className="mt-1 text-xs font-medium truncate">{content.title}</div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="text-center text-slate-500 text-sm py-2">Bu listede henüz içerik yok.</div>
                          )}
                      </div>
                  )}
              </div>
            ))}
            {lists.length === 0 && (
                <div className="text-center text-slate-500 py-10">Henüz bir liste yok.</div>
            )}
          </div>
        )}
      </div>

      {}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-96 border border-slate-300">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Profili Düzenle</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Kullanıcı Adı</label>
                <input
                type="text"
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Avatar</label>
                <div className="flex flex-col space-y-2">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                    <div className="text-xs text-slate-500 text-center">- VEYA -</div>
                    <input
                        type="text"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="Avatar URL (Opsiyonel)"
                        value={editForm.avatar || ''}
                        onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                    />
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Biyografi</label>
                <textarea
                className="w-full border border-slate-300 rounded-lg px-3 py-2 h-24 resize-none"
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex items-center px-3 py-2 text-sm bg-slate-200 rounded-lg hover:bg-slate-300"
              >
                <X size={16} className="mr-1" />
                İptal
              </button>

              <button
                onClick={handleUpdateProfile}
                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save size={16} className="mr-1" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {followModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {followModal.type === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}
              </h3>
              <button onClick={() => setFollowModal({ ...followModal, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {followModal.data.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Kullanıcı bulunamadı.</div>
              ) : (
                followModal.data.map(user => (
                  <div key={user.id} className="flex items-center p-3 hover:bg-slate-50 rounded-lg transition cursor-pointer" onClick={() => {
                      setFollowModal({ ...followModal, isOpen: false });
                      navigate(`/profile/${user.id}`);
                  }}>
                    <img 
                      src={user.avatar || 'https://placehold.co/40'} 
                      alt={user.username} 
                      className="w-10 h-10 rounded-full border border-slate-200 mr-3"
                    />
                    <div>
                      <div className="font-bold text-slate-800">{user.username}</div>
                      {user.bio && <div className="text-xs text-slate-500 line-clamp-1">{user.bio}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;