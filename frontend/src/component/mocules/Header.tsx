import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setAnchorEl(null);
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    const nameParts = [user.first_name, user.last_name].filter(Boolean);
    if (nameParts.length > 0) {
      return nameParts.join(' ');
    }
    return user.name || '';
  };

  const getInitials = () => {
    const displayName = getUserDisplayName();
    const matches = displayName.match(/\b\w/g) || [];
    return matches.slice(0, 2).join('').toUpperCase();
  };

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Projects', path: '/projects' },
    { label: 'Timesheets', path: '/timesheets' },
    { label: 'Team', path: '/team' },
  ];

  return (
    <AppBar
      position="sticky"
      elevation={2}
      sx={{
        bgcolor: '#0066A4',
        borderBottom: '4px solid #00BCE4',
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 3 }, py: 1 }}>
        <Box
          component={Link}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            flexGrow: 1,
          }}
        >
          <Box
            component="img"
            src="./KeyLogo.png"
            alt="Key Business Solutions"
            sx={{
              height: { xs: 40, md: 48 },
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' },
            }}
          />
        </Box>

        {!isSmall && user && (
          <Box sx={{ display: 'flex', gap: 1, mx: 3 }}>
            {navItems.map((item) => (
              <Button
                key={item.label}
                component={Link}
                to={item.path}
                color="inherit"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {user ? (
            <>
              {!isSmall && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'white',
                    fontWeight: 500,
                    mr: 1,
                  }}
                >
                  {getUserDisplayName()}
                </Typography>
              )}
              <Box
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { transform: 'scale(1.05)', transition: 'all 0.2s' },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: '#00BCE4',
                    color: '#0066A4',
                    fontWeight: 'bold',
                    width: 40,
                    height: 40,
                    border: '2px solid white',
                  }}
                >
                  {getInitials()}
                </Avatar>
              </Box>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  elevation: 3,
                  sx: { borderTop: '3px solid #00BCE4', mt: 1.5 },
                }}
              >
                <MenuItem disabled>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0066A4' }}>
                    {getUserDisplayName()}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: '#d32f2f' }}>
                  <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              component={Link}
              to="/login"
              variant="contained"
              sx={{
                bgcolor: '#00BCE4',
                color: 'white',
                fontWeight: 'bold',
                textTransform: 'none',
                '&:hover': { bgcolor: '#00A8D8' },
              }}
            >
              Login
            </Button>
          )}
          {isSmall && user && (
            <IconButton
              color="inherit"
              onClick={(e) => setMobileMenuAnchor(e.currentTarget)}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Box>

        {isSmall && (
          <Menu
            anchorEl={mobileMenuAnchor}
            open={Boolean(mobileMenuAnchor)}
            onClose={() => setMobileMenuAnchor(null)}
          >
            {navItems.map((item) => (
              <MenuItem
                key={item.label}
                component={Link}
                to={item.path}
                onClick={() => setMobileMenuAnchor(null)}
              >
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
