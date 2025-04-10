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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import dynamic from 'next/dynamic';
import SidebarLayout from '@/components/SidebarLayout';
import { Income, getMonthlyIncome } from '@/firebase/services';

// Import components dynamically with client-side only rendering
const IncomeForm = dynamic(() => import('@/components/IncomeForm'), { ssr: false });

// Helper to get month name
const getMonthName = (month: number): string => {
  return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
};

// Generate year options from 2020 to current year + 1
const generateYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - 2020 + 2 }, (_, i) => 2020 + i);
};

export default function IncomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [incomeList, setIncomeList] = useState<Income[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);

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
      fetchIncome();
    }
  }, [user, selectedMonth, selectedYear]);

  const fetchIncome = async () => {
    try {
      setFetchLoading(true);
      const income = await getMonthlyIncome(selectedMonth, selectedYear);
      setIncomeList(income);
    } catch (error) {
      console.error('Error fetching income:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSuccess = () => {
    fetchIncome();
  };

  const handleMonthChange = (e: SelectChangeEvent<number>) => {
    setSelectedMonth(e.target.value as number);
  };

  const handleYearChange = (e: SelectChangeEvent<number>) => {
    setSelectedYear(e.target.value as number);
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
    <SidebarLayout title="Income Management">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Add Income
          </Typography>
          <IncomeForm onSuccess={handleSuccess} />
        </Box>
        
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h5">
              Income
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
          
          {fetchLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {incomeList.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No income entries found for {getMonthName(selectedMonth)} {selectedYear}.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
                  {incomeList.map((item) => (
                    <Card 
                      key={item.id} 
                      sx={{ 
                        mb: 2, 
                        borderLeft: '4px solid', 
                        borderColor: item.isPaid ? 'success.main' : 'warning.main',
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
                              {item.source}
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 1 }} noWrap>
                              {item.description || 'No description'}
                            </Typography>
                          </Box>
                          <Typography variant="h5" component="div" color="primary.main">
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
                            {item.isPaid ? 'RECEIVED' : 'PENDING'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.recurring ? 'Recurring' : 'One-time'}
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