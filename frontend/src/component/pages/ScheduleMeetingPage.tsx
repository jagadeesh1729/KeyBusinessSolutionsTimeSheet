import React, { useState, useEffect } from 'react';
import { Paper, Typography, TextField, List, ListItem, ListItemText, Button, MenuItem, CircularProgress, Avatar, Chip } from '@mui/material';
import { timesheetAPI } from '../../api/timesheetapi';
import apiClient from '../../api/apiClient';
import EventIcon from '@mui/icons-material/Event';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../../context/AuthContext';
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

const DEFAULT_AGENDA = `I hope this email finds you well.

I'd like to schedule a meeting to discuss `;

const ScheduleMeetingPage = () => {
  const [meetingDetails, setMeetingDetails] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    agenda: DEFAULT_AGENDA,
  });
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { user } = useAuth();
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

  const handleSendInvite = async () => {
    try {
      if (!meetingDetails.location || team.length === 0) {
        setFormError('Generate a meeting link first and ensure team members are available.');
        return;
      }
      setSending(true);
      setFormError(null);
      
      // Include PM's email and all team members' emails
      const teamEmails = team.map(t => t.email);
      const pmEmail = user?.email;
      const recipients = pmEmail 
        ? [pmEmail, ...teamEmails.filter(e => e !== pmEmail)] 
        : teamEmails;
      
      const formattedDate = new Date(meetingDetails.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = format12h(meetingDetails.time);
      
      // Convert agenda newlines to HTML breaks
      const agendaHtml = meetingDetails.agenda.replace(/\n/g, '<br/>');
      
      const payload = {
        to: recipients,
        subject: `Meeting Invite: ${meetingDetails.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <p style="font-size: 14px; color: #333; line-height: 1.6;">${agendaHtml}</p>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #0066A4;">
              <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px;">${meetingDetails.title}</h3>
              <table style="font-size: 14px; color: #475569;">
                <tr>
                  <td style="padding: 5px 15px 5px 0; font-weight: 600;">📅 Date:</td>
                  <td style="padding: 5px 0;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 15px 5px 0; font-weight: 600;">🕐 Time:</td>
                  <td style="padding: 5px 0;">${formattedTime}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 15px 5px 0; font-weight: 600;">🔗 Join:</td>
                  <td style="padding: 5px 0;"><a href="${meetingDetails.location}" style="color: #0066A4; text-decoration: none;">${meetingDetails.location}</a></td>
                </tr>
              </table>
            </div>
            
            <p style="font-size: 14px; color: #333;">Please join the meeting at the scheduled time. Looking forward to speaking with you.</p>
            
            <p style="font-size: 14px; color: #333; margin-top: 20px;">Best regards</p>
          </div>
        `
      };
      
      const resp = await apiClient.post('/email/send', payload);
      if (resp.data.success) {
        setSent(true);
        setTimeout(() => setSent(false), 3000);
      } else {
        setFormError(resp.data.message || 'Failed to send meeting invite.');
      }
    } catch (e: any) {
      setFormError(e?.response?.data?.message || e?.message || 'Failed to send meeting invite');
    } finally {
      setSending(false);
    }
  };

  // Get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // Generate consistent color based on name
  const getAvatarColor = (name: string) => {
    const colors = ['#0066A4', '#00897B', '#5E35B1', '#E65100', '#C62828', '#2E7D32'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-50 rounded-lg">
            <EventIcon sx={{ color: '#0066A4', fontSize: 28 }} />
          </div>
          <div>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
              Schedule a Team Meeting
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Create a Google Meet and invite your team members
            </Typography>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Meeting Form */}
        <div className="lg:col-span-7">
          <Paper 
            elevation={0} 
            sx={{ 
              borderRadius: 3, 
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}
          >
            {/* Success Banner - Google Meet Link */}
            {meetingDetails.location && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <VideocamOutlinedIcon sx={{ color: '#16a34a', fontSize: 24 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#166534', mb: 0.5 }}>
                      Google Meet Created Successfully!
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#0369a1', 
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem'
                      }}
                    >
                      {meetingDetails.location}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="small"
                      variant={copied ? "contained" : "outlined"}
                      color={copied ? "success" : "primary"}
                      startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                      onClick={handleCopyLink}
                      sx={{ 
                        minWidth: 90,
                        textTransform: 'none',
                        fontWeight: 500,
                        borderRadius: 2
                      }}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      size="small"
                      variant={sent ? "contained" : "contained"}
                      color={sent ? "success" : "primary"}
                      startIcon={sending ? <CircularProgress size={16} color="inherit" /> : sent ? <CheckIcon /> : <SendIcon />}
                      onClick={handleSendInvite}
                      disabled={sending || team.length === 0}
                      sx={{ 
                        minWidth: 130,
                        textTransform: 'none',
                        fontWeight: 500,
                        borderRadius: 2,
                        bgcolor: sent ? '#16a34a' : '#0066A4',
                        '&:hover': { bgcolor: sent ? '#15803d' : '#004e7c' }
                      }}
                    >
                      {sending ? 'Sending...' : sent ? 'Sent!' : 'Send Invite'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Form Content */}
            <div className="p-6">
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b', mb: 3 }}>
                Meeting Details
              </Typography>

              {/* Meeting Title */}
              <TextField 
                name="title" 
                label="Meeting Title" 
                placeholder="e.g., Weekly Team Standup"
                fullWidth 
                value={meetingDetails.title} 
                onChange={handleInputChange}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: '#0066A4' },
                    '&.Mui-focused fieldset': { borderColor: '#0066A4' }
                  }
                }}
              />

              {/* Date and Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <TextField 
                  name="date" 
                  label="Date" 
                  type="date" 
                  fullWidth 
                  InputLabelProps={{ shrink: true }} 
                  value={meetingDetails.date} 
                  onChange={handleInputChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: '#0066A4' },
                      '&.Mui-focused fieldset': { borderColor: '#0066A4' }
                    }
                  }}
                />
                <TextField
                  name="time"
                  label="Time"
                  select
                  fullWidth
                  value={meetingDetails.time}
                  onChange={handleInputChange as any}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: '#0066A4' },
                      '&.Mui-focused fieldset': { borderColor: '#0066A4' }
                    }
                  }}
                >
                  {timeOptions.map((t) => (
                    <MenuItem key={t} value={t}>
                      <div className="flex items-center gap-2">
                        <AccessTimeIcon sx={{ fontSize: 16, color: '#64748b' }} />
                        {format12h(t)}
                      </div>
                    </MenuItem>
                  ))}
                </TextField>
              </div>

              {/* Location */}
              <TextField 
                name="location" 
                label="Location / Meeting Link" 
                placeholder="Will be auto-filled with Google Meet link"
                fullWidth 
                value={meetingDetails.location} 
                onChange={handleInputChange}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: '#0066A4' },
                    '&.Mui-focused fieldset': { borderColor: '#0066A4' }
                  }
                }}
              />

              {/* Agenda */}
              <TextField 
                name="agenda" 
                label="Agenda / Description" 
                placeholder="Describe the meeting agenda and topics to discuss..."
                fullWidth 
                multiline 
                rows={4} 
                value={meetingDetails.agenda} 
                onChange={handleInputChange}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: '#0066A4' },
                    '&.Mui-focused fieldset': { borderColor: '#0066A4' }
                  }
                }}
              />

              {/* Error Message */}
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <Typography variant="body2" sx={{ color: '#dc2626' }}>
                    {formError}
                  </Typography>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="contained"
                  onClick={handleScheduleMeeting}
                  disabled={!meetingDetails.title || !meetingDetails.date || !meetingDetails.time || teamLoading || creating}
                  startIcon={creating ? <CircularProgress size={18} color="inherit" /> : <VideocamOutlinedIcon />}
                  sx={{
                    bgcolor: '#0066A4',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 3,
                    py: 1.25,
                    '&:hover': { bgcolor: '#004e7c' },
                    '&:disabled': { bgcolor: '#94a3b8' }
                  }}
                >
                  {creating ? 'Creating...' : 'Generate Google Meet Link'}
                </Button>
                <Button
                  variant="outlined"
                  href="/google"
                  sx={{
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 3,
                    py: 1.25,
                    '&:hover': { 
                      borderColor: '#0066A4',
                      color: '#0066A4',
                      bgcolor: '#f0f9ff'
                    }
                  }}
                >
                  Authorize Google
                </Button>
              </div>
            </div>
          </Paper>
        </div>

        {/* Invited Employees Panel */}
        <div className="lg:col-span-5">
          <Paper 
            elevation={0} 
            sx={{ 
              borderRadius: 3, 
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              height: 'fit-content'
            }}
          >
            {/* Panel Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PersonOutlineIcon sx={{ color: '#475569', fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Invited Team Members
                  </Typography>
                </div>
                <Chip 
                  label={team.length} 
                  size="small"
                  sx={{ 
                    bgcolor: '#0066A4',
                    color: 'white',
                    fontWeight: 600,
                    minWidth: 32
                  }}
                />
              </div>
            </div>

            {/* Team List */}
            <div className="max-h-[400px] overflow-y-auto">
              {teamError && (
                <div className="p-4">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <Typography variant="body2" sx={{ color: '#dc2626' }}>
                      {teamError}
                    </Typography>
                  </div>
                </div>
              )}

              {teamLoading ? (
                <div className="flex items-center justify-center py-8">
                  <CircularProgress size={32} sx={{ color: '#0066A4' }} />
                </div>
              ) : (
                <List sx={{ py: 0 }}>
                  {team.map((employee, index) => (
                    <ListItem 
                      key={employee.id}
                      sx={{ 
                        px: 3,
                        py: 2,
                        borderBottom: index < team.length - 1 ? '1px solid #f1f5f9' : 'none',
                        '&:hover': { bgcolor: '#f8fafc' }
                      }}
                    >
                      <Avatar 
                        sx={{ 
                          bgcolor: getAvatarColor(`${employee.first_name}${employee.last_name}`),
                          width: 36,
                          height: 36,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          mr: 2
                        }}
                      >
                        {getInitials(employee.first_name, employee.last_name)}
                      </Avatar>
                      <ListItemText 
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                            {employee.first_name} {employee.last_name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {employee.email}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                  {!teamLoading && team.length === 0 && (
                    <div className="py-8 text-center">
                      <PersonOutlineIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        No team members found
                      </Typography>
                    </div>
                  )}
                </List>
              )}
            </div>
          </Paper>
        </div>
      </div>
    </div>
  );
};

export default ScheduleMeetingPage;




