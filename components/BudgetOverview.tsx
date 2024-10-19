"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const initialBudgetCategories = [
  { name: "Grocery", budget: 500, spent: 350 },
  { name: "Clothing", budget: 200, spent: 150 },
  { name: "Transport", budget: 300, spent: 280 },
  { name: "Utilities", budget: 400, spent: 380 },
  { name: "Miscellaneous", budget: 200, spent: 100 },
]

export function BudgetOverview() {
  const [budgetCategories, setBudgetCategories] = useState(initialBudgetCategories)
  const [totalBudget, setTotalBudget] = useState(
    initialBudgetCategories.reduce((sum, category) => sum + category.budget, 0)
  )

  const totalSpent = budgetCategories.reduce((sum, category) => sum + category.spent, 0)
  const overallProgress = (totalSpent / totalBudget) * 100

  const handleBudgetChange = (index, newBudget) => {
    const updatedCategories = [...budgetCategories]
    updatedCategories[index].budget = Number(newBudget)
    setBudgetCategories(updatedCategories)
    setTotalBudget(updatedCategories.reduce((sum, category) => sum + category.budget, 0))
  }

  const handleTotalBudgetChange = (newTotalBudget) => {
    const factor = newTotalBudget / totalBudget
    const updatedCategories = budgetCategories.map(category => ({
      ...category,
      budget: Math.round(category.budget * factor)
    }))
    setBudgetCategories(updatedCategories)
    setTotalBudget(Number(newTotalBudget))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
        <CardDescription>Track your spending against your budget</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div>
            <Label htmlFor="totalBudget">Total Budget</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="totalBudget"
                type="number"
                value={totalBudget}
                onChange={(e) => handleTotalBudgetChange(e.target.value)}
              />
              <Button onClick={() => handleTotalBudgetChange(totalBudget)}>Update</Button>
            </div>
            <Progress value={overallProgress} className="h-2 mt-2" />
            <p className="text-sm text-muted-foreground mt-2">
              ${totalSpent.toFixed(2)} / ${totalBudget.toFixed(2)}
            </p>
          </div>
          {budgetCategories.map((category, index) => (
            <div key={category.name}>
              <Label htmlFor={`budget-${category.name}`}>{category.name}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id={`budget-${category.name}`}
                  type="number"
                  value={category.budget}
                  onChange={(e) => handleBudgetChange(index, e.target.value)}
                />
                <Button onClick={() => handleBudgetChange(index, category.budget)}>Update</Button>
              </div>
              <Progress value={(category.spent / category.budget) * 100} className="h-2 mt-2" />
              <p className="text-sm text-muted-foreground mt-2">
                ${category.spent.toFixed(2)} / ${category.budget.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}