"use client"

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/Overview"
import { BudgetOverview } from "@/components/BudgetOverview"
import { MonthlyExpenseTable } from "@/components/MonthlyExpenseTable"
import { GroceryTab } from "@/components/GroceryTab"
import { StoreExpenseVisual } from "@/components/StoreExpenseVisual"
import { useToast } from "@/components/ui/use-toast"
import Cookies from 'js-cookie'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("grocery");
  const [showAllTabs, setShowAllTabs] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const hasFullAccess = Cookies.get('expenseTrackerAccess') === 'full';
    setShowAllTabs(hasFullAccess);
  }, []);

  const handleGroceryTabClick = () => {
    const currentTime = Date.now();
    
    if (currentTime - lastTapTime < 500) {
      const newCount = tapCount + 1;
      if (newCount >= 3) {
        Cookies.set('expenseTrackerAccess', 'full', { expires: 365 });
        setShowAllTabs(true);
        setTapCount(0);
        toast({
          title: "Full Access Unlocked! 🎉",
          description: "You now have access to all features of the Expense Tracker.",
          duration: 5000,
        });
      } else {
        setTapCount(newCount);
      }
    } else {
      setTapCount(1);
    }
    
    setLastTapTime(currentTime);
    setActiveTab("grocery");
  };

  const handleTabChange = (value: string) => {
    if (value === "grocery") {
      handleGroceryTabClick();
    } else {
      setActiveTab(value);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <Tabs defaultValue="grocery" value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-1 flex flex-wrap justify-start">
          <TabsTrigger 
            value="grocery" 
            className="data-[state=active]:bg-teal-500 data-[state=active]:text-white px-3 py-2"
            onClick={handleGroceryTabClick}
          >
            Grocery
          </TabsTrigger>

          {showAllTabs && (
            <>
              <TabsTrigger 
                value="budget" 
                className="data-[state=active]:bg-teal-500 data-[state=active]:text-white px-3 py-2"
              >
                Budget
              </TabsTrigger>
              <TabsTrigger 
                value="monthly" 
                className="data-[state=active]:bg-teal-500 data-[state=active]:text-white px-3 py-2"
              >
                Monthly
              </TabsTrigger>
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-teal-500 data-[state=active]:text-white px-3 py-2"
              >
                Yearly Overview
              </TabsTrigger>
              <TabsTrigger 
                value="store-expenses" 
                className="data-[state=active]:bg-teal-500 data-[state=active]:text-white px-3 py-2"
              >
                Store Expenses
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="grocery">
          <GroceryTab />
        </TabsContent>
        
        {showAllTabs && (
          <>
            <TabsContent value="budget">
              <BudgetOverview />
            </TabsContent>
            <TabsContent value="monthly">
              <MonthlyExpenseTable />
            </TabsContent>
            <TabsContent value="overview">
              <Overview />
            </TabsContent>
            <TabsContent value="store-expenses">
              <StoreExpenseVisual />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
