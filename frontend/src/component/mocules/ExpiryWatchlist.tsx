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
} from '@mui/material';
import { useExpiryWatchlist } from '../hooks/useExpiryWatchlist';

const ExpiryWatchlist = () => {
  const { expiringUsers, loading, error } = useExpiryWatchlist();

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Expiry Watchlist</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        All employees sorted by expiry date (shortest first).
      </Typography>
      <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
        <Table aria-label="expiry watchlist table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell>Months from Now</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expiringUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{user.role.replace('_', ' ')}</TableCell>
                <TableCell>{new Date(user.end_date!).toLocaleDateString()}</TableCell>
                <TableCell>
                  {user.monthsFromNow! < 0 ? 
                    `Expired ${Math.abs(user.monthsFromNow!)} months ago` : 
                    `${user.monthsFromNow} months`
                  }
                </TableCell>
              </TableRow>
            ))}
            {!loading && expiringUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">No employees found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ExpiryWatchlist;