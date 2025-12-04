import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import LoginForm from './LoginForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import ResetPasswordForm from './ResetPasswordForm';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const Login: React.FC = () => {
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
  const [emailForReset, setEmailForReset] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleForgotPasswordClick = () => {
    setView('forgot');
  };

  const handleCodeSent = (email: string) => {
    setEmailForReset(email);
    setView('reset');
  };

  const handleBackToLogin = () => {
    setView('login');
  };

  const InfoItem = ({ text }: { text: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, opacity: 0.9 }}>
      <CheckCircleOutlineIcon sx={{ color: '#4fc3f7' }} />
      <Typography variant="body1" fontWeight="500">{text}</Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      {/* Left Panel - Branding */}
      {!isMobile && (
        <Box sx={{
          width: '400px',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #0066A4 0%, #004e7c 100%)',
          color: 'white',
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 10
        }}>
          <Box>
            <Box
              sx={{
                mb: 4,
                transform: 'translateY(0)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                },
              }}
            >
              <img src="./white_logo.png" alt="Key Business Solutions" style={{ height: 70, maxWidth: '100%', objectFit: 'contain' }} />
            </Box>
            <Typography variant="h4" fontWeight="800" sx={{ mb: 2, letterSpacing: '-1px' }}>
              Welcome<br />
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 400, mb: 6 }}>
              Sign in to Employee Portal
            </Typography>

            {/* <Box>
              <InfoItem text="Secure Access" />
              <InfoItem text="Timesheet Management" />
              <InfoItem text="Project Tracking" />
            </Box> */}
          </Box>

          <Typography variant="caption" sx={{ opacity: 0.5 }}>
            © 2025 Key Business Solutions. All rights reserved.
          </Typography>
        </Box>
      )}

      {/* Right Panel - Form */}
      <Box sx={{ 
        flex: 1, 
        ml: { xs: 0, md: '400px' }, 
        p: { xs: 2, md: 6, lg: 10 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ width: '100%', maxWidth: '450px' }}>
          <Fade in={true} timeout={800}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: { xs: 3, sm: 5 }, 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 3,
                bgcolor: 'white'
              }}
            >
              {/* Mobile Logo */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 4 }}>
                <img src="./KeyLogo.png" alt="Key Business Solutions" style={{ height: 60 }} />
              </Box>

              {view === 'login' && <LoginForm onForgotPasswordClick={handleForgotPasswordClick} />}
              {view === 'forgot' && <ForgotPasswordForm onCodeSent={handleCodeSent} onBackToLogin={handleBackToLogin} />}
              {view === 'reset' && <ResetPasswordForm email={emailForReset} onPasswordReset={handleBackToLogin} />}
            </Paper>
          </Fade>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;