import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TitlePage } from './pages/TitlePage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/film/:id', element: <TitlePage type="movie" /> },
      { path: '/dizi/:id', element: <TitlePage type="tv" /> },
      { path: '/kitap', element: <ComingSoonPage title="Kitaplar" /> },
      { path: '/arama', element: <ComingSoonPage title="Arama" /> },
      { path: '/giris', element: <ComingSoonPage title="Giriş" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
