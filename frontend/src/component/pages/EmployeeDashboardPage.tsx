import { useState, useEffect, useMemo } from 'react';
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
  Chip,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Grid,
  CircularProgress,
  Alert,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import DraftsIcon from '@mui/icons-material/Drafts';
import HistoryIcon from '@mui/icons-material/History';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // This was causing an error as tabIndex was not defined
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import ButtonComp from '../atoms/Button';
import type { Timesheet } from '../types/Holiday';
import EmployeeProfileView from '../mocules/EmployeeProfileView';
import TimesheetDetailModal from '../mocules/TimesheetDetailModal';
import TimesheetEntry from './UserTimesheetEntry';
import TimesheetHistory from './TimesheetHistory';
import PreviousDrafts from './PreviousDrafts';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import type Employee from '../types/employee';
import { useEmployeeTimesheets } from '../hooks/useEmployeeTimesheets';

const EmployeeDashboardPage = () => {
  const { user } = useAuth();
  const { timesheets: recentTimesheets, loading: timesheetsLoading, error: timesheetsError } = useEmployeeTimesheets();
  const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.userId) {
        try {
          setProfileLoading(true);
          // The /users endpoint is protected. Use the /auth/profile endpoint instead.
          const response = await apiClient.get(`/auth/profile`); // This endpoint should return the logged-in user's profile
          const profileData = response.data?.data?.user || response.data?.user || response.data;
          console.log("Fetched profile data:", profileData);
          if (profileData) {
            setEmployeeProfile(profileData);
          }
        } catch (error) {
          console.error("Failed to fetch employee profile", error);
        } finally {
          setProfileLoading(false);
        }
      }
    };
    fetchProfile();
  }, [user?.userId]);

  const handleViewDetails = (timesheet: Timesheet) => {
    setSelectedTimesheet(timesheet);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTimesheet(null);
  };

  const tabValue = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/employee/drafts')) return 1;
    if (path.includes('/employee/history')) return 2;
    if (path.includes('/employee/profile')) return 3;
    // Default to current timesheet for /employee/timesheet and /employee/timesheet/edit/*
    return 0;
  }, [location.pathname]);

  // Special case for profile view, which is not a separate component in this layout
  const isProfileTab = tabValue === 3;
  const ProfileComponent = (
    <EmployeeProfileView employee={employeeProfile} />
  );
  
  return (
    <Box sx={{ p: 3, bgcolor: 'grey.100', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', height: 'calc(100vh - 48px)' }}>
        {/* Sidebar Navigation */}
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={tabValue}
          aria-label="Employee dashboard vertical tabs"
          sx={{
            borderRight: 1, borderColor: 'divider', minWidth: 260, bgcolor: 'background.paper',
            boxShadow: 3, borderRadius: 2, p: 1,
            '& .MuiTabs-indicator': { left: 0, width: '4px', borderRadius: '4px' },
          }}
        >
          <Tab icon={<EditCalendarIcon />} iconPosition="start" label="Current Timesheet" sx={{ justifyContent: 'flex-start', mb: 1 }} component={RouterLink} to="/employee/timesheet" />
          <Tab icon={<DraftsIcon />} iconPosition="start" label="Drafts" sx={{ justifyContent: 'flex-start', mb: 1 }} component={RouterLink} to="/employee/drafts" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Timesheet History" sx={{ justifyContent: 'flex-start', mb: 1 }} component={RouterLink} to="/employee/history" />
          <Tab icon={<AccountCircleIcon />} iconPosition="start" label="My Profile" sx={{ justifyContent: 'flex-start', mb: 1 }} component={RouterLink} to="/employee/profile" />
        </Tabs>

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1, ml: 3 }}>
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3, height: '100%', overflow: 'auto' }}>
            {isProfileTab ? (
              <Box sx={{ p: 3 }}>
              <Typography variant="h4" component="h1" fontWeight="bold" color="text.primary" gutterBottom>
                My Profile
              </Typography>
              <Paper sx={{ p: 4, mt: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                {profileLoading ? <CircularProgress /> : <EmployeeProfileView employee={employeeProfile} />}
              </Paper>
              </Box>
            ) : (
              <Outlet />
            )}
          </Box>
        </Box>
      </Box>
      <TimesheetDetailModal open={isModalOpen} onClose={handleCloseModal} timesheet={selectedTimesheet} />
    </Box>
  );
};

export default EmployeeDashboardPage;