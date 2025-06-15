import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import axios from 'axios';
import { useAuth } from '../components/auth/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from '../components/ui/skeleton'; // Import Skeleton

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Attendance = () => {
  const { currentUser, isAuthenticated, hasRole } = useAuth();
  const effectiveUserId = currentUser?._id;

  const [loading, setLoading] = useState(true); // Add loading state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentAttendanceRecord, setCurrentAttendanceRecord] = useState(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [onLunch, setOnLunch] = useState(false);
  const [onBreakfast, setOnBreakfast] = useState(false); // New state for breakfast
  const [clockedOutHalfTime, setClockedOutHalfTime] = useState(false);
  const [finalClockedOut, setFinalClockedOut] = useState(false);

  const [viewMode, setViewMode] = useState('daily');
  const [leaveRequestOpen, setLeaveRequestOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('other'); // Set default to 'other'
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [lateReasonDialogOpen, setLateReasonDialogOpen] = useState(false);
  const [lateReason, setLateReason] = useState('I forgot to clock in');
  const [otherLateReason, setOtherLateReason] = useState('');
  const [breakfastLateReasonDialogOpen, setBreakfastLateReasonDialogOpen] = useState(false); // New state
  const [breakfastLateReason, setBreakfastLateReason] = useState('Overslept'); // New state
  const [otherBreakfastLateReason, setOtherBreakfastLateReason] = useState(''); // New state
  const [returningLateAfterBreakDialogOpen, setReturningLateAfterBreakDialogOpen] = useState(false);
  const [returningLateAfterBreakReason, setReturningLateAfterBreakReason] = useState('Meeting ran over');
  const [otherReturningLateAfterBreakReason, setOtherReturningLateAfterBreakReason] = useState('');
  const [halfTimeClockOutDialogOpen, setHalfTimeClockOutDialogOpen] = useState(false);
  const [halfTimeClockOutReason, setHalfTimeClockOutReason] = useState('Lunch');
  const [otherHalfTimeClockOutReason, setOtherHalfTimeClockOutReason] = useState('');
  const [lateAfterHalfTimeDialogOpen, setLateAfterHalfTimeDialogOpen] = useState(false);
  const [lateAfterHalfTimeReason, setLateAfterHalfTimeReason] = useState('Forgot to clock in');
  const [otherLateAfterHalfTimeReason, setOtherLateAfterHalfTimeReason] = useState('');
  const [finalClockOutDialogOpen, setFinalClockOutDialogOpen] = useState(false);
  const [finalClockOutReason, setFinalClockOutReason] = useState('End of day');
  const [otherFinalClockOutReason, setOtherFinalClockOutReason] = useState('');

  const [officeStartTime, setOfficeStartTime] = useState(new Date());
  const [breakfastStartTime, setBreakfastStartTime] = useState(new Date()); // New state for breakfast start time
  const [breakfastEndTime, setBreakfastEndTime] = useState(new Date());     // New state for breakfast end time
  const [officeHalfTimeStart, setOfficeHalfTimeStart] = useState(new Date());
  const [officeHalfTimeEnd, setOfficeHalfTimeEnd] = useState(new Date());
  const [lunchTimeAfterHalfTime, setLunchTimeAfterHalfTime] = useState(30);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [presentDays, setPresentDays] = useState(0);
  const [lateArrivals, setLateArrivals] = useState(0);
  const [absentDays, setAbsentDays] = useState(0);
  const [monthlyAttendancePercentage, setMonthlyAttendancePercentage] = useState(0);
  const [settings, setSettings] = useState(null);

  // Timer for current time display
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // Helper to check if a day is a working day based on settings
  const isWorkingDay = (dayIndex) => {
    if (!settings || !settings.workingDays) return true;

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
    const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const activeDays = days.filter(day => workingDays[day]);

    if (activeDays.length === 0) return 'No working days set';
    if (activeDays.length === 7) return 'Everyday';

    const groupedDays = [];
    let currentGroup = [];

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      if (workingDays[day]) {
        currentGroup.push(day.substring(0, 3));
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

  // Calculate attendance summary
  const calculateAttendanceSummary = useCallback(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let presentCount = 0;
    let lateCount = 0;
    const attendedDates = new Set();

    attendanceHistory.forEach(record => {
      const recordDate = new Date(record.date);
      if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
        attendedDates.add(recordDate.toDateString());

        if (record.clockInTime && record.clockOutTime && record.status === 'present') {
          presentCount++;
        }
        if (record.lateReason || record.status === 'late') {
          lateCount++;
        }
      }
    });

    let absentCount = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dateToCheck = new Date(currentYear, currentMonth, day);
      if (isWorkingDay(dateToCheck.getDay()) && dateToCheck <= today) {
        if (!attendedDates.has(dateToCheck.toDateString())) {
          absentCount++;
        }
      }
    }

    setPresentDays(presentCount);
    setLateArrivals(lateCount);
    setAbsentDays(absentCount);

    const totalWorkDaysPassed = Array.from({ length: today.getDate() }, (_, i) => {
      const d = new Date(currentYear, currentMonth, i + 1);
      return isWorkingDay(d.getDay()) ? 1 : 0;
    }).reduce((sum, val) => sum + val, 0);

    const percentage = totalWorkDaysPassed > 0 ? (presentCount / totalWorkDaysPassed) * 100 : 0;
    setMonthlyAttendancePercentage(percentage.toFixed(0));

  }, [attendanceHistory, settings]);

  useEffect(() => {
    calculateAttendanceSummary();
  }, [calculateAttendanceSummary]);

  // Fetch office settings, user's attendance, and leave requests
  const fetchSettingsAttendanceAndLeaves = useCallback(async () => {
    if (!effectiveUserId) return;

    try {
      const settingsResponse = await axios.get(`${API_BASE_URL}/api/settings`);
      const fetchedSettings = settingsResponse.data;
      setSettings(fetchedSettings);

      const [startHour, startMinute] = (fetchedSettings.workHours?.start || '07:00').split(':').map(Number);
      const [halfStartHour, halfStartMinute] = (fetchedSettings.officeHalfTimeStart || '13:00').split(':').map(Number);
      const [halfEndHour, halfEndMinute] = (fetchedSettings.officeHalfTimeEnd || '14:15').split(':').map(Number);
      const [breakfastStartHour, breakfastStartMinute] = (fetchedSettings.breakTime?.start || '08:00').split(':').map(Number); // Fetch breakfast start
      const [breakfastEndHour, breakfastEndMinute] = (fetchedSettings.breakTime?.end || '08:30').split(':').map(Number);     // Fetch breakfast end

      const newOfficeStartTime = new Date();
      newOfficeStartTime.setHours(startHour, startMinute, 0, 0);
      setOfficeStartTime(newOfficeStartTime);

      const newBreakfastStartTime = new Date();
      newBreakfastStartTime.setHours(breakfastStartHour, breakfastStartMinute, 0, 0);
      setBreakfastStartTime(newBreakfastStartTime);

      const newBreakfastEndTime = new Date();
      newBreakfastEndTime.setHours(breakfastEndHour, breakfastEndMinute, 0, 0);
      setBreakfastEndTime(newBreakfastEndTime);

      const newOfficeHalfTimeStart = new Date();
      newOfficeHalfTimeStart.setHours(halfStartHour, halfStartMinute, 0, 0);
      setOfficeHalfTimeStart(newOfficeHalfTimeStart);

      const newOfficeHalfTimeEnd = new Date();
      newOfficeHalfTimeEnd.setHours(halfEndHour, halfEndMinute, 0, 0);
      setOfficeHalfTimeEnd(newOfficeHalfTimeEnd);

      setLunchTimeAfterHalfTime(fetchedSettings.lunchTimeAfterHalfTime || 30);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendanceResponse = await axios.get(`${API_BASE_URL}/api/attendance/employee/${effectiveUserId}`);
      const userAttendanceRecords = attendanceResponse.data;
      console.log('Attendance History:', userAttendanceRecords);

      const todayRecord = userAttendanceRecords.find(record => {
        const recordDate = new Date(record.date);
        return recordDate.toDateString() === today.toDateString();
      });

      setCurrentAttendanceRecord(todayRecord);
      setAttendanceHistory(userAttendanceRecords);

      // Fetch leave requests for the current employee
      const leaveResponse = await axios.get(`${API_BASE_URL}/api/leave/employee/${effectiveUserId}`);
      setLeaveRequests(leaveResponse.data);
      console.log('Leave Requests:', leaveResponse.data);

      if (todayRecord) {
        setClockedIn(!!todayRecord.clockInTime && !todayRecord.clockOutTime);
        setOnBreak(todayRecord.status === 'on_break');
        setOnLunch(todayRecord.status === 'on_lunch');
        setOnBreakfast(todayRecord.status === 'on_breakfast'); // Set onBreakfast state
        setFinalClockedOut(!!todayRecord.clockOutTime);

        const lastPunch = todayRecord.additionalPunches?.[todayRecord.additionalPunches.length - 1];
        setClockedOutHalfTime(lastPunch?.type === 'half_time_out');

      } else {
        setClockedIn(false);
        setOnBreak(false);
        setOnLunch(false);
        setOnBreakfast(false); // Reset onBreakfast
        setClockedOutHalfTime(false);
        setFinalClockedOut(false);
      }

    } catch (error) {
      console.error("Error fetching settings or attendance:", error);
      toast({
        title: "Error",
        description: "Failed to fetch attendance data or settings.",
        variant: "destructive",
      });
      const defaultOfficeStartTime = new Date();
      defaultOfficeStartTime.setHours(7, 0, 0, 0);
      setOfficeStartTime(defaultOfficeStartTime);

      const defaultBreakfastStartTime = new Date(); // Default breakfast start
      defaultBreakfastStartTime.setHours(8, 0, 0, 0);
      setBreakfastStartTime(defaultBreakfastStartTime);

      const defaultBreakfastEndTime = new Date(); // Default breakfast end
      defaultBreakfastEndTime.setHours(8, 30, 0, 0);
      setBreakfastEndTime(defaultBreakfastEndTime);

      const defaultOfficeHalfTimeStart = new Date();
      defaultOfficeHalfTimeStart.setHours(13, 0, 0, 0);
      setOfficeHalfTimeStart(defaultOfficeHalfTimeStart);

      const defaultOfficeHalfTimeEnd = new Date();
      defaultOfficeHalfTimeEnd.setHours(14, 15, 0, 0);
      setOfficeHalfTimeEnd(defaultOfficeHalfTimeEnd);

      setLunchTimeAfterHalfTime(30);
    } finally {
      setLoading(false); // Set loading to false after fetch
    }
  }, [isAuthenticated, effectiveUserId]);

  useEffect(() => {
    fetchSettingsAttendanceAndLeaves();
  }, [fetchSettingsAttendanceAndLeaves]);

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Time comparison logic
  const isLateForOfficeStart = currentTime > officeStartTime && !clockedIn;
  const isDuringBreakfastTime = currentTime >= breakfastStartTime && currentTime <= breakfastEndTime;
  const isAfterBreakfastEndTime = currentTime > breakfastEndTime;
  const isDuringHalfTime = currentTime >= officeHalfTimeStart && currentTime <= officeHalfTimeEnd;
  const isAfterHalfTimeEnd = currentTime > officeHalfTimeEnd;

  // Handlers for various attendance actions
  const handleClockIn = async () => {
    if (!effectiveUserId) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/api/attendance/clockin`, {
        employeeId: effectiveUserId,
        lateReason: isLateForOfficeStart ? (lateReason === 'Other' ? otherLateReason : lateReason) : undefined,
      });
      setCurrentAttendanceRecord(response.data);
      setClockedIn(true);
      showAttendanceToast(true, new Date());
      setLateReasonDialogOpen(false);
      toast({ title: "Clocked In", description: "You have successfully clocked in." });
      fetchSettingsAttendanceAndLeaves();
    } catch (error) {
      console.error("Error clocking in:", error);
      toast({ title: "Error", description: error.response?.data?.msg || "Failed to clock in.", variant: "destructive" });
    }
  };

  const handlePunch = async (type, reason = '') => {
    if (!currentAttendanceRecord || !currentAttendanceRecord._id) {
      toast({ title: "Error", description: "No active attendance record found. Please clock in first.", variant: "destructive" });
      return;
    }
    try {
      const response = await axios.put(`${API_BASE_URL}/api/attendance/punch/${currentAttendanceRecord._id}`, {
        type,
        time: new Date(),
        reason,
      });
      setCurrentAttendanceRecord(response.data);
      showAttendanceToast(type.includes('in'), new Date());
      toast({ title: "Punch Recorded", description: `Your ${type.replace(/_/g, ' ')} has been recorded.` });
      fetchSettingsAttendanceAndLeaves();
    } catch (error) {
      console.error("Error punching:", error);
      toast({ title: "Error", description: error.response?.data?.msg || "Failed to record punch.", variant: "destructive" });
    }
  };

  const handleFinalClockOut = async () => {
    if (!currentAttendanceRecord || !currentAttendanceRecord._id) {
      toast({ title: "Error", description: "No active attendance record found. Please clock in first.", variant: "destructive" });
      return;
    }
    try {
      const response = await axios.put(`${API_BASE_URL}/attendance/clockout/${currentAttendanceRecord._id}`, {
        clockOutTime: new Date(),
        earlyLeaveReason: finalClockOutReason === 'Other' ? otherFinalClockOutReason : finalClockOutReason,
      });
      setCurrentAttendanceRecord(response.data);
      setFinalClockedOut(true);
      setClockedIn(false);
      showAttendanceToast(false, new Date());
      setFinalClockOutDialogOpen(false);
      toast({ title: "Clocked Out", description: "You have successfully clocked out for the day." });
      fetchSettingsAttendanceAndLeaves();
    } catch (error) {
      console.error("Error final clocking out:", error);
      toast({ title: "Error", description: error.response?.data?.msg || "Failed to clock out.", variant: "destructive" });
    }
  };

  // Dialog submission handlers
  const handleLateReasonSubmit = async () => {
    await handleClockIn();
    setLateReasonDialogOpen(false);
  };

  const handleReturningLateAfterBreakSubmit = async () => {
    const reasonText = returningLateAfterBreakReason === 'Other' ? otherReturningLateAfterBreakReason : returningLateAfterBreakReason;
    await handlePunch('break_end', reasonText);
    setReturningLateAfterBreakDialogOpen(false);
  };

  const handleHalfTimeClockOutSubmit = async () => {
    const reasonText = halfTimeClockOutReason === 'Other' ? otherHalfTimeClockOutReason : halfTimeClockOutReason;
    await handlePunch('half_time_out', reasonText);
    setHalfTimeClockOutDialogOpen(false);
  };

  const handleLateAfterHalfTimeSubmit = async () => {
    const reasonText = lateAfterHalfTimeReason === 'Other' ? otherLateAfterHalfTimeReason : lateAfterHalfTimeReason;
    await handlePunch('half_time_in', reasonText);
    setLateAfterHalfTimeDialogOpen(false);
  };

  // Show toast notification for clock in/out
  const showAttendanceToast = (isClockIn, time) => {
    toast({
      title: isClockIn ? "Clocked In" : "Clocked Out",
      description: `You have ${isClockIn ? 'clocked in' : 'clocked out'} at ${formatTime(time)}.`,
    });
  };


  const handleLeaveRequest = async (e) => {
    e.preventDefault();
    if (!effectiveUserId) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/leave`, {
        employeeId: effectiveUserId,
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason,
        type: leaveType,
      });
      toast({ title: "Leave Request Submitted", description: "Your leave request has been submitted for approval." });
      setLeaveRequestOpen(false);
      setLeaveType('');
      setLeaveStartDate('');
      setLeaveEndDate('');
      setLeaveReason('');
      fetchSettingsAttendanceAndLeaves();
    } catch (error) {
      console.error("Error submitting leave request:", error);
      toast({ title: "Error", description: error.response?.data?.msg || "Failed to submit leave request.", variant: "destructive" });
    }
  };

  const handleLeaveAction = async (leaveId, status, adminNotes = '') => {
    if (!effectiveUserId || !hasRole(['admin', 'manager'])) {
      toast({ title: "Error", description: "Not authorized to perform this action.", variant: "destructive" });
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/api/leave/${leaveId}`, {
        status,
        adminId: effectiveUserId,
        adminNotes,
      });
      toast({ title: "Leave Status Updated", description: `Leave request ${status}.` });
      fetchSettingsAttendanceAndLeaves();
    } catch (error) {
      console.error("Error updating leave status:", error);
      toast({ title: "Error", description: error.response?.data?.msg || "Failed to update leave status.", variant: "destructive" });
    }
  };

  // Get the appropriate attendance data based on view mode
  const getAttendanceData = () => {
    if (viewMode === 'daily') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return attendanceHistory.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.toDateString() === today.toDateString();
      });
    }
    return attendanceHistory;
  };

  // Render table headers based on view mode
  const renderTableHeaders = () => {
    if (viewMode === 'weekly') {
      return (
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Present</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Late</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Clock In</th>
        </tr>
      );
    } else if (viewMode === 'monthly') {
      return (
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Present</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Late</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leaves Taken</th>
        </tr>
      );
    } else { // Daily view
      return (
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Status</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Additional Punches</th>
        </tr>
      );
    }
  };

  // Render table rows based on view mode
  const renderTableRows = () => {
    const data = getAttendanceData();

    if (viewMode === 'weekly' || viewMode === 'monthly') {
      return (
        <tr>
          <td colSpan="6" className="px-4 py-3 text-center text-sm text-gray-500">
            {viewMode === 'weekly' ? 'Weekly' : 'Monthly'} aggregation not yet implemented.
          </td>
        </tr>
      );
    } else { // Daily view
      return data.map((record) => {
        const primaryNote = record.lateReason || record.earlyLeaveReason || record.notes || '-';
        return (
          <tr key={record._id} className="hover:bg-gray-50">
            <td className="px-4 py-3 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">{formatDate(new Date(record.date))}</div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <div className="text-sm text-gray-500">{record.clockInTime ? formatTime(new Date(record.clockInTime)) : '-'}</div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <div className="text-sm text-gray-500">{record.clockOutTime ? formatTime(new Date(record.clockOutTime)) : '-'}</div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                record.status === 'present' 
                  ? 'bg-green-100 text-green-800' 
                  : record.status === 'late' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : record.status === 'absent'
                      ? 'bg-red-100 text-red-800'
                      : record.status === 'on_break'
                        ? 'bg-blue-100 text-blue-800'
                        : record.status === 'on_lunch'
                          ? 'bg-purple-100 text-purple-800'
                          : record.status === 'on_breakfast' // New status for breakfast
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
              }`}>
                {record.status.replace(/_/g, ' ')}
              </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <div className="text-sm text-gray-500">{primaryNote}</div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <div className="text-sm text-gray-500">
                {record.additionalPunches && record.additionalPunches.length > 0 ? (
                  record.additionalPunches.map((punch, idx) => (
                    <div key={idx}>
                      {punch.type.replace(/_/g, ' ')}: {formatTime(new Date(punch.time))} {punch.reason ? `(${punch.reason})` : ''}
                    </div>
                  ))
                ) : '-'}
              </div>
            </td>
          </tr>
        );
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-6 w-80" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Clock In/Out Card Skeleton */}
            <div className="card">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <Skeleton className="h-10 w-40 mb-1" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-12 w-32 rounded-md" />
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>

            {/* Attendance Record Skeleton */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-48" />
                <div className="flex space-x-1">
                  <Skeleton className="h-8 w-20 rounded-md" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Skeleton className="h-10 w-full mb-2" />
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full mb-2" />
                ))}
              </div>
              <div className="mt-4 text-right">
                <Skeleton className="h-5 w-32 ml-auto" />
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Attendance Summary Skeleton */}
            <div className="card">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>

            {/* Leave Management Skeleton */}
            <div className="card relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-8 w-32" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-5 w-40 mt-6 mb-2" />
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full mb-3" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
        <p className="text-gray-600">Track your attendance and manage leave requests</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Clock In/Out Card */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Clock In/Out</h2>
            
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <div className="text-4xl font-bold mb-1">{formatTime(currentTime)}</div>
                <div className="text-gray-600">{formatDate(currentTime)}</div>
              </div>
              
                <div className="text-center">
                  {!clockedIn && !finalClockedOut && (
                    <Button
                      onClick={() => {
                        if (isLateForOfficeStart) {
                          setLateReasonDialogOpen(true);
                        } else {
                          handleClockIn();
                        }
                      }}
                      className="px-8 py-3 rounded-md font-medium transition-colors bg-green-500 hover:bg-green-600 text-white"
                    >
                      Clock In
                    </Button>
                  )}

                  {/* Breakfast Start Button */}
                  {clockedIn && !onBreak && !onLunch && !onBreakfast && !clockedOutHalfTime && !finalClockedOut && isDuringBreakfastTime && (
                    <Button
                      onClick={() => {
                        if (isAfterBreakfastEndTime) { // This condition might be redundant if isDuringBreakfastTime is true
                          setBreakfastLateReasonDialogOpen(true);
                        } else {
                          handlePunch('breakfast_start', 'Breakfast started');
                        }
                      }}
                      className="px-8 py-3 rounded-md font-medium transition-colors bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Breakfast Start
                    </Button>
                  )}

                  {/* Breakfast End Button (replaces Breakfast Start or appears after clock out) */}
                  {(onBreakfast || (clockedIn && !onBreak && !onLunch && !clockedOutHalfTime && !finalClockedOut && !isDuringBreakfastTime && currentAttendanceRecord?.additionalPunches?.some(p => p.type === 'breakfast_start' && !p.endTime))) && (
                    <Button
                      onClick={() => handlePunch('breakfast_end', 'Breakfast ended')}
                      className="px-8 py-3 rounded-md font-medium transition-colors bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Breakfast End
                    </Button>
                  )}

                  {clockedIn && !onBreak && !onLunch && !onBreakfast && !clockedOutHalfTime && !finalClockedOut && isDuringHalfTime && (
                    <Button onClick={() => setHalfTimeClockOutDialogOpen(true)} className="px-8 py-3 rounded-md font-medium transition-colors bg-yellow-500 hover:bg-yellow-600 text-white">
                      Clock Out (Half Time)
                    </Button>
                  )}

                  {clockedOutHalfTime && !finalClockedOut && isAfterHalfTimeEnd && (
                    <Button 
                      onClick={() => {
                        // Check if current time is after officeHalfTimeEnd + lunchTimeAfterHalfTime
                        const halfTimeInThreshold = new Date(officeHalfTimeEnd);
                        halfTimeInThreshold.setMinutes(halfTimeInThreshold.getMinutes() + lunchTimeAfterHalfTime);

                        if (currentTime > halfTimeInThreshold) {
                          setLateAfterHalfTimeDialogOpen(true);
                        } else {
                          handlePunch('half_time_in', 'Clocked in (Half time)');
                        }
                      }} 
                      className="px-8 py-3 rounded-md font-medium transition-colors bg-green-500 hover:bg-green-600 text-white"
                    >
                      Clock In (After Half Time)
                    </Button>
                  )}

                  {clockedIn && !onBreak && !onLunch && !onBreakfast && !clockedOutHalfTime && !finalClockedOut && !isDuringHalfTime && (
                    <div className="flex flex-col space-y-2">
                      <Button onClick={() => setFinalClockOutDialogOpen(true)} className="px-8 py-3 rounded-md font-medium transition-colors bg-red-500 hover:bg-red-600 text-white">
                        Final Clock Out
                      </Button>
                    </div>
                  )}

                  {(onBreak || onLunch) && (
                    <Button onClick={() => setReturningLateAfterBreakDialogOpen(true)} className="px-8 py-3 rounded-md font-medium transition-colors bg-green-500 hover:bg-green-600 text-white">
                      Clock In from {onBreak ? 'Break' : 'Lunch'}
                    </Button>
                  )}

                  {finalClockedOut && (
                    <p className="text-gray-600 text-lg font-semibold">Clocked Out for the Day</p>
                  )}
                  
                  {!clockedIn && isLateForOfficeStart && (
                    <p className="text-red-500 text-sm mt-2">
                      You are clocking in after office hours ({formatTime(officeStartTime)})
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <div className="text-gray-600">
                    <div>Office Hours: <span className="font-medium">
                      {settings ? `${formatTime(officeStartTime)} - ${settings.workHours.end}` : 'Loading...'}
                    </span></div>
                    <div className="mt-1">Breakfast Hours: <span className="font-medium">
                      {settings ? `${formatTime(breakfastStartTime)} - ${formatTime(breakfastEndTime)}` : 'Loading...'}
                    </span></div>
                    <div className="mt-1">Working Days: <span className="font-medium capitalize">{settings ? formatWorkingDays(settings.workingDays) : 'Loading...'}</span></div>
                  </div>
                  <div className="text-right">
                    <div>Last Clock In: <span className="font-medium">{currentAttendanceRecord?.clockInTime ? formatTime(new Date(currentAttendanceRecord.clockInTime)) : '-'}</span></div>
                    <div className="mt-1">Last Clock Out: <span className="font-medium">{currentAttendanceRecord?.clockOutTime ? formatTime(new Date(currentAttendanceRecord.clockOutTime)) : '-'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          
          {/* Attendance Record */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Attendance Record</h2>
              
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
                <button 
                  onClick={() => setViewMode('daily')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewMode === 'daily' 
                      ? 'bg-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Daily
                </button>
                <button 
                  onClick={() => setViewMode('weekly')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewMode === 'weekly' 
                      ? 'bg-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Weekly
                </button>
                <button 
                  onClick={() => setViewMode('monthly')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewMode === 'monthly' 
                      ? 'bg-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {renderTableHeaders()}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {renderTableRows()}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-right">
              <button className="text-sm text-ems-accent hover:underline">
                View Full History
              </button>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Attendance Summary */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Attendance Summary</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-md p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">{presentDays}</div>
                  <div className="text-sm text-green-600">Present Days</div>
                </div>
                <div className="bg-red-50 rounded-md p-4 text-center">
                  <div className="text-2xl font-bold text-red-700">{absentDays}</div>
                  <div className="text-sm text-red-600">Absent Days</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yellow-50 rounded-md p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-700">{lateArrivals}</div>
                  <div className="text-sm text-yellow-600">Late Arrivals</div>
                </div>
                <div className="bg-blue-50 rounded-md p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-blue-600">Leaves Taken</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-600">
                  <div>This Month Attendance</div>
                  <div className="text-sm font-medium">{monthlyAttendancePercentage}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="h-2 bg-green-500 rounded-full" style={{ width: `${monthlyAttendancePercentage}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Leave Management */}
          <div className="card relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Leave Management</h3>
              <Button 
                className="text-sm text-ems-accent hover:underline"
                onClick={() => setLeaveRequestOpen(true)}
              >
                Request Leave
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <div>Annual Leave</div>
                <div className="font-medium">15 days (8 used)</div>
              </div>
              <div className="flex justify-between text-sm">
                <div>Sick Leave</div>
                <div className="font-medium">10 days (1 used)</div>
              </div>
              <div className="flex justify-between text-sm">
                <div>Personal Leave</div>
                <div className="font-medium">5 days (0 used)</div>
              </div>
            </div>
            
            <h4 className="text-sm font-semibold mt-6 mb-2">Recent Leave Requests</h4>
            
            {leaveRequests.length > 0 ? (
              <div className="space-y-3">
                {leaveRequests.map(request => (
                  <div key={request._id} className="border border-gray-200 rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">
                          {request.type} 
                          {request.employeeId !== effectiveUserId && ` - ${request.employeeName}`}
                        </h5>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(request.startDate).toLocaleDateString()} to {new Date(request.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Reason: {request.reason}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Applied on {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                        {request.adminNotes && (
                          <p className="text-xs text-gray-500 mt-1">
                            Admin Notes: {request.adminNotes}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        request.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : request.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No leave requests found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leave Request Dialog */}
      <Dialog open={leaveRequestOpen} onOpenChange={setLeaveRequestOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
            <DialogDescription>
              Please provide details for your leave request.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleLeaveRequest} className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Leave Type</Label>
                <Select value={leaveType} onValueChange={setLeaveType} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="personal">Personal Leave</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !leaveStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {leaveStartDate ? format(new Date(leaveStartDate), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={leaveStartDate ? new Date(leaveStartDate) : undefined}
                        onSelect={(date) => setLeaveStartDate(date ? date.toISOString().split('T')[0] : '')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !leaveEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {leaveEndDate ? format(new Date(leaveEndDate), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={leaveEndDate ? new Date(leaveEndDate) : undefined}
                        onSelect={(date) => setLeaveEndDate(date ? date.toISOString().split('T')[0] : '')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reason for Leave</Label>
                <Textarea 
                  placeholder="Please provide details about your leave request" 
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  required
                ></Textarea>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setLeaveRequestOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Late Reason Dialog */}
      <Dialog open={lateReasonDialogOpen} onOpenChange={setLateReasonDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Why are you late?</DialogTitle>
            <DialogDescription>
              Please provide a reason for your late arrival.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleLateReasonSubmit(); }} className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reason for being late</Label>
                <Select value={lateReason} onValueChange={setLateReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I forgot to clock in">I forgot to clock in</SelectItem>
                    <SelectItem value="Sleeping">Sleeping</SelectItem>
                    <SelectItem value="Slept Late Night">Slept Late Night</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {lateReason === 'Other' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Please specify</Label>
                  <Textarea 
                    placeholder="Please provide details about your late arrival"
                    rows={3}
                    value={otherLateReason}
                    onChange={(e) => setOtherLateReason(e.target.value)}
                    required={lateReason === 'Other'}
                  ></Textarea>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setLateReasonDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Returning Late After Break Dialog */}
      <Dialog open={returningLateAfterBreakDialogOpen} onOpenChange={setReturningLateAfterBreakDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Why are you returning late?</DialogTitle>
            <DialogDescription>
              Please provide a reason for returning late after your break/lunch.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleReturningLateAfterBreakSubmit(); }} className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reason for returning late</Label>
                <Select value={returningLateAfterBreakReason} onValueChange={setReturningLateAfterBreakReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Meeting ran over">Meeting ran over</SelectItem>
                    <SelectItem value="Outside appointment">Outside appointment</SelectItem>
                    <SelectItem value="Training session">Training session</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {returningLateAfterBreakReason === 'Other' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Please specify</Label>
                  <Textarea 
                    placeholder="Please provide details"
                    rows={3}
                    value={otherReturningLateAfterBreakReason}
                    onChange={(e) => setOtherReturningLateAfterBreakReason(e.target.value)}
                    required={returningLateAfterBreakReason === 'Other'}
                  ></Textarea>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setReturningLateAfterBreakDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Half-Time Clock Out Dialog */}
      <Dialog open={halfTimeClockOutDialogOpen} onOpenChange={setHalfTimeClockOutDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reason for Half-Time Clock Out?</DialogTitle>
            <DialogDescription>
              Please provide a reason for clocking out at half-time.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleHalfTimeClockOutSubmit(); }} className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reason</Label>
                <Select value={halfTimeClockOutReason} onValueChange={setHalfTimeClockOutReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lunch">Lunch</SelectItem>
                    <SelectItem value="Personal appointment">Personal appointment</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {halfTimeClockOutReason === 'Other' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Please specify</Label>
                  <Textarea 
                    placeholder="Please provide details"
                    rows={3}
                    value={otherHalfTimeClockOutReason}
                    onChange={(e) => setOtherHalfTimeClockOutReason(e.target.value)}
                    required={halfTimeClockOutReason === 'Other'}
                  ></Textarea>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setHalfTimeClockOutDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Late After Half-Time Dialog (New) */}
      <Dialog open={lateAfterHalfTimeDialogOpen} onOpenChange={setLateAfterHalfTimeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Why are you late after half-time?</DialogTitle>
            <DialogDescription>
              Please provide a reason for returning late after half-time.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleLateAfterHalfTimeSubmit(); }} className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reason for being late</Label>
                <Select value={lateAfterHalfTimeReason} onValueChange={setLateAfterHalfTimeReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Forgot to clock in">Forgot to clock in</SelectItem>
                    <SelectItem value="Meeting ran over">Meeting ran over</SelectItem>
                    <SelectItem value="Personal appointment">Personal appointment</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {lateAfterHalfTimeReason === 'Other' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Please specify</Label>
                  <Textarea 
                    placeholder="Please provide details"
                    rows={3}
                    value={otherLateAfterHalfTimeReason}
                    onChange={(e) => setOtherLateAfterHalfTimeReason(e.target.value)}
                    required={lateAfterHalfTimeReason === 'Other'}
                  ></Textarea>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setLateAfterHalfTimeDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Breakfast Late Reason Dialog */}
      <Dialog open={breakfastLateReasonDialogOpen} onOpenChange={setBreakfastLateReasonDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Why are you late for breakfast?</DialogTitle>
            <DialogDescription>
              Please provide a reason for being late for breakfast.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleBreakfastLateReasonSubmit(); }} className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reason for being late</Label>
                <Select value={breakfastLateReason} onValueChange={setBreakfastLateReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Overslept">Overslept</SelectItem>
                    <SelectItem value="Traffic">Traffic</SelectItem>
                    <SelectItem value="Personal errand">Personal errand</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {breakfastLateReason === 'Other' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Please specify</Label>
                  <Textarea 
                    placeholder="Please provide details"
                    rows={3}
                    value={otherBreakfastLateReason}
                    onChange={(e) => setOtherBreakfastLateReason(e.target.value)}
                    required={breakfastLateReason === 'Other'}
                  ></Textarea>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setBreakfastLateReasonDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Final Clock Out Dialog */}
      <Dialog open={finalClockOutDialogOpen} onOpenChange={setFinalClockOutDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reason for Final Clock Out?</DialogTitle>
            <DialogDescription>
              Please provide a reason for your final clock out of the day.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleFinalClockOut(); }} className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reason</Label>
                <Select value={finalClockOutReason} onValueChange={setFinalClockOutReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="End of day">End of day</SelectItem>
                    <SelectItem value="Early leave">Early leave</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {finalClockOutReason === 'Other' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Please specify</Label>
                  <Textarea 
                    placeholder="Please provide details"
                    rows={3}
                    value={otherFinalClockOutReason}
                    onChange={(e) => setOtherFinalClockOutReason(e.target.value)}
                    required={finalClockOutReason === 'Other'}
                  ></Textarea>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setFinalClockOutDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Attendance;
