import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import apiClient from '../../api/apiClient';

interface ForgotPasswordFormProps {
  onCodeSent: (email: string) => void;
  onBackToLogin: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onCodeSent, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      setSuccess(response.data.message || 'A reset code has been sent to your email.');
      // Wait a moment before switching views to allow user to read the message
      setTimeout(() => onCodeSent(email), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const friendlyError = error
    ? (() => {
        const msg = error.toString();
        if (/network/i.test(msg)) return 'Network issue. Please check your connection and try again.';
        if (/invalid|not found/i.test(msg)) return 'We could not find that email. Double-check and try again.';
        return 'We could not send the reset code. Please try again or contact support if it continues.';
      })()
    : null;

  return (
    <>
      <Typography component="h1" variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
        Forgot Password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enter your email and we'll send you a code to reset your password.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {friendlyError}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
          {success}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          inputProps={{ 'data-no-pascal': true }}
        />
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Send Reset Code'}
        </Button>
        <Box textAlign="center">
          <Button onClick={onBackToLogin} size="small" sx={{ textTransform: 'none' }}>
            Back to Login
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default ForgotPasswordForm;
