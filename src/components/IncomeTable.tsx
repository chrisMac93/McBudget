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
  Chip,
  Typography,
  Box,
  useTheme
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Income } from '@/firebase/services';
import { format } from 'date-fns';

interface IncomeTableProps {
  incomes: Income[];
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
}

const IncomeTable: React.FC<IncomeTableProps> = ({ incomes, onEdit, onDelete, onMarkAsPaid }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const theme = useTheme();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, income: Income) => {
    setAnchorEl(event.currentTarget);
    setSelectedIncome(income);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedIncome(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return theme.palette.success.main;
      case 'pending':
        return theme.palette.warning.main;
      case 'overdue':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'received':
        return 'Received';
      case 'pending':
        return 'Pending';
      case 'overdue':
        return 'Overdue';
      default:
        return status;
    }
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Source</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {incomes.map((income) => (
            <TableRow key={income.id}>
              <TableCell>{income.source}</TableCell>
              <TableCell>
                <Typography variant="body1" fontWeight="bold">
                  ${income.amount.toFixed(2)}
                </Typography>
              </TableCell>
              <TableCell>{income.category}</TableCell>
              <TableCell>
                {format(income.date.toDate(), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <Chip
                  label={getStatusLabel(income.paymentStatus)}
                  sx={{
                    backgroundColor: getStatusColor(income.paymentStatus),
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
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
        {selectedIncome && !selectedIncome.isPaid && (
          <MenuItem onClick={() => {
            onMarkAsPaid(selectedIncome.id);
            handleMenuClose();
          }}>
            Mark as Received
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          onEdit(selectedIncome!);
          handleMenuClose();
        }}>
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          onDelete(selectedIncome!.id);
          handleMenuClose();
        }}>
          Delete
        </MenuItem>
      </Menu>
    </TableContainer>
  );
};

export default IncomeTable; 