import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Clapperboard,
  LayoutDashboard,
  Lightbulb,
  PlusCircle,
  Users,
  Film,
  FolderKanban,
  Download,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Crown,
  Home,
  User,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FirebaseSetupBanner } from './FirebaseSetupBanner';

interface AppLayoutProps {
  children: React.ReactNode;
  activeNav?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  actionButton?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeNav = 'Dashboard',
  pageTitle,
  pageSubtitle,
  actionButton,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090711] flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">
            Loading Studio...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const sidebarItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Generate Ideas', path: '/ideas', icon: Lightbulb },
    { name: 'Create Story', path: '/create-story', icon: PlusCircle },
    { name: 'Characters', path: '/characters', icon: Users },
    { name: 'Scenes & Prompts', path: '/stories', icon: Film, badge: 'Active' },
    { name: 'My Projects', path: '/stories', icon: FolderKanban },
    { name: 'Export', path: '/stories', icon: Download, badge: 'Ready' },
    { name: 'Subscription', path: '#', icon: CreditCard },
    { name: 'Settings', path: '#', icon: Settings },
    { name: 'Help & Support', path: '#', icon: HelpCircle },
  ];

  const mobileNavItems = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Ideas', path: '/ideas', icon: Lightbulb },
    { name: 'Create', path: '/create-story', icon: PlusCircle, highlight: true },
    { name: 'Cast', path: '/characters', icon: Users },
    { name: 'Projects', path: '/stories', icon: FolderKanban },
  ];

  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const userPlan = (user.plan || 'free').toUpperCase();

  return (
    <div className="min-h-screen bg-[#090711] text-slate-100 flex flex-col lg:flex-row relative selection:bg-purple-600 selection:text-white pb-20 lg:pb-0 print:pb-0 print:bg-white print:text-black">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-68 bg-[#0d0a18] border-r border-purple-900/30 shrink-0 sticky top-0 h-screen overflow-y-auto z-20 print:hidden">
        {/* Studio Logo */}
        <Link to="/dashboard" className="p-6 border-b border-purple-900/30 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-purple-600 p-0.5 shadow-md">
            <div className="w-full h-full bg-[#0d0a1a] rounded-[9px] flex items-center justify-center">
              <Clapperboard className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div>
            <span className="font-black text-sm tracking-tight text-white block">
              AI DRAMA <span className="gold-gradient-text">CREATOR</span>
            </span>
            <span className="text-[10px] text-purple-300/60 font-semibold tracking-wider uppercase">
              Production Studio
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isCurrent =
              location.pathname === item.path ||
              (item.path !== '/' && item.path !== '#' && location.pathname.startsWith(item.path)) ||
              activeNav === item.name;

            if (item.path === '#') {
              return (
                <div
                  key={item.name}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-300/40 cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-purple-400/40" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300/60 border border-purple-800/40">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-bold'
                    : 'text-purple-200/70 hover:text-white hover:bg-purple-950/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-purple-400'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-purple-900/30">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400/90 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        {/* Subscription Plan Card in Sidebar */}
        <div className="p-4 border-t border-purple-900/30">
          <div className="p-4 rounded-xl bg-gradient-to-b from-purple-950/60 to-purple-900/30 border border-purple-800/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                {userPlan} Plan
              </span>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                Active
              </span>
            </div>
            <p className="text-[11px] text-purple-200/70 mb-3">
              {user.creditsUsed || 0} / 1000 credits used
            </p>
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(5, ((user.creditsUsed || 0) / 1000) * 100))}%`,
                }}
              />
            </div>
            <button
              type="button"
              className="w-full py-2 rounded-lg purple-gradient-btn text-xs font-bold"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 bg-[#090711]/90 backdrop-blur-xl border-b border-purple-900/30 h-16 sm:h-18 px-4 sm:px-8 flex items-center justify-between gap-4 print:hidden">
          {/* Mobile Logo Brand */}
          <Link to="/dashboard" className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-purple-600 p-0.5">
              <div className="w-full h-full bg-[#0d0a1a] rounded-[6px] flex items-center justify-center">
                <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </div>
            <span className="font-extrabold text-sm text-white tracking-tight">AI DRAMA</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden sm:flex flex-1 max-w-md relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400/60">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories, characters, projects..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-purple-950/30 border border-purple-900/40 text-xs text-white placeholder:text-purple-300/40 focus:outline-none focus:border-amber-400/70"
            />
          </div>

          {/* Right Top Bar: Action, Notifications & User Profile */}
          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            {actionButton}

            <button
              type="button"
              className="w-9 h-9 rounded-xl bg-purple-950/40 border border-purple-900/40 text-purple-300 hover:text-white flex items-center justify-center relative transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400" />
            </button>

            {/* User Profile Badge */}
            <div className="flex items-center gap-3 pl-2 sm:pl-3 sm:border-l border-purple-900/40">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-amber-400 to-purple-600 p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-[#17132a] flex items-center justify-center font-bold text-xs text-amber-300">
                  {initials}
                </div>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">{user.fullName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-300 border border-amber-500/20 uppercase tracking-wider">
                    {userPlan}
                  </span>
                  <span className="text-[11px] text-purple-300/60 truncate max-w-[120px]">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8 print:p-0 print:m-0 print:max-w-none print:w-full print:space-y-0">
          <div className="print:hidden">
            <FirebaseSetupBanner />
          </div>

          {/* Optional Page Header */}
          {(pageTitle || pageSubtitle) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-purple-900/30 print:hidden">
              <div>
                {pageTitle && (
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    {pageTitle}
                  </h1>
                )}
                {pageSubtitle && (
                  <p className="text-xs sm:text-sm text-purple-200/70 mt-1">{pageSubtitle}</p>
                )}
              </div>
            </div>
          )}

          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0918]/95 backdrop-blur-xl border-t border-purple-900/40 px-3 py-2 flex items-center justify-around print:hidden">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isSelected =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          if (item.highlight) {
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => navigate(item.path)}
                className="w-12 h-12 -mt-6 rounded-full gold-gradient-btn flex items-center justify-center shadow-lg shadow-amber-500/30"
              >
                <Icon className="w-6 h-6 text-stone-950" />
              </button>
            );
          }

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-semibold transition-colors ${
                isSelected ? 'text-amber-400 font-bold' : 'text-purple-300/70'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
