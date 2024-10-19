"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const recentExpenses = [
  {
    id: "1",
    category: "Grocery",
    amount: 85.50,
    date: "2023-04-15",
    store: "Whole Foods"
  },
  {
    id: "2",
    category: "Clothing",
    amount: 120.00,
    date: "2023-04-12",
    store: "H&M"
  },
  {
    id: "3",
    category: "Transport",
    amount: 45.00,
    date: "2023-04-10",
    store: "Uber"
  },
  {
    id: "4",
    category: "Utilities",
    amount: 150.00,
    date: "2023-04-05",
    store: "Electric Company"
  },
  {
    id: "5",
    category: "Miscellaneous",
    amount: 30.00,
    date: "2023-04-02",
    store: "Amazon"
  }
]

export function RecentExpenses() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
        <CardDescription>Your most recent expenses across all categories.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Store</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.category}</TableCell>
                <TableCell>${expense.amount.toFixed(2)}</TableCell>
                <TableCell>{expense.date}</TableCell>
                <TableCell>{expense.store}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}