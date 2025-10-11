import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Tooltip,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  OutlinedInput,
  Box,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ButtonComp from "../atoms/Button";
import type Employee from "../types/employee";
import { useEmployees } from "../hooks/useEmployees";

const EmployeeView = () => {
  const {
    employees,
    availableProjects,
    availableManagers,
    loading,
    error,
    isModalOpen,
    editingEmployee,
    formData,
    handleOpenModal,
    handleCloseModal,
    handleFormChange,
    handleSave,
  } = useEmployees();

  const handleProjectSelectChange = (event: SelectChangeEvent<number[]>) => {
    const selectedProjectIds = event.target.value as number[];
    handleFormChange({
      target: {
        name: 'project_ids',
        value: selectedProjectIds,
        type: 'select'
      }
    } as any);
  };

  const handleManagerSelectChange = (event: SelectChangeEvent<number>) => {
    const selectedManagerId = event.target.value as number;
    const selectedManager = availableManagers.find(m => m.id === selectedManagerId);
    handleFormChange({
      target: {
        name: 'project_manager_id',
        value: selectedManagerId,
        type: 'select'
      }
    } as any);
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
        <ButtonComp text="Add Employee" variant="contained" onClick={() => handleOpenModal(null)} />
      </Box>
      <TableContainer component={Paper}>
        <Table aria-label="employee table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Job Title</TableCell>
              <TableCell>Project Manager</TableCell>
              <TableCell>Projects</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{`${employee.first_name} ${employee.last_name}`}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.job_title}</TableCell>
                <TableCell>
                  {employee.project_manager ? `${employee.project_manager.first_name} ${employee.project_manager.last_name}` : 'N/A'}
                </TableCell>
                <TableCell>
 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
 {employee.project.map((p) => (<Chip key={p.id} label={p.name} size="small" />))}
 </Box>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton onClick={() => handleOpenModal(employee)}><EditIcon /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="md">
        <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="first_name" label="First Name" fullWidth value={formData.first_name || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="last_name" label="Last Name" fullWidth value={formData.last_name || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="email" label="Email" type="email" fullWidth value={formData.email || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="phone" label="Phone" fullWidth value={formData.phone || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="job_title" label="Job Title" fullWidth value={formData.job_title || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="college_name" label="College Name" fullWidth value={formData.college_name || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="college_address" label="College Address" fullWidth value={formData.college_address || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="degree" label="Degree" fullWidth value={formData.degree || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="job_start_date" label="Job Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.job_start_date?.split('T')[0] || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="end_date" label="End Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.end_date?.split('T')[0] || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="compensation" label="Compensation" fullWidth value={formData.compensation || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="visa_status" label="Visa Status" fullWidth value={formData.visa_status || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="job_duties" label="Job Duties" fullWidth multiline rows={3} value={formData.job_duties || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="date_of_birth" label="Date of Birth" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.date_of_birth?.split('T')[0] || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="no_of_hours" label="Number of Hours" type="number" fullWidth value={formData.no_of_hours || ''} onChange={handleFormChange} />

          <FormControl fullWidth margin="dense">
            <InputLabel id="project-manager-select-label">Project Manager</InputLabel>
            <Select
              labelId="project-manager-select-label"
              value={formData.project_manager?.id || formData.project_manager_id || ''}
              label="Project Manager"
              onChange={handleManagerSelectChange}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {availableManagers.map(manager => (
                <MenuItem key={manager.id} value={manager.id}>{`${manager.first_name} ${manager.last_name}`}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel id="projects-select-label">Assign Projects</InputLabel>
            <Select
              labelId="projects-select-label"
              multiple
              value={formData.project_ids || formData.project?.map(p => p.id) || []}
              onChange={handleProjectSelectChange}
              input={<OutlinedInput id="select-multiple-chip" label="Assign Projects" />}
              renderValue={(selected) => (<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{availableProjects.filter(p=>selected.includes(p.id)).map((p) => (<Chip key={p.id} label={p.name} />))}</Box>)}
            >
              {availableProjects.map((project) => (<MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <ButtonComp text="Cancel" onClick={handleCloseModal} />
          <ButtonComp text="Save" onClick={handleSave} variant="contained" />
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EmployeeView;