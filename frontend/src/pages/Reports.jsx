
import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/AuthContext';
import { Navigate } from 'react-router-dom';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { FileText, Download, ChartBar, Calendar, User } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import axios from 'axios'; // Import axios
import { useEffect } from 'react'; // Import useEffect
import { Skeleton } from '../components/ui/skeleton'; // Import Skeleton

const Reports = () => {
  const { hasRole } = useAuth();
  const [selectedReportType, setSelectedReportType] = useState('attendance');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('last7');
  const [generatedReport, setGeneratedReport] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [goalRecords, setGoalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [employeesRes, attendanceRes, goalsRes] = await Promise.all([
          axios.get('/api/employees'),
          axios.get('/api/attendance'),
          axios.get('/api/goals')
        ]);
        setEmployees(employeesRes.data);
        setAttendanceRecords(attendanceRes.data);
        setGoalRecords(goalsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data. Please try again.");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch data for reports.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Check if user has admin or manager role
  if (!hasRole(['admin', 'manager'])) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-6 w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <Skeleton className="h-5 w-5 mr-2 rounded-full" />
                <Skeleton className="h-6 w-40" />
              </div>
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>

        <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center mb-4">
            <Skeleton className="h-5 w-5 mr-2 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-full mb-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        
        <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="rounded-md border overflow-hidden">
            <Skeleton className="h-10 w-full mb-2" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full mb-2" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return <MainLayout><div className="text-center py-8 text-red-500">{error}</div></MainLayout>;
  }

  const handleGenerateReport = (type = null) => {
    const reportType = type || selectedReportType;
    setSelectedReportType(reportType);

    let filteredData = employees;

    // Filter by department
    if (selectedDepartment !== 'all') {
      filteredData = filteredData.filter(emp => emp.department && emp.department.toLowerCase() === selectedDepartment.toLowerCase());
    }

    // Filter by employee
    if (selectedEmployee !== 'all') {
      filteredData = filteredData.filter(emp => emp._id === selectedEmployee);
    }

    // Combine data based on report type
    const combinedReportData = filteredData.map(emp => {
      const empAttendance = attendanceRecords.filter(att => att.employeeId === emp._id);
      const empGoals = goalRecords.filter(goal => goal.employeeId === emp._id);

      // Calculate attendance metrics
      const presentDays = empAttendance.filter(att => att.status === 'present' || att.status === 'clocked_out').length;
      const lateDays = empAttendance.filter(att => att.lateReason).length;
      const absentDays = empAttendance.filter(att => att.status === 'absent').length; // Assuming 'absent' status for actual absences
      const totalAttendanceDays = presentDays + lateDays + absentDays; // Or total days in selectedDateRange
      const attendanceRate = totalAttendanceDays > 0 ? ((presentDays + lateDays) / totalAttendanceDays) * 100 : 0;

      // Calculate goal metrics
      const totalGoals = empGoals.length;
      const completedGoals = empGoals.filter(goal => goal.status === 'completed').length;
      const inProgressGoals = empGoals.filter(goal => goal.status === 'in_progress').length;
      const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

      return {
        ...emp,
        attendance: {
          present: presentDays,
          late: lateDays,
          absent: absentDays,
          rate: parseFloat(attendanceRate.toFixed(2)),
        },
        goals: {
          total: totalGoals,
          completed: completedGoals,
          inProgress: inProgressGoals,
          rate: parseFloat(goalCompletionRate.toFixed(2)),
        },
        // Placeholder for performance score, as there's no direct API for it yet
        performanceScore: 85, // Example static value
        lastReview: '2025-04-15', // Example static value
        performanceStatus: 'Good', // Example static value
      };
    });

    setGeneratedReport({
      type: reportType,
      department: selectedDepartment,
      employee: selectedEmployee,
      dateRange: selectedDateRange,
      data: combinedReportData
    });
  };

  const handleDownloadReport = () => {
    if (!generatedReport) return;
    
    try {
      // Create report content based on type
      let content = '';
      const reportTitle = generatedReport.type === 'attendance' ? 'Attendance Report' : 
                         generatedReport.type === 'goals' ? 'Goal Completion Report' : 
                         'Performance Report';
      
      content += `${reportTitle} - ${new Date().toLocaleDateString()}\n\n`;
      content += `Department: ${generatedReport.department === 'all' ? 'All Departments' : generatedReport.department}\n`;
      content += `Date Range: ${generatedReport.dateRange}\n\n`;
      
      // Add employee data based on report type
      content += generatedReport.data.map(emp => {
        if (generatedReport.type === 'attendance') {
          return `${emp.name} (${emp.department}): Present: ${emp.attendance.present}, Late: ${emp.attendance.late}, Absent: ${emp.attendance.absent}, Rate: ${emp.attendance.rate}%`;
        } else if (generatedReport.type === 'goals') {
          return `${emp.name} (${emp.department}): Goals: ${emp.goals.total}, Completed: ${emp.goals.completed}, In Progress: ${emp.goals.inProgress}, Rate: ${emp.goals.rate}%`;
        } else {
          return `${emp.name} (${emp.department}): Performance Score: 85/100`;
        }
      }).join('\n');
      
      // Force download using Blob and FileSaver approach
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      
      // Create a temporary link element
      const link = document.createElement('a');
      
      // Set link properties
      const fileName = `${reportTitle.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      
      // Check if the browser supports the download attribute
      if ('download' in link) {
        // Modern browsers
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        // Append to the DOM
        document.body.appendChild(link);
        
        // Trigger click event
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      } else {
        // Fallback for older browsers
        navigator.msSaveBlob(blob, fileName);
      }
      
      toast({
        title: "Success",
        description: "Report downloaded successfully!",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download the report. Please try again.",
      });
    }
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-600">View and generate reports for all employees</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 mr-2 text-ems-primary" />
            <h2 className="text-lg font-semibold">Attendance Reports</h2>
          </div>
          <p className="text-gray-600 mb-4">Generate attendance reports for all team members.</p>
          <button 
            className="btn-primary"
            onClick={() => handleGenerateReport('attendance')}
          >
            Generate Report
          </button>
        </div>
        
        <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <ChartBar className="h-5 w-5 mr-2 text-ems-primary" />
            <h2 className="text-lg font-semibold">Goal Completion Reports</h2>
          </div>
          <p className="text-gray-600 mb-4">Track goal completion metrics across teams.</p>
          <button 
            className="btn-primary"
            onClick={() => handleGenerateReport('goals')}
          >
            Generate Report
          </button>
        </div>

        <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 mr-2 text-ems-primary" />
            <h2 className="text-lg font-semibold">Individual Reports</h2>
          </div>
          <p className="text-gray-600 mb-4">Generate detailed reports for specific employees.</p>
          <button 
            className="btn-primary"
            onClick={() => handleGenerateReport('individual')}
          >
            Generate Report
          </button>
        </div>
      </div>
      
      <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center mb-4">
          <FileText className="h-5 w-5 mr-2 text-ems-primary" />
          <h2 className="text-lg font-semibold">Custom Reports</h2>
        </div>
        <p className="text-gray-600 mb-4">Create customized reports with specific parameters.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select 
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-ems-primary focus:ring focus:ring-ems-primary focus:ring-opacity-50"
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
            >
              <option value="attendance">Attendance</option>
              <option value="goals">Goals</option>
              <option value="performance">Performance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select 
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-ems-primary focus:ring focus:ring-ems-primary focus:ring-opacity-50"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              <option value="development">Development</option>
              <option value="marketing">Marketing</option>
              <option value="finance">Finance</option>
              <option value="management">Management</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select 
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-ems-primary focus:ring focus:ring-ems-primary focus:ring-opacity-50"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select 
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-ems-primary focus:ring focus:ring-ems-primary focus:ring-opacity-50"
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
            >
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 3 Months</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>
        
        <button className="btn-primary" onClick={() => handleGenerateReport()}>Generate Custom Report</button>
      </div>
      
      {generatedReport && (
        <div className="card bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {generatedReport.type === 'attendance' ? 'Attendance Report' : 
               generatedReport.type === 'goals' ? 'Goal Completion Report' : 
               'Performance Report'}
            </h2>
            <button 
              className="flex items-center btn-outline"
              onClick={handleDownloadReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </button>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  {generatedReport.type === 'attendance' ? (
                    <>
                      <TableHead>Present Days</TableHead>
                      <TableHead>Late Days</TableHead>
                      <TableHead>Absent Days</TableHead>
                      <TableHead>Attendance Rate</TableHead>
                    </>
                  ) : generatedReport.type === 'goals' ? (
                    <>
                      <TableHead>Total Goals</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>In Progress</TableHead>
                      <TableHead>Completion Rate</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Performance Score</TableHead>
                      <TableHead>Last Review</TableHead>
                      <TableHead>Status</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedReport.data.map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    {generatedReport.type === 'attendance' ? (
                      <>
                        <TableCell>{employee.attendance.present}</TableCell>
                        <TableCell>{employee.attendance.late}</TableCell>
                        <TableCell>{employee.attendance.absent}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className={`mr-2 ${employee.attendance.rate >= 90 ? 'text-green-600' : employee.attendance.rate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {employee.attendance.rate}%
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${employee.attendance.rate >= 90 ? 'bg-green-500' : employee.attendance.rate >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                style={{ width: `${employee.attendance.rate}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                      </>
                    ) : generatedReport.type === 'goals' ? (
                      <>
                        <TableCell>{employee.goals.total}</TableCell>
                        <TableCell>{employee.goals.completed}</TableCell>
                        <TableCell>{employee.goals.inProgress}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className={`mr-2 ${employee.goals.rate >= 75 ? 'text-green-600' : employee.goals.rate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {employee.goals.rate}%
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${employee.goals.rate >= 75 ? 'bg-green-500' : employee.goals.rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                style={{ width: `${employee.goals.rate}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>85/100</TableCell>
                        <TableCell>2025-04-15</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Good
                          </span>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Reports;
