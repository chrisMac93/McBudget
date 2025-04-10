'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Chip, 
  IconButton, 
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { format } from 'date-fns';
import { getUserTransactions, deleteTransaction, Transaction } from '@/firebase/services';
import { Timestamp } from 'firebase/firestore';

export default function TransactionList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions from Firestore
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getUserTransactions();
        setTransactions(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load transactions');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [refreshTrigger]); // Refetch when refreshTrigger changes

  const handleDelete = async (id: string) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
        setTransactions(transactions.filter(t => t.id !== id));
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to delete transaction');
        }
      }
    }
  };

  // Format currency 
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date | Timestamp | unknown): string => {
    if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      // Handle Firestore Timestamp
      return format(date.toDate(), 'MMM dd, yyyy');
    } else if (date instanceof Date) {
      return format(date, 'MMM dd, yyyy');
    }
    return 'Unknown date';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (transactions.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle1" align="center">
          No transactions found. Add some to get started!
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ mt: 2 }}>
      <List sx={{ width: '100%' }}>
        {transactions.map((transaction, index) => (
          <Box key={transaction.id}>
            {index > 0 && <Divider />}
            <ListItem
              secondaryAction={
                <Box>
                  <IconButton edge="end" aria-label="edit" sx={{ mr: 1 }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => transaction.id && handleDelete(transaction.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" component="span">
                      {transaction.description}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      component="span"
                      sx={{ 
                        fontWeight: 'bold', 
                        color: transaction.type === 'income' ? 'success.main' : 'error.main' 
                      }}
                    >
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      mt: 1,
                      alignItems: 'center' 
                    }}
                    component="div"
                  >
                    <Box component="div">
                      <Chip 
                        size="small" 
                        label={transaction.category} 
                        color={transaction.type === 'income' ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" component="span" color="text.secondary">
                      {formatDate(transaction.date)}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          </Box>
        ))}
      </List>
    </Paper>
  );
} 