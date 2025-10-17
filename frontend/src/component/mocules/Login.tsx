import React, { useState } from 'react';
import { Box, Paper, Container } from '@mui/material';
import LoginForm from './LoginForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import ResetPasswordForm from './ResetPasswordForm';

const Login: React.FC = () => {
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
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={6}
        sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 4, borderRadius: 2 }}
      >
        {view === 'login' && <LoginForm onForgotPasswordClick={handleForgotPasswordClick} />}
        {view === 'forgot' && <ForgotPasswordForm onCodeSent={handleCodeSent} onBackToLogin={handleBackToLogin} />}
        {view === 'reset' && <ResetPasswordForm email={emailForReset} onPasswordReset={handleBackToLogin} />}
      </Paper>
    </Container>
  );
};

export default Login;