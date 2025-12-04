import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  Divider,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Alert,
  FormControl,
  Grid,
  Paper,
  InputAdornment,
  Container,
  Button,
  CircularProgress
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Work as WorkIcon, 
  School as SchoolIcon, 
  Email as EmailIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Send as SendIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

// --- IMPORTS FOR GENERATION ---
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { asBlob } from 'html-docx-js-typescript';
import { saveAs } from 'file-saver';

import OfferLetter from './OfferLetter';
import { useEmployees } from '../hooks/useEmployees';
import apiClient from '../../api/apiClient';

// --- CUSTOM BUTTON ---
type LoadingButtonProps = React.ComponentProps<typeof Button> & { loading?: boolean; startIcon?: React.ReactNode };
const LoadingButton: React.FC<LoadingButtonProps> = ({ loading, startIcon, children, ...buttonProps }) => {
  const effectiveStartIcon = loading ? <CircularProgress color="inherit" size={16} /> : startIcon;
  return (
    <Button
      startIcon={effectiveStartIcon}
      disabled={loading || buttonProps.disabled}
      {...buttonProps}
    >
      {children}
    </Button>
  );
};

// --- TYPES ---
type OfferForm = {
  date: string;
  full_name: string;
  position: string;
  status: string;
  university: string;
  start_date: string;
  no_of_hours: string;
  compensation: string;
  email: string;
};

const requiredFields: Array<keyof OfferForm> = [
  'date', 'full_name', 'position', 'status', 'university',
  'start_date', 'no_of_hours', 'compensation', 'email',
];

const AdminOfferLetterPanel: React.FC = () => {
  const { employees, loading, error: employeeError } = useEmployees();
  
  const [form, setForm] = useState<OfferForm>({
    date: new Date().toISOString().split('T')[0],
    full_name: '',
    position: '',
    status: '',
    university: '',
    start_date: '',
    no_of_hours: '',
    compensation: '',
    email: '',
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [status, setStatus] = useState<{ type: 'error' | 'success' | null, msg: string | null }>({ type: null, msg: null });
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  const missingFields = useMemo(
    () => requiredFields.filter((key) => !form[key]),
    [form]
  );

  useEffect(() => {
    if (!selectedEmployeeId) return;
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    if (!emp) return;
    
    const name = `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.trim();
    setForm((prev) => ({
      ...prev,
      full_name: name,
      position: emp.job_title || prev.position,
      status: emp.visa_status || prev.status,
      university: emp.college_name || prev.university,
      start_date: (emp.start_date || emp.job_start_date || '').split('T')[0] || prev.start_date,
      no_of_hours: emp.no_of_hours ? String(emp.no_of_hours) : prev.no_of_hours,
      compensation: emp.compensation ? String(emp.compensation) : prev.compensation,
      email: emp.email || prev.email,
    }));
  }, [selectedEmployeeId, employees]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // --- HELPER: Convert image to base64 data URL ---
  const imageToBase64 = (imgSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${imgSrc}`));
      img.src = imgSrc;
    });
  };

  // --- HELPER: PREPARE DOM FOR CAPTURE ---
  const getCleanClone = () => {
    if (!previewRef.current) throw new Error('Preview element not found');
    
    const original = previewRef.current;
    const clone = original.cloneNode(true) as HTMLElement;
    
    // Set fixed A4 width with proper margins
    clone.style.width = '794px'; 
    clone.style.padding = '40px';
    clone.style.backgroundColor = 'white';
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    clone.style.zIndex = '-1';
    
    document.body.appendChild(clone);
    return clone;
  };

  // --- PDF GENERATOR ---
  const generatePdfBlob = async (): Promise<Blob> => {
    const clone = getCleanClone();

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 794,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      return pdf.output('blob');
    } finally {
      document.body.removeChild(clone);
    }
  };

  // --- FIXED DOCX GENERATOR WITH PROPER FORMATTING ---
  const generateDocxBlob = async (): Promise<Blob> => {
    if (!previewRef.current) throw new Error('Preview not ready');

    const original = previewRef.current;
    
    // Create a clean clone for processing
    const clone = original.cloneNode(true) as HTMLElement;
    
    // Process all images to ensure they work in DOCX
    const images = clone.querySelectorAll('img');
    const processedImages: string[] = [];

    for (const img of images) {
      try {
        // Convert images to base64 data URLs
        const canvas = await html2canvas(img as HTMLElement, {
          scale: 1,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const dataUrl = canvas.toDataURL('image/png');
        processedImages.push(dataUrl);
        img.src = dataUrl;
        
        // Set consistent styling
        img.style.width = 'auto';
        img.style.height = '60px';
        img.style.maxWidth = '100%';
        img.style.display = 'block';
      } catch (error) {
        console.warn('Failed to process image for DOCX:', error);
        processedImages.push('');
      }
    }

    // Get the HTML content with proper Word formatting
    const htmlContent = createWordCompatibleHTML(clone.innerHTML);

    try {
      const blob = await asBlob(htmlContent, {
        orientation: 'portrait',
        margins: { top: 1440, right: 1080, bottom: 1440, left: 1080 } // Modern: 1in top/bottom, 0.75in left/right
      });
      
      if (!blob) throw new Error('Failed to generate DOCX blob');
      return blob as Blob;
    } catch (error) {
      console.error('DOCX generation error:', error);
      throw new Error('Failed to create DOCX document');
    }
  };

  // Helper function to create Word-compatible HTML
  const createWordCompatibleHTML = (content: string): string => {
    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
  <meta charset="UTF-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word 15">
  <meta name="Originator" content="Microsoft Word 15">
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <style>
    /* Word-compatible base styles with Modern margins */
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12pt;
      color: #000000;
      margin: 0;
      padding: 72px 54px; /* Modern: 1in top/bottom, 0.75in left/right */
      line-height: 1.6;
      background: white;
    }
    
    /* Header section with border */
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    
    /* Address styling - blue color */
    .address-block {
      color: #3b82f6 !important;
      text-align: right;
      font-weight: bold;
    }
    
    /* Image styling */
    img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    
    /* List item styling */
    .list-item {
      margin-bottom: 18px;
      display: flex;
    }
    
    .list-number {
      width: 20px;
      margin-right: 5px;
      flex-shrink: 0;
    }
    
    .list-content {
      flex-grow: 1;
    }
    
    /* Signature section - side by side layout */
    .signature-container {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
    }
    
    .signature-box {
      width: 45%;
    }
    
    .signature-line {
      border-bottom: 1px solid #000000;
      margin-bottom: 8px;
      padding-bottom: 4px;
    }
    
    /* Ensure all text is black */
    * {
      color: #000000 !important;
    }
    
    /* Date and greeting spacing */
    .date-section {
      margin-bottom: 20px;
    }
    
    .greeting-section {
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div style="width: 100%; min-height: 1123px; background: white;">
    ${content}
  </div>
</body>
</html>`;
  };

  // Alternative DOCX generator for better formatting with embedded images
  const generateDocxBlobAlternative = async (): Promise<Blob> => {
    if (!previewRef.current) throw new Error('Preview not ready');

    // Convert images to base64 first
    let logoBase64 = '';
    let signatureBase64 = '';
    
    try {
      logoBase64 = await imageToBase64('/image.png');
    } catch (err) {
      console.warn('Failed to load logo image:', err);
    }
    
    try {
      signatureBase64 = await imageToBase64('/sign.png');
    } catch (err) {
      console.warn('Failed to load signature image:', err);
    }

    // Create a simple, clean HTML structure that Word can handle with embedded images
    const htmlContent = `
      <!DOCTYPE html>
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns:v="urn:schemas-microsoft-com:vml">
      <head>
        <meta charset="UTF-8">
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12pt;
            margin: 1in 0.75in; /* Modern: 1in top/bottom, 0.75in left/right */
            line-height: 1.6;
          }
          .header {
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
          }
          .header-table td {
            vertical-align: top;
            padding: 0;
          }
          .address {
            color: #3b82f6;
            text-align: right;
            font-weight: bold;
            font-size: 12pt;
          }
          .logo-img {
            height: 60px;
            width: auto;
          }
          .signature-img {
            height: 50px;
            width: auto;
          }
          .signature-section {
            margin-top: 40px;
          }
          .signature-line {
            border-bottom: 1px solid black;
            margin-bottom: 5px;
            height: 1px;
          }
          .signature-table {
            width: 100%;
            margin-top: 40px;
          }
          .signature-table td {
            width: 45%;
            padding: 0 10px;
          }
          .list-item {
            margin-bottom: 15px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <table class="header-table">
            <tr>
              <td style="width: 50%;">
                ${logoBase64 ? `<img src="${logoBase64}" class="logo-img" alt="Logo"/>` : '<strong>KEY Business Solutions Inc.</strong>'}
              </td>
              <td style="width: 50%;" class="address">
                4738 Duckhorn Dr,<br/>
                Sacramento, CA 95834<br/>
                Tel: (916) 646 2080<br/>
                Fax: (916) 646 2081
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">${form.date}</div>
        
        <div style="margin-bottom: 20px;">
          <b>Dear</b> ${form.full_name},
        </div>

        <div style="text-align: justify; margin-bottom: 20px;">
          Welcome Aboard! We are pleased to offer you a position as a ${form.position} at 
          Key Business Solutions, Inc. and look forward to a mutually beneficial relationship. 
          Please note that this position is for your <b>${form.status}</b> as required by your school, 
          ${form.university}. Thus, please note that the following are the terms of your employment 
          with Key Business Solutions.
        </div>

        <div class="list-item">
          <b>1. Duties:</b> You will be employed with the title of ${form.position} and will render all reasonable duties expected of a ${form.position}. These services will be provided at locations designated by Key Business Solutions, and will include the offices of our clients. During the term of this agreement, you will devote your full abilities to the performance of your duties and agree to comply with Key Business Solution's reasonable policies and standards.
        </div>

        <div class="list-item">
          <b>2. Starting Date:</b> As discussed during your interview you will start working starting ${form.start_date}.
        </div>

        <div class="list-item">
          <b>3. Weekly Hours:</b> Please note that your hours shall not exceed more than a ${form.no_of_hours} week.
        </div>

        <div class="list-item">
          <b>4. Compensation:</b> Please note that this will be an ${form.compensation}.
        </div>

        <div class="list-item">
          <b>5. Performance Review:</b> Your performance will be monthly, as a progress report for your OPT.
        </div>

        <div class="list-item">
          <b>6. Reports:</b> You will provide Key Business Solutions with weekly reports that are deemed necessary, including periodic summaries of your work-related activities and accomplishments.
        </div>

        <div class="list-item">
          <b>7. Termination:</b> This agreement can be terminated by either party with proper written notice. Please note that should your termination be due to your willful misconduct or non-performance at client site, Key Business Solutions need not provide you with any advance notice. Otherwise, termination will occur at the completion of your OPT.
        </div>

        <div class="list-item">
          <b>8. Confidentiality:</b> You will hold in trust and not disclose to any party, directly or indirectly, during your employment with Key Business Solutions and thereafter, any confidential information relating to research, development, trade secrets, customer-prospect lists or business affairs of Key Business Solutions or its clients.
        </div>

        <div class="list-item">
          <b>9. Non-Solicitation Non-Competition:</b> You agree that during the period of employment here under and for one year following the termination of your employment for any reason, you shall not directly or indirectly, provide any form of consulting or programming service to any Key Business Solutions clients. You further agree that you will not solicit or entertain offers from any of the existing of former clients of Key Business Solutions, whether for yourself or on behalf of any other entity.
        </div>

        <div class="list-item">
          <b>10. Governing Law:</b> This agreement shall be governed by and enforced in accordance with the laws of the State of California.
        </div>

        <div class="signature-section">
          <div style="margin-bottom: 20px;">
            Please note that all of the above terms are effective with your proper obtainment 
            of work authorization through your educational facility and under your OPT Program.
          </div>
          
          <div style="margin-top: 20px;">
            We are very pleased that you will be working with us, and will do all we can to 
            ensure that the transition is smooth, and that our relationship is mutually beneficial.
            
            <p style="margin-top: 30px; font-weight: bold;">Sincerely,</p>
            
            <div style="margin-top: 10px;">
              ${signatureBase64 ? `<img src="${signatureBase64}" class="signature-img" alt="Signature"/>` : ''}
              <p style="margin: 0; font-weight: bold;">Rajan Gutta</p>
              <p style="margin: 0;">President</p>
            </div>

            <p style="margin-top: 40px; font-weight: bold;">
              I agree with the terms stated in this letter.
            </p>

            <table class="signature-table">
              <tr>
                <td>
                  <div class="signature-line"></div>
                  <div>Mr. ${form.full_name}</div>
                </td>
                <td>
                  <div class="signature-line"></div>
                  <div>${form.date}</div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = await asBlob(htmlContent, {
      orientation: 'portrait',
      margins: { top: 1440, right: 1080, bottom: 1440, left: 1080 } // Modern: 1in top/bottom, 0.75in left/right
    });
    
    return blob as Blob;
  };

  const helperBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // --- ACTION HANDLERS ---
  const handlePreviewPdf = async () => {
    setLoadingAction('preview');
    setStatus({ type: null, msg: null });
    try {
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Failed to generate preview. Check console.' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDownloadPdf = async () => {
    setLoadingAction('download-pdf');
    setStatus({ type: null, msg: null });
    try {
      const blob = await generatePdfBlob();
      saveAs(blob, `Offer-${form.full_name.replace(/\s+/g, '_') || 'Candidate'}.pdf`);
      setStatus({ type: 'success', msg: 'PDF Downloaded.' });
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Failed to download PDF.' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDownloadDocx = async () => {
    setLoadingAction('download-docx');
    setStatus({ type: null, msg: null });
    try {
      // Try the alternative generator first for better formatting
      const blob = await generateDocxBlobAlternative();
      saveAs(blob, `Offer-${form.full_name.replace(/\s+/g, '_') || 'Candidate'}.docx`);
      setStatus({ type: 'success', msg: 'DOCX Downloaded.' });
    } catch (err: any) {
      console.error('Alternative DOCX failed, trying fallback:', err);
      // Fallback to original method
      try {
        const blob = await generateDocxBlob();
        saveAs(blob, `Offer-${form.full_name.replace(/\s+/g, '_') || 'Candidate'}.docx`);
        setStatus({ type: 'success', msg: 'DOCX Downloaded (fallback).' });
      } catch (fallbackErr: any) {
        console.error(fallbackErr);
        setStatus({ type: 'error', msg: 'Failed to download DOCX.' });
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSendEmail = async () => {
    setLoadingAction('email');
    setStatus({ type: null, msg: null });
    try {
      const [pdfBlob, docxBlob] = await Promise.all([
        generatePdfBlob(), 
        generateDocxBlobAlternative() // Use alternative for email
      ]);
      const [pdfBase64, docxBase64] = await Promise.all([
        helperBase64(pdfBlob), 
        helperBase64(docxBlob)
      ]);
      
      const payload = {
        to: form.email,
        subject: `Offer Letter - ${form.full_name}`,
        body: 'Attached are your offer documents.',
        pdfBase64,
        docxBase64,
      };
      
      const resp = await apiClient.post('/offerletters/send', payload);
      if (!resp.data?.success) throw new Error(resp.data?.message || 'Email send failed');
      setStatus({ type: 'success', msg: `Email sent to ${form.email}` });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err?.message || 'Failed to send email.' });
    } finally {
      setLoadingAction(null);
    }
  };

  // --- RENDER ---
  const renderField = (key: keyof OfferForm, icon?: React.ReactNode) => (
    <TextField
      fullWidth
      key={key}
      name={key}
      label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
      type={key.includes('date') && !key.includes('candidate') ? 'date' : 'text'}
      InputLabelProps={key.includes('date') ? { shrink: true } : undefined}
      value={form[key]}
      onChange={handleChange}
      error={!form[key]}
      size="small"
      InputProps={{
        startAdornment: icon ? <InputAdornment position="start">{icon}</InputAdornment> : null,
      }}
      sx={{ mb: 2 }}
    />
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', pb: 5, pt: 3 }}>
      <Container maxWidth="xl">
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ color: '#1a1a1a', mb: 1 }}>
          Offer Letter Generator
        </Typography>

        {status.msg && (
          <Alert severity={status.type || 'info'} sx={{ mb: 3 }} onClose={() => setStatus({ type: null, msg: null })}>
            {status.msg}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
          {/* CONTROL PANEL */}
          <Box sx={{ width: { xs: '100%', lg: '33.33%' } }}>
            <Stack spacing={3}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>1. Select Candidate</Typography>
                {employeeError && <Alert severity="error" sx={{ mb: 2 }}>{employeeError}</Alert>}
                <FormControl fullWidth size="small">
                  <InputLabel>Load from Database</InputLabel>
                  <Select
                    value={selectedEmployeeId}
                    label="Load from Database"
                    onChange={(e) => setSelectedEmployeeId(Number(e.target.value) || '')}
                    disabled={loading}
                  >
                    <MenuItem value=""><em>Manual Entry</em></MenuItem>
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Paper>

              <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>2. Offer Details</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 2, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>Candidate Info</Typography>
                  {renderField('full_name', <PersonIcon />)}
                  {renderField('email', <EmailIcon />)}
                  {renderField('university', <SchoolIcon />)}
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 2, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>Job Info</Typography>
                  {renderField('position', <WorkIcon />)}
                  <Stack direction="row" spacing={2}>
                      {renderField('start_date')}
                      {renderField('date')}
                  </Stack>
                  {renderField('compensation')}
                  <Stack direction="row" spacing={2}>
                    {renderField('no_of_hours')}
                    {renderField('status')}
                  </Stack>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                 <Typography variant="h6" gutterBottom>3. Actions</Typography>
                 <Stack spacing={2}>
                    <LoadingButton loading={loadingAction === 'preview'} startIcon={<ViewIcon />} variant="outlined" onClick={handlePreviewPdf} fullWidth>
                      Generate Preview
                    </LoadingButton>
                    <Stack direction="row" spacing={1}>
                      <LoadingButton loading={loadingAction === 'download-pdf'} startIcon={<PdfIcon />} variant="outlined" onClick={handleDownloadPdf} fullWidth disabled={missingFields.length > 0}>
                        PDF
                      </LoadingButton>
                      <LoadingButton loading={loadingAction === 'download-docx'} startIcon={<DocIcon />} variant="outlined" onClick={handleDownloadDocx} fullWidth disabled={missingFields.length > 0}>
                        DOCX
                      </LoadingButton>
                    </Stack>
                    <LoadingButton loading={loadingAction === 'email'} startIcon={<SendIcon />} variant="contained" onClick={handleSendEmail} fullWidth disabled={missingFields.length > 0}>
                      Email Candidate
                    </LoadingButton>
                 </Stack>
              </Paper>
            </Stack>
          </Box>

          {/* PREVIEW PANEL */}
          <Box sx={{ width: { xs: '100%', lg: '66.66%' } }}>
            <Box sx={{ position: 'sticky', top: 24 }}>
              <Card variant="outlined" sx={{ borderColor: missingFields.length ? '#f44336' : 'transparent', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardHeader 
                  title="Live Document Preview" 
                  subheader={missingFields.length ? `Missing: ${missingFields.length} required fields` : "Ready to send"}
                  sx={{ bgcolor: missingFields.length ? '#ffebee' : '#fff', borderBottom: '1px solid #f0f0f0' }}
                />
                <Box sx={{ bgcolor: '#525659', p: 4, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
                      <Paper elevation={5} sx={{ width: '794px', minHeight: '1123px', p: 0, bgcolor: 'white' }}>
                        <div ref={previewRef}>
                          <OfferLetter {...form} />
                        </div>
                      </Paper>
                  </div>
                </Box>
              </Card>

              {pdfUrl && (
                <Box sx={{ mt: 3 }}>
                   <Typography variant="h6" sx={{ mb: 1 }}>PDF Output Verification</Typography>
                   <iframe title="PDF Preview" src={pdfUrl} width="100%" height="600px" style={{ border: '1px solid #ccc', borderRadius: 4 }} />
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default AdminOfferLetterPanel;