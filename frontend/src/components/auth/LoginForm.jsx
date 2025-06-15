
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [setupStatus, setSetupStatus] = useState('');
  const { login } = useAuth();

  // Check if demo accounts are set up on component mount
  useEffect(() => {
    const checkDemoAccounts = async () => {
      try {
        setSetupStatus('Checking demo accounts...');
        const response = await axios.get('/api/setup');
        setSetupStatus(response.data.message);
        console.log('Demo accounts check response:', response.data);
      } catch (error) {
        console.error('Error checking demo accounts:', error);
        setSetupStatus('Error checking demo accounts. Server might not be running.');
      }
    };
    
    checkDemoAccounts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      console.log('Attempting login with:', { email, password: '***' });
      const success = await login(email, password);
      if (!success) {
        console.log('Login failed in form component');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-ems-primary">Employee Management System</h2>
            <p className="text-gray-600 mt-2">Sign in to access your dashboard</p>
            {setupStatus && (
              <p className="text-xs mt-2 text-ems-accent">{setupStatus}</p>
            )}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-ems-accent focus:ring-ems-accent border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              
              <a href="#" className="text-sm text-ems-accent hover:underline">
                Forgot password?
              </a>
            </div>
            
            <button
              type="submit"
              className="w-full btn-primary flex justify-center items-center"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Demo Accounts: <br />
              admin@example.com / admin123 <br />
              manager@example.com / manager123 <br />
              employee@example.com / employee123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
