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
import { DiscoveryFlow } from './screens/DiscoveryFlow';

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
      { path: 'sketchbook', element: <SketchbookScreen /> },
      { path: 'sketchbook/:id', element: <PersonalArtworkDetailScreen /> },
      { path: 'sketchbook/:id/edit', element: <ArtworkEditScreen /> },
      { path: 'upload', element: <UploadScreen /> },
      { path: 'discover', element: <DiscoveryFlow /> },
      { path: 'discover/processing', element: <DiscoveryFlow /> },
      { path: 'discover/results', element: <DiscoveryFlow /> },
      { path: 'discover/results/:id', element: <DiscoveryFlow /> },
      { path: 'favorites', element: <DiscoveryFlow /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
