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
  Drawer,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import GroupIcon from '@mui/icons-material/Group';
import EventIcon from '@mui/icons-material/Event';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ApprovalDashboard from './ApprovalDashboard';
import MyTeamView from '../mocules/MyTeamView';
import ScheduleMeetingPage from './ScheduleMeetingPage';
import MyProjectsView from '../mocules/MyProjectsView';

const DRAWER_WIDTH = 280;

const ProjectManagerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Timesheet Approvals', icon: <FactCheckIcon />, index: 0 },
    { text: 'My Team', icon: <GroupIcon />, index: 1 },
    { text: 'My Projects', icon: <BusinessOutlinedIcon />, index: 2 },
    { text: 'Schedule Meeting', icon: <EventIcon />, index: 3 },
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

  const renderContent = () => {
    switch (tabIndex) {
      case 0: return <ApprovalDashboard />;
      case 1: return <MyTeamView />;
      case 2: return <MyProjectsView />;
      case 3: return <ScheduleMeetingPage />;
      default: return <ApprovalDashboard />;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
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

export default ProjectManagerDashboard;