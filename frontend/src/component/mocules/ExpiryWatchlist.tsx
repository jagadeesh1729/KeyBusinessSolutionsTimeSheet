import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Avatar,
  Chip,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Snackbar,
  Tooltip,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import { useExpiryWatchlist, useExpirationTrackerSettings, type RecurringFrequency } from '../hooks/useExpiryWatchlist';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';

interface ChangeLog {
  id: number;
  tracker_id: number;
  changed_by: number | null;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: 'CREATE' | 'UPDATE' | 'DELETE';
  changed_at: string;
  changed_by_name?: string | null;
  changed_by_email?: string | null;
}

const recurringOptions: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-Weekly' },
  { value: 'bi-monthly', label: 'Bi-Monthly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

const ExpiryWatchlist = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const { expiringUsers, trackerSettings, loading, error, refetch } = useExpiryWatchlist();
  const { updating, updateSettings } = useExpirationTrackerSettings();
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState(0);
  const [targetDays, setTargetDays] = useState<string>('180');
  const [recurring, setRecurring] = useState<RecurringFrequency>('monthly');
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchChangeLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await apiClient.get('/expiration-tracker/change-logs');
      setChangeLogs(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch change logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleOpenSettings = () => {
    if (trackerSettings) {
      setTargetDays(String(trackerSettings.target_days));
      setRecurring(trackerSettings.recurring);
    }
    setSettingsTab(0);
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSettingsTab(newValue);
    if (newValue === 1 && changeLogs.length === 0) {
      fetchChangeLogs();
    }
  };

  const handleTargetDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers
    if (value === '' || /^\d+$/.test(value)) {
      setTargetDays(value);
    }
  };

  const handleSaveSettings = async () => {
    const days = parseInt(targetDays) || 180;
    const result = await updateSettings({ target_days: days, recurring });
    if (result.success) {
      setSnackbar({ open: true, message: 'Settings updated successfully!', severity: 'success' });
      setSettingsOpen(false);
      refetch(); // Refresh the employee list with new settings
      fetchChangeLogs(); // Refresh logs
    } else {
      setSnackbar({ open: true, message: result.message || 'Failed to update settings', severity: 'error' });
    }
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
      <Box sx={{ p: 3 }}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // Color based on is_expiring_soon flag (within target_days = red, otherwise = green)
  const getStatusColor = (user: any) => {
    if (user.status === 'expired') return theme.palette.error.main;
    if (user.is_expiring_soon === 1) return theme.palette.error.main; // Red for expiring soon
    return theme.palette.success.main; // Green for safe
  };

  const getStatusBg = (user: any) => {
    if (user.status === 'expired') return alpha(theme.palette.error.main, 0.1);
    if (user.is_expiring_soon === 1) return alpha(theme.palette.error.main, 0.1);
    return alpha(theme.palette.success.main, 0.1);
  };

  const getStatusLabel = (user: any) => {
    const days = user.days_until_expiry;
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    if (days <= 30) return `Expires in ${days} days`;
    const months = user.months_until_expiry;
    if (months === 0) return `Expires in ${days} days`;
    if (months === 1) return `Expires in 1 month`;
    return `Expires in ${months} months`;
  };

  const getRowBgColor = (user: any) => {
    if (user.status === 'expired') return alpha(theme.palette.error.main, 0.05);
    if (user.is_expiring_soon === 1) return alpha(theme.palette.error.main, 0.03);
    return 'transparent';
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={3} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight="700" color="text.primary">
            Expiry Watchlist
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor employee visa and contract expirations
            {trackerSettings && (
              <span> • Alert threshold: <strong>{trackerSettings.target_days} days</strong></span>
            )}
          </Typography>
        </Box>
        {isAdmin && (
          <Tooltip title="Configure alert settings">
            <IconButton 
              onClick={handleOpenSettings}
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
            >
              <SettingsIcon color="primary" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* Legend */}
      <Stack direction="row" spacing={3} mb={2} flexWrap="wrap">
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: theme.palette.error.main }} />
          <Typography variant="caption" color="text.secondary">
            Expiring within {trackerSettings?.target_days || 180} days (needs attention)
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: theme.palette.success.main }} />
          <Typography variant="caption" color="text.secondary">
            Safe (beyond threshold)
          </Typography>
        </Stack>
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Expiry Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expiringUsers.length > 0 ? (
              expiringUsers.map((user) => {
                const statusColor = getStatusColor(user);
                const statusBg = getStatusBg(user);
                const rowBg = getRowBgColor(user);
                
                return (
                  <TableRow 
                    key={user.id}
                    hover
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 }, 
                      transition: 'all 0.2s',
                      bgcolor: rowBg,
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar 
                          sx={{ 
                            bgcolor: statusBg, 
                            color: statusColor,
                            fontWeight: 'bold'
                          }}
                        >
                          {user.first_name?.[0] || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                            {`${user.first_name || ''} ${user.last_name || ''}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {user.user_id}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AccessTimeIcon sx={{ fontSize: 16, color: statusColor }} />
                        <Typography variant="body2" color="text.primary">
                          {user.end_date ? new Date(user.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={user.is_expiring_soon === 1 || user.status === 'expired' ? 
                          <WarningIcon sx={{ fontSize: '16px !important' }} /> : 
                          <CheckCircleIcon sx={{ fontSize: '16px !important' }} />
                        }
                        label={getStatusLabel(user)}
                        size="small"
                        sx={{
                          bgcolor: statusBg,
                          color: statusColor,
                          fontWeight: 600,
                          borderRadius: 1,
                          '& .MuiChip-icon': { color: statusColor }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: 'success.light', mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" color="text.primary">No Employees Found</Typography>
                    <Typography variant="body2" color="text.secondary">
                      No employees with expiry dates found.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Settings Dialog for Admin */}
      <Dialog open={settingsOpen} onClose={handleCloseSettings} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SettingsIcon color="primary" />
            <Typography variant="h6">Expiration Tracker Settings</Typography>
          </Stack>
        </DialogTitle>
        <Divider />
        <Tabs value={settingsTab} onChange={handleTabChange} sx={{ px: 2 }}>
          <Tab label="Settings" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="Audit Logs" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>
        <Divider />
        <DialogContent sx={{ minHeight: 300 }}>
          {settingsTab === 0 && (
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Target Days (Alert Threshold)"
                type="text"
                inputMode="numeric"
                value={targetDays}
                onChange={handleTargetDaysChange}
                fullWidth
                helperText="Employees with expiry dates within this many days will be marked as 'expiring soon' (red)"
              />
              <TextField
                label="Reminder Frequency"
                select
                value={recurring}
                onChange={(e) => setRecurring(e.target.value as RecurringFrequency)}
                fullWidth
                helperText="How often reminders should be sent for expiring employees"
              >
                {recurringOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          )}
          {settingsTab === 1 && (
            <Box sx={{ mt: 2 }}>
              {logsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : changeLogs.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Changed By</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Field</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Old Value</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>New Value</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {changeLogs.map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(log.changed_at).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {log.changed_by_name || log.changed_by_email || 'System'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={log.field_name.replace('_', ' ')} 
                              size="small" 
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {log.old_value || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {log.new_value || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={log.change_type} 
                              size="small"
                              color={log.change_type === 'CREATE' ? 'success' : log.change_type === 'DELETE' ? 'error' : 'info'}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">No change logs found</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseSettings} color="inherit">
            Cancel
          </Button>
          {settingsTab === 0 && (
            <Button 
              onClick={handleSaveSettings} 
              variant="contained" 
              disabled={updating || !targetDays}
              startIcon={updating ? <CircularProgress size={16} /> : null}
            >
              {updating ? 'Saving...' : 'Save Settings'}
            </Button>
          )}
          {settingsTab === 1 && (
            <Button 
              onClick={fetchChangeLogs} 
              variant="outlined"
              startIcon={logsLoading ? <CircularProgress size={16} /> : <HistoryIcon />}
              disabled={logsLoading}
            >
              Refresh Logs
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExpiryWatchlist;
