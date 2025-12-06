import { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  TextField,
  Button,
  Switch,
  FormControlLabel,
} from '@mui/material';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FilterListIcon from '@mui/icons-material/FilterList';
import useMeetings from '../hooks/useMeetings';
import type { Meeting } from '../types/meeting';

const formatDate = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const AdminMeetingsView = () => {
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(true);
  const [search, setSearch] = useState('');
  const { meetings, loading, error, refetch } = useMeetings({ upcomingOnly: true });
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return meetings.filter((m: Meeting) => {
      const haystack = `${m.title} ${m.created_by_name || ''} ${m.meeting_link}`.toLowerCase();
      return term ? haystack.includes(term) : true;
    });
  }, [meetings, search]);

  const handleCopy = async (id: number, link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {}
  };

  const handleToggleUpcoming = (checked: boolean) => {
    setShowUpcomingOnly(checked);
    refetch({ upcomingOnly: checked });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2} mb={3}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#e0f2fe', color: '#0369a1', display: 'inline-flex' }}>
            <VideoCallIcon />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>Meetings</Typography>
            <Typography variant="body2" color="text.secondary">All Google Meet links created by PMs</Typography>
          </Box>
          <Chip label={`${meetings.length} total`} size="small" />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            size="small"
            placeholder="Search by title or PM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <FilterListIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} />,
            }}
          />
          <FormControlLabel
            control={<Switch checked={showUpcomingOnly} onChange={(e) => handleToggleUpcoming(e.target.checked)} size="small" />}
            label="Upcoming only"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch({ upcomingOnly: showUpcomingOnly })}
            sx={{ textTransform: 'none' }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Meeting Link</TableCell>
                  <TableCell align="right">Created At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No meetings found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((meeting) => (
                    <TableRow key={meeting.id} hover>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography fontWeight={600}>{meeting.title}</Typography>
                          {meeting.event_id && (
                            <Typography variant="caption" color="text.secondary">
                              Event ID: {meeting.event_id}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(meeting.start_time)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${meeting.duration_minutes} mins`} size="small" />
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="body2" fontWeight={600}>
                            {meeting.created_by_name || 'PM'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {meeting.created_by_email || 'N/A'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" color="primary" sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {meeting.meeting_link}
                          </Typography>
                          <Tooltip title="Open link">
                            <IconButton size="small" component="a" href={meeting.meeting_link} target="_blank" rel="noreferrer">
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copy link">
                            <IconButton size="small" onClick={() => handleCopy(meeting.id, meeting.meeting_link)}>
                              <ContentCopyIcon fontSize="small" color={copiedId === meeting.id ? 'success' : 'inherit'} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(meeting.created_at)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminMeetingsView;
