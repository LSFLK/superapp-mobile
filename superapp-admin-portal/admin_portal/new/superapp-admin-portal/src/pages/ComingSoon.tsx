import { Box, Typography, Container, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ConstructionIcon from '@mui/icons-material/Construction';

const ComingSoon = () => {
  const navigate = useNavigate();
  return (
    <Container maxWidth="md">
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" textAlign="center">
        <Button variant="text" onClick={() => navigate(-1)} sx={{ alignSelf: 'flex-start', mb: 2 }}>
          ← Back
        </Button>
        <ConstructionIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This feature is under development and will be available soon.
        </Typography>
      </Box>
    </Container>
  );
};

export default ComingSoon;
