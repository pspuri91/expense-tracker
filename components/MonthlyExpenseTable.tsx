"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { ExpenseModal } from "./ExpenseModal"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { ExpenseHistoryModal } from "./ExpenseHistoryModal"

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

export function MonthlyExpenseTable() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isGroceryModalOpen, setIsGroceryModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [selectedExpenseName, setSelectedExpenseName] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const { toast } = useToast()

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth, selectedYear]);

  async function fetchExpenses() {
    try {
      const response = await fetch(`/api/expenses?month=${selectedMonth}&year=${selectedYear}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const data = await response.json();
      const sortedExpenses = data.sort((a: Expense, b: Expense) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setExpenses(sortedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (expense: Expense) => {
    setExpenseToDelete(expense);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      const response = await fetch('/api/expenses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: expenseToDelete.id, isGrocery: expenseToDelete.isGrocery }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      // Refresh the expenses list
      fetchExpenses();
      setIsDeleteDialogOpen(false);
      setExpenseToDelete(null);

      toast({
        title: "Expense deleted successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  // Update the sorting function
  const sortByDateAndCategory = (a: Expense, b: Expense) => {
    // Get category values with fallbacks
    const categoryA = a.isGrocery 
      ? (a.subCategory || 'Uncategorized')
      : (a.category || 'Uncategorized');
    
    const categoryB = b.isGrocery 
      ? (b.subCategory || 'Uncategorized')
      : (b.category || 'Uncategorized');

    // First sort by category
    const categoryCompare = categoryA.localeCompare(categoryB);
    
    // If categories are the same, sort by date (descending)
    if (categoryCompare === 0) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return categoryCompare;
  };

  // Update the getSortedAndGroupedExpenses function
  const getSortedAndGroupedExpenses = () => {
    // First, separate groceries and other expenses
    const groceries = expenses.filter(expense => expense.isGrocery);
    const otherExpenses = expenses.filter(expense => !expense.isGrocery);

    // Sort each group
    const sortedGroceries = [...groceries].sort(sortByDateAndCategory);
    const sortedOtherExpenses = [...otherExpenses].sort(sortByDateAndCategory);

    return { groceries: sortedGroceries, otherExpenses: sortedOtherExpenses };
  };

  // Add this function to render mobile-friendly expense card
  const renderExpenseCard = (expense: Expense) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow mb-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 
            className="font-semibold hover:text-blue-500 cursor-pointer"
            onClick={() => handleNameClick(expense.name)}
          >
            {expense.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{expense.date}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">${(expense.price || 0).toFixed(2)}</p>
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

      {expense.isLongTermBuy && (
        <div className="text-sm mb-2">
          <span className="text-gray-500 dark:text-gray-400">Duration:</span>
          <p>{expense.expectedDuration} {expense.durationUnit}</p>
        </div>
      )}

      {expense.additionalDetails && (
        <div className="text-sm mb-2">
          <span className="text-gray-500 dark:text-gray-400">Details:</span>
          <p>{expense.additionalDetails}</p>
        </div>
      )}

      <div className="flex justify-end space-x-2 mt-2">
        <Button onClick={() => handleEdit(expense)} size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button 
          onClick={() => handleDelete(expense)}
          variant="destructive"
          size="sm"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Update the renderTableContent function
  const renderTableContent = () => {
    if (expenses.length === 0) {
      return (
        <div className="text-center p-4">
          No expenses found for this month and year.
        </div>
      );
    }

    const { groceries, otherExpenses } = getSortedAndGroupedExpenses();

    // Mobile view
    return (
      <div className="md:hidden">
        {groceries.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 px-4">Grocery Expenses</h2>
            {groceries.map((expense) => (
              <div key={expense.id}> {/* Add key prop here */}
                {renderExpenseCard(expense)}
              </div>
            ))}
          </div>
        )}
        {otherExpenses.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 px-4">Other Expenses</h2>
            {otherExpenses.map((expense) => (
              <div key={expense.id}> {/* Add key prop here */}
                {renderExpenseCard(expense)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Add this function to render desktop table content
  const renderDesktopTableContent = () => {
    if (expenses.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={16} className="text-center">
            No expenses found for this month and year.
          </TableCell>
        </TableRow>
      );
    }

    const { groceries, otherExpenses } = getSortedAndGroupedExpenses();

    return (
      <>
        {/* Groceries Section */}
        {groceries.length > 0 && (
          <>
            <TableRow>
              <TableCell 
                colSpan={16} 
                className="bg-gray-100 dark:bg-gray-800 font-semibold"
              >
                Grocery Expenses
              </TableCell>
            </TableRow>
            {groceries.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.date}</TableCell>
                <TableCell>
                  <span 
                    className="hover:text-blue-500 cursor-pointer"
                    onClick={() => handleNameClick(expense.name)}
                  >
                    {expense.name}
                  </span>
                </TableCell>
                <TableCell>{expense.subCategory}</TableCell>
                <TableCell>${(expense.price || 0).toFixed(2)}</TableCell>
                <TableCell>{expense.store}</TableCell>
                <TableCell>{expense.additionalDetails}</TableCell>
                <TableCell>{expense.isLongTermBuy ? 'Yes' : 'No'}</TableCell>
                <TableCell>{expense.expectedDuration}</TableCell>
                <TableCell>{expense.durationUnit}</TableCell>
                <TableCell>{expense.isGrocery ? 'Yes' : 'No'}</TableCell>
                <TableCell>{expense.quantity}</TableCell>
                <TableCell>{expense.subCategory}</TableCell>
                <TableCell>{expense.unit}</TableCell>
                <TableCell>{expense.sellerRate}</TableCell>
                <TableCell>{expense.sellerRateInLb}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleEdit(expense)} size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => handleDelete(expense)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </>
        )}

        {/* Other Expenses Section */}
        {otherExpenses.length > 0 && (
          <>
            <TableRow>
              <TableCell 
                colSpan={16} 
                className="bg-gray-100 dark:bg-gray-800 font-semibold"
              >
                Other Expenses
              </TableCell>
            </TableRow>
            {otherExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.date}</TableCell>
                <TableCell>
                  <span 
                    className="hover:text-blue-500 cursor-pointer"
                    onClick={() => handleNameClick(expense.name)}
                  >
                    {expense.name}
                  </span>
                </TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>${(expense.price || 0).toFixed(2)}</TableCell>
                <TableCell>{expense.store}</TableCell>
                <TableCell>{expense.additionalDetails}</TableCell>
                <TableCell>{expense.isLongTermBuy ? 'Yes' : 'No'}</TableCell>
                <TableCell>{expense.expectedDuration}</TableCell>
                <TableCell>{expense.durationUnit}</TableCell>
                <TableCell>{expense.isGrocery ? 'Yes' : 'No'}</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleEdit(expense)} size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => handleDelete(expense)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </>
        )}
      </>
    );
  };

  const handleNameClick = (name: string) => {
    setSelectedExpenseName(name);
    setIsHistoryModalOpen(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl sm:text-2xl">Monthly Expenses</CardTitle>
            <CardDescription>View your expenses for a specific month and year</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => setIsGroceryModalOpen(true)}
              className="flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Grocery</span>
            </Button>
            <Button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Other</span>
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index + 1} value={(index + 1).toString()}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {/* Mobile View */}
        <div className="block md:hidden">
          {renderTableContent()}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Additional Details</TableHead>
                <TableHead>Is Long Term Buy</TableHead>
                <TableHead>Expected Duration</TableHead>
                <TableHead>Duration Unit</TableHead>
                <TableHead>Is Grocery</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Sub-category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Seller Rate (per kg)</TableHead>
                <TableHead>Seller Rate (per lb)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderDesktopTableContent()}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Add/Edit Modals */}
      <ExpenseModal 
        isOpen={isGroceryModalOpen}
        onClose={() => setIsGroceryModalOpen(false)}
        type="grocery"
        mode="create"
      />
      <ExpenseModal 
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        type="other"
        mode="create"
      />
      <ExpenseModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingExpense(null);
          fetchExpenses(); // Refresh the table after edit
        }}
        type={editingExpense?.isGrocery ? 'grocery' : 'other'}
        editData={editingExpense}
        mode="edit"
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the expense.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExpenseToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {selectedExpenseName && (
        <ExpenseHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setSelectedExpenseName(null);
          }}
          expenseName={selectedExpenseName}
        />
      )}
    </Card>
  );
}
