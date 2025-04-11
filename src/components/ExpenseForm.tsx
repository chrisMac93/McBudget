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
  FormControlLabel, 
  Checkbox, 
  Paper,
  Alert,
  Snackbar,
  FormHelperText,
  InputAdornment,
  SelectChangeEvent,
  Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Add as AddIcon } from '@mui/icons-material';
import { addOrUpdateExpense, createRecurringExpense } from '@/firebase/services';

// Helper to get month name
const getMonthName = (month: number): string => {
  return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
};

// Generate year options from 2020 to current year + 5
const generateYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - 2020 + 6 }, (_, i) => 2020 + i);
};

// Category options
const expenseCategories = [
  { value: 'fixed', label: 'Fixed Expense' },
  { value: 'variable', label: 'Variable Expense' },
  { value: 'subscription', label: 'Subscription' },
];

// Subcategory options based on category
const subcategories: Record<string, string[]> = {
  fixed: [
    'Mortgage/Rent', 
    'Property Tax', 
    'Insurance', 
    'Car Payment',
    'Utilities',
    'Loan Payment',
    'Other'
  ],
  variable: [
    'Groceries', 
    'Dining Out', 
    'Entertainment', 
    'Shopping',
    'Transportation',
    'Healthcare',
    'Travel',
    'Gifts',
    'Other'
  ],
  subscription: [
    'Streaming Services', 
    'Software', 
    'Memberships', 
    'Online Services',
    'Magazine/News',
    'Other'
  ]
};

type ExpenseCategory = 'fixed' | 'variable' | 'subscription';
type FrequencyType = 'weekly' | 'biweekly' | 'monthly' | 'once';

interface ExpenseFormProps {
  onSuccess?: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSuccess }) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const today = new Date();
  
  const [formData, setFormData] = useState({
    category: 'variable' as ExpenseCategory,
    subcategory: 'Groceries',
    amount: '',
    month: currentMonth,
    year: currentYear,
    recurring: false,
    frequency: 'monthly' as FrequencyType,
    description: '',
    isPaid: false,
    startDate: today,
    endDate: new Date(currentYear, 11, 31), // Default to end of year
    dueDate: today,
    expectedDate: new Date()
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.subcategory) newErrors.subcategory = 'Subcategory is required';
    if (!formData.amount) newErrors.amount = 'Amount is required';
    else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (formData.recurring) {
      if (!formData.frequency) newErrors.frequency = 'Frequency is required for recurring expenses';
      if (!formData.startDate) newErrors.startDate = 'Start date is required';
      if (!formData.endDate) newErrors.endDate = 'End date is required';
      
      if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    
    if (name === 'category') {
      // Reset subcategory when category changes
      const category = value as ExpenseCategory;
      setFormData({
        ...formData,
        [name]: category,
        subcategory: subcategories[category][0]
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  const handleDateChange = (date: Date | null) => {
    if (date) {
      const today = new Date();
      const isPaid = date < today;
      setFormData(prev => ({ ...prev, expectedDate: date, isPaid }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      if (formData.recurring) {
        // Handle recurring expense
        const startMonth = formData.startDate.getMonth() + 1;
        const startYear = formData.startDate.getFullYear();
        const endMonth = formData.endDate.getMonth() + 1;
        const endYear = formData.endDate.getFullYear();
        
        // Create template expense without month/year
        const expenseTemplate = {
          category: formData.category,
          subcategory: formData.subcategory,
          amount: Number(formData.amount),
          recurring: formData.recurring,
          frequency: formData.frequency,
          description: formData.description,
          isPaid: formData.isPaid,
          startDate: formData.startDate,
          endDate: formData.endDate,
          dueDate: formData.dueDate
        };
        
        await createRecurringExpense(expenseTemplate, startMonth, startYear, endMonth, endYear);
      } else {
        // Handle single expense
        await addOrUpdateExpense({
          category: formData.category,
          subcategory: formData.subcategory,
          amount: Number(formData.amount),
          month: formData.month,
          year: formData.year,
          recurring: false,
          description: formData.description,
          isPaid: formData.isPaid,
          dueDate: formData.dueDate
        });
      }
      
      // Reset form
      setFormData({
        category: 'variable',
        subcategory: 'Groceries',
        amount: '',
        month: currentMonth,
        year: currentYear,
        recurring: false,
        frequency: 'monthly',
        description: '',
        isPaid: false,
        startDate: today,
        endDate: new Date(currentYear, 11, 31),
        dueDate: today,
        expectedDate: new Date()
      });
      
      setShowSuccess(true);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper 
      elevation={3}
      sx={{ 
        p: { xs: 3, sm: 4 }, 
        borderRadius: 3,
        background: theme => theme.palette.mode === 'dark' 
          ? 'linear-gradient(145deg, #2a2a2a 30%, #3a3a3a 90%)' 
          : 'linear-gradient(145deg, #fff 30%, #f9f9f9 90%)'
      }}
    >
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          noValidate
          sx={{ 
            '& .MuiTextField-root': { mb: 2.5 },
            '& .MuiFormControl-root': { mb: 2.5 },
          }}
        >
          <Stack spacing={2}>
            <FormControl fullWidth error={!!errors.category} variant="outlined">
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                label="Category"
                onChange={handleSelectChange}
                sx={{ borderRadius: 2 }}
              >
                {expenseCategories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
            </FormControl>
            
            <FormControl fullWidth error={!!errors.subcategory} variant="outlined">
              <InputLabel>Subcategory</InputLabel>
              <Select
                name="subcategory"
                value={formData.subcategory}
                label="Subcategory"
                onChange={handleSelectChange}
                sx={{ borderRadius: 2 }}
              >
                {subcategories[formData.category].map((sub) => (
                  <MenuItem key={sub} value={sub}>
                    {sub}
                  </MenuItem>
                ))}
              </Select>
              {errors.subcategory && <FormHelperText>{errors.subcategory}</FormHelperText>}
            </FormControl>
            
            <TextField
              fullWidth
              label="Amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleInputChange}
              error={!!errors.amount}
              helperText={errors.amount}
              required
              variant="outlined"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                sx: { borderRadius: 2 }
              }}
            />
            
            <Box>
              <DatePicker
                label="Expected Payment Date"
                value={formData.expectedDate}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    size: "small"
                  }
                }}
              />
            </Box>
          </Stack>
          
          <FormControlLabel
            control={
              <Checkbox 
                checked={formData.recurring} 
                onChange={handleCheckboxChange} 
                name="recurring" 
                color="primary"
              />
            }
            label="Recurring Expense"
            sx={{ mb: 2, mt: 1 }}
          />
          
          {formData.recurring ? (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                  <FormControl fullWidth error={!!errors.frequency} variant="outlined">
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      name="frequency"
                      value={formData.frequency}
                      label="Frequency"
                      onChange={handleSelectChange}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="biweekly">Bi-Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="once">One Time</MenuItem>
                    </Select>
                    {errors.frequency && <FormHelperText>{errors.frequency}</FormHelperText>}
                  </FormControl>
                </Box>
                
                <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={formData.isPaid} 
                        onChange={handleCheckboxChange} 
                        name="isPaid" 
                        color="success"
                      />
                    }
                    label="Already Paid"
                  />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 2 }}>
                <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                  <DatePicker
                    label="Start Date"
                    value={formData.startDate}
                    onChange={(date) => {
                      if (date) {
                        setFormData(prev => ({ ...prev, startDate: date }));
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        size: "small"
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                  <DatePicker
                    label="End Date"
                    value={formData.endDate}
                    onChange={(date) => {
                      if (date) {
                        setFormData(prev => ({ ...prev, endDate: date }));
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        size: "small"
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Month</InputLabel>
                    <Select
                      name="month"
                      value={String(formData.month)}
                      label="Month"
                      onChange={handleSelectChange}
                      sx={{ borderRadius: 2 }}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <MenuItem key={month} value={String(month)}>
                          {getMonthName(month)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Year</InputLabel>
                    <Select
                      name="year"
                      value={String(formData.year)}
                      label="Year"
                      onChange={handleSelectChange}
                      sx={{ borderRadius: 2 }}
                    >
                      {generateYearOptions().map((year) => (
                        <MenuItem key={year} value={String(year)}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Box>
          )}
          
          <TextField
            fullWidth
            label="Description (Optional)"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={3}
            variant="outlined"
            InputProps={{
              sx: { borderRadius: 2 }
            }}
          />
          
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            size="large"
            fullWidth
            startIcon={<AddIcon />}
            sx={{ 
              mt: 2,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold', 
              fontSize: '1rem',
              background: theme => theme.palette.mode === 'dark' 
                ? 'linear-gradient(45deg, #f44336 30%, #ff9800 90%)' 
                : 'linear-gradient(45deg, #ff5722 30%, #f44336 90%)',
              boxShadow: '0 4px 20px 0 rgba(244, 67, 54, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 25px 0 rgba(244, 67, 54, 0.4)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease',
            }}
          >
            {loading ? 'Saving...' : 'Save Expense'}
          </Button>
        </Box>
      </LocalizationProvider>
      
      <Snackbar 
        open={showSuccess} 
        autoHideDuration={6000} 
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccess(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          Expense saved successfully!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ExpenseForm; 