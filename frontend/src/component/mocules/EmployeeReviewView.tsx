import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

interface Employee {
  id: number;
  name: string;
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
  job_title: string;
  date_of_birth: string;
  compensation: string;
  job_duties: string;
  performance_review: string;
  reports: string;
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
      await apiClient.put(`/auth/employee/${selectedEmployee.id}`, formData);
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
    const fields = [];
    if (!employee.employment_start_date) fields.push('Employment Start Date');
    if (!employee.start_date) fields.push('OPT Start Date');
    if (!employee.end_date) fields.push('OPT End Date');
    if (!employee.visa_status) fields.push('Visa Status');
    if (!employee.college_name) fields.push('College Name');
    if (!employee.college_address) fields.push('College Address');
    if (!employee.degree) fields.push('Degree');
    if (!employee.job_title) fields.push('Job Title');
    if (!employee.date_of_birth) fields.push('Date of Birth');
    if (!employee.compensation) fields.push('Compensation');
    if (!employee.job_duties) fields.push('Job Duties');
    if (!employee.performance_review) fields.push('Performance Review');
    if (!employee.reports) fields.push('Reports');
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
        <h2 className="text-2xl font-bold text-gray-900">Employee Review</h2>
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
                  <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Review Employee: {selectedEmployee?.name}</h3>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    name="name"
                    type="text"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    name="location"
                    type="text"
                    value={formData.location || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours per Week</label>
                  <input
                    name="no_of_hours"
                    type="number"
                    value={formData.no_of_hours || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Start Date</label>
                  <input
                    name="employment_start_date"
                    type="date"
                    value={formData.employment_start_date || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OPT Start Date</label>
                  <input
                    name="start_date"
                    type="date"
                    value={formData.start_date || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OPT End Date</label>
                  <input
                    name="end_date"
                    type="date"
                    value={formData.end_date || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visa Status</label>
                  <input
                    name="visa_status"
                    type="text"
                    value={formData.visa_status || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    name="job_title"
                    type="text"
                    value={formData.job_title || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                  <input
                    name="college_name"
                    type="text"
                    value={formData.college_name || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                  <input
                    name="degree"
                    type="text"
                    value={formData.degree || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Duties</label>
                <textarea
                  name="job_duties"
                  value={formData.job_duties || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Performance Review</label>
                <textarea
                  name="performance_review"
                  value={formData.performance_review || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reports</label>
                <textarea
                  name="reports"
                  value={formData.reports || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
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