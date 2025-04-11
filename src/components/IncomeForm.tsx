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
import { addOrUpdateIncome, createRecurringIncome, Income } from '@/firebase/services';
import { Add as AddIcon } from '@mui/icons-material';

// Helper to get month name
const getMonthName = (month: number): string => {
  return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
};

// Generate year options from 2020 to current year + 5
const generateYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - 2020 + 6 }, (_, i) => 2020 + i);
};

interface IncomeFormProps {
  onSuccess?: () => void;
  initialIncome?: Income | null;
}

const IncomeForm: React.FC<IncomeFormProps> = ({ onSuccess, initialIncome }) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const today = new Date();
  
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    month: currentMonth,
    year: currentYear,
    recurring: false,
    frequency: 'monthly' as 'weekly' | 'biweekly' | 'monthly' | 'once',
    description: '',
    isPaid: false,
    startDate: today,
    endDate: new Date(currentYear, 11, 31), // Default to end of year
    expectedDate: today
  });
  
  // Effect to update form when initialIncome changes
  React.useEffect(() => {
    if (initialIncome) {
      setFormData({
        source: initialIncome.source || '',
        amount: String(initialIncome.amount) || '',
        month: initialIncome.month || currentMonth,
        year: initialIncome.year || currentYear,
        recurring: initialIncome.recurring || false,
        frequency: initialIncome.frequency || 'monthly',
        description: initialIncome.description || '',
        isPaid: initialIncome.isPaid || false,
        startDate: initialIncome.startDate instanceof Date 
          ? initialIncome.startDate 
          : initialIncome.startDate 
            ? initialIncome.startDate.toDate() 
            : today,
        endDate: initialIncome.endDate instanceof Date 
          ? initialIncome.endDate 
          : initialIncome.endDate 
            ? initialIncome.endDate.toDate() 
            : new Date(currentYear, 11, 31),
        expectedDate: initialIncome.startDate instanceof Date 
          ? initialIncome.startDate 
          : initialIncome.startDate 
            ? initialIncome.startDate.toDate() 
            : today
      });
    }
  }, [initialIncome, currentMonth, currentYear]);
  
  // Function to reset the form
  const resetForm = () => {
    setFormData({
      source: '',
      amount: '',
      month: currentMonth,
      year: currentYear,
      recurring: false,
      frequency: 'monthly',
      description: '',
      isPaid: false,
      startDate: today,
      endDate: new Date(currentYear, 11, 31),
      expectedDate: today
    });
  };
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.source) newErrors.source = 'Source is required';
    if (!formData.amount) newErrors.amount = 'Amount is required';
    else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (formData.recurring) {
      if (!formData.frequency) newErrors.frequency = 'Frequency is required for recurring income';
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
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  const handleDateChange = (name: string) => (date: Date | null) => {
    if (date) {
      if (name === 'expectedDate') {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        const isPaid = selectedDate <= today;
        setFormData({
          ...formData,
          [name]: date,
          isPaid
        });
      } else {
        setFormData({
          ...formData,
          [name]: date
        });
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      if (formData.recurring) {
        // Handle recurring income
        const startMonth = formData.startDate.getMonth() + 1;
        const startYear = formData.startDate.getFullYear();
        const endMonth = formData.endDate.getMonth() + 1;
        const endYear = formData.endDate.getFullYear();
        
        // Create template income without month/year
        const incomeTemplate = {
          source: formData.source,
          amount: Number(formData.amount),
          recurring: formData.recurring,
          frequency: formData.frequency,
          description: formData.description,
          isPaid: formData.isPaid,
          startDate: formData.startDate,
          endDate: formData.endDate
        };
        
        if (initialIncome?.id) {
          // Update existing income
          await addOrUpdateIncome({
            ...incomeTemplate,
            month: Number(formData.month),
            year: Number(formData.year)
          }, initialIncome.id);
        } else {
          // Create new recurring income
          await createRecurringIncome(incomeTemplate, startMonth, startYear, endMonth, endYear);
        }
      } else {
        // Handle single income
        await addOrUpdateIncome({
          source: formData.source,
          amount: Number(formData.amount),
          month: Number(formData.month),
          year: Number(formData.year),
          recurring: false,
          description: formData.description,
          isPaid: formData.isPaid
        }, initialIncome?.id);
      }
      
      // Reset form if not editing
      if (!initialIncome) {
        resetForm();
      }
      
      setShowSuccess(true);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving income:', error);
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
            <TextField
              fullWidth
              label="Income Source"
              name="source"
              value={formData.source}
              onChange={handleInputChange}
              error={!!errors.source}
              helperText={errors.source}
              required
              placeholder="e.g., Salary, Freelance Work"
              variant="outlined"
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
                label="Expected Payment Date"
                value={formData.expectedDate}
                onChange={handleDateChange('expectedDate')}
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
            label="Recurring Income"
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
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 2 }}>
                <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={formData.startDate}
                      onChange={handleDateChange('startDate')}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: "outlined",
                          error: !!errors.startDate,
                          helperText: errors.startDate,
                          sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } }
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Box>
                
                <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date"
                      value={formData.endDate}
                      onChange={handleDateChange('endDate')}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: "outlined",
                          error: !!errors.endDate,
                          helperText: errors.endDate,
                          sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } }
                        }
                      }}
                    />
                  </LocalizationProvider>
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
                  ? 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)' 
                  : 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)',
                boxShadow: '0 4px 20px 0 rgba(76, 175, 80, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 25px 0 rgba(76, 175, 80, 0.4)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? 'Saving...' : initialIncome ? 'Update Income' : 'Add Income'}
            </Button>
            
            {initialIncome && (
              <Button
                variant="outlined"
                color="primary"
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
          Income saved successfully!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default IncomeForm; 