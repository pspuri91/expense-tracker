"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pencil, Plus } from "lucide-react"
import { ExpenseModal } from "./ExpenseModal"

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

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl sm:text-2xl">Monthly Expenses</CardTitle>
            <CardDescription>View your expenses for a specific month and year</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setIsGroceryModalOpen(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Grocery</span>
            </Button>
            <Button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Other</span>
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-4">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index + 1} value={(index + 1).toString()}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[180px]">
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
      <CardContent className="p-0">
        <div className="overflow-x-auto">
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
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>{expense.name}</TableCell>
                    <TableCell>{expense.category}</TableCell>
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
                      <Button onClick={() => handleEdit(expense)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={16} className="text-center">
                    No expenses found for this month and year.
                  </TableCell>
                </TableRow>
              )}
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
    </Card>
  );
}
