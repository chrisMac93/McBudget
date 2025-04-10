'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  SelectChangeEvent
} from '@mui/material';
import { getMonthlySummary, MonthlySummary } from '@/firebase/services';

// Helper to get month name
const getMonthName = (month: number): string => {
  return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
};

// Generate year options from 2020 to current year + 5
const generateYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - 2020 + 6 }, (_, i) => 2020 + i);
};

interface FinancialDashboardProps {
  userId: string;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<number>(0);
  
  // Fetch the summary when month/year changes
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await getMonthlySummary(selectedMonth, selectedYear);
        setSummary(data);
      } catch (error) {
        console.error('Error fetching monthly summary:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummary();
  }, [selectedMonth, selectedYear]);
  
  const handleMonthChange = (event: SelectChangeEvent<number>) => {
    setSelectedMonth(event.target.value as number);
  };
  
  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setSelectedYear(event.target.value as number);
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Financial Overview</Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                label="Month"
                onChange={handleMonthChange}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <MenuItem key={month} value={month}>
                    {getMonthName(month)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={handleYearChange}
              >
                {generateYearOptions().map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Income
                  </Typography>
                  <Typography variant="h4" component="div" color="primary">
                    ${summary?.totalIncome?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Total income for {getMonthName(selectedMonth)} {selectedYear}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Expenses
                  </Typography>
                  <Typography variant="h4" component="div" color="error">
                    ${(summary?.totalFixedExpenses + summary?.totalVariableExpenses || 0).toFixed(2)}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">
                    Fixed: ${summary?.totalFixedExpenses?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2">
                    Variable: ${summary?.totalVariableExpenses?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2">
                    Subscriptions: ${summary?.totalSubscriptions?.toFixed(2) || '0.00'}*
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    *Subscriptions not included in total expenses calculation
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Balance
                  </Typography>
                  <Typography 
                    variant="h4" 
                    component="div" 
                    color={summary?.balance && summary.balance >= 0 ? 'success' : 'error'}
                  >
                    ${summary?.balance?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {summary?.balance && summary.balance >= 0 
                      ? 'Surplus' 
                      : 'Deficit'} for {getMonthName(selectedMonth)} {selectedYear}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Income" />
          <Tab label="Fixed Expenses" />
          <Tab label="Variable Expenses" />
          <Tab label="Subscriptions" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Typography>
              Monthly financial summary will be displayed here.
            </Typography>
          )}
          {activeTab === 1 && (
            <Typography>
              Income details will be displayed here.
            </Typography>
          )}
          {activeTab === 2 && (
            <Typography>
              Fixed expenses will be displayed here.
            </Typography>
          )}
          {activeTab === 3 && (
            <Typography>
              Variable expenses will be displayed here.
            </Typography>
          )}
          {activeTab === 4 && (
            <Typography>
              Subscriptions will be displayed here.
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default FinancialDashboard; 