import { Box, Typography, Paper, Link } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const SupportPage = () => {
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SupportAgentIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Support
          </Typography>
        </Box>

        <Typography variant="body1" paragraph>
          Need help? Our support team is here to assist you with any questions or issues you may have.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Contact Information
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <EmailIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Email Support
              </Typography>
              <Link href="mailto:support@keybusinessglobal.com" underline="hover">
                support@keybusinessglobal.com
              </Link>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <PhoneIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Phone Support
              </Typography>
              <Typography variant="body1">
                +1 (XXX) XXX-XXXX
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Common Topics
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Timesheet submission and approval
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Project assignments
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Account issues
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Technical support
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM EST
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default SupportPage;
