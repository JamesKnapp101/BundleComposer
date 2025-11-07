import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import App from './app/App';
import BundleComposer from './features/bundleComposer/BundleComposer';
import LandingListPage from './features/bundleComposer/pages/LandingPage/LandingListPage';
import { store } from './features/bundleComposer/store/store';
import './index.css';

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/listing', element: <LandingListPage /> },
      {
        id: 'bundle-composer',
        path: '/bundle-composer',
        loader: async ({ request }) => {
          const url = new URL(request.url);
          const plans = (url.searchParams.get('plans') ?? '').split(',').filter(Boolean);
          const sections = (url.searchParams.get('sections') ?? '').split(',').filter(Boolean);
          if (!plans.length) throw new Response('No plans selected', { status: 400 });
          return { plans, sections };
        },
        element: <BundleComposer />,
      },
      { path: '/', element: <Navigate to="/listing" replace /> },
      { path: '*', element: <Navigate to="/listing" replace /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);
