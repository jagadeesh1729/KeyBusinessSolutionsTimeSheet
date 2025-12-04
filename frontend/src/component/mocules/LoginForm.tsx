import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import apiClient from '../../api/apiClient';

interface LoginFormProps {
  onForgotPasswordClick: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onForgotPasswordClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { success, message, user, token } = response.data;

      if (success && user && token) {
        login(user, token);
        switch (user.role) {
          case 'admin':
            navigate('/admin', { replace: true });
            break;
          case 'project_manager':
            navigate('/pm-dashboard', { replace: true });
            break;
          case 'employee':
            navigate('/employee', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      } else {
        setError(message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: '#0066A4' }}>
        Sign In
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Please enter your credentials to continue.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {error}
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
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': {
                borderColor: '#0066A4',
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#0066A4',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon sx={{ color: 'action.active', mr: 1 }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': {
                borderColor: '#0066A4',
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#0066A4',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: 'action.active', mr: 1 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((s) => !s)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <FormControlLabel
            control={<Checkbox value="remember" color="primary" sx={{ '&.Mui-checked': { color: '#0066A4' } }} />}
            label={<Typography variant="body2" color="text.secondary">Remember me</Typography>}
          />
          <Button
            onClick={onForgotPasswordClick}
            size="small"
            sx={{ textTransform: 'none', color: '#0066A4', fontWeight: 600 }}
          >
            Forgot password?
          </Button>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{
            mt: 3,
            mb: 2,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #0066A4 0%, #00BCE4 100%)',
            boxShadow: '0 4px 12px rgba(0, 102, 164, 0.3)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              background: 'linear-gradient(90deg, #005282 0%, #009bc2 100%)',
              boxShadow: '0 6px 16px rgba(0, 102, 164, 0.4)',
              transform: 'translateY(-1px)',
            },
          }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <Link to="/signup" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" sx={{ color: '#0066A4', fontWeight: 500 }}>
              {"Don't have an account? Sign Up"}
            </Typography>
          </Link>
        </Box>
      </Box>
    </>
  );
};

export default LoginForm;
