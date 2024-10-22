"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, LabelList } from 'recharts'
import { BudgetOverview } from "@/components/BudgetOverview"

type Expense = {
  id: string;
  date: string;
  name: string;
  category: string;
  price: number;
  isGrocery: boolean;
};

type MonthlyData = {
  month: string;
  total: number;
  [category: string]: number;
};

type CategoryData = {
  category: string;
  amount: number;
};

export function Overview() {
  const [yearlyData, setYearlyData] = useState<MonthlyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<CategoryData[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedMonthNumber, setSelectedMonthNumber] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchYearlyData(selectedYear);
  }, [selectedYear]);

  async function fetchCategories() {
    try {
      const response = await fetch('/api/budget');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data.budgetData.map((item: any) => item.category).filter((category: string) => category !== 'Total'));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function fetchYearlyData(year: number) {
    try {
      const response = await fetch(`/api/expenses?year=${year}`);
      if (!response.ok) {
        throw new Error('Failed to fetch yearly data');
      }
      const expenses: Expense[] = await response.json();
      const monthlyData = processYearlyData(expenses, year);
      setYearlyData(monthlyData);
    } catch (error) {
      console.error('Error fetching yearly data:', error);
    }
  }

  function processYearlyData(expenses: Expense[], year: number): MonthlyData[] {
    const monthlyData: { [key: string]: MonthlyData } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      if (expenseDate.getUTCFullYear() !== year) return;

      const monthKey = months[expenseDate.getUTCMonth()];
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, total: 0 };
        categories.forEach(category => {
          monthlyData[monthKey][category] = 0;
        });
      }
      const category = expense.isGrocery ? 'Grocery' : expense.category;
      const amount = parseFloat(expense.price.toString()) || 0;
      monthlyData[monthKey][category] = (monthlyData[monthKey][category] || 0) + amount;
      monthlyData[monthKey].total += amount;
    });

    return months.map(month => monthlyData[month] || { month, total: 0, ...Object.fromEntries(categories.map(cat => [cat, 0])) });
  }

  function handleMonthClick(data: MonthlyData) {
    setSelectedMonth(data.month);
    const monthNumber = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(data.month) + 1;
    setSelectedMonthNumber(monthNumber);
    const categoryData: CategoryData[] = categories.map(category => ({
      category,
      amount: data[category] || 0
    }));
    setMonthlyData(categoryData);
  }

  const colorScale = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", 
    "#F06292", "#AED581", "#7986CB", "#4DB6AC", "#FFD54F"
  ];

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#fff">
          {payload.category}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <text x={cx} y={cy - 20} textAnchor="middle" fill="#fff">
          ${value.toFixed(2)}
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle" fill="#fff">
          {(percent * 100).toFixed(2)}%
        </text>
      </g>
    );
  };

  const renderYearlyChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={yearlyData} onClick={(data) => handleMonthClick(data.activePayload?.[0]?.payload)}>
        <XAxis dataKey="month" stroke="#fff" />
        <YAxis stroke="#fff" />
        <Tooltip 
          contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '4px' }}
          labelStyle={{ color: '#fff' }}
          formatter={(value: any) => (isNaN(value) ? '0' : value.toFixed(2))}
        />
        <Legend wrapperStyle={{ color: '#fff' }} />
        {categories.map((category, index) => (
          <Bar key={category} dataKey={category} stackId="a" fill={colorScale[index % colorScale.length]}>
            {yearlyData.map((entry, index) => (
              <Cell key={`cell-${index}`} cursor="pointer" />
            ))}
          </Bar>
        ))}
        <LabelList dataKey="total" position="top" content={renderCustomBarLabel} />
      </BarChart>
    </ResponsiveContainer>
  )

  const renderMonthlyChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={monthlyData} layout="vertical">
        <XAxis type="number" stroke="#fff" />
        <YAxis dataKey="category" type="category" stroke="#fff" width={150} />
        <Tooltip 
          contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '4px' }}
          labelStyle={{ color: '#fff' }}
          formatter={(value: any) => (isNaN(value) ? '0' : value.toFixed(2))}
        />
        <Legend wrapperStyle={{ color: '#fff' }} />
        <Bar dataKey="amount" fill="#8884d8">
          {monthlyData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colorScale[index % colorScale.length]} />
          ))}
          <LabelList dataKey="amount" position="right" content={renderCustomLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )

  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (isNaN(value) || value === 0) return null;
    return (
      <text x={x + width + 5} y={y + height / 2} fill="#fff" textAnchor="start" dominantBaseline="middle">
        ${value.toFixed(2)}
      </text>
    );
  };

  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (isNaN(value) || value === 0) return null;
    return (
      <text 
        x={x + width / 2} 
        y={y - 10} 
        fill="#fff" 
        textAnchor="middle" 
        dominantBaseline="middle" 
        fontSize="12"
      >
        ${value.toFixed(2)}
      </text>
    );
  };

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Yearly Overview</CardTitle>
          <CardDescription className="text-gray-300">Total expenses by month for the selected year</CardDescription>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[180px] bg-gray-700 text-white border-gray-600">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return <SelectItem key={year} value={year.toString()}>{year}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {renderYearlyChart()}
        </CardContent>
      </Card>

      {selectedMonth && (
        <Card className="bg-gradient-to-br from-gray-800 to-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">{`${selectedMonth} ${selectedYear} Breakdown`}</CardTitle>
            <CardDescription className="text-gray-300">Expenses by category for the selected month</CardDescription>
          </CardHeader>
          <CardContent>
            {renderMonthlyChart()}
          </CardContent>
        </Card>
      )}

      {selectedMonthNumber && (
        <Card className="bg-gradient-to-br from-gray-700 to-gray-600">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">Budget Overview</CardTitle>
            <CardDescription className="text-gray-300">Budget status for {selectedMonth} {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetOverview selectedMonth={selectedMonthNumber} selectedYear={selectedYear} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
