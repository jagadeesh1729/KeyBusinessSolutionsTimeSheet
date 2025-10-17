import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, List, ListItem, ListItemText, ListItemIcon, Button, MenuItem, CircularProgress } from '@mui/material';
import { timesheetAPI } from '../../api/timesheetapi';
import apiClient from '../../api/apiClient';
import PersonIcon from '@mui/icons-material/Person';
import ButtonComp from '../atoms/Button';
import CustomListItem from '../mocules/CustomListItem';
import type Employee from '../types/employee';
//

const useMyTeam = () => {
  const [team, setTeam] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await timesheetAPI.getPMEmployees();
        const rows = resp.data?.employees || resp.data?.data || [];
        const mapped: Employee[] = rows.map((r: any) => ({
          id: r.id || r.user_id || r.employee_id,
          first_name: r.first_name || (r.name ? String(r.name).split(' ')[0] : ''),
          last_name: r.last_name || (r.name ? String(r.name).split(' ').slice(1).join(' ') : ''),
          email: r.email,
          phone: r.phone || '',
          title: r.title || '',
          job_title: r.job_title || '',
          project: [],
          college_name: null,
          college_address: null,
          degree: '',
          job_start_date: '',
          expiry_date: '',
          date_of_birth: '',
        }));
        setTeam(mapped);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load team');
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  return { team, loading, error };
};

const ScheduleMeetingPage = () => {
  const [meetingDetails, setMeetingDetails] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    agenda: '',
  });
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { team, loading: teamLoading, error: teamError } = useMyTeam();

  const toPascalCase = (input: string) =>
    input.replace(/\b([a-z])(\w*)/gi, (_, first: string, rest: string) => first.toUpperCase() + rest.toLowerCase());

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    let nextValue = value;
    // Apply Pascal Case to free-text inputs; skip date/time and preserve URLs
    if (name !== 'date' && name !== 'time') {
      if (name === 'location') {
        // If looks like a URL (e.g., Google Meet), don't alter it
        const isLikelyUrl = /^(https?:\/\/|www\.)/i.test(value) || /\.[a-z]{2,}$/i.test(value);
        nextValue = isLikelyUrl ? value : toPascalCase(value);
      } else {
        nextValue = toPascalCase(value);
      }
    }

    setMeetingDetails({ ...meetingDetails, [name]: nextValue });
    setFormError(null);
  };

  // Build time dropdown options in 15-minute increments between 08:00 and 20:00
  const timeOptions = React.useMemo(() => {
    const opts: string[] = [];
    for (let h = 8; h <= 20; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        opts.push(`${hh}:${mm}`);
      }
    }
    return opts;
  }, []);

  const format12h = (t: string) => {
    const [hhStr, mmStr] = t.split(':');
    const hh = Number(hhStr);
    const mm = Number(mmStr);
    const suffix = hh >= 12 ? 'PM' : 'AM';
    const h12 = ((hh + 11) % 12) + 1;
    return `${h12}:${String(mm).padStart(2, '0')} ${suffix}`;
  };

  const handleScheduleMeeting = async () => {
    try {
      if (!meetingDetails.title || !meetingDetails.date || !meetingDetails.time) {
        setFormError('Title, Date and Time are required.');
        return;
      }
      setCreating(true);
      const attendees = team.map(t => ({ email: t.email, name: `${t.first_name} ${t.last_name}` }));
      const payload = {
        title: meetingDetails.title,
        date: meetingDetails.date,
        time: meetingDetails.time,
        durationMinutes: 60,
        agenda: meetingDetails.agenda,
        attendees,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
      };
      const resp = await apiClient.post('/meet/create', payload);
      const data = resp.data;
      if (!data.success) {
        if (data.authorize && data.authUrl) {
          window.location.assign(data.authUrl);
          return;
        }
        setFormError(data.message || 'Failed to create meeting. If Google auth is required, click Authorize and try again.');
        return;
      }
      setMeetingDetails({ ...meetingDetails, location: data.meetLink });
      // Link now shown above the form with Copy button
    } catch (e: any) {
      setFormError(e?.response?.data?.message || e?.message || 'Failed to create meeting');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (meetingDetails.location && navigator.clipboard) {
        await navigator.clipboard.writeText(meetingDetails.location);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {}
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Schedule a Team Meeting
        </Typography>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-7">
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Meeting Details</Typography>
              {meetingDetails.location && (
                <Paper sx={{ p: 2, mb: 2 }} elevation={0}>
                  <Typography variant="subtitle1" fontWeight="bold">Google Meet Link</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body1" color="primary" sx={{ wordBreak: 'break-all' }}>
                      {meetingDetails.location}
                    </Typography>
                    <Button size="small" variant="outlined" onClick={handleCopyLink}>Copy</Button>
                    {copied && (<Typography variant="caption" color="success.main">Copied</Typography>)}
                  </Box>
                </Paper>
              )}
              <TextField name="title" label="Meeting Title" fullWidth margin="normal" value={meetingDetails.title} onChange={handleInputChange} />
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <TextField name="date" label="Date" type="date" fullWidth margin="normal" InputLabelProps={{ shrink: true }} value={meetingDetails.date} onChange={handleInputChange} />
                </div>
                <div className="col-span-6">
                  <TextField
                    name="time"
                    label="Time"
                    select
                    fullWidth
                    margin="normal"
                    value={meetingDetails.time}
                    onChange={handleInputChange as any}
                  >
                    {timeOptions.map((t) => (
                      <MenuItem key={t} value={t}>{format12h(t)}</MenuItem>
                    ))}
                  </TextField>
                </div>
              </div>
              <TextField name="location" label="Location / Meeting Link" fullWidth margin="normal" value={meetingDetails.location} onChange={handleInputChange} />
              <TextField name="agenda" label="Agenda / Description" fullWidth multiline rows={4} margin="normal" value={meetingDetails.agenda} onChange={handleInputChange} />
              {formError && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>{formError}</Typography>
              )}
              <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <ButtonComp
                  text={creating ? 'Creating…' : 'Generate Google Meet Link'}
                  variant="contained"
                  onClick={handleScheduleMeeting}
                  disabled={!meetingDetails.title || !meetingDetails.date || !meetingDetails.time || teamLoading || creating}
                />
                <a href="/google" target="_self" style={{ textDecoration: 'none' }}>
                  <ButtonComp text="Authorize Google" variant="outlined" />
                </a>
                {creating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">Creating Google Meet…</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </div>
          <div className="col-span-12 md:col-span-5">
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Invited Employees ({team.length})</Typography>
              {teamError && <Typography color="error" variant="body2">{teamError}</Typography>}
              <List>
                {team.map((employee) => (
                  <ListItem key={employee.id}>
                    <ListItemIcon><PersonIcon /></ListItemIcon>
                    <ListItemText primary={`${employee.first_name} ${employee.last_name}`} secondary={employee.email} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </div>
        </div>
      </Box>
    </Box>
  );
};

export default ScheduleMeetingPage;




