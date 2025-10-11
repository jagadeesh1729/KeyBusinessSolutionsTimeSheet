import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../mocules/Header'; // Assuming you have or will create a Header component

const Layout = () => {
  const location = useLocation();

  // Hide layout for login/signup pages
  const noLayoutRoutes = ['/signup'];
  if (noLayoutRoutes.includes(location.pathname)) {
    return <Outlet />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header can be added here if you have one */}
      <Header />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{ flexGrow: 1 }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;