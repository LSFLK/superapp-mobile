import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNotification } from '../context';
import { usersService, type User } from '../services';
import { CreateUserDialog, ConfirmDialog } from '../components';

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user?: User }>({
    open: false,
  });
  const { showNotification } = useNotification();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    fetchUsers();
  };

  const handleDeleteClick = (user: User) => {
    setDeleteDialog({ open: true, user });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.user) return;

    try {
      await usersService.deleteUser(deleteDialog.user.workEmail);
      showNotification('User deleted successfully', 'success');
      setDeleteDialog({ open: false });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification('Failed to delete user', 'error');
    }
  };

  // Get unique locations for filter dropdown
  const availableLocations = useMemo(() => {
    const locations = users
      .map((user) => user.location)
      .filter((location): location is string => !!location);
    return Array.from(new Set(locations)).sort();
  }, [users]);

  // Filter users based on search query and location filter
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Location filter
      if (locationFilter !== 'all' && user.location !== locationFilter) {
        return false;
      }

      // Search filter (name or email)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = user.workEmail.toLowerCase();
        return fullName.includes(query) || email.includes(query);
      }

      return true;
    });
  }, [users, searchQuery, locationFilter]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button variant="text" onClick={() => navigate(-1)} sx={{ mb: 2 }}>
            ← Back
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            Users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage user accounts and information
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Add User
        </Button>
      </Box>

      {/* Information Notice */}
      <Paper
        sx={{
          mb: 3,
          p: 2,
          backgroundColor: 'divider',
          borderLeft: 4,
          borderColor: 'warning.main',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <InfoIcon color="info" sx={{ mt: 0.5 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
              Important: IDP Account Required
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This user management is only for the SuperApp database. You must also create 
              corresponding accounts in your Identity Provider (IDP) with the same email address 
              to grant users access to the application.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {users.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            mx: 'auto',
            maxWidth: 600,
          }}
        >
          <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Users Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Get started by adding your first user
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add First User
          </Button>
        </Paper>
      ) : (
        <>
          {/* Search and Filter Controls */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Location</InputLabel>
                <Select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  label="Location"
                >
                  <MenuItem value="all">All Locations</MenuItem>
                  {availableLocations.map((location) => (
                    <MenuItem key={location} value={location}>
                      {location}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            {(searchQuery || locationFilter !== 'all') && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                Showing {filteredUsers.length} of {users.length} users
              </Typography>
            )}
          </Paper>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      No users found matching your filters
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.workEmail} hover>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          src={user.userThumbnail}
                          alt={`${user.firstName} ${user.lastName}`}
                          sx={{ width: 40, height: 40 }}
                        >
                          {user.firstName[0]}{user.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {user.firstName} {user.lastName}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.workEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {user.location ? (
                        <Chip label={user.location} size="small" variant="outlined" />
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete user">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        </>
      )}

      <CreateUserDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete User"
        message={
          deleteDialog.user
            ? `Are you sure you want to delete ${deleteDialog.user.firstName} ${deleteDialog.user.lastName}? This action cannot be undone.`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ open: false })}
        confirmText="Delete"
        confirmColor="error"
      />
    </Container>
  );
};

export default Users;
