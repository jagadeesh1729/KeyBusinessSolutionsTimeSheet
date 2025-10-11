import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from '@mui/material';
import ButtonComp from '../atoms/Button';

interface RejectionReasonModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

const RejectionReasonModal = ({ open, onClose, onSubmit }: RejectionReasonModalProps) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setReason(''); // Reset reason when modal opens
    }
  }, [open]);

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Reason for Rejection</DialogTitle>
      <DialogContent>
        <TextField autoFocus margin="dense" label="Rejection Reason" type="text" fullWidth multiline rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <ButtonComp text="Cancel" onClick={onClose} />
        <ButtonComp text="Submit Rejection" variant="contained" color="error" onClick={handleSubmit} />
      </DialogActions>
    </Dialog>
  );
};

export default RejectionReasonModal;