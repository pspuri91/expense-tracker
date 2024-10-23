"use client"

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/Overview"
import { ExpenseForm } from "@/components/ExpenseForm"
import { BudgetOverview } from "@/components/BudgetOverview"
import { GroceryTracker } from "@/components/GroceryTracker"
import { MonthlyExpenseTable } from "@/components/MonthlyExpenseTable"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("budget");

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <Tabs defaultValue="budget" onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-1 flex flex-wrap justify-start">
          <TabsTrigger value="budget" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white px-3 py-2">Budget</TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white px-3 py-2">Monthly</TabsTrigger>
          <TabsTrigger value="overview" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white px-3 py-2">Yearly Overview</TabsTrigger>
        </TabsList>
        <TabsContent value="budget">
          <BudgetOverview />
        </TabsContent>
        <TabsContent value="monthly">
          <MonthlyExpenseTable />
        </TabsContent>
        <TabsContent value="overview">
          <Overview />
        </TabsContent>
      </Tabs>
    </div>
  )
}
