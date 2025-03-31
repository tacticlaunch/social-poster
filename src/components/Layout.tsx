import { useEffect, useState } from 'react';
import { Link, useLocation, Navigate, Outlet, useNavigate } from 'react-router-dom';

import { isLoggedIn, logout } from '@/services/telegramService';
import Settings from './Settings';



export const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedIn = await isLoggedIn();
        setAuthenticated(loggedIn);
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2b5278]"></div>
      </div>
    );
  }

  if (!authenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname === '/login' && authenticated) {
    return <Navigate to="/messages" replace />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#1f1f1f]">
      <header className="bg-[#2f2f2f] border-b border-[#3f3f3f]">
        <div className="containermax-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/messages" className="text-white font-bold text-xl">
                  Social Poster
                </Link>
              </div>
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/messages"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/messages'
                      ? 'border-[#2b5278] text-white'
                      : 'border-transparent text-[#a8a8a8] hover:border-[#3f3f3f] hover:text-white'
                  }`}
                >
                  Messages
                </Link>
                {/* <Link
                  to="/templates"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/templates'
                      ? 'border-[#2b5278] text-white'
                      : 'border-transparent text-[#a8a8a8] hover:border-[#3f3f3f] hover:text-white'
                  }`}
                >
                  Templates
                </Link> */}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Settings />
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="text-[#a8a8a8] hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container flex-1 overflow-hidden min-w-full max-w-7xl mx-auto pt-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#1f1f1f] text-[#a8a8a8] py-4 px-6 border-t border-[#3f3f3f]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-sm">
            © 2024 Social Poster. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/tacticlaunch/social-poster"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#a8a8a8] hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}; 

export default Layout; 