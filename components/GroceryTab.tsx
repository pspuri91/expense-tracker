"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ExpenseModal } from "./ExpenseModal"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { Pencil, Trash2 } from "lucide-react"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"

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

type BudgetCategory = {
  category: string;
  total: number;
  budget: number;
};

export function GroceryTab() {
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGroceryModalOpen, setIsGroceryModalOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [budgetData, setBudgetData] = useState<BudgetCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Add state for editing and deleting
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const months = [
    { value: "all", label: "All" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchBudgetData();
    fetchExpenses();
  }, [selectedMonth, selectedYear]);

  async function fetchBudgetData() {
    try {
      setError(null);
      const response = await fetch(`/api/budget?month=${selectedMonth}&year=${selectedYear}`);
      if (!response.ok) {
        throw new Error('Failed to fetch budget data');
      }
      const data = await response.json();
      setBudgetData(data.budgetData);
    } catch (error) {
      console.error('Error fetching budget data:', error);
      setError('Failed to load budget data. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load budget data. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function fetchExpenses() {
    try {
      setError(null);
      const response = await fetch(`/api/expenses?month=${selectedMonth === 'all' ? '' : selectedMonth}&year=${selectedYear}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const data = await response.json();
      const groceryExpenses = data.filter((expense: Expense) => expense.isGrocery);
      setExpenses(groceryExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to load expenses. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load expenses. Please try again.",
        variant: "destructive",
      });
    }
  }

  const renderGroceryBudgetWidget = () => {
    const groceryData = budgetData.find(item => item.category === 'Grocery');
    if (!groceryData) return null;

    const percentage = (groceryData.total / groceryData.budget) * 100;
    const gradientClass = getColorForPercentage(percentage);
    const textColorClass = getTextColorForPercentage(percentage);

    return (
      <motion.div
        className="rounded-lg p-4 relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div 
          className={`absolute inset-0 bg-gradient-to-r ${gradientClass}`} 
          style={{ 
            width: `${Math.min(percentage, 100)}%`,
            transition: 'width 0.5s ease-in-out'
          }}
        />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                Grocery Budget
              </h3>
              <p className={`text-xs ${textColorClass}`}>
                ${groceryData.total.toFixed(2)} / ${groceryData.budget.toFixed(2)}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <p className={`text-sm font-bold ${textColorClass}`}>
                {percentage.toFixed(0)}%
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {percentage >= 100
              ? `$${(groceryData.total - groceryData.budget).toFixed(2)} over`
              : `$${(groceryData.budget - groceryData.total).toFixed(2)} left`}
          </p>
        </div>
      </motion.div>
    );
  };

  const getColorForPercentage = (percentage: number) => {
    if (percentage < 50) return "from-emerald-500/20 to-emerald-500/40";
    if (percentage < 75) return "from-amber-500/20 to-amber-500/40";
    if (percentage < 100) return "from-orange-500/20 to-orange-500/40";
    return "from-red-500/20 to-red-500/40";
  };

  const getTextColorForPercentage = (percentage: number) => {
    if (percentage < 50) return "text-emerald-700 dark:text-emerald-300";
    if (percentage < 75) return "text-amber-700 dark:text-amber-300";
    if (percentage < 100) return "text-orange-700 dark:text-orange-300";
    return "text-red-700 dark:text-red-300";
  };

  const filteredExpenses = expenses.filter(expense => {
    const searchLower = searchQuery.toLowerCase();
    return (
      expense.name.toLowerCase().includes(searchLower) ||
      expense.store.toLowerCase().includes(searchLower) ||
      expense.subCategory?.toLowerCase().includes(searchLower) ||
      expense.additionalDetails?.toLowerCase().includes(searchLower)
    );
  });

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
        body: JSON.stringify({ id: expenseToDelete.id, isGrocery: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

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

  // Add the renderExpenseCard function for mobile view
  const renderExpenseCard = (expense: Expense) => (
    <Card key={expense.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow mb-4">
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
    </Card>
  );

  // Add the expense list rendering
  const renderExpenseList = () => {
    if (filteredExpenses.length === 0) {
      return (
        <div className="text-center p-4">
          No grocery expenses found.
        </div>
      );
    }

    return (
      <div>
        {/* Desktop view */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Sub-category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Rate (kg)</TableHead>
                <TableHead>Rate (lb)</TableHead>
                <TableHead>Additional Details</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.date}</TableCell>
                  <TableCell>{expense.name}</TableCell>
                  <TableCell>${expense.price.toFixed(2)}</TableCell>
                  <TableCell>{expense.store}</TableCell>
                  <TableCell>{expense.subCategory}</TableCell>
                  <TableCell>{expense.quantity}</TableCell>
                  <TableCell>{expense.unit}</TableCell>
                  <TableCell>{expense.sellerRate}</TableCell>
                  <TableCell>{expense.sellerRateInLb}</TableCell>
                  <TableCell>{expense.additionalDetails}</TableCell>
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
            </TableBody>
          </Table>
        </div>

        {/* Mobile view */}
        <div className="md:hidden">
          {filteredExpenses.map((expense) => (
            <div key={expense.id}>
              {renderExpenseCard(expense)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md m-4">
          {error}
        </div>
      )}
      
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl sm:text-2xl">Grocery Expenses</CardTitle>
            <CardDescription>Track and manage your grocery expenses</CardDescription>
          </div>
          <Button 
            onClick={() => setIsGroceryModalOpen(true)}
            className="flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Add Grocery</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Budget Widget */}
        {renderGroceryBudgetWidget()}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
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

          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-[300px]"
          />
        </div>

        {/* Expenses List */}
        {renderExpenseList()}
      </CardContent>

      {/* Add Grocery Modal */}
      <ExpenseModal
        isOpen={isGroceryModalOpen}
        onClose={() => {
          setIsGroceryModalOpen(false);
          fetchExpenses();
        }}
        type="grocery"
        mode="create"
      />

      {/* Edit Modal */}
      <ExpenseModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingExpense(null);
          fetchExpenses();
        }}
        type="grocery"
        editData={editingExpense}
        mode="edit"
      />

      {/* Delete Confirmation Dialog */}
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
    </Card>
  );
}
