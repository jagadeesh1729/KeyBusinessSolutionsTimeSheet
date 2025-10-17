import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
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
  Card,
  CardContent,
  CircularProgress,
  Avatar,
  Tooltip,
  IconButton,
  Badge,
  Fab,
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
  FilterList,
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
        const response = await timesheetAPI.getEmployeesNotSubmitted();
        if (response.data.success) {
          setNotSubmittedData(response.data.employees || []);
        } else {
          setNotSubmittedData([]);
        }
      } catch (e) {
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
      <Container maxWidth="xl" className="py-8">
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress size={64} className="mb-6" />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Loading approval dashboard...
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Fetching pending timesheets from the server
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className="py-8">
      {/* Header Section */}
      <Box className="mb-8">
        <Box className="flex justify-between items-start mb-4">
          <div>
            <Typography variant="h4" className="font-bold text-gray-900 mb-2">
              📋 Timesheet Approval Dashboard
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Review and approve employee timesheets for projects requiring manual approval
            </Typography>
          </div>
          
          <Box className="flex gap-2">
            <Tooltip title="Refresh data">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{ 
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' }
                }}
              >
                {refreshing ? <CircularProgress size={20} /> : <Refresh />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Quick Actions Bar */}
       
      </Box>

      {/* Alert Messages */}
      {message && (
        <Alert 
          severity={message.type} 
          className="mb-6 shadow-sm" 
          onClose={() => setMessage(null)}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {message.text}
        </Alert>
      )}

      {error && (
        <Alert severity="error" className="mb-6 shadow-sm" variant="filled" sx={{ borderRadius: 2 }}>
          ⚠️ {error}
        </Alert>
      )}

      {/* Enhanced Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <div>
          <Card className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setFilter('pending')}>
            <CardContent className="text-center">
              <Box className="flex items-center justify-center mb-3">
                <Badge badgeContent={stats.pending} color="warning" max={99}>
                  <HourglassEmpty sx={{ fontSize: 48, color: '#d97706' }} />
                </Badge>
              </Box>
              <Typography variant="h3" className="font-bold mb-2" sx={{ color: '#b45309' }}>
                {stats.pending}
              </Typography>
              <Typography variant="body2" className="font-medium" sx={{ color: '#92400e' }}>
                Pending Approvals
              </Typography>
            </CardContent>
          </Card>
        </div>

       
       

        <div>
          <Card className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setFilter('approved')}>
            <CardContent className="text-center">
              <CheckCircleOutline sx={{ fontSize: 40, color: '#059669', mb: 1 }} />
              <Typography variant="h4" className="font-bold mb-1" sx={{ color: '#047857' }}>
                {pmStats.approved}
              </Typography>
              <Typography variant="body2" className="font-medium" sx={{ color: '#065f46' }}>
                Approved
              </Typography>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setFilter('rejected')}>
            <CardContent className="text-center">
              <ErrorOutline sx={{ fontSize: 40, color: '#dc2626', mb: 1 }} />
              <Typography variant="h4" className="font-bold mb-1" sx={{ color: '#dc2626' }}>
                {pmStats.rejected}
              </Typography>
              <Typography variant="body2" className="font-medium" sx={{ color: '#991b1b' }}>
                Rejected
              </Typography>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setFilter('not-submitted')}>
            <CardContent className="text-center">
              <Schedule sx={{ fontSize: 40, color: '#f59e0b', mb: 1 }} />
              <Typography variant="h4" className="font-bold mb-1" sx={{ color: '#d97706' }}>
                {pmStats.notSubmitted}
              </Typography>
              <Typography variant="body2" className="font-medium" sx={{ color: '#92400e' }}>
                Not Submitted
              </Typography>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Timesheets Table */}
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
        <Box className="p-6 border-b border-gray-200" sx={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
          <Box className="flex justify-between items-center">
            <div>
              <Typography variant="h6" className="font-semibold text-gray-800 mb-1">
                {selectedStatus === 'pending' && '📝 Timesheets Requiring Approval'}
                {selectedStatus === 'approved' && '✅ Approved Timesheets'}
                {selectedStatus === 'rejected' && '❌ Rejected Timesheets'}
                {selectedStatus === 'not-submitted' && '⏳ Not Submitted'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {(selectedStatus === 'not-submitted' ? notSubmittedData.length : enhancedTimesheets.length)} record{(selectedStatus === 'not-submitted' ? notSubmittedData.length : enhancedTimesheets.length) !== 1 ? 's' : ''} {selectedStatus}
              </Typography>
            </div>
          </Box>
        </Box>

        <TableContainer>
          <Table sx={{ '& .MuiTableRow-hover:hover': { backgroundColor: '#f8fafc' } }}>
            <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
              <TableRow>
                <TableCell className="font-semibold text-gray-700">Employee</TableCell>
                <TableCell className="font-semibold text-gray-700">Project</TableCell>
                <TableCell className="font-semibold text-gray-700">Period</TableCell>
                <TableCell className="font-semibold text-gray-700">Hours</TableCell>
                <TableCell className="font-semibold text-gray-700">Status</TableCell>
                <TableCell className="font-semibold text-gray-700">Submitted</TableCell>
                <TableCell className="font-semibold text-gray-700">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(selectedStatus === 'not-submitted' ? notSubmittedData : enhancedTimesheets).map((timesheet) => {
                const priorityConfig = getPriorityConfig(timesheet.totalHours || 0);
                
                return (
                  <TableRow 
                    key={timesheet.id} 
                    hover 
                    className="transition-all duration-200"
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: '#f8fafc',
                        transform: 'scale(1.001)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      } 
                    }}
                  >
                    <TableCell>
                      <Box className="flex items-center space-x-3">
                        <Avatar 
                          sx={{ 
                            width: 44, 
                            height: 44, 
                            backgroundColor: 'primary.main',
                            fontWeight: 'bold',
                            fontSize: '14px'
                          }}
                        >
                          {getEmployeeInitials(timesheet.employee_name || '')}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" className="font-medium text-gray-900">
                            {timesheet.employee_name || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" className="text-sm">
                            {timesheet.employee_email || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Typography variant="body2" className="font-medium text-gray-900">
                          {timesheet.project_name || 'N/A'}
                        </Typography>
                        <Chip
                          size="small"
                          label={timesheet.auto_approve ? '🤖 Auto-approve' : '👤 Manual'}
                          color={timesheet.auto_approve ? 'success' : 'primary'}
                          variant="outlined"
                          className="mt-1"
                        />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Box className="flex items-center space-x-1 mb-1">
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2" className="text-gray-700">
                            {formatDate(timesheet.periodStart)} - {formatDate(timesheet.periodEnd)}
                          </Typography>
                        </Box>
                        <Chip 
                          size="small" 
                          label={timesheet.period_type || timesheet.periodType} 
                          variant="outlined"
                          color="default"
                        />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box className="flex items-center space-x-2">
                        <Typography 
                          variant="h6" 
                          className="font-bold"
                          sx={{ color: priorityConfig.color }}
                        >
                          {priorityConfig.emoji} {timesheet.totalHours || 0}h
                        </Typography>
                        <Schedule fontSize="small" color="action" />
                      </Box>
                      <Typography variant="body2" color="textSecondary" className="text-xs">
                        {priorityConfig.level} priority
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {getStatusChip(selectedStatus === 'not-submitted' ? 'not-submitted' : timesheet.status)}
                    </TableCell>

                    <TableCell>
                      <Box className="flex items-center space-x-1">
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2" className="text-gray-600">
                          {timesheet.submittedAt ? formatDateTime(timesheet.submittedAt) : '-'}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box className="flex space-x-1">
                        <Tooltip title="View details">
                          <IconButton
                            size="small"
                            onClick={() => openViewDetails(timesheet)}
                            sx={{ 
                              color: 'text.secondary',
                              '&:hover': { 
                                color: 'primary.main',
                                backgroundColor: 'primary.light',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Approve timesheet">
                          <span>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<Check fontSize="small" />}
                              onClick={() => handleApprove(timesheet.id)}
                              disabled={timesheet.status !== 'pending' || mutationLoading}
                              sx={{ 
                                minWidth: '90px',
                                '&:hover': { transform: 'scale(1.05)' }
                              }}
                            >
                              Approve
                            </Button>
                          </span>
                        </Tooltip>

                        <Tooltip title="Reject with reason">
                          <span>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<Close fontSize="small" />}
                              onClick={() => openRejectDialog(timesheet)}
                              disabled={timesheet.status !== 'pending' || mutationLoading}
                              sx={{ 
                                minWidth: '80px',
                                '&:hover': { transform: 'scale(1.05)' }
                              }}
                            >
                              Reject
                            </Button>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Empty State */}
        {enhancedTimesheets.length === 0 && (
          <Box className="text-center py-16">
            <CheckCircleOutline sx={{ fontSize: '5rem', color: 'success.main', mb: 3 }} />
            <Typography variant="h5" className="text-gray-600 mb-2 font-medium">
              🎉 All caught up!
            </Typography>
            <Typography variant="body1" color="textSecondary" className="mb-4">
              No pending timesheets require your approval at this time.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Dashboard'}
            </Button>
          </Box>
        )}
      </Paper>

      {/* View Details Dialog */}
      <Dialog 
        open={viewDetailsOpen} 
        onClose={closeViewDetails} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, minHeight: '60vh' }
        }}
      >
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', borderRadius: '12px 12px 0 0' }}>
          <Box className="flex items-center space-x-3">
            <Avatar sx={{ backgroundColor: 'primary.main' }}>
              <Visibility />
            </Avatar>
            <div>
              <Typography variant="h5" className="font-bold">
                Timesheet Details
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Complete timesheet information and breakdown
              </Typography>
            </div>
          </Box>
        </DialogTitle>
        
        <DialogContent className="pt-6">
          {selectedTimesheet && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <Paper className="p-6 h-full" sx={{ backgroundColor: '#f8fafc', borderRadius: 2, boxShadow: 'none' }}>
                    <Box className="flex items-center mb-4">
                      <Avatar sx={{ backgroundColor: 'success.main', mr: 2 }}>
                        <PersonOutline />
                      </Avatar>
                      <Typography variant="h6" className="font-semibold text-gray-700">
                        Employee Information
                      </Typography>
                    </Box>
                    <Box className="space-y-3">
                      <Box>
                        <Typography variant="body2" className="font-medium text-gray-600 mb-1">
                          Full Name
                        </Typography>
                        <Typography variant="body1" className="text-gray-900">
                          {selectedTimesheet.employee_name || 'Not provided'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" className="font-medium text-gray-600 mb-1">
                          Email Address
                        </Typography>
                        <Typography variant="body1" className="text-gray-900">
                          {selectedTimesheet.employee_email || 'Not provided'}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </div>
                
                <div>
                  <Paper className="p-6 h-full" sx={{ backgroundColor: '#f8fafc', borderRadius: 2, boxShadow: 'none' }}>
                    <Box className="flex items-center mb-4">
                      <Avatar sx={{ backgroundColor: 'primary.main', mr: 2 }}>
                        <BusinessOutline />
                      </Avatar>
                      <Typography variant="h6" className="font-semibold text-gray-700">
                        Project Information
                      </Typography>
                    </Box>
                    <Box className="space-y-3">
                      <Box>
                        <Typography variant="body2" className="font-medium text-gray-600 mb-1">
                          Project Name
                        </Typography>
                        <Typography variant="body1" className="text-gray-900">
                          {selectedTimesheet.project_name || 'Not provided'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" className="font-medium text-gray-600 mb-1">
                          Total Hours
                        </Typography>
                        <Typography variant="h6" className="font-bold" sx={{ color: getPriorityConfig(selectedTimesheet.totalHours || 0).color }}>
                          {getPriorityConfig(selectedTimesheet.totalHours || 0).emoji} {selectedTimesheet.totalHours || 0} hours
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </div>
              </div>
              
              <Divider sx={{ my: 4 }} />

              {/* Daily Entries */}
              <div>
                <Typography variant="h6" className="font-semibold text-gray-700 mb-4">Daily Entries</Typography>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {selectedTimesheet.dailyEntries && selectedTimesheet.dailyEntries.length > 0 ? (
                    selectedTimesheet.dailyEntries.map((day, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border">
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
                        <div className="space-y-1 pl-2 border-l-2 border-gray-200">
                          {day.tasks.map((task, taskIndex) => (
                            <div key={taskIndex} className="flex justify-between text-sm text-gray-700">
                              <span>{task.name}</span>
                              <span className="font-semibold">{task.hours} hrs</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary" className="text-center py-8">
                      No daily entries found for this timesheet.
                    </Typography>
                  )}
                </div>
              </div>
            </>

          )}
        </DialogContent>
        
        <DialogActions className="p-6 bg-gray-50">
          <Button onClick={closeViewDetails} variant="outlined" size="large">
            Close
          </Button>
          {selectedTimesheet && selectedTimesheet.status === 'pending' && (
            <>
              <Button 
                onClick={() => {
                  closeViewDetails();
                  openRejectDialog(selectedTimesheet);
                }}
                color="error"
                variant="outlined"
                startIcon={<Close />}
                size="large"
              >
                Reject
              </Button>
              <Button 
                onClick={() => {
                  handleApprove(selectedTimesheet.id);
                  closeViewDetails();
                }}
                color="success"
                variant="contained"
                startIcon={<Check />}
                disabled={mutationLoading}
                size="large"
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
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)', borderRadius: '12px 12px 0 0' }}>
          <Box className="flex items-center space-x-3">
            <Avatar sx={{ backgroundColor: 'error.main' }}>
              <ErrorOutline />
            </Avatar>
            <div>
              <Typography variant="h5" className="font-bold">
                Reject Timesheet
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Please provide detailed feedback for the employee
              </Typography>
            </div>
          </Box>
        </DialogTitle>
        
        <DialogContent className="pt-6">
          <Alert severity="info" className="mb-6" sx={{ borderRadius: 2 }}>
            <Typography variant="body2" className="font-medium">
              💡 <strong>Tip:</strong> Clear, specific feedback helps employees understand what needs to be corrected.
            </Typography>
          </Alert>
          
          <Typography variant="body1" className="mb-4 text-gray-700 font-medium">
            Reason for rejection:
          </Typography>
          
          <TextField
            autoFocus
            multiline
            rows={6}
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
                backgroundColor: '#fafafa'
              } 
            }}
          />
        </DialogContent>
        
        <DialogActions className="p-6 bg-gray-50">
          <Button onClick={closeRejectDialog} variant="outlined" size="large">
            Cancel
          </Button>
          <Button 
            onClick={handleReject} 
            color="error"
            variant="contained"
            disabled={!rejectionReason.trim() || mutationLoading}
            startIcon={mutationLoading ? <CircularProgress size={16} /> : <Close />}
            size="large"
            sx={{ minWidth: '140px' }}
          >
            {mutationLoading ? 'Rejecting...' : 'Reject Timesheet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Not Submitted Dialog */}
      <Dialog open={notSubmittedDialogOpen} onClose={() => setNotSubmittedDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ color: 'warning.main' }}>⚠️ Employees Who Haven't Submitted Timesheets</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            These employees need to submit their timesheets for the current period.
          </Alert>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notSubmittedData.map((employee, index) => (
                  <TableRow key={`${employee.id}-${index}`}>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      <Chip label={employee.project_name} color="warning" size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={employee.timesheet_status === 'not_created' ? 'Not Created' : 'Draft'} 
                        color={employee.timesheet_status === 'not_created' ? 'error' : 'warning'}
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotSubmittedDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Quick Refresh */}
      <Fab
        color="primary"
        aria-label="refresh"
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1000,
        }}
        onClick={handleRefresh}
        disabled={refreshing}
      >
        {refreshing ? <CircularProgress size={24} /> : <Refresh />}
      </Fab>
    </Container>
  );
};

export default ApprovalDashboard;
