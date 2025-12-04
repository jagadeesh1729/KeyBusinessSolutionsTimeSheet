import React from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Box,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import { Edit, Inbox, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDraftTimesheets } from '../hooks/useTimesheet';
import type { Timesheet } from '../types/Holiday';

const PreviousDrafts: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: drafts, loading, error } = useDraftTimesheets();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleEditDraft = (timesheet: Timesheet) => {
    navigate(`/employee/timesheet/edit/${timesheet.id}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} thickness={4} />
        <Typography sx={{ ml: 2, color: 'text.secondary', fontWeight: 500 }}>
          Loading drafts...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header Section */}
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
            Pending Timesheets
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and complete your saved timesheets.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Card 
          elevation={0} 
          sx={{ 
            borderRadius: 3, 
            border: '1px solid', 
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {drafts && drafts.length > 0 ? (
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Project</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Period</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}>Total Hours</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, py: 2 }}>Status</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, py: 2 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {drafts.map((draft) => (
                      <TableRow 
                        key={draft.id} 
                        hover
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                          {draft.project?.name || 'Unknown Project'}
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>
                          {formatDate(draft.periodStart)} — {formatDate(draft.periodEnd)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {draft.totalHours || '0.00'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label="DRAFT" 
                            color="warning" 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontWeight: 600, borderRadius: 1.5 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => handleEditDraft(draft)}
                            sx={{ 
                              textTransform: 'none', 
                              borderRadius: 2,
                              boxShadow: 'none',
                              '&:hover': { boxShadow: 'none' }
                            }}
                          >
                            Complete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box 
                sx={{ 
                  p: 8, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: 2,
                  bgcolor: 'background.paper'
                }}
              >
                <Box 
                  sx={{ 
                    p: 3, 
                    borderRadius: '50%', 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    color: 'primary.main'
                  }}
                >
                  <Inbox sx={{ fontSize: 48 }} />
                </Box>
                <Typography variant="h6" color="text.primary" fontWeight={600}>
                  No drafts found
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" maxWidth={400}>
                  You don't have any unsubmitted timesheets. Start a new one from the dashboard.
                </Typography>
                <Button 
                  variant="outlined" 
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/employee/timesheet')}
                  sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
                >
                  Create New Timesheet
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export default PreviousDrafts;