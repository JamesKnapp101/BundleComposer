import { Outlet } from 'react-router-dom';
import { ModalProvider } from '../ui/modal/ModalProvider';
import './App.css';
import { AppProviders } from './providers';

const App = () => {
  return (
    <div id="app" className="bg-slate-50 listing-layout">
      <AppProviders>
        <ModalProvider>
          <Outlet />
        </ModalProvider>
      </AppProviders>
    </div>
  );
};
export default App;
