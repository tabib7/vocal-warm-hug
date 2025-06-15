
import React, { useState, useEffect, useCallback } from 'react'; // Import useEffect, useCallback
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner'; // Use sonner toast
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns'; // For time formatting
import { Skeleton } from '../components/ui/skeleton'; // Import Skeleton

// Use environment variable for API base URL with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ? 
  `${import.meta.env.VITE_API_BASE_URL}/api` : 
  'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Notifications = () => {
  const { currentUser, isAuthenticated, hasRole } = useAuth(); // Get hasRole
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
      // This would ideally be a backend endpoint to mark all for a user
      // For now, iterate and mark individually or implement a bulk endpoint
      await Promise.all(notifications.filter(n => n.status === 'unread').map(n => axios.put(`${API_BASE_URL}/notifications/read/${n._id}`)));
      setNotifications(notifications.map(notif => ({ ...notif, status: 'read' })));
      toast.success("All notifications marked as read.");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read.");
    }
  };
  
  const deleteNotification = async (id) => {
    try {
      // Assuming a DELETE /api/notifications/:id endpoint exists
      // If not, this would need to be implemented on the backend
      await axios.delete(`${API_BASE_URL}/notifications/${id}`); // This endpoint needs to be added to backend
      setNotifications(notifications.filter(notif => notif._id !== id));
      toast.success("Notification deleted.");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification.");
    }
  };
  
  const clearAllNotifications = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/notifications/clear-all`); // Call the new 'clear-all' endpoint
      setNotifications([]); // Clear all notifications from state
      toast.success("All notifications cleared.");
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      toast.error("Failed to clear all notifications.");
    }
  };

  const handleLeaveAction = async (leaveId, status, adminNotes = '') => {
    if (!currentUser || !hasRole(['admin', 'manager'])) {
      toast.error("Not authorized to perform this action.");
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/leave/${leaveId}`, {
        status,
        adminId: currentUser.id,
        adminNotes,
      });
      toast.success(`Leave request ${status}.`);
      // Mark the related notification as read after action
      const relatedNotification = notifications.find(n => n.relatedId?._id === leaveId);
      if (relatedNotification) {
        await markAsRead(relatedNotification._id);
      }
      fetchNotifications(); // Re-fetch notifications to update the list
    } catch (error) {
      console.error("Error updating leave status:", error);
      toast.error(error.response?.data?.msg || "Failed to update leave status.");
    }
  };
  
  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        <p className="text-gray-600">View and manage your notifications</p>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium">All Notifications</h2>
            <p className="text-sm text-gray-500">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-x-2">
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                onClick={markAllAsRead}
                size="sm"
              >
                Mark all as read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="outline" 
                onClick={clearAllNotifications}
                size="sm"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 flex justify-between items-center">
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <div className="ml-4 flex space-x-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-gray-500">You're all caught up! Check back later for new notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div 
                key={notification._id} // Changed from notification.id to notification._id
                className={`p-4 hover:bg-gray-50 transition-colors ${notification.status === 'unread' ? 'bg-blue-50' : ''}`} // Use status
              >
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-medium">
                        {notification.type === 'leave_request' ? 'New Leave Request' :
                         notification.type === 'leave_status_update' ? 'Leave Status Update' :
                         notification.type === 'new_occasion' ? 'New Occasion' :
                         'Notification'}
                      </h3>
                      {notification.status === 'unread' && (
                        <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                    {notification.sender && (
                      <p className="mt-1 text-xs text-gray-500">From: {notification.sender.name}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                    {/* Action buttons for leave requests for admins/managers */}
                    {hasRole(['admin', 'manager']) && notification.type === 'leave_request' && notification.relatedId && notification.relatedId.status === 'pending' && (
                      <div className="flex space-x-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-green-500 text-white hover:bg-green-600"
                          onClick={() => handleLeaveAction(notification.relatedId._id, 'approved')}
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-red-500 text-white hover:bg-red-800"
                          onClick={() => handleLeaveAction(notification.relatedId._id, 'rejected', prompt('Reason for declining (optional):'))}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex items-start space-x-2">
                    {notification.status === 'unread' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => markAsRead(notification._id)}
                        className="text-xs"
                      >
                        Mark as read
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteNotification(notification._id)}
                      className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Notifications;
