
import React, { useState, useEffect, useCallback } from 'react'; // Import useState, useEffect, useCallback
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import axios from 'axios'; // Import axios
import { toast } from 'sonner'; // Import toast for errors

// Use environment variable for API base URL with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ? 
  `${import.meta.env.VITE_API_BASE_URL}/api` : 
  'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { currentUser, isAuthenticated, hasRole, logout } = useAuth(); // Get isAuthenticated
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadNotificationsCount = useCallback(async () => {
    if (!isAuthenticated || !currentUser) {
      setUnreadCount(0);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications`);
      const unread = response.data.filter(n => n.status === 'unread').length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching unread notifications count:", error);
      toast.error("Failed to fetch notification count.");
      setUnreadCount(0); // Reset count on error
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    fetchUnreadNotificationsCount();
    // Optionally, set up a polling mechanism or listen to socket events for real-time updates
    // For now, a simple fetch on mount/auth change is sufficient.
  }, [fetchUnreadNotificationsCount]);
  
  // Links for navigation
  const navigationLinks = [
    {
      name: 'Dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
      path: '/dashboard',
      forRoles: ['admin', 'manager', 'employee'],
    },
    {
      name: 'Goals',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
      path: '/goals',
      forRoles: ['admin', 'manager', 'employee'],
    },
    {
      name: 'Tasks',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v2h8V6zm-2 4H6v2h6v-2z" clipRule="evenodd" />
        </svg>
      ),
      path: '/tasks',
      forRoles: ['admin', 'manager', 'employee'],
    },
    {
      name: 'Attendance',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
      path: '/attendance',
      forRoles: ['admin', 'manager', 'employee'],
    },
    {
      name: 'Notifications',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
      ),
      path: '/notifications',
      forRoles: ['admin', 'manager', 'employee'],
      hasBadge: true,
    },
    {
      name: 'Occasions',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
      path: '/occasions',
      forRoles: ['admin', 'manager', 'employee'],
    },
    {
      name: 'Employees',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
      ),
      path: '/employees',
      forRoles: ['admin', 'manager'],
    },
    {
      name: 'Reports',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
        </svg>
      ),
      path: '/reports',
      forRoles: ['admin', 'manager'],
    },
    {
      name: 'Settings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
      path: '/settings',
      forRoles: ['admin'],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-10 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 z-20 h-full w-64 bg-sidebar transition-transform duration-300 transform lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-sidebar-foreground">EMS</h1>
          </div>
          
          {/* User info */}
          {currentUser && (
            <div className="flex flex-col items-center py-6 border-b border-sidebar-border">
              <div className="w-20 h-20 rounded-full overflow-hidden mb-3">
                <img 
                  src={currentUser.profileImage} 
                  alt={currentUser.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-sidebar-foreground font-medium">{currentUser.name}</h3>
              <p className="text-sidebar-foreground/70 text-sm">{currentUser.position}</p>
              <span className="mt-2 px-3 py-1 bg-sidebar-accent text-xs rounded-full text-sidebar-foreground">
                {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
              </span>
            </div>
          )}
          
          {/* Navigation */}
          <nav className="flex-1 py-6 px-4 overflow-y-auto">
            <ul className="space-y-1">
              {navigationLinks.map((link) => {
                // Show link only if user has the required role
                if (hasRole(link.forRoles)) {
                  return (
                    <li key={link.name}>
                      <NavLink 
                        to={link.path}
                        className={({ isActive }) => 
                          `sidebar-link ${isActive ? 'active' : ''}`
                        }
                        onClick={() => setIsMobileOpen(false)}
                      >
                        {link.icon}
                        <span>{link.name}</span>
                        {link.hasBadge && unreadCount > 0 && (
                          <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          </nav>
          
          {/* Logout button */}
          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={logout}
              className="flex items-center justify-center w-full px-4 py-2 bg-sidebar-accent text-sidebar-foreground rounded-md hover:bg-sidebar-accent/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10 1H7v2h6V4zm0 4H7v2h6V8zm0 4H7v2h6v-2z" clipRule="evenodd" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
