import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Tooltip,
  CircularProgress,
  Alert,
  InputLabel,
  Select,
  OutlinedInput,
  Chip,
  MenuItem,
  FormControl,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { PatternFormat } from 'react-number-format';
import ButtonComp from "../atoms/Button";
import { useProjectManagers } from "../hooks/useProjectManagers";
import { useState, useEffect } from 'react';
import type Employee from "../types/employee";
import apiClient from '../../api/apiClient';

const ProjectManagerView = () => {
  const {
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
  } = useProjectManagers();
  
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [pmEmployees, setPMEmployees] = useState<Record<number, Employee[]>>({});
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);

  useEffect(() => {
    fetchEmployees();
    if (managers.length > 0) {
      managers.forEach(manager => fetchPMEmployees(manager.id));
    }
  }, [managers]);

  const fetchEmployees = async () => {
    try {
      // Corrected API endpoint
      const response = await apiClient.get('/users/employees-without-pm');
      setAvailableEmployees(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchPMEmployees = async (pmId: number) => {
    try {
      // Corrected API endpoint
      const response = await apiClient.get(`/users/pm-employees/${pmId}`);
      const employees = response.data.data || [];
      setPMEmployees(prev => ({ ...prev, [pmId]: employees }));
      return employees; // Return the fetched data directly
    } catch (error) {
      console.error('Failed to fetch PM employees:', error);
      return [];
    }
  };

  const handleEmployeeSelection = (event: any) => {
    const value = event.target.value;
    setSelectedEmployeeIds(value);
  };

  const handleSaveWithEmployees = async () => {
    await handleSave();
    if (selectedEmployeeIds.length >= 0 && editingManager) {
      try {
        // Corrected API endpoint
        await apiClient.post('/users/assign-employees-to-pm', {
          pm_id: editingManager.id,
          employee_ids: selectedEmployeeIds
        });
        await fetchEmployees();
        await fetchPMEmployees(editingManager.id);
      } catch (error) {
        console.error('Failed to assign employees:', error);
      }
    }
  };

  const handleOpenModalWithEmployees = async (manager: any) => {
    handleOpenModal(manager);
    if (manager) {
      const currentEmployees = await fetchPMEmployees(manager.id);
      setSelectedEmployeeIds(currentEmployees.map(emp => emp.id));
    } else {
      setSelectedEmployeeIds([]);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ButtonComp text="Add Project Manager" variant="contained" onClick={() => handleOpenModalWithEmployees(null)} />
      </Box>
      <TableContainer component={Paper}>
        <Table aria-label="project manager table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Projects</TableCell>
              <TableCell>Employees</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {managers.map((manager) => (
              <TableRow key={manager.id}>
                <TableCell>{`${manager.first_name} ${manager.last_name}`}</TableCell>
                <TableCell>{manager.email}</TableCell>
                <TableCell>{manager.phone}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {manager.project?.map(p => <Chip key={p.id} label={p.name} size="small" />)}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(pmEmployees[manager.id] || []).map(emp => <Chip key={emp.id} label={`${emp.first_name ?? ((emp as any).name?.split(' ')[0]||'')} ${emp.last_name ?? ((emp as any).name?.split(' ').slice(1).join(' ')||'')}`} size="small" color="secondary" />)}
                  </Box>
                </TableCell>
              <TableCell align="right">
                <Tooltip title="Edit"><IconButton onClick={() => handleOpenModalWithEmployees(manager)}><EditIcon /></IconButton></Tooltip>
                <Tooltip title="Duplicate as new"><IconButton onClick={() => handleDuplicate(manager)}><ContentCopyIcon /></IconButton></Tooltip>
              </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isModalOpen} onClose={handleCloseModal}>
        <DialogTitle>{editingManager ? 'Edit Project Manager' : 'Add New Project Manager'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="first_name" label="First Name" fullWidth value={formData.first_name || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="last_name" label="Last Name" fullWidth value={formData.last_name || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="email" label="Email" type="email" fullWidth value={formData.email || ''} onChange={handleFormChange} />
          <PatternFormat
            format={"+1(###)-(###)-(####)"}
            allowEmptyFormatting
            value={formData.phone || ''}
            onValueChange={(vals) => {
              handleFormChange({ target: { name: 'phone', value: vals.formattedValue } } as any);
            }}
            customInput={TextField}
            margin="dense"
            name="phone"
            label="Phone"
            fullWidth
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="pm-projects-select-label">Assign Projects</InputLabel>
            <Select
              labelId="pm-projects-select-label"
              multiple
              value={(formData as any).project_ids || []}
              onChange={handleProjectSelection}
              input={<OutlinedInput id="select-multiple-chip-pm" label="Assign Projects" />}
              renderValue={(selected: number[]) => (<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{availableProjects.filter(p=>selected.includes(p.id)).map((p) => (<Chip key={p.id} label={p.name} />))}</Box>)}
            >
              {availableProjects.map((project) => {
                const assignedByOther = managers.some(m => m.id !== (editingManager?.id || 0) && (m.project || []).some(p => p.id === project.id));
                return (
                  <MenuItem key={project.id} value={project.id} disabled={assignedByOther}>
                    {project.name}{assignedByOther ? ' (Assigned to another PM)' : ''}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel id="pm-employees-select-label">Assign Employees</InputLabel>
            <Select
              labelId="pm-employees-select-label"
              multiple
              value={selectedEmployeeIds}
              onChange={handleEmployeeSelection}
              input={<OutlinedInput id="select-multiple-chip-employees" label="Assign Employees" />}
              renderValue={(selected: number[]) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {[...availableEmployees, ...(editingManager ? pmEmployees[editingManager.id] || [] : [])]
                    .filter((emp, index, self) => selected.includes(emp.id) && self.findIndex(e => e.id === emp.id) === index)
                    .map((emp) => (<Chip key={emp.id} label={`${emp.first_name ?? ((emp as any).name?.split(' ')[0]||'')} ${emp.last_name ?? ((emp as any).name?.split(' ').slice(1).join(' ')||'')}`} color="secondary" />))}
                </Box>
              )}
            >
              {availableEmployees.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>{`${employee.first_name ?? ((employee as any).name?.split(' ')[0]||'')} ${employee.last_name ?? ((employee as any).name?.split(' ').slice(1).join(' ')||'')}`} - {employee.email}</MenuItem>
              ))}
              {editingManager && (pmEmployees[editingManager.id] || []).map((employee) => (
                <MenuItem key={`assigned-${employee.id}`} value={employee.id}>{`${employee.first_name ?? ((employee as any).name?.split(' ')[0]||'')} ${employee.last_name ?? ((employee as any).name?.split(' ').slice(1).join(' ')||'')}`} - {employee.email} (Currently Assigned)</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <ButtonComp text="Cancel" onClick={handleCloseModal} />
          <ButtonComp text="Save" onClick={handleSaveWithEmployees} variant="contained" />
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProjectManagerView
