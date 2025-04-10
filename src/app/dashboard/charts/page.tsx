'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Box, 
  CircularProgress, 
  Container, 
  Typography, 
  Paper, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tab,
  Tabs,
  Skeleton,
  Alert
} from '@mui/material';
import SidebarLayout from '@/components/SidebarLayout';
import { getMonthlySummary, getMonthlyIncome, Income, MonthlySummary } from '@/firebase/services';
import dynamic from 'next/dynamic';

// Dynamically import all of recharts
const Charts = dynamic(() => import('../../../components/Charts'), { 
  ssr: false,
  loading: () => <Skeleton variant="rectangular" width="100%" height={300} /> 
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

// Chart colors
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Helper to calculate weekly income for recurring items
const calculateTotalIncomeWithRecurring = async (selectedMonth: number, selectedYear: number) => {
  const incomeData = await getMonthlyIncome(selectedMonth, selectedYear);
  
  let total = 0;
  
  incomeData.forEach(income => {
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

export default function ChartsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [incomeList, setIncomeList] = useState<Income[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [totalIncome, setTotalIncome] = useState<number>(0);

  // Current date values
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Selected filter values
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    setMounted(true);
    
    // Redirect if not authenticated
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      setFetchLoading(true);
      // Get summary and income data in parallel
      const [summaryData, incomeData] = await Promise.all([
        getMonthlySummary(selectedMonth, selectedYear),
        getMonthlyIncome(selectedMonth, selectedYear)
      ]);
      
      setSummary(summaryData);
      setIncomeList(incomeData);
      
      // Calculate actual total income with proper weekly/biweekly calculations
      const calculatedTotalIncome = await calculateTotalIncomeWithRecurring(selectedMonth, selectedYear);
      setTotalIncome(calculatedTotalIncome);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleMonthChange = (e: SelectChangeEvent<number>) => {
    setSelectedMonth(e.target.value as number);
  };

  const handleYearChange = (e: SelectChangeEvent<number>) => {
    setSelectedYear(e.target.value as number);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Generate data for expense breakdown pie chart
  const pieChartData = summary ? [
    { name: 'Fixed Expenses', value: summary.totalFixedExpenses, color: '#8884d8' },
    { name: 'Variable Expenses', value: summary.totalVariableExpenses, color: '#82ca9d' },
    { name: 'Subscriptions', value: summary.totalSubscriptions, color: '#ffc658' },
  ] : [];

  // Calculate total expenses
  const totalExpenses = summary ? 
    (summary.totalFixedExpenses + summary.totalVariableExpenses + summary.totalSubscriptions) : 0;

  // Calculate balance
  const balance = totalIncome - totalExpenses;

  // Generate data for income vs expenses bar chart
  const barChartData = [
    {
      name: `${getMonthName(selectedMonth)} ${selectedYear}`,
      Income: totalIncome,
      Expenses: totalExpenses,
      Balance: balance > 0 ? balance : 0,
      Deficit: balance < 0 ? Math.abs(balance) : 0,
    }
  ];

  // Income breakdown data
  const incomeChartData = incomeList.map(item => ({
    name: item.source,
    value: item.amount,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]
  }));

  // Don't render anything on server to avoid hydration issues
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

  // Show content only if user is authenticated
  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <SidebarLayout title="Financial Charts">
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5">Financial Analysis</Typography>
          
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
        
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="Expense Breakdown" />
          <Tab label="Income vs Expenses" />
          <Tab label="Income Sources" />
        </Tabs>
        
        {fetchLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : totalExpenses === 0 && totalIncome === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No data available for {getMonthName(selectedMonth)} {selectedYear}
            </Typography>
          </Box>
        ) : (
          <>
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                  Expense Distribution
                </Typography>
                
                {totalExpenses === 0 ? (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    No expense data for this period.
                  </Alert>
                ) : (
                  <Box sx={{ height: 400, width: '100%' }}>
                    <Charts 
                      type="pie" 
                      data={pieChartData} 
                      colors={COLORS}
                    />
                  </Box>
                )}
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Summary
                  </Typography>
                  <Typography variant="body2">
                    Total Fixed Expenses: ${summary ? summary.totalFixedExpenses.toFixed(2) : '0.00'}
                  </Typography>
                  <Typography variant="body2">
                    Total Variable Expenses: ${summary ? summary.totalVariableExpenses.toFixed(2) : '0.00'}
                  </Typography>
                  <Typography variant="body2">
                    Total Subscriptions: ${summary ? summary.totalSubscriptions.toFixed(2) : '0.00'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Total Expenses: ${totalExpenses.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}
            
            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                  Income vs Expenses
                </Typography>
                <Box sx={{ height: 400, width: '100%' }}>
                  <Charts 
                    type="bar" 
                    data={barChartData} 
                    keys={['Income', 'Expenses', balance >= 0 ? 'Balance' : 'Deficit']}
                    colors={['#8884d8', '#82ca9d', balance >= 0 ? '#ffc658' : '#ff8042']}
                  />
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Summary
                  </Typography>
                  <Typography variant="body2">
                    Total Income: ${totalIncome.toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    Total Expenses: ${totalExpenses.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" 
                    sx={{ 
                      mt: 1, 
                      color: balance >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 'bold'
                    }}
                  >
                    {balance >= 0 ? 'Surplus' : 'Deficit'}: ${Math.abs(balance).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}
            
            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                  Income Sources
                </Typography>
                
                {incomeList.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    No income data for this period.
                  </Alert>
                ) : (
                  <Box sx={{ height: 400, width: '100%' }}>
                    <Charts 
                      type="pie" 
                      data={incomeChartData} 
                      colors={COLORS}
                    />
                  </Box>
                )}
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Income Sources
                  </Typography>
                  {incomeList.map((item) => (
                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {item.source} {item.recurring ? `(${item.frequency})` : ''}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        ${item.amount.toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                    Total Income: ${totalIncome.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}
          </>
        )}
      </Paper>
    </SidebarLayout>
  );
} 