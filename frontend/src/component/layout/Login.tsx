import { useState } from 'react';
import { Box, Paper, Typography, CssBaseline } from '@mui/material';
import LoginForm from '../mocules/LoginForm';
import ForgotPasswordForm from '../mocules/ForgotPasswordForm';
import ResetPasswordForm from '../mocules/ResetPasswordForm';

const Login = () => {
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
  const [emailForReset, setEmailForReset] = useState('');

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

  return (
    <main className="grid grid-cols-1 sm:grid-cols-12 h-[calc(100vh-64px)]">
      <CssBaseline />
      {/* Left side with branding/image */}
      <div
        className="hidden sm:flex sm:col-span-4 md:col-span-7 bg-cover bg-center flex-col justify-end p-10 text-white"
        style={{ backgroundImage: 'url(https://source.unsplash.com/random?wallpapers)' }}
      >
        <Typography component="h1" variant="h3" sx={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
          Streamline Your Workflow.
        </Typography>
        <Typography variant="h6" sx={{ textShadow: '1px 1px 4px rgba(0,0,0,0.7)' }}>
          Efficient timesheet management starts here.
        </Typography>
      </div>

      {/* Right side with the form */}
      <div className="col-span-12 sm:col-span-8 md:col-span-5 flex items-center justify-center">
        <Paper
          elevation={6}
          square
          sx={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(to top, #f3f4f6, #ffffff)', // Subtle gradient from light gray to white
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: { xs: 2, sm: 4, md: 6 }, // Responsive padding
              width: '100%',
              maxWidth: '450px',
            }}
          >
            {view === 'login' && <LoginForm onForgotPasswordClick={handleForgotPasswordClick} />}
            {view === 'forgot' && <ForgotPasswordForm onCodeSent={handleCodeSent} onBackToLogin={handleBackToLogin} />}
            {view === 'reset' && <ResetPasswordForm email={emailForReset} onPasswordReset={handleBackToLogin} />}
          </Box>
        </Paper>
      </div>
    </main>
  );
};

export default Login