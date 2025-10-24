import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { MicroApp } from '../types/microapp.types';
import { microAppsService } from '../services';
import { useNotification } from '../context';

interface EditMicroAppDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  microApp: MicroApp;
}

const EditMicroAppDialog = ({ open, onClose, onSuccess, microApp }: EditMicroAppDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    name: microApp.name,
    description: microApp.description,
    promoText: microApp.promoText || '',
    isMandatory: microApp.isMandatory,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setFormData({
      name: microApp.name,
      description: microApp.description,
      promoText: microApp.promoText || '',
      isMandatory: microApp.isMandatory,
    });
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const updatedMicroApp: MicroApp = {
        ...microApp,
        name: formData.name,
        description: formData.description,
        promoText: formData.promoText,
        isMandatory: formData.isMandatory,
      };

      await microAppsService.upsert(updatedMicroApp);
      showNotification('Micro app updated successfully', 'success');
      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Error updating micro app:', error);
      showNotification(
        error instanceof Error ? error.message : 'Failed to update micro app',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Edit Micro App</Typography>
          <IconButton onClick={handleClose} size="small" disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="App ID"
            value={microApp.appId}
            disabled
            fullWidth
            helperText="App ID cannot be changed"
          />
          <TextField
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
            disabled={loading}
          />
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            error={!!errors.description}
            helperText={errors.description}
            multiline
            rows={3}
            fullWidth
            required
            disabled={loading}
          />
          <TextField
            label="Promo Text"
            value={formData.promoText}
            onChange={(e) => setFormData((prev) => ({ ...prev, promoText: e.target.value }))}
            fullWidth
            disabled={loading}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.isMandatory === 1}
                onChange={(e) => setFormData((prev) => ({ ...prev, isMandatory: e.target.checked ? 1 : 0 }))}
                disabled={loading}
              />
            }
            label="Mandatory App"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Updating...' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditMicroAppDialog;
