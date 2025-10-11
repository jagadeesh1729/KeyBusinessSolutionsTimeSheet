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
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
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

  // Data processing functions
  const getCompletionData = () => {
    if (!stats) return [];
    const notFilled = stats.totalEmployees - stats.filledTimesheets;
    return [
      { name: 'Completed', value: stats.filledTimesheets, color: CHART_COLORS.success },
      { name: 'Pending', value: notFilled, color: CHART_COLORS.warning },
    ];
  };

  const getApprovalData = () => {
    if (!stats) return [];
    return [
      { name: 'Pending', value: stats.pendingApproval, color: CHART_COLORS.warning },
      { name: 'Approved', value: stats.approvedTimesheets, color: CHART_COLORS.success },
      { name: 'Rejected', value: stats.rejectedTimesheets, color: CHART_COLORS.error },
    ];
  };

  const getProjectTrendData = () => {
    if (!stats?.projectStats) return [];
    return stats.projectStats.map((project: ProjectStat) => ({
      name: project.projectName.length > 15 
        ? `${project.projectName.substring(0, 15)}...` 
        : project.projectName,
      completion: Math.round((project.filled / project.totalAssigned) * 100),
      filled: project.filled,
      notFilled: project.notFilled,
      total: project.totalAssigned,
    }));
  };

  // Memoized calculations
  const enhancedProjectStats = useMemo(() => {
    if (!stats?.projectStats) return [];
    
    return stats.projectStats.map((project: ProjectStat) => ({
      ...project,
      completionRate: (project.filled / project.totalAssigned) * 100,
      trend: Math.random() > 0.5 ? 'up' : 'down', // Simulate trend data
    }));
  }, [stats]);

  const filteredProjects = useMemo(() => {
    if (selectedProject === 'all') return enhancedProjectStats;
    return enhancedProjectStats.filter(project => 
      project.projectId.toString() === selectedProject
    );
  }, [enhancedProjectStats, selectedProject]);

  const metricCards: MetricCard[] = useMemo(() => {
    if (!stats) return [];
    
    const completionRate = (stats.filledTimesheets / stats.totalEmployees) * 100;
    
    return [
      {
        title: 'Total Employees',
        value: stats.totalEmployees,
        subtitle: 'Active workforce',
        color: CHART_COLORS.primary,
        icon: <People />,
        trend: { value: 5, isPositive: true }
      },
      {
        title: 'Timesheets Filled',
        value: stats.filledTimesheets,
        subtitle: `${completionRate.toFixed(1)}% completion`,
        color: CHART_COLORS.success,
        icon: <CheckCircle />,
        trend: { value: 12, isPositive: true }
      },
      {
        title: 'Pending Approval',
        value: stats.pendingApproval,
        subtitle: 'Awaiting review',
        color: CHART_COLORS.warning,
        icon: <Pending />,
        trend: { value: 3, isPositive: false }
      },
      {
        title: 'Approved',
        value: stats.approvedTimesheets,
        subtitle: 'Successfully processed',
        color: CHART_COLORS.info,
        icon: <Assignment />,
        trend: { value: 8, isPositive: true }
      }
    ];
  }, [stats]);

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
  if (loading) {
    return (
      <Container maxWidth="xl" className="py-8">
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress size={64} className="mb-6" />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Loading dashboard analytics...
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Fetching timesheet data and generating insights
          </Typography>
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="xl" className="py-8">
        <Alert 
          severity="error" 
          className="mb-4"
          action={
            <IconButton color="inherit" size="small" onClick={handleRefresh}>
              <Refresh />
            </IconButton>
          }
        >
          <Typography variant="h6">Failed to load dashboard data</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      </Container>
    );
  }

  // No data state
  if (!stats) {
    return (
      <Container maxWidth="xl" className="py-8">
        <Alert severity="info" className="mb-4">
          <Typography variant="h6">No Data Available</Typography>
          <Typography variant="body2">
            No timesheet data found for the selected time range. Try selecting a different period.
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className="py-8">
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

      {/* Enhanced Filters */}
      <Paper className="p-6 mb-8" elevation={2}>
        <Box className="flex items-center mb-4">
          <FilterList className="mr-2" color="primary" />
          <Typography variant="h6" className="font-semibold">
            Dashboard Filters
          </Typography>
        </Box>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormControl fullWidth variant="outlined">
              <InputLabel>📅 Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value)}
                label="📅 Time Range"
              >
                <MenuItem value="current">📊 Current Period</MenuItem>
                <MenuItem value="last-week">📆 Last Week</MenuItem>
                <MenuItem value="last-month">📅 Last Month</MenuItem>
                <MenuItem value="last-quarter">📈 Last Quarter</MenuItem>
                <MenuItem value="year-to-date">🗓️ Year to Date</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div>
            <FormControl fullWidth variant="outlined">
              <InputLabel>🏢 Project Filter</InputLabel>
              <Select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                label="🏢 Project Filter"
              >
                <MenuItem value="all">📋 All Projects</MenuItem>
                {stats?.projectStats?.map((project: ProjectStat) => (
                  <MenuItem key={project.projectId} value={project.projectId.toString()}>
                    {project.projectName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>
      </Paper>

      {/* Enhanced Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricCards.map((metric, index) => (
          <Card key={index} className="h-full shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="relative overflow-hidden">
              {/* Background Pattern */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  backgroundColor: metric.color,
                  borderRadius: '50%',
                  opacity: 0.1,
                }}
              />
              
              <Box className="flex items-start justify-between mb-3">
                <Avatar
                  sx={{
                    backgroundColor: metric.color,
                    width: 56,
                    height: 56,
                  }}
                >
                  {metric.icon}
                </Avatar>
                {metric.trend && (
                  <Box className="flex items-center">
                    {metric.trend.isPositive ? (
                      <TrendingUp className="text-green-500" fontSize="small" />
                    ) : (
                      <TrendingDown className="text-red-500" fontSize="small" />
                    )}
                    <Typography
                      variant="body2"
                      className={`ml-1 font-bold ${
                        metric.trend.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {metric.trend.value}%
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Typography variant="h4" className="font-bold mb-1" sx={{ color: metric.color }}>
                {metric.value.toLocaleString()}
              </Typography>
              <Typography variant="h6" className="font-medium text-gray-700 mb-1">
                {metric.title}
              </Typography>
              {metric.subtitle && (
                <Typography variant="body2" color="textSecondary">
                  {metric.subtitle}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Completion Overview */}
        <Paper className="p-6 h-full shadow-lg">
          <Box className="flex items-center justify-between mb-4">
            <Typography variant="h6" className="font-bold">
              📊 Timesheet Completion Overview
            </Typography>
            <Chip label="Current Period" size="small" color="primary" variant="outlined" />
          </Box>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={getCompletionData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {getCompletionData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(value: any) => [value, 'Count']}
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>

        {/* Approval Status */}
        <Paper className="p-6 h-full shadow-lg">
          <Box className="flex items-center justify-between mb-4">
            <Typography variant="h6" className="font-bold">
              ⚡ Approval Status Breakdown
            </Typography>
            <Chip label="Live Data" size="small" color="success" variant="outlined" />
          </Box>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={getApprovalData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar 
                dataKey="value" 
                fill={CHART_COLORS.primary}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </div>

      {/* Project Completion Trends */}
      <div className="mb-8">
        <Paper className="p-6 shadow-lg">
          <Box className="flex items-center justify-between mb-4">
            <Typography variant="h6" className="font-bold">
              📈 Project Completion Trends
            </Typography>
            <Box className="flex gap-2">
              <Chip label={`${getProjectTrendData().length} Projects`} size="small" color="info" variant="outlined" />
              <Chip label="Real-time" size="small" color="success" variant="outlined" />
            </Box>
          </Box>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={getProjectTrendData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="completion" 
                stroke={CHART_COLORS.success}
                fill={CHART_COLORS.success}
                fillOpacity={0.3}
                name="Completion Rate (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      </div>

      {/* Enhanced Project Table */}
      <Paper className="shadow-lg" elevation={3}>
        <Box className="p-6 border-b border-gray-200" sx={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
          <Box className="flex justify-between items-center">
            <div>
              <Typography variant="h6" className="font-bold text-gray-800 mb-1">
                🏢 Project-wise Timesheet Analysis
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Detailed breakdown of completion rates and performance metrics by project
              </Typography>
            </div>
            <Box className="flex gap-2">
              <Chip 
                label={`${filteredProjects.length} Projects`} 
                size="small" 
                variant="outlined"
                color="primary"
              />
              <Chip 
                label="Live Data" 
                size="small" 
                variant="outlined"
                color="success"
              />
            </Box>
          </Box>
        </Box>

        <TableContainer>
          <Table sx={{ '& .MuiTableRow-hover:hover': { backgroundColor: '#f8fafc' } }}>
            <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
              <TableRow>
                <TableCell className="font-bold text-gray-700">Project</TableCell>
                <TableCell className="font-bold text-gray-700">Team Size</TableCell>
                <TableCell className="font-bold text-gray-700">Completed</TableCell>
                <TableCell className="font-bold text-gray-700">Pending</TableCell>
                <TableCell className="font-bold text-gray-700">Progress</TableCell>
                <TableCell className="font-bold text-gray-700">Status</TableCell>
                <TableCell className="font-bold text-gray-700">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Box className="flex flex-col items-center">
                      <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="textSecondary" className="mb-1">
                        No Projects Found
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        No projects match the selected filters. Try adjusting your search criteria.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => {
                  const completionRate = project.completionRate || 0;
                  
                  return (
                    <TableRow 
                      key={project.projectId} 
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
                              backgroundColor: 'primary.main',
                              width: 40,
                              height: 40,
                              fontSize: '14px',
                              fontWeight: 'bold'
                            }}
                          >
                            {project.projectName.substring(0, 2).toUpperCase()}
                          </Avatar>
                          <div>
                            <Typography variant="body2" className="font-medium text-gray-900">
                              {project.projectName}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" className="text-sm">
                              ID: #{project.projectId}
                            </Typography>
                          </div>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box className="flex items-center space-x-2">
                          <People fontSize="small" color="action" />
                          <Typography variant="h6" className="font-bold">
                            {project.totalAssigned}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box className="flex items-center space-x-2">
                          <CheckCircle fontSize="small" sx={{ color: CHART_COLORS.success }} />
                          <Typography 
                            variant="body1" 
                            className="font-bold"
                            sx={{ color: CHART_COLORS.success }}
                          >
                            {project.filled}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box className="flex items-center space-x-2">
                          <Pending fontSize="small" sx={{ color: CHART_COLORS.warning }} />
                          <Typography 
                            variant="body1" 
                            className="font-bold"
                            sx={{ color: CHART_COLORS.warning }}
                          >
                            {project.notFilled}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box className="min-w-32">
                          <Box className="flex items-center justify-between mb-1">
                            <Typography variant="body2" className="font-medium">
                              {completionRate.toFixed(1)}%
                            </Typography>
                            {project.trend && (
                              <Box className="flex items-center">
                                {project.trend === 'up' ? (
                                  <TrendingUp fontSize="small" className="text-green-500" />
                                ) : (
                                  <TrendingDown fontSize="small" className="text-red-500" />
                                )}
                              </Box>
                            )}
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(completionRate, 100)}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                backgroundColor: completionRate >= 80 ? CHART_COLORS.success :
                                                completionRate >= 60 ? CHART_COLORS.warning :
                                                CHART_COLORS.error
                              }
                            }}
                          />
                        </Box>
                      </TableCell>

                      <TableCell>
                        {getStatusChip(completionRate)}
                      </TableCell>

                      <TableCell>
                        <Tooltip title="View project details">
                          <IconButton
                            size="small"
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
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default TimesheetManagement;