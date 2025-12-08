import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from './store/useAuthStore.js';
import { useThemeStore } from './store/useThemeStore.js';
import { useUIStore } from './store/useUIStore.js';
import { useUserStore } from './store/useUserStore.js';
import { useProfileStore } from './store/useProfileStore.js';

import { Loader } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

import AppRoutes from './AppRoutes.jsx';

import Navbar from './components/Navbar';
import ChatbotIcon from './components/ChatbotComponents/ChatBotIcon.jsx';

const App = () => {
  const navigate = useNavigate();

  const { authUser, checkAuth, checkActiveRoom, subscribeToSelfRoom, isCheckingAuth, socket } = useAuthStore();
  const { theme } = useThemeStore();
  const { getSelfProfile } = useProfileStore();

  // only run once on mount (avoid infinite loop)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);



  useEffect(() => {
    if (authUser) {
      getSelfProfile();
    }
  }, [authUser, getSelfProfile]);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  // console.log({ authUser })

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
