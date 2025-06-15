import React, { useState, useEffect, useCallback } from 'react'; // Import useEffect, useCallback
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Bell } from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns'; // For time formatting
import { toast } from 'sonner'; // For toast messages

// Use environment variable for API base URL with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ? 
  `${import.meta.env.VITE_API_BASE_URL}/api` : 
  'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Header = ({ toggleSidebar }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/notifications`);
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch notifications.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
  // Get current date in a readable format
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString(undefined, options);
  
  const unreadCount = notifications.filter(n => n.status === 'unread').length; // Use status
  
  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/notifications/read/${id}`);
      setNotifications(notifications.map(notif => 
        notif._id === id ? { ...notif, status: 'read' } : notif
      ));
      toast.success("Notification marked as read.");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read.");
    }
  };
  
  const markAllAsRead = async () => {
    try {
      await Promise.all(notifications.filter(n => n.status === 'unread').map(n => axios.put(`${API_BASE_URL}/notifications/read/${n._id}`)));
      setNotifications(notifications.map(notif => ({ ...notif, status: 'read' })));
      toast.success("All notifications marked as read.");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read.");
    }
  };
  
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* Left side with menu toggle */}
        <div className="flex items-center">
          <button
            type="button"
            className="lg:hidden text-gray-600 hover:text-gray-900 focus:outline-none"
            onClick={toggleSidebar}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Date display */}
          <div className="ml-4 hidden md:block">
            <p className="text-sm text-gray-600">{formattedDate}</p>
          </div>
        </div>
        
        {/* Right side with actions */}
        <div className="flex items-center space-x-4">
          {/* Clock in/out button */}
          <button 
            onClick={() => navigate('/attendance')}
            className="px-3 py-1.5 bg-ems-accent text-white rounded-md hover:bg-ems-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ems-accent/50 hidden sm:block"
          >
            Clock In/Out
          </button>
          
          {/* Notifications */}
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                  <button className="text-gray-600 hover:text-gray-900 focus:outline-none relative">
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <div className="bg-white rounded-md shadow-lg relative overflow-hidden"> {/* Added relative and overflow-hidden */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-center text-gray-500">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification._id} // Use _id
                          className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${notification.status === 'unread' ? 'bg-blue-50' : ''}`} // Use status
                          onClick={() => markAsRead(notification._id)} // Use _id
                        >
                          <div className="flex justify-between">
                            <h4 className="text-sm font-medium">
                              {notification.type === 'leave_request' ? 'New Leave Request' :
                               notification.type === 'leave_status_update' ? 'Leave Status Update' :
                               notification.type === 'new_occasion' ? 'New Occasion' :
                               'Notification'}
                            </h4>
                            {notification.status === 'unread' && ( // Use status
                              <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                          {notification.sender && (
                            <p className="text-xs text-gray-500 mt-1">From: {notification.sender.name}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-200">
                    <button 
                      onClick={() => navigate('/notifications')}
                      className="w-full text-center text-sm text-gray-600 hover:text-gray-900 py-1"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* User menu */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center focus:outline-none"
              onClick={() => navigate('/profile')}
            >
              {currentUser && (
                <>
                  <div className="hidden md:block mr-2 text-right">
                    <p className="text-sm font-medium">{currentUser.name}</p>
                    <p className="text-xs text-gray-500">{currentUser.department}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200">
                    <img
                      src={currentUser.profileImage}
                      alt={currentUser.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
