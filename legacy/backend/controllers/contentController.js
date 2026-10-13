const axios = require('axios');
const { Content, Activity, sequelize } = require('../models');
const { Op } = require('sequelize');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

console.log("ContentController loaded. TMDB Key available:", !!TMDB_API_KEY);

exports.searchContent = async (req, res) => {
  const { query, type, year, minRating, genre, page = 1 } = req.query;
  const pageNum = parseInt(page) || 1;

  try {
    
    if (minRating && !isNaN(parseFloat(minRating))) {
        
        
        const whereClause = {
            title: { [Op.like]: `%${query}%` },
            rating: { [Op.gte]: parseFloat(minRating) }
        };
        if (type && type !== 'all') whereClause.type = type;
        if (year) {
             
             whereClause.releaseDate = { [Op.like]: `${year}%` };
        }

        const localResults = await Content.findAll({ where: whereClause });
        return res.json(localResults);
    }


    let results = [];

    
    const tmdbGenres = {
        'comedy': 35,
        'action': 28,
        'drama': 18,
        'scifi': 878,
        'horror': 27,
        'romance': 10749
    };

    if (type === 'movie' || !type || type === 'all') {
      if (TMDB_API_KEY) {
        let url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}&page=${pageNum}`;
        if (year) url += `&primary_release_year=${year}`;
        
        
        
        
        
        const tmdbRes = await axios.get(url);
        let movies = tmdbRes.data.results.map(m => ({
          apiId: m.id,
          title: m.title,
          type: 'movie',
          poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
          description: m.overview,
          releaseDate: m.release_date,
          genreIds: m.genre_ids
        }));

        if (genre && tmdbGenres[genre]) {
            movies = movies.filter(m => m.genreIds && m.genreIds.includes(tmdbGenres[genre]));
        }

        results = [...results, ...movies];
      }
    }

    if (type === 'book' || !type || type === 'all') {
      if (GOOGLE_BOOKS_API_KEY) {
        let googleQuery = query;
        if (genre) googleQuery += `+subject:${genre}`; 

        const startIndex = (pageNum - 1) * 20;
        const booksRes = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${googleQuery}&key=${GOOGLE_BOOKS_API_KEY}&startIndex=${startIndex}&maxResults=20`);
        if (booksRes.data.items) {
          let books = booksRes.data.items.map(b => ({
            apiId: b.id,
            title: b.volumeInfo.title,
            type: 'book',
            poster: b.volumeInfo.imageLinks?.thumbnail || null,
            description: b.volumeInfo.description,
            author: b.volumeInfo.authors?.join(', '),
            releaseDate: b.volumeInfo.publishedDate
          }));
          
          if (year) {
              books = books.filter(b => b.releaseDate && b.releaseDate.startsWith(year));
          }
          
          results = [...results, ...books];
        }
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Arama sırasında hata oluştu' });
  }
};

exports.getContentDetails = async (req, res) => {
  const { id, type } = req.params;

  try {
    
    let contentData = await Content.findOne({ where: { apiId: id.toString(), type } });
    if (contentData) {
        return res.json(contentData);
    }

    
    contentData = null;

    if (type === 'movie') {
        const tmdbRes = await axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits`);
        const m = tmdbRes.data;
        
        
        const directors = m.credits?.crew?.filter(c => c.job === 'Director').map(c => c.name).join(', ');

        contentData = {
            apiId: m.id,
            title: m.title,
            type: 'movie',
            poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
            description: m.overview,
            releaseDate: m.release_date,
            genre: m.genres.map(g => g.name).join(', '),
            duration: m.runtime,
            director: directors
        };
    } else if (type === 'book') {
        if (GOOGLE_BOOKS_API_KEY) {
            const booksRes = await axios.get(`https://www.googleapis.com/books/v1/volumes/${id}?key=${GOOGLE_BOOKS_API_KEY}`);
            const b = booksRes.data;
            contentData = {
                apiId: b.id,
                title: b.volumeInfo.title,
                type: 'book',
                poster: b.volumeInfo.imageLinks?.thumbnail || null,
                description: b.volumeInfo.description,
                author: b.volumeInfo.authors?.join(', '),
                releaseDate: b.volumeInfo.publishedDate,
                genre: b.volumeInfo.categories?.join(', '),
                pageCount: b.volumeInfo.pageCount
            };
        }
    }

    
    if (contentData) {
        await Content.findOrCreate({
            where: { apiId: contentData.apiId.toString(), type: contentData.type },
            defaults: contentData
        });
    }

    res.json(contentData);
  } catch (error) {
    console.error('Details error:', error);
    res.status(500).json({ message: 'Detaylar alınamadı' });
  }
};

exports.getTopRated = async (req, res) => {
    try {
        
        const contents = await Content.findAll({
            attributes: {
                include: [
                    [sequelize.fn('AVG', sequelize.col('Activities.rating')), 'avgRating']
                ]
            },
            include: [{
                model: Activity,
                attributes: [],
                where: {
                    rating: { [Op.ne]: null }
                }
            }],
            group: ['Content.id'],
            order: [[sequelize.literal('"avgRating"'), 'DESC']],
            limit: 10,
            subQuery: false
        });

        
        
        
        
        res.json(contents);
    } catch (error) {
        console.error("Top rated error:", error);
        res.status(500).json({ message: 'Error fetching top rated' });
    }
};

exports.getPopular = async (req, res) => {
    try {
        
        const contents = await Content.findAll({
            attributes: {
                include: [
                    [sequelize.fn('COUNT', sequelize.col('Activities.id')), 'activityCount']
                ]
            },
            include: [{
                model: Activity,
                attributes: []
            }],
            group: ['Content.id'],
            having: sequelize.literal('COUNT("Activities"."id") > 0'), 
            order: [[sequelize.literal('"activityCount"'), 'DESC']],
            limit: 10,
            subQuery: false
        });

        res.json(contents);
    } catch (error) {
        console.error("Popular fetch error:", error);
        res.status(500).json({ message: 'Error fetching popular' });
    }
};