import { NextResponse } from 'next/server';
import { readSpreadsheet } from '../../../../lib/googleSheets';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const EXPENSE_RANGE = 'Expenses!A2:L';
const GROCERY_RANGE = 'Groceries!A2:N';

export async function GET(request: Request) {
  if (!SPREADSHEET_ID) {
    return NextResponse.json({ error: 'Spreadsheet ID is not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 });
  }

  try {
    const expenseData = await readSpreadsheet(SPREADSHEET_ID, EXPENSE_RANGE) || [];
    const groceryData = await readSpreadsheet(SPREADSHEET_ID, GROCERY_RANGE) || [];
    
    const allExpenses = [
      ...(expenseData.slice(1) || []).map((row: any[]) => ({
        id: row[0],
        date: row[1],
        name: row[2],
        category: row[3],
        price: parseFloat(row[4] || '0'),
        store: row[5],
        additionalDetails: row[6],
        isLongTermBuy: row[7] === 'Yes',
        expectedDuration: row[8] ? parseInt(row[8]) : null,
        durationUnit: row[9],
        isGrocery: row[10] === 'Yes',
        unit: row[11] || null,
      })),
      ...(groceryData.slice(1) || []).map((row: any[]) => ({
        id: row[0],
        date: row[1],
        name: row[2],
        price: parseFloat(row[3] || '0'),
        store: row[4],
        additionalDetails: row[5],
        isLongTermBuy: row[6] === 'Yes',
        expectedDuration: row[7] ? parseInt(row[7]) : null,
        durationUnit: row[8],
        quantity: row[9] ? parseFloat(row[9]) : null,
        subCategory: row[10],
        unit: row[11],
        sellerRate: row[12] ? parseFloat(row[12]) : null,
        sellerRateInLb: row[13] ? parseFloat(row[13]) : null,
        isGrocery: true,
        category: 'Grocery'
      }))
    ];

    const filteredExpenses = allExpenses.filter(expense => 
      expense.name.toLowerCase() === name.toLowerCase()
    );

    // Sort by date in descending order
    const sortedExpenses = filteredExpenses.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(sortedExpenses);
  } catch (error) {
    console.error('Failed to read from spreadsheet:', error);
    return NextResponse.json({ error: 'Failed to read from spreadsheet' }, { status: 500 });
  }
}

// Add OPTIONS method to handle preflight requests
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
