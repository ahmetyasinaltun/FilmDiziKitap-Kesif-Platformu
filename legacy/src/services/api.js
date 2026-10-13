


const API_URL = '/api'; 

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const authService = {
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Giriş başarısız');
    }
    const data = await res.json();
    if (data.token) localStorage.setItem('token', data.token);
    return data;
  },
  
  register: async (userData) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Kayıt başarısız');
    }
    return await res.json();
  },

  logout: () => {
    localStorage.removeItem('token');
  },
  forgotPassword: async (email) => {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error('İşlem başarısız');
      return await res.json();
  },
  resetPassword: async (token, password) => {
      const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
      });
      if (!res.ok) throw new Error('Şifre sıfırlanamadı');
      return await res.json();
  }
};

export const userService = {
  getProfile: async () => {
    const res = await fetch(`${API_URL}/users/profile`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Profil alınamadı');
    return await res.json();
  },
    updateProfile: async (data) => {
    const headers = getHeaders();
    
    if (data instanceof FormData) {
        delete headers['Content-Type'];
    }
    
    const body = data instanceof FormData ? data : JSON.stringify(data);

    const res = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: headers,
      body: body
    });
    if (!res.ok) throw new Error('Profil güncellenemedi');
    return await res.json();
  },
  getUserById: async (id) => {
    const res = await fetch(`${API_URL}/users/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Kullanıcı alınamadı');
    return await res.json();
  },
  followUser: async (id) => {
    const res = await fetch(`${API_URL}/users/${id}/follow`, { method: 'POST', headers: getHeaders() });
    if (!res.ok) throw new Error('Takip edilemedi');
    return await res.json();
  },
  unfollowUser: async (id) => {
    const res = await fetch(`${API_URL}/users/${id}/follow`, { method: 'DELETE', headers: getHeaders() });
    if (!res.ok) throw new Error('Takipten çıkılamadı');
    return await res.json();
  },
  getFollowers: async (id) => {
    const res = await fetch(`${API_URL}/users/${id}/followers`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Takipçiler alınamadı');
    return await res.json();
  },
  getFollowing: async (id) => {
    const res = await fetch(`${API_URL}/users/${id}/following`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Takip edilenler alınamadı');
    return await res.json();
  },
  createList: async (userId, name) => {
    const res = await fetch(`${API_URL}/users/${userId}/lists`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error('Liste oluşturulamadı');
    return await res.json();
  },
  getUserLists: async (userId) => {
    const res = await fetch(`${API_URL}/users/${userId}/lists`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Listeler alınamadı');
    return await res.json();
  },
  addContentToList: async (listId, contentData) => {
      const res = await fetch(`${API_URL}/users/lists/${listId}/content`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(contentData)
      });
      if (!res.ok) throw new Error('Listeye eklenemedi');
      return await res.json();
  },
  removeContentFromList: async (listId, contentId) => {
      const res = await fetch(`${API_URL}/users/lists/${listId}/content/${contentId}`, {
          method: 'DELETE',
          headers: getHeaders()
      });
      if (!res.ok) throw new Error('Listeden kaldırılamadı');
      return await res.json();
  }
};

export const contentService = {
  search: async (query, type, year, minRating, genre, page = 1) => {
    const res = await fetch(`${API_URL}/content/search?query=${query}&type=${type || ''}&year=${year || ''}&minRating=${minRating || ''}&genre=${genre || ''}&page=${page}`);
    if (!res.ok) throw new Error('Arama hatası');
    return await res.json();
  },
  
  getDetails: async (id, type) => {
    const res = await fetch(`${API_URL}/content/${type}/${id}`);
    if (!res.ok) throw new Error('Detay hatası');
    return await res.json();
  },
  getTopRated: async () => {
    const res = await fetch(`${API_URL}/content/top-rated`);
    if (!res.ok) throw new Error('En iyiler alınamadı');
    return await res.json();
  },
  getPopular: async () => {
    const res = await fetch(`${API_URL}/content/popular`);
    if (!res.ok) throw new Error('Popülerler alınamadı');
    return await res.json();
  }
};

export const activityService = {
    addToLibrary: async (data) => {
        const res = await fetch(`${API_URL}/activity/library`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Kütüphane güncellenemedi');
        return await res.json();
    },
    getUserLibrary: async () => {
        const res = await fetch(`${API_URL}/activity/library`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Kütüphane alınamadı');
        return await res.json();
    },
    getRecent: async () => {
        const res = await fetch(`${API_URL}/activity/recent`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Aktiviteler alınamadı');
        return await res.json();
    },
    getFeed: async () => {
        const res = await fetch(`${API_URL}/activity/feed`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Akış alınamadı');
        return await res.json();
    },
    getMyActivities: async () => {
        const res = await fetch(`${API_URL}/activity/my`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Aktivitelerim alınamadı');
        return await res.json();
    },
    addReview: async (data) => {
        const res = await fetch(`${API_URL}/activity/review`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Yorum eklenemedi');
        return await res.json();
    },
    getContentActivities: async (apiId, type) => {
        const res = await fetch(`${API_URL}/activity/content?apiId=${apiId}&type=${type}`);
        if (!res.ok) throw new Error('Yorumlar alınamadı');
        return await res.json();
    }
};
