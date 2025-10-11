import { useState } from 'react';
import { TextField, Typography, Alert, Link, Box } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import ButtonComp from '../atoms/Button';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

interface LoginFormProps {
  onForgotPasswordClick: () => void;
}

const LoginForm = ({ onForgotPasswordClick }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setError('');
    //{"success":true,"message":"Login successful","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoicmFqQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1OTc3ODg3OCwiZXhwIjoxNzU5NzgyNDc4fQ.wOyyNLL4h0m4tLsOQdFMyULOfu5y2z-6kq97RPoaMa4","user":{"id":1,"name":"Rajan","email":"raj@gmail.com","role":"admin"}}
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user: backendUser, token } = response.data;

      // Map the backend user object to the frontend User interface
      const user = {
        userId: backendUser.id.toString(),
        email: backendUser.email,
        name: backendUser.name,
        role: backendUser.role,
        no_of_hours: backendUser.no_of_hours || 0,
      };

      // Use the login function from AuthContext to store user and token
      login(user, token);

      // Redirect based on user role from the API response
      if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (user.role === 'project_manager') {
        navigate('/pm-dashboard');
      } else {
        navigate('/employee-dashboard');
      }
    } catch (err: any) {
      // Set error message from the API response, or a generic one
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      console.error('Login error:', err);
    }
  };

  return (
    <>
      <Typography component="h1" variant="h4" align="center" sx={{ mb: 2 }}>
        Sign in
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        label="Email"
        type="email"
        fullWidth
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <ButtonComp text="Sign In" variant="contained" onClick={handleLogin} sx={{ mt: 3, mb: 2, px: 5 }} />
      </Box>
      <div className="flex justify-between w-full">
        <Link component="button" variant="body2" onClick={onForgotPasswordClick}>
          Forgot password?
        </Link>
        <Link component={RouterLink} to="/signup" variant="body2">
          {"Don't have an account? Sign Up"}
        </Link>
      </div>
    </>
  );
};

export default LoginForm;