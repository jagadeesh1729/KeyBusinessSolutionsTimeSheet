import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/apiClient';
import type { SelectChangeEvent } from '@mui/material';
import type ProductManager from '../types/ProductManager';
import type Project from '../types/project';

type ManagerFormData = Omit<ProductManager, 'id' | 'employees' | 'project'> & {
  project_ids?: number[];
};

export const useProjectManagers = () => {
  const [managers, setManagers] = useState<ProductManager[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<ProductManager | null>(null);
  const [formData, setFormData] = useState<Partial<ManagerFormData>>({});


  const fetchManagersAndProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [pmsResponse, projectsResponse] = await Promise.all([
        apiClient.get('/users/pms'),
        apiClient.get('/projects/'), // This gets all available projects
      ]);
      
      const allProjects = projectsResponse.data?.projects || [];
      setAvailableProjects(allProjects);
      
      if (pmsResponse.data && Array.isArray(pmsResponse.data.users) && Array.isArray(allProjects)) {
        const managersWithProjects = await Promise.all(pmsResponse.data.users.map(async (user: any) => {
          const userProjectsResponse = await apiClient.get(`/users/${user.id}/projects`);
          const assignedProjects = userProjectsResponse.data?.projects || [];
          return {
            id: user.id,
            first_name: user.first_name ?? (user.name ? user.name.split(' ')[0] : ''),
            last_name: user.last_name ?? (user.name ? user.name.split(' ').slice(1).join(' ') : ''),
            email: user.email,
            phone: user.phone,
            project: assignedProjects,
            employees: [],
          };
        }));
        setManagers(managersWithProjects);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagersAndProjects();
  }, [fetchManagersAndProjects]);

  const handleOpenModal = (manager: ProductManager | null) => {
    setEditingManager(manager);
    if (manager) {
      setFormData({
        ...manager,
        project_ids: manager.project?.map(p => p.id) || [],
      });
    } else {
      setFormData({ first_name: '', last_name: '', email: '', phone: '', project_ids: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingManager(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Duplicate existing PM data into create flow
  const handleDuplicate = (manager: ProductManager) => {
    setEditingManager(null);
    setFormData({
      first_name: manager.first_name,
      last_name: manager.last_name,
      email: manager.email,
      phone: manager.phone,
      project_ids: manager.project?.map(p => p.id) || [],
    });
    setIsModalOpen(true);
  };

  const handleProjectSelection = (event: SelectChangeEvent<number[]>) => {
    const { value } = event.target;
    setFormData(prev => ({ ...prev, project_ids: typeof value === 'string' ? value.split(',').map(Number) : value }));
  };

  const handleSave = async () => {
    try {
      const userPayload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: String(formData.phone || '').replace(/\D/g, ''),
        location: 'Default Location', // Add fields as necessary
        no_of_hours: 40, // Add fields as necessary
      };
      
      let userId = editingManager?.id;
      
      if (editingManager) {
        // TODO: Implement update logic
        // await apiClient.put(`/users/pm/${editingManager.id}`, userPayload);
      } else {
        const response = await apiClient.post('/users/create/pm', userPayload);
        userId = response.data.userId;
      }
      
      if (userId && formData.project_ids) {
        await apiClient.post('/users/assign-projects', { user_id: userId, project_ids: formData.project_ids });
      }

      handleCloseModal();
      fetchManagersAndProjects(); // Refresh list after saving
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save project manager.');
    }
  };

  return {
    managers,
    availableProjects,
    loading,
    error,
    isModalOpen,
    editingManager,
    formData,
    handleOpenModal,
    handleDuplicate,
    handleCloseModal,
    handleFormChange,
    handleProjectSelection,
    handleSave,
  };
};
