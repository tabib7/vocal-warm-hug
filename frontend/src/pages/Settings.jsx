import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';
import { useAuth } from '../components/auth/AuthContext';
import { Navigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Skeleton } from '../components/ui/skeleton'; // Import Skeleton

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Settings = () => {
  const { hasRole } = useAuth();
  
  const [settings, setSettings] = useState({
    companyName: "Employee Management System",
    companyAddress: "123 Main Street, City, Country",
    systemEmail: "system@example.com",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12 Hour (AM/PM)",
    officeStartTime: "07:00",
    officeEndTime: "16:00",
    breakfastStartTime: "08:00",
    breakfastEndTime: "08:30",
    officeHalfTimeStart: "13:00",
    officeHalfTimeEnd: "14:15",
    breakTimeDuration: 20, // Renamed from breakfastTime for clarity
    lunchTimeAfterHalfTime: 30, // Default value in minutes
    lateArrivalThreshold: 15,
    geoVerification: false,
    autoClockOut: false,
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
      const response = await axios.get(`${API_BASE_URL}/api/settings`);
        // Map backend response to frontend state structure
        setSettings({
          companyName: response.data.companyName,
          companyAddress: response.data.companyAddress,
          systemEmail: response.data.systemEmail,
          dateFormat: response.data.dateFormat,
          timeFormat: response.data.timeFormat,
          officeStartTime: response.data.workHours.start,
          officeEndTime: response.data.workHours.end,
          breakfastStartTime: response.data.breakTime.start,
          breakfastEndTime: response.data.breakTime.end,
          officeHalfTimeStart: response.data.officeHalfTimeStart,
          officeHalfTimeEnd: response.data.officeHalfTimeEnd,
          breakTimeDuration: response.data.breakTime.duration, // Fetch as breakTimeDuration
          lunchTimeAfterHalfTime: response.data.lunchTimeAfterHalfTime, // Fetch new setting as number
          lateArrivalThreshold: response.data.lateArrivalThreshold,
          geoVerification: response.data.geoVerification,
          autoClockOut: response.data.autoClockOut,
          workingDays: response.data.workingDays || { // Provide a default empty object if undefined
            monday: false, tuesday: false, wednesday: false, thursday: false,
            friday: false, saturday: false, sunday: false
          },
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: "Failed to fetch settings",
          description: "There was an error loading application settings.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Function to handle form field changes
  const handleSettingsChange = (section, field, value) => {
    if (section === 'workingDays') {
      setSettings(prevSettings => ({
        ...prevSettings,
        workingDays: {
          ...prevSettings.workingDays,
          [field]: value
        }
      }));
    } else if (section === 'workHours') { // Handle workHours separately
      setSettings(prevSettings => ({
        ...prevSettings,
        officeStartTime: field === 'start' ? value : prevSettings.officeStartTime,
        officeEndTime: field === 'end' ? value : prevSettings.officeEndTime,
      }));
    } else if (section === 'breakTime') { // Handle breakTime separately
      setSettings(prevSettings => ({
        ...prevSettings,
        breakfastStartTime: field === 'start' ? value : prevSettings.breakfastStartTime,
        breakfastEndTime: field === 'end' ? value : prevSettings.breakfastEndTime,
        breakTimeDuration: field === 'duration' ? value : prevSettings.breakTimeDuration,
      }));
    } else if (section === 'attendance') { // Handle attendance-related fields
      setSettings(prevSettings => ({
        ...prevSettings,
        [field]: field === 'lunchTimeAfterHalfTime' ? parseInt(value) : value
      }));
    } else {
      setSettings(prevSettings => ({
        ...prevSettings,
        [field]: value
      }));
    }
  };

  // Function to save settings
  const handleSaveSettings = async () => {
    try {
      // Map frontend state back to backend model structure
      const dataToSave = {
        companyName: settings.companyName,
        companyAddress: settings.companyAddress,
        systemEmail: settings.systemEmail,
        dateFormat: settings.dateFormat,
        timeFormat: settings.timeFormat,
        workHours: {
          start: settings.officeStartTime,
          end: settings.officeEndTime
        },
        officeHalfTimeStart: settings.officeHalfTimeStart,
        officeHalfTimeEnd: settings.officeHalfTimeEnd,
        breakTime: {
          start: settings.breakfastStartTime,
          end: settings.breakfastEndTime,
          duration: settings.breakTimeDuration,
          allowedPerDay: settings.breakTime?.allowedPerDay || 2 // Retain allowedPerDay if it exists, or default
        },
        lunchTime: {
          duration: settings.lunchTime?.duration || 60 // Retain duration if it exists, or default
        },
        lunchTimeAfterHalfTime: settings.lunchTimeAfterHalfTime, // Save new setting as number
        lateArrivalThreshold: settings.lateArrivalThreshold,
        geoVerification: settings.geoVerification,
        autoClockOut: settings.autoClockOut,
        workingDays: settings.workingDays,
      };

      const response = await axios.put(`${API_BASE_URL}/api/settings`, dataToSave);
      // Update state with saved settings (e.g., updatedAt) - re-map from backend response
      setSettings(prevSettings => ({
        ...prevSettings,
        companyName: response.data.companyName,
        companyAddress: response.data.companyAddress,
        systemEmail: response.data.systemEmail,
        dateFormat: response.data.dateFormat,
        timeFormat: response.data.timeFormat,
        officeStartTime: response.data.workHours.start,
        officeEndTime: response.data.workHours.end,
        breakfastStartTime: response.data.breakTime.start,
        breakfastEndTime: response.data.breakTime.end,
        officeHalfTimeStart: response.data.officeHalfTimeStart,
        officeHalfTimeEnd: response.data.officeHalfTimeEnd,
        breakTimeDuration: response.data.breakTime.duration, // Update as breakTimeDuration
        lunchTimeAfterHalfTime: response.data.lunchTimeAfterHalfTime, // Update new setting as number
        lateArrivalThreshold: response.data.lateArrivalThreshold,
        geoVerification: response.data.geoVerification,
        autoClockOut: response.data.autoClockOut,
        workingDays: response.data.workingDays || { // Provide a default empty object if undefined
          monday: false, tuesday: false, wednesday: false, thursday: false,
          friday: false, saturday: false, sunday: false
        },
      }));
      toast({
        title: "Settings Saved",
        description: "Application settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Failed to Save Settings",
        description: error.response?.data?.msg || "There was an error saving the settings.",
        variant: "destructive"
      });
    }
  };

  // Function to reset settings (re-fetch from backend)
  const handleResetSettings = async () => {
    setLoading(true); // Show loading state while re-fetching
    try {
      const response = await axios.get(`${API_BASE_URL}/api/settings`);
      // Map backend response to frontend state structure
      setSettings(prevSettings => ({
        ...prevSettings,
        companyName: response.data.companyName,
        companyAddress: response.data.companyAddress,
        systemEmail: response.data.systemEmail,
        dateFormat: response.data.dateFormat,
        timeFormat: response.data.timeFormat,
        officeStartTime: response.data.workHours.start,
        officeEndTime: response.data.workHours.end,
        breakfastStartTime: response.data.breakTime.start,
        breakfastEndTime: response.data.breakTime.end,
        officeHalfTimeStart: response.data.officeHalfTimeStart,
        officeHalfTimeEnd: response.data.officeHalfTimeEnd,
        breakTimeDuration: response.data.breakTime.duration, // Reset as breakTimeDuration
        lunchTimeAfterHalfTime: response.data.lunchTimeAfterHalfTime, // Reset new setting as number
        lateArrivalThreshold: response.data.lateArrivalThreshold,
        geoVerification: response.data.geoVerification,
        autoClockOut: response.data.autoClockOut,
        workingDays: response.data.workingDays || { // Provide a default empty object if undefined
          monday: false, tuesday: false, wednesday: false, thursday: false,
          friday: false, saturday: false, sunday: false
        },
      }));
      toast({
        title: "Settings Reset",
        description: "Settings have been reset to their last saved values.",
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({
        title: "Failed to Reset Settings",
        description: "There was an error resetting the settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Check if user has admin role
  if (!hasRole('admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
        <p className="text-gray-600">Configure system settings and preferences</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
            <div className="p-4 font-medium">Settings Categories</div>
            <ul>
              <li className="p-4 bg-gray-50 border-l-4 border-ems-primary">
                <a href="#general" className="block text-ems-primary">General</a>
              </li>
              <li className="p-4 hover:bg-gray-50">
                <a href="#attendance" className="block text-gray-700 hover:text-ems-primary">Attendance Rules</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="col-span-2">
          {loading ? (
            <>
              <div id="general" className="card mb-6">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex space-x-3">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
              
              <div id="attendance" className="card mb-6">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="space-y-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-40 mb-1" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    {[...Array(7)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-20 rounded-full" />
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex space-x-3">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div id="general" className="card mb-6">
                <h2 className="text-xl font-semibold mb-4">General Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <Input 
                      type="text" 
                      value={settings.companyName}
                      onChange={(e) => handleSettingsChange('general', 'companyName', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
                    <Textarea 
                      rows={3}
                      value={settings.companyAddress}
                      onChange={(e) => handleSettingsChange('general', 'companyAddress', e.target.value)}
                    ></Textarea>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">System Email</label>
                    <Input 
                      type="email" 
                      value={settings.systemEmail}
                      onChange={(e) => handleSettingsChange('general', 'systemEmail', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                    <select 
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-ems-primary focus:ring focus:ring-ems-primary focus:ring-opacity-50 px-3 py-2"
                      value={settings.dateFormat}
                      onChange={(e) => handleSettingsChange('general', 'dateFormat', e.target.value)}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Format</label>
                    <select 
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-ems-primary focus:ring focus:ring-ems-primary focus:ring-opacity-50 px-3 py-2"
                      value={settings.timeFormat}
                      onChange={(e) => handleSettingsChange('general', 'timeFormat', e.target.value)}
                    >
                      <option value="12 Hour (AM/PM)">12 Hour (AM/PM)</option>
                      <option value="24 Hour">24 Hour</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button 
                    className="btn-primary"
                    onClick={handleSaveSettings}
                  >
                    Save Changes
                  </button>
                  <button 
                    className="btn-secondary ml-3"
                    onClick={handleResetSettings}
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
              
              <div id="attendance" className="card mb-6">
                <h2 className="text-xl font-semibold mb-4">Attendance Rules</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Office Start Time</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !settings.officeStartTime && "text-muted-foreground"
                          )}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {settings.officeStartTime ? settings.officeStartTime : <span>Pick a time</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <div className="flex gap-2 p-2">
                          <Select
                            value={settings.officeStartTime.split(':')[0]}
                            onValueChange={(value) => handleSettingsChange('workHours', 'start', `${value}:${settings.officeStartTime.split(':')[1] || '00'}`)}
                          >
                            <SelectTrigger className="w-[80px]">
                              <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(hour => (
                                <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={settings.officeStartTime.split(':')[1]}
                            onValueChange={(value) => handleSettingsChange('workHours', 'start', `${settings.officeStartTime.split(':')[0] || '00'}:${value}`)}
                          >
                            <SelectTrigger className="w-[80px]">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(minute => (
                                <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Office End Time</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !settings.officeEndTime && "text-muted-foreground"
                          )}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {settings.officeEndTime ? settings.officeEndTime : <span>Pick a time</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <div className="flex gap-2 p-2">
                          <Select
                            value={settings.officeEndTime.split(':')[0]}
                            onValueChange={(value) => handleSettingsChange('workHours', 'end', `${value}:${settings.officeEndTime.split(':')[1] || '00'}`)}
                          >
                            <SelectTrigger className="w-[80px]">
                              <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(hour => (
                                <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={settings.officeEndTime.split(':')[1]}
                            onValueChange={(value) => handleSettingsChange('workHours', 'end', `${settings.officeEndTime.split(':')[0] || '00'}:${value}`)}
                          >
                            <SelectTrigger className="w-[80px]">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(minute => (
                                <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Breakfast Start Time</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !settings.breakfastStartTime && "text-muted-foreground"
                          )}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {settings.breakfastStartTime ? settings.breakfastStartTime : <span>Pick a time</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <div className="flex gap-2 p-2">
                          <Select
                            value={settings.breakfastStartTime.split(':')[0]}
                            onValueChange={(value) => handleSettingsChange('breakTime', 'start', `${value}:${settings.breakfastStartTime.split(':')[1] || '00'}`)}
                          >
                            <SelectTrigger className="w-[80px]">
                              <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(hour => (
                                <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={settings.breakfastStartTime.split(':')[1]}
                            onValueChange={(value) => handleSettingsChange('breakTime', 'start', `${settings.breakfastStartTime.split(':')[0] || '00'}:${value}`)}
                          >
                            <SelectTrigger className="w-[80px]">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(minute => (
                                <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Breakfast End Time</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !settings.breakfastEndTime && "text-muted-foreground"
                          )}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {settings.breakfastEndTime ? settings.breakfastEndTime : <span>Pick a time</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <div className="flex gap-2 p-2">
                          <Select
                            value={settings.breakfastEndTime.split(':')[0]}
                            onValueChange={(value) => handleSettingsChange('breakTime', 'end', `${value}:${settings.breakfastEndTime.split(':')[1] || '00'}`)}
                          >
                            <SelectTrigger className="w-[80px]">
                              <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(hour => (
                                <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={settings.breakfastEndTime.split(':')[1]}
                            onValueChange={(value) => handleSettingsChange('breakTime', 'end', `${settings.breakfastEndTime.split(':')[0] || '00'}:${value}`)}
                          >
                            <SelectTrigger className="w-[80px]">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(minute => (
                                <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Office Half-Time Start</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !settings.officeHalfTimeStart && "text-muted-foreground"
                          )}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {settings.officeHalfTimeStart ? settings.officeHalfTimeStart : <span>Pick a time</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <div className="flex gap-2 p-2">
                          <Select
                            value={settings.officeHalfTimeStart.split(':')[0]}
                            onValueChange={(value) => handleSettingsChange('attendance', 'officeHalfTimeStart', `${value}:${settings.officeHalfTimeStart.split(':')[1] || '00'}`)}
                          >
                            <SelectTrigger className="w-[80px]">
                              <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(hour => (
                                <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={settings.officeHalfTimeStart.split(':')[1]}
                            onValueChange={(value) => handleSettingsChange('attendance', 'officeHalfTimeStart', `${settings.officeHalfTimeStart.split(':')[0] || '00'}:${value}`)}
                          >
                            <SelectTrigger className="w-[80px]">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(minute => (
                                <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Office Half-Time End</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !settings.officeHalfTimeEnd && "text-muted-foreground"
                          )}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          {settings.officeHalfTimeEnd ? settings.officeHalfTimeEnd : <span>Pick a time</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <div className="flex gap-2 p-2">
                          <Select
                            value={settings.officeHalfTimeEnd.split(':')[0]}
                            onValueChange={(value) => handleSettingsChange('attendance', 'officeHalfTimeEnd', `${value}:${settings.officeHalfTimeEnd.split(':')[1] || '00'}`)}
                          >
                            <SelectTrigger className="w-[80px]">
                              <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(hour => (
                                <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={settings.officeHalfTimeEnd.split(':')[1]}
                            onValueChange={(value) => handleSettingsChange('attendance', 'officeHalfTimeEnd', `${settings.officeHalfTimeEnd.split(':')[0] || '00'}:${value}`)}
                          >
                            <SelectTrigger className="w-[80px]">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(minute => (
                                <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Breakfast Duration - After Breakfast (minutes)</label>
                    <Input 
                      type="number"
                      min="5"
                      max="60" 
                      value={settings.breakTimeDuration}
                      onChange={(e) => handleSettingsChange('breakTime', 'duration', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lunch Time After Half-Time (minutes)</label>
                    <Input 
                      type="number"
                      min="0"
                      max="120" // Assuming a reasonable max for lunch break in minutes
                      value={settings.lunchTimeAfterHalfTime}
                      onChange={(e) => handleSettingsChange('attendance', 'lunchTimeAfterHalfTime', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Late Arrival Threshold (minutes)</label>
                    <Input 
                      type="number" 
                      min="0"
                      value={settings.lateArrivalThreshold}
                      onChange={(e) => handleSettingsChange('attendance', 'lateArrivalThreshold', e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      id="geoVerification" 
                      type="checkbox" 
                      className="h-4 w-4 text-ems-primary focus:ring-ems-primary border-gray-300 rounded"
                      checked={settings.geoVerification}
                      onChange={(e) => handleSettingsChange('attendance', 'geoVerification', e.target.checked)}
                    />
                    <label htmlFor="geoVerification" className="ml-2 block text-sm text-gray-900">
                      Enable Location Verification for Attendance
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      id="autoClockOut" 
                      type="checkbox" 
                      className="h-4 w-4 text-ems-primary focus:ring-ems-primary border-gray-300 rounded"
                      checked={settings.autoClockOut}
                      onChange={(e) => handleSettingsChange('attendance', 'autoClockOut', e.target.checked)}
                    />
                    <label htmlFor="autoClockOut" className="ml-2 block text-sm text-gray-900">
                      Auto Clock-Out at End Time
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Working Days</label>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex items-center">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 text-ems-primary focus:ring-ems-primary border-gray-300 rounded" 
                          checked={settings.workingDays.monday}
                          onChange={(e) => handleSettingsChange('workingDays', 'monday', e.target.checked)}
                        />
                        <span className="ml-2">Mon</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 text-ems-primary focus:ring-ems-primary border-gray-300 rounded" 
                          checked={settings.workingDays.tuesday}
                          onChange={(e) => handleSettingsChange('workingDays', 'tuesday', e.target.checked)}
                        />
                        <span className="ml-2">Tue</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 text-ems-primary focus:ring-ems-primary border-gray-300 rounded" 
                          checked={settings.workingDays.wednesday}
                          onChange={(e) => handleSettingsChange('workingDays', 'wednesday', e.target.checked)}
                        />
                        <span className="ml-2">Wed</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 text-ems-primary focus:ring-ems-primary border-gray-300 rounded" 
                          checked={settings.workingDays.thursday}
                          onChange={(e) => handleSettingsChange('workingDays', 'thursday', e.target.checked)}
                        />
                        <span className="ml-2">Thu</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 text-ems-primary focus:ring-ems-primary border-gray-300 rounded" 
                          checked={settings.workingDays.friday}
                          onChange={(e) => handleSettingsChange('workingDays', 'friday', e.target.checked)}
                        />
                        <span className="ml-2">Fri</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 text-ems-primary focus:ring-ems-primary border-gray-300 rounded" 
                          checked={settings.workingDays.saturday}
                          onChange={(e) => handleSettingsChange('workingDays', 'saturday', e.target.checked)}
                        />
                        <span className="ml-2">Sat</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 text-ems-primary focus:ring-ems-primary border-gray-300 rounded" 
                          checked={settings.workingDays.sunday}
                          onChange={(e) => handleSettingsChange('workingDays', 'sunday', e.target.checked)}
                        />
                        <span className="ml-2">Sun</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button 
                    className="btn-primary"
                    onClick={handleSaveSettings}
                  >
                    Save Changes
                  </button>
                  <button 
                    className="btn-secondary ml-3"
                    onClick={handleResetSettings}
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
