import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Container,
  Card,
  CardContent,
  CardActions,
  Grid,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DownloadIcon from "@mui/icons-material/Download";
import AppsIcon from "@mui/icons-material/Apps";
import type { MicroApp } from "../types/microapp.types";
import { useNotification } from "../context";
import { microAppsService } from "../services";
import {
  ConfirmDialog,
  EditMicroAppDialog,
  AddVersionDialog,
} from "..";
import AddMicroAppDialog from "../components/ui/AddMicroAppDialog";

const MicroApps = () => {
  const [microApps, setMicroApps] = useState<MicroApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    microApp?: MicroApp;
  }>({
    open: false,
  });
  const [versionDialog, setVersionDialog] = useState<{
    open: boolean;
    microApp?: MicroApp;
  }>({
    open: false,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    appId: string;
    appName: string;
  }>({
    open: false,
    appId: "",
    appName: "",
  });
  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement | null;
    microApp: MicroApp | null;
  }>({
    element: null,
    microApp: null,
  });
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchMicroApps();
  }, []);

  const fetchMicroApps = async () => {
    try {
      setLoading(true);
      const data = await microAppsService.getAll();
      setMicroApps(data);
    } catch (error) {
      console.error("Error fetching micro apps:", error);
      showNotification(
        error instanceof Error ? error.message : "Failed to load micro apps",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddMicroApp = () => {
    setAddDialogOpen(true);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    microApp: MicroApp,
  ) => {
    setMenuAnchor({ element: event.currentTarget, microApp });
  };

  const handleMenuClose = () => {
    setMenuAnchor({ element: null, microApp: null });
  };

  const handleToggleExpand = (appId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });
  };

  const handleEditInfo = () => {
    if (menuAnchor.microApp) {
      setEditDialog({ open: true, microApp: menuAnchor.microApp });
    }
    handleMenuClose();
  };

  const handleAddVersion = () => {
    if (menuAnchor.microApp) {
      setVersionDialog({ open: true, microApp: menuAnchor.microApp });
    }
    handleMenuClose();
  };

  const handleDeleteClick = (appId: string, appName: string) => {
    setDeleteDialog({ open: true, appId, appName });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, appId: "", appName: "" });
  };

  const handleDeleteConfirm = async () => {
    const { appId } = deleteDialog;
    setDeleteDialog({ open: false, appId: "", appName: "" });

    try {
      await microAppsService.delete(appId);
      showNotification("Micro app deleted successfully", "success");
      // Refresh the list
      fetchMicroApps();
    } catch (error) {
      console.error("Error deleting micro app:", error);
      showNotification(
        error instanceof Error ? error.message : "Failed to delete micro app",
        "error",
      );
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box mb={4}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              fontWeight={700}
              gutterBottom
            >
              Micro Apps
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and deploy your micro applications
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleAddMicroApp}
            sx={{
              borderRadius: 1,
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 600,
              boxShadow: 2,
              "&:hover": {
                boxShadow: 4,
                transform: "translateY(-2px)",
              },
              transition: "all 0.2s",
            }}
          >
            Add Micro App
          </Button>
        </Box>
      </Box>

      {microApps.length === 0 ? (
        <Paper
          sx={{
            p: 8,
            textAlign: "center",
            borderRadius: 3,
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            border: "none",
          }}
        >
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              bgcolor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
              mb: 3,
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            <AppsIcon sx={{ fontSize: 60, color: "primary.main" }} />
          </Box>
          <Typography
            variant="h5"
            fontWeight={600}
            gutterBottom
            sx={{ color: "text.primary", mb: 1 }}
          >
            No Micro Apps Yet
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              maxWidth: 500,
              mx: "auto",
              mb: 4,
            }}
          >
            Start building your ecosystem by adding your first micro
            application. It only takes a few clicks!
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleAddMicroApp}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 600,
              boxShadow: 2,
            }}
          >
            Add Your First App
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3} sx={{ alignItems: "flex-start" }}>
          {microApps.map((app) => (
            <Grid item xs={12} sm={6} md={4} key={app.appId}>
              <Card
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent
                  sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar
                      src={app.iconUrl}
                      alt={app.name}
                      variant="rounded"
                      sx={{ width: 56, height: 56, mr: 2 }}
                    />
                    <Box flexGrow={1}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {app.name}
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip
                          label={
                            app.isMandatory === 1 ? "Mandatory" : "Optional"
                          }
                          color={app.isMandatory === 1 ? "primary" : "default"}
                          size="small"
                        />
                        <Chip
                          label={`${app.versions.length} version${app.versions.length !== 1 ? "s" : ""}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: 40,
                    }}
                  >
                    {app.description}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="monospace"
                    display="block"
                    mb={1.5}
                  >
                    App Id : {app.appId}
                  </Typography>

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      mb={0.5}
                    >
                      Roles:{" "}
                      {app.roles.length > 0
                        ? app.roles.map((role) => role.role).join(", ")
                        : "None"}
                    </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {app.roles.slice(0, 3).map((role, index) => (
                        <Chip
                          key={index}
                          label={role.role}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem", height: 20 }}
                        />
                      ))}
                      {app.roles.length > 3 && (
                        <Chip
                          label={`+${app.roles.length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem", height: 20 }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Versions Section */}
                  <Box mt={2}>
                    <Button
                      size="small"
                      onClick={() => handleToggleExpand(app.appId)}
                      endIcon={
                        expandedCards.has(app.appId) ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )
                      }
                      sx={{ textTransform: "none", mb: 1 }}
                    >
                      {expandedCards.has(app.appId) ? "Hide" : "Show"} Versions
                      ({app.versions.length})
                    </Button>
                    <Collapse in={expandedCards.has(app.appId)}>
                      <Divider sx={{ mb: 1 }} />
                      <Box
                        sx={{
                          maxHeight: 300,
                          overflowY: "auto",
                          overflowX: "hidden",
                          pr: 0.5,
                          "&::-webkit-scrollbar": {
                            width: "6px",
                          },
                          "&::-webkit-scrollbar-track": {
                            backgroundColor: "transparent",
                          },
                          "&::-webkit-scrollbar-thumb": {
                            backgroundColor: "divider",
                            borderRadius: "3px",
                            "&:hover": {
                              backgroundColor: "action.disabled",
                            },
                          },
                        }}
                      >
                        <Stack spacing={1}>
                          {app.versions.map((version, idx) => (
                            <Paper
                              key={idx}
                              variant="outlined"
                              sx={{
                                p: 1.5,
                                bgcolor: "background.default",
                              }}
                            >
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={0.5}
                              >
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={600}
                                >
                                  Version {version.version}
                                </Typography>
                                <Chip
                                  label={`Build ${version.build}`}
                                  size="small"
                                  sx={{ fontSize: "0.65rem", height: 18 }}
                                />
                              </Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                                sx={{
                                  mb: 1,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {version.releaseNotes}
                              </Typography>
                              {version.downloadUrl && (
                                <Box
                                  display="flex"
                                  alignItems="center"
                                  gap={0.5}
                                >
                                  <DownloadIcon
                                    sx={{
                                      fontSize: 14,
                                      color: "text.secondary",
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    color="primary"
                                    sx={{
                                      cursor: "pointer",
                                      textDecoration: "none",
                                      "&:hover": {
                                        textDecoration: "underline",
                                      },
                                    }}
                                    component="a"
                                    href={version.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Download Package
                                  </Typography>
                                </Box>
                              )}
                            </Paper>
                          ))}
                        </Stack>
                      </Box>
                    </Collapse>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0, justifyContent: "flex-end" }}>
                  <Tooltip title="More actions">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, app)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditInfo}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Information</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleAddVersion}>
          <ListItemIcon>
            <NewReleasesIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add New Version</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuAnchor.microApp) {
              handleDeleteClick(
                menuAnchor.microApp.appId,
                menuAnchor.microApp.name,
              );
            }
            handleMenuClose();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Micro App"
        message={`Are you sure you want to delete "${deleteDialog.appName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />

      <AddMicroAppDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={() => {
          fetchMicroApps();
          setAddDialogOpen(false);
        }}
      />

      {editDialog.microApp && (
        <EditMicroAppDialog
          open={editDialog.open}
          onClose={() => setEditDialog({ open: false })}
          onSuccess={fetchMicroApps}
          microApp={editDialog.microApp}
        />
      )}

      {versionDialog.microApp && (
        <AddVersionDialog
          open={versionDialog.open}
          onClose={() => setVersionDialog({ open: false })}
          onSuccess={fetchMicroApps}
          microApp={versionDialog.microApp}
        />
      )}
    </Container>
  );
};

export default MicroApps;
