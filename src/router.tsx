import { createHashRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
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
import { ArtRoomScreen } from './screens/ArtRoomScreen';

export const router = createHashRouter([
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
      // Redirect old /sketchbook paths to /my-art
      { path: 'sketchbook', element: <Navigate to="/my-art" replace /> },
      { path: 'sketchbook/:id', element: <Navigate to="/my-art" replace /> },
      { path: 'sketchbook/:id/edit', element: <Navigate to="/my-art" replace /> },
      // Upload
      { path: 'upload', element: <UploadScreen /> },
      // My Library (PDF books)
      { path: 'library', element: <LibraryScreen /> },
      { path: 'library/:id', element: <BookDetailScreen /> },
      // PDF Reader
      { path: 'reader/:id', element: <ReaderScreen /> },
      // Kin Archive
      { path: 'archive', element: <ArchiveScreen /> },
      // My Art Room
      { path: 'art-room', element: <ArtRoomScreen /> },
      // Redirect old /discover routes away
      { path: 'discover', element: <Navigate to="/" replace /> },
      { path: 'discover/*', element: <Navigate to="/" replace /> },
      { path: 'favorites', element: <Navigate to="/" replace /> },
      // Catch-all
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
