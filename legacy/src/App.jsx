import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import ActivityCard from './components/ActivityCard';
import ContentDetail from './pages/ContentDetail';
import DiscoverPage from './pages/DiscoverPage';
import ProfilePage from './pages/ProfilePage';
import LibraryPage from './pages/LibraryPage';
import LoginPage from './pages/LoginPage';
import { activityService } from './services/api';

const Home = ({ onContentClick }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState('global'); 

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        let data;
        if (feedType === 'global') {
            data = await activityService.getRecent();
        } else if (feedType === 'following') {
            data = await activityService.getFeed();
        } else if (feedType === 'my') {
            data = await activityService.getMyActivities();
        }
        setActivities(data);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [feedType]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-xl font-bold text-slate-800">Akış</h2>
          <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setFeedType('global')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition ${feedType === 'global' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Global
              </button>
              <button 
                onClick={() => setFeedType('following')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition ${feedType === 'following' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Takip Ettiklerim
              </button>
          </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Yükleniyor...</div>
      ) : activities.length > 0 ? (
        activities.map(activity => (
          <ActivityCard 
            key={activity.id} 
            activity={activity} 
            onContentClick={onContentClick}
          />
        ))
      ) : (
        <div className="text-center py-10 text-slate-500">
          {feedType === 'following' 
            ? 'Henüz kimseyi takip etmiyorsunuz veya takip ettiklerinizin aktivitesi yok.' 
            : 'Henüz bir aktivite yok.'}
        </div>
      )}
    </div>
  );
};

const Layout = ({ user, onLogout }) => {
  if (!user) return <Navigate to="/login" />;
  return (
    <>
      <Navbar user={user} onLogout={onLogout} />
      <main className="py-8 px-4 container mx-auto">
        <Outlet />
      </main>
    </>
  );
};

import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';



const App = () => {
  const [user, setUser] = useState(null); 
  const navigate = useNavigate();

  
  const handleLogin = (userData) => {
    setUser(userData);
    navigate('/');
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const handleContentClick = (content) => {
    navigate(`/content/${content.apiId}`, { state: { type: content.type, content } });
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      
      <Route element={<Layout user={user} onLogout={handleLogout} />}>
        <Route path="/" element={<Home onContentClick={handleContentClick} />} />
        <Route path="/discover" element={<DiscoverPage onSelectContent={handleContentClick} />} />
        <Route path="/library" element={<LibraryPage currentUser={user} />} />
        <Route path="/profile/:id?" element={<ProfilePage currentUser={user} />} />
        <Route path="/content/:id" element={<ContentDetail />} />
      </Route>
    </Routes>
  );
};

export default App;
