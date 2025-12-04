import { useState, useEffect, useRef, useCallback } from 'react';
import { TextField } from '@mui/material';
import { PatternFormat } from 'react-number-format';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

interface Employee {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  location: string;
  no_of_hours: number;
  employment_start_date: string;
  start_date: string; // OPT start date
  end_date: string;   // OPT end date
  visa_status: string;
  college_name: string;
  college_address: string;
  degree: string;
  college_Dso_name?: string;
  college_Dso_email?: string;
  college_Dso_phone?: string;
  // Primary Emergency Contact
  primary_emergency_contact_full_name?: string;
  primary_emergency_contact_relationship?: string;
  primary_emergency_contact_home_phone?: string;
  // Secondary Emergency Contact
  secondary_emergency_contact_full_name?: string;
  secondary_emergency_contact_relationship?: string;
  secondary_emergency_contact_home_phone?: string;
  job_title: string;
  date_of_birth: string;
  compensation: string;
  job_duties: string;
  project_manager_id: number;
}

const EmployeeReviewView = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setIsModalOpen(false);
    }
  }, []);

  // Helper to check if a field is missing (for highlighting)
  const isFieldMissing = useCallback((fieldName: string, value: any): boolean => {
    if (!selectedEmployee) return false;
    // Check original value from selectedEmployee
    const originalValue = (selectedEmployee as any)[fieldName];
    const isEmpty = originalValue === null || originalValue === undefined || originalValue === '';
    return isEmpty;
  }, [selectedEmployee]);

  // Get input class based on whether field is filled
  const getInputClass = useCallback((fieldName: string, currentValue: any): string => {
    const baseClass = "w-full px-3 py-2 rounded-md focus:ring-2 focus:outline-none transition-colors duration-200";
    const wasMissing = isFieldMissing(fieldName, currentValue);
    const isFilled = currentValue !== null && currentValue !== undefined && currentValue !== '';
    
    if (wasMissing && !isFilled) {
      // Missing and still empty - red border
      return `${baseClass} border-2 border-red-400 bg-red-50 focus:ring-red-500 focus:border-red-500`;
    } else if (wasMissing && isFilled) {
      // Was missing but now filled - green border
      return `${baseClass} border-2 border-green-400 bg-green-50 focus:ring-green-500 focus:border-green-500`;
    } else {
      // Normal field
      return `${baseClass} border border-gray-300 focus:ring-blue-500 focus:border-transparent`;
    }
  }, [isFieldMissing]);

  useEffect(() => {
    fetchEmployeesForReview();
  }, []);

  const fetchEmployeesForReview = async () => {
    try {
      const response = await apiClient.get('/auth/employees-for-review');
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch employees for review:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const handleReviewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({ ...employee, 
      start_date: formatDateForInput(employee.start_date),
      end_date: formatDateForInput(employee.end_date),
      employment_start_date: formatDateForInput(employee.employment_start_date),
      date_of_birth: formatDateForInput(employee.date_of_birth),
    });
    setIsModalOpen(true);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (formData) {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !selectedEmployee) return;

    try {
      const payload: any = {
        first_name: formData.first_name ?? formData.name?.split(' ')[0],
        last_name: formData.last_name ?? formData.name?.split(' ').slice(1).join(' '),
        email: formData.email,
        phone: String(formData.phone || '').replace(/\D/g, ''),
        location: formData.location,
        no_of_hours: formData.no_of_hours,
        employment_start_date: formData.employment_start_date || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        visa_status: formData.visa_status,
        college_name: formData.college_name,
        college_address: formData.college_address,
        degree: formData.degree,
        college_Dso_name: formData.college_Dso_name,
        college_Dso_email: formData.college_Dso_email,
        college_Dso_phone: formData.college_Dso_phone,
        primary_emergency_contact_full_name: formData.primary_emergency_contact_full_name,
        primary_emergency_contact_relationship: formData.primary_emergency_contact_relationship,
        primary_emergency_contact_home_phone: formData.primary_emergency_contact_home_phone,
        secondary_emergency_contact_full_name: formData.secondary_emergency_contact_full_name,
        secondary_emergency_contact_relationship: formData.secondary_emergency_contact_relationship,
        secondary_emergency_contact_home_phone: formData.secondary_emergency_contact_home_phone,
        job_title: formData.job_title,
        date_of_birth: formData.date_of_birth || undefined,
        compensation: formData.compensation,
        job_duties: formData.job_duties,
        project_manager_id: formData.project_manager_id,
      };
      await apiClient.put(`/auth/employee/${selectedEmployee.id}`, payload);
      setSuccess('Employee details updated successfully');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchEmployeesForReview();
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update employee details');
    }
  };

  const getMissingFields = (employee: Employee) => {
    const fields: string[] = [];
    // Users table fields
    if (!employee.first_name && !employee.name?.split(' ')[0]) fields.push('First Name');
    if (!employee.last_name && !employee.name?.split(' ').slice(1).join(' ')) fields.push('Last Name');
    if (!employee.email) fields.push('Email');
    if (!employee.phone) fields.push('Phone');
    if (!employee.location) fields.push('Location');
    if (!employee.no_of_hours) fields.push('No. of Hours');
    // Employees table - basic info
    if (!employee.employment_start_date) fields.push('Employment Start Date');
    if (!employee.start_date) fields.push('OPT Start Date');
    if (!employee.end_date) fields.push('OPT End Date');
    if (!employee.visa_status) fields.push('Visa Status');
    if (!employee.job_title) fields.push('Job Title');
    if (!employee.date_of_birth) fields.push('Date of Birth');
    if (!employee.compensation) fields.push('Compensation');
    if (!employee.job_duties) fields.push('Job Duties');
    // College/Education info
    if (!employee.college_name) fields.push('College Name');
    if (!employee.college_address) fields.push('College Address');
    if (!employee.degree) fields.push('Degree');
    if (!employee.college_Dso_name) fields.push('DSO Name');
    if (!employee.college_Dso_email) fields.push('DSO Email');
    if (!employee.college_Dso_phone) fields.push('DSO Phone');
    // Primary Emergency Contact
    if (!employee.primary_emergency_contact_full_name) fields.push('Primary Emergency Contact Name');
    if (!employee.primary_emergency_contact_relationship) fields.push('Primary Emergency Contact Relationship');
    if (!employee.primary_emergency_contact_home_phone) fields.push('Primary Emergency Contact Phone');
    // Secondary Emergency Contact
    if (!employee.secondary_emergency_contact_full_name) fields.push('Secondary Emergency Contact Name');
    if (!employee.secondary_emergency_contact_relationship) fields.push('Secondary Emergency Contact Relationship');
    if (!employee.secondary_emergency_contact_home_phone) fields.push('Secondary Emergency Contact Phone');
    return fields;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Employee Profile Review</h2>
        <p className="text-gray-600 mt-2">
          {employees.length} employee{employees.length !== 1 ? 's' : ''} need{employees.length === 1 ? 's' : ''} review
        </p>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No employees need review at this time</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {employees.map((employee) => (
            <div key={employee.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{`${employee.first_name ?? (employee.name?.split(' ')[0]||'')} ${employee.last_name ?? (employee.name?.split(' ').slice(1).join(' ')||'')}`}</h3>
                  <p className="text-gray-600">{employee.email}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Missing: {getMissingFields(employee).join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => handleReviewEmployee(employee)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Review & Update
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && formData && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
        >
          <div ref={modalRef} className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Employee: Profile View : {selectedEmployee?.name}</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
                  <p className="text-red-700">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded-md">
                  <p className="text-green-700">{success}</p>
                </div>
              )}

              {/* Legend for field colors */}
              <div className="mb-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-red-400 bg-red-50 rounded"></div>
                  <span className="text-gray-600">Missing field</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-green-400 bg-green-50 rounded"></div>
                  <span className="text-gray-600">Now filled</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    name="first_name"
                    type="text"
                    value={formData.first_name ?? (formData.name ? formData.name.split(' ')[0] : '')}
                    onChange={handleInputChange}
                    className={getInputClass('first_name', formData.first_name ?? (formData.name ? formData.name.split(' ')[0] : ''))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    name="last_name"
                    type="text"
                    value={formData.last_name ?? (formData.name ? formData.name.split(' ').slice(1).join(' ') : '')}
                    onChange={handleInputChange}
                    className={getInputClass('last_name', formData.last_name ?? (formData.name ? formData.name.split(' ').slice(1).join(' ') : ''))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    className={getInputClass('email', formData.email)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <PatternFormat
                    format="+1 (###) ###-####"
                    mask="_"
                    allowEmptyFormatting
                    value={formData.phone || ''}
                    onValueChange={(vals) => handleInputChange({ target: { name: 'phone', value: vals.formattedValue } } as any)}
                    name="phone"
                    placeholder="Enter phone number"
                    className={getInputClass('phone', formData.phone)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    name="location"
                    type="text"
                    value={formData.location || ''}
                    onChange={handleInputChange}
                    className={getInputClass('location', formData.location)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours per Week</label>
                  <input
                    name="no_of_hours"
                    type="number"
                    value={formData.no_of_hours || ''}
                    onChange={handleInputChange}
                    className={getInputClass('no_of_hours', formData.no_of_hours)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Start Date</label>
                  <input
                    name="employment_start_date"
                    type="date"
                    value={formData.employment_start_date || ''}
                    onChange={handleInputChange}
                    className={getInputClass('employment_start_date', formData.employment_start_date)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OPT Start Date</label>
                  <input
                    name="start_date"
                    type="date"
                    value={formData.start_date || ''}
                    onChange={handleInputChange}
                    className={getInputClass('start_date', formData.start_date)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OPT End Date</label>
                  <input
                    name="end_date"
                    type="date"
                    value={formData.end_date || ''}
                    onChange={handleInputChange}
                    className={getInputClass('end_date', formData.end_date)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={handleInputChange}
                    className={getInputClass('date_of_birth', formData.date_of_birth)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visa Status</label>
                  <input
                    name="visa_status"
                    type="text"
                    value={formData.visa_status || ''}
                    onChange={handleInputChange}
                    className={getInputClass('visa_status', formData.visa_status)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    name="job_title"
                    type="text"
                    value={formData.job_title || ''}
                    onChange={handleInputChange}
                    className={getInputClass('job_title', formData.job_title)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                  <input
                    name="college_name"
                    type="text"
                    value={formData.college_name || ''}
                    onChange={handleInputChange}
                    className={getInputClass('college_name', formData.college_name)}
                  />
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                <input
                  name="degree"
                  type="text"
                  value={formData.degree || ''}
                  onChange={handleInputChange}
                  className={getInputClass('degree', formData.degree)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">College DSO Name</label>
                <input
                  name="college_Dso_name"
                  type="text"
                  value={formData.college_Dso_name || ''}
                  onChange={handleInputChange}
                  className={getInputClass('college_Dso_name', formData.college_Dso_name)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">College DSO Email</label>
                <input
                  name="college_Dso_email"
                  type="email"
                  value={formData.college_Dso_email || ''}
                  onChange={handleInputChange}
                  className={getInputClass('college_Dso_email', formData.college_Dso_email)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">College DSO Phone</label>
                <PatternFormat
                  format="+1 (###) ###-####"
                  mask="_"
                  allowEmptyFormatting
                  value={formData.college_Dso_phone || ''}
                  onValueChange={(vals) => handleInputChange({ target: { name: 'college_Dso_phone', value: vals.formattedValue } } as any)}
                  name="college_Dso_phone"
                  className={getInputClass('college_Dso_phone', formData.college_Dso_phone)}
                />
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compensation (e.g., "Unpaid Intern" or "$15/hour")</label>
                  <input
                    name="compensation"
                    type="text"
                    value={formData.compensation || ''}
                    onChange={handleInputChange}
                    placeholder="Unpaid Intern or $15/hour"
                    className={getInputClass('compensation', formData.compensation)}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">College Address</label>
                <input
                  name="college_address"
                  type="text"
                  value={formData.college_address || ''}
                  onChange={handleInputChange}
                  className={getInputClass('college_address', formData.college_address)}
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Duties</label>
                <textarea
                  name="job_duties"
                  value={formData.job_duties || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className={getInputClass('job_duties', formData.job_duties)}
                />
              </div>

              {/* Primary Emergency Contact */}
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">Primary Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      name="primary_emergency_contact_full_name"
                      type="text"
                      value={formData.primary_emergency_contact_full_name || ''}
                      onChange={handleInputChange}
                      className={getInputClass('primary_emergency_contact_full_name', formData.primary_emergency_contact_full_name)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    <input
                      name="primary_emergency_contact_relationship"
                      type="text"
                      value={formData.primary_emergency_contact_relationship || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. Parent, Spouse, Sibling"
                      className={getInputClass('primary_emergency_contact_relationship', formData.primary_emergency_contact_relationship)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Home Phone (with extension)</label>
                    <input
                      name="primary_emergency_contact_home_phone"
                      type="text"
                      value={formData.primary_emergency_contact_home_phone || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. +1 (123) 456-7890 or +91 98765 43210"
                      className={getInputClass('primary_emergency_contact_home_phone', formData.primary_emergency_contact_home_phone)}
                    />
                  </div>
                </div>
              </div>

              {/* Secondary Emergency Contact */}
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">Secondary Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      name="secondary_emergency_contact_full_name"
                      type="text"
                      value={formData.secondary_emergency_contact_full_name || ''}
                      onChange={handleInputChange}
                      className={getInputClass('secondary_emergency_contact_full_name', formData.secondary_emergency_contact_full_name)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    <input
                      name="secondary_emergency_contact_relationship"
                      type="text"
                      value={formData.secondary_emergency_contact_relationship || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. Parent, Spouse, Sibling"
                      className={getInputClass('secondary_emergency_contact_relationship', formData.secondary_emergency_contact_relationship)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Home Phone (with extension)</label>
                    <input
                      name="secondary_emergency_contact_home_phone"
                      type="text"
                      value={formData.secondary_emergency_contact_home_phone || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. +1 (123) 456-7890 or +91 98765 43210"
                      className={getInputClass('secondary_emergency_contact_home_phone', formData.secondary_emergency_contact_home_phone)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Removed Performance Review and Reports per schema update */}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 cursor-pointer"
                >
                  Update Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeReviewView;
