'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  Chip,
  useTheme,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { Expense } from '@/firebase/services';
import { Timestamp } from 'firebase/firestore';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  loading?: boolean;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onEdit, loading = false }) => {
  const theme = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date | Timestamp) => {
    const dateObj = date instanceof Date ? date : date.toDate();
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (expenses.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <Typography variant="body1" color="text.secondary">
          No expenses found
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        borderRadius: 2,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(145deg, rgba(30,30,30,0.8), rgba(20,20,20,0.8))'
          : 'linear-gradient(145deg, rgba(255,255,255,0.8), rgba(240,240,240,0.8))'
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Description</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Due Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>{expense.description}</TableCell>
              <TableCell>
                <Chip 
                  label={expense.category}
                  size="small"
                  sx={{
                    textTransform: 'capitalize',
                    backgroundColor: theme.palette.mode === 'dark'
                      ? theme.palette.primary.dark
                      : theme.palette.primary.light,
                    color: theme.palette.primary.contrastText
                  }}
                />
              </TableCell>
              <TableCell>{formatCurrency(expense.amount)}</TableCell>
              <TableCell>{formatDate(expense.dueDate)}</TableCell>
              <TableCell>
                <Chip 
                  label={expense.paymentStatus}
                  size="small"
                  color={expense.paymentStatus === 'paid' ? 'success' : 'warning'}
                />
              </TableCell>
              <TableCell align="right">
                <IconButton
                  onClick={() => onEdit(expense)}
                  size="small"
                  sx={{
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.light,
                    }
                  }}
                >
                  <EditIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ExpenseList; 