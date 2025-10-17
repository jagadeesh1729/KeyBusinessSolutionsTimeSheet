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
import { PatternFormat } from 'react-number-format';
import type { SelectChangeEvent } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DescriptionIcon from '@mui/icons-material/Description';
import ButtonComp from "../atoms/Button";
import type Employee from "../types/employee";
import OfferLetterEditor from './OfferLetterEditor';
import { useAuth } from '../../context/AuthContext';
import { useEmployees } from "../hooks/useEmployees";
import React from "react";

const EmployeeView = () => {
  const {
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
  } = useEmployees();
  const { user } = useAuth();
  const [offerOpen, setOfferOpen] = React.useState(false);
  const [offerEmployee, setOfferEmployee] = React.useState<Employee | null>(null);

  const openOffer = (emp: Employee) => { setOfferEmployee(emp); setOfferOpen(true); };
  const closeOffer = () => { setOfferOpen(false); setOfferEmployee(null); };

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
                  <Tooltip title="Offer Letter"><IconButton onClick={() => openOffer(employee)}><DescriptionIcon /></IconButton></Tooltip>
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
          <TextField margin="dense" name="job_title" label="Job Title" fullWidth value={formData.job_title || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="college_name" label="College Name" fullWidth value={formData.college_name || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="college_address" label="College Address" fullWidth value={formData.college_address || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="degree" label="Degree" fullWidth value={formData.degree || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="college_Dso_name" label="College DSO Name" fullWidth value={(formData as any).college_Dso_name || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="college_Dso_email" label="College DSO Email" type="email" fullWidth value={(formData as any).college_Dso_email || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="college_Dso_phone" label="College DSO Phone" fullWidth value={(formData as any).college_Dso_phone || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="job_start_date" label="Job Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.job_start_date?.split('T')[0] || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="end_date" label="End Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.end_date?.split('T')[0] || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="compensation" label="Compensation" fullWidth value={formData.compensation || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="visa_status" label="Visa Status" fullWidth value={formData.visa_status || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="job_duties" label="Job Duties" fullWidth multiline rows={3} value={formData.job_duties || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="date_of_birth" label="Date of Birth" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.date_of_birth?.split('T')[0] || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="no_of_hours" label="Number of Hours" type="number" fullWidth value={formData.no_of_hours || ''} onChange={handleFormChange} />

          {/* Read-only PM info */}
          <Box sx={{ mt: 2 }}>
            <InputLabel shrink>Project Manager</InputLabel>
            <Box sx={{ py: 1, color: 'text.primary' }}>
              {formData.project_manager ? `${formData.project_manager.first_name} ${formData.project_manager.last_name}` : 'None'}
            </Box>
          </Box>
          {/* Admin can pick exactly one project from the associated PM's projects */}
          <FormControl fullWidth margin="dense" sx={{ mt: 2 }} disabled={!formData.project_manager && !formData.project_manager_id}>
            <InputLabel id="employee-project-select-label">Select Project (from PM)</InputLabel>
            <Select
              labelId="employee-project-select-label"
              value={(formData as any).selected_project_id || ''}
              label="Select Project (from PM)"
              onChange={(e: any) => handleProjectSingleSelect(e)}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {pmProjectsOptions.map((project) => (
                <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <ButtonComp text="Cancel" onClick={handleCloseModal} />
          <ButtonComp text="Save" onClick={handleSave} variant="contained" />
        </DialogActions>
      </Dialog>

      {offerEmployee && (
        <OfferLetterEditor
          open={offerOpen}
          employee={offerEmployee}
          adminName={user?.name || 'Admin'}
          onClose={closeOffer}
        />
      )}
    </>
  );
};

export default EmployeeView;
