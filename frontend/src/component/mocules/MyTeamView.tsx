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
  Avatar,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { useState, useEffect } from 'react';
import { timesheetAPI } from '../../api/timesheetapi';
import { formatPhoneDisplay } from '../../utils/phoneFormat';

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CircularProgress size={40} sx={{ color: '#0066A4' }} />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading team members...
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

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  // Generate consistent color based on name
  const getAvatarColor = (name: string) => {
    const colors = ['#0066A4', '#00897B', '#5E35B1', '#E65100', '#C62828', '#2E7D32'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-50 rounded-lg">
            <GroupsIcon sx={{ color: '#0066A4', fontSize: 28 }} />
          </div>
          <div>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
              My Team
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {team.length} team member{team.length !== 1 ? 's' : ''} assigned to your projects
            </Typography>
          </div>
        </div>
      </div>

      {/* Team Table */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 3, 
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}
      >
        <TableContainer>
          <Table aria-label="my team table">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>
                  Team Member
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>
                  Contact Info
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>
                  Associated Projects
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {team.map((member) => (
                <TableRow 
                  key={member.id}
                  sx={{ 
                    '&:hover': { bgcolor: '#f8fafc' },
                    '&:last-child td': { borderBottom: 0 }
                  }}
                >
                  <TableCell sx={{ py: 2.5 }}>
                    <div className="flex items-center gap-3">
                      <Avatar 
                        sx={{ 
                          bgcolor: getAvatarColor(member.name),
                          width: 40,
                          height: 40,
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}
                      >
                        {getInitials(member.name)}
                      </Avatar>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: '#1e293b' }}>
                        {member.name}
                      </Typography>
                    </div>
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gray-600">
                        <EmailOutlinedIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                          {member.email}
                        </Typography>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <PhoneOutlinedIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                          {formatPhoneDisplay(member.phone) || 'N/A'}
                        </Typography>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <div className="flex flex-wrap gap-2">
                      {member.projects && member.projects.length > 0 ? (
                        member.projects.map((project) => (
                          <Chip
                            key={project.id}
                            label={project.name}
                            size="small"
                            sx={{ 
                              bgcolor: '#e0f2fe',
                              color: '#0369a1',
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              '& .MuiChip-label': { px: 1.5 }
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                          No projects assigned
                        </Typography>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && team.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ py: 8, textAlign: 'center' }}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gray-100 rounded-full">
                        <GroupsIcon sx={{ fontSize: 40, color: '#94a3b8' }} />
                      </div>
                      <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
                        No team members assigned
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        Team members will appear here once they are assigned to your projects
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

export default MyTeamView;