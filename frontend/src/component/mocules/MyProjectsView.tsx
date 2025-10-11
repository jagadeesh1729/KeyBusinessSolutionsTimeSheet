import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { timesheetAPI } from '../../api/timesheetapi';

interface Project {
  id: number;
  name: string;
  auto_approve: boolean;
  period_type: string;
  status: string;
}

const MyProjectsView = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await timesheetAPI.getPMProjects();
        if (response.data.success) {
          setProjects(response.data.projects || []);
        } else {
          setError(response.data.message || 'Failed to fetch projects.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5">My Projects</Typography>
      </Box>
      <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 'none' }}>
        <Table aria-label="my projects table">
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Auto Approve</TableCell>
              <TableCell>Period Type</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.name}</TableCell>
                <TableCell>
                  <Chip label={project.auto_approve ? 'Enabled' : 'Manual'} color={project.auto_approve ? 'success' : 'warning'} size="small" />
                </TableCell>
                <TableCell><Chip label={project.period_type} size="small" variant="outlined" /></TableCell>
                <TableCell><Chip label={project.status} color="primary" size="small" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MyProjectsView;