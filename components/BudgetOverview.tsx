"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit2, Check, X, Pencil, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExpenseModal } from "./ExpenseModal"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { Card } from "@/components/ui/card"

type BudgetCategory = {
  category: string;
  total: number;
  budget: number;
};

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

export function BudgetOverview() {
  const [budgetData, setBudgetData] = useState<BudgetCategory[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editedBudget, setEditedBudget] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgetData();
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
      setTotalExpenses(data.totalExpenses || 0);
    } catch (error) {
      console.error('Error fetching budget data:', error);
      setError('Failed to load budget data. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load budget data. Please try again.",
        variant: "destructive",
      });
      setBudgetData([]);
      setTotalExpenses(0);
    }
  }

  const handleBudgetEdit = (category: string, budget: number) => {
    setEditingCategory(category);
    setEditedBudget(budget);
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/budget', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: editingCategory, budget: editedBudget }),
      });

      if (!response.ok) {
        throw new Error('Failed to update budget');
      }

      await fetchBudgetData();
      setEditingCategory(null);
      toast({
        title: "Success",
        description: "Budget updated successfully",
      });
    } catch (error) {
      console.error('Error updating budget:', error);
      toast({
        title: "Error",
        description: "Failed to update budget. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCategoryClick = async (category: string) => {
    try {
      const response = await fetch(`/api/expenses?month=${selectedMonth}&year=${selectedYear}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const allExpenses = await response.json();
      
      let filtered: Expense[];
      if (category === 'Total') {
        filtered = allExpenses;
      } else if (category === 'Grocery') {
        filtered = allExpenses.filter((expense: Expense) => expense.isGrocery);
      } else {
        filtered = allExpenses.filter((expense: Expense) => 
          !expense.isGrocery && expense.category === category
        );
      }

      // Sort by date in descending order
      filtered.sort((a: Expense, b: Expense) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setFilteredExpenses(filtered);
      setSelectedCategory(category);
      setIsExpenseModalOpen(true);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
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

  const handleExpenseEdit = (expense: Expense) => {
    setEditingExpense({
      ...expense,
      category: expense.category, // Ensure this line is present
      isGrocery: expense.isGrocery || false,
      subCategory: expense.subCategory || '',
      quantity: expense.quantity || 0,
      unit: expense.unit || '',
      sellerRate: expense.sellerRate || 0,
      sellerRateInLb: expense.sellerRateInLb || 0,
    });
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
      handleCategoryClick(selectedCategory!);
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

      <div className="flex justify-end space-x-2 mt-2">
        <Button onClick={() => handleExpenseEdit(expense)} size="sm">
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

  const renderExpenseList = () => (
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
              {selectedCategory === 'Grocery' && (
                <>
                  <TableHead>Sub-category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                </>
              )}
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
                {selectedCategory === 'Grocery' && (
                  <>
                    <TableCell>{expense.subCategory}</TableCell>
                    <TableCell>{expense.quantity}</TableCell>
                    <TableCell>{expense.unit}</TableCell>
                  </>
                )}
                <TableCell>{expense.additionalDetails}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => handleExpenseEdit(expense)} 
                      size="sm" 
                      variant="outline"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => handleDelete(expense)} 
                      size="sm" 
                      variant="destructive"
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
        {filteredExpenses.map((expense) => renderExpenseCard(expense))}
      </div>
    </div>
  );

  const renderBudgetWidgets = () => {
    // Separate Total from other categories
    const totalWidget = budgetData.find(cat => cat.category === 'Total');
    const otherWidgets = budgetData
      .filter(cat => cat.category !== 'Total')
      // Sort by percentage in descending order
      .sort((a, b) => {
        const percentageA = (a.total / a.budget) * 100;
        const percentageB = (b.total / b.budget) * 100;
        return percentageB - percentageA;
      });

    return (
      <div className="space-y-4">
        {/* Total Widget - Full Width */}
        {totalWidget && (
          <div className="w-full">
            {renderBudgetWidget(totalWidget)}
          </div>
        )}

        {/* Other Category Widgets - Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherWidgets.map(category => renderBudgetWidget(category))}
        </div>
      </div>
    );
  };

  const renderBudgetWidget = (category: BudgetCategory) => {
    const percentage = (category.total / category.budget) * 100;
    const gradientClass = getColorForPercentage(percentage);
    const textColorClass = getTextColorForPercentage(percentage);
    
    return (
      <motion.div
        key={category.category}
        className="rounded-lg p-4 relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => handleCategoryClick(category.category)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Gradient Background */}
        <div 
          className={`absolute inset-0 bg-gradient-to-r ${gradientClass}`} 
          style={{ 
            width: `${Math.min(percentage, 100)}%`,
            transition: 'width 0.5s ease-in-out'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                {category.category}
              </h3>
              <p className={`text-xs ${textColorClass}`}>
                ${category.total.toFixed(2)} / ${category.budget.toFixed(2)}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleBudgetEdit(category.category, category.budget);
                }} 
                size="sm" 
                className="h-6 w-6 p-0 bg-gray-700 hover:bg-gray-600 rounded-full mb-1"
              >
                <Edit2 className="h-3 w-3 text-white" />
              </Button>
              <p className={`text-sm font-bold ${textColorClass}`}>
                {percentage.toFixed(0)}%
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {percentage >= 100
              ? `$${(category.total - category.budget).toFixed(2)} over`
              : `$${(category.budget - category.total).toFixed(2)} left`}
          </p>
        </div>

        {/* Edit Budget Overlay */}
        {editingCategory === category.category && (
          <div className="absolute inset-0 bg-gray-800 bg-opacity-90 flex items-center justify-center z-20">
            <div className="flex items-center" onClick={e => e.stopPropagation()}>
              <Input
                type="number"
                value={editedBudget}
                onChange={(e) => setEditedBudget(Number(e.target.value))}
                className="w-20 h-8 text-xs mr-2 bg-white dark:bg-gray-700"
              />
              <Button 
                onClick={handleSave} 
                size="sm" 
                className="h-8 px-2 mr-1 bg-green-500 hover:bg-green-600"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button 
                onClick={() => setEditingCategory(null)} 
                size="sm" 
                className="h-8 px-2" 
                variant="outline"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-4 bg-gray-100 dark:bg-gray-900 rounded-xl p-4">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      <div className="flex space-x-4">
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - i;
              return <SelectItem key={year} value={year.toString()}>{year}</SelectItem>;
            })}
          </SelectContent>
        </Select>
        <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
              <SelectItem key={index + 1} value={(index + 1).toString()}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {renderBudgetWidgets()}

      {/* Expense List Modal */}
      <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory} Expenses - {months[selectedMonth - 1]} {selectedYear}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {renderExpenseList()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <ExpenseModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingExpense(null);
          handleCategoryClick(selectedCategory!); // Refresh the list
        }}
        type={editingExpense?.isGrocery ? 'grocery' : 'other'}
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
    </div>
  );
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
