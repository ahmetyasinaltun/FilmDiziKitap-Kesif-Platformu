export const MOCK_USERS = [
  { id: 1, name: 'Ahmet Yılmaz', username: '@ahmety', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmet', bio: 'Bilim kurgu ve fantastik edebiyat tutkunu.' },
  { id: 2, name: 'Ayşe Demir', username: '@aysed', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ayse', bio: 'Sinema öğrencisi, film eleştirmeni.' },
  { id: 3, name: 'Mehmet Kaya', username: '@mehmetk', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mehmet', bio: 'Her gün 50 sayfa kitap okuma hedefim var.' },
];

export const MOCK_CONTENT = [
  {
    id: 101,
    type: 'movie',
    title: 'Inception',
    year: 2010,
    poster: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    director: 'Christopher Nolan',
    description: 'Çok yetenekli bir hırsız olan Dom Cobb (Leonardo DiCaprio), zihnin en savunmasız olduğu rüya görme anında, bilinçaltının derinliklerindeki değerli sırları çekip çıkarmakta ve onları çalmakta çok yeteneklidir.',
    rating: 8.8,
    genres: ['Bilim Kurgu', 'Aksiyon']
  },
  {
    id: 102,
    type: 'book',
    title: '1984',
    year: 1949,
    poster: 'https://covers.openlibrary.org/b/id/7222246-L.jpg',
    author: 'George Orwell',
    description: 'Binlerce yılın ardından, Okyanusya halkı, Parti\'nin her şeyi gören gözü Büyük Birader\'in gölgesi altında yaşamaktadır. Gerçek, Parti\'nin söylediği şeydir.',
    rating: 9.1,
    genres: ['Distopya', 'Politik']
  },
  {
    id: 103,
    type: 'movie',
    title: 'Interstellar',
    year: 2014,
    poster: 'https:
    director: 'Christopher Nolan',
    description: 'İnsanlığın dünyadaki süresi dolarken, bir grup kaşif insanlık tarihinin en önemli görevini üstlenirler: Yıldızların ötesine yolculuk ederek insanlığın geleceğini kurtarmak.',
    rating: 8.7,
    genres: ['Bilim Kurgu', 'Dram']
  },
  {
    id: 104,
    type: 'book',
    title: 'Dune',
    year: 1965,
    poster: 'https://covers.openlibrary.org/b/id/12656006-L.jpg',
    author: 'Frank Herbert',
    description: 'Çöl gezegeni Arrakis, evrendeki en değerli madde olan "baharat"ın tek kaynağıdır. Paul Atreides, ailesini ve halkını korumak için zorlu bir mücadeleye girer.',
    rating: 8.9,
    genres: ['Bilim Kurgu', 'Macera']
  },
    {
    id: 105,
    type: 'movie',
    title: 'The Godfather',
    year: 1972,
    poster: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    director: 'Francis Ford Coppola',
    description: 'İkinci Dünya Savaşı sonrası New York şehrinde, Corleone suç ailesinin yaşlanan lideri, gizli imparatorluğunun kontrolünü isteksiz en küçük oğluna devreder.',
    rating: 9.2,
    genres: ['Suç', 'Dram']
  },
];

export const INITIAL_ACTIVITIES = [
  {
    id: 1,
    userId: 2,
    contentId: 101,
    type: 'review', 
    text: 'Christopher Nolan yine yapmış yapacağını. Rüya katmanları arasındaki geçişler inanılmazdı. Kesinlikle tekrar izlenmesi gereken bir başyapıt.',
    rating: 9,
    timestamp: '2 saat önce',
    likes: 12,
    comments: 3
  },
  {
    id: 2,
    userId: 3,
    contentId: 102,
    type: 'rating',
    rating: 10,
    timestamp: '5 saat önce',
    likes: 24,
    comments: 0
  },
  {
    id: 3,
    userId: 1,
    contentId: 104,
    type: 'review',
    text: 'Kitabın atmosferi filmlerden çok daha derin. Herbert\'in evren tasarımı beni benden aldı.',
    rating: 8,
    timestamp: '1 gün önce',
    likes: 5,
    comments: 1
  }
];
