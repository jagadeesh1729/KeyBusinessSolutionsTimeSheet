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

interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone?: string; // Assuming phone and location might be optional
  projects?: {
    id: number;
    name: string;
  }[];
}

const MyTeamView = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await timesheetAPI.getPMEmployees();
        if (response.data.success) {
          setTeam(response.data.employees || []);
        } else {
          setError(response.data.message || 'Failed to fetch team members.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
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
        <Typography variant="h5">My Team</Typography>
      </Box>
      <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 'none' }}>
        <Table aria-label="my team table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Associated Projects</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {team.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.phone || 'N/A'}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  {member.projects?.map((project) => (
                    <Chip
                      key={project.id}
                      label={project.name}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </TableCell>
              </TableRow>
            ))}
            {!loading && team.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  You do not have any team members assigned.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MyTeamView;