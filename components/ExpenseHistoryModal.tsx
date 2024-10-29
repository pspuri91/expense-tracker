"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

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
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && expenseName) {
      fetchExpenseHistory();
    }
  }, [isOpen, expenseName]);

  async function fetchExpenseHistory() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/expenses/history?name=${encodeURIComponent(expenseName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expense history');
      }
      const data = await response.json();
      const sortedData = data.sort((a: Expense, b: Expense) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setExpenses(sortedData);
    } catch (error) {
      console.error('Error fetching expense history:', error);
      setError('Failed to load expense history. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load expense history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const totalPages = Math.ceil(expenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExpenses = expenses.slice(startIndex, endIndex);

  const renderExpenseCard = (expense: Expense) => (
    <Card className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow mb-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold">{expense.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{expense.date}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">${expense.price.toFixed(2)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{expense.store}</p>
        </div>
      </div>
      
      {expense.isGrocery ? (
        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Sub-category:</span>
            <p>{expense.subCategory}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Quantity:</span>
            <p>{expense.quantity} {expense.unit}</p>
          </div>
          {expense.sellerRate && (
            <>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Rate (kg):</span>
                <p>${expense.sellerRate}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Rate (lb):</span>
                <p>${expense.sellerRateInLb}</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Category:</span>
          <p className="text-sm">{expense.category}</p>
        </div>
      )}

      {expense.additionalDetails && (
        <div className="text-sm mb-2">
          <span className="text-gray-500 dark:text-gray-400">Details:</span>
          <p>{expense.additionalDetails}</p>
        </div>
      )}
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Expense History: {expenseName}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : error ? (
          <div className="p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        ) : (
          <>
            <div className="md:hidden">
              {currentExpenses.map((expense) => renderExpenseCard(expense))}
            </div>
            <div className="hidden md:block">
              {/* Keep the existing table for desktop view */}
              {/* ... (existing table code) ... */}
            </div>

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
