"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pencil, Check, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedExpense, setEditedExpense] = useState<Expense | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth, selectedYear]);

  async function fetchExpenses() {
    try {
      console.log(`Fetching expenses for month: ${selectedMonth}, year: ${selectedYear}`);
      const response = await fetch(`/api/expenses?month=${selectedMonth}&year=${selectedYear}`);
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const data = await response.json();
      console.log('Fetched expenses:', data);
      // Sort expenses by date
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

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditedExpense({...expenses[index]});
  };

  const handleSave = async (index: number) => {
    if (!editedExpense) return;
    try {
      const response = await fetch('/api/expenses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editedExpense.id,
          values: {
            ...editedExpense,
            isGrocery: editedExpense.isGrocery
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update expense');
      }

      const updatedExpenses = [...expenses];
      updatedExpenses[index] = editedExpense;
      setExpenses(updatedExpenses);
      setEditingIndex(null);
      setEditedExpense(null);
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditedExpense(null);
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Monthly Expenses</CardTitle>
        <CardDescription>View your expenses for a specific month and year</CardDescription>
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
                expenses.map((expense, index) => (
                  <TableRow key={index}>
                    {editingIndex === index && editedExpense ? (
                      <>
                        <TableCell><Input type="date" value={editedExpense.date} onChange={(e) => setEditedExpense({...editedExpense, date: e.target.value})} /></TableCell>
                        <TableCell><Input value={editedExpense.name} onChange={(e) => setEditedExpense({...editedExpense, name: e.target.value})} /></TableCell>
                        <TableCell><Input value={editedExpense.category} onChange={(e) => setEditedExpense({...editedExpense, category: e.target.value})} /></TableCell>
                        <TableCell><Input type="number" value={editedExpense.price} onChange={(e) => setEditedExpense({...editedExpense, price: parseFloat(e.target.value)})} /></TableCell>
                        <TableCell><Input value={editedExpense.store} onChange={(e) => setEditedExpense({...editedExpense, store: e.target.value})} /></TableCell>
                        <TableCell><Input value={editedExpense.additionalDetails} onChange={(e) => setEditedExpense({...editedExpense, additionalDetails: e.target.value})} /></TableCell>
                        <TableCell><Checkbox checked={editedExpense.isLongTermBuy} onCheckedChange={(checked) => setEditedExpense({...editedExpense, isLongTermBuy: checked as boolean})} /></TableCell>
                        <TableCell><Input type="number" value={editedExpense.expectedDuration || ''} onChange={(e) => setEditedExpense({...editedExpense, expectedDuration: e.target.value ? parseInt(e.target.value) : null})} /></TableCell>
                        <TableCell><Input value={editedExpense.durationUnit || ''} onChange={(e) => setEditedExpense({...editedExpense, durationUnit: e.target.value})} /></TableCell>
                        <TableCell><Checkbox checked={editedExpense.isGrocery} onCheckedChange={(checked) => setEditedExpense({...editedExpense, isGrocery: checked as boolean})} /></TableCell>
                        {editedExpense.isGrocery && (
                          <>
                            <TableCell><Input type="number" value={editedExpense.quantity || ''} onChange={(e) => setEditedExpense({...editedExpense, quantity: e.target.value ? parseFloat(e.target.value) : undefined})} /></TableCell>
                            <TableCell><Input value={editedExpense.subCategory || ''} onChange={(e) => setEditedExpense({...editedExpense, subCategory: e.target.value})} /></TableCell>
                            <TableCell>
                              <Select value={editedExpense.unit} onValueChange={(value) => setEditedExpense({...editedExpense, unit: value})}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="per kg/per lb">per kg/per lb</SelectItem>
                                  <SelectItem value="each">each</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell><Input type="number" value={editedExpense.sellerRate || ''} onChange={(e) => setEditedExpense({...editedExpense, sellerRate: e.target.value ? parseFloat(e.target.value) : undefined})} /></TableCell>
                            <TableCell><Input type="number" value={editedExpense.sellerRateInLb || ''} onChange={(e) => setEditedExpense({...editedExpense, sellerRateInLb: e.target.value ? parseFloat(e.target.value) : undefined})} /></TableCell>
                          </>
                        )}
                        <TableCell>
                          <Button onClick={() => handleSave(index)} className="mr-2"><Check className="h-4 w-4" /></Button>
                          <Button onClick={handleCancel} variant="outline"><X className="h-4 w-4" /></Button>
                        </TableCell>
                      </>
                    ) : (
                      <>
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
                        {expense.isGrocery && (
                          <>
                            <TableCell>{expense.quantity}</TableCell>
                            <TableCell>{expense.subCategory}</TableCell>
                            <TableCell>{expense.unit}</TableCell>
                            <TableCell>{expense.sellerRate}</TableCell>
                            <TableCell>{expense.sellerRateInLb}</TableCell>
                          </>
                        )}
                        <TableCell>
                          <Button onClick={() => handleEdit(index)}><Pencil className="h-4 w-4" /></Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={17} className="text-center">No expenses found for this month and year.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
