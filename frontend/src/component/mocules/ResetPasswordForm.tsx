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

interface ResetPasswordFormProps {
  email: string;
  onPasswordReset: () => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ email, onPasswordReset }) => {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/auth/reset-password', { email, code, newPassword });
      setSuccess(response.data.message || 'Password has been reset successfully!');
      setTimeout(() => onPasswordReset(), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography component="h1" variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
        Reset Password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enter the code sent to <strong>{email}</strong> and your new password.
      </Typography>
      {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{success}</Alert>}
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
        <TextField margin="normal" required fullWidth id="code" label="Reset Code" name="code" autoFocus value={code} onChange={(e) => setCode(e.target.value)} />
        <TextField margin="normal" required fullWidth name="newPassword" label="New Password" type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Reset Password'}
        </Button>
        <Box textAlign="center">
          <Button onClick={onPasswordReset} size="small" sx={{ textTransform: 'none' }}>
            Back to Login
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default ResetPasswordForm;