"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Expense = {
  id: string;
  date: string;
  name: string;
  category: string;
  price: number;
  store: string;
  additionalDetails: string;
  isLongTermBuy: boolean;
  expectedDuration: number | null;
  durationUnit: string | null;
  isGrocery: boolean;
  quantity?: number;
  subCategory?: string;
  unit?: string;
  sellerRate?: number;
  sellerRateInLb?: number;
};

interface ExpenseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseName: string;
}

export function ExpenseHistoryModal({ isOpen, onClose, expenseName }: ExpenseHistoryModalProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    if (isOpen && expenseName) {
      fetchExpenseHistory();
    }
  }, [isOpen, expenseName]);

  async function fetchExpenseHistory() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/expenses/history?name=${encodeURIComponent(expenseName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expense history');
      }
      const data = await response.json();
      // Sort by date in descending order
      const sortedData = data.sort((a: Expense, b: Expense) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setExpenses(sortedData);
    } catch (error) {
      console.error('Error fetching expense history:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const totalPages = Math.ceil(expenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExpenses = expenses.slice(startIndex, endIndex);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Expense History: {expenseName}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>{expenses[0]?.isGrocery ? 'Sub-category' : 'Category'}</TableHead>
                  {expenses[0]?.isGrocery && (
                    <>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                    </>
                  )}
                  <TableHead>Additional Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>${expense.price.toFixed(2)}</TableCell>
                    <TableCell>{expense.store}</TableCell>
                    <TableCell>{expense.isGrocery ? expense.subCategory : expense.category}</TableCell>
                    {expense.isGrocery && (
                      <>
                        <TableCell>{expense.quantity}</TableCell>
                        <TableCell>{expense.unit}</TableCell>
                      </>
                    )}
                    <TableCell>{expense.additionalDetails}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
