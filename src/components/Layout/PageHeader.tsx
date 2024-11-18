import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, showBack = true }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        px: 2,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {showBack && (
        <IconButton
          onClick={() => navigate(-1)}
          size={isMobile ? 'small' : 'medium'}
          sx={{ color: 'primary.main' }}
        >
          <ArrowBack />
        </IconButton>
      )}
      <Typography variant={isMobile ? 'h6' : 'h5'} component="h1" fontWeight="bold">
        {title}
      </Typography>
    </Box>
  );
};

export default PageHeader;
