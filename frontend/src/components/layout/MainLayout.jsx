
import React, { useState, useEffect } from 'react'; // Import useEffect
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useSocket } from '../SocketContext'; // Import useSocket
import { toast } from 'sonner'; // Import toast from sonner
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { currentUser, isAuthenticated, loading } = useAuth(); // Get currentUser
  const socket = useSocket(); // Get socket instance

  useEffect(() => {
    if (socket) {
      socket.on('new_notification', (notification) => {
        console.log('New notification received:', notification);
        toast.info(notification.message, {
          description: `From: ${notification.sender?.name || 'System'}`,
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => {
              // Navigate to notifications page or specific related item
              // For now, just navigate to notifications page
              window.location.href = '/notifications'; // Simple navigation
            },
          },
        });
        // You might want to increment a notification count here and pass it to Header
      });

      // Clean up event listener
      return () => {
        socket.off('new_notification');
      };
    }
  }, [socket]); // Re-run when socket instance changes
  
  // If still loading auth state, show loading indicator
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ems-primary"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  const toggleSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        <footer className="py-4 px-6 bg-white border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Employee Management System. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
