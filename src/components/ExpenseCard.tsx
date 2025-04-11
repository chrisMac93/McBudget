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
import { Expense } from '@/firebase/services';
import { Timestamp } from 'firebase/firestore';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onStatusChange: (id: string, status: 'paid' | 'pending') => void;
  onDelete: (id: string) => void;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onEdit, onStatusChange, onDelete }) => {
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

  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : date.toDate();
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card
      sx={{
        mb: 2,
        borderLeft: '4px solid',
        borderColor: expense.isPaid ? 'success.main' : 'warning.main',
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
              {expense.description}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }} noWrap>
              {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h5" component="div" color="primary.main" sx={{ mr: 1 }}>
              {formatCurrency(expense.amount)}
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
              color: expense.isPaid ? 'success.main' : 'warning.main',
              fontWeight: 'bold'
            }}
          >
            {expense.isPaid ? 'PAID' : 'PENDING'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Due: {formatDate(expense.dueDate)}
          </Typography>
        </Box>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          onEdit(expense);
          handleMenuClose();
        }}>
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          if (expense.id) {
            onStatusChange(expense.id, expense.isPaid ? 'pending' : 'paid');
            handleMenuClose();
          }
        }}>
          Mark as {expense.isPaid ? 'Pending' : 'Paid'}
        </MenuItem>
        <MenuItem onClick={() => {
          if (expense.id) {
            onDelete(expense.id);
            handleMenuClose();
          }
        }}>
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default ExpenseCard; 