
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import LoginForm from '../components/auth/LoginForm';

const Index = () => {
  const { isAuthenticated } = useAuth();
  
  // If already logged in, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ems-primary to-ems-secondary flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
          {/* Hero section */}
          <div className="text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Employee Management System</h1>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              A comprehensive solution for goal tracking and attendance management.
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Goal Management</h3>
                  <p className="text-sm text-white/80">Track daily, weekly and monthly goals</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Attendance Tracking</h3>
                  <p className="text-sm text-white/80">Clock-in and manage leave requests</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Analytics & Reports</h3>
                  <p className="text-sm text-white/80">Visualize performance data</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Login section */}
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <LoginForm />
          </div>
        </div>
      </div>
      
      <footer className="py-4 text-center text-white/70 text-sm">
        &copy; {new Date().getFullYear()} Employee Management System. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
