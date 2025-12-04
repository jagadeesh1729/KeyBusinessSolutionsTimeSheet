import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Avatar,
  Tooltip,
  IconButton,
  Divider,
} from '@mui/material';
import { 
  Check, 
  Close, 
  Visibility, 
  AccessTime,
  PersonOutline,
  BusinessOutlined as BusinessOutline,
  CalendarToday,
  Schedule,
  CheckCircleOutline,
  ErrorOutline,
  HourglassEmpty,
  Refresh,
} from '@mui/icons-material';
import { useTimesheetMutations, usePMStats, useManagerTimesheetsByStatus } from '../hooks/useTimesheet';
import { timesheetAPI } from '../../api/timesheetapi';
import type { Timesheet } from '../types/Holiday';

// Enhanced type for better type safety
interface EnhancedTimesheet extends Omit<Timesheet, 'status' | 'totalHours'> {
  employee_name?: string;
  employee_email?: string;
  project_name?: string;
  period_type?: string;
  auto_approve?: boolean;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  totalHours?: number;
  submittedAt?: string;
}

// Status configuration for chips and colors
const STATUS_CONFIG = {
  pending: { 
    color: 'warning' as const, 
    icon: <HourglassEmpty fontSize="small" />, 
    label: 'Pending Review',
    bgColor: 'rgb(255, 243, 224)',
    textColor: 'rgb(194, 65, 12)',
  },
  approved: { 
    color: 'success' as const, 
    icon: <CheckCircleOutline fontSize="small" />, 
    label: 'Approved',
    bgColor: 'rgb(220, 252, 231)',
    textColor: 'rgb(21, 128, 61)',
  },
  rejected: { 
    color: 'error' as const, 
    icon: <ErrorOutline fontSize="small" />, 
    label: 'Rejected',
    bgColor: 'rgb(254, 226, 226)',
    textColor: 'rgb(185, 28, 28)',
  },
  'not-submitted': {
    color: 'default' as const,
    icon: <HourglassEmpty fontSize="small" />, 
    label: 'Not Submitted',
    bgColor: 'rgb(243, 244, 246)',
    textColor: 'rgb(31, 41, 55)',
  },
} as const;

// Priority levels for hours
const getPriorityConfig = (hours: number) => {
  if (hours >= 40) return { color: 'error.main', level: 'high', emoji: '🔴' };
  if (hours >= 30) return { color: 'warning.main', level: 'medium', emoji: '🟡' };
  return { color: 'success.main', level: 'normal', emoji: '🟢' };
};

const ApprovalDashboard: React.FC = () => {
  // State management
  const [selectedTimesheet, setSelectedTimesheet] = useState<EnhancedTimesheet | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notSubmittedDialogOpen, setNotSubmittedDialogOpen] = useState(false);
  const [notSubmittedData, setNotSubmittedData] = useState<any[]>([]);

  // Hooks
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'approved' | 'rejected' | 'not-submitted'>('pending');
  const normalizedStatus: 'pending' | 'approved' | 'rejected' = selectedStatus === 'not-submitted' ? 'pending' : selectedStatus;
  const { data: timesheets, loading, error, refetch } = useManagerTimesheetsByStatus(normalizedStatus);
  const { data: pmStats } = usePMStats();
  const { approveTimesheet, rejectTimesheet, loading: mutationLoading, error: mutationError } = useTimesheetMutations();

  // Memoized calculations for better performance
  const stats = useMemo(() => {
    const enhancedTimesheets = (timesheets as EnhancedTimesheet[]) || [];
    
    return {
      pending: pmStats.pending,
      employees: pmStats.employees,
      projects: pmStats.projects,
      avgHoursPerTimesheet: enhancedTimesheets.length > 0 
        ? Math.round(enhancedTimesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0) / enhancedTimesheets.length)
        : 0,
    };
  }, [timesheets, pmStats]);

  const enhancedTimesheets = useMemo(() => (timesheets as EnhancedTimesheet[]) || [], [timesheets]);

  // Effects
  useEffect(() => {
    if (mutationError) {
      setMessage({ type: 'error', text: mutationError });
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [mutationError]);

  // Fetch not-submitted list when selected
  useEffect(() => {
    const fetchNotSubmitted = async () => {
      try {
        console.log('Fetching not-submitted employees...');
        const response = await timesheetAPI.getEmployeesNotSubmitted();
        console.log('Not-submitted API response:', response.data);
        if (response.data.success) {
          // Transform snake_case from backend to match expected structure
          const transformed = (response.data.employees || []).map((emp: any) => ({
            ...emp,
            // Map to consistent field names used in the table
            periodStart: emp.period_start,
            periodEnd: emp.period_end,
            totalHours: emp.total_hours || 0,
            submittedAt: emp.submitted_at,
            dailyEntries: emp.daily_entries?.entries || emp.daily_entries || [],
            // Keep the composite id for unique key
            id: emp.id || `${emp.employee_id}-${emp.project_id}`,
          }));
          console.log('Transformed not-submitted data:', transformed);
          setNotSubmittedData(transformed);
        } else {
          console.log('API returned success=false');
          setNotSubmittedData([]);
        }
      } catch (e) {
        console.error('Error fetching not-submitted:', e);
        setNotSubmittedData([]);
      }
    };
    if (selectedStatus === 'not-submitted') {
      fetchNotSubmitted();
    }
  }, [selectedStatus]);

  // Handlers
  const handleApprove = async (timesheetId: number) => {
    try {
      const result = await approveTimesheet(timesheetId);
      if (result.success) {
        setMessage({ type: 'success', text: '✅ Timesheet approved successfully!' });
        refetch();
        const timer = setTimeout(() => setMessage(null), 3000);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error('Approval error:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedTimesheet || !rejectionReason.trim()) return;

    try {
      const result = await rejectTimesheet(selectedTimesheet.id, rejectionReason);
      if (result.success) {
        setMessage({ type: 'success', text: '📝 Timesheet rejected with feedback sent to employee' });
        closeRejectDialog();
        refetch();
        const timer = setTimeout(() => setMessage(null), 3000);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error('Rejection error:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      setMessage({ type: 'success', text: '🔄 Dashboard refreshed' });
      setTimeout(() => setMessage(null), 2000);
    } finally {
      setRefreshing(false);
    }
  };

  const setFilter = (status: 'pending' | 'approved' | 'rejected' | 'not-submitted') => {
    setSelectedStatus(status);
    // refetch will be triggered by hook effect on status
  };

  // Dialog handlers
  const openViewDetails = (timesheet: EnhancedTimesheet) => {
    setSelectedTimesheet(timesheet);
    setViewDetailsOpen(true);
  };

  const openRejectDialog = (timesheet: EnhancedTimesheet) => {
    setSelectedTimesheet(timesheet);
    setRejectDialogOpen(true);
  };

  const closeViewDetails = () => {
    setViewDetailsOpen(false);
    setSelectedTimesheet(null);
  };

  const closeRejectDialog = () => {
    setRejectDialogOpen(false);
    setRejectionReason('');
    setSelectedTimesheet(null);
  };

  const handleNotSubmittedClick = async () => {
    try {
      const response = await timesheetAPI.getEmployeesNotSubmitted();
      if (response.data.success) {
        setNotSubmittedData(response.data.employees || []);
        setNotSubmittedDialogOpen(true);
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to fetch not submitted employees' });
      }
    } catch (error) {
      console.error('Failed to fetch not submitted employees:', error);
      setMessage({ type: 'error', text: 'Failed to fetch not submitted employees' });
    }
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusChip = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
    
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        variant="outlined"
        sx={{
          fontWeight: 500,
          backgroundColor: config.bgColor,
          color: config.textColor,
        }}
      />
    );
  };

  const getEmployeeInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CircularProgress size={40} sx={{ color: '#0066A4' }} />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading approval dashboard...
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <CheckCircleOutline sx={{ color: '#0066A4', fontSize: 28 }} />
            </div>
            <div>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                Timesheet Approvals
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Review and manage employee timesheets
              </Typography>
            </div>
          </div>
          
          <Tooltip title="Refresh data">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ 
                bgcolor: '#0066A4',
                color: 'white',
                '&:hover': { bgcolor: '#004e7c' },
                '&:disabled': { bgcolor: '#94a3b8' }
              }}
            >
              {refreshing ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <Alert 
          severity={message.type} 
          onClose={() => setMessage(null)}
          sx={{ mb: 4, borderRadius: 2 }}
        >
          {message.text}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Pending Card */}
        <div 
          onClick={() => setFilter('pending')}
          className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${
            selectedStatus === 'pending' 
              ? 'border-amber-400 bg-amber-50' 
              : 'border-gray-200 bg-white hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <HourglassEmpty sx={{ color: '#d97706', fontSize: 20 }} />
            </div>
            {selectedStatus === 'pending' && (
              <Chip label="Active" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontSize: '0.7rem' }} />
            )}
          </div>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#b45309', mb: 0.5 }}>
            {stats.pending}
          </Typography>
          <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 500 }}>
            Pending
          </Typography>
        </div>

        {/* Approved Card */}
        <div 
          onClick={() => setFilter('approved')}
          className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${
            selectedStatus === 'approved' 
              ? 'border-green-400 bg-green-50' 
              : 'border-gray-200 bg-white hover:border-green-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleOutline sx={{ color: '#059669', fontSize: 20 }} />
            </div>
            {selectedStatus === 'approved' && (
              <Chip label="Active" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontSize: '0.7rem' }} />
            )}
          </div>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#047857', mb: 0.5 }}>
            {pmStats.approved}
          </Typography>
          <Typography variant="body2" sx={{ color: '#065f46', fontWeight: 500 }}>
            Approved
          </Typography>
        </div>

        {/* Rejected Card */}
        <div 
          onClick={() => setFilter('rejected')}
          className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${
            selectedStatus === 'rejected' 
              ? 'border-red-400 bg-red-50' 
              : 'border-gray-200 bg-white hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <ErrorOutline sx={{ color: '#dc2626', fontSize: 20 }} />
            </div>
            {selectedStatus === 'rejected' && (
              <Chip label="Active" size="small" sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontSize: '0.7rem' }} />
            )}
          </div>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc2626', mb: 0.5 }}>
            {pmStats.rejected}
          </Typography>
          <Typography variant="body2" sx={{ color: '#991b1b', fontWeight: 500 }}>
            Rejected
          </Typography>
        </div>

        {/* Not Submitted Card */}
        <div 
          onClick={() => setFilter('not-submitted')}
          className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${
            selectedStatus === 'not-submitted' 
              ? 'border-orange-400 bg-orange-50' 
              : 'border-gray-200 bg-white hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Schedule sx={{ color: '#ea580c', fontSize: 20 }} />
            </div>
            {selectedStatus === 'not-submitted' && (
              <Chip label="Active" size="small" sx={{ bgcolor: '#ffedd5', color: '#9a3412', fontSize: '0.7rem' }} />
            )}
          </div>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#ea580c', mb: 0.5 }}>
            {pmStats.notSubmitted}
          </Typography>
          <Typography variant="body2" sx={{ color: '#9a3412', fontWeight: 500 }}>
            Not Submitted
          </Typography>
        </div>
      </div>

      {/* Timesheets Table */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 3, 
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}
      >
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                {selectedStatus === 'pending' && 'Pending Approvals'}
                {selectedStatus === 'approved' && 'Approved Timesheets'}
                {selectedStatus === 'rejected' && 'Rejected Timesheets'}
                {selectedStatus === 'not-submitted' && 'Not Submitted'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {(selectedStatus === 'not-submitted' ? notSubmittedData.length : enhancedTimesheets.length)} record{(selectedStatus === 'not-submitted' ? notSubmittedData.length : enhancedTimesheets.length) !== 1 ? 's' : ''}
              </Typography>
            </div>
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Period</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Hours</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Submitted</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(selectedStatus === 'not-submitted' ? notSubmittedData : enhancedTimesheets).map((timesheet) => {
                const priorityConfig = getPriorityConfig(timesheet.totalHours || 0);
                
                return (
                  <TableRow 
                    key={timesheet.id} 
                    sx={{ 
                      '&:hover': { bgcolor: '#f8fafc' },
                      '&:last-child td': { borderBottom: 0 }
                    }}
                  >
                    <TableCell sx={{ py: 2.5 }}>
                      <div className="flex items-center gap-3">
                        <Avatar 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: '#0066A4',
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}
                        >
                          {getEmployeeInitials(timesheet.employee_name || '')}
                        </Avatar>
                        <div>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                            {timesheet.employee_name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {timesheet.employee_email || 'N/A'}
                          </Typography>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell sx={{ py: 2.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b', mb: 0.5 }}>
                        {timesheet.project_name || 'N/A'}
                      </Typography>
                      <Chip
                        size="small"
                        label={timesheet.auto_approve ? 'Auto' : 'Manual'}
                        sx={{
                          bgcolor: timesheet.auto_approve ? '#dcfce7' : '#e0f2fe',
                          color: timesheet.auto_approve ? '#166534' : '#0369a1',
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ py: 2.5 }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <CalendarToday sx={{ fontSize: 14, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                          {timesheet.periodStart && timesheet.periodEnd 
                            ? `${formatDate(timesheet.periodStart)} - ${formatDate(timesheet.periodEnd)}`
                            : 'No timesheet created'}
                        </Typography>
                      </div>
                      <Chip 
                        size="small" 
                        label={timesheet.period_type || timesheet.periodType || 'N/A'} 
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20, borderColor: '#cbd5e1' }}
                      />
                    </TableCell>

                    <TableCell sx={{ py: 2.5 }}>
                      <Typography 
                        variant="body1" 
                        sx={{ fontWeight: 600, color: priorityConfig.color }}
                      >
                        {timesheet.totalHours || 0}h
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 2.5 }}>
                      {getStatusChip(selectedStatus === 'not-submitted' ? 'not-submitted' : timesheet.status)}
                    </TableCell>

                    <TableCell sx={{ py: 2.5 }}>
                      <div className="flex items-center gap-1.5">
                        <AccessTime sx={{ fontSize: 14, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {timesheet.submittedAt ? formatDateTime(timesheet.submittedAt) : '-'}
                        </Typography>
                      </div>
                    </TableCell>

                    <TableCell sx={{ py: 2.5 }}>
                      <div className="flex items-center gap-2">
                        <Tooltip title="View details">
                          <IconButton
                            size="small"
                            onClick={() => openViewDetails(timesheet)}
                            sx={{ 
                              color: '#64748b',
                              '&:hover': { color: '#0066A4', bgcolor: '#e0f2fe' }
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {timesheet.status === 'pending' && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<Check sx={{ fontSize: 16 }} />}
                              onClick={() => handleApprove(timesheet.id)}
                              disabled={mutationLoading}
                              sx={{ 
                                bgcolor: '#059669',
                                textTransform: 'none',
                                fontWeight: 500,
                                borderRadius: 2,
                                px: 2,
                                '&:hover': { bgcolor: '#047857' }
                              }}
                            >
                              Approve
                            </Button>

                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Close sx={{ fontSize: 16 }} />}
                              onClick={() => openRejectDialog(timesheet)}
                              disabled={mutationLoading}
                              sx={{ 
                                borderColor: '#dc2626',
                                color: '#dc2626',
                                textTransform: 'none',
                                fontWeight: 500,
                                borderRadius: 2,
                                '&:hover': { 
                                  borderColor: '#b91c1c',
                                  bgcolor: '#fef2f2'
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Empty State */}
        {(selectedStatus === 'not-submitted' ? notSubmittedData.length : enhancedTimesheets.length) === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircleOutline sx={{ fontSize: 32, color: '#059669' }} />
            </div>
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600, mb: 1 }}>
              All caught up!
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>
              No {selectedStatus} timesheets at this time.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                borderColor: '#0066A4',
                color: '#0066A4',
                textTransform: 'none',
                borderRadius: 2,
                '&:hover': { bgcolor: '#f0f9ff' }
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        )}
      </Paper>

      {/* View Details Dialog */}
      <Dialog 
        open={viewDetailsOpen} 
        onClose={closeViewDetails} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Visibility sx={{ color: '#0066A4' }} />
            </div>
            <div>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                Timesheet Details
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Complete timesheet information
              </Typography>
            </div>
          </div>
        </DialogTitle>
        
        <DialogContent>
          {selectedTimesheet && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Employee Info */}
                <Paper 
                  elevation={0} 
                  sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e5e7eb' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <PersonOutline sx={{ color: '#0066A4', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569' }}>
                      Employee Information
                    </Typography>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Full Name</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                        {selectedTimesheet.employee_name || 'Not provided'}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Email Address</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                        {selectedTimesheet.employee_email || 'Not provided'}
                      </Typography>
                    </div>
                  </div>
                </Paper>
                
                {/* Project Info */}
                <Paper 
                  elevation={0} 
                  sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e5e7eb' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BusinessOutline sx={{ color: '#0066A4', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569' }}>
                      Project Information
                    </Typography>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Project Name</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                        {selectedTimesheet.project_name || 'Not provided'}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Total Hours</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: getPriorityConfig(selectedTimesheet.totalHours || 0).color }}>
                        {selectedTimesheet.totalHours || 0} hours
                      </Typography>
                    </div>
                  </div>
                </Paper>
              </div>
              
              <Divider sx={{ my: 3 }} />

              {/* Daily Entries */}
              <div>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569', mb: 2 }}>
                  Daily Entries
                </Typography>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedTimesheet.dailyEntries && selectedTimesheet.dailyEntries.length > 0 ? (
                    selectedTimesheet.dailyEntries.map((day, index) => (
                      <Paper 
                        key={index} 
                        elevation={0}
                        sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e5e7eb' }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {formatDate(day.date)}
                          </Typography>
                          <Chip 
                            label={`${day.hours} hrs`}
                            size="small"
                            sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 500 }}
                          />
                        </div>
                        <div className="pl-3 border-l-2 border-gray-200 space-y-1">
                          {day.tasks.map((task, taskIndex) => (
                            <div key={taskIndex} className="flex justify-between text-sm">
                              <Typography variant="caption" sx={{ color: '#475569' }}>{task.name}</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#1e293b' }}>{task.hours} hrs</Typography>
                            </div>
                          ))}
                        </div>
                      </Paper>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        No daily entries found for this timesheet.
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
          <Button 
            onClick={closeViewDetails} 
            variant="outlined"
            sx={{ 
              borderColor: '#cbd5e1', 
              color: '#475569',
              textTransform: 'none',
              borderRadius: 2
            }}
          >
            Close
          </Button>
          {selectedTimesheet && selectedTimesheet.status === 'pending' && (
            <>
              <Button 
                onClick={() => {
                  closeViewDetails();
                  openRejectDialog(selectedTimesheet);
                }}
                variant="outlined"
                sx={{ 
                  borderColor: '#dc2626', 
                  color: '#dc2626',
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#fef2f2' }
                }}
                startIcon={<Close />}
              >
                Reject
              </Button>
              <Button 
                onClick={() => {
                  handleApprove(selectedTimesheet.id);
                  closeViewDetails();
                }}
                variant="contained"
                disabled={mutationLoading}
                sx={{ 
                  bgcolor: '#059669',
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#047857' }
                }}
                startIcon={<Check />}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog 
        open={rejectDialogOpen} 
        onClose={closeRejectDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <ErrorOutline sx={{ color: '#dc2626' }} />
            </div>
            <div>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                Reject Timesheet
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Provide feedback for the employee
              </Typography>
            </div>
          </div>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="info" sx={{ mt: 2, mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              Clear, specific feedback helps employees understand what needs to be corrected.
            </Typography>
          </Alert>
          
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569', mb: 1.5 }}>
            Reason for rejection
          </Typography>
          
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide specific details about why this timesheet is being rejected."
            helperText={`${rejectionReason.length}/500 characters`}
            inputProps={{ maxLength: 500 }}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: 2,
                '&:hover fieldset': { borderColor: '#0066A4' },
                '&.Mui-focused fieldset': { borderColor: '#0066A4' }
              } 
            }}
          />
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
          <Button 
            onClick={closeRejectDialog} 
            variant="outlined"
            sx={{ 
              borderColor: '#cbd5e1', 
              color: '#475569',
              textTransform: 'none',
              borderRadius: 2
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReject} 
            variant="contained"
            disabled={!rejectionReason.trim() || mutationLoading}
            startIcon={mutationLoading ? <CircularProgress size={16} color="inherit" /> : <Close />}
            sx={{ 
              bgcolor: '#dc2626',
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: '#b91c1c' },
              '&:disabled': { bgcolor: '#94a3b8' }
            }}
          >
            {mutationLoading ? 'Rejecting...' : 'Reject Timesheet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Not Submitted Dialog */}
      <Dialog 
        open={notSubmittedDialogOpen} 
        onClose={() => setNotSubmittedDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Schedule sx={{ color: '#d97706' }} />
            </div>
            <div>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                Employees Not Submitted
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                These employees need to submit their timesheets
              </Typography>
            </div>
          </div>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 2, mb: 3, borderRadius: 2 }}>
            These employees need to submit their timesheets for the current period.
          </Alert>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Employee Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Project</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notSubmittedData.map((employee, index) => (
                  <TableRow key={`${employee.id}-${index}`} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{employee.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>{employee.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={employee.project_name} 
                        size="small"
                        sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={employee.timesheet_status === 'not_created' ? 'Not Created' : 'Draft'} 
                        size="small"
                        sx={{ 
                          bgcolor: employee.timesheet_status === 'not_created' ? '#fee2e2' : '#fef3c7',
                          color: employee.timesheet_status === 'not_created' ? '#991b1b' : '#92400e',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
          <Button 
            onClick={() => setNotSubmittedDialogOpen(false)}
            variant="outlined"
            sx={{ 
              borderColor: '#cbd5e1', 
              color: '#475569',
              textTransform: 'none',
              borderRadius: 2
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ApprovalDashboard;
