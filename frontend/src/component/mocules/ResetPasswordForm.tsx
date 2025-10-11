import { useState, useEffect } from 'react';
import { TextField, Typography, Alert } from '@mui/material';
import ButtonComp from '../atoms/Button';
import apiClient from '../../api/apiClient';

interface ResetPasswordFormProps {
  email: string;
  onPasswordReset: () => void;
}

const ResetPasswordForm = ({ email, onPasswordReset }: ResetPasswordFormProps) => {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!code || !newPassword) {
      setError('Code and new password are required.');
      return;
    }
    setError('');
    setMessage('');
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/reset-password', { email, code, newPassword });
      setMessage(response.data.message);
      // Wait a moment, then switch back to the login view
      setTimeout(() => onPasswordReset(), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup setTimeout on component unmount
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (message) {
      timer = setTimeout(() => onPasswordReset(), 2000);
    }
    return () => clearTimeout(timer);
  }, [message, onPasswordReset]);

  return (
    <>
      <Typography component="h1" variant="h4" align="center" sx={{ mb: 2 }}>
        Reset Password
      </Typography>
      <Typography align="center" color="text.secondary" sx={{ mb: 2 }}>
        Enter the code sent to <strong>{email}</strong> and your new password.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      <TextField
        label="Reset Code"
        fullWidth
        margin="normal"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <TextField
        label="New Password"
        type="password"
        fullWidth
        margin="normal"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <ButtonComp
        text={isLoading ? 'Resetting...' : 'Reset Password'}
        variant="contained"
        onClick={handleResetPassword}
        disabled={isLoading}
        fullWidth
        sx={{ mt: 3, mb: 2 }}
      />
    </>
  );
};

export default ResetPasswordForm;