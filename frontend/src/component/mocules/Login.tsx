import { useState } from 'react';
import { Box, Paper } from '@mui/material';
import LoginForm from './LoginForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import ResetPasswordForm from './ResetPasswordForm';

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
    <Box className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Paper elevation={3} className="p-8 w-full max-w-md">
        {view === 'login' && <LoginForm onForgotPasswordClick={handleForgotPasswordClick} />}
        {view === 'forgot' && <ForgotPasswordForm onCodeSent={handleCodeSent} onBackToLogin={handleBackToLogin} />}
        {view === 'reset' && <ResetPasswordForm email={emailForReset} onPasswordReset={handleBackToLogin} />}
      </Paper>
    </Box>
  );
};

export default Login