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
import { addOrUpdateExpense, createRecurringExpense, Expense } from '@/firebase/services';

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

type ExpenseCategory = 'fixed' | 'variable' | 'subscription';
type FrequencyType = 'weekly' | 'biweekly' | 'monthly' | 'once';

interface ExpenseFormProps {
  onSuccess?: () => void;
  initialExpense?: Expense | null;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSuccess, initialExpense }) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const today = new Date();
  
  const [formData, setFormData] = useState({
    category: 'fixed' as ExpenseCategory,
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
    expectedDate: today,
    dueDayOfMonth: today.getDate() // Default to current day of month
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Effect to update form when initialExpense changes
  React.useEffect(() => {
    if (initialExpense) {
      const dueDate = initialExpense.dueDate 
        ? initialExpense.dueDate instanceof Date 
          ? initialExpense.dueDate 
          : initialExpense.dueDate.toDate()
        : today;
        
      // Extract day of month from the due date
      const dueDayOfMonth = dueDate.getDate();
        
      setFormData({
        category: initialExpense.category || 'fixed',
        amount: String(initialExpense.amount) || '',
        month: initialExpense.month || currentMonth,
        year: initialExpense.year || currentYear,
        recurring: initialExpense.recurring || false,
        frequency: initialExpense.frequency || 'monthly',
        description: initialExpense.description || '',
        isPaid: initialExpense.isPaid || false,
        startDate: initialExpense.startDate instanceof Date 
          ? initialExpense.startDate 
          : initialExpense.startDate 
            ? initialExpense.startDate.toDate() 
            : today,
        endDate: initialExpense.endDate instanceof Date 
          ? initialExpense.endDate 
          : initialExpense.endDate 
            ? initialExpense.endDate.toDate() 
            : new Date(currentYear, 11, 31),
        dueDate,
        expectedDate: dueDate,
        dueDayOfMonth
      });
    }
  }, [initialExpense, currentMonth, currentYear, today]);
  
  // Function to reset the form
  const resetForm = () => {
    setFormData({
      category: 'fixed' as ExpenseCategory,
      amount: '',
      month: currentMonth,
      year: currentYear,
      recurring: false,
      frequency: 'monthly' as FrequencyType,
      description: '',
      isPaid: false,
      startDate: today,
      endDate: new Date(currentYear, 11, 31),
      dueDate: today,
      expectedDate: today,
      dueDayOfMonth: today.getDate()
    });
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description) newErrors.description = 'Description is required';
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
      
      if (formData.dueDayOfMonth < 1 || formData.dueDayOfMonth > 31) {
        newErrors.dueDayOfMonth = 'Due day must be between 1 and 31';
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
      today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      
      // If the selected date is today or before, it's paid. If it's in the future, it's pending
      const isPaid = selectedDate <= today;
      
      setFormData(prev => ({ 
        ...prev, 
        expectedDate: date, 
        isPaid,
        dueDayOfMonth: date.getDate() // Also update dueDayOfMonth based on selected date
      }));
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
        
        // For recurring expenses, calculate a due date based on the dueDayOfMonth for each month
        const today = new Date();
        
        // Make sure dueDayOfMonth is valid (between 1-31)
        const validDueDay = Math.max(1, Math.min(31, formData.dueDayOfMonth));
        
        // Create a placeholder date with the dueDayOfMonth
        const dueDate = new Date(today.getFullYear(), today.getMonth(), validDueDay);
        
        // Create template expense without month/year
        const expenseTemplate = {
          category: formData.category,
          amount: Number(formData.amount),
          recurring: formData.recurring,
          frequency: formData.frequency,
          description: formData.description,
          isPaid: formData.isPaid,
          startDate: formData.startDate,
          endDate: formData.endDate,
          dueDate: dueDate,
          dueDayOfMonth: validDueDay
        };
        
        if (initialExpense?.id) {
          // Update existing expense
          await addOrUpdateExpense({
            ...expenseTemplate,
            month: Number(formData.month),
            year: Number(formData.year)
          }, initialExpense.id);
        } else {
          // Create new recurring expenses
          await createRecurringExpense(expenseTemplate, startMonth, startYear, endMonth, endYear);
        }
      } else {
        // Handle single expense - use the expectedDate directly
        await addOrUpdateExpense({
          category: formData.category,
          amount: Number(formData.amount),
          month: Number(formData.month),
          year: Number(formData.year),
          recurring: false,
          description: formData.description,
          isPaid: formData.isPaid,
          dueDate: formData.expectedDate
        }, initialExpense?.id);
      }
      
      // Reset form
      if (!initialExpense) {
        resetForm();
      }
      
      setShowSuccess(true);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving expense:', error);
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
            
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="What is this expense for?"
              required
              variant="outlined"
              error={!!errors.description}
              helperText={errors.description}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />
            
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
                label="Payment Due Date"
                value={formData.expectedDate}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    size: "small",
                    helperText: "Automatically sets paid/pending status based on this date"
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
            sx={{ mb: 1, mt: 1 }}
          />
          
          <Box sx={{ mb: 2, mt: 0, fontSize: '0.875rem', color: 'text.secondary', fontStyle: 'italic' }}>
            Note: Expenses are automatically marked as "Paid" when their due date is today or in the past, 
            and "Pending" when the due date is in the future.
          </Box>
          
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
                  <TextField
                    fullWidth
                    label="Due Day of Month"
                    name="dueDayOfMonth"
                    type="number"
                    value={formData.dueDayOfMonth}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value > 0 && value <= 31) {
                        setFormData(prev => ({ ...prev, dueDayOfMonth: value }));
                      }
                    }}
                    InputProps={{
                      inputProps: { min: 1, max: 31 },
                      sx: { borderRadius: 2 }
                    }}
                    helperText={errors.dueDayOfMonth || "Day of month when payment is due"}
                    size="small"
                    error={!!errors.dueDayOfMonth}
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
                        size: "small",
                        error: !!errors.startDate,
                        helperText: errors.startDate || undefined
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
                        size: "small",
                        error: !!errors.endDate,
                        helperText: errors.endDate || undefined
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
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              size="large"
              fullWidth
              startIcon={<AddIcon />}
              sx={{ 
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
              {loading ? 'Saving...' : initialExpense ? 'Update Expense' : 'Save Expense'}
            </Button>
            
            {initialExpense && (
              <Button
                variant="outlined"
                size="large"
                disabled={loading}
                onClick={() => resetForm()}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </Button>
            )}
          </Box>
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