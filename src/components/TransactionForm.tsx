'use client';

import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  FormHelperText,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { addTransaction } from '@/firebase/services';

const categories = {
  income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other'],
  expense: ['Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Healthcare', 'Other']
};

export default function TransactionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<Date | null>(new Date());
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!amount || !description || !category || !date) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await addTransaction({
        amount: parseFloat(amount),
        description,
        category,
        date,
        type
      });
      
      // Clear form
      setAmount('');
      setDescription('');
      setCategory('');
      setDate(new Date());
      setSuccess(true);
      
      // Notify parent component
      if (onSuccess) {
        onSuccess();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (event: SelectChangeEvent) => {
    setType(event.target.value as 'income' | 'expense');
    setCategory(''); // Reset category when type changes
  };

  return (
    <Box sx={{ mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Transaction added successfully!
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="transaction-type-label">Type</InputLabel>
            <Select
              labelId="transaction-type-label"
              id="transaction-type"
              value={type}
              label="Type"
              onChange={handleTypeChange}
              required
            >
              <MenuItem value="income">Income</MenuItem>
              <MenuItem value="expense">Expense</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Amount"
            type="number"
            inputProps={{ step: '0.01', min: '0' }}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            fullWidth
          />
          
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            fullWidth
          />
          
          <FormControl fullWidth required>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              id="category"
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value)}
            >
              {type && categories[type].map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
            <FormHelperText>Select a category for your {type}</FormHelperText>
          </FormControl>
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={date}
              onChange={(newDate: Date | null) => setDate(newDate)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true
                }
              }}
            />
          </LocalizationProvider>
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Transaction'}
          </Button>
        </Box>
      </form>
    </Box>
  );
} 