'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  useTheme,
  Stack,
  Button
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import { Expense, getAllMonthlyExpenses, deleteExpense } from '@/firebase/services';
import { useAuth } from '@/context/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`expense-tabpanel-${index}`}
      aria-labelledby={`expense-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [initialExpense, setInitialExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const theme = useTheme();

  const fetchExpenses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const currentDate = new Date();
      const monthlyExpenses = await getAllMonthlyExpenses(
        currentDate.getMonth() + 1,
        currentDate.getFullYear()
      );
      setExpenses(monthlyExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEditExpense = (expense: Expense) => {
    setInitialExpense(expense);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setInitialExpense(null);
    fetchExpenses();
  };

  const handleStatusChange = (id: string, status: 'paid' | 'pending') => {
    setExpenses(prevExpenses => 
      prevExpenses.map(expense => 
        expense.id === id ? { ...expense, isPaid: status === 'paid' } : expense
      )
    );
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id);
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Expenses
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(true)}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
              : 'linear-gradient(45deg, #1976D2 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)'
                : 'linear-gradient(45deg, #1565C0 30%, #1E88E5 90%)',
            },
            borderRadius: 2,
          }}
        >
          Add Expense
        </Button>
      </Stack>

      <Paper 
        elevation={3} 
        sx={{ 
          mb: 3,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(145deg, rgba(30,30,30,0.8), rgba(20,20,20,0.8))'
            : 'linear-gradient(145deg, rgba(255,255,255,0.8), rgba(240,240,240,0.8))'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="expense tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
            },
          }}
        >
          <Tab label="All Expenses" />
          <Tab label="Fixed" />
          <Tab label="Variable" />
          <Tab label="Subscriptions" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <ExpenseList 
            expenses={expenses}
            onEdit={handleEditExpense}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteExpense}
            loading={loading}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <ExpenseList 
            expenses={expenses.filter(expense => expense.category === 'fixed')}
            onEdit={handleEditExpense}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteExpense}
            loading={loading}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <ExpenseList 
            expenses={expenses.filter(expense => expense.category === 'variable')}
            onEdit={handleEditExpense}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteExpense}
            loading={loading}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <ExpenseList 
            expenses={expenses.filter(expense => expense.category === 'subscription')}
            onEdit={handleEditExpense}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteExpense}
            loading={loading}
          />
        </TabPanel>
      </Paper>

      {showForm && (
        <ExpenseForm
          onSuccess={handleFormSuccess}
          initialExpense={initialExpense}
        />
      )}
    </Box>
  );
} 