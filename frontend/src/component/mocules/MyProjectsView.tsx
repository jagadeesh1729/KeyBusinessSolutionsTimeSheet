import {
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
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CircularProgress size={40} sx={{ color: '#0066A4' }} />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading projects...
          </Typography>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </div>
    );
  }

  // Get status chip styles
  const getStatusStyles = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === 'active') {
      return { bgcolor: '#dcfce7', color: '#166534' };
    } else if (normalized === 'inactive' || normalized === 'closed') {
      return { bgcolor: '#fee2e2', color: '#991b1b' };
    }
    return { bgcolor: '#f1f5f9', color: '#475569' };
  };

  // Get period type display
  const getPeriodDisplay = (periodType: string) => {
    const normalized = periodType.toLowerCase();
    if (normalized === 'weekly') return 'Weekly';
    if (normalized === 'bi-weekly' || normalized === 'biweekly') return 'Bi-Weekly';
    if (normalized === 'monthly') return 'Monthly';
    return periodType;
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-50 rounded-lg">
            <BusinessOutlinedIcon sx={{ color: '#0066A4', fontSize: 28 }} />
          </div>
          <div>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
              My Projects
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''} under your management
            </Typography>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 3, 
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}
      >
        <TableContainer>
          <Table aria-label="my projects table">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>
                  Project Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>
                  Approval Mode
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>
                  Period Type
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow 
                  key={project.id}
                  sx={{ 
                    '&:hover': { bgcolor: '#f8fafc' },
                    '&:last-child td': { borderBottom: 0 }
                  }}
                >
                  <TableCell sx={{ py: 2.5 }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <BusinessOutlinedIcon sx={{ color: 'white', fontSize: 20 }} />
                      </div>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: '#1e293b' }}>
                        {project.name}
                      </Typography>
                    </div>
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Chip 
                      icon={project.auto_approve ? 
                        <CheckCircleOutlineIcon sx={{ fontSize: 16 }} /> : 
                        <ScheduleIcon sx={{ fontSize: 16 }} />
                      }
                      label={project.auto_approve ? 'Auto Approve' : 'Manual Review'} 
                      size="small"
                      sx={{ 
                        bgcolor: project.auto_approve ? '#dcfce7' : '#fef3c7',
                        color: project.auto_approve ? '#166534' : '#92400e',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        '& .MuiChip-icon': { 
                          color: project.auto_approve ? '#166534' : '#92400e' 
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Chip 
                      label={getPeriodDisplay(project.period_type)} 
                      size="small" 
                      variant="outlined"
                      sx={{ 
                        borderColor: '#cbd5e1',
                        color: '#475569',
                        fontWeight: 500,
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Chip 
                      label={project.status} 
                      size="small"
                      sx={{ 
                        ...getStatusStyles(project.status),
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        textTransform: 'capitalize'
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {!loading && projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ py: 8, textAlign: 'center' }}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gray-100 rounded-full">
                        <BusinessOutlinedIcon sx={{ fontSize: 40, color: '#94a3b8' }} />
                      </div>
                      <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
                        No projects assigned
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        Projects you manage will appear here
                      </Typography>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
};

export default MyProjectsView;