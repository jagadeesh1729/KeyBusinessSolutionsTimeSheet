import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, List, ListItem, ListItemText, TextField, Typography } from '@mui/material';
// Using Tailwind grid classes instead of MUI Grid
import type Employee from '../types/employee';
import apiClient from '../../api/apiClient';

interface Props {
  open: boolean;
  employee: Employee;
  adminName: string;
  onClose: () => void;
}

const requiredFields = new Set(['first_name','last_name','email']);

const OfferLetterEditor: React.FC<Props> = ({ open, employee, adminName, onClose }) => {
  const [subject, setSubject] = useState('Your Offer Letter');
  const [body, setBody] = useState('Please find your offer letter attached.');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState<string>('');

  const fields = useMemo(() => {
    const order: string[] = [
      'first_name','last_name','email','phone','job_title','compensation','no_of_hours','visa_status','job_duties','date_of_birth','job_start_date','start_date','end_date','college_name','college_address','degree'
    ];
    const items = order
      .filter(k => Object.prototype.hasOwnProperty.call(employee, k))
      .map((k, idx) => ({
        name: k,
        required: requiredFields.has(k),
        type: typeof (employee as any)[k] === 'number' ? 'number' : 'string',
        order: idx + 1,
        value: (employee as any)[k]
      }));
    return items;
  }, [employee]);

  useEffect(() => {
    if (!open) return;
    const initial = employee.offerLetter?.content ?? `
      <h2>Offer Letter</h2>
      <p>Dear ${employee.first_name} ${employee.last_name},</p>
      <p>We are pleased to offer you the position of <b>${employee.job_title ?? ''}</b>.</p>
      <p>Compensation: <b>${employee.compensation ?? ''}</b>. Hours per week: <b>${employee.no_of_hours ?? ''}</b>.</p>
      <p>Start Date: <b>${employee.start_date ?? employee.job_start_date ?? ''}</b></p>
      <p>Sincerely,<br/>${adminName}</p>
    `;
    setHtml(initial);
    if (editorRef.current) editorRef.current.innerHTML = initial;
  }, [open, employee.offerLetter?.content, adminName, employee]);

  const handleEditorInput = () => {
    if (editorRef.current) setHtml(editorRef.current.innerHTML);
  };

  const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = reject;
    document.body.appendChild(s);
  });

  const generatePdfAndSend = async () => {
    // Purpose: Convert current HTML content to PDF and send to employee; Inputs: HTML content, employee email, subject, body.
    setSending(true); setError(null);
    try {
      const currentHtml = html || editorRef.current?.innerHTML || '';
      if (!currentHtml) throw new Error('Editor not ready');
      if (!(window as any).html2canvas) {
        await loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
      }
      if (!(window as any).jspdf) {
        await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
      }
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF('p','pt','a4');
      const temp = document.createElement('div');
      temp.style.width = '800px';
      temp.innerHTML = currentHtml;
      await doc.html(temp, { x: 20, y: 20, width: 555, windowWidth: 800 });
      const pdfBlob = doc.output('blob');
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const payload = {
        to: employee.email,
        subject: subject || 'Your Offer Letter',
        body: body || 'Please find your offer letter attached.',
        filename: `offer-letter-${employee.first_name}-${employee.last_name}.pdf`,
        pdfBase64: base64,
      };
      const resp = await apiClient.post('/offerletters/send', payload);
      if (!resp.data?.success) throw new Error(resp.data?.message || 'Failed to send email');
      console.log('PDF emailed successfully.');
    } catch (e: any) {
      console.error('Offer letter send failed:', e);
      setError(e?.message || 'Failed to generate or send offer letter');
    } finally {
      setSending(false);
    }
  };

  const saveDraft = async () => {
    setSaving(true); setError(null);
    try {
      const content = html || editorRef.current?.innerHTML || '';
      console.log('Saving offer draft for employee', employee.id, { content, lastEditedBy: adminName, lastEditedAt: new Date().toISOString() });
    } catch (e: any) {
      setError(e?.message || 'Failed to save offer draft');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Offer Letter for {employee.first_name} {employee.last_name}</DialogTitle>
      <DialogContent>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-12 md:col-span-4">
            <Typography variant="subtitle1" fontWeight="bold">Employee Fields</Typography>
            <List dense>
              {fields.map(f => (
                <ListItem key={f.name}>
                  <ListItemText
                    primary={`${f.order}. ${f.name} (${f.type}) ${f.required ? '[required]' : '[optional]'}`}
                    secondary={`${f.value ?? ''}`}
                  />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2">Email</Typography>
            <TextField label="Subject" fullWidth size="small" sx={{ my: 0.5 }} value={subject} onChange={e => setSubject(e.target.value)} />
            <TextField label="Body" fullWidth multiline minRows={3} value={body} onChange={e => setBody(e.target.value)} />
          </div>
          <div className="col-span-12 md:col-span-8">
            <Typography variant="subtitle1" fontWeight="bold">Document Editor (Live HTML Editor)</Typography>
            <Box sx={{ mb: 1, display: 'flex', gap: 1 }}>
              <Button size="small" onClick={() => document.execCommand('bold')}>Bold</Button>
              <Button size="small" onClick={() => document.execCommand('italic')}>Italic</Button>
              <Button size="small" onClick={() => document.execCommand('underline')}>Underline</Button>
              <Button size="small" onClick={() => document.execCommand('insertUnorderedList')}>• List</Button>
            </Box>
            <Box ref={editorRef} contentEditable suppressContentEditableWarning onInput={handleEditorInput}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: 360, p: 2, typography: 'body1', bgcolor: 'background.paper' }} />
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Preview</Typography>
            <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, minHeight: 180, p: 2 }}
              dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
        {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={saveDraft} disabled={saving}>{saving ? 'Saving...' : 'Save Draft'}</Button>
        <Button variant="contained" onClick={generatePdfAndSend} disabled={sending}>
          {sending ? 'Generating & Sending...' : 'Generate PDF & Send'}
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OfferLetterEditor;
