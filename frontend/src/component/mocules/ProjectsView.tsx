
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Chip,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ButtonComp from "../atoms/Button";
import { useProjects } from "../hooks/useProjects";

const ProjectsView = () => {  
  const { 
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
   } = useProjects();

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ButtonComp text="Add Project"variant="contained" onClick={() => handleOpenModal(null)}></ButtonComp>
      

      </Box>
      <TableContainer component={Paper}>
        <Table  aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell component="th" scope="row">
                  {project.name}
                </TableCell>
                <TableCell>
                  <Chip label={project.status} color={project.status === 'Active' ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell>{formatDate(project.start_date)}</TableCell>
                <TableCell>{formatDate(project.end_date)}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenModal(project)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeactivate(project.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal}>
        <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="name" label="Project Name" type="text" fullWidth variant="outlined" value={formData.name || ''} onChange={handleFormChange} />
          <FormControl fullWidth margin="dense">
            <InputLabel>Status</InputLabel>
            <Select name="status" value={formData.status || 'Active'} label="Status" onChange={(e) => handleFormChange(e as any)}>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Period Type</InputLabel>
            <Select name="period_type" value={formData.period_type || 'weekly'} label="Period Type" onChange={(e) => handleFormChange(e as any)}>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="bi-monthly">Bi-Monthly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
          <TextField margin="dense" name="start_date" label="Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.start_date || ''} onChange={handleFormChange} />
          <TextField margin="dense" name="end_date" label="End Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.end_date || ''} onChange={handleFormChange} />
          <FormControlLabel
            control={
              <Checkbox name="auto_approve" checked={formData.auto_approve || false} onChange={handleFormChange} />
            }
            label="Auto Approve Timesheets"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <ButtonComp text="Cancel" onClick={handleCloseModal} />
          <ButtonComp text="Save" onClick={handleSave} variant="contained" />
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ProjectsView