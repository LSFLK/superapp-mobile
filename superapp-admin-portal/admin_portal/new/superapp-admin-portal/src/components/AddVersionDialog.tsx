import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Typography,
  IconButton,
  Paper,
  Chip,
  LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import type { MicroApp } from '../types/microapp.types';
import { microAppsService, apiService } from '../services';
import { useNotification } from '../context';

interface AddVersionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  microApp: MicroApp;
}

const AddVersionDialog = ({ open, onClose, onSuccess, microApp }: AddVersionDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>();
  const [pendingFile, setPendingFile] = useState<File | undefined>();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    version: '',
    build: 1,
    releaseNotes: '',
    downloadUrl: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setFormData({
      version: '',
      build: 1,
      releaseNotes: '',
      downloadUrl: '',
    });
    setPendingFile(undefined);
    setUploadProgress(undefined);
    setErrors({});
    onClose();
  };

  const handleFileSelect = (file: File | null) => {
    if (file) {
      setPendingFile(file);
      showNotification(`Package selected: ${file.name}`, 'info');
    } else {
      setPendingFile(undefined);
      setFormData((prev) => ({ ...prev, downloadUrl: '' }));
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setUploadProgress(0);
      
      const result = await apiService.uploadFile(file);
      
      setUploadProgress(100);
      setFormData((prev) => ({ ...prev, downloadUrl: result.url }));

      setTimeout(() => {
        setUploadProgress(undefined);
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(undefined);
      throw error;
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.version.trim()) newErrors.version = 'Version is required';
    if (!formData.releaseNotes.trim()) newErrors.releaseNotes = 'Release notes are required';
    if (!formData.downloadUrl && !pendingFile) newErrors.downloadUrl = 'App package (ZIP) is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      // Upload file if pending
      if (pendingFile) {
        showNotification('Uploading app package...', 'info');
        await uploadFile(pendingFile);
        setPendingFile(undefined);
        showNotification('Package uploaded successfully!', 'success');
      }

      // Add new version
      const newVersion = {
        version: formData.version,
        build: formData.build,
        releaseNotes: formData.releaseNotes,
        iconUrl: microApp.iconUrl,
        downloadUrl: formData.downloadUrl,
      };

      const updatedMicroApp: MicroApp = {
        ...microApp,
        versions: [...(microApp.versions || []), newVersion],
      };

      await microAppsService.upsert(updatedMicroApp);
      showNotification('New version added successfully', 'success');
      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Error adding version:', error);
      showNotification(
        error instanceof Error ? error.message : 'Failed to add version',
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
          <Typography variant="h6">Add New Version</Typography>
          <IconButton onClick={handleClose} size="small" disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2, mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Adding new version to: <strong>{microApp.name}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            App ID: {microApp.appId}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Version"
            placeholder="1.0.0"
            value={formData.version}
            onChange={(e) => setFormData((prev) => ({ ...prev, version: e.target.value }))}
            error={!!errors.version}
            helperText={errors.version || 'Semantic version (e.g., 1.0.0)'}
            fullWidth
            required
            disabled={loading}
          />
          
          <TextField
            label="Build Number"
            type="number"
            value={formData.build}
            onChange={(e) => setFormData((prev) => ({ ...prev, build: parseInt(e.target.value) || 1 }))}
            fullWidth
            disabled={loading}
          />

          <TextField
            label="Release Notes"
            placeholder="What's new in this version?"
            value={formData.releaseNotes}
            onChange={(e) => setFormData((prev) => ({ ...prev, releaseNotes: e.target.value }))}
            error={!!errors.releaseNotes}
            helperText={errors.releaseNotes}
            multiline
            rows={3}
            fullWidth
            required
            disabled={loading}
          />

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              App Package (ZIP) *
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Upload the ZIP file containing the app bundle
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                disabled={!!uploadProgress || loading}
              >
                Upload ZIP
                <input
                  type="file"
                  hidden
                  accept=".zip"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    handleFileSelect(file || null);
                  }}
                />
              </Button>
              {pendingFile && !formData.downloadUrl && (
                <Chip
                  label={`Selected: ${pendingFile.name}`}
                  color="info"
                  size="small"
                  onDelete={() => handleFileSelect(null)}
                />
              )}
              {formData.downloadUrl && (
                <Chip
                  label="Uploaded"
                  color="success"
                  size="small"
                  onDelete={() => {
                    setFormData((prev) => ({ ...prev, downloadUrl: '' }));
                    setPendingFile(undefined);
                  }}
                />
              )}
            </Box>
            {uploadProgress !== undefined && (
              <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1 }} />
            )}
            {errors.downloadUrl && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {errors.downloadUrl}
              </Typography>
            )}
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Adding...' : 'Add Version'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddVersionDialog;
