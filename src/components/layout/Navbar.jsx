import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Moon, Sun, Menu, X } from 'lucide-react';

export function Navbar() {
  const { user, isAdmin, loginWithGoogle, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check initial preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 transition-all duration-200 hover:opacity-80 active:scale-95">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-shadow">
            V
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent hidden sm:inline-block">
            VisionX
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full w-10 h-10 hover:bg-primary/10 transition" aria-label="Toggle theme">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {isAdmin && (
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-500/20 text-green-700 uppercase tracking-wider">
              👑 Admin
            </span>
          )}

          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="transition hover:bg-primary/10">🛠️ Admin</Button>
                </Link>
              )}
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="transition hover:bg-primary/10">📊 Dashboard</Button>
              </Link>
              <div className="flex items-center gap-3 ml-2 border-l border-border pl-4">
                <span className="text-sm font-semibold text-foreground">
                  {user.displayName?.split(' ')[0] || 'User'}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={logout}
                  className="hover:bg-red-500/10 hover:border-red-500/50 transition active:scale-95"
                >
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <Button 
              onClick={loginWithGoogle} 
              size="sm"
              className="bg-gradient-to-r from-primary to-primary/80 transition hover:scale-105 active:scale-95"
            >
              🔐 Sign In
            </Button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="rounded-full w-9 h-9"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-full w-9 h-9"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/50 backdrop-blur-sm p-4 animate-in slide-in-from-top-2 space-y-3">
          {isAdmin && (
            <div className="px-3 py-2 text-xs font-bold rounded-lg bg-green-500/20 text-green-700 uppercase tracking-wider text-center">
              👑 Admin Mode
            </div>
          )}

          {user ? (
            <>
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" size="sm">🏠 Home</Button>
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start" size="sm">🛠️ Admin Dashboard</Button>
                </Link>
              )}
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" size="sm">📊 Dashboard</Button>
              </Link>
              <div className="border-t border-border pt-3 mt-3">
                <p className="text-xs text-muted-foreground px-3 mb-2">Signed in as: {user.email}</p>
                <Button 
                  variant="outline" 
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="w-full"
                  size="sm"
                >
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <Button 
              onClick={() => { loginWithGoogle(); setIsMobileMenuOpen(false); }}
              className="w-full bg-gradient-to-r from-primary to-primary/80"
              size="sm"
            >
              🔐 Sign In with Google
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}

