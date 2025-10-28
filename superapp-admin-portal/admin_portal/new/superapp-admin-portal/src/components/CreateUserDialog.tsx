import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Tab,
  Tabs,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useNotification } from "../context";
import { usersService, type User } from "../services";

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const CreateUserDialog = ({
  open,
  onClose,
  onSuccess,
}: CreateUserDialogProps) => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  // Single user state
  const [singleUser, setSingleUser] = useState<User>({
    workEmail: "",
    firstName: "",
    lastName: "",
    userThumbnail: "",
    location: "",
  });

  // Bulk users state
  const [bulkUsers, setBulkUsers] = useState<User[]>([
    {
      workEmail: "",
      firstName: "",
      lastName: "",
      userThumbnail: "",
      location: "",
    },
  ]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSingleUserChange = (field: keyof User, value: string) => {
    setSingleUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleBulkUserChange = (
    index: number,
    field: keyof User,
    value: string,
  ) => {
    setBulkUsers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addBulkUser = () => {
    setBulkUsers((prev) => [
      ...prev,
      {
        workEmail: "",
        firstName: "",
        lastName: "",
        userThumbnail: "",
        location: "",
      },
    ]);
  };

  const removeBulkUser = (index: number) => {
    if (bulkUsers.length > 1) {
      setBulkUsers((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const validateSingleUser = (): boolean => {
    if (
      !singleUser.workEmail ||
      !singleUser.firstName ||
      !singleUser.lastName
    ) {
      showNotification("Please fill in all required fields", "error");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(singleUser.workEmail)) {
      showNotification("Please enter a valid email address", "error");
      return false;
    }
    return true;
  };

  const validateBulkUsers = (): boolean => {
    for (let i = 0; i < bulkUsers.length; i++) {
      const user = bulkUsers[i];
      if (!user.workEmail || !user.firstName || !user.lastName) {
        showNotification(
          `Please fill in all required fields for user ${i + 1}`,
          "error",
        );
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.workEmail)) {
        showNotification(
          `Please enter a valid email address for user ${i + 1}`,
          "error",
        );
        return false;
      }
    }
    // Check for duplicate emails
    const emails = bulkUsers.map((u) => u.workEmail.toLowerCase());
    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      showNotification("Duplicate email addresses found", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (tabValue === 0) {
        // Single user
        if (!validateSingleUser()) {
          return;
        }
        await usersService.createUser(singleUser);
        showNotification("User created successfully", "success");
      } else {
        // Bulk users
        if (!validateBulkUsers()) {
          return;
        }
        await usersService.createBulkUsers(bulkUsers);
        showNotification(
          `${bulkUsers.length} users created successfully`,
          "success",
        );
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error creating user(s):", error);
      showNotification("Failed to create user(s)", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form
      setSingleUser({
        workEmail: "",
        firstName: "",
        lastName: "",
        userThumbnail: "",
        location: "",
      });
      setBulkUsers([
        {
          workEmail: "",
          firstName: "",
          lastName: "",
          userThumbnail: "",
          location: "",
        },
      ]);
      setTabValue(0);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Add Users
          </Typography>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab
              icon={<PersonAddIcon />}
              label="Single User"
              iconPosition="start"
            />
            <Tab
              icon={<GroupAddIcon />}
              label="Bulk Add"
              iconPosition="start"
            />
          </Tabs>
        </Box>
      </DialogTitle>

      <DialogContent>
        <TabPanel value={tabValue} index={0}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={singleUser.workEmail}
              onChange={(e) =>
                handleSingleUserChange("workEmail", e.target.value)
              }
              fullWidth
              required
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="First Name"
                value={singleUser.firstName}
                onChange={(e) =>
                  handleSingleUserChange("firstName", e.target.value)
                }
                fullWidth
                required
              />
              <TextField
                label="Last Name"
                value={singleUser.lastName}
                onChange={(e) =>
                  handleSingleUserChange("lastName", e.target.value)
                }
                fullWidth
                required
              />
            </Box>
            <TextField
              label="Profile Picture URL"
              value={singleUser.userThumbnail}
              onChange={(e) =>
                handleSingleUserChange("userThumbnail", e.target.value)
              }
              fullWidth
            />
            <TextField
              label="Location"
              value={singleUser.location}
              onChange={(e) =>
                handleSingleUserChange("location", e.target.value)
              }
              fullWidth
            />
          </Stack>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Stack spacing={3}>
            {bulkUsers.map((user, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  position: "relative",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    User {index + 1}
                  </Typography>
                  {bulkUsers.length > 1 && (
                    <Tooltip title="Remove user">
                      <IconButton
                        size="small"
                        onClick={() => removeBulkUser(index)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Stack spacing={2}>
                  <TextField
                    label="Email"
                    type="email"
                    value={user.workEmail}
                    onChange={(e) =>
                      handleBulkUserChange(index, "workEmail", e.target.value)
                    }
                    fullWidth
                    required
                    size="small"
                  />
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      label="First Name"
                      value={user.firstName}
                      onChange={(e) =>
                        handleBulkUserChange(index, "firstName", e.target.value)
                      }
                      fullWidth
                      required
                      size="small"
                    />
                    <TextField
                      label="Last Name"
                      value={user.lastName}
                      onChange={(e) =>
                        handleBulkUserChange(index, "lastName", e.target.value)
                      }
                      fullWidth
                      required
                      size="small"
                    />
                  </Box>
                  <TextField
                    label="Profile Picture URL"
                    value={user.userThumbnail}
                    onChange={(e) =>
                      handleBulkUserChange(
                        index,
                        "userThumbnail",
                        e.target.value,
                      )
                    }
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Location"
                    value={user.location}
                    onChange={(e) =>
                      handleBulkUserChange(index, "location", e.target.value)
                    }
                    fullWidth
                    size="small"
                  />
                </Stack>
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={addBulkUser}
              variant="outlined"
              fullWidth
            >
              Add Another User
            </Button>
          </Stack>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading
            ? "Creating..."
            : tabValue === 0
              ? "Create User"
              : `Create ${bulkUsers.length} Users`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateUserDialog;
