import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { AuthPage } from './pages/AuthPage';
import { BookPage } from './pages/BookPage';
import { BooksPage } from './pages/BooksPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { HomePage } from './pages/HomePage';
import { LibraryPage } from './pages/LibraryPage';
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
      { path: '/kitap', element: <BooksPage /> },
      { path: '/kitap/:id', element: <BookPage /> },
      { path: '/yazar/:id', element: <ComingSoonPage title="Yazar" /> },
      { path: '/kisi/:id', element: <ComingSoonPage title="Kişi" /> },
      { path: '/arama', element: <SearchPage /> },
      { path: '/giris', element: <AuthPage mode="login" /> },
      { path: '/kayit', element: <AuthPage mode="register" /> },
      { path: '/kutuphane', element: <LibraryPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
