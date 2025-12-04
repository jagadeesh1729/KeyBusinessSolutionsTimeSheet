import { useState } from "react";
import EmployeeForm from "./EmployeeForm";
import { Box, Button, TextField, Typography, Paper, Container } from "@mui/material";
import LockIcon from '@mui/icons-material/Lock';

const SignupGate = () => {
  const [pin, setPin] = useState("");
  const [verified, setVerified] = useState(false);

  // You can store this in .env (VITE_INVITE_PIN) if using Vite
  const SECRET_PIN = "12345"; // e.g. "1234"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === SECRET_PIN) {
      setVerified(true);
    } else {
      alert("Invalid PIN. Please contact admin.");
    }
  };

  if (verified) {
    return <EmployeeForm />;
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}
    >
      <Container maxWidth="xs">
        <Paper 
          elevation={10} 
          sx={{ 
            p: 4, 
            borderRadius: 4, 
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            bgcolor: 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <Box sx={{ 
            width: 60, 
            height: 60, 
            borderRadius: '50%', 
            bgcolor: 'rgba(0, 102, 164, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mx: 'auto',
            mb: 2
          }}>
            <LockIcon sx={{ fontSize: 30, color: '#0066A4' }} />
          </Box>
          
          <Typography variant="h5" fontWeight="700" sx={{ mb: 1, color: '#2c3e50' }}>
            Access Required
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Please enter the access PIN provided by your administrator to continue.
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              label="Enter Access PIN"
              variant="outlined"
              sx={{ mb: 3 }}
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                py: 1.5,
                background: 'linear-gradient(90deg, #0066A4 0%, #00BCE4 100%)',
                fontWeight: 'bold',
                boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #005282 0%, #009bc2 100%)',
                }
              }}
            >
              Verify & Continue
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default SignupGate;
