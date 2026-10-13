import React, { useState } from 'react';
import { Search, Star, TrendingUp, Award, Filter } from 'lucide-react';
import { contentService } from '../services/api';

const DiscoverPage = ({ onSelectContent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); 
  const [year, setYear] = useState('');
  const [minRating, setMinRating] = useState('');
  const [genre, setGenre] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topRated, setTopRated] = useState([]);
  const [popular, setPopular] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  
  const genres = [
      { id: 'comedy', name: 'Komedi' },
      { id: 'action', name: 'Aksiyon' },
      { id: 'drama', name: 'Dram' },
      { id: 'scifi', name: 'Bilim Kurgu' },
      { id: 'horror', name: 'Korku' },
      { id: 'romance', name: 'Romantik' }
  ];

  React.useEffect(() => {
    const fetchShowcase = async () => {
        try {
            const [top, pop] = await Promise.all([
                contentService.getTopRated(),
                contentService.getPopular()
            ]);
            setTopRated(top);
            setPopular(pop);
        } catch (error) {
            console.error("Showcase error", error);
        }
    };
    fetchShowcase();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    setLoading(true);
    setPage(1);
    setHasMore(true);
    try {
        const data = await contentService.search(searchTerm, filterType === 'all' ? '' : filterType, year, minRating, genre, 1);
        setResults(data);
        if (data.length === 0) setHasMore(false);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleLoadMore = async (e) => {
      if (loading || !hasMore) return;
      
      
      if (e && e.target) {
          e.target.blur();
      }

      setLoading(true);
      const nextPage = page + 1;
      try {
          const data = await contentService.search(searchTerm, filterType === 'all' ? '' : filterType, year, minRating, genre, nextPage);
          if (data.length > 0) {
              setResults(prev => [...prev, ...data]);
              setPage(nextPage);
          } else {
              setHasMore(false);
          }
      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  const ContentGrid = ({ items, title, icon }) => (
    <div className="mb-8">
      {title && (
        <div className="flex items-center space-x-2 mb-4">
          {icon}
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item, index) => (
          <div 
            key={`${item.type}-${item.apiId}-${index}`} 
            onClick={() => onSelectContent(item)}
            className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="aspect-[2/3] relative overflow-hidden">
               <img src={item.poster || 'https://placehold.co/300x450?text=No+Image'} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               {item.rating && (
                   <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded flex items-center">
                       <Star size={12} className="text-yellow-400 mr-1 fill-yellow-400" />
                       {item.rating}
                   </div>
               )}
            </div>
            <div className="p-4">
               <h3 className="font-bold text-slate-800 truncate">{item.title}</h3>
               <div className="flex justify-between items-center mt-1">
                 <span className="text-xs text-slate-500">{item.releaseDate ? item.releaseDate.substring(0, 4) : 'N/A'}</span>
                 <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                   {item.type === 'movie' ? 'Film' : 'Kitap'}
                 </span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                type="text" 
                placeholder="Film, kitap veya yazar ara..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                Ara
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-2">
                <Filter size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Filtrele:</span>
            </div>
            
            <div className="flex gap-2">
                {['all', 'movie', 'book'].map(type => (
                <button 
                    key={type}
                    type="button"
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === type 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                >
                    {type === 'all' ? 'Tümü' : type === 'movie' ? 'Filmler' : 'Kitaplar'}
                </button>
                ))}
            </div>

            <div className="flex items-center space-x-2">
                <select 
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                >
                    <option value="">Tür Seçiniz</option>
                    {genres.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>
            </div>

            <div className="flex items-center space-x-2">
                <input 
                    type="number" 
                    placeholder="Yıl" 
                    className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                />
            </div>

            <div className="flex items-center space-x-2">
                <input 
                    type="number" 
                    placeholder="Min Puan" 
                    min="0" max="10" step="0.1"
                    className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                />
            </div>
          </div>
        </form>
      </div>

      {}
      {loading && results.length === 0 ? (
          <div className="text-center py-10">Aranıyor...</div>
      ) : (
          <>
            {results.length > 0 ? (
                <>
                    <ContentGrid items={results} title="Arama Sonuçları" icon={<Search className="text-blue-600" />} />
                    {hasMore && (
                        <div className="flex justify-center mt-8 mb-12">
                            <button 
                                onClick={handleLoadMore}
                                disabled={loading}
                                className="px-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 hover:shadow-md transition disabled:opacity-50"
                            >
                                {loading ? 'Yükleniyor...' : 'Daha Fazla Göster'}
                            </button>
                        </div>
                    )}
                </>
            ) : searchTerm ? (
                <div className="text-center py-10 text-slate-500">
                    Sonuç bulunamadı.
                </div>
            ) : (
                <>
                    {topRated.length > 0 && (
                        <ContentGrid items={topRated} title="En Yüksek Puanlılar" icon={<Award className="text-yellow-500" />} />
                    )}
                    {popular.length > 0 && (
                        <ContentGrid items={popular} title="Popüler İçerikler" icon={<TrendingUp className="text-red-500" />} />
                    )}
                    {!topRated.length && !popular.length && (
                        <div className="text-center py-10 text-slate-500">
                            Keşfetmek için arama yapın.
                        </div>
                    )}
                </>
            )}
          </>
      )}
    </div>
  );
};

export default DiscoverPage;
