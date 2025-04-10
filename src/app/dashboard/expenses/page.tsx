'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Box, 
  CircularProgress, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Paper, 
  Tabs, 
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import dynamic from 'next/dynamic';
import SidebarLayout from '@/components/SidebarLayout';
import { Expense, getAllMonthlyExpenses } from '@/firebase/services';

// Import components dynamically with client-side only rendering
const ExpenseForm = dynamic(() => import('@/components/ExpenseForm'), { ssr: false });

// Helper to get month name
const getMonthName = (month: number): string => {
  return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
};

// Generate year options from 2020 to current year + 1
const generateYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - 2020 + 2 }, (_, i) => 2020 + i);
};

export default function ExpensesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Fixed, 2: Variable, 3: Subscriptions

  // Get current month and year
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
      fetchExpenses();
    }
  }, [user, selectedMonth, selectedYear]);

  const fetchExpenses = async () => {
    try {
      setFetchLoading(true);
      const allExpenses = await getAllMonthlyExpenses(selectedMonth, selectedYear);
      setExpenses(allExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSuccess = () => {
    fetchExpenses();
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleMonthChange = (e: SelectChangeEvent<number>) => {
    setSelectedMonth(e.target.value as number);
  };

  const handleYearChange = (e: SelectChangeEvent<number>) => {
    setSelectedYear(e.target.value as number);
  };

  // Filter expenses based on active tab
  const filteredExpenses = expenses.filter(expense => {
    if (activeTab === 0) return true; // All expenses
    if (activeTab === 1) return expense.category === 'fixed';
    if (activeTab === 2) return expense.category === 'variable';
    if (activeTab === 3) return expense.category === 'subscription';
    return true;
  });

  // Get category label
  const getCategoryLabel = () => {
    if (activeTab === 0) return 'All';
    if (activeTab === 1) return 'Fixed';
    if (activeTab === 2) return 'Variable';
    if (activeTab === 3) return 'Subscription';
    return '';
  };

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
    <SidebarLayout title="Expense Management">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Add Expense
          </Typography>
          <ExpenseForm onSuccess={handleSuccess} />
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h5">
              Expenses
            </Typography>
            
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
          
          <Paper sx={{ mb: 3, overflow: 'hidden' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="All" />
              <Tab label="Fixed" />
              <Tab label="Variable" />
              <Tab label="Subscriptions" />
            </Tabs>
          </Paper>
          
          {fetchLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {filteredExpenses.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No {getCategoryLabel().toLowerCase()} expenses found for {getMonthName(selectedMonth)} {selectedYear}.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
                  {filteredExpenses.map((item) => (
                    <Card 
                      key={item.id} 
                      sx={{ 
                        mb: 2, 
                        borderLeft: '4px solid', 
                        borderColor: (() => {
                          if (item.category === 'fixed') return 'info.main';
                          if (item.category === 'variable') return 'warning.main';
                          return 'secondary.main'; // subscription
                        })(),
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
                              {item.subcategory}
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 1 }} noWrap>
                              {item.description || 'No description'}
                            </Typography>
                          </Box>
                          <Typography variant="h5" component="div" color="error.main">
                            ${item.amount.toFixed(2)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: item.isPaid ? 'success.main' : 'warning.main',
                              fontWeight: 'bold'
                            }}
                          >
                            {item.isPaid ? 'PAID' : 'PENDING'}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              textTransform: 'capitalize'
                            }}
                          >
                            {item.category} {item.recurring ? '(Recurring)' : ''}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </SidebarLayout>
  );
} 