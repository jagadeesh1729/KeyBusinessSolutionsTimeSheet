import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Stack,
  useTheme,
  useMediaQuery,
  IconButton,
  Drawer,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import DraftsIcon from '@mui/icons-material/Drafts';
import HistoryIcon from '@mui/icons-material/History';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { Timesheet } from '../types/Holiday';
import EmployeeProfileView from '../mocules/EmployeeProfileView';
import TimesheetDetailModal from '../mocules/TimesheetDetailModal';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import type Employee from '../types/employee';
import { useEmployeeTimesheets } from '../hooks/useEmployeeTimesheets';

const DRAWER_WIDTH = 280;

const EmployeeDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

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
          const response = await apiClient.get(`/auth/profile`);
          const profileData = response.data?.data?.user || response.data?.user || response.data;
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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTimesheet(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Current Timesheet', icon: <EditCalendarIcon />, path: '/employee/timesheet' },
    { text: 'Pending Timesheets', icon: <DraftsIcon />, path: '/employee/drafts' },
    { text: 'Past Timesheets', icon: <HistoryIcon />, path: '/employee/history' },
    { text: 'My Profile', icon: <AccountCircleIcon />, path: '/employee/profile' },
    { text: 'Support', icon: <SupportAgentIcon />, path: '/employee/support' },
  ];

  const isProfileTab = location.pathname.includes('/employee/profile');
  const isSupportTab = location.pathname.includes('/employee/support');

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'white' }}>
      {/* Logo Area */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img 
          src="/white_logo.png" 
          alt="Key Business Solutions" 
          style={{ height: 50, width: 'auto', maxWidth: '100%' }} 
        />
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Navigation */}
      <List sx={{ px: 2, py: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname.includes(item.path) || (item.path === '/employee/timesheet' && location.pathname === '/employee');
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={isActive}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                    '& .MuiListItemIcon-root': { color: '#4fc3f7' },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                    color: 'white',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? '#4fc3f7' : 'rgba(255,255,255,0.5)', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: isActive ? 600 : 400 }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* User Profile Summary */}
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: '#4fc3f7', color: '#004e7c', fontWeight: 'bold' }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap fontWeight="bold">
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="caption" display="block" noWrap sx={{ opacity: 0.7 }}>
              {user?.email}
            </Typography>
          </Box>
        </Stack>
        <ListItemButton 
          onClick={handleLogout}
          sx={{ 
            borderRadius: 2, 
            color: '#ffcdd2', 
            '&:hover': { bgcolor: 'rgba(255, 0, 0, 0.1)' } 
          }}
        >
          <ListItemIcon sx={{ color: '#ffcdd2', minWidth: 40 }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: '0.9rem' }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      {/* Mobile Header */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 64,
            bgcolor: 'white',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            px: 2,
            boxShadow: 1,
          }}
        >
          <IconButton onClick={handleDrawerToggle} edge="start" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <img src="/KeyLogo.png" alt="Logo" style={{ height: 32 }} />
        </Box>
      )}

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              background: 'linear-gradient(180deg, #0066A4 0%, #004e7c 100%)',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              background: 'linear-gradient(180deg, #0066A4 0%, #004e7c 100%)',
              borderRight: 'none',
              boxShadow: '4px 0 24px rgba(0,0,0,0.05)'
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: { xs: 8, md: 0 },
          overflowX: 'hidden'
        }}
      >
        {isProfileTab ? (
          <Box>
            <Paper elevation={0} sx={{ p: 0, bgcolor: 'transparent' }}>
              {profileLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <EmployeeProfileView employee={employeeProfile} />
              )}
            </Paper>
          </Box>
        ) : isSupportTab ? (
          <Box>
            <Paper elevation={2} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
              <Stack spacing={3}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <SupportAgentIcon sx={{ fontSize: 64, color: '#0066A4', mb: 2 }} />
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Need Help?
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    We're here to assist you! If you're experiencing any issues or need updates to your timesheet, feel free to reach out.
                  </Typography>
                </Box>

                <Divider />

                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#0066A4', width: 48, height: 48 }}>
                      <EmailIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Email Support
                      </Typography>
                      <Typography 
                        variant="body1" 
                        component="a" 
                        href="mailto:jagadeeshkrishna1729@gmail.com"
                        sx={{ 
                          color: '#0066A4', 
                          textDecoration: 'none',
                          fontWeight: 500,
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        jagadeeshkrishna1729@gmail.com
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#25D366', width: 48, height: 48 }}>
                      <WhatsAppIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        WhatsApp
                      </Typography>
                      <Typography 
                        variant="body1" 
                        component="a" 
                        href="https://wa.me/18064518773"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                          color: '#25D366', 
                          textDecoration: 'none',
                          fontWeight: 500,
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        +1 (806) 451-8773
                      </Typography>
                    </Box>
                  </Box>
                </Stack>

                <Divider />

                <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    💡 <strong>Quick Tip:</strong> For faster assistance, please include your employee ID and a brief description of your issue when contacting support.
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>
        ) : (
          <Outlet />
        )}
      </Box>

      <TimesheetDetailModal open={isModalOpen} onClose={handleCloseModal} timesheet={selectedTimesheet} />
    </Box>
  );
};

export default EmployeeDashboardPage;
