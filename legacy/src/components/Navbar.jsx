import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home, Search, User, LogOut, Menu } from 'lucide-react';

const NavItem = ({ icon, label, to, active }) => (
  <Link 
    to={to}
    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${active ? 'text-blue-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();
  const activeTab = location.pathname.substring(1) || 'home';

  return (
    <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 cursor-pointer">
            <BookOpen className="h-8 w-8 text-blue-500" />
            <span className="font-bold text-xl tracking-tight">SocialLib</span>
          </Link>

          {user && (
            <div className="hidden md:flex space-x-8">
              <NavItem icon={<Home size={20} />} label="Akış" to="/" active={activeTab === 'home' || activeTab === ''} />
              <NavItem icon={<Search size={20} />} label="Keşfet" to="/discover" active={activeTab === 'discover'} />
              <NavItem icon={<BookOpen size={20} />} label="Kütüphane" to="/library" active={activeTab === 'library'} />
              <NavItem icon={<User size={20} />} label="Profilim" to="/profile" active={activeTab === 'profile'} />
            </div>
          )}

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium hidden sm:block">{user.name || user.username}</span>
                <img src={user.avatar} alt="Profile" className="h-8 w-8 rounded-full bg-slate-700" />
                <button onClick={onLogout} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-400 transition">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-sm font-bold text-blue-400 hover:text-blue-300">Giriş Yap</Link>
            )}
          </div>
        </div>
      </div>
      {}
      {user && (
        <div className="md:hidden border-t border-slate-800 flex justify-around py-2 bg-slate-900">
           <Link to="/" className={`p-2 ${activeTab === 'home' || activeTab === '' ? 'text-blue-500' : 'text-slate-400'}`}><Home size={24}/></Link>
           <Link to="/discover" className={`p-2 ${activeTab === 'discover' ? 'text-blue-500' : 'text-slate-400'}`}><Search size={24}/></Link>
           <Link to="/profile" className={`p-2 ${activeTab === 'profile' ? 'text-blue-500' : 'text-slate-400'}`}><User size={24}/></Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
