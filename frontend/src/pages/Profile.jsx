import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/AuthContext';
import { Skeleton } from '../components/ui/skeleton';

const Profile = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  
  // In a real app, this would come from an API
  const userDetails = {
    id: currentUser?.id,
    name: currentUser?.name,
    email: currentUser?.email,
    role: currentUser?.role,
    department: currentUser?.department,
    position: currentUser?.position,
    joinDate: currentUser?.joinDate,
    profileImage: currentUser?.profileImage,
    phone: '+1 (555) 123-4567',
    address: '123 Office Street, Corporate City, 12345',
    emergencyContact: 'Jane Doe (+1-555-987-6543)',
    skills: ['Management', 'Communication', 'Problem Solving', 'Team Leadership', 'Strategic Planning'],
  };

  useEffect(() => {
    if (currentUser) {
      setLoading(false);
    }
  }, [currentUser]);

  if (loading) {
    return (
      <MainLayout>
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-6 w-64" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar Skeleton */}
          <div>
            <div className="card text-center">
              <Skeleton className="h-32 w-32 mx-auto rounded-full mb-4" />
              <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
              <Skeleton className="h-5 w-24 mx-auto mt-1 rounded-full" />
              
              <div className="border-t border-gray-200 pt-4 mt-4 text-left space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="h-5 w-5 mr-2 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-full mt-6" />
            </div>
            
            <div className="card mt-6">
              <h3 className="text-lg font-semibold mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-24 rounded-full" />
                ))}
              </div>
              <Skeleton className="h-5 w-40 mt-4" />
            </div>
          </div>
          
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-28" />
                </nav>
              </div>
              
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-10 w-full" />
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-600">View and manage your personal information</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div>
          <div className="card text-center">
            <div className="mb-4">
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-md">
                <img 
                  src={userDetails.profileImage} 
                  alt={userDetails.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <h2 className="text-xl font-bold mt-4">{userDetails.name}</h2>
              <p className="text-gray-600">{userDetails.position}</p>
              <div className="mt-1">
                <span className="px-2 py-1 text-xs font-medium bg-ems-accent/20 text-ems-accent rounded-full">
                  {userDetails.department}
                </span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mt-4 text-left">
              <div className="space-y-3">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span className="text-gray-600 text-sm">{userDetails.email}</span>
                </div>
                
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span className="text-gray-600 text-sm">{userDetails.phone}</span>
                </div>
                
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600 text-sm">{userDetails.address}</span>
                </div>
                
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600 text-sm">Joined on {userDetails.joinDate}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button className="btn-primary w-full">Edit Profile</button>
            </div>
          </div>
          
          <div className="card mt-6">
            <h3 className="text-lg font-semibold mb-4">Skills</h3>
            
            <div className="flex flex-wrap gap-2">
              {userDetails.skills.map((skill, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
            
            <button className="text-sm text-ems-accent hover:underline mt-4 inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add More Skills
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'profile' 
                      ? 'border-ems-primary text-ems-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'security' 
                      ? 'border-ems-primary text-ems-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'notifications' 
                      ? 'border-ems-primary text-ems-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Notifications
                </button>
              </nav>
            </div>
            
            <div className="mt-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        className="form-input"
                        defaultValue={userDetails.name}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input 
                        type="email" 
                        className="form-input"
                        defaultValue={userDetails.email}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input 
                        type="tel" 
                        className="form-input"
                        defaultValue={userDetails.phone}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <input 
                        type="text" 
                        className="form-input"
                        defaultValue={userDetails.department}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <input 
                        type="text" 
                        className="form-input"
                        defaultValue={userDetails.position}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                      <input 
                        type="text" 
                        className="form-input"
                        defaultValue={userDetails.joinDate}
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input 
                      type="text" 
                      className="form-input"
                      defaultValue={userDetails.address}
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                    <input 
                      type="text" 
                      className="form-input"
                      defaultValue={userDetails.emergencyContact}
                      readOnly
                    />
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-500">
                        Contact HR to update your personal information
                      </p>
                      <button className="btn-secondary">Contact HR</button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Change Password</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input type="password" className="form-input" placeholder="Enter current password" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input type="password" className="form-input" placeholder="Enter new password" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input type="password" className="form-input" placeholder="Confirm new password" />
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <button className="btn-primary">Update Password</button>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Enhance your account security with two-factor authentication.</p>
                        <p className="text-sm text-red-600 mt-1">Not configured</p>
                      </div>
                      <button className="btn-secondary">Configure</button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">Goal Reminders</p>
                        <p className="text-sm text-gray-500">Receive reminders for upcoming goal deadlines</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ems-primary"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">Attendance Alerts</p>
                        <p className="text-sm text-gray-500">Receive alerts when you forget to clock in/out</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ems-primary"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">Leave Requests</p>
                        <p className="text-sm text-gray-500">Receive notifications about your leave requests</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ems-primary"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">System Announcements</p>
                        <p className="text-sm text-gray-500">Receive important system-wide announcements</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ems-primary"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <button className="btn-primary">Save Preferences</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
