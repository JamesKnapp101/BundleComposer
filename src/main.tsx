import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './app/App';
import BundleComposer from './features/bundleComposer/BundleComposer';
import { store } from './features/bundleComposer/store/store';
import './index.css';
import LandingListPage from './landingPage/LandingListPage';
import { ensureScenarioInitialized } from './lib/mockBootstrap';

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

const boot = async () => {
  await ensureScenarioInitialized();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Provider store={store}>
        <RouterProvider router={router} />
        <Toaster richColors closeButton position="bottom-right" visibleToasts={5} expand={true} />
      </Provider>
    </StrictMode>,
  );
};
boot();
