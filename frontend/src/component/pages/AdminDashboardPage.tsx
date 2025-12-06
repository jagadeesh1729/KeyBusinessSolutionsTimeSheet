import { useState } from 'react';
import {
  Box,
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
  Typography,
  Badge
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import GroupIcon from '@mui/icons-material/Group';
import RateReviewIcon from '@mui/icons-material/RateReview';
import EmailIcon from '@mui/icons-material/Email';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DescriptionIcon from '@mui/icons-material/Description';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEmployeeReviewCount } from '../hooks/useEmployeeReviewCount';
import { useExpiryWatchlistCount } from '../hooks/useExpiryWatchlistCount';

import AdminDashboardOverview from '../mocules/AdminDashboardOverview';
import AdminApprovalDashboard from './AdminApprovalDashboard';
import ProjectsView from '../mocules/ProjectsView';
import ProjectManagerView from '../mocules/ProjectManagerView';
import EmployeeView from '../mocules/EmployeeView';
import EmployeeReviewView from '../mocules/EmployeeReviewView';
import SendEmailView from '../mocules/SendEmailView';
import ExpiryWatchlist from '../mocules/ExpiryWatchlist';
import AdminOfferLetterPanel from '../offerletter/AdminOfferLetterPanel';
import AdminMeetingsView from '../mocules/AdminMeetingsView';

const DRAWER_WIDTH = 280;

const AdminDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const reviewCount = useEmployeeReviewCount();
  const expiryCount = useExpiryWatchlistCount();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, index: 0 },
    { text: 'Timesheets', icon: <FactCheckIcon />, index: 1 },
    { text: 'Projects', icon: <AccountTreeIcon />, index: 2 },
    { text: 'Project Managers', icon: <SupervisorAccountIcon />, index: 3 },
    { text: 'Employees', icon: <GroupIcon />, index: 4 },
    { 
      text: 'Profile Reviews', 
      icon: <RateReviewIcon />, 
      index: 5,
      badge: reviewCount 
    },
    { text: 'Emails', icon: <EmailIcon />, index: 6 },
    { text: 'Offer Letters', icon: <DescriptionIcon />, index: 7 },
    { text: 'Expirations', icon: <WarningAmberIcon />, index: 8, badge: expiryCount },
    { text: 'Meetings', icon: <VideoCallIcon />, index: 9 },
  ];

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
          const isActive = tabIndex === item.index;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  setTabIndex(item.index);
                  if (isMobile) setMobileOpen(false);
                }}
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
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
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

  const renderContent = () => {
    switch (tabIndex) {
      case 0: return <AdminDashboardOverview />;
      case 1: return <AdminApprovalDashboard />;
      case 2: return <ProjectsView />;
      case 3: return <ProjectManagerView />;
      case 4: return <EmployeeView />;
      case 5: return <EmployeeReviewView />;
      case 6: return <SendEmailView />;
      case 7: return <AdminOfferLetterPanel />;
      case 8: return <ExpiryWatchlist />;
      case 9: return <AdminMeetingsView />;
      default: return <AdminDashboardOverview />;
    }
  };

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
          <img src="/white_logo.png" alt="Logo" style={{ height: 32 }} />
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
        <Box>
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboardPage;
