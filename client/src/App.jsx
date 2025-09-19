import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from './store/useAuthStore.js';
import { useThemeStore } from './store/useThemeStore.js';
import { useChatStore } from './store/useChatStore.js';

import { Loader } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

import AppRoutes from './AppRoutes.jsx';

import Navbar from './components/Navbar';

const App = () => {
  const navigate = useNavigate();

  const { authUser, checkAuth, checkActiveRoom, isCheckingAuth } = useAuthStore();
  const { navigationTarget } = useChatStore();
  const { theme } = useThemeStore();

  // only run once on mount (avoid infinite loop)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser) {
      checkActiveRoom();
    }
  }, [authUser, checkActiveRoom]);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  useEffect(() => {
    if (!navigationTarget) return;
    navigate(navigationTarget);
    // clear the flag so subsequent code can set it again later without any 
    useChatStore.setState({ navigationTarget: null }); // VERY VERY IMPORTANT DONT TOUCH: DANGEROUS
  }, [navigationTarget]);

  console.log({ authUser })

  if (isCheckingAuth && !authUser) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader className='size-10 animate-spin' />
      </div>
    );
  }

  return (
    <div className=''>
      <Navbar />
      <AppRoutes />
      <Toaster />
    </div>
  )
}

export default App;
