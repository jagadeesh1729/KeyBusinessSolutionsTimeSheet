// src/components/employee/TimesheetHistory.tsx (Enhanced Version)
import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  CircularProgress,
  Box,
  Stack,
  useTheme,
  alpha,
  Grid,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  Edit,
  Visibility,
  History as HistoryIcon,
} from '@mui/icons-material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useTimesheetHistory, useTimesheetMutations } from './../hooks/useTimesheet';
import type { Timesheet } from '../types/Holiday';
import { useNavigate } from 'react-router-dom';
import TimesheetPDF from './TimesheetPDF';

// PDF functionality temporarily disabled due to hook conflicts

const TimesheetHistory: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: timesheets, loading, error, refetch } = useTimesheetHistory();

  const { submitTimesheet, loading: mutationLoading } = useTimesheetMutations();
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle fontSize="small" color="success" />;
      case 'rejected':
        return <Cancel fontSize="small" color="error" />;
      case 'pending':
        return <Schedule fontSize="small" color="info" />;
      default:
        return <Edit fontSize="small" color="action" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };


  const handleViewTimesheet = (timesheet: Timesheet) => {
    setSelectedTimesheet(timesheet);
    setViewDialogOpen(true);
  };

const handleViewPdf = async (timesheet: Timesheet) => {
  // Helper for consistent number formatting
  const formatHours = (num: number) => num ? Number(num).toFixed(2) : '0.00';
  const signatureRequired = timesheet.project?.signature_required ?? (timesheet.project as any)?.signatureRequired ?? true;
  const autoSign = timesheet.project?.autoApprove ?? (timesheet.project as any)?.auto_approve ?? false;
  
  // Convert image to base64 data URL
  const toBase64 = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(''); // Return empty if fails
      img.src = url;
    });
  };

  // Pre-load images as base64 to ensure they load in print window
  const logoBase64 = await toBase64(`${window.location.origin}/KeyLogo.png`);
  const signBase64 = autoSign ? await toBase64(`${window.location.origin}/sign.png`) : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Timesheet - ${timesheet.project?.name || 'Unknown Project'}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        :root {
          --primary: #1a1a1a;       /* Near Black */
          --secondary: #4a5568;     /* Dark Slate */
          --accent: #2d3748;        /* Navy Slate */
          --border: #e2e8f0;        /* Light Gray */
          --bg-table-header: #f7fafc;
        }

        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0; 
          padding: 0; 
          color: var(--primary);
          background: #fff;
          font-size: 10pt;
          line-height: 1.5;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Standard A4 Paper Margins */
        .page-container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 40px 50px;
          background: white;
        }

        /* HEADER SECTION */
        .header-wrap {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid var(--primary);
          padding-bottom: 20px;
          margin-bottom: 30px;
        }

        .logo-area img {
          max-height: 60px;
          object-fit: contain;
        }

        .doc-title {
          text-align: right;
        }

        .doc-title h1 {
          font-size: 24pt;
          font-weight: 700;
          letter-spacing: -0.5px;
          margin: 0;
          color: var(--primary);
          text-transform: uppercase;
        }

        .doc-title .ref-number {
          font-family: 'Courier New', Courier, monospace;
          color: var(--secondary);
          font-size: 11pt;
          margin-top: 5px;
        }

        /* METADATA SECTION (Two Column) */
        .meta-container {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          gap: 40px;
        }

        .meta-col {
          flex: 1;
        }

        .meta-col h3 {
          font-size: 9pt;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--secondary);
          border-bottom: 1px solid var(--border);
          padding-bottom: 5px;
          margin-bottom: 10px;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .meta-label {
          font-weight: 500;
          color: var(--secondary);
          width: 100px;
        }

        .meta-value {
          flex: 1;
          font-weight: 600;
          text-align: left;
        }

        /* TABLE SECTION */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }

        thead th {
          background-color: var(--bg-table-header);
          color: var(--primary);
          font-size: 9pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 8px;
          text-align: left;
          border-top: 1px solid var(--primary);
          border-bottom: 1px solid var(--primary);
        }

        tbody td {
          padding: 10px 8px;
          border-bottom: 1px solid var(--border);
          font-size: 10pt;
          vertical-align: top;
        }

        /* Right align numbers for financial look */
        .col-hours { text-align: right; }
        
        tr.subtotal-row td {
          border-top: 2px solid var(--primary);
          border-bottom: none;
          font-weight: 700;
          font-size: 12pt;
          padding-top: 15px;
        }

        /* SIGNATURE SECTION */
        .signature-section {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
          gap: 50px;
          page-break-inside: avoid;
        }

        .sign-box {
          flex: 1;
        }

        .sign-line {
          border-bottom: 1px solid #000;
          height: 40px;
          margin-bottom: 8px;
        }

        .sign-label {
          font-size: 9pt;
          color: var(--secondary);
          font-weight: 500;
        }

        /* FOOTER */
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 8pt;
          color: #999;
          border-top: 1px solid var(--border);
          padding-top: 15px;
        }

        /* PRINT MEDIA QUERY */
        @media print {
          @page { margin: 1cm; size: A4; }
          body { -webkit-print-color-adjust: exact; }
          .page-container { padding: 0; max-width: 100%; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
      </style>
    </head>
    <body>
      <div class="page-container">
        
        <header class="header-wrap">
          <div class="logo-area">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" style="max-height: 60px;" />` : ''}
          </div>
          <div class="doc-title">
            <h1>Timesheet</h1>
            <div class="ref-number">#TS-${timesheet.id?.toString().padStart(6, '0') || '000000'}</div>
          </div>
        </header>

        <div class="meta-container">
          <div class="meta-col">
            <h3>Employee</h3>
            <div class="meta-row">
              <span class="meta-label">Name:</span>
              <span class="meta-value">${timesheet.employeeName || 'N/A'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Email:</span>
              <span class="meta-value">${timesheet.employeeEmail || timesheet.employee?.email || 'N/A'}</span>
            </div>
          </div>

          <div class="meta-col">
            <h3>Project Details</h3>
            <div class="meta-row">
              <span class="meta-label">Project:</span>
              <span class="meta-value">${timesheet.project?.code || 'General Project'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Client Address:</span>
              <span class="meta-value">${timesheet.project?.clientAddress || 'N/A'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Start Date:</span>
              <span class="meta-value">${formatDate(timesheet.periodStart)}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">End Date:</span>
              <span class="meta-value">${formatDate(timesheet.periodEnd)}</span>
            </div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 15%">Date</th>
              <th style="width: 70%">Description</th>
              <th style="width: 15%" class="col-hours">Hours</th>
            </tr>
          </thead>
          <tbody>
            ${timesheet.dailyEntries?.flatMap(day => 
              day.tasks.map((task, index) => 
                `<tr>
                  <td style="color: ${index === 0 ? 'var(--primary)' : 'transparent'}">
                    ${index === 0 ? formatDate(day.date) : formatDate(day.date)}
                  </td>
                  <td>${task.name}</td>
                  <td class="col-hours">${formatHours(task.hours)}</td>
                </tr>`
              )
            ).join('') || '<tr><td colspan="3" style="text-align: center; padding: 30px;">No entries found.</td></tr>'}
            
            <tr class="subtotal-row">
              <td colspan="2" style="text-align: right; padding-right: 20px;">Total Hours Recorded</td>
              <td class="col-hours">${formatHours(timesheet.totalHours)}</td>
            </tr>
          </tbody>
        </table>
        
        ${signatureRequired ? `
        <div class="signature-section">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-label">Employee Signature</div>
          </div>
          <div class="sign-box">
            ${autoSign && signBase64
              ? `<img src="${signBase64}" alt="Approver Signature" style="max-height: 60px; object-fit: contain; margin-bottom: 8px;" />`
              : '<div class="sign-line"></div>'}
            <div class="sign-label">Approver Signature</div>
          </div>
        </div>` : ''}

        <div class="footer">
          <p><strong>Corporate Office</strong><br/>
          4738 Duckhorn Drive, Sacramento, CA 95834<br/>
          (916) 646 2080 &bull; info@keybusinessglobal.com</p>
          <p>Generated on ${new Date().toLocaleDateString()} &bull; Page 1 of 1</p>
        </div>

      </div>
      <script>
        // Wait for all images to load before printing
        function waitForImages() {
          const images = document.querySelectorAll('img');
          const promises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve; // Still proceed if image fails
            });
          });
          return Promise.all(promises);
        }
        
        waitForImages().then(() => {
          setTimeout(() => window.print(), 300);
        });
      </script>
    </body>
    </html>
  `;
  
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  }
};

// You'll also need this formatDate function:
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

  // const handleViewPdf = (timesheet: Timesheet) => {
  //   // Create HTML preview in new window
  //   const htmlContent = `
  //     <!DOCTYPE html>
  //     <html>
  //     <head>
  //       <title>Timesheet - ${timesheet.project?.name || 'Unknown Project'}</title>
  //       <style>
  //         body { font-family: Arial, sans-serif; margin: 20px; }
  //         .header { border-bottom: 2px solid #1E88E5; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
  //         .company-section { display: flex; align-items: center; gap: 15px; }
  //         .company { font-size: 18px; font-weight: bold; color: #333; }
  //         .title { font-size: 24px; font-weight: bold; color: #1E88E5; }
  //         .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  //         .info-item { margin-bottom: 10px; }
  //         .label { font-size: 12px; color: #666; }
  //         .value { font-weight: bold; }
  //         table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  //         th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  //         th { background-color: #f5f5f5; font-weight: bold; }
  //         .summary { text-align: right; font-size: 16px; font-weight: bold; color: #1E88E5; }
  //       </style>
  //     </head>
  //     <body>
  //       <div class="header">
  //         <div class="company-section">
  //           <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPoAAABJCAYAAAAUsjvmAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4xLWMwMDIgNzkuYjdjNjRjY2Y5LCAyMDI0LzA3LzE2LTEyOjM5OjA0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjYuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjEtMDEtMjJUMTc6MDc6MTkrMDU6MzAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTExLTEzVDE1OjU5OjA3KzA1OjMwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI0LTExLTEzVDE1OjU5OjA3KzA1OjMwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NmEyMjQ2Ny1lMmViLTRiODctYjIyOS01M2YwMmY0MTljZmUiIHhtcE1NOkRvY3VtZW50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" alt="Company Logo" style="object-fit: contain; -webkit-print-color-adjust: exact; print-color-adjust: exact;" />
  //         </div>
  //         <div class="title">Timesheet</div>
  //       </div>
        
  //       <div class="info-grid">
  //         <div class="info-item">
  //           <div class="label">Employee</div>
  //           <div class="value">${timesheet.employeeName || 'N/A'}</div>
  //         </div>
  //         <div class="info-item">
  //           <div class="label">Project</div>
  //           <div class="value">${timesheet.project?.name || 'N/A'}</div>
  //         </div>
  //         <div class="info-item">
  //           <div class="label">Period</div>
  //           <div class="value">${formatDate(timesheet.periodStart)} - ${formatDate(timesheet.periodEnd)}</div>
  //         </div>

  //       </div>
        
  //       <h3>Daily Entries</h3>
  //       <table>
  //         <thead>
  //           <tr>
  //             <th>Date</th>
  //             <th>Description</th>
  //             <th>Hours</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           ${timesheet.dailyEntries?.flatMap(day => 
  //             day.tasks.map((task, index) => 
  //               `<tr>
  //                 <td>${index === 0 ? formatDate(day.date) : ''}</td>
  //                 <td>${task.name}</td>
  //                 <td>${task.hours}</td>
  //               </tr>`
  //             )
  //           ).join('') || '<tr><td colspan="3">No entries found</td></tr>'}
  //         </tbody>
  //       </table>
        
  //       <div class="summary">
  //         Total Hours: ${timesheet.totalHours} hrs
  //       </div>
        
  //       <style media="print">
  //         @page { margin: 0; }
  //         body { margin: 1.6cm; }
  //       </style>
  //       <script>
  //         setTimeout(() => window.print(), 100);
  //       </script>
  //     </body>
  //     </html>
  //   `;
    
  //   const newWindow = window.open('', '_blank');
  //   if (newWindow) {
  //     newWindow.document.write(htmlContent);
  //     newWindow.document.close();
  //   }
  // };

  const handleEditRejected = (timesheet: Timesheet) => {
    // Navigate to entry page with timesheet ID for editing
    navigate(`/employee/timesheet/edit/${timesheet.id}`);
  };

  const handleResubmit = async (timesheet: Timesheet) => {
    try {
      const result = await submitTimesheet(timesheet.id);
      if (result.success) {
        setMessage({ type: 'success', text: 'Timesheet resubmitted successfully!' });
        refetch();
        setViewDialogOpen(false);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to resubmit timesheet' });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} thickness={4} />
        <Typography sx={{ ml: 2, color: 'text.secondary', fontWeight: 500 }}>
          Loading timesheet history...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
              Past Timesheets
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View past submissions and their status.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate('/employee/timesheet')}
            sx={{ 
              textTransform: 'none', 
              borderRadius: 2,
              px: 3,
              py: 1,
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' }
            }}
          >
            Back to Current Timesheet
          </Button>
        </Box>

        {/* Messages */}
        {message && (
          <Alert 
            severity={message.type} 
            onClose={() => setMessage(null)}
            sx={{ borderRadius: 2 }}
          >
            {message.text}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Timesheets List */}
        <Card 
          elevation={0} 
          sx={{ 
            borderRadius: 3, 
            border: '1px solid', 
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="timesheet history table">
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>Project</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>Period</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}>Total Hours</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, py: 2 }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, py: 2 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timesheets && timesheets.length > 0 ? (
                    timesheets.map((timesheet) => (
                      <TableRow
                        key={timesheet.id}
                        hover
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                          {timesheet.project?.name || 'Unknown Project'}
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>
                          {formatDate(timesheet.periodStart)} — {formatDate(timesheet.periodEnd)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {timesheet.totalHours}
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            icon={getStatusIcon(timesheet.status)}
                            label={timesheet.status.toUpperCase()}
                            color={getStatusColor(timesheet.status) as any}
                            size="small"
                            variant="filled"
                            sx={{ fontWeight: 600, borderRadius: 1.5 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="View Details">
                              <IconButton 
                                onClick={() => handleViewTimesheet(timesheet)} 
                                size="small"
                                sx={{ color: 'text.secondary' }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {timesheet.status === 'rejected' && (
                              <Tooltip title="Edit Timesheet">
                                <IconButton 
                                  onClick={() => handleEditRejected(timesheet)} 
                                  size="small" 
                                  color="primary"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {timesheet.status === 'approved' && (
                                <Tooltip title="Preview/Print PDF">
                                <IconButton 
                                  onClick={() => handleViewPdf(timesheet)} 
                                  size="small" 
                                  color="secondary"
                                >
                                  <PictureAsPdfIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Box 
                          sx={{ 
                            p: 8, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: 2,
                            bgcolor: 'background.paper'
                          }}
                        >
                          <Box 
                            sx={{ 
                              p: 3, 
                              borderRadius: '50%', 
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                              color: 'primary.main'
                            }}
                          >
                            <HistoryIcon sx={{ fontSize: 48 }} />
                          </Box>
                          <Typography variant="h6" color="text.primary" fontWeight={600}>
                            No timesheets found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Create your first timesheet to see it here.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* View Timesheet Dialog */}
        <Dialog 
          open={viewDialogOpen} 
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight={600}>Timesheet Details</Typography>
              {selectedTimesheet && (
                <Chip 
                  label={selectedTimesheet.status.toUpperCase()}
                  color={getStatusColor(selectedTimesheet.status) as any}
                  size="small"
                  sx={{ fontWeight: 600, borderRadius: 1.5 }}
                />
              )}
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ mt: 2 }}>
            {selectedTimesheet && (
              <Stack spacing={3}>
                {/* Project & Period Info */}
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Project</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedTimesheet.project?.name || 'Unknown Project'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Total Hours</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedTimesheet.totalHours} hours
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Period</Typography>
                    <Typography variant="body1">
                      {formatDate(selectedTimesheet.periodStart)} - {formatDate(selectedTimesheet.periodEnd)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Typography variant="body1">
                      {selectedTimesheet.status.toUpperCase()}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Rejection Reason */}
                {selectedTimesheet.status === 'rejected' && selectedTimesheet.rejectionReason && (
                  <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Rejection Reason:
                    </Typography>
                    <Typography variant="body2">
                      {selectedTimesheet.rejectionReason}
                    </Typography>
                  </Alert>
                )}

                <Divider />

                {/* Daily Entries */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Daily Entries
                  </Typography>
                  <Stack spacing={2}>
                    {selectedTimesheet.dailyEntries && selectedTimesheet.dailyEntries.length > 0 ? (
                      selectedTimesheet.dailyEntries.map((day, index) => (
                        <Card key={index} variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {formatDate(day.date)}
                              </Typography>
                              <Chip 
                                label={`${day.hours} hrs`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                            <Stack spacing={1}>
                              {day.tasks.map((task, taskIndex) => (
                                <Box key={taskIndex} display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body2" color="text.secondary">
                                    {task.name}
                                  </Typography>
                                  <Typography variant="body2" fontWeight={500}>
                                    {task.hours} hrs
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No entries found
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Stack>
            )}
          </DialogContent>
          
          <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
            <Button onClick={() => setViewDialogOpen(false)} sx={{ color: 'text.secondary' }}>
              Close
            </Button>
            {selectedTimesheet?.status === 'rejected' && (
              <>
                <Button
                  variant="outlined"
                  onClick={() => handleEditRejected(selectedTimesheet)}
                  startIcon={<Edit />}
                >
                  Edit
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleResubmit(selectedTimesheet)}
                  disabled={mutationLoading}
                  sx={{ boxShadow: 'none' }}
                >
                  Resubmit
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

      </Stack>
    </Container>
  );
};

export default TimesheetHistory;
