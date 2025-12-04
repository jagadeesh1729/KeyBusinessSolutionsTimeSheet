import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  ListSubheader,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Button,
  Stack,
  InputAdornment,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Send as SendIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Search as SearchIcon,
  ContentCopy as ContentCopyIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Close as CloseIcon,
  DeleteOutline as DeleteOutlineIcon
} from '@mui/icons-material';
import { useEmailRecipients } from '../hooks/useEmailRecipients';
import apiClient from '../../api/apiClient';

const SendEmailView = () => {
  const theme = useTheme();
  const { projectManagers, employees, loading, error } = useEmailRecipients();
  const [emailDetails, setEmailDetails] = useState({ 
    subject: '', 
    body: '',
    searchTerm: '',
    manualEmails: ''
  });
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [selectedNames, setSelectedNames] = useState<{[email: string]: string}>({});
  const [selectedTypes, setSelectedTypes] = useState<{[email: string]: string}>({});
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Safe data processing with null checks
  const safeProjectManagers = projectManagers?.filter(pm => pm?.email && pm?.name) || [];
  const safeEmployees = employees?.filter(emp => emp?.email && emp?.name) || [];

  // Combine all recipients for search
  const allRecipients = [
    ...safeProjectManagers.map(pm => ({ ...pm, type: 'Project Manager' })),
    ...safeEmployees.map(emp => ({ ...emp, type: 'Employee' }))
  ].filter(recipient => recipient?.email && recipient?.name);

  // Filter recipients based on search with null safety
  const filteredRecipients = allRecipients.filter(recipient => {
    const searchTerm = emailDetails.searchTerm?.toLowerCase() || '';
    const name = recipient.name?.toLowerCase() || '';
    const email = recipient.email?.toLowerCase() || '';
    
    return name.includes(searchTerm) || email.includes(searchTerm);
  });

  const handleToggleEmail = (email: string, name: string, type: string) => {
    if (!email) return;
    
    setSelectedEmails((prev) => {
      const currentIndex = prev.indexOf(email);
      const newSelected = [...prev];
      const newSelectedNames = { ...selectedNames };
      const newSelectedTypes = { ...selectedTypes };

      if (currentIndex === -1) {
        newSelected.push(email);
        newSelectedNames[email] = name;
        newSelectedTypes[email] = type;
      } else {
        newSelected.splice(currentIndex, 1);
        delete newSelectedNames[email];
        delete newSelectedTypes[email];
      }
      
      setSelectedNames(newSelectedNames);
      setSelectedTypes(newSelectedTypes);
      return newSelected;
    });
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setSelectedEmails(prev => prev.filter(email => email !== emailToRemove));
    setSelectedNames(prev => {
      const newNames = { ...prev };
      delete newNames[emailToRemove];
      return newNames;
    });
    setSelectedTypes(prev => {
      const newTypes = { ...prev };
      delete newTypes[emailToRemove];
      return newTypes;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailDetails({ ...emailDetails, [e.target.name]: e.target.value });
  };

  const handleAddManualEmails = () => {
    if (!emailDetails.manualEmails.trim()) return;

    const emails = emailDetails.manualEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return email && emailRegex.test(email) && !selectedEmails.includes(email);
      });

    if (emails.length === 0) {
      setSendError('Please enter valid email addresses separated by commas');
      return;
    }

    const newSelected = [...selectedEmails];
    const newSelectedNames = { ...selectedNames };
    const newSelectedTypes = { ...selectedTypes };

    emails.forEach(email => {
      if (!newSelected.includes(email)) {
        newSelected.push(email);
        newSelectedNames[email] = email; // Use email as name for manual entries
        newSelectedTypes[email] = 'Manual'; // Mark as manual entry
      }
    });

    setSelectedEmails(newSelected);
    setSelectedNames(newSelectedNames);
    setSelectedTypes(newSelectedTypes);
    setEmailDetails(prev => ({ ...prev, manualEmails: '' }));
    setSendError(null);
  };

  const handleSendEmail = async () => {
    setSendError(null);
    setSendSuccess(null);
    
    const allRecipients = [...selectedEmails];
    
    if (allRecipients.length === 0) {
      setSendError('Please select at least one recipient or add manual email addresses');
      return;
    }
    if (!emailDetails.subject.trim()) {
      setSendError('Please enter a subject');
      return;
    }
    if (!emailDetails.body.trim()) {
      setSendError('Please enter email content');
      return;
    }

    setIsSending(true);
    try {
      await apiClient.post('/email/send', { 
        to: allRecipients, 
        subject: emailDetails.subject, 
        html: emailDetails.body 
      });
      setSendSuccess(`Email sent successfully to ${allRecipients.length} recipient${allRecipients.length > 1 ? 's' : ''}`);
      // Reset form
      setSelectedEmails([]);
      setSelectedNames({});
      setSelectedTypes({});
      setEmailDetails({ subject: '', body: '', searchTerm: '', manualEmails: '' });
    } catch (e: any) {
      setSendError(e.response?.data?.message || 'Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedEmails([]);
    setSelectedNames({});
    setSelectedTypes({});
  };

  const handleCopyRecipients = () => {
    navigator.clipboard.writeText(selectedEmails.join(', '));
  };

  const getAvatarInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getSafeName = (name: string | null | undefined) => {
    return name || 'Unknown Name';
  };

  const getSafeEmail = (email: string | null | undefined) => {
    return email || 'No email';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1600, width: '100%', mx: 'auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={3} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight="700" color="text.primary">
            Send Email
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compose and send emails to project managers, employees, or manually added recipients
          </Typography>
        </Box>
      </Stack>

      <Box className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recipients Panel */}
        <Box className="col-span-12 lg:col-span-4">
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="700">
                  Recipients
                </Typography>
                {selectedEmails.length > 0 && (
                  <Button
                    size="small"
                    color="error"
                    onClick={handleClearSelection}
                    startIcon={<ClearIcon />}
                    sx={{ textTransform: 'none' }}
                  >
                    Clear ({selectedEmails.length})
                  </Button>
                )}
              </Stack>

              <TextField
                fullWidth
                placeholder="Search recipients..."
                name="searchTerm"
                value={emailDetails.searchTerm}
                onChange={handleInputChange}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Add Manual Recipients
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    placeholder="email@example.com"
                    name="manualEmails"
                    type='email'
                    value={emailDetails.manualEmails}
                    onChange={handleInputChange}
                    size="small"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddManualEmails();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddManualEmails}
                    disabled={!emailDetails.manualEmails.trim()}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Paper variant="outlined" sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 500, border: 'none' }}>
                <List dense disablePadding>
                  {filteredRecipients.length === 0 ? (
                    <ListItem>
                      <ListItemText 
                        primary={<Typography variant="body2" color="text.secondary" align="center">No recipients found</Typography>}
                      />
                    </ListItem>
                  ) : (
                    <>
                      {filteredRecipients.filter(r => r.type === 'Project Manager').length > 0 && (
                        <>
                          <ListSubheader sx={{ bgcolor: 'background.paper', lineHeight: '32px' }}>
                            Project Managers
                          </ListSubheader>
                          {filteredRecipients
                            .filter(recipient => recipient.type === 'Project Manager')
                            .map((recipient) => (
                              <ListItem
                                key={`${recipient.type}-${recipient.id}`}
                                component="li"
                                onClick={() => handleToggleEmail(recipient.email, recipient.name, recipient.type)}
                                sx={{ borderRadius: 1, mb: 0.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                              >
                                <Checkbox
                                  edge="start"
                                  checked={selectedEmails.includes(recipient.email)}
                                  tabIndex={-1}
                                  disableRipple
                                  size="small"
                                />
                                <ListItemText
                                  primary={
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: theme.palette.primary.main }}>
                                        {getAvatarInitials(recipient.name)}
                                      </Avatar>
                                      <Typography variant="body2" noWrap>{getSafeName(recipient.name)}</Typography>
                                    </Stack>
                                  }
                                  secondary={getSafeEmail(recipient.email)}
                                  secondaryTypographyProps={{ noWrap: true, fontSize: 11 }}
                                />
                              </ListItem>
                            ))
                          }
                        </>
                      )}

                      {filteredRecipients.filter(r => r.type === 'Employee').length > 0 && (
                        <>
                          <ListSubheader sx={{ bgcolor: 'background.paper', lineHeight: '32px' }}>
                            Employees
                          </ListSubheader>
                          {filteredRecipients
                            .filter(recipient => recipient.type === 'Employee')
                            .map((recipient) => (
                              <ListItem
                                key={`${recipient.type}-${recipient.id}`}
                                component="li"
                                onClick={() => handleToggleEmail(recipient.email, recipient.name, recipient.type)}
                                sx={{ borderRadius: 1, mb: 0.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                              >
                                <Checkbox
                                  edge="start"
                                  checked={selectedEmails.includes(recipient.email)}
                                  tabIndex={-1}
                                  disableRipple
                                  size="small"
                                />
                                <ListItemText
                                  primary={
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: theme.palette.secondary.main }}>
                                        {getAvatarInitials(recipient.name)}
                                      </Avatar>
                                      <Typography variant="body2" noWrap>{getSafeName(recipient.name)}</Typography>
                                    </Stack>
                                  }
                                  secondary={getSafeEmail(recipient.email)}
                                  secondaryTypographyProps={{ noWrap: true, fontSize: 11 }}
                                />
                              </ListItem>
                            ))
                          }
                        </>
                      )}
                    </>
                  )}
                </List>
              </Paper>
            </CardContent>
          </Card>
        </Box>

        {/* Email Composition Panel */}
        <Box className="col-span-12 lg:col-span-8">
          <Card sx={{ height: '100%', borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="700" gutterBottom>
                Compose Message
              </Typography>

              {sendError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }} onClose={() => setSendError(null)}>
                  {sendError}
                </Alert>
              )}
              {sendSuccess && (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 1 }} onClose={() => setSendSuccess(null)}>
                  {sendSuccess}
                </Alert>
              )}

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" fontWeight="600" color="text.secondary" gutterBottom>
                    TO ({selectedEmails.length})
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      minHeight: 48,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 0.5,
                      borderColor: theme.palette.divider
                    }}
                  >
                    {selectedEmails.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ p: 0.5 }}>
                        Select recipients from the list...
                      </Typography>
                    ) : (
                      selectedEmails.map((email) => (
                        <Chip
                          key={email}
                          label={selectedNames[email] || email}
                          size="small"
                          onDelete={() => handleRemoveEmail(email)}
                          avatar={
                            <Avatar sx={{ bgcolor: selectedTypes[email] === 'Manual' ? 'grey.500' : (selectedTypes[email] === 'Project Manager' ? theme.palette.primary.main : theme.palette.secondary.main) }}>
                              {selectedTypes[email] === 'Manual' ? <EmailIcon sx={{ fontSize: 12 }} /> : getAvatarInitials(selectedNames[email])}
                            </Avatar>
                          }
                          sx={{ borderRadius: 1 }}
                        />
                      ))
                    )}
                  </Paper>
                  {selectedEmails.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                      <Button size="small" startIcon={<ContentCopyIcon />} onClick={handleCopyRecipients} sx={{ textTransform: 'none', fontSize: 12 }}>
                        Copy Addresses
                      </Button>
                    </Box>
                  )}
                </Box>

                <TextField
                  name="subject"
                  label="Subject"
                  fullWidth
                  value={emailDetails.subject}
                  onChange={handleInputChange}
                  placeholder="Enter email subject..."
                  variant="outlined"
                />

                <TextField
                  name="body"
                  label="Message Body"
                  fullWidth
                  multiline
                  rows={12}
                  value={emailDetails.body}
                  onChange={handleInputChange}
                  placeholder="Write your message here..."
                  variant="outlined"
                />

                <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ pt: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="inherit"
                    onClick={handleClearSelection}
                    disabled={selectedEmails.length === 0 && !emailDetails.subject && !emailDetails.body}
                  >
                    Reset
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={handleSendEmail}
                    disabled={isSending || selectedEmails.length === 0 || !emailDetails.subject.trim() || !emailDetails.body.trim()}
                    startIcon={isSending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                    sx={{ px: 4 }}
                  >
                    {isSending ? "Sending..." : "Send Email"}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default SendEmailView;
