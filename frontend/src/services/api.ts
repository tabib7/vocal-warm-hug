
import { 
  demoUsers, 
  demoGoals, 
  demoTasks, 
  demoAttendance, 
  demoNotifications, 
  demoOccasions, 
  demoLeaveRequests,
  currentUser 
} from './demoData';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    await delay(500);
    // Simple demo login - accept any email/password combination
    const user = demoUsers.find(u => u.email === email) || currentUser;
    return {
      user,
      token: 'demo-jwt-token'
    };
  },
  
  getCurrentUser: async () => {
    await delay(200);
    return currentUser;
  },
  
  logout: async () => {
    await delay(200);
    return { success: true };
  }
};

// Goals API
export const goalsAPI = {
  getGoals: async (userId?: string) => {
    await delay(300);
    if (userId) {
      return demoGoals.filter(goal => goal.userId === userId);
    }
    return demoGoals;
  },
  
  createGoal: async (goalData: any) => {
    await delay(400);
    const newGoal = {
      _id: Date.now().toString(),
      ...goalData,
      createdAt: new Date().toISOString(),
      progress: 0,
      status: 'not-started'
    };
    demoGoals.push(newGoal);
    return newGoal;
  },
  
  updateGoal: async (id: string, updates: any) => {
    await delay(400);
    const goalIndex = demoGoals.findIndex(goal => goal._id === id);
    if (goalIndex !== -1) {
      demoGoals[goalIndex] = { ...demoGoals[goalIndex], ...updates };
      return demoGoals[goalIndex];
    }
    throw new Error('Goal not found');
  },
  
  deleteGoal: async (id: string) => {
    await delay(300);
    const goalIndex = demoGoals.findIndex(goal => goal._id === id);
    if (goalIndex !== -1) {
      demoGoals.splice(goalIndex, 1);
      return { success: true };
    }
    throw new Error('Goal not found');
  }
};

// Tasks API
export const tasksAPI = {
  getTasks: async (userId?: string) => {
    await delay(300);
    if (userId) {
      return demoTasks.filter(task => task.assignedTo === userId);
    }
    return demoTasks;
  },
  
  createTask: async (taskData: any) => {
    await delay(400);
    const newTask = {
      _id: Date.now().toString(),
      ...taskData,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    demoTasks.push(newTask);
    return newTask;
  },
  
  updateTask: async (id: string, updates: any) => {
    await delay(400);
    const taskIndex = demoTasks.findIndex(task => task._id === id);
    if (taskIndex !== -1) {
      demoTasks[taskIndex] = { ...demoTasks[taskIndex], ...updates };
      return demoTasks[taskIndex];
    }
    throw new Error('Task not found');
  },
  
  deleteTask: async (id: string) => {
    await delay(300);
    const taskIndex = demoTasks.findIndex(task => task._id === id);
    if (taskIndex !== -1) {
      demoTasks.splice(taskIndex, 1);
      return { success: true };
    }
    throw new Error('Task not found');
  }
};

// Attendance API
export const attendanceAPI = {
  getAttendance: async (userId?: string, startDate?: string, endDate?: string) => {
    await delay(300);
    let filteredAttendance = demoAttendance;
    
    if (userId) {
      filteredAttendance = filteredAttendance.filter(att => att.userId === userId);
    }
    
    if (startDate && endDate) {
      filteredAttendance = filteredAttendance.filter(att => 
        att.date >= startDate && att.date <= endDate
      );
    }
    
    return filteredAttendance;
  },
  
  clockIn: async (userId: string) => {
    await delay(400);
    const today = new Date().toISOString().split('T')[0];
    const clockInTime = new Date().toTimeString().slice(0, 5);
    
    const newAttendance = {
      _id: Date.now().toString(),
      userId,
      date: today,
      clockIn: clockInTime,
      status: 'present'
    };
    
    demoAttendance.push(newAttendance);
    return newAttendance;
  },
  
  clockOut: async (userId: string) => {
    await delay(400);
    const today = new Date().toISOString().split('T')[0];
    const clockOutTime = new Date().toTimeString().slice(0, 5);
    
    const attendanceRecord = demoAttendance.find(att => 
      att.userId === userId && att.date === today && !att.clockOut
    );
    
    if (attendanceRecord) {
      attendanceRecord.clockOut = clockOutTime;
      // Calculate working hours (simplified)
      const clockIn = new Date(`2000-01-01 ${attendanceRecord.clockIn}`);
      const clockOut = new Date(`2000-01-01 ${clockOutTime}`);
      attendanceRecord.workingHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
      
      return attendanceRecord;
    }
    
    throw new Error('No clock-in record found for today');
  }
};

// Employees API
export const employeesAPI = {
  getEmployees: async () => {
    await delay(300);
    return demoUsers;
  },
  
  getEmployee: async (id: string) => {
    await delay(200);
    const employee = demoUsers.find(user => user._id === id);
    if (!employee) {
      throw new Error('Employee not found');
    }
    return employee;
  },
  
  updateEmployee: async (id: string, updates: any) => {
    await delay(400);
    const employeeIndex = demoUsers.findIndex(user => user._id === id);
    if (employeeIndex !== -1) {
      demoUsers[employeeIndex] = { ...demoUsers[employeeIndex], ...updates };
      return demoUsers[employeeIndex];
    }
    throw new Error('Employee not found');
  }
};

// Notifications API
export const notificationsAPI = {
  getNotifications: async (userId: string) => {
    await delay(300);
    return demoNotifications.filter(notif => notif.userId === userId);
  },
  
  markAsRead: async (id: string) => {
    await delay(200);
    const notification = demoNotifications.find(notif => notif._id === id);
    if (notification) {
      notification.read = true;
      return notification;
    }
    throw new Error('Notification not found');
  },
  
  markAllAsRead: async (userId: string) => {
    await delay(300);
    demoNotifications
      .filter(notif => notif.userId === userId)
      .forEach(notif => notif.read = true);
    return { success: true };
  }
};

// Occasions API
export const occasionsAPI = {
  getOccasions: async () => {
    await delay(300);
    return demoOccasions;
  },
  
  createOccasion: async (occasionData: any) => {
    await delay(400);
    const newOccasion = {
      _id: Date.now().toString(),
      ...occasionData
    };
    demoOccasions.push(newOccasion);
    return newOccasion;
  }
};

// Leave API
export const leaveAPI = {
  getLeaveRequests: async (userId?: string) => {
    await delay(300);
    if (userId) {
      return demoLeaveRequests.filter(leave => leave.userId === userId);
    }
    return demoLeaveRequests;
  },
  
  createLeaveRequest: async (leaveData: any) => {
    await delay(400);
    const newLeaveRequest = {
      _id: Date.now().toString(),
      ...leaveData,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };
    demoLeaveRequests.push(newLeaveRequest);
    return newLeaveRequest;
  },
  
  updateLeaveRequest: async (id: string, updates: any) => {
    await delay(400);
    const leaveIndex = demoLeaveRequests.findIndex(leave => leave._id === id);
    if (leaveIndex !== -1) {
      demoLeaveRequests[leaveIndex] = { ...demoLeaveRequests[leaveIndex], ...updates };
      return demoLeaveRequests[leaveIndex];
    }
    throw new Error('Leave request not found');
  }
};

// Settings API
export const settingsAPI = {
  getSettings: async () => {
    await delay(200);
    return {
      companyName: 'Demo Company Inc.',
      workingHours: { start: '09:00', end: '17:00' },
      timezone: 'UTC',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      theme: 'light'
    };
  },
  
  updateSettings: async (settings: any) => {
    await delay(400);
    // In a real app, this would save to database
    return { ...settings, updated: true };
  }
};
