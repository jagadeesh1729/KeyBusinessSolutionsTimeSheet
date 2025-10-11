import { useState, useEffect, useCallback } from 'react';
import apiClient from  '../../api/apiClient';
import type Project from '../types/project';


// For the form state
type ProjectFormData = Omit<Project, 'id'>;

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for the modal and form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Partial<ProjectFormData>>({
    name: '',
    status: 'Active',
    auto_approve: true,
    period_type: 'weekly',
    start_date: '',
    end_date: '',
  });

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/projects/');
      // Ensure the response structure is correctly handled
      if (response.data && Array.isArray(response.data.projects)) {
        setProjects(response.data.projects);
      }
      setError(null); // Clear previous errors on success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenModal = (project: Project | null) => {
    setEditingProject(project);
    if (project) {
      setFormData({
        ...project,
        start_date: project.start_date?.split('T')[0] || '', // Format for date input
        end_date: project.end_date?.split('T')[0] || '',
      });
    } else {
      // Reset to default for creating a new project
      setFormData({
        name: '',
        status: 'Active',
        auto_approve: true,
        period_type: 'weekly',
        start_date: '',
        end_date: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const target = e.target as HTMLInputElement;
    const { name, type } = target;
    const value = type === 'checkbox' ? target.checked : target.value;
    if (name) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      if (editingProject) {
        await apiClient.put(`/projects/${editingProject.id}`, formData);
      } else {
        await apiClient.post('/projects', formData);
      }
      handleCloseModal();
      fetchProjects(); // Refresh the list
    } catch (err) {
      setError('Failed to save project. Please try again.');
      // You could set an error state for the modal here
    }
  };

  const handleDeactivate = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this project?')) {
      try {
        await apiClient.delete(`/projects/${id}`);
        fetchProjects(); // Refresh the list
      } catch (err) {
        setError('Failed to deactivate project. Please try again.');
      }
    }
  };

  return {
    projects,
    loading,
    error,
    isModalOpen,
    editingProject,
    formData,
    handleOpenModal,
    handleCloseModal,
    handleFormChange,
    handleSave,
    handleDeactivate,
  };
};