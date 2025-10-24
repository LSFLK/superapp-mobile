/**
 * Layout Component
 * 
 * Simple, clean layout wrapper for authenticated pages.
 */

import { Box } from '@mui/material';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Box component="main">
        {children}
      </Box>
    </Box>
  );
}
