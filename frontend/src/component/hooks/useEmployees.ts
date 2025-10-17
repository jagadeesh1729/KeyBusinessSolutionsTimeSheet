import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/apiClient';
import type Employee from '../types/employee';
import type Project from '../types/project';
import type ProductManager from '../types/ProductManager';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [availableManagers, setAvailableManagers] = useState<ProductManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee & { selected_project_id?: number }>>({});
  const [pmProjectsOptions, setPmProjectsOptions] = useState<Project[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [employeesRes, projectsRes, managersRes] = await Promise.all([
        apiClient.get('/auth/users'),
        apiClient.get('/projects/'),
        apiClient.get('/users/pms'),
      ]);

      // Filter for employees only and map the complete data
      const employeeUsers = (employeesRes.data.data || []).filter((user: any) => user.role === 'employee');
      setEmployees(employeeUsers.map((user: any) => ({
        id: user.id,
        first_name: user.first_name ?? (user.name ? user.name.split(' ')[0] : ''),
        last_name: user.last_name ?? (user.name ? user.name.split(' ').slice(1).join(' ') : ''),
        email: user.email,
        phone: user.phone,
        job_title: user.job_title || 'N/A',
        college_name: user.college_name,
        college_address: user.college_address,
        degree: user.degree,
        college_Dso_name: user.college_Dso_name,
        college_Dso_email: user.college_Dso_email,
        college_Dso_phone: user.college_Dso_phone,
        job_start_date: user.employement_start_date,
        start_date: user.start_date,
        end_date: user.end_date,
        visa_status: user.visa_status,
        date_of_birth: user.date_of_birth,
        compensation: user.compensation,
        job_duties: user.job_duties,
        no_of_hours: user.no_of_hours,
        project: user.project || [],
        project_manager: user.project_manager,
        project_manager_id: user.project_manager?.id || null,
        role: user.role,
      })));

      setAvailableProjects(projectsRes.data.projects || []);
      
      const pms = (managersRes.data.users || []).map((user: any) => ({
        id: user.id,
        first_name: user.first_name ?? (user.name ? user.name.split(' ')[0] : ''),
        last_name: user.last_name ?? (user.name ? user.name.split(' ').slice(1).join(' ') : ''),
        email: user.email,
        phone: user.phone,
        project: [],
        employees: [],
      }));
      setAvailableManagers(pms);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = async (employee: Employee | null) => {
    setEditingEmployee(employee);
    if (employee) {
      try {
        // Fetch user's assigned projects
        const userProjectsRes = await apiClient.get(`/users/${employee.id}/projects`);
        const userProjects = userProjectsRes.data.projects || [];
        // Fetch PM's projects to limit selection
        const pmId = employee.project_manager?.id || employee.project_manager_id;
        let pmProjects: Project[] = [];
        if (pmId) {
          const pmProjectsRes = await apiClient.get(`/users/${pmId}/projects`);
          pmProjects = pmProjectsRes.data.projects || [];
        }
        setPmProjectsOptions(pmProjects);
        
        setFormData({ 
          ...employee, 
          project: userProjects,
          project_ids: userProjects.map((p: any) => p.id) || [],
          selected_project_id: (userProjects[0]?.id) || undefined,
        });
      } catch (error) {
        console.error('Failed to fetch user projects:', error);
        setFormData({ 
          ...employee, 
          project: employee.project || [],
          project_ids: employee.project?.map(p => p.id) || [],
          selected_project_id: (employee.project && employee.project[0]?.id) || undefined,
        });
        setPmProjectsOptions([]);
      }
    } else {
      setFormData({
        first_name: '', last_name: '', email: '', phone: '', job_title: '',
        project: [], project_manager: null, project_ids: []
      });
      setPmProjectsOptions([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleProjectSingleSelect = (event: { target: { value: any } }) => {
    const value = Number(event.target.value);
    setFormData(prev => ({ ...prev, selected_project_id: isNaN(value) ? undefined : value }));
  };

  const handleSave = async () => {
    try {
      let userId = editingEmployee?.id;
      
      if (editingEmployee) {
        // Update employee details - format dates and send first/last names
        const updatePayload = { 
          ...formData,
          employment_start_date: formData.job_start_date?.split('T')[0],
          start_date: formData.start_date?.split('T')[0],
          end_date: formData.end_date?.split('T')[0],
          date_of_birth: formData.date_of_birth?.split('T')[0],
          phone: String(formData.phone || '').replace(/\D/g, ''),
        };
        await apiClient.put(`/auth/employee/${editingEmployee.id}`, updatePayload);
      } else {
        // Create new employee
        const payload = { 
          ...formData, 
          password: 'DefaultPassword123',
          employment_start_date: formData.job_start_date?.split('T')[0],
          start_date: formData.start_date?.split('T')[0],
          end_date: formData.end_date?.split('T')[0],
          date_of_birth: formData.date_of_birth?.split('T')[0],
          phone: String(formData.phone || '').replace(/\D/g, ''),
        };
        const response = await apiClient.post('/users/register/employee', payload);
        userId = response.data.userId;
      }
      
      // Assign exactly one project from the PM's project list if selected
      if (userId && formData.selected_project_id) {
        await apiClient.post('/users/assign-projects', {
          user_id: userId,
          project_ids: [formData.selected_project_id]
        });
      }
      
      handleCloseModal();
      fetchData(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save employee.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this employee?')) {
      try {
        await apiClient.delete(`/users/${id}`);
        fetchData(); // Refresh list
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to deactivate employee.');
      }
    }
  };

  return {
    employees,
    availableProjects,
    availableManagers,
    pmProjectsOptions,
    loading,
    error,
    isModalOpen,
    editingEmployee,
    formData,
    handleOpenModal,
    handleCloseModal,
    handleFormChange,
    handleProjectSingleSelect,
    handleSave,
    handleDelete,
  };
};
