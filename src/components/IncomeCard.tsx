'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  useTheme
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Income } from '@/firebase/services';

interface IncomeCardProps {
  income: Income;
  onEdit: (income: Income) => void;
  onStatusChange: (id: string, status: 'received' | 'pending') => void;
  onDelete: (id: string) => void;
}

const IncomeCard: React.FC<IncomeCardProps> = ({ income, onEdit, onStatusChange, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getMonthName = (month: number): string => {
    return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
  };

  return (
    <Card
      sx={{
        mb: 2,
        borderLeft: '4px solid',
        borderColor: income.isPaid ? 'success.main' : 'warning.main',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: 3
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ maxWidth: '70%' }}>
            <Typography variant="h6" component="div" noWrap>
              {income.source}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }} noWrap>
              {income.description || 'No description'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h5" component="div" color="primary.main" sx={{ mr: 1 }}>
              {formatCurrency(income.amount)}
            </Typography>
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{
                color: theme.palette.text.secondary,
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Typography
            variant="body2"
            sx={{
              color: income.isPaid ? 'success.main' : 'warning.main',
              fontWeight: 'bold'
            }}
          >
            {income.isPaid ? 'RECEIVED' : 'PENDING'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getMonthName(income.month)} {income.year} {income.recurring ? '(Recurring)' : ''}
          </Typography>
        </Box>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          onEdit(income);
          handleMenuClose();
        }}>
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          if (income.id) {
            onStatusChange(income.id, income.isPaid ? 'pending' : 'received');
            handleMenuClose();
          }
        }}>
          Mark as {income.isPaid ? 'Pending' : 'Received'}
        </MenuItem>
        <MenuItem onClick={() => {
          if (income.id) {
            onDelete(income.id);
            handleMenuClose();
          }
        }}>
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default IncomeCard; 