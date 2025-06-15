
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../components/auth/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Plus, UserPlus, Edit, Trash2, User, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Skeleton } from '../components/ui/skeleton'; // Import Skeleton

const Employees = () => {
  const { hasRole } = useAuth();
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isIndividualReportOpen, setIsIndividualReportOpen] = useState(false);
  
  // Check if user has admin or manager role
  if (!hasRole(['admin', 'manager'])) {
    return <Navigate to="/dashboard" replace />;
  }

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch employees on component mount
  React.useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get('/api/employees');
        setEmployees(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching employees:', error);
        // Optionally show an error toast
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []); // Empty dependency array means this effect runs once on mount

  // Handle employee edit
  const handleEditEmployee = (employee) => {
    setCurrentEmployee(employee);
    setEditEmployeeOpen(true);
  };

  // Handle employee delete
  const handleDeleteEmployee = (employee) => {
    setCurrentEmployee(employee);
    setDeleteDialogOpen(true);
  };

  // Handle employee report
  const handleEmployeeReport = (employee) => {
    setSelectedEmployee(employee);
    setIsIndividualReportOpen(true);
  };

  // Confirm employee deletion
  const confirmDeleteEmployee = async () => {
    if (!currentEmployee) return;

    try {
      await axios.delete(`/api/employees/${currentEmployee._id}`);
      setEmployees(employees.filter(emp => emp._id !== currentEmployee._id));
      toast({
        title: "Employee Deleted",
        description: `${currentEmployee.name} has been removed from the system.`,
      });
      setDeleteDialogOpen(false);
      setCurrentEmployee(null);
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Failed to Delete Employee",
        description: error.response?.data?.msg || "There was an error deleting the employee.",
        variant: "destructive",
      });
    }
  };

  // Handle form submission for adding employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newEmployeeData = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
      department: formData.get('department'),
      position: formData.get('position'),
      joinDate: formData.get('joinDate'),
    };

    try {
      const response = await axios.post('/api/employees', newEmployeeData);
      setEmployees([...employees, response.data]);
      toast({
        title: "Employee Added",
        description: "New employee has been successfully added.",
      });
      setAddEmployeeOpen(false);
      // Optionally reset form fields here
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Failed to Add Employee",
        description: error.response?.data?.msg || "There was an error adding the employee.",
        variant: "destructive",
      });
    }
  };

  // Handle form submission for editing employee
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();

    if (!currentEmployee) return;
    
    const formData = new FormData(e.target);
    const updatedEmployeeData = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'), // Include password field, backend should handle if empty
      role: formData.get('role'),
      department: formData.get('department'),
      position: formData.get('position'),
      joinDate: formData.get('joinDate'),
    };

    try {
      const response = await axios.put(`/api/employees/${currentEmployee._id}`, updatedEmployeeData);
      setEmployees(employees.map(emp => emp._id === response.data._id ? response.data : emp));
      toast({
        title: "Employee Updated",
        description: `${response.data.name}'s information has been updated.`,
      });
      setEditEmployeeOpen(false);
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "Failed to Update Employee",
        description: error.response?.data?.msg || "There was an error updating the employee.",
        variant: "destructive",
      });
    }
  };

  // Handle individual report generation
  const handleGenerateIndividualReport = () => {
    toast({
      title: "Report Generated",
      description: `Individual report for ${selectedEmployee.name} has been downloaded.`
    });
    setIsIndividualReportOpen(false);
  };

  // Effect to handle responsive behavior
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add Employee Form
  const AddEmployeeForm = () => (
    <form onSubmit={handleAddEmployee} className="space-y-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Full Name</label>
          <input name="name" type="text" className="form-input" placeholder="John Doe" required />
        </div>
        <div>
          <label className="form-label">Email</label>
          <input name="email" type="email" className="form-input" placeholder="john@example.com" required />
        </div>
        <div>
          <label className="form-label">Password</label>
          <div className="relative">
            <input 
              name="password"
              type={showPassword ? "text" : "password"} 
              className="form-input pr-10" 
              placeholder="Password" 
              required 
            />
            <button 
              type="button" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="form-label">Role</label>
          <select name="role" className="form-input">
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="form-label">Department</label>
          <select name="department" className="form-input">
            <option value="Development">Development</option>
            <option value="Marketing">Marketing</option>
            <option value="Finance">Finance</option>
            <option value="HR">Human Resources</option>
            <option value="Management">Management</option>
          </select>
        </div>
        <div>
          <label className="form-label">Position</label>
          <input name="position" type="text" className="form-input" placeholder="Software Developer" required />
        </div>
        <div>
          <label className="form-label">Join Date</label>
          <input name="joinDate" type="date" className="form-input" required />
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={() => setAddEmployeeOpen(false)}>Cancel</Button>
        <Button type="submit">Add Employee</Button>
      </DialogFooter>
    </form>
  );

  // Edit Employee Form
  const EditEmployeeForm = () => {
    if (!currentEmployee) return null;
    
    return (
      <form onSubmit={handleUpdateEmployee} className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Full Name</label>
            <input name="name" type="text" className="form-input" defaultValue={currentEmployee.name} required />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input name="email" type="email" className="form-input" defaultValue={currentEmployee.email} required />
          </div>
          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <input 
                name="password"
                type={showPassword ? "text" : "password"} 
                className="form-input pr-10" 
                placeholder="Leave blank to keep current password" 
              />
              <button 
                type="button" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="form-label">Role</label>
            <select name="role" className="form-input" defaultValue={currentEmployee.role}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="form-label">Department</label>
            <select name="department" className="form-input" defaultValue={currentEmployee.department}>
              <option value="Development">Development</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="HR">Human Resources</option>
              <option value="Management">Management</option>
            </select>
          </div>
          <div>
            <label className="form-label">Position</label>
            <input name="position" type="text" className="form-input" defaultValue={currentEmployee.position} required />
          </div>
          <div>
            <label className="form-label">Join Date</label>
            <input name="joinDate" type="date" className="form-input" defaultValue={currentEmployee.joinDate} required />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditEmployeeOpen(false)}>Cancel</Button>
          <Button type="submit">Update Employee</Button>
        </DialogFooter>
      </form>
    );
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
          <p className="text-gray-600">Manage team members</p>
        </div>
        <Button 
          className="flex items-center gap-2" 
          onClick={() => setAddEmployeeOpen(true)}
        >
          <UserPlus className="h-5 w-5" />
          <span className="hidden sm:inline">Add Employee</span>
        </Button>
      </div>
      
      <div className="card">
        <div className="overflow-x-auto">
          {loading ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-full mr-4" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Skeleton className="h-8 w-20" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.length > 0 ? (
                  employees.map((employee) => (
                    <tr key={employee._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${employee.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                            employee.role === 'manager' ? 'bg-blue-100 text-blue-800' : 
                            'bg-green-100 text-green-800'}`}>
                          {employee.role ? employee.role.charAt(0).toUpperCase() + employee.role.slice(1) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.joinDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEditEmployee(employee)} className="cursor-pointer">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEmployeeReport(employee)} className="cursor-pointer">
                              <User className="h-4 w-4 mr-2" />
                              Generate Report
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteEmployee(employee)} className="text-red-500 cursor-pointer">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Employee Dialog/Sheet (responsive) */}
      {isMobile ? (
        <Sheet open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add New Employee</SheetTitle>
            </SheetHeader>
            <DialogDescription className="sr-only">
              Form to add a new employee with details like name, email, password, role, department, position, and join date.
            </DialogDescription>
            <AddEmployeeForm />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <DialogDescription className="sr-only">
              Form to add a new employee with details like name, email, password, role, department, position, and join date.
            </DialogDescription>
            <AddEmployeeForm />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Employee Dialog/Sheet (responsive) */}
      {isMobile ? (
        <Sheet open={editEmployeeOpen} onOpenChange={setEditEmployeeOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit Employee</SheetTitle>
            </SheetHeader>
            <DialogDescription className="sr-only">
              Form to edit an existing employee's details.
            </DialogDescription>
            <EditEmployeeForm />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={editEmployeeOpen} onOpenChange={setEditEmployeeOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
            </DialogHeader>
            <DialogDescription className="sr-only">
              Form to edit an existing employee's details.
            </DialogDescription>
            <EditEmployeeForm />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {currentEmployee?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteEmployee}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Individual Employee Report Dialog */}
      <Dialog open={isIndividualReportOpen} onOpenChange={setIsIndividualReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Report for {selectedEmployee?.name}</DialogTitle>
            <DialogDescription>
              Select the report parameters for this employee.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleGenerateIndividualReport(); }} className="space-y-4 pt-4">
            <div className="space-y-4">
              <div>
                <label className="form-label">Report Type</label>
                <select className="form-input">
                  <option value="attendance">Attendance Report</option>
                  <option value="performance">Performance Report</option>
                  <option value="leave">Leave Report</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" required />
                </div>
                <div>
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" required />
                </div>
              </div>
              <div>
                <label className="form-label">Include Details</label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <input id="detailed-logs" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <label htmlFor="detailed-logs" className="ml-2 text-sm text-gray-900">Include detailed attendance logs</label>
                  </div>
                  <div className="flex items-center">
                    <input id="leave-info" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <label htmlFor="leave-info" className="ml-2 text-sm text-gray-900">Include leave information</label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsIndividualReportOpen(false)}>Cancel</Button>
              <Button type="submit">Generate Report</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Employees;
