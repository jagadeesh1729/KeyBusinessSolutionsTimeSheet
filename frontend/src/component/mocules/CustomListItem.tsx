
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import LogoutIcon from '@mui/icons-material/Logout';
import { Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CustomListItem = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderAdminLinks = () => (
    <>
      <ListItem onClick={() => navigate("/")} className='cursor-pointer'>
        <ListItemIcon><DashboardIcon color='primary' /></ListItemIcon>
        <ListItemText primary="Dashboard" />
      </ListItem>
    </>
  );

  const renderPMLinks = () => (
    <>
      <ListItem onClick={() => navigate("/pm-dashboard")} className='cursor-pointer'>
        <ListItemIcon><DashboardIcon color='primary' /></ListItemIcon>
        <ListItemText primary="Dashboard" />
      </ListItem>
      <ListItem onClick={() => navigate("/pm-schedule-meeting")} className='cursor-pointer'>
        <ListItemIcon><EventIcon color='primary' /></ListItemIcon>
        <ListItemText primary="Schedule Meeting" />
      </ListItem>
    </>
  );

  const renderEmployeeLinks = () => (
    <>
      <ListItem onClick={() => navigate("/employee-dashboard")} className='cursor-pointer'>
        <ListItemIcon><DashboardIcon color='primary' /></ListItemIcon>
        <ListItemText primary="Dashboard" />
      </ListItem>
      <ListItem onClick={() => navigate("/timesheet")} className='cursor-pointer'>
        <ListItemIcon><AssignmentIcon color='primary' /></ListItemIcon>
        <ListItemText primary="My Timesheet" />
      </ListItem>
    </>
  );

  return (
    <div>
      <List>
        {user?.role === 'admin' && renderAdminLinks()}
        {user?.role === 'project_manager' && renderPMLinks()}
        {user?.role === 'employee' && renderEmployeeLinks()}
        {user && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem onClick={handleLogout} className='cursor-pointer'>
              <ListItemIcon><LogoutIcon color='error' /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </>
        )}
      </List>
    </div>
  )
}

export default CustomListItem