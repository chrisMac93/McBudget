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
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  Edit as EditIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon
} from '@mui/icons-material';
import { Expense, bulkDeleteRecurringExpenses } from '@/firebase/services';
import { Timestamp } from 'firebase/firestore';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onStatusChange: (id: string, status: 'paid' | 'pending') => void;
  onDelete: (id: string) => void;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onEdit, onStatusChange, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'future' | 'all'>('single');
  const theme = useTheme();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = (type: 'single' | 'future' | 'all') => {
    setDeleteType(type);
    setConfirmDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteType === 'single' && expense.id) {
        // Standard single delete
        onDelete(expense.id);
      } else if ((deleteType === 'future' || deleteType === 'all') && expense.recurring) {
        // Bulk delete - either from current month or all occurrences
        await bulkDeleteRecurringExpenses(
          expense,
          deleteType === 'all',
          deleteType === 'future' ? expense.month : undefined,
          deleteType === 'future' ? expense.year : undefined
        );
        
        // Notify user of success through the parent component callback
        if (expense.id) {
          onDelete(expense.id);
        }
      }
    } catch (error) {
      console.error('Error deleting expenses:', error);
    }
    setConfirmDialogOpen(false);
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
              {expense.description || expense.subcategory || "Unnamed Expense"}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }} noWrap>
              {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
              {expense.recurring && ' • Recurring'}
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
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          if (expense.id) {
            onStatusChange(expense.id, expense.isPaid ? 'pending' : 'paid');
            handleMenuClose();
          }
        }}>
          <ListItemIcon>
            {expense.isPaid ? <EventBusyIcon fontSize="small" /> : <EventAvailableIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>Mark as {expense.isPaid ? 'Pending' : 'Paid'}</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleDeleteClick('single')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
        
        {expense.recurring ? [
          <MenuItem key="future" onClick={() => handleDeleteClick('future')}>
            <ListItemIcon>
              <DeleteSweepIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete All Future Occurrences</ListItemText>
          </MenuItem>,
            
          <MenuItem key="all" onClick={() => handleDeleteClick('all')}>
            <ListItemIcon>
              <DeleteSweepIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete All Occurrences</ListItemText>
          </MenuItem>
        ] : null}
      </Menu>

      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>
          {deleteType === 'single' ? 'Delete Expense' : 
           deleteType === 'future' ? 'Delete Future Occurrences' : 
           'Delete All Occurrences'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteType === 'single' && 'Are you sure you want to delete this expense?'}
            {deleteType === 'future' && 'This will delete this expense and all future occurrences. Are you sure?'}
            {deleteType === 'all' && 'This will delete ALL occurrences of this recurring expense. Are you sure?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant={deleteType === 'all' ? 'contained' : 'text'}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ExpenseCard; 