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
  CircularProgress,
  MenuItem,
  Select,
  SelectChangeEvent
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import { Expense, addOrUpdateExpense } from '@/firebase/services';
import { Timestamp } from 'firebase/firestore';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onStatusChange: (id: string, status: 'paid' | 'pending') => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onEdit, onStatusChange, onDelete, loading = false }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedExpense, setSelectedExpense] = React.useState<Expense | null>(null);

  const handleStatusChange = (id: string | undefined, event: SelectChangeEvent<'paid' | 'pending'>) => {
    if (!id) return;
    const newStatus = event.target.value as 'paid' | 'pending';
    onStatusChange(id, newStatus);
    const expenseToUpdate = expenses.find(exp => exp.id === id);
    if (expenseToUpdate) {
      addOrUpdateExpense({
        ...expenseToUpdate,
        isPaid: newStatus === 'paid'
      });
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, expense: Expense) => {
    setAnchorEl(event.currentTarget);
    setSelectedExpense(expense);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExpense(null);
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
        mt: 3,
        borderRadius: 1,
        background: theme.palette.background.paper
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
            <TableRow key={expense.id || 'unknown'}>
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
                <Select
                  value={expense.isPaid ? 'paid' : 'pending'}
                  onChange={(event) => handleStatusChange(expense.id, event)}
                  size="small"
                  sx={{ minWidth: 100 }}
                >
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </TableCell>
              <TableCell align="right">
                <IconButton
                  onClick={(event) => handleMenuOpen(event, expense)}
                  size="small"
                  sx={{
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.light,
                    }
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          onEdit(selectedExpense!);
          handleMenuClose();
        }}>
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedExpense?.id) {
            onDelete(selectedExpense.id);
            handleMenuClose();
          }
        }}>
          Delete
        </MenuItem>
      </Menu>
    </TableContainer>
  );
};

export default ExpenseList; 