import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  useTheme,
  Avatar,
  LinearProgress,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderIcon from '@mui/icons-material/Folder';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import { useDashboardStats } from '../hooks/useTimesheet';
import useMeetings from '../hooks/useMeetings';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  subtitle?: string;
  trend?: number;
}

const StatCard = ({ title, value, icon, color, bgColor, subtitle, trend }: StatCardProps) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight={700} color={color}>
              {value.toLocaleString()}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: trend >= 0 ? 'success.main' : 'error.main' }} />
                <Typography variant="caption" color={trend >= 0 ? 'success.main' : 'error.main'} fontWeight={600}>
                  {trend >= 0 ? '+' : ''}{trend}% from last period
                </Typography>
              </Stack>
            )}
          </Box>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: bgColor,
              color: color,
            }}
          >
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
};

const AdminDashboardOverview = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<string>('current');
  const { data, loading, error, refetch } = useDashboardStats(timeRange);
  const { meetings: upcomingMeetings, loading: meetingsLoading, error: meetingsError, refetch: refetchMeetings } = useMeetings({ upcomingOnly: true, limit: 5 });
  const [copiedMeetingId, setCopiedMeetingId] = useState<number | null>(null);

  const handleCopyLink = async (id: number, link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedMeetingId(id);
      setTimeout(() => setCopiedMeetingId(null), 1000);
    } catch {}
  };

  const formatMeetingTime = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  useEffect(() => {
    if (!loading && !error && data) {
      // Log current range and payload for debugging dashboard values
      console.log('[AdminDashboardOverview] range:', timeRange, 'stats:', data);
    }
  }, [data, timeRange, loading, error]);

  const stats = data || {
    totalEmployees: 0,
    totalProjects: 0,
    totalProjectManagers: 0,
    filledTimesheets: 0,
    pendingApproval: 0,
    approvedTimesheets: 0,
    rejectedTimesheets: 0,
    draftTimesheets: 0,
    notSubmitted: 0,
    totalHoursLogged: 0,
    projectStats: [],
  };

  // Calculate completion rate based on submitted vs total expected
  const totalExpectedSubmissions = stats.projectStats.reduce((sum, p) => sum + p.totalAssigned, 0);
  const totalActualSubmissions = stats.projectStats.reduce((sum, p) => sum + p.filled, 0);
  const completionRate = totalExpectedSubmissions > 0 
    ? Math.round((totalActualSubmissions / totalExpectedSubmissions) * 100) 
    : 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={4} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor timesheet submissions and approvals across all projects
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="current">Current Week</MenuItem>
              <MenuItem value="last-week">Last Week</MenuItem>
              <MenuItem value="last-month">Last Month</MenuItem>
              <MenuItem value="last-quarter">Last Quarter</MenuItem>
              <MenuItem value="year-to-date">Year to Date</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => refetch(timeRange)} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Stats Cards - Row 1: Overview */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon={<PeopleAltIcon />}
            color={theme.palette.primary.main}
            bgColor={alpha(theme.palette.primary.main, 0.1)}
            subtitle="Active employees in system"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <StatCard
            title="Active Projects"
            value={stats.totalProjects}
            icon={<FolderIcon />}
            color={theme.palette.secondary.main}
            bgColor={alpha(theme.palette.secondary.main, 0.1)}
            subtitle="Currently active"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <StatCard
            title="Project Managers"
            value={stats.totalProjectManagers}
            icon={<PeopleAltIcon />}
            color="#9c27b0"
            bgColor={alpha('#9c27b0', 0.1)}
            subtitle="Active PMs"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <StatCard
            title="Total Hours Logged"
            value={stats.totalHoursLogged}
            icon={<TrendingUpIcon />}
            color="#00bcd4"
            bgColor={alpha('#00bcd4', 0.1)}
            subtitle="All submitted timesheets"
          />
        </div>
      </div>

      {/* Stats Cards - Row 2: Timesheet Status */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
          <StatCard
            title="Submitted"
            value={stats.filledTimesheets}
            icon={<AssignmentIcon />}
            color={theme.palette.info.main}
            bgColor={alpha(theme.palette.info.main, 0.1)}
            subtitle="Total submissions"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
          <StatCard
            title="Pending Review"
            value={stats.pendingApproval}
            icon={<HourglassEmptyIcon />}
            color={theme.palette.warning.main}
            bgColor={alpha(theme.palette.warning.main, 0.1)}
            subtitle="Awaiting approval"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
          <StatCard
            title="Approved"
            value={stats.approvedTimesheets}
            icon={<CheckCircleIcon />}
            color={theme.palette.success.main}
            bgColor={alpha(theme.palette.success.main, 0.1)}
            subtitle="Timesheets approved"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
          <StatCard
            title="Rejected"
            value={stats.rejectedTimesheets}
            icon={<CancelIcon />}
            color={theme.palette.error.main}
            bgColor={alpha(theme.palette.error.main, 0.1)}
            subtitle="Need attention"
          />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-2">
          <StatCard
            title="Drafts"
            value={stats.draftTimesheets}
            icon={<WarningAmberIcon />}
            color="#ff9800"
            bgColor={alpha('#ff9800', 0.1)}
            subtitle="Not yet submitted"
          />
        </div>
      </div>

      {/* Upcoming Meetings */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12">
          <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2} mb={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main }}>
                    <VideocamOutlinedIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>Upcoming Meetings</Typography>
                    <Typography variant="body2" color="text.secondary">Recent Google Meet links created by PMs</Typography>
                  </Box>
                  <Chip label={`${upcomingMeetings.length || 0} scheduled`} size="small" />
                </Stack>
                <Stack direction="row" spacing={1}>
                  <IconButton onClick={() => refetchMeetings({ upcomingOnly: true })} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                    <RefreshIcon />
                  </IconButton>
                </Stack>
              </Stack>

              {meetingsLoading ? (
                <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={32} />
                </Box>
              ) : meetingsError ? (
                <Alert severity="error" sx={{ borderRadius: 2 }}>{meetingsError}</Alert>
              ) : upcomingMeetings && upcomingMeetings.length > 0 ? (
                <Stack spacing={2}>
                  {upcomingMeetings.map((meeting) => (
                    <Box
                      key={meeting.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                      }}
                    >
                      <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <VideocamOutlinedIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                          <Typography variant="body1" fontWeight={700} noWrap>
                            {meeting.title}
                          </Typography>
                          <Chip size="small" label={formatMeetingTime(meeting.start_time)} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          Host: {meeting.created_by_name || 'Project Manager'} {meeting.created_by_email ? `· ${meeting.created_by_email}` : ''}
                        </Typography>
                        <Typography variant="caption" color="primary" sx={{ wordBreak: 'break-all' }}>
                          {meeting.meeting_link}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Open meeting">
                          <IconButton component="a" href={meeting.meeting_link} target="_blank" rel="noreferrer">
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={copiedMeetingId === meeting.id ? 'Copied' : 'Copy link'}>
                          <IconButton onClick={() => handleCopyLink(meeting.id, meeting.meeting_link)}>
                            <ContentCopyIcon fontSize="small" color={copiedMeetingId === meeting.id ? 'success' : 'inherit'} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No upcoming meetings found.
                </Typography>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Completion Overview & Project Stats */}
      <div className="grid grid-cols-12 gap-6">
        {/* Completion Rate Card */}
        <div className="col-span-12 md:col-span-4">
          <Card sx={{ height: '100%', borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Submission Rate
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={completionRate}
                    size={160}
                    thickness={6}
                    sx={{
                      color: completionRate >= 80 ? theme.palette.success.main : completionRate >= 50 ? theme.palette.warning.main : theme.palette.error.main,
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      },
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography variant="h3" fontWeight={700} color="text.primary">
                      {completionRate}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Completion
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">Approved</Typography>
                    <Typography variant="body2" fontWeight={600}>{stats.approvedTimesheets}</Typography>
                  </Stack>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.filledTimesheets > 0 ? (stats.approvedTimesheets / stats.filledTimesheets) * 100 : 0}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      '& .MuiLinearProgress-bar': { bgcolor: theme.palette.success.main, borderRadius: 4 }
                    }}
                  />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">Pending</Typography>
                    <Typography variant="body2" fontWeight={600}>{stats.pendingApproval}</Typography>
                  </Stack>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.filledTimesheets > 0 ? (stats.pendingApproval / stats.filledTimesheets) * 100 : 0}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      '& .MuiLinearProgress-bar': { bgcolor: theme.palette.warning.main, borderRadius: 4 }
                    }}
                  />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">Rejected</Typography>
                    <Typography variant="body2" fontWeight={600}>{stats.rejectedTimesheets}</Typography>
                  </Stack>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.filledTimesheets > 0 ? (stats.rejectedTimesheets / stats.filledTimesheets) * 100 : 0}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      '& .MuiLinearProgress-bar': { bgcolor: theme.palette.error.main, borderRadius: 4 }
                    }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </div>

        {/* Project Stats Table */}
        <div className="col-span-12 md:col-span-8">
          <Card sx={{ height: '100%', borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={700}>
                  Project Breakdown
                </Typography>
                <Chip 
                  label={`${stats.projectStats?.length || 0} Active Projects`} 
                  size="small" 
                  sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}
                />
              </Stack>
              
              <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>PROJECT</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary' }}>EMPLOYEES</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary' }}>SUBMITTED</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary' }}>DRAFTS</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>PROGRESS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.projectStats && stats.projectStats.length > 0 ? (
                      stats.projectStats.map((project) => {
                        const totalTimesheets = project.filled + project.notFilled;
                        const progress = totalTimesheets > 0 
                          ? Math.round((project.filled / totalTimesheets) * 100) 
                          : 0;
                        return (
                          <TableRow key={project.projectId} hover>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Avatar 
                                  sx={{ 
                                    width: 32, 
                                    height: 32, 
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main
                                  }}
                                >
                                  <FolderIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Typography variant="body2" fontWeight={600}>
                                  {project.projectName}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight={500}>
                                {project.totalAssigned}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={project.filled} 
                                size="small" 
                                sx={{ 
                                  bgcolor: alpha(theme.palette.success.main, 0.1), 
                                  color: theme.palette.success.main,
                                  fontWeight: 600,
                                  minWidth: 40
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={project.notFilled} 
                                size="small" 
                                sx={{ 
                                  bgcolor: project.notFilled > 0 ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.success.main, 0.1), 
                                  color: project.notFilled > 0 ? theme.palette.warning.main : theme.palette.success.main,
                                  fontWeight: 600,
                                  minWidth: 40
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ minWidth: 150 }}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Box sx={{ flexGrow: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={progress}
                                    sx={{ 
                                      height: 8, 
                                      borderRadius: 4,
                                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                                      '& .MuiLinearProgress-bar': { 
                                        bgcolor: progress === 100 ? theme.palette.success.main : theme.palette.primary.main,
                                        borderRadius: 4 
                                      }
                                    }}
                                  />
                                </Box>
                                <Typography variant="caption" fontWeight={600} sx={{ minWidth: 35 }}>
                                  {progress}%
                                </Typography>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No active projects found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </Box>
  );
};

export default AdminDashboardOverview;
