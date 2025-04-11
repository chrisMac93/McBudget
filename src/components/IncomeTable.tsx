import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Select,
  SelectChangeEvent,
  Box
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Income, addOrUpdateIncome } from '@/firebase/services';

// Helper to get month name
const getMonthName = (month: number): string => {
  return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
};

interface IncomeTableProps {
  incomes: Income[];
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: 'received' | 'pending') => void;
}

const IncomeTable: React.FC<IncomeTableProps> = ({ incomes, onEdit, onDelete, onStatusChange }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, income: Income) => {
    setAnchorEl(event.currentTarget);
    setSelectedIncome(income);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedIncome(null);
  };

  const handleStatusChange = (id: string | undefined, event: SelectChangeEvent<'received' | 'pending'>) => {
    if (!id) return;
    const newStatus = event.target.value as 'received' | 'pending';
    onStatusChange(id, newStatus);
    const incomeToUpdate = incomes.find(inc => inc.id === id);
    if (incomeToUpdate) {
      addOrUpdateIncome({
        ...incomeToUpdate,
        isPaid: newStatus === 'received'
      }, id);
    }
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      {incomes.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No income entries found
          </Typography>
        </Box>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Source</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Month</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incomes.map((income) => (
                <TableRow key={income.id || 'unknown'}>
                  <TableCell>{income.source}</TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold">
                      ${income.amount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>{getMonthName(income.month)}</TableCell>
                  <TableCell>{income.year}</TableCell>
                  <TableCell>
                    <Select
                      value={income.isPaid ? 'received' : 'pending'}
                      onChange={(event) => handleStatusChange(income.id, event)}
                      size="small"
                      sx={{ minWidth: 100 }}
                    >
                      <MenuItem value="received">Received</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, income)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => {
              if (selectedIncome) {
                onEdit(selectedIncome);
                handleMenuClose();
              }
            }}>
              Edit
            </MenuItem>
            <MenuItem onClick={() => {
              if (selectedIncome?.id) {
                onDelete(selectedIncome.id);
                handleMenuClose();
              }
            }}>
              Delete
            </MenuItem>
          </Menu>
        </>
      )}
    </TableContainer>
  );
};

export default IncomeTable; 