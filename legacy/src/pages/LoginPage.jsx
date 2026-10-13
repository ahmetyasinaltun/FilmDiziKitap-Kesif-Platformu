import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';

const LoginPage = ({ onLogin }) => {
  const [mode, setMode] = useState('login'); 
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          setError('Şifreler eşleşmiyor.');
          return;
        }
        await authService.register({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        
        const data = await authService.login(formData.email, formData.password);
        onLogin(data);
      } else {
        const data = await authService.login(formData.email, formData.password);
        onLogin(data);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <BookOpen className="mx-auto h-12 w-12 text-blue-600 mb-2" />
          <h2 className="text-3xl font-bold text-slate-900">SocialLib</h2>
          <p className="text-slate-500">Kitap ve film tutkunlarının buluşma noktası</p>
        </div>

        {error && (
          <div className={`mb-4 p-3 text-sm rounded-lg border ${typeof error === 'string' && error.includes('gönderildi') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            {typeof error === 'string' ? error : 'Bir hata oluştu.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kullanıcı Adı</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="kullaniciadi"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="ornek@email.com"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">Şifre</label>
              {mode === 'login' && (
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                  Şifremi Unuttum?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="••••••"
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Şifre Tekrar</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="password" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="••••••"
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
            {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center text-sm space-y-2">
          {mode === 'login' ? (
            <p className="text-slate-500">
              Hesabın yok mu? <button onClick={() => setMode('register')} className="text-blue-600 font-bold hover:underline">Kayıt Ol</button>
            </p>
          ) : (
            <p className="text-slate-500">
              Zaten hesabın var mı? <button onClick={() => setMode('login')} className="text-blue-600 font-bold hover:underline">Giriş Yap</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
