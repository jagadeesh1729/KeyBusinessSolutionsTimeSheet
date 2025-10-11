import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Chip,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  CircularProgress,
  Box,
} from '@mui/material';
import { Edit, Inbox } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDraftTimesheets } from '../hooks/useTimesheet';
import type { Timesheet } from '../types/Holiday';

const PreviousDrafts: React.FC = () => {
  const navigate = useNavigate();
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
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading previous drafts...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" className="py-8">
      <Typography variant="h4" className="font-bold text-gray-900 mb-4">
        Unsubmitted Drafts
      </Typography>

      <Alert severity="info" className="mb-6">
        This page lists timesheets from previous periods that were saved as a draft but never submitted. Please complete and submit them.
      </Alert>

      {error && <Alert severity="error" className="mb-4">{error}</Alert>}

      <Paper elevation={3} sx={{ p: 2 }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="draft timesheets table">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                <TableCell>Project</TableCell>
                <TableCell>Period</TableCell>
                <TableCell align="right">Total Hours</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drafts && drafts.length > 0 ? (
                drafts.map((draft) => (
                  <TableRow key={draft.id} hover>
                    <TableCell component="th" scope="row">
                      {draft.project?.name || 'Unknown Project'}
                    </TableCell>
                    <TableCell>{formatDate(draft.periodStart)} - {formatDate(draft.periodEnd)}</TableCell>
                    <TableCell align="right">{draft.totalHours || '0.00'}</TableCell>
                    <TableCell align="center">
                      <Chip label="DRAFT" color="warning" size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit and Submit Draft">
                        <Button
                          variant="contained"
                          startIcon={<Edit />}
                          onClick={() => handleEditDraft(draft)}
                          size="small"
                        >
                          Complete
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Inbox sx={{ fontSize: 48, color: 'grey.400' }} />
                      <Typography variant="h6" color="textSecondary">No unsubmitted drafts found.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default PreviousDrafts;