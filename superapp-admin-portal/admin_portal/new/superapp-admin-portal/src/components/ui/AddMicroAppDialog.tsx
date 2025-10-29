import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  Paper,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AddIcon from "@mui/icons-material/Add";
import type { MicroApp } from "../../types/microapp.types";
import { microAppsService, apiService } from "../../services";
import { useNotification } from "../../context";
import { validateZipFile } from "../../utils";

interface AddMicroAppDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const steps = [
  "Basic Information",
  "Upload Assets",
  "Version Details",
  "Assign Roles",
  "Review",
];

const AddMicroAppDialog = ({
  open,
  onClose,
  onSuccess,
}: AddMicroAppDialogProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    icon?: number;
    banner?: number;
    zip?: number;
  }>({});
  const [pendingFiles, setPendingFiles] = useState<{
    icon?: File;
    banner?: File;
    zip?: File;
  }>({});
  const { showNotification } = useNotification();

  // Form state
  const [formData, setFormData] = useState({
    appId: "",
    name: "",
    description: "",
    promoText: "",
    isMandatory: 0,
    iconUrl: "",
    bannerImageUrl: "",
    version: {
      version: "",
      build: 1,
      releaseNotes: "",
      iconUrl: "",
      downloadUrl: "",
    },
    roles: [] as string[],
  });

  const [newRole, setNewRole] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    // Upload pending files before moving to next step
    if (activeStep === 1) {
      // Upload Assets step - upload icon and banner
      try {
        setLoading(true);

        if (pendingFiles.icon) {
          showNotification("Uploading icon...", "info");
          await uploadFile(pendingFiles.icon, "icon");
        }

        if (pendingFiles.banner) {
          showNotification("Uploading banner...", "info");
          await uploadFile(pendingFiles.banner, "banner");
        }

        setPendingFiles((prev) => ({
          ...prev,
          icon: undefined,
          banner: undefined,
        }));
        showNotification("Assets uploaded successfully!", "success");
      } catch (error) {
        console.error("Upload error:", error);
        showNotification(
          error instanceof Error ? error.message : "Failed to upload assets",
          "error",
        );
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 2) {
      // Version Details step - upload ZIP
      try {
        setLoading(true);

        if (pendingFiles.zip) {
          showNotification("Uploading app package...", "info");
          await uploadFile(pendingFiles.zip, "zip");
        }

        setPendingFiles((prev) => ({ ...prev, zip: undefined }));
        showNotification("App package uploaded successfully!", "success");
      } catch (error) {
        console.error("Upload error:", error);
        showNotification(
          error instanceof Error
            ? error.message
            : "Failed to upload app package",
          "error",
        );
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      appId: "",
      name: "",
      description: "",
      promoText: "",
      isMandatory: 0,
      iconUrl: "",
      bannerImageUrl: "",
      version: {
        version: "",
        build: 1,
        releaseNotes: "",
        iconUrl: "",
        downloadUrl: "",
      },
      roles: [],
    });
    setErrors({});
    onClose();
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Information
        if (!formData.appId.trim()) newErrors.appId = "App ID is required";
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.description.trim())
          newErrors.description = "Description is required";
        break;
      case 1: // Upload Assets
        if (!formData.iconUrl && !pendingFiles.icon)
          newErrors.iconUrl = "App icon is required";
        // Banner is optional
        break;
      case 2: // Version Details
        if (!formData.version.version.trim())
          newErrors.version = "Version is required";
        if (!formData.version.releaseNotes.trim())
          newErrors.releaseNotes = "Release notes are required";
        if (!formData.version.downloadUrl && !pendingFiles.zip)
          newErrors.downloadUrl = "App package (ZIP) is required";
        break;
      case 3: // Roles
        if (formData.roles.length === 0)
          newErrors.roles = "At least one role is required";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFile = async (file: File, type: "icon" | "banner" | "zip") => {
    try {
      setUploadProgress((prev) => ({ ...prev, [type]: 0 }));

      const result = await apiService.uploadFile(file);

      setUploadProgress((prev) => ({ ...prev, [type]: 100 }));

      // Update form data with the uploaded URL
      if (type === "icon") {
        setFormData((prev) => ({
          ...prev,
          iconUrl: result.url,
          version: { ...prev.version, iconUrl: result.url },
        }));
      } else if (type === "banner") {
        setFormData((prev) => ({ ...prev, bannerImageUrl: result.url }));
      } else if (type === "zip") {
        setFormData((prev) => ({
          ...prev,
          version: { ...prev.version, downloadUrl: result.url },
        }));
      }

      setTimeout(() => {
        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[type];
          return newProgress;
        });
      }, 1000);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[type];
        return newProgress;
      });
      throw error;
    }
  };

  const handleFileSelect = async (
    file: File | null,
    type: "icon" | "banner" | "zip",
  ) => {
    if (file) {
      // Validate ZIP files before accepting them
      if (type === "zip") {
        const validation = await validateZipFile(file);

        if (!validation.valid) {
          showNotification(validation.error || "Invalid ZIP file", "error");
          return;
        }
      }

      setPendingFiles((prev) => ({ ...prev, [type]: file }));
      showNotification(
        `${type === "icon" ? "Icon" : type === "banner" ? "Banner" : "App package"} selected. Click Next to upload.`,
        "info",
      );
    } else {
      setPendingFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[type];
        return newFiles;
      });
    }
  };

  const handleAddRole = () => {
    if (newRole.trim() && !formData.roles.includes(newRole.trim())) {
      setFormData((prev) => ({
        ...prev,
        roles: [...prev.roles, newRole.trim()],
      }));
      setNewRole("");
    }
  };

  const handleRemoveRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.filter((r) => r !== role),
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    try {
      setLoading(true);

      const microApp: MicroApp = {
        appId: formData.appId,
        name: formData.name,
        description: formData.description,
        promoText: formData.promoText,
        isMandatory: formData.isMandatory,
        iconUrl: formData.iconUrl,
        bannerImageUrl: formData.bannerImageUrl,
        versions: [formData.version],
        roles: formData.roles.map((role) => ({ role })),
      };

      await microAppsService.upsert(microApp);
      showNotification("Micro app created successfully", "success");
      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Error creating micro app:", error);
      showNotification(
        error instanceof Error ? error.message : "Failed to create micro app",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="App ID"
              placeholder="com.example.myapp"
              value={formData.appId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, appId: e.target.value }))
              }
              error={!!errors.appId}
              helperText={
                errors.appId || "Unique identifier (e.g., com.wso2.leaveapp)"
              }
              fullWidth
              required
            />
            <TextField
              label="App Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              error={!!errors.description}
              helperText={errors.description}
              multiline
              rows={3}
              fullWidth
              required
            />
            <TextField
              label="Promotional Text"
              value={formData.promoText}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, promoText: e.target.value }))
              }
              helperText="Short tagline for the app"
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isMandatory === 1}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isMandatory: e.target.checked ? 1 : 0,
                    }))
                  }
                />
              }
              label="Mandatory App (users must install this app)"
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                App Icon (128x128 PNG) *
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1 }}
              >
                Required size: 128x128px. Formats: PNG, JPEG
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  disabled={!!uploadProgress.icon}
                >
                  Upload Icon
                  <input
                    type="file"
                    hidden
                    accept="image/png,image/jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      handleFileSelect(file || null, "icon");
                    }}
                  />
                </Button>
                {pendingFiles.icon && !formData.iconUrl && (
                  <Chip
                    label={`Selected: ${pendingFiles.icon.name}`}
                    color="info"
                    size="small"
                    onDelete={() => handleFileSelect(null, "icon")}
                  />
                )}
                {formData.iconUrl && (
                  <Chip
                    label="Uploaded"
                    color="success"
                    size="small"
                    onDelete={() =>
                      setFormData((prev) => ({ ...prev, iconUrl: "" }))
                    }
                  />
                )}
              </Box>
              {uploadProgress.icon !== undefined && (
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress.icon}
                  sx={{ mt: 1 }}
                />
              )}
              {errors.iconUrl && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 1, display: "block" }}
                >
                  {errors.iconUrl}
                </Typography>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Banner Image (for app store) - Optional
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1 }}
              >
                Recommended size: 1200x400px. Formats: PNG, JPEG
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  disabled={!!uploadProgress.banner}
                >
                  Upload Banner
                  <input
                    type="file"
                    hidden
                    accept="image/png,image/jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      handleFileSelect(file || null, "banner");
                    }}
                  />
                </Button>
                {pendingFiles.banner && !formData.bannerImageUrl && (
                  <Chip
                    label={`Selected: ${pendingFiles.banner.name}`}
                    color="info"
                    size="small"
                    onDelete={() => handleFileSelect(null, "banner")}
                  />
                )}
                {formData.bannerImageUrl && (
                  <Chip
                    label="Uploaded"
                    color="success"
                    size="small"
                    onDelete={() =>
                      setFormData((prev) => ({ ...prev, bannerImageUrl: "" }))
                    }
                  />
                )}
              </Box>
              {uploadProgress.banner !== undefined && (
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress.banner}
                  sx={{ mt: 1 }}
                />
              )}
              {errors.bannerImageUrl && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 1, display: "block" }}
                >
                  {errors.bannerImageUrl}
                </Typography>
              )}
            </Paper>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Version"
              placeholder="1.0.0"
              value={formData.version.version}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  version: { ...prev.version, version: e.target.value },
                }))
              }
              error={!!errors.version}
              helperText={errors.version}
              fullWidth
              required
            />
            <TextField
              label="Build Number"
              type="number"
              value={formData.version.build}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  version: {
                    ...prev.version,
                    build: parseInt(e.target.value) || 1,
                  },
                }))
              }
              fullWidth
              required
            />
            <TextField
              label="Release Notes"
              value={formData.version.releaseNotes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  version: { ...prev.version, releaseNotes: e.target.value },
                }))
              }
              error={!!errors.releaseNotes}
              helperText={errors.releaseNotes}
              multiline
              rows={3}
              fullWidth
              required
            />
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                App Package (ZIP file) *
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  disabled={!!uploadProgress.zip}
                >
                  Upload ZIP
                  <input
                    type="file"
                    hidden
                    accept=".zip"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      handleFileSelect(file || null, "zip");
                    }}
                  />
                </Button>
                {pendingFiles.zip && !formData.version.downloadUrl && (
                  <Chip
                    label={`Selected: ${pendingFiles.zip.name}`}
                    color="info"
                    size="small"
                    onDelete={() => handleFileSelect(null, "zip")}
                  />
                )}
                {formData.version.downloadUrl && (
                  <Chip
                    label="Uploaded"
                    color="success"
                    size="small"
                    onDelete={() =>
                      setFormData((prev) => ({
                        ...prev,
                        version: { ...prev.version, downloadUrl: "" },
                      }))
                    }
                  />
                )}
              </Box>
              {uploadProgress.zip !== undefined && (
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress.zip}
                  sx={{ mt: 1 }}
                />
              )}
              {errors.downloadUrl && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 1, display: "block" }}
                >
                  {errors.downloadUrl}
                </Typography>
              )}
            </Paper>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Assign roles/groups that can access this micro app
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                label="Role/Group Name"
                placeholder="e.g., admin, employee"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRole();
                  }
                }}
                fullWidth
                size="small"
              />
              <IconButton
                color="primary"
                onClick={handleAddRole}
                disabled={!newRole.trim()}
              >
                <AddIcon />
              </IconButton>
            </Box>
            {errors.roles && <Alert severity="error">{errors.roles}</Alert>}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
              {formData.roles.map((role) => (
                <Chip
                  key={role}
                  label={role}
                  onDelete={() => handleRemoveRole(role)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
            {formData.roles.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic", mt: 1 }}
              >
                No roles assigned yet. Add at least one role.
              </Typography>
            )}
          </Box>
        );

      case 4:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review Your Micro App
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Basic Information
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>App ID:</strong> {formData.appId}
                </Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {formData.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Description:</strong> {formData.description}
                </Typography>
                <Typography variant="body2">
                  <strong>Mandatory:</strong>{" "}
                  {formData.isMandatory === 1 ? "Yes" : "No"}
                </Typography>
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Version
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Version:</strong> {formData.version.version} (Build{" "}
                  {formData.version.build})
                </Typography>
                <Typography variant="body2">
                  <strong>Release Notes:</strong>{" "}
                  {formData.version.releaseNotes}
                </Typography>
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Roles
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {formData.roles.map((role) => (
                  <Chip
                    key={role}
                    label={role}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Add New Micro App</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ pt: 2, pb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Box sx={{ flex: "1 1 auto" }} />
        <Button onClick={handleBack} disabled={activeStep === 0 || loading}>
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create Micro App"}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext} disabled={loading}>
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddMicroAppDialog;
