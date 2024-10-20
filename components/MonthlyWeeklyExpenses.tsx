"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const categories = ["Grocery", "Clothing", "Transport", "Utilities", "Miscellaneous"]
const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#a4de6c"]

const generateData = (period: 'monthly' | 'weekly') => { // Explicitly type period
  return Array.from({ length: period === 'monthly' ? 6 : 4 }, (_, i) => ({
    name: period === 'monthly' ? `Month ${i + 1}` : `Week ${i + 1}`,
    ...Object.fromEntries(categories.map(category => [
      category,
      Math.floor(Math.random() * 1000) + 500
    ])),
    total: 0
  })).map(item => ({
    ...item,
    total: Object.values(item).reduce((sum: number, val) => {
      if (typeof val === 'number') {
        return sum + val; // Add if val is a number
      }
      return sum; // Skip non-number values
    }, 0) // Initialize sum to 0
  }))
}

const monthlyData = generateData('monthly')
const weeklyData = generateData('weekly')

export function MonthlyWeeklyExpenses() {
  const [activeTab, setActiveTab] = useState("monthly")
  const [selectedCategories, setSelectedCategories] = useState(categories)

  const handleCategoryToggle = (category: string) => { // Explicitly type category as string
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const filteredData = (activeTab === "monthly" ? monthlyData : weeklyData).map(item => ({
    name: item.name,
    ...Object.fromEntries(selectedCategories.map(category => [category, item[category as keyof typeof item] as number])), // Cast to number
    total: selectedCategories.reduce((sum, category) => sum + (item[category as keyof typeof item] as number || 0), 0) // Cast to number
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly and Weekly Expenses</CardTitle>
        <CardDescription>View your expenses over time</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap gap-4 my-4">
            {categories.map((category, index) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => handleCategoryToggle(category)}
                />
                <Label htmlFor={category} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {category}
                </Label>
              </div>
            ))}
          </div>
          <TabsContent value="monthly">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={filteredData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {selectedCategories.map((category, index) => (
                  <Bar key={category} dataKey={category} stackId="a" fill={colors[index]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="weekly">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={filteredData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {selectedCategories.map((category, index) => (
                  <Bar key={category} dataKey={category} stackId="a" fill={colors[index]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
