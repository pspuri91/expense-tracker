"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit2, Check, X } from "lucide-react"
import { motion } from "framer-motion"

type BudgetCategory = {
  category: string;
  total: number;
  budget: number;
};

export function BudgetOverview() {
  const [budgetData, setBudgetData] = useState<BudgetCategory[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editedBudget, setEditedBudget] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetchBudgetData();
  }, [selectedMonth, selectedYear]);

  async function fetchBudgetData() {
    try {
      const response = await fetch(`/api/budget?month=${selectedMonth}&year=${selectedYear}`);
      if (!response.ok) {
        throw new Error('Failed to fetch budget data');
      }
      const data = await response.json();
      console.log('Fetched budget data:', data);
      setBudgetData(data.budgetData);
      setTotalExpenses(data.totalExpenses || 0);
    } catch (error) {
      console.error('Error fetching budget data:', error);
      setBudgetData([]);
      setTotalExpenses(0);
    }
  }

  const handleEdit = (category: string, budget: number) => {
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
    } catch (error) {
      console.error('Error updating budget:', error);
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

  const getGradientForPercentage = (percentage: number) => {
    if (percentage < 50) return "bg-gradient-to-r from-emerald-500/20 to-emerald-500/40";
    if (percentage < 75) return "bg-gradient-to-r from-amber-500/20 to-amber-500/40";
    if (percentage < 100) return "bg-gradient-to-r from-orange-500/20 to-orange-500/40";
    return "bg-gradient-to-r from-red-500/20 to-red-500/40";
  };

  const renderBudgetCategory = (category: BudgetCategory) => {
    const percentage = (category.total / category.budget) * 100;
    const gradientClass = getGradientForPercentage(percentage);
    const textColorClass = getTextColorForPercentage(percentage);

    return (
      <motion.div
        key={category.category}
        className="mb-2 rounded-lg p-2 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div 
          className={`absolute inset-0 ${gradientClass}`} 
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{category.category}</h3>
              <p className={`text-xs ${textColorClass}`}>
                ${category.total.toFixed(2)} / ${category.budget.toFixed(2)}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <Button 
                onClick={() => handleEdit(category.category, category.budget)} 
                size="sm" 
                className="h-6 w-6 p-0 bg-gray-700 hover:bg-gray-600 rounded-full mb-1"
              >
                <Edit2 className="h-3 w-3 text-white" />
              </Button>
              <p className={`text-sm font-bold ${textColorClass}`}>{percentage.toFixed(0)}%</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {percentage >= 100
              ? `$${(category.total - category.budget).toFixed(2)} over`
              : `$${(category.budget - category.total).toFixed(2)} left`}
          </p>
        </div>
        {editingCategory === category.category && (
          <div className="absolute inset-0 bg-gray-800 bg-opacity-90 flex items-center justify-center z-20">
            <div className="flex items-center">
              <Input
                type="number"
                value={editedBudget}
                onChange={(e) => setEditedBudget(Number(e.target.value))}
                className="w-20 h-8 text-xs mr-2 bg-white dark:bg-gray-700"
              />
              <Button onClick={handleSave} size="sm" className="h-8 px-2 mr-1 bg-green-500 hover:bg-green-600"><Check className="h-3 w-3" /></Button>
              <Button onClick={() => setEditingCategory(null)} size="sm" className="h-8 px-2" variant="outline"><X className="h-3 w-3" /></Button>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const totalCategory = budgetData.find(category => category.category === 'Total');
  const sortedCategories = budgetData
    .filter(category => category.category !== 'Total')
    .sort((a, b) => (b.total / b.budget) - (a.total / a.budget));

  return (
    <div className="space-y-2 bg-gray-100 dark:bg-gray-900 rounded-xl p-4">
      <div className="flex space-x-4 mb-4">
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
      {totalCategory && (
        <div className="mb-4">
          {renderBudgetCategory(totalCategory)}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {sortedCategories.map(renderBudgetCategory)}
      </div>
    </div>
  )
}
