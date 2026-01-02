import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  LayoutDashboard,
  Mail,
  LogIn,
  UserPlus,
  LogOut,
  ChevronDown,
  Github,
  AlertTriangle,
  Zap,
  BarChart3,
  Lock,
  FileJson,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';

// Pages
import Home from './pages/Home';
import Features from './pages/Features';
import Scan from './pages/Scan';
import Dashboard from './pages/Dashboard';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';

// Types
export interface User {
  name: string;
  email: string;
}

const Navbar: React.FC<{ user: User | null; onLogout: () => void }> = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'Scan', path: '/scan' },
    { name: 'Dashboard', path: '/dashboard' }, // Adjusted dashboard path
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/30 group-hover:bg-cyan-500/30 transition-all duration-300">
              <ShieldCheck className="w-8 h-8 text-cyan-400" />
            </div>
            <span className="text-2xl font-light text-white">
              Repo<span className="font-extrabold text-cyan-400">Scantinel</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-cyan-400 ${
                  location.pathname === link.path ? 'text-cyan-400' : 'text-gray-300'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 glass-card px-4 py-2 rounded-full hover:bg-white/10 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-white">{user.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#0b111e] rounded-2xl py-2 shadow-xl border border-white/10">
                    <Link
                      to="/dashboard" // Adjusted dashboard path
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-cyan-400"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => { onLogout(); setIsDropdownOpen(false); }}
                      className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="bg-cyan-500 hover:bg-cyan-400 px-6 py-2 rounded-xl text-sm font-bold text-white transition-all flex items-center shadow-lg">
                <LogIn className="w-4 h-4 mr-2" /> Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-white"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden glass-card mx-4 rounded-3xl mt-2 py-4 px-6 absolute left-0 right-0 border border-white/10 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className="text-lg font-medium text-gray-300 hover:text-cyan-400"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10 flex flex-col space-y-4">
              {user ? (
                <>
                  <Link
                    to="/dashboard" // Adjusted dashboard path
                    onClick={() => setIsMenuOpen(false)}
                    className="text-lg font-medium text-cyan-400"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { onLogout(); setIsMenuOpen(false); }}
                    className="text-lg font-medium text-red-400 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-lg font-bold text-cyan-400"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};


const AppContent: React.FC<{ user: User | null; onLogout: () => void; onLogin: (u: User) => void }> = ({ user, onLogout, onLogin }) => {
  const location = useLocation();
  const isDashboard = location.pathname.includes('/dashboard');
  const isAuth = location.pathname === '/login' || location.pathname === '/register';

  // Restoring background classes to enable animation via global CSS
  let bgClass = 'animated-bg'; // This class needs to be defined in your global CSS for animation
  if (isDashboard) bgClass = 'solid-bg'; // This class needs to be defined in your global CSS
  else if (isAuth) bgClass = 'teal-animated-bg'; // This class needs to be defined in your global CSS for animation

  return (
    <div className={`${bgClass} min-h-screen text-gray-100 selection:bg-cyan-500/30 flex flex-col`}>
      <Navbar user={user} onLogout={onLogout} />
      <main className="pt-20 flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/dashboard" element={<Dashboard />} /> {/* Adjusted dashboard path */}
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login onLogin={onLogin} />} />
          <Route path="/register" element={<Register onRegister={onLogin} />} />
        </Routes>
      </main>

      {/* Footer from your desired UI */}
      <footer className="py-20 border-t border-white/5 bg-[#0b111e]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center">
          <div className="flex items-center space-x-2 mb-6">
            <ShieldCheck className="w-10 h-10 text-cyan-400" />
            <span className="text-3xl font-light text-white">
              Repo<span className="font-extrabold text-cyan-400">Scantinel</span>
            </span>
          </div>

          <p className="text-gray-400 text-lg max-w-2xl mb-8 leading-relaxed">
            Advanced static analysis for modern development.<br />
            Identifying risks before they hit production.
          </p>

          <div className="flex items-center justify-center space-x-12 text-gray-400 mb-12">
            <a href="mailto:lakshvpriya@gmail.com" className="hover:text-white transition-all transform hover:scale-110">
              <Mail className="w-8 h-8" />
            </a>
            <a href="https://github.com/Lakshvpriya2005" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-all transform hover:scale-110">
              <Github className="w-8 h-8" />
            </a>
          </div>

          <div className="w-full border-t border-white/5 pt-8">
            <p className="text-gray-500 text-sm font-medium tracking-wide">
              &copy; 2025 RepoScantinel. All Rights Reserved. | Project by Lakshmipriya V.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('repo_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (u: User) => {
    localStorage.setItem('repo_user', JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('repo_user');
    setUser(null);
  };

  return (
    <Router>
      <AppContent user={user} onLogout={handleLogout} onLogin={handleLogin} />
    </Router>
  );
};

export default App;
