import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  limit
} from 'firebase/firestore';
import { auth, db } from './config';

// Flag to track if we're accessing shared data
let isAccessingSharedData = false;

// Function to check if we're accessing shared data
export const isUsingSharedData = (): boolean => {
  return isAccessingSharedData;
};

// Base types
interface BaseModel {
  id?: string;
  userId: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Type for Income
export interface Income extends BaseModel {
  source: string;  // e.g., "Job", "Second Job", "Other"
  amount: number;
  month: number;   // 1-12
  year: number;
  recurring: boolean;
  startDate?: Date | Timestamp;
  endDate?: Date | Timestamp;
  frequency?: 'weekly' | 'biweekly' | 'monthly' | 'once';
  description?: string;
  isPaid?: boolean;
}

// Types for Expenses
export interface Expense extends BaseModel {
  category: 'fixed' | 'variable' | 'subscription';
  subcategory: string;  // e.g., "Mortgage", "Groceries", "Netflix"
  amount: number;
  month: number;   // 1-12
  year: number;
  description?: string;
  dueDate?: Date | Timestamp;
  dueDayOfMonth?: number; // Day of month when payment is due (for recurring expenses)
  recurring: boolean;
  startDate?: Date | Timestamp;
  endDate?: Date | Timestamp;
  frequency?: 'weekly' | 'biweekly' | 'monthly' | 'once';
  isPaid?: boolean;
  actualAmount?: number;  // Used when the actual amount differs from budgeted
}

// Type for Transaction (for tracking individual variable expenses)
export interface Transaction extends BaseModel {
  expenseId?: string;   // Related expense if applicable
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  date: Date | Timestamp;
  month: number;
  year: number;
}

// Type for monthly summary
export interface MonthlySummary extends BaseModel {
  month: number;
  year: number;
  totalIncome: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  totalSubscriptions: number;
  paidFixedExpenses?: number;
  paidVariableExpenses?: number;
  paidSubscriptions?: number;
  balance: number;  // Surplus/deficit
}

// Get current user ID safely
const getCurrentUserId = (): string => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  
  // Get the primary user's email and ID from env variables
  const primaryUserEmail = process.env.NEXT_PUBLIC_PRIMARY_USER_EMAIL;
  const primaryUserId = process.env.NEXT_PUBLIC_PRIMARY_USER_ID;
  
  // If the user is not the primary user (based on email) and we have a primary user ID configured,
  // use the primary user's ID for data access to enable sharing
  if (user.email !== primaryUserEmail && primaryUserId) {
    console.log(`Using primary user ID (${primaryUserId.substring(0, 6)}...) for data access instead of current user`);
    isAccessingSharedData = true;
    return primaryUserId;
  }
  
  // If the user is primary or we don't have sharing configured, use their own ID
  isAccessingSharedData = false;
  return user.uid;
};

// Collection references
const getIncomeCollection = () => collection(db, 'income');
const getExpensesCollection = () => collection(db, 'expenses');
const getTransactionsCollection = () => collection(db, 'transactions');
const getMonthlySummaryCollection = () => collection(db, 'monthlySummaries');

// ========================
// INCOME OPERATIONS
// ========================

// Add or update income
export const addOrUpdateIncome = async (income: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, id?: string): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    
    const incomeData = {
      ...income,
      userId,
      updatedAt: Timestamp.now(),
      ...(id ? {} : { createdAt: Timestamp.now() }),
    };
    
    // Convert dates to Timestamps if needed
    if (income.startDate instanceof Date) {
      incomeData.startDate = Timestamp.fromDate(income.startDate);
    }
    if (income.endDate instanceof Date) {
      incomeData.endDate = Timestamp.fromDate(income.endDate);
    }
    
    if (id) {
      const docRef = doc(getIncomeCollection(), id);
      await updateDoc(docRef, incomeData);
      return id;
    } else {
      const docRef = await addDoc(getIncomeCollection(), incomeData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error adding/updating income:', error);
    throw error;
  }
};

// Get income by ID
export const getIncome = async (id: string): Promise<Income | null> => {
  try {
    const docRef = doc(db, 'income', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as Omit<Income, 'id'>;
      return { ...data, id: docSnap.id } as Income;
    }
    return null;
  } catch (error) {
    console.error('Error getting income:', error);
    throw error;
  }
};

// Get income for a specific month/year
export const getMonthlyIncome = async (month: number, year: number): Promise<Income[]> => {
  try {
    const userId = getCurrentUserId();
    
    try {
      const q = query(
        getIncomeCollection(), 
        where('userId', '==', userId),
        where('year', '==', year),
        where('month', '==', month)
      );
      
      const querySnapshot = await getDocs(q);
      const incomeItems: Income[] = [];
      
      querySnapshot.forEach((doc) => {
        incomeItems.push({ ...doc.data(), id: doc.id } as Income);
      });
      
      return incomeItems;
    } catch (indexError) {
      console.warn("Index error for income query, trying simpler query:", indexError);
      
      // Fallback to simpler query
      const q = query(
        getIncomeCollection(),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const incomeItems: Income[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Income;
        if (data.year === year && data.month === month) {
          incomeItems.push({ ...data, id: doc.id } as Income);
        }
      });
      
      return incomeItems;
    }
  } catch (error) {
    console.error('Error getting monthly income:', error);
    throw error;
  }
};

// Delete income
export const deleteIncome = async (id: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    
    const docRef = doc(db, 'income', id);
    
    // Verify ownership before deleting
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Income record not found');
    }
    
    const income = docSnap.data();
    if (income.userId !== userId) {
      throw new Error('Not authorized to delete this income record');
    }
    
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting income:', error);
    throw error;
  }
};

// ========================
// EXPENSE OPERATIONS
// ========================

// Add or update expense
export const addOrUpdateExpense = async (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, id?: string): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    
    const expenseData = {
      ...expense,
      userId,
      updatedAt: Timestamp.now(),
      ...(id ? {} : { createdAt: Timestamp.now() }),
    };
    
    // Convert dates to Timestamps if needed
    if (expense.dueDate instanceof Date) {
      expenseData.dueDate = Timestamp.fromDate(expense.dueDate);
    }
    if (expense.startDate instanceof Date) {
      expenseData.startDate = Timestamp.fromDate(expense.startDate);
    }
    if (expense.endDate instanceof Date) {
      expenseData.endDate = Timestamp.fromDate(expense.endDate);
    }
    
    if (id) {
      const docRef = doc(getExpensesCollection(), id);
      await updateDoc(docRef, expenseData);
      return id;
    } else {
      const docRef = await addDoc(getExpensesCollection(), expenseData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error adding/updating expense:', error);
    throw error;
  }
};

// Get expense by ID
export const getExpense = async (id: string): Promise<Expense | null> => {
  try {
    const docRef = doc(db, 'expenses', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as Omit<Expense, 'id'>;
      return { ...data, id: docSnap.id } as Expense;
    }
    return null;
  } catch (error) {
    console.error('Error getting expense:', error);
    throw error;
  }
};

// Get expenses for a specific month/year and category
export const getMonthlyExpensesByCategory = async (month: number, year: number, category: 'fixed' | 'variable' | 'subscription'): Promise<Expense[]> => {
  try {
    const userId = getCurrentUserId();
    
    try {
      const q = query(
        getExpensesCollection(), 
        where('userId', '==', userId),
        where('category', '==', category),
        where('year', '==', year),
        where('month', '==', month)
      );
      
      const querySnapshot = await getDocs(q);
      const expenses: Expense[] = [];
      
      querySnapshot.forEach((doc) => {
        expenses.push({ ...doc.data(), id: doc.id } as Expense);
      });
      
      return expenses;
    } catch (indexError) {
      console.warn(`Index error for ${category} expenses query, trying simpler query:`, indexError);
      
      // Fallback to simpler query
      const q = query(
        getExpensesCollection(),
        where('userId', '==', userId),
        where('category', '==', category)
      );
      
      const querySnapshot = await getDocs(q);
      const expenses: Expense[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Expense;
        if (data.year === year && data.month === month) {
          expenses.push({ ...data, id: doc.id } as Expense);
        }
      });
      
      return expenses;
    }
  } catch (error) {
    console.error(`Error getting monthly ${category} expenses:`, error);
    throw error;
  }
};

// Get all expenses for a specific month/year
export const getAllMonthlyExpenses = async (month: number, year: number): Promise<Expense[]> => {
  try {
    const userId = getCurrentUserId();
    
    try {
      const q = query(
        getExpensesCollection(), 
        where('userId', '==', userId),
        where('year', '==', year),
        where('month', '==', month)
      );
      
      const querySnapshot = await getDocs(q);
      const expenses: Expense[] = [];
      
      querySnapshot.forEach((doc) => {
        expenses.push({ ...doc.data(), id: doc.id } as Expense);
      });
      
      return expenses;
    } catch (indexError) {
      console.warn("Index error for all expenses query, trying simpler query:", indexError);
      
      // Fallback to simpler query
      const q = query(
        getExpensesCollection(),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const expenses: Expense[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Expense;
        if (data.year === year && data.month === month) {
          expenses.push({ ...data, id: doc.id } as Expense);
        }
      });
      
      return expenses;
    }
  } catch (error) {
    console.error('Error getting all monthly expenses:', error);
    throw error;
  }
};

// Delete expense
export const deleteExpense = async (id: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    
    const docRef = doc(db, 'expenses', id);
    
    // Verify ownership before deleting
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Expense not found');
    }
    
    const expense = docSnap.data();
    if (expense.userId !== userId) {
      throw new Error('Not authorized to delete this expense');
    }
    
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// ========================
// TRANSACTION OPERATIONS (for variable expenses tracking)
// ========================

// Add transaction
export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    
    const transactionData = {
      ...transaction,
      userId,
      createdAt: Timestamp.now(),
      // Make sure to extract month and year from the date if not provided
      month: transaction.month || (transaction.date instanceof Date ? transaction.date.getMonth() + 1 : new Date((transaction.date as Timestamp).toDate()).getMonth() + 1),
      year: transaction.year || (transaction.date instanceof Date ? transaction.date.getFullYear() : new Date((transaction.date as Timestamp).toDate()).getFullYear())
    };
    
    // Convert date to Timestamp if it's a Date
    if (transaction.date instanceof Date) {
      transactionData.date = Timestamp.fromDate(transaction.date);
    }
    
    const docRef = await addDoc(getTransactionsCollection(), transactionData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

// Get transactions for a specific month/year and category
export const getMonthlyTransactionsByCategory = async (month: number, year: number, category?: string): Promise<Transaction[]> => {
  try {
    const userId = getCurrentUserId();
    
    try {
      // Build query based on whether category is provided
      let q;
      if (category) {
        q = query(
          getTransactionsCollection(), 
          where('userId', '==', userId),
          where('year', '==', year),
          where('month', '==', month),
          where('category', '==', category),
          orderBy('date', 'desc')
        );
      } else {
        q = query(
          getTransactionsCollection(), 
          where('userId', '==', userId),
          where('year', '==', year),
          where('month', '==', month),
          orderBy('date', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const transactions: Transaction[] = [];
      
      querySnapshot.forEach((doc) => {
        transactions.push({ ...doc.data(), id: doc.id } as Transaction);
      });
      
      return transactions;
    } catch (indexError) {
      console.warn("Index error for transactions query, using fallback:", indexError);
      
      // Fallback to simpler query
      const baseQuery = query(
        getTransactionsCollection(),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(baseQuery);
      const transactions: Transaction[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Transaction;
        if (data.year === year && data.month === month && (!category || data.category === category)) {
          transactions.push({ ...data, id: doc.id } as Transaction);
        }
      });
      
      // Sort in memory
      return transactions.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : (a.date as Timestamp).toDate();
        const dateB = b.date instanceof Date ? b.date : (b.date as Timestamp).toDate();
        return dateB.getTime() - dateA.getTime();
      });
    }
  } catch (error) {
    console.error('Error getting monthly transactions:', error);
    throw error;
  }
};

// Delete transaction
export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    
    const docRef = doc(db, 'transactions', id);
    
    // Verify ownership before deleting
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Transaction not found');
    }
    
    const transaction = docSnap.data();
    if (transaction.userId !== userId) {
      throw new Error('Not authorized to delete this transaction');
    }
    
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// ========================
// MONTHLY SUMMARY OPERATIONS
// ========================

// Calculate and save the monthly summary
export const calculateAndSaveMonthSummary = async (month: number, year: number): Promise<MonthlySummary> => {
  try {
    const userId = getCurrentUserId();
    
    // Get all income for the month
    const incomeItems = await getMonthlyIncome(month, year);
    const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
    
    // Get fixed expenses
    const fixedExpenses = await getMonthlyExpensesByCategory(month, year, 'fixed');
    const totalFixedExpenses = fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
    
    // Get paid fixed expenses
    const paidFixedExpenses = fixedExpenses
      .filter(expense => expense.isPaid)
      .reduce((sum, item) => sum + item.amount, 0);
    
    // Get variable expenses
    const variableExpenses = await getMonthlyExpensesByCategory(month, year, 'variable');
    const totalVariableExpenses = variableExpenses.reduce((sum, item) => sum + item.amount, 0);
    
    // Get paid variable expenses
    const paidVariableExpenses = variableExpenses
      .filter(expense => expense.isPaid)
      .reduce((sum, item) => sum + item.amount, 0);
    
    // Get subscriptions
    const subscriptions = await getMonthlyExpensesByCategory(month, year, 'subscription');
    const totalSubscriptions = subscriptions.reduce((sum, item) => sum + item.amount, 0);
    
    // Get paid subscriptions
    const paidSubscriptions = subscriptions
      .filter(expense => expense.isPaid)
      .reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate balance
    const balance = totalIncome - totalFixedExpenses - totalVariableExpenses - totalSubscriptions;
    
    // Create the summary object
    const summary: Omit<MonthlySummary, 'id'> = {
      userId,
      month,
      year,
      totalIncome,
      totalFixedExpenses,
      totalVariableExpenses,
      totalSubscriptions,
      paidFixedExpenses,
      paidVariableExpenses,
      paidSubscriptions,
      balance,
      createdAt: Timestamp.now()
    };
    
    // Find existing summary document or create new one
    const summaryQuery = query(
      getMonthlySummaryCollection(),
      where('userId', '==', userId),
      where('month', '==', month),
      where('year', '==', year),
      limit(1)
    );
    
    const summarySnap = await getDocs(summaryQuery);
    let summaryId: string;
    
    if (!summarySnap.empty) {
      // Update existing summary
      summaryId = summarySnap.docs[0].id;
      await updateDoc(doc(getMonthlySummaryCollection(), summaryId), summary);
    } else {
      // Create new summary
      const docRef = await addDoc(getMonthlySummaryCollection(), summary);
      summaryId = docRef.id;
    }
    
    return { ...summary, id: summaryId } as MonthlySummary;
  } catch (error) {
    console.error('Error calculating monthly summary:', error);
    throw error;
  }
};

// Get monthly summary
export const getMonthlySummary = async (month: number, year: number): Promise<MonthlySummary | null> => {
  try {
    const userId = getCurrentUserId();
    
    const q = query(
      getMonthlySummaryCollection(),
      where('userId', '==', userId),
      where('month', '==', month),
      where('year', '==', year),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { ...doc.data(), id: doc.id } as MonthlySummary;
    }
    
    // If no summary exists, calculate and save it
    return await calculateAndSaveMonthSummary(month, year);
  } catch (error) {
    console.error('Error getting monthly summary:', error);
    throw error;
  }
};

// ========================
// HELPER FUNCTIONS FOR RECURRING ITEMS
// ========================

// Create recurring income entries for specified period
export const createRecurringIncome = async (
  incomeTemplate: Omit<Income, 'id' | 'userId' | 'createdAt' | 'month' | 'year'>,
  startMonth: number,
  startYear: number,
  endMonth?: number,
  endYear?: number
): Promise<string[]> => {
  try {
    const userId = getCurrentUserId();
    const batch = writeBatch(db);
    const createdIds: string[] = [];
    
    // Default end date to end of current year if not specified
    if (!endMonth || !endYear) {
      endMonth = 12;
      endYear = startYear;
    }
    
    // Calculate total months to create
    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth + 1);
    
    // Determine frequency
    let frequencyMonths = 1; // Default monthly
    if (incomeTemplate.frequency === 'weekly') frequencyMonths = 0.25;
    else if (incomeTemplate.frequency === 'biweekly') frequencyMonths = 0.5;
    
    // Starting point
    let currentMonth = startMonth;
    let currentYear = startYear;
    
    // First create entry for the current month explicitly to ensure it's not skipped
    const currentMonthDocRef = doc(getIncomeCollection());
    const currentMonthData: Omit<Income, 'id'> = {
      ...incomeTemplate,
      userId,
      month: currentMonth,
      year: currentYear,
      createdAt: Timestamp.now()
    };
    batch.set(currentMonthDocRef, currentMonthData);
    createdIds.push(currentMonthDocRef.id);
    
    // Advance to next period based on frequency
    if (incomeTemplate.frequency === 'weekly') {
      currentMonth += 0.25;
    } else if (incomeTemplate.frequency === 'biweekly') {
      currentMonth += 0.5;
    } else {
      currentMonth += 1;
    }
    
    // Adjust if we crossed to the next year
    if (currentMonth > 12) {
      currentMonth -= 12;
      currentYear += 1;
    }
    
    // Now create the remaining entries
    for (let i = frequencyMonths; i < totalMonths; i += frequencyMonths) {
      // Skip if we've gone past the end date
      if (currentYear > endYear || (currentYear === endYear && currentMonth > endMonth)) {
        break;
      }
      
      // Create new income document reference
      const docRef = doc(getIncomeCollection());
      
      // Prepare data
      const incomeData: Omit<Income, 'id'> = {
        ...incomeTemplate,
        userId,
        month: Math.floor(currentMonth), // Ensure whole month number
        year: currentYear,
        createdAt: Timestamp.now()
      };
      
      // Add to batch
      batch.set(docRef, incomeData);
      createdIds.push(docRef.id);
      
      // Update month for next iteration
      if (incomeTemplate.frequency === 'weekly') {
        currentMonth += 0.25; // Approximate - not precise
      } else if (incomeTemplate.frequency === 'biweekly') {
        currentMonth += 0.5; // Approximate
      } else {
        currentMonth += 1; // Monthly
      }
      
      // Adjust if we crossed to the next year
      while (currentMonth > 12) {
        currentMonth -= 12;
        currentYear += 1;
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    return createdIds;
  } catch (error) {
    console.error('Error creating recurring income:', error);
    throw error;
  }
};

// Create recurring expense entries for specified period
export const createRecurringExpense = async (
  expenseTemplate: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'month' | 'year'>,
  startMonth: number,
  startYear: number,
  endMonth?: number,
  endYear?: number
): Promise<string[]> => {
  try {
    const userId = getCurrentUserId();
    const batch = writeBatch(db);
    const createdIds: string[] = [];
    
    // Current date for determining isPaid status
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for accurate comparison
    
    // Default end date to end of current year if not specified
    if (!endMonth || !endYear) {
      endMonth = 12;
      endYear = startYear;
    }
    
    // Calculate total months to create
    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth + 1);
    
    // Determine frequency
    let frequencyMonths = 1; // Default monthly
    if (expenseTemplate.frequency === 'weekly') frequencyMonths = 0.25;
    else if (expenseTemplate.frequency === 'biweekly') frequencyMonths = 0.5;
    
    // Starting point
    let currentMonth = startMonth;
    let currentYear = startYear;
    
    // First create entry for the current month explicitly to ensure it's not skipped
    const currentMonthDocRef = doc(getExpensesCollection());
    
    // Calculate proper due date for this month using dueDayOfMonth if provided
    let dueDate = expenseTemplate.dueDate;
    if (expenseTemplate.dueDayOfMonth) {
      // Create a date using the dueDayOfMonth for the current month/year
      // Handle months with fewer days by using the last day of the month
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const actualDueDay = Math.min(expenseTemplate.dueDayOfMonth, daysInMonth);
      dueDate = new Date(currentYear, currentMonth - 1, actualDueDay);
      
      // Convert to Timestamp if necessary
      if (dueDate instanceof Date) {
        dueDate = Timestamp.fromDate(dueDate);
      }
    }
    
    // Set isPaid based on due date vs current date
    let isPaid = expenseTemplate.isPaid;
    if (dueDate) {
      const dueDateObj = dueDate instanceof Date ? dueDate : dueDate.toDate();
      isPaid = dueDateObj <= today;
    }
    
    const currentMonthData: Omit<Expense, 'id'> = {
      ...expenseTemplate,
      userId,
      month: currentMonth,
      year: currentYear,
      dueDate,
      isPaid,
      createdAt: Timestamp.now()
    };
    
    batch.set(currentMonthDocRef, currentMonthData);
    createdIds.push(currentMonthDocRef.id);
    
    // Advance to next period based on frequency
    if (expenseTemplate.frequency === 'weekly') {
      currentMonth += 0.25;
    } else if (expenseTemplate.frequency === 'biweekly') {
      currentMonth += 0.5;
    } else {
      currentMonth += 1;
    }
    
    // Adjust if we crossed to the next year
    if (currentMonth > 12) {
      currentMonth -= 12;
      currentYear += 1;
    }
    
    // Now create the remaining entries
    for (let i = frequencyMonths; i < totalMonths; i += frequencyMonths) {
      // Skip if we've gone past the end date
      if (currentYear > endYear || (currentYear === endYear && currentMonth > endMonth)) {
        break;
      }
      
      // Create new expense document reference
      const docRef = doc(getExpensesCollection());
      
      // Calculate proper due date for this period using dueDayOfMonth if provided
      let periodDueDate = expenseTemplate.dueDate;
      if (expenseTemplate.dueDayOfMonth) {
        // Create a date using the dueDayOfMonth for the current month/year
        // Handle months with fewer days by using the last day of the month
        const daysInMonth = new Date(currentYear, Math.floor(currentMonth), 0).getDate();
        const actualDueDay = Math.min(expenseTemplate.dueDayOfMonth, daysInMonth);
        periodDueDate = new Date(currentYear, Math.floor(currentMonth) - 1, actualDueDay);
        
        // Convert to Timestamp if necessary
        if (periodDueDate instanceof Date) {
          periodDueDate = Timestamp.fromDate(periodDueDate);
        }
      }
      
      // Set isPaid based on due date vs current date for each month
      let monthIsPaid = false;
      if (periodDueDate) {
        const dueDateObj = periodDueDate instanceof Date ? periodDueDate : periodDueDate.toDate();
        monthIsPaid = dueDateObj <= today;
      }
      
      // Prepare data
      const expenseData: Omit<Expense, 'id'> = {
        ...expenseTemplate,
        userId,
        month: Math.floor(currentMonth), // Ensure whole month number
        year: currentYear,
        dueDate: periodDueDate,
        isPaid: monthIsPaid,
        createdAt: Timestamp.now()
      };
      
      // Add to batch
      batch.set(docRef, expenseData);
      createdIds.push(docRef.id);
      
      // Update month for next iteration
      if (expenseTemplate.frequency === 'weekly') {
        currentMonth += 0.25; // Approximate - not precise
      } else if (expenseTemplate.frequency === 'biweekly') {
        currentMonth += 0.5; // Approximate
      } else {
        currentMonth += 1; // Monthly
      }
      
      // Adjust if we crossed to the next year
      while (currentMonth > 12) {
        currentMonth -= 12;
        currentYear += 1;
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    return createdIds;
  } catch (error) {
    console.error('Error creating recurring expense:', error);
    throw error;
  }
};

// Delete multiple recurring expense entries based on common properties
export const bulkDeleteRecurringExpenses = async (
  templateExpense: Expense,
  deleteAll: boolean = false,
  fromMonth?: number,
  fromYear?: number
): Promise<number> => {
  try {
    const userId = getCurrentUserId();
    const batch = writeBatch(db);
    let deleteCount = 0;
    
    // Create a query to find all similar recurring expenses
    const q = query(
      getExpensesCollection(),
      where('userId', '==', userId),
      where('category', '==', templateExpense.category),
      where('subcategory', '==', templateExpense.subcategory),
      where('recurring', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const matchingExpenses: Expense[] = [];
    
    // First gather all potential matches
    querySnapshot.forEach((doc) => {
      const expense = { ...doc.data(), id: doc.id } as Expense;
      
      // Check if this expense matches our template (same amount, frequency, dueDayOfMonth)
      if (
        expense.amount === templateExpense.amount &&
        expense.frequency === templateExpense.frequency &&
        expense.dueDayOfMonth === templateExpense.dueDayOfMonth
      ) {
        matchingExpenses.push(expense);
      }
    });
    
    // Sort expenses by date for processing
    matchingExpenses.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    // If deleteAll is true, delete all matching expenses
    // Otherwise, delete only expenses from the specified month/year onwards
    for (const expense of matchingExpenses) {
      if (
        deleteAll || 
        (expense.year > (fromYear || 0)) || 
        (expense.year === fromYear && expense.month >= (fromMonth || 0))
      ) {
        if (expense.id) {
          batch.delete(doc(getExpensesCollection(), expense.id));
          deleteCount++;
        }
      }
    }
    
    if (deleteCount > 0) {
      await batch.commit();
    }
    
    return deleteCount;
  } catch (error) {
    console.error('Error bulk deleting recurring expenses:', error);
    throw error;
  }
}; 