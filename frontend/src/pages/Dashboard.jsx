import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import { toast } from '../hooks/use-toast';
import axios from 'axios';
import { Skeleton } from '../components/ui/skeleton'; // Import Skeleton

// Use environment variable for API base URL with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ? 
  `${import.meta.env.VITE_API_BASE_URL}/api` : 
  'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]); // New state for tasks
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [monthlyAttendancePercentage, setMonthlyAttendancePercentage] = useState(0);
  const [weeklyAttendanceSummary, setWeeklyAttendanceSummary] = useState([]);
  const [settings, setSettings] = useState(null); // New state for settings
  const [currentAttendanceStatus, setCurrentAttendanceStatus] = useState('Unknown'); // e.g., 'Clocked In', 'Clocked Out', 'On Break'
  const [currentTime, setCurrentTime] = useState(new Date()); // New state for real-time clock
  const [currentClockInTime, setCurrentClockInTime] = useState(null);
  const [currentClockOutTime, setCurrentClockOutTime] = useState(null);

  // Format time for display
  const formatTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  // Timer for current time display
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !currentUser._id) {
        // If currentUser is not available, keep loading true and return
        // The useEffect will re-run when currentUser changes
        return;
      }

      try {
        setLoading(true); // Ensure loading is true when starting fetch
        // Fetch Goals
        const goalsResponse = await axios.get(`${API_BASE_URL}/goals/employee/${currentUser._id}`);
        setGoals(goalsResponse.data);

        // Fetch Tasks
        const tasksResponse = await axios.get(`${API_BASE_URL}/tasks/employee/${currentUser._id}`);
        setTasks(tasksResponse.data);

        // Fetch Attendance Data
        const attendanceResponse = await axios.get(`${API_BASE_URL}/attendance/employee/${currentUser._id}`);
        setAttendanceHistory(attendanceResponse.data);

        // Fetch Settings
        const settingsResponse = await axios.get(`${API_BASE_URL}/settings`);
        setSettings(settingsResponse.data);

      } catch (err) {
        console.error("Error fetching dashboard data:", err.message);
        setError("Failed to load dashboard data.");
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Helper to check if a day is a working day based on settings
  const isWorkingDay = (dayIndex) => {
    if (!settings || !settings.workingDays) return true; // Default to all weekdays if settings not loaded

    const dayMap = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };
    return settings.workingDays[dayMap[dayIndex]];
  };

  // Helper to format working days for display
  const formatWorkingDays = (workingDays) => {
    if (!workingDays) return 'Loading...';
    // New order: Saturday, Sunday, Monday, Tuesday, Wednesday, Thursday, Friday
    const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const activeDays = days.filter(day => workingDays[day]);

    if (activeDays.length === 0) return 'No working days set';
    if (activeDays.length === 7) return 'Everyday';

    // Group consecutive days
    const groupedDays = [];
    let currentGroup = [];

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      if (workingDays[day]) {
        currentGroup.push(day.substring(0, 3)); // e.g., 'sat'
      } else {
        if (currentGroup.length > 0) {
          groupedDays.push(currentGroup);
          currentGroup = [];
        }
      }
    }
    if (currentGroup.length > 0) {
      groupedDays.push(currentGroup);
    }

    return groupedDays.map(group => {
      if (group.length === 1) {
        return group[0];
      } else {
        return `${group[0]} - ${group[group.length - 1]}`;
      }
    }).join(', ');
  };

  // Calculate attendance summary and weekly attendance
  useEffect(() => {
    if (!settings) return; // Wait for settings to load

    const calculateSummary = () => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      let presentCount = 0;
      const attendedDates = new Set();

      attendanceHistory.forEach(record => {
        const recordDate = new Date(record.date);
        if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
          attendedDates.add(recordDate.toDateString());
          if (record.clockInTime && record.clockOutTime && record.status === 'present') {
            presentCount++;
          }
        }
      });

      const totalWorkDaysPassed = Array.from({ length: today.getDate() }, (_, i) => {
        const d = new Date(currentYear, currentMonth, i + 1);
        return isWorkingDay(d.getDay()) ? 1 : 0; // Use isWorkingDay helper
      }).reduce((sum, val) => sum + val, 0);

      const percentage = totalWorkDaysPassed > 0 ? (presentCount / totalWorkDaysPassed) * 100 : 0;
        setMonthlyAttendancePercentage(percentage.toFixed(0));

        // Determine current attendance status for the Clock In Status card
        const todayRecord = attendanceHistory.find(record => {
          const recordDate = new Date(record.date);
          return recordDate.toDateString() === today.toDateString();
        });

        if (todayRecord) {
          setCurrentClockInTime(todayRecord.clockInTime);
          setCurrentClockOutTime(todayRecord.clockOutTime);
          if (todayRecord.status === 'clocked_out') {
            setCurrentAttendanceStatus('Clocked Out');
          } else if (todayRecord.status === 'on_break') {
            setCurrentAttendanceStatus('On Break');
          } else if (todayRecord.status === 'on_lunch') {
            setCurrentAttendanceStatus('On Lunch');
          } else if (todayRecord.status === 'on_breakfast') {
            setCurrentAttendanceStatus('On Breakfast');
          } else if (todayRecord.clockInTime && !todayRecord.clockOutTime) {
            setCurrentAttendanceStatus('Clocked In');
          } else {
            setCurrentAttendanceStatus('Unknown');
          }
        } else {
          setCurrentAttendanceStatus('Not Clocked In');
          setCurrentClockInTime(null);
          setCurrentClockOutTime(null);
        }

        // Calculate weekly attendance summary
        const startOfWeek = new Date();
        startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday of current week
        startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const weeklyData = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        
        const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
        let status = 'pending';
        let time = '—';

        const recordForDay = attendanceHistory.find(record => {
          const recordDate = new Date(record.date);
          return recordDate.toDateString() === day.toDateString();
        });

        if (recordForDay) {
          if (recordForDay.clockInTime && recordForDay.clockOutTime) {
            status = 'present';
            time = new Date(recordForDay.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
          } else if (recordForDay.lateReason || recordForDay.status === 'late') {
            status = 'late';
            time = recordForDay.clockInTime ? new Date(recordForDay.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
          } else if (recordForDay.status === 'absent') {
            status = 'absent';
          }
        } else if (day < today && isWorkingDay(day.getDay())) { // If past working day with no record
          status = 'absent';
        }

        weeklyData.push({ day: dayName, status, time });
      }
      setWeeklyAttendanceSummary(weeklyData);
    };

    calculateSummary();
  }, [attendanceHistory, settings]); // Add settings to dependency array

  // Derived state from goals
  const totalGoals = goals.length;
  const completedGoals = goals.filter(goal => goal.status === 'completed').length;
  const inProgressGoals = goals.filter(goal => goal.status === 'in-progress').length;
  const upcomingDeadlines = goals.filter(goal => 
    new Date(goal.deadline) > new Date() && goal.status !== 'completed'
  ).length;

  // Derived state from tasks
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;

  const upcomingGoals = goals
    .filter(goal => {
      const deadlineDate = new Date(goal.deadline);
      const now = new Date();
      const isUpcoming = deadlineDate > now && goal.status !== 'completed';
      return isUpcoming;
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3); // Show top 3 upcoming goals

  // If loading or no current user, show loading state with Skeleton
  if (loading || !currentUser) {
    return (
      <MainLayout>
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-6 w-64" />
        </div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100 col-span-full">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-16 rounded" />
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between text-center md:text-left">
              <div className="mb-4 md:mb-0">
                <Skeleton className="h-10 w-40 mb-2" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="flex-1 mx-4 text-center">
                <Skeleton className="h-6 w-48 mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto mt-1" />
                <Skeleton className="h-4 w-32 mx-auto mt-1" />
              </div>
              <Skeleton className="h-10 w-40 rounded-md" />
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-600 flex justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>

          {[...Array(4)].map((_, i) => (
            <div key={i} className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16 rounded" />
              </div>
              <div className="flex items-baseline">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-32 ml-2" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <Skeleton className="h-2 w-32 rounded-full" />
                  <Skeleton className="h-3 w-24 mt-1" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Goals Section Skeleton */}
          <div className="lg:col-span-2">
            <div className="card mb-6">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="overflow-hidden">
                <Skeleton className="h-10 w-full mb-2" />
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full mb-2" />
                ))}
              </div>
            </div>
          </div>
          
          {/* Weekly Attendance Skeleton */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="space-y-3">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
            <div className="mt-4">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // If there's an error, display it
  if (error) {
    return (
      <MainLayout>
        <div className="text-center text-red-500 mt-8">
          <p>{error}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {currentUser.name}!</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100 col-span-full"> {/* Made full width */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Your Current Status</h3>
            <span className="bg-blue-100 text-blue-800 p-1.5 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between text-center md:text-left">
            <div className="mb-4 md:mb-0">
              <p className="text-4xl font-bold text-gray-900">{formatTime(currentTime)}</p>
              <p className="text-gray-600">{formatDate(currentTime)}</p>
            </div>
            <div className="flex-1 mx-4 text-center">
              <p className="text-lg font-semibold text-gray-800">Status: <span className="text-ems-primary">{currentAttendanceStatus}</span></p>
              {currentClockInTime && <p className="text-sm text-gray-600">Clock In: {formatTime(currentClockInTime)}</p>}
              {currentClockOutTime && <p className="text-sm text-gray-600">Clock Out: {formatTime(currentClockOutTime)}</p>}
            </div>
            <button 
              onClick={() => navigate('/attendance')}
              className="btn-primary px-8 py-3 rounded-md font-medium transition-colors"
            >
              Manage Attendance
            </button>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-600 flex justify-between">
            <div>Office Hours: <span className="font-medium">{settings?.workHours?.start || 'Loading...'} - {settings?.workHours?.end || 'Loading...'}</span></div>
            <div>Working Days: <span className="font-medium capitalize">{settings ? formatWorkingDays(settings.workingDays) : 'Loading...'}</span></div>
          </div>
        </div>

        <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Goals</h3>
            <span className="bg-blue-100 text-blue-800 p-1.5 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold">{totalGoals}</p>
            <p className="ml-2 text-xs text-green-500 font-medium">
              {totalGoals > 0 ? `+${inProgressGoals} in progress` : 'No goals yet'}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-green-500 rounded-full" 
                  style={{ width: `${totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {completedGoals} completed ({totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}%)
              </p>
            </div>
            <button 
              onClick={() => navigate('/goals')}
              className="text-sm text-ems-accent hover:underline"
            >
              View All
            </button>
          </div>
        </div>
        
        <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Attendance Rate</h3>
            <span className="bg-green-100 text-green-800 p-1.5 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold">{monthlyAttendancePercentage}%</p>
            <p className="ml-2 text-xs text-green-500 font-medium">Based on current month</p>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-green-500 rounded-full" 
                  style={{ width: `${monthlyAttendancePercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Current Month</p>
            </div>
            <button 
              onClick={() => navigate('/attendance')}
              className="text-sm text-ems-accent hover:underline"
            >
              Details
            </button>
          </div>
        </div>
        
        <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Upcoming Deadlines</h3>
            <span className="bg-yellow-100 text-yellow-800 p-1.5 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold">{upcomingDeadlines}</p>
            <p className="ml-2 text-xs text-yellow-500 font-medium">Goals with upcoming deadlines</p>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              {/* Priority breakdown can be added here if needed */}
              <p className="text-xs text-gray-500 mt-1">View all upcoming goals for details.</p>
            </div>
            <button 
              onClick={() => navigate('/goals')}
              className="text-sm text-ems-accent hover:underline"
            >
              View All
            </button>
          </div>
        </div>
        
        {/* Tasks Summary Card */}
        <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">My Tasks</h3>
            <span className="bg-purple-100 text-purple-800 p-1.5 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v2h8V6zm-2 4H6v2h6v-2z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold">{totalTasks}</p>
            <p className="ml-2 text-xs text-blue-500 font-medium">
              {inProgressTasks} in progress, {pendingTasks} pending
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-purple-500 rounded-full" 
                  style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {completedTasks} completed ({totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%)
              </p>
            </div>
            <button 
              onClick={() => navigate('/tasks')}
              className="text-sm text-ems-accent hover:underline"
            >
              View All
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Goals Section */}
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Upcoming Goals</h2>
              <button 
                onClick={() => navigate('/goals')}
                className="text-sm text-ems-accent hover:underline flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Goal
              </button>
            </div>
            
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {upcomingGoals.length > 0 ? (
                    upcomingGoals.map((goal) => (
                      <tr key={goal._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{goal.title}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{new Date(goal.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full 
                          ${goal.priority === 'high' 
                            ? 'bg-red-100 text-red-800' 
                            : goal.priority === 'medium' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'}`}>
                            {goal.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                goal.progress < 25 
                                  ? 'bg-red-500' 
                                  : goal.progress < 75 
                                    ? 'bg-yellow-500' 
                                    : 'bg-green-500'
                              }`}
                              style={{ width: `${goal.progress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{goal.progress}% complete</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-center text-sm text-gray-500">
                        No upcoming goals found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Weekly Attendance */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Weekly Attendance</h2>
            <button 
              onClick={() => navigate('/attendance')}
              className="text-sm text-ems-accent hover:underline"
            >
              View Full History
            </button>
          </div>
          
          <div className="space-y-3">
            {weeklyAttendanceSummary.map((day) => (
              <div key={day.day} className="flex items-center justify-between p-3 border border-gray-100 rounded-md">
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-3 ${
                    day.status === 'present' ? 'bg-green-500' : 
                    day.status === 'late' ? 'bg-yellow-500' : 
                    day.status === 'absent' ? 'bg-red-500' : 'bg-gray-300'
                  }`}></div>
                  <p className="font-medium">{day.day}</p>
                </div>
                <div>
                  {day.status === 'present' && 
                    <span className="text-sm text-green-600">
                      Clocked in {day.time}
                    </span>
                  }
                  {day.status === 'late' && 
                    <span className="text-sm text-yellow-600">
                      Late {day.time}
                    </span>
                  }
                  {day.status === 'absent' && 
                    <span className="text-sm text-red-600">
                      Absent
                    </span>
                  }
                  {day.status === 'pending' && 
                    <span className="text-sm text-gray-600">
                      Pending
                    </span>
                  }
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-200 pt-3">
              <div>Office Hours</div>
              <div className="font-medium">
                {settings ? `${settings.workHours.start} - ${settings.workHours.end}` : 'Loading...'}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
              <div>Working Days</div>
              <div className="font-medium capitalize">{settings ? formatWorkingDays(settings.workingDays) : 'Loading...'}</div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
