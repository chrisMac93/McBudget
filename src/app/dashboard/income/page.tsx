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
  SelectChangeEvent
} from '@mui/material';
import dynamic from 'next/dynamic';
import SidebarLayout from '@/components/SidebarLayout';
import { Income, getMonthlyIncome, deleteIncome, addOrUpdateIncome } from '@/firebase/services';

// Import components dynamically with client-side only rendering
const IncomeForm = dynamic(() => import('@/components/IncomeForm'), { ssr: false });
const IncomeCardList = dynamic(() => import('@/components/IncomeCardList'), { ssr: false });

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
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

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

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearEditingState = () => {
    setEditingIncome(null);
  };

  const handleSuccess = () => {
    fetchIncome();
    clearEditingState();
  };

  const handleMonthChange = (e: SelectChangeEvent<number>) => {
    setSelectedMonth(e.target.value as number);
  };

  const handleYearChange = (e: SelectChangeEvent<number>) => {
    setSelectedYear(e.target.value as number);
  };

  const handleStatusChange = (id: string, status: 'received' | 'pending') => {
    const updatedIncomeList = incomeList.map(income => 
      income.id === id ? { ...income, isPaid: status === 'received' } : income
    );
    setIncomeList(updatedIncomeList);
    
    // Update in Firebase
    const incomeToUpdate = incomeList.find(inc => inc.id === id);
    if (incomeToUpdate) {
      addOrUpdateIncome({
        ...incomeToUpdate,
        isPaid: status === 'received'
      }, id);
    }
  };

  const handleDelete = (id: string) => {
    const updatedIncomeList = incomeList.filter(income => income.id !== id);
    setIncomeList(updatedIncomeList);
    deleteIncome(id);
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, width: '100%', maxWidth: '100vw', padding: { xs: 1, sm: 2 }, overflowX: 'auto', minWidth: 0 }}>
        <Box sx={{ width: '100%', maxWidth: '100%' }}>
          <Typography variant="h5" sx={{ mb: 3, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
            Add Income
          </Typography>
          <IncomeForm onSuccess={handleSuccess} initialIncome={editingIncome} />
        </Box>
        
        <Box sx={{ width: '100%', maxWidth: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2, width: '100%' }}>
            <Typography variant="h5" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
              Income
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 100, width: { xs: 'calc(50% - 4px)', sm: 'auto' } }}>
                <InputLabel sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Month"
                  onChange={handleMonthChange}
                  sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <MenuItem key={month} value={month} sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>
                      {getMonthName(month)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 80, width: { xs: 'calc(50% - 4px)', sm: 'auto' } }}>
                <InputLabel sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Year"
                  onChange={handleYearChange}
                  sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                >
                  {generateYearOptions().map((year) => (
                    <MenuItem key={year} value={year} sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
          
          <Paper sx={{ mb: 3, overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
            <Box sx={{ p: 2, width: '100%', overflowX: 'auto' }}>
              <IncomeCardList 
                incomes={incomeList} 
                onEdit={handleEdit} 
                onStatusChange={handleStatusChange} 
                onDelete={handleDelete} 
                loading={fetchLoading} 
              />
            </Box>
          </Paper>
        </Box>
      </Box>
    </SidebarLayout>
  );
} 