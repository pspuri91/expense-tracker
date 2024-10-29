"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { motion } from "framer-motion"

interface StoreExpense {
  store: string;
  total: number;
  percentage: number;
}

export function StoreExpenseVisual() {
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [storeData, setStoreData] = useState<StoreExpense[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FDB462', '#B3DE69'];

  useEffect(() => {
    fetchStoreData();
  }, [selectedMonth, selectedYear]);

  async function fetchStoreData() {
    try {
      setError(null);
      const response = await fetch(
        `/api/expenses?month=${selectedMonth === 'all' ? '' : selectedMonth}&year=${selectedYear}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const expenses = await response.json();
      
      // Process store data
      const storeMap = new Map<string, number>();
      let totalExpenses = 0;

      expenses.forEach((expense: any) => {
        if (expense.store) {
          const currentTotal = storeMap.get(expense.store) || 0;
          const amount = expense.price || 0;
          storeMap.set(expense.store, currentTotal + amount);
          totalExpenses += amount;
        }
      });

      // Convert to array and calculate percentages
      const processedData = Array.from(storeMap.entries())
        .map(([store, total]) => ({
          store,
          total,
          percentage: (total / totalExpenses) * 100
        }))
        .sort((a, b) => b.total - a.total);

      setStoreData(processedData);
    } catch (error) {
      console.error('Error fetching store data:', error);
      toast({
        title: "Error",
        description: "Failed to load store data. Please try again.",
        variant: "destructive",
      });
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
          <p className="font-bold">{payload[0].payload.store}</p>
          <p className="text-sm">Total: ${payload[0].value.toFixed(2)}</p>
          <p className="text-sm">Share: {payload[0].payload.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Store Expenses</CardTitle>
            <CardDescription>
              Spending distribution across stores for {selectedMonth === 'all' ? 'all months in' : months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[120px]">
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
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={storeData}
                  dataKey="total"
                  nameKey="store"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    value,
                    name
                  }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 25;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        className="text-xs"
                      >
                        {`${name} ($${value.toFixed(0)})`}
                      </text>
                    );
                  }}
                >
                  {storeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Store List with Details */}
          <div className="space-y-4">
            {storeData.map((store, index) => (
              <motion.div
                key={store.store}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{store.store}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {store.percentage.toFixed(1)}% of total spending
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${store.total.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${store.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
