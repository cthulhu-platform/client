'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/hooks/useAuth';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const PURPLE_THEME = '#6A4A98';

  const handleSignInClick = () => {
    // Store the current route (unless already on signin page)
    if (pathname !== '/signin') {
      localStorage.setItem('oauth_return_url', pathname);
    }
    router.push('/signin');
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 w-full z-50 bg-black border-b" style={{ borderColor: `${PURPLE_THEME}40` }}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Placeholder picture/logo on the left */}
          <div className="flex items-center" onClick={() => router.push('/') } style={{ cursor: 'pointer' }}>
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${PURPLE_THEME}20` }}
            >
              <span className="text-xl font-black" style={{ color: PURPLE_THEME }}>C</span>
            </div>
          </div>

          {/* Signin/Logout button on the right */}
          {isAuthenticated ? (
            <button
              onClick={handleLogoutClick}
              className="py-2 px-6 rounded-lg transition-colors font-medium"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
              }}
            >
              Logout
            </button>
          ) : (
            <button
              onClick={handleSignInClick}
              className="py-2 px-6 rounded-lg transition-colors font-medium"
              style={{
                backgroundColor: PURPLE_THEME,
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#8B6FB8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = PURPLE_THEME;
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

