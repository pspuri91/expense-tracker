import { NextResponse } from 'next/server';
import { readSpreadsheet, appendToSpreadsheet, updateSpreadsheetRow, getNextId } from '../../../lib/googleSheets';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const EXPENSE_RANGE = 'Expenses!A:L';  // Extended to include Unit column
const GROCERY_RANGE = 'Groceries!A:N';

export async function GET(request: Request) {
  if (!SPREADSHEET_ID) {
    return NextResponse.json({ error: 'Spreadsheet ID is not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  try {
    const expenseData = await readSpreadsheet(SPREADSHEET_ID, EXPENSE_RANGE) || [];
    const groceryData = await readSpreadsheet(SPREADSHEET_ID, GROCERY_RANGE) || [];
    
    const allExpenses = [
      ...(expenseData.slice(1) || []).map(row => ({
        id: row[0],
        date: row[1],
        name: row[2],
        category: row[3],
        price: parseFloat(row[4]),
        store: row[5],
        additionalDetails: row[6],
        isLongTermBuy: row[7] === 'Yes',
        expectedDuration: row[8] ? parseInt(row[8]) : null,
        durationUnit: row[9],
        isGrocery: row[10] === 'Yes',
        unit: row[11] || null,
      })),
      ...(groceryData.slice(1) || []).map(row => ({
        id: row[0],
        date: row[1],
        name: row[2],
        category: 'Grocery',
        price: parseFloat(row[3]),
        store: row[4],
        additionalDetails: row[5],
        isLongTermBuy: row[6] === 'Yes',
        expectedDuration: row[7] ? parseInt(row[7]) : null,
        durationUnit: row[8],
        quantity: row[9] ? parseFloat(row[9]) : null,
        subCategory: row[10],
        unit: row[11] || null,
        sellerRate: row[12] ? parseFloat(row[12]) : null,
        sellerRateInLb: row[13] ? parseFloat(row[13]) : null,
        isGrocery: true,
      }))
    ];

    if (month && year) {
      const filteredData = allExpenses.filter(expense => {
        const date = new Date(expense.date);
        // Use UTC to avoid timezone issues
        const expenseMonth = date.getUTCMonth();
        const expenseYear = date.getUTCFullYear();

        // Ensure the month and year match correctly
        return expenseMonth === parseInt(month) - 1 && expenseYear === parseInt(year);
      });
      return NextResponse.json(filteredData);
    }

    return NextResponse.json(allExpenses);
  } catch (error) {
    console.error('Failed to read from spreadsheet:', error);
    return NextResponse.json({ error: 'Failed to read from spreadsheet' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!SPREADSHEET_ID) {
    return NextResponse.json({ error: 'Spreadsheet ID is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { values } = body;
    
    if (!values || !Array.isArray(values) || values.length === 0) {
      throw new Error('Invalid or empty values received');
    }

    const isGrocery = values[0].isGrocery;
    const range = isGrocery ? GROCERY_RANGE : EXPENSE_RANGE;
    const nextId = await getNextId(SPREADSHEET_ID, isGrocery ? 'Groceries' : 'Expenses');

    const formattedValues = formatValues(values[0], nextId, isGrocery);

    await appendToSpreadsheet(SPREADSHEET_ID, range, [formattedValues]);

    return NextResponse.json({ message: 'Data appended successfully', id: nextId });
  } catch (error) {
    console.error('Failed to append to spreadsheet:', error);
    return NextResponse.json({ 
      error: 'Failed to append to spreadsheet', 
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!SPREADSHEET_ID) {
    return NextResponse.json({ error: 'Spreadsheet ID is not configured' }, { status: 500 });
  }

  try {
    const { id, values } = await request.json();
    const isGrocery = values.isGrocery;
    const range = isGrocery ? GROCERY_RANGE : EXPENSE_RANGE;

    // Find the row index for the given id
    const data = await readSpreadsheet(SPREADSHEET_ID, range) || [];
    // Update the findIndex to handle string IDs
    const rowIndex = data.findIndex((row: any[]) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const rowNumber = rowIndex + 1; // +1 because sheets are 1-indexed
    const updateRange = isGrocery ? `Groceries!A${rowNumber}:O${rowNumber}` : `Expenses!A${rowNumber}:K${rowNumber}`;

    // Pass the existing id to formatValues to preserve it
    const formattedValues = formatValues(values, id, isGrocery);
    await updateSpreadsheetRow(SPREADSHEET_ID, updateRange, formattedValues);

    return NextResponse.json({ message: 'Expense updated successfully' });
  } catch (error) {
    console.error('Failed to update expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

function formatValues(values: any, id: string | number, isGrocery: boolean) {
  // Ensure id remains as a string
  const idString = id.toString();
  
  if (isGrocery) {
    return [
      idString,  // Keep the original ID
      values.date || '',
      values.name || '',
      values.price?.toString() || '0',
      values.store || '',
      values.additionalDetails || '',
      values.isLongTermBuy ? 'Yes' : 'No',
      values.expectedDuration?.toString() || '',
      values.durationUnit || '',
      values.quantity?.toString() || '',
      values.subCategory || '',
      values.unit || '',
      values.sellerRate?.toString() || '',
      values.sellerRateInLb?.toString() || '',
      'Yes' // Is Grocery
    ];
  } else {
    return [
      idString,  // Keep the original ID
      values.date || '',
      values.name || '',
      values.category || '',
      values.price?.toString() || '0',
      values.store || '',
      values.additionalDetails || '',
      values.isLongTermBuy ? 'Yes' : 'No',
      values.expectedDuration?.toString() || '',
      values.durationUnit || '',
      'No' // Is Grocery
    ];
  }
}
