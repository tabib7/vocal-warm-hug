import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './auth/AuthContext';
import axios from 'axios'; // Import axios

const SocketContext = createContext();

// Helper function to convert VAPID public key
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { currentUser, isAuthenticated } = useAuth();

  const subscribeUser = useCallback(async (userId) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Fetch VAPID public key from your backend
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/push/vapidPublicKey`);
        const vapidPublicKey = response.data.publicKey;
        console.log('VAPID Public Key received from backend:', vapidPublicKey);
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        console.log('Converted VAPID Public Key (Uint8Array):', convertedVapidKey);

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
        console.log('New push subscription created:', subscription);

        // Send subscription to your backend
        await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/push/subscribe`, {
          subscription,
          userId,
        });
        console.log('Push subscription sent to backend.');
      } else {
        console.log('Existing push subscription found:', subscription);
        // Optionally, send existing subscription to backend to ensure it's up-to-date
        await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/push/subscribe`, {
          subscription,
          userId,
        });
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      if (Notification.permission === 'denied') {
        console.warn('User denied notification permission.');
      }
    }
  }, []);

  const unsubscribeUser = useCallback(async (endpoint) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription && subscription.endpoint === endpoint) {
        await subscription.unsubscribe();
        console.log('Push subscription unsubscribed from browser.');
        await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/push/unsubscribe`, { endpoint });
        console.log('Push subscription removed from backend.');
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  }, []);

  useEffect(() => {
    // Handle Socket.IO connection
    if (isAuthenticated && currentUser && !socket) { // Only connect if not already connected
      const newSocket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        newSocket.emit('join_room', currentUser._id);
        if (currentUser.role === 'admin') {
          newSocket.emit('join_room', 'admin_room');
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      // Clean up socket on unmount or when user logs out
      return () => {
        newSocket.disconnect();
        setSocket(null); // Reset socket state
      };
    } else if (!isAuthenticated && socket) {
      // Disconnect socket if user logs out
      socket.disconnect();
      setSocket(null);
    }
  }, [isAuthenticated, currentUser]); // Dependencies: isAuthenticated, currentUser

  // Handle Push Notifications setup in a separate useEffect
  useEffect(() => {
    const setupPushNotifications = async () => {
      if (isAuthenticated && currentUser) {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered:', registration);
          } catch (error) {
            console.error('Service Worker registration failed:', error);
          }
        }

        // Request Notification permission and subscribe
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('Notification permission granted.');
            subscribeUser(currentUser._id);
          } else {
            console.warn('Notification permission denied or dismissed.');
          }
        } else if (Notification.permission === 'granted') {
          console.log('Notification permission already granted.');
          subscribeUser(currentUser._id);
        } else {
          console.warn('Notification permission is denied.');
        }
      } else {
        // When user logs out, attempt to unsubscribe from push notifications
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          navigator.serviceWorker.ready.then(registration => {
            registration.pushManager.getSubscription().then(subscription => {
              if (subscription) {
                unsubscribeUser(subscription.endpoint);
              }
            });
          });
        }
      }
    };

    setupPushNotifications();
  }, [isAuthenticated, currentUser, subscribeUser, unsubscribeUser]); // Dependencies: isAuthenticated, currentUser, subscribeUser, unsubscribeUser

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
