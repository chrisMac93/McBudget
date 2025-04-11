'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Box,
  CircularProgress,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Wallet as WalletIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as BalanceIcon,
} from '@mui/icons-material';
import SidebarLayout from '@/components/SidebarLayout';
import { getMonthlyIncome, getAllMonthlyExpenses, Expense } from '@/firebase/services';
import dynamic from 'next/dynamic';

// Dynamically import chart components
const Charts = dynamic(() => import('../../components/Charts'), { 
  ssr: false,
  loading: () => <Typography>Loading chart...</Typography>
});

// Helper to get month name
const getMonthName = (month: number): string => {
  return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
};

// Generate year options from 2020 to current year + 1
const generateYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - 2020 + 2 }, (_, i) => 2020 + i);
};

// Helper to calculate weekly income for recurring items
const calculateTotalIncomeWithRecurring = async (selectedMonth: number, selectedYear: number, includePending: boolean) => {
  const incomeData = await getMonthlyIncome(selectedMonth, selectedYear);
  
  let total = 0;
  
  incomeData
    .filter(income => includePending || income.isPaid)
    .forEach(income => {
      if (income.recurring && income.frequency === 'weekly') {
        // Count weeks in the month
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const weeksInMonth = Math.floor(daysInMonth / 7);
        total += income.amount * weeksInMonth;
      } 
      else if (income.recurring && income.frequency === 'biweekly') {
        // Count biweeks in the month
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const biweeksInMonth = Math.floor(daysInMonth / 14);
        total += income.amount * biweeksInMonth;
      }
      else {
        total += income.amount;
      }
    });
  
  return total;
};

// Chart colors
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

// Calculate totals and balance based on includePending setting
const getExpenseTotal = (expenses: Expense[], category: string, includePending: boolean) => {
  return expenses
    .filter(expense => expense.category === category)
    .filter(expense => includePending || expense.isPaid)
    .reduce((total, expense) => total + expense.amount, 0);
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Current month and year
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  // Selected filter values
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  // Data states
  const [expensesList, setExpensesList] = useState<Expense[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);
  const [includePending, setIncludePending] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Redirect if not authenticated
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);
  
  const fetchData = useCallback(async () => {
    try {
      setDataLoading(true);
      
      // Fetch data in parallel
      const [incomeData, expensesData] = await Promise.all([
        getMonthlyIncome(selectedMonth, selectedYear),
        getAllMonthlyExpenses(selectedMonth, selectedYear)
      ]);
      
      setExpensesList(expensesData);
      
      // Calculate total income with recurring items
      const calculatedTotalIncome = await calculateTotalIncomeWithRecurring(selectedMonth, selectedYear, includePending);
      setTotalIncome(calculatedTotalIncome);
      
      console.log('Fetched income data:', incomeData.length, 'entries');
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  }, [selectedMonth, selectedYear, includePending]);
  
  // Fetch data when filters change
  useEffect(() => {
    if (user && mounted) {
      fetchData();
    }
  }, [fetchData, user, mounted]);
  
  // Calculate totals using the helper function
  const fixedExpenses = getExpenseTotal(expensesList, 'fixed', includePending);
  const variableExpenses = getExpenseTotal(expensesList, 'variable', includePending);
  const subscriptionExpenses = getExpenseTotal(expensesList, 'subscription', includePending);
  
  const totalExpenses = fixedExpenses + variableExpenses + subscriptionExpenses;
  const balance = totalIncome - totalExpenses;
  
  // Expense breakdown data for chart
  const expenseChartData = [
    { name: 'Fixed', value: fixedExpenses },
    { name: 'Variable', value: variableExpenses },
    { name: 'Subscriptions', value: subscriptionExpenses },
  ].filter(item => item.value > 0);
  
  // Format number as currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  const handleMonthChange = (e: SelectChangeEvent<number>) => {
    setSelectedMonth(e.target.value as number);
  };

  const handleYearChange = (e: SelectChangeEvent<number>) => {
    setSelectedYear(e.target.value as number);
  };

  const handleTogglePending = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIncludePending(event.target.checked);
  };

  // Don't render anything server-side
  if (!mounted) {
    return null;
  }
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // Will redirect in useEffect
  if (!user) {
    return null;
  }

  return (
    <SidebarLayout title="Dashboard">
      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Typography variant="h5">
          Financial Overview
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
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
          
          <FormControlLabel
            control={
              <Switch
                checked={includePending}
                onChange={handleTogglePending}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 0.5 }}>Include Pending</Typography>
                <Typography variant="caption" color="text.secondary">
                  ({includePending ? 'Showing all transactions' : 'Showing only paid/received transactions'})
                </Typography>
              </Box>
            }
            sx={{ ml: 1 }}
          />
        </Box>
      </Box>
      
      {dataLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
            gap: 2,
            mb: 4
          }}>
            <Card sx={{ 
              height: '100%',
              background: theme => theme.palette.mode === 'dark' 
                ? 'linear-gradient(to right, #1c1c1c, #2a2a2a)' 
                : 'linear-gradient(to right, #f3f4f6, #e5e7eb)',
              borderLeft: '4px solid',
              borderColor: 'primary.main',
              boxShadow: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 4
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography color="textSecondary" variant="subtitle2">
                    Total Income
                  </Typography>
                  <IncomeIcon color="primary" fontSize="small" />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(totalIncome)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {getMonthName(selectedMonth)} {selectedYear}
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ 
              height: '100%',
              background: theme => theme.palette.mode === 'dark' 
                ? 'linear-gradient(to right, #1c1c1c, #2a2a2a)' 
                : 'linear-gradient(to right, #f3f4f6, #e5e7eb)',
              borderLeft: '4px solid',
              borderColor: 'error.main',
              boxShadow: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 4
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography color="textSecondary" variant="subtitle2">
                    Total Expenses
                  </Typography>
                  <ExpenseIcon color="error" fontSize="small" />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(totalExpenses)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {getMonthName(selectedMonth)} {selectedYear}
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ 
              height: '100%',
              background: theme => theme.palette.mode === 'dark' 
                ? 'linear-gradient(to right, #1c1c1c, #2a2a2a)' 
                : 'linear-gradient(to right, #f3f4f6, #e5e7eb)',
              borderLeft: '4px solid',
              borderColor: balance >= 0 ? 'success.main' : 'warning.main',
              boxShadow: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 4
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography color="textSecondary" variant="subtitle2">
                    {balance >= 0 ? 'Surplus' : 'Deficit'}
                  </Typography>
                  <BalanceIcon color={balance >= 0 ? 'success' : 'warning'} fontSize="small" />
                </Box>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: theme => balance >= 0 
                      ? theme.palette.success.main 
                      : theme.palette.warning.main
                  }}
                >
                  {formatCurrency(Math.abs(balance))}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {getMonthName(selectedMonth)} {selectedYear}
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ 
              height: '100%',
              background: theme => theme.palette.mode === 'dark' 
                ? 'linear-gradient(to right, #1c1c1c, #2a2a2a)' 
                : 'linear-gradient(to right, #f3f4f6, #e5e7eb)',
              borderLeft: '4px solid',
              borderColor: 'info.main',
              boxShadow: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 4
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography color="textSecondary" variant="subtitle2">
                    Pending Payments
                  </Typography>
                  <WalletIcon color="info" fontSize="small" />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(
                    expensesList
                      .filter(expense => !expense.isPaid)
                      .reduce((total, expense) => total + expense.amount, 0)
                  )}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Due this month
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          {/* Main Content Area */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {/* Expense Breakdown Chart */}
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Expense Breakdown
              </Typography>
              
              {expenseChartData.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <Charts 
                    type="pie" 
                    data={expenseChartData} 
                    colors={COLORS}
                  />
                </Box>
              ) : (
                <Box sx={{ 
                  height: 300, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  bgcolor: 'action.hover',
                  borderRadius: 1
                }}>
                  <Typography color="text.secondary">
                    No expense data available for this period
                  </Typography>
                </Box>
              )}
            </Paper>
            
            {/* Financial Summary Table */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Financial Summary
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">% of Budget</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Income</TableCell>
                      <TableCell align="right">{formatCurrency(totalIncome)}</TableCell>
                      <TableCell align="right">100%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Fixed Expenses</TableCell>
                      <TableCell align="right">{formatCurrency(fixedExpenses)}</TableCell>
                      <TableCell align="right">
                        {totalIncome > 0 ? `${(fixedExpenses / totalIncome * 100).toFixed(1)}%` : '0%'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Variable Expenses</TableCell>
                      <TableCell align="right">{formatCurrency(variableExpenses)}</TableCell>
                      <TableCell align="right">
                        {totalIncome > 0 ? `${(variableExpenses / totalIncome * 100).toFixed(1)}%` : '0%'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Subscriptions</TableCell>
                      <TableCell align="right">{formatCurrency(subscriptionExpenses)}</TableCell>
                      <TableCell align="right">
                        {totalIncome > 0 ? `${(subscriptionExpenses / totalIncome * 100).toFixed(1)}%` : '0%'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Expenses</TableCell>
                      <TableCell align="right">{formatCurrency(totalExpenses)}</TableCell>
                      <TableCell align="right">
                        {totalIncome > 0 ? `${(totalExpenses / totalIncome * 100).toFixed(1)}%` : '0%'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {balance >= 0 ? 'Surplus' : 'Deficit'}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: balance >= 0 ? 'success.main' : 'error.main'
                        }}
                      >
                        {formatCurrency(Math.abs(balance))}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {totalIncome > 0 ? `${Math.abs(balance) / totalIncome * 100 > 0.1 ? (Math.abs(balance) / totalIncome * 100).toFixed(1) : '<0.1'}%` : '0%'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => router.push('/dashboard/income')}
                  size="small"
                >
                  Manage Income
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => router.push('/dashboard/expenses')}
                  size="small"
                >
                  Manage Expenses
                </Button>
              </Box>
            </Paper>
          </Box>
        </>
      )}
    </SidebarLayout>
  );
} 