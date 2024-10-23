import { NextResponse } from 'next/server';
import { readSpreadsheet, readCategoryBudgets, updateCategoryBudget } from '../../../lib/googleSheets';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const EXPENSE_RANGE = 'Expenses!A:K';
const GROCERY_RANGE = 'Groceries!A:N';

export async function GET(request: Request) {
  if (!SPREADSHEET_ID) {
    return NextResponse.json({ error: 'Spreadsheet ID is not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

  try {
    const expenseData = await readSpreadsheet(SPREADSHEET_ID, EXPENSE_RANGE) || [];
    const groceryData = await readSpreadsheet(SPREADSHEET_ID, GROCERY_RANGE) || [];
    const categoryBudgets = await readCategoryBudgets(SPREADSHEET_ID);

    const filteredExpenses = (expenseData.slice(1) || []).filter((row: any[]) => {
      const date = new Date(row[1]);
      return date.getUTCMonth() + 1 === month && date.getUTCFullYear() === year;
    });

    const filteredGroceries = (groceryData.slice(1) || []).filter((row: any[]) => {
      const date = new Date(row[1]);
      return date.getUTCMonth() + 1 === month && date.getUTCFullYear() === year;
    });

    let totalExpenses = 0;
    const budgetData = categoryBudgets.map(([category, budget]) => {
      const budgetValue = parseFloat(budget);
      let total = 0;
      if (category === "Grocery") {
        total = filteredGroceries.reduce((sum, row) => sum + parseFloat(row[3] || 0), 0);
      } else if (category !== 'Total') {
        total = filteredExpenses
          .filter(row => row[3] === category)
          .reduce((sum, row) => sum + parseFloat(row[4] || 0), 0);
      }
      if (category !== 'Total') {
        totalExpenses += total;
      }
      return { category, total, budget: budgetValue };
    });

    // Update the 'Total' category with the calculated total expenses
    const totalCategory = budgetData.find(item => item.category === 'Total');
    if (totalCategory) {
      totalCategory.total = totalExpenses;
    } else {
      budgetData.push({ category: 'Total', total: totalExpenses, budget: budgetData.reduce((sum, item) => sum + item.budget, 0) });
    }

    return NextResponse.json({ budgetData, totalExpenses });
  } catch (error) {
    console.error('Failed to fetch budget data:', error);
    return NextResponse.json({ error: 'Failed to fetch budget data' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!SPREADSHEET_ID) {
    return NextResponse.json({ error: 'Spreadsheet ID is not configured' }, { status: 500 });
  }

  try {
    const { category, budget } = await request.json();
    await updateCategoryBudget(SPREADSHEET_ID, category, budget);
    return NextResponse.json({ message: 'Budget updated successfully' });
  } catch (error) {
    console.error('Failed to update budget:', error);
    return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 });
  }
}
