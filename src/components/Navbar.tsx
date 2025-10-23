import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../contexts/EventContext.tsx';
import { useNotifications } from '../contexts/NotificationContext';
import RefreshIndicator from './RefreshIndicator';
import ManualRefreshButton from './ManualRefreshButton';
import { 
  Calendar, 
  Home, 
  User, 
  LogOut, 
  Bell, 
  Plus,
  Menu,
  X,
  GraduationCap,
  QrCode,
  MoreHorizontal
} from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { loading: eventsLoading } = useEvents();
  const { notifications } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const navRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const isRefreshing = authLoading || eventsLoading;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
  ];

  if (user) {
    navItems.push({ path: '/dashboard', label: 'Dashboard', icon: User });
    if (user.role === 'organizer' || user.role === 'admin') {
      navItems.push({ path: '/create-event', label: 'Create Event', icon: Plus });
      navItems.push({ path: '/qr-scanner', label: 'QR Scanner', icon: QrCode });
    }
    if (user.role === 'admin') {
      navItems.push({ path: '/admin-users', label: 'Users', icon: User });
    }
  }

  // Calculate how many nav items can fit
  useEffect(() => {
    const calculateVisibleItems = () => {
      if (typeof window !== 'undefined') {
        const screenWidth = window.innerWidth;
        const totalItems = navItems.length;
        
        if (screenWidth >= 1280) { // xl screens
          setVisibleItems(totalItems); // Show all items
        } else if (screenWidth >= 1024) { // lg screens
          // Dynamically adjust based on available space and number of items
          const maxVisible = totalItems <= 6 ? totalItems : Math.max(4, totalItems - 2);
          setVisibleItems(Math.min(totalItems, maxVisible));
        } else {
          setVisibleItems(0); // Hide all, use mobile menu
        }
      }
    };

    calculateVisibleItems();
    window.addEventListener('resize', calculateVisibleItems);
    return () => window.removeEventListener('resize', calculateVisibleItems);
  }, [navItems.length]);

  // Close overflow menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setShowOverflowMenu(false);
      }
    };

    if (showOverflowMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOverflowMenu]);

  const visibleNavItems = navItems.slice(0, visibleItems);
  const hiddenNavItems = navItems.slice(visibleItems);

  // Use normal style on home page, glass style on all other pages
  const isHomePage = location.pathname === '/';
  const navbarClass = isHomePage 
    ? "fixed top-0 left-0 w-full z-50 bg-white shadow transition-all duration-300"
    : "fixed top-0 left-0 w-full z-50 navbar-glass transition-all duration-300";

  return (
    <nav className={navbarClass}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 lg:h-18 gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group flex-shrink-0 min-w-0">
            {/* College Logo */}
            <div className="p-1 bg-white rounded-lg shadow-sm border border-gray-200 group-hover:shadow-md transition-all duration-200">
              <img 
                src="/logo-small.png" 
                alt="College Logo" 
                className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                onError={(e) => {
                  // Fallback to graduation cap icon if logo fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden p-1.5 sm:p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
            </div>
            <span className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
              EventHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div ref={navRef} className="hidden lg:flex items-center space-x-1 xl:space-x-3 flex-1 justify-center max-w-4xl">
            {/* Visible Navigation Items */}
            {visibleNavItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                title={label} // Tooltip on hover
                className={`flex items-center space-x-1 px-1.5 xl:px-2 py-1.5 rounded-lg transition-colors text-xs xl:text-sm whitespace-nowrap ${
                  location.pathname === path 
                    ? 'text-blue-600 bg-blue-50 font-medium' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden xl:block font-medium">{label}</span>
                <span className="lg:block xl:hidden font-medium">
                  {label.length > 8 ? label.substring(0, 8) + '...' : label}
                </span>
              </Link>
            ))}
            
            {/* Overflow Menu - Only show when there are hidden items */}
            {hiddenNavItems.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowOverflowMenu(!showOverflowMenu)}
                  title="More options"
                  className="flex items-center px-1.5 xl:px-2 py-1.5 rounded-lg transition-colors text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="hidden xl:block font-medium ml-1">More</span>
                </button>
                
                {/* Overflow Dropdown */}
                {showOverflowMenu && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-50 py-2">
                    {hiddenNavItems.map(({ path, label, icon: Icon }) => (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setShowOverflowMenu(false)}
                        className={`flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors ${
                          location.pathname === path
                            ? 'text-blue-600 bg-blue-50 font-medium'
                            : 'text-gray-700 hover:text-blue-600'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side Items */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={toggleNotifications}
                    title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                    className="relative p-1 sm:p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center font-bold text-[10px] sm:text-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-64 sm:w-80 bg-white rounded-lg shadow-xl border z-50 max-h-80 overflow-hidden">
                      <div className="px-4 py-3 border-b bg-gray-50">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={() => {/* Mark all as read functionality */}}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="overflow-y-auto max-h-64">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-gray-500 text-sm">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 5).map(notification => (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 hover:bg-gray-50 border-l-4 ${
                                notification.read 
                                  ? 'border-gray-200' 
                                  : 'border-blue-500 bg-blue-50'
                              }`}
                            >
                              <p className="font-medium text-sm text-gray-800 line-clamp-2">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Refresh Controls - Only show on larger screens */}
                <div className="hidden xl:flex items-center space-x-1">
                  <RefreshIndicator isRefreshing={isRefreshing} />
                  <ManualRefreshButton showText={false} />
                </div>

                {/* Quick Actions for Admin/Organizer */}
                {(user.role === 'admin' || user.role === 'organizer') && (
                  <Link
                    to="/create-event"
                    title="Create Event"
                    className="p-1 sm:p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                )}

                {/* User Profile */}
                <Link
                  to="/profile"
                  title={`Profile - ${user.name}`}
                  className="flex items-center space-x-1 sm:space-x-2 px-1 sm:px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs sm:text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:block text-xs font-medium text-gray-700 max-w-16 lg:max-w-20 truncate">
                    {user.name}
                  </span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-1 sm:p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Link
                  to="/login"
                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors text-xs sm:text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs sm:text-sm"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title={isMenuOpen ? "Close menu" : "Open menu"}
              className="lg:hidden p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-3 border-t border-gray-200">
            <div className="space-y-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                    location.pathname === path
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{label}</span>
                </Link>
              ))}
              
              {/* Mobile Refresh Controls */}
              {user && (
                <div className="flex items-center justify-between px-3 py-2 mt-4 pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Refresh Status</span>
                  <div className="flex items-center space-x-2">
                    <RefreshIndicator isRefreshing={isRefreshing} />
                    <ManualRefreshButton showText={false} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;