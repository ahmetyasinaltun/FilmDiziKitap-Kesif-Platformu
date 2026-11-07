import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SearchPage } from './pages/SearchPage';
import { TitlePage } from './pages/TitlePage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/film/:id', element: <TitlePage type="movie" /> },
      { path: '/dizi/:id', element: <TitlePage type="tv" /> },
      { path: '/kitap', element: <ComingSoonPage title="Kitaplar" /> },
      { path: '/kitap/:id', element: <ComingSoonPage title="Kitap" /> },
      { path: '/kisi/:id', element: <ComingSoonPage title="Kişi" /> },
      { path: '/arama', element: <SearchPage /> },
      { path: '/giris', element: <ComingSoonPage title="Giriş" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
