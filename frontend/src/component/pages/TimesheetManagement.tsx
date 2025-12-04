import React, { useState, useMemo } from 'react';

import {
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Timeline,
  Assessment,
  People,
  Assignment,
  CheckCircle,
  Pending,
  Cancel,
  Visibility,
  Refresh,
  Download,
  FilterList,
} from '@mui/icons-material';
// Charts removed per employer requirements
import { useDashboardStats } from '../hooks/useTimesheet';

// Enhanced interfaces with better type safety
interface ProjectStat {
  projectId: number;
  projectName: string;
  totalAssigned: number;
  filled: number;
  notFilled: number;
  completionRate?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface DashboardStats {
  totalEmployees: number;
  filledTimesheets: number;
  pendingApproval: number;
  approvedTimesheets: number;
  rejectedTimesheets: number;
  notSubmitted: number;
  projectStats: ProjectStat[];
}

interface MetricCard {
  title: string;
  value: number;
  subtitle?: string;
  color: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// Enhanced color palette
const CHART_COLORS = {
  primary: '#1976d2',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  purple: '#7b1fa2',
  orange: '#f57c00',
  teal: '#00695c',
} as const;

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

// Status configuration
const STATUS_CONFIG = {
  excellent: { label: 'Excellent', color: 'success', threshold: 90 },
  good: { label: 'Good', color: 'info', threshold: 80 },
  average: { label: 'Average', color: 'warning', threshold: 60 },
  poor: { label: 'Poor', color: 'error', threshold: 0 },
} as const;

const TimesheetManagement: React.FC = () => {
  // State management
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('current');
  const [refreshing, setRefreshing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTitle, setDetailsTitle] = useState<string>('');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsCompleted, setDetailsCompleted] = useState<any[]>([]);
  const [detailsPending, setDetailsPending] = useState<any[]>([]);
  const [detailsSummary, setDetailsSummary] = useState<{ notSubmitted: number; draft: number; pending: number; approved: number; submitted: number } | null>(null);
  const [detailsBuckets, setDetailsBuckets] = useState<{ notSubmitted: any[]; draft: any[]; pending: any[]; approved: any[]; submitted: any[] } | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const [listItems, setListItems] = useState<any[]>([]);

  // Hooks
  const { data: stats, loading, error, refetch } = useDashboardStats(timeRange);

  // Handlers
  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  // Details modal helpers
  const openDetails = async (args: { title: string; status?: string; projectId?: number }) => {
    setDetailsTitle(args.title);
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError(null);
    setDetailsCompleted([]);
    setDetailsPending([]);
    try {
      const { timesheetAPI } = await import('../../api/timesheetapi');
      if (args.projectId) {
        const [filledRes, pendingRes] = await Promise.all([
          timesheetAPI.getTimesheetDetails({ status: 'filled', projectId: args.projectId, range: timeRange }),
          timesheetAPI.getTimesheetDetails({ status: 'not-submitted', projectId: args.projectId, range: timeRange }),
        ]);
        setDetailsCompleted(filledRes.data.items || []);
        setDetailsPending(pendingRes.data.items || []);
        setDetailsSummary(null);
        setDetailsBuckets(null);
      } else if (args.status) {
        const res = await timesheetAPI.getTimesheetDetails({ status: args.status, range: timeRange });
        const items = res.data.items || [];
        if (args.status === 'filled') setDetailsCompleted(items);
        else if (args.status === 'not-submitted') setDetailsPending(items);
        else {
          // pending or approved
          setDetailsCompleted(items);
        }
        setDetailsSummary(null);
        setDetailsBuckets(null);
      } else {
        // All employees across active projects
        // For Total Employees card: prepare summary buckets
        const [notCreatedRes, draftRes, pendingRes, approvedRes, submittedRes] = await Promise.all([
          timesheetAPI.getTimesheetDetails({ status: 'not-created', range: timeRange }),
          timesheetAPI.getTimesheetDetails({ status: 'draft', range: timeRange }),
          timesheetAPI.getTimesheetDetails({ status: 'pending', range: timeRange }),
          timesheetAPI.getTimesheetDetails({ status: 'approved', range: timeRange }),
          timesheetAPI.getTimesheetDetails({ status: 'filled', range: timeRange }),
        ]);
        const notCreatedItems = notCreatedRes.data.items || [];
        const draftItems = draftRes.data.items || [];
        const pendItems = pendingRes.data.items || [];
        const apprItems = approvedRes.data.items || [];
        const submItems = submittedRes.data.items || [];
        setDetailsSummary({ notSubmitted: notCreatedItems.length, draft: draftItems.length, pending: pendItems.length, approved: apprItems.length, submitted: submItems.length });
        setDetailsBuckets({ notSubmitted: notCreatedItems, draft: draftItems, pending: pendItems, approved: apprItems, submitted: submItems });
        setDetailsCompleted([]);
        setDetailsPending([]);
      }
    } catch (e: any) {
      setDetailsError(e?.response?.data?.message || 'Failed to load details');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Data processing functions
  // Graph helpers removed

  // Memoized calculations
  const enhancedProjectStats = useMemo(() => {
    if (!stats?.projectStats) return [];
    return stats.projectStats.map((project: ProjectStat) => ({
      ...project,
      completionRate: (project.totalAssigned > 0 ? (project.filled / project.totalAssigned) * 100 : 0),
    }));
  }, [stats]);

  const filteredProjects = useMemo(() => {
    if (selectedProject === 'all') return enhancedProjectStats;
    return enhancedProjectStats.filter(project => 
      project.projectId.toString() === selectedProject
    );
  }, [enhancedProjectStats, selectedProject]);

  // No data state
  const safeStats = stats || { totalEmployees: 0, filledTimesheets: 0, pendingApproval: 0, approvedTimesheets: 0, rejectedTimesheets: 0, notSubmitted: 0, projectStats: [] } as any;

  const metricCards: MetricCard[] = useMemo(() => {
    const s = safeStats;
    const completionRate = s.totalEmployees ? (s.filledTimesheets / s.totalEmployees) * 100 : 0;
    
    return [
      {
        title: 'Total Employees',
        value: s.totalEmployees,
        subtitle: 'Active workforce',
        color: CHART_COLORS.primary,
        icon: <People />,
        trend: { value: 5, isPositive: true }
      },
      {
        title: 'Timesheets Filled',
        value: s.filledTimesheets,
        subtitle: `${completionRate.toFixed(1)}% completion`,
        color: CHART_COLORS.success,
        icon: <CheckCircle />,
        trend: { value: 12, isPositive: true }
      },
      {
        title: 'Not Submitted',
        value: s.notSubmitted,
        subtitle: 'No submission or draft only',
        color: CHART_COLORS.error,
        icon: <Cancel />,
        trend: { value: 4, isPositive: false }
      },
      {
        title: 'Pending Approval',
        value: s.pendingApproval,
        subtitle: 'Awaiting review',
        color: CHART_COLORS.warning,
        icon: <Pending />,
        trend: { value: 3, isPositive: false }
      },
      {
        title: 'Approved',
        value: s.approvedTimesheets,
        subtitle: 'Successfully processed',
        color: CHART_COLORS.info,
        icon: <Assignment />,
        trend: { value: 8, isPositive: true }
      }
    ];
  }, [safeStats]);

  // Utility functions
  const getStatusChip = (completionRate: number) => {
    const status = completionRate >= 90 ? 'excellent' : 
                   completionRate >= 80 ? 'good' : 
                   completionRate >= 60 ? 'average' : 'poor';
    
    const config = STATUS_CONFIG[status];
    
    return (
      <Chip
        label={config.label}
        color={config.color as any}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 'bold' }}
      />
    );
  };

  const renderCustomPieLabel = (entry: any) => {
    const percent = ((entry.value / entry.payload.totalValue) * 100).toFixed(0);
    return `${entry.name}: ${percent}%`;
  };

  // Loading state
  const loadingBanner = loading ? (
    <Alert severity="info" className="mb-4">Loading dashboard analytics...</Alert>
  ) : null;

  // Error state
  const errorBanner = error ? (
    <Alert severity="error" className="mb-4" action={<IconButton color="inherit" size="small" onClick={handleRefresh}><Refresh /></IconButton>}>
      <Typography variant="h6">Failed to load dashboard data</Typography>
      <Typography variant="body2">{error}</Typography>
    </Alert>
  ) : null;

  return (
    <Container maxWidth="xl" className="py-8">
      {loadingBanner}
      {errorBanner}
      {/* Enhanced Header */}
      <Box className="mb-8">
        <Box className="flex justify-between items-start mb-4">
          <div>
            <Typography variant="h4" className="font-bold text-gray-900 mb-2">
              📊 Timesheet Management Dashboard
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Comprehensive overview of timesheet completion, approval status, and team productivity
            </Typography>
          </div>
          
          <Box className="flex gap-2">
            <Tooltip title="Export data">
              <IconButton
                sx={{ 
                  backgroundColor: 'success.main',
                  color: 'white',
                  '&:hover': { backgroundColor: 'success.dark' }
                }}
              >
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh dashboard">
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

        {/* Key Metrics Summary */}
        <Paper className="p-6 mb-6" sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
          <Box className="flex items-center justify-between">
            <Box>
              <Typography variant="h6" className="font-bold text-gray-800">
                📈 Quick Insights
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Current period overview
              </Typography>
            </Box>
            <Box className="flex gap-6">
              <Box className="text-center">
                <Typography variant="h4" className="font-bold" sx={{ color: CHART_COLORS.success }}>
                  {stats ? Math.round((stats.filledTimesheets / stats.totalEmployees) * 100) : 0}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Overall Completion
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box className="text-center">
                <Typography variant="h4" className="font-bold" sx={{ color: CHART_COLORS.warning }}>
                  {stats?.pendingApproval || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Pending Review
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Metric Cards */}
      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {metricCards.map((card, index) => (
          <Card
            key={index}
            elevation={4}
            className="hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            onClick={() => {
              const map: Record<string, string | undefined> = {
                'Timesheets Filled': 'filled',
                'Not Submitted': 'not-submitted',
                'Pending Approval': 'pending',
                'Approved': 'approved',
              };
              const status = map[card.title];
              if (status) {
                openDetails({ title: card.title, status });
              } else {
                // Total Employees summary
                openDetails({ title: card.title });
              }
            }}
          >
            <CardContent>
              <Box className="flex justify-between items-start">
                <Typography variant="h6" className="font-semibold text-gray-700">
                  {card.title}
                </Typography>
                <Avatar sx={{ bgcolor: card.color, width: 40, height: 40 }}>
                  {card.icon}
                </Avatar>
              </Box>
              <Typography variant="h3" className="font-bold my-2" sx={{ color: card.color }}>
                {card.value}
              </Typography>
              <Box className="flex justify-between items-center">
                <Typography variant="body2" color="textSecondary">
                  {card.subtitle}
                </Typography>
                {card.trend && (
                  <Box 
                    className="flex items-center" 
                    sx={{ color: card.trend.isPositive ? 'success.main' : 'error.main' }}
                  >
                    {card.trend.isPositive ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                    <Typography variant="caption" className="font-semibold ml-1">
                      {card.trend.value}%
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Project Status Table */}
      <Paper elevation={3} className="p-6">
        <Box className="flex justify-between items-center mb-4">
          <Typography variant="h6" className="font-bold">Project Completion Status</Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Project</InputLabel>
            <Select value={selectedProject} label="Filter by Project" onChange={(e) => setSelectedProject(e.target.value)}>
              <MenuItem value="all">All Projects</MenuItem>
              {safeStats.projectStats.map((p: any) => (
                <MenuItem key={p.projectId} value={p.projectId.toString()}>{p.projectName}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Team Size</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No projects found</TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.projectId} hover>
                    <TableCell>{project.projectName}</TableCell>
                    <TableCell>{project.totalAssigned}</TableCell>
                    <TableCell>{project.filled}</TableCell>
                    <TableCell>{project.notFilled}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View team breakdown">
                        <IconButton size="small" onClick={() => openDetails({ title: `${project.projectName} Team`, projectId: project.projectId })}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{detailsTitle || 'Details'}</DialogTitle>
        <DialogContent>
          {detailsLoading ? (
            <Box className="py-6 flex justify-center"><CircularProgress /></Box>
          ) : detailsError ? (
            <Alert severity="error" className="mb-4">{detailsError}</Alert>
          ) : detailsSummary && detailsBuckets ? (
            <Box className="py-2">
              <div className="grid grid-cols-12 gap-2 mb-2">
                <div className="col-span-6 md:col-span-3"><Paper className="p-3 cursor-pointer" onClick={() => { setListTitle('Not Submitted'); setListItems(detailsBuckets.notSubmitted); setListOpen(true); }}><Typography variant="body2" color="textSecondary">Not Submitted</Typography><Typography variant="h5" className="font-bold">{detailsSummary.notSubmitted}</Typography></Paper></div>
                <div className="col-span-6 md:col-span-3"><Paper className="p-3 cursor-pointer" onClick={() => { setListTitle('Draft'); setListItems(detailsBuckets.draft); setListOpen(true); }}><Typography variant="body2" color="textSecondary">Draft</Typography><Typography variant="h5" className="font-bold">{detailsSummary.draft}</Typography></Paper></div>
                <div className="col-span-6 md:col-span-3"><Paper className="p-3 cursor-pointer" onClick={() => { setListTitle('Pending'); setListItems(detailsBuckets.pending); setListOpen(true); }}><Typography variant="body2" color="textSecondary">Pending</Typography><Typography variant="h5" className="font-bold">{detailsSummary.pending}</Typography></Paper></div>
                <div className="col-span-6 md:col-span-3"><Paper className="p-3 cursor-pointer" onClick={() => { setListTitle('Approved'); setListItems(detailsBuckets.approved); setListOpen(true); }}><Typography variant="body2" color="textSecondary">Approved</Typography><Typography variant="h5" className="font-bold">{detailsSummary.approved}</Typography></Paper></div>
              </div>
              <Paper className="p-3">
                <Typography variant="body2" color="textSecondary">Submitted (Pending + Approved): {detailsSummary.submitted}</Typography>
              </Paper>
            </Box>
          ) : (
            <Box className="py-2">
              {detailsCompleted.length > 0 && (
                <Box className="mb-4">
                  <Typography variant="h6" className="mb-2">Completed</Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Employee</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Project</TableCell>
                          <TableCell>Period Start</TableCell>
                          <TableCell>Period End</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailsCompleted.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{item.employeeName}</TableCell>
                            <TableCell>{item.employeeEmail}</TableCell>
                            <TableCell>{item.projectName}</TableCell>
                            <TableCell>{item.periodStart ? new Date(item.periodStart).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>{item.periodEnd ? new Date(item.periodEnd).toLocaleDateString() : '-'}</TableCell>
                            <TableCell sx={{ textTransform: 'capitalize' }}>{item.status || 'filled'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
              {detailsPending.length > 0 && (
                <Box className="mb-2">
                  <Typography variant="h6" className="mb-2">Not Submitted</Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Employee</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Project</TableCell>
                          <TableCell>Period Start</TableCell>
                          <TableCell>Period End</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailsPending.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{item.employeeName}</TableCell>
                            <TableCell>{item.employeeEmail}</TableCell>
                            <TableCell>{item.projectName}</TableCell>
                            <TableCell>{item.periodStart ? new Date(item.periodStart).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>{item.periodEnd ? new Date(item.periodEnd).toLocaleDateString() : '-'}</TableCell>
                            <TableCell sx={{ textTransform: 'capitalize' }}>{item.status || 'not-submitted'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
              {detailsCompleted.length === 0 && detailsPending.length === 0 && (
                <Alert severity="info">No records found.</Alert>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Secondary modal for summary bucket lists */}
      <Dialog open={listOpen} onClose={() => setListOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{listTitle || 'Details'}</DialogTitle>
        <DialogContent>
          {listItems.length === 0 ? (
            <Alert severity="info">No records found.</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Period Start</TableCell>
                    <TableCell>Period End</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {listItems.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{item.employeeName}</TableCell>
                      <TableCell>{item.employeeEmail}</TableCell>
                      <TableCell>{item.projectName}</TableCell>
                      <TableCell>{item.periodStart ? new Date(item.periodStart).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{item.periodEnd ? new Date(item.periodEnd).toLocaleDateString() : '-'}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{item.status || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default TimesheetManagement;

