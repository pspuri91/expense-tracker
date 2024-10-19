"use client"

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/Overview"
import { RecentExpenses } from "@/components/RecentExpenses"
import { ExpenseForm } from "@/components/ExpenseForm"
import { BudgetOverview } from "@/components/BudgetOverview"
import { GroceryTracker } from "@/components/GroceryTracker"
import { MonthlyWeeklyExpenses } from "@/components/MonthlyWeeklyExpenses"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <Tabs defaultValue="overview" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="grocery">Grocery</TabsTrigger>
          <TabsTrigger value="monthly-weekly">Monthly/Weekly</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Overview />
          <RecentExpenses />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpenseForm />
        </TabsContent>
        <TabsContent value="budget">
          <BudgetOverview />
        </TabsContent>
        <TabsContent value="grocery">
          <GroceryTracker />
        </TabsContent>
        <TabsContent value="monthly-weekly">
          <MonthlyWeeklyExpenses />
        </TabsContent>
      </Tabs>
    </div>
  )
}