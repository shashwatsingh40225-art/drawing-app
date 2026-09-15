import { createBrowserRouter, Navigate, useParams, useLocation } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

function LegacySketchbookRedirect() {
  const { id } = useParams();
  const location = useLocation();
  const target = id ? `/my-art/${id}` : '/my-art';
  return <Navigate to={`${target}${location.search}${location.hash}`} replace />;
}

function LegacySketchbookEditRedirect() {
  const { id } = useParams();
  const location = useLocation();
  const target = id ? `/my-art/${id}/edit` : '/my-art';
  return <Navigate to={`${target}${location.search}${location.hash}`} replace />;
}
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomeScreen } from './screens/HomeScreen';
import { AboutScreen } from './screens/AboutScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { SketchbookScreen } from './screens/SketchbookScreen';
import { PersonalArtworkDetailScreen } from './screens/PersonalArtworkDetailScreen';
import { ArtworkEditScreen } from './screens/ArtworkEditScreen';
import { UploadScreen } from './screens/UploadScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { BookDetailScreen } from './screens/BookDetailScreen';
import { ReaderScreen } from './screens/ReaderScreen';
import { ArchiveScreen } from './screens/ArchiveScreen';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <ErrorBoundary>
        <LoginScreen />
      </ErrorBoundary>
    ),
  },
  {
    path: '/signup',
    element: (
      <ErrorBoundary>
        <SignUpScreen />
      </ErrorBoundary>
    ),
  },
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <AppLayout />
      </ErrorBoundary>
    ),
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'about', element: <AboutScreen /> },
      // My Art (renamed from /sketchbook)
      { path: 'my-art', element: <SketchbookScreen /> },
      { path: 'my-art/:id', element: <PersonalArtworkDetailScreen /> },
      { path: 'my-art/:id/edit', element: <ArtworkEditScreen /> },
      // Redirect old /sketchbook paths to /my-art preserving IDs, query parameters, and hash
      { path: 'sketchbook', element: <LegacySketchbookRedirect /> },
      { path: 'sketchbook/:id', element: <LegacySketchbookRedirect /> },
      { path: 'sketchbook/:id/edit', element: <LegacySketchbookEditRedirect /> },
      // Upload
      { path: 'upload', element: <UploadScreen /> },
      // My Library (PDF books)
      { path: 'library', element: <LibraryScreen /> },
      { path: 'library/:id', element: <BookDetailScreen /> },
      // PDF Reader
      { path: 'reader/:id', element: <ReaderScreen /> },
      // Kin Archive
      { path: 'archive', element: <ArchiveScreen /> },
      // Redirect old /art-room routes to /
      { path: 'art-room', element: <Navigate to="/" replace /> },
      { path: 'art-room/*', element: <Navigate to="/" replace /> },
      // Redirect old /discover routes away
      { path: 'discover', element: <Navigate to="/" replace /> },
      { path: 'discover/*', element: <Navigate to="/" replace /> },
      { path: 'favorites', element: <Navigate to="/" replace /> },
      // Catch-all
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
