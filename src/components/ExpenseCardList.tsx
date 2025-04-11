'use client';

import React from 'react';
import {
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import ExpenseCard from './ExpenseCard';
import { Expense } from '@/firebase/services';

interface ExpenseCardListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onStatusChange: (id: string, status: 'paid' | 'pending') => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const ExpenseCardList: React.FC<ExpenseCardListProps> = ({ expenses, onEdit, onStatusChange, onDelete, loading = false }) => {
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
    <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id || 'unknown'}
          expense={expense}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </Box>
  );
};

export default ExpenseCardList; 