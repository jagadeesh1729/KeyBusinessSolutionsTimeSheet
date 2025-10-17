// src/components/employee/TimesheetHistory.tsx (Enhanced Version)
import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  Edit,
  Visibility,
} from '@mui/icons-material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useTimesheetHistory,useTimesheetMutations } from './../hooks/useTimesheet';
import type { Timesheet } from '../types/Holiday';
import { useNavigate } from 'react-router-dom';
import TimesheetPDF from './TimesheetPDF';

// PDF functionality temporarily disabled due to hook conflicts

const TimesheetHistory: React.FC = () => {
  const navigate = useNavigate();
  const { data: timesheets, loading, error, refetch } = useTimesheetHistory();

  const { submitTimesheet, loading: mutationLoading } = useTimesheetMutations();
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-green-500" />;
      case 'rejected':
        return <Cancel className="text-red-500" />;
      case 'pending':
        return <Schedule className="text-blue-500" />;
      default:
        return <Edit className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewTimesheet = (timesheet: Timesheet) => {
    setSelectedTimesheet(timesheet);
    setViewDialogOpen(true);
  };

  const handleViewPdf = (timesheet: Timesheet) => {
    // Create HTML preview in new window
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Timesheet - ${timesheet.project?.name || 'Unknown Project'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { border-bottom: 2px solid #1E88E5; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .company-section { display: flex; align-items: center; gap: 15px; }
          .company { font-size: 18px; font-weight: bold; color: #333; }
          .title { font-size: 24px; font-weight: bold; color: #1E88E5; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .info-item { margin-bottom: 10px; }
          .label { font-size: 12px; color: #666; }
          .value { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .summary { text-align: right; font-size: 16px; font-weight: bold; color: #1E88E5; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-section">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPoAAABJCAYAAAAUsjvmAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4xLWMwMDIgNzkuYjdjNjRjY2Y5LCAyMDI0LzA3LzE2LTEyOjM5OjA0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjYuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjEtMDEtMjJUMTc6MDc6MTkrMDU6MzAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTExLTEzVDE1OjU5OjA3KzA1OjMwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI0LTExLTEzVDE1OjU5OjA3KzA1OjMwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NmEyMjQ2Ny1lMmViLTRiODctYjIyOS01M2YwMmY0MTljZmUiIHhtcE1NOkRvY3VtZW50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" alt="Company Logo" style="object-fit: contain; -webkit-print-color-adjust: exact; print-color-adjust: exact;" />
          </div>
          <div class="title">Timesheet</div>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="label">Employee</div>
            <div class="value">${timesheet.employeeName || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="label">Project</div>
            <div class="value">${timesheet.project?.name || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="label">Period</div>
            <div class="value">${formatDate(timesheet.periodStart)} - ${formatDate(timesheet.periodEnd)}</div>
          </div>

        </div>
        
        <h3>Daily Entries</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            ${timesheet.dailyEntries?.flatMap(day => 
              day.tasks.map((task, index) => 
                `<tr>
                  <td>${index === 0 ? formatDate(day.date) : ''}</td>
                  <td>${task.name}</td>
                  <td>${task.hours}</td>
                </tr>`
              )
            ).join('') || '<tr><td colspan="3">No entries found</td></tr>'}
          </tbody>
        </table>
        
        <div class="summary">
          Total Hours: ${timesheet.totalHours} hrs
        </div>
        
        <style media="print">
          @page { margin: 0; }
          body { margin: 1.6cm; }
        </style>
        <script>
          setTimeout(() => window.print(), 100);
        </script>
      </body>
      </html>
    `;
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  const handleEditRejected = (timesheet: Timesheet) => {
    // Navigate to entry page with timesheet ID for editing
    navigate(`/employee/timesheet/edit/${timesheet.id}`);
  };

  const handleResubmit = async (timesheet: Timesheet) => {
    try {
      const result = await submitTimesheet(timesheet.id);
      if (result.success) {
        setMessage({ type: 'success', text: 'Timesheet resubmitted successfully!' });
        refetch();
        setViewDialogOpen(false);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to resubmit timesheet' });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" className="py-8">
        <div className="text-center">
          <Typography variant="body1" color="textSecondary">
            Loading timesheet history...
          </Typography>
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className="py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold text-gray-900">
          Timesheet History
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/employee/timesheet')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Back to Current Timesheet
        </Button>
      </div>

      {/* Messages */}
      {message && (
        <Alert 
          severity={message.type} 
          className="mb-4" 
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Timesheets List - Tailwind Grid */}
      <Paper elevation={3} sx={{ p: 2 }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="timesheet history table">
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
              {timesheets && timesheets.length > 0 ? (
                timesheets.map((timesheet) => (
                  <TableRow
                    key={timesheet.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {timesheet.project?.name || 'Unknown Project'}
                    </TableCell>
                    <TableCell>{formatDate(timesheet.periodStart)} - {formatDate(timesheet.periodEnd)}</TableCell>
                    <TableCell align="right">{timesheet.totalHours}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        icon={getStatusIcon(timesheet.status)}
                        label={timesheet.status.toUpperCase()}
                        color={getStatusColor(timesheet.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton onClick={() => handleViewTimesheet(timesheet)} size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {timesheet.status === 'rejected' && (
                        <Tooltip title="Edit Timesheet">
                          <IconButton onClick={() => handleEditRejected(timesheet)} size="small" color="primary">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      )}
                      {timesheet.status === 'approved' && (
                          <Tooltip title="Preview/Print PDF">
                          <IconButton onClick={() => handleViewPdf(timesheet)} size="small" color="secondary"><PictureAsPdfIcon /></IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body1" color="textSecondary" sx={{ p: 4 }}>
                      No timesheets found. Create your first timesheet to see it here.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {timesheets && timesheets.length > 0 ? (
          null
        ) : (
          null
        )}
      </Paper>

      {/* View Timesheet Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="border-b">
          <div className="flex items-center justify-between">
            <span>Timesheet Details</span>
            {selectedTimesheet && (
              <Chip 
                label={selectedTimesheet.status.toUpperCase()}
                color={getStatusColor(selectedTimesheet.status) as any}
                size="small"
              />
            )}
          </div>
        </DialogTitle>
        
        <DialogContent className="mt-4">
          {selectedTimesheet && (
            <div className="space-y-6">
              {/* Project & Period Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Typography variant="subtitle2" className="text-gray-600">Project</Typography>
                  <Typography variant="body1" className="font-semibold">
                    {selectedTimesheet.project?.name || 'Unknown Project'}
                  </Typography>
                </div>
                <div>
                  <Typography variant="subtitle2" className="text-gray-600">Total Hours</Typography>
                  <Typography variant="body1" className="font-semibold">
                    {selectedTimesheet.totalHours} hours
                  </Typography>
                </div>
                <div>
                  <Typography variant="subtitle2" className="text-gray-600">Period</Typography>
                  <Typography variant="body1">
                    {formatDate(selectedTimesheet.periodStart)} - {formatDate(selectedTimesheet.periodEnd)}
                  </Typography>
                </div>
                <div>
                  <Typography variant="subtitle2" className="text-gray-600">Status</Typography>
                  <Typography variant="body1">
                    {selectedTimesheet.status.toUpperCase()}
                  </Typography>
                </div>
              </div>

              {/* Rejection Reason */}
              {selectedTimesheet.status === 'rejected' && selectedTimesheet.rejectionReason && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <Typography variant="subtitle2" className="text-red-800 font-semibold mb-2">
                    Rejection Reason:
                  </Typography>
                  <Typography variant="body2" className="text-red-700">
                    {selectedTimesheet.rejectionReason}
                  </Typography>
                </div>
              )}

              {/* Daily Entries */}
              <div>
                <Typography variant="subtitle2" className="text-gray-600 mb-3">Daily Entries</Typography>
                <div className="space-y-3">
                  {selectedTimesheet.dailyEntries && selectedTimesheet.dailyEntries.length > 0 ? (
                    selectedTimesheet.dailyEntries.map((day, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <Typography variant="subtitle2" className="font-semibold">
                            {formatDate(day.date)}
                          </Typography>
                          <Chip 
                            label={`${day.hours} hrs`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </div>
                        <div className="space-y-1">
                          {day.tasks.map((task, taskIndex) => (
                            <div key={taskIndex} className="flex justify-between text-sm">
                              <span>{task.name}</span>
                              <span className="font-semibold">{task.hours} hrs</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No entries found
                    </Typography>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        
        <DialogActions className="border-t p-4">
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
          {selectedTimesheet?.status === 'rejected' && (
            <>
              <Button
                variant="outlined"
                onClick={() => handleEditRejected(selectedTimesheet)}
                startIcon={<Edit />}
              >
                Edit
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleResubmit(selectedTimesheet)}
                disabled={mutationLoading}
              >
                Resubmit
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>


    </Container>
  );
};

export default TimesheetHistory;