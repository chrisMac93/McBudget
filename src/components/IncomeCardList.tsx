'use client';

import React from 'react';
import {
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import IncomeCard from './IncomeCard';
import { Income } from '@/firebase/services';

interface IncomeCardListProps {
  incomes: Income[];
  onEdit: (income: Income) => void;
  onStatusChange: (id: string, status: 'received' | 'pending') => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const IncomeCardList: React.FC<IncomeCardListProps> = ({ incomes, onEdit, onStatusChange, onDelete, loading = false }) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (incomes.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <Typography variant="body1" color="text.secondary">
          No income found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
      {incomes.map((income) => (
        <IncomeCard
          key={income.id || 'unknown'}
          income={income}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </Box>
  );
};

export default IncomeCardList; 