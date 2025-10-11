import { useState } from 'react';
import { TextField, Typography, Alert, Grid, Link } from '@mui/material';
import ButtonComp from '../atoms/Button';
import apiClient from '../../api/apiClient';

interface ForgotPasswordFormProps {
  onCodeSent: (email: string) => void;
  onBackToLogin: () => void;
}

const ForgotPasswordForm = ({ onCodeSent, onBackToLogin }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      setError('Email is required.');
      return;
    }
    setError('');
    setMessage('');
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
      // Wait a moment for the user to read the message, then switch views
      setTimeout(() => onCodeSent(email), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Typography component="h1" variant="h4" align="center" sx={{ mb: 2 }}>
        Forgot Password
      </Typography>
      <Typography align="center" color="text.secondary" sx={{ mb: 2 }}>
        Enter your email and we'll send you a code to reset your password.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      <TextField
        label="Email"
        type="email"
        fullWidth
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <ButtonComp
        text={isLoading ? 'Sending...' : 'Send Code'}
        variant="contained"
        onClick={handleSendCode}
        disabled={isLoading}
        fullWidth
        sx={{ mt: 3, mb: 2 }}
      />
      <Grid container justifyContent="flex-end">
        <Grid item>
          <Link component="button" variant="body2" onClick={onBackToLogin}>Back to Sign In</Link>
        </Grid>
      </Grid>
    </>
  );
};

export default ForgotPasswordForm;