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

  return (
    <Box className="w-full">
      <Box
        className="rounded-2xl border border-slate-200 bg-white shadow-lg"
        sx={{ overflow: 'hidden' }}
      >
        <Box className="bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-5">
          <Typography
            component="h1"
            variant="h5"
            className="text-white font-semibold"
          >
            Forgot Password
          </Typography>
          <Typography variant="body2" className="text-sky-50 mt-1">
            Enter your email and we’ll send a reset code. Employees can also reach support if you’re stuck.
          </Typography>
        </Box>

        <Box className="grid grid-cols-1 lg:grid-cols-5 gap-0">
          <Box className="lg:col-span-3 px-6 py-6">
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                {success}
              </Alert>
            )}
            <Box
              component="form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Work Email"
                name="email"
                autoComplete="email"
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                className="h-12 rounded-xl text-sm font-semibold"
                sx={{
                  background: 'linear-gradient(90deg, #0ea5e9, #2563eb)',
                  '&:hover': { background: 'linear-gradient(90deg, #0284c7, #1d4ed8)' },
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Send Reset Code'}
              </Button>
              <Box className="text-center">
                <Button
                  onClick={onBackToLogin}
                  size="small"
                  className="text-slate-600 hover:text-slate-900"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Back to Login
                </Button>
              </Box>
            </Box>
          </Box>

          <Box className="lg:col-span-2 bg-slate-50 border-t border-l border-slate-200 px-6 py-6 flex flex-col gap-4">
            <Typography variant="subtitle2" className="text-slate-700 font-semibold">
              Support
            </Typography>
            <Typography variant="body2" className="text-slate-600 leading-relaxed">
              Employee dashboard support is here to help. If you hit any trouble or need an update, ping us anytime.
            </Typography>
            <Box className="space-y-2">
              <Box className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <Typography variant="caption" className="text-slate-500 uppercase tracking-wide">
                  Email
                </Typography>
                <Typography variant="body1" className="text-slate-800 font-semibold">
                  jagadeeshkrishna1729@gmail.com
                </Typography>
              </Box>
              <Box className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <Typography variant="caption" className="text-slate-500 uppercase tracking-wide">
                  WhatsApp
                </Typography>
                <Typography variant="body1" className="text-slate-800 font-semibold">
                  +1 806 451 8773
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ForgotPasswordForm;
