import { NextResponse } from 'next/server';
import { readSpreadsheet } from '../../../lib/googleSheets';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const EXPENSE_RANGE = 'Expenses!A2:L';
const GROCERY_RANGE = 'Groceries!A2:N';

export async function GET(request: Request) {
  if (!SPREADSHEET_ID) {
    return NextResponse.json({ error: 'Spreadsheet ID is not configured' }, { status: 500 });
  }

  try {
    const expenseData = await readSpreadsheet(SPREADSHEET_ID, EXPENSE_RANGE) || [];
    const groceryData = await readSpreadsheet(SPREADSHEET_ID, GROCERY_RANGE) || [];

    const nameSet = new Set<string>();

    expenseData.slice(1).forEach((row: any[]) => {
      if (row[2]) nameSet.add(row[2]);
    });

    groceryData.slice(1).forEach((row: any[]) => {
      if (row[2]) nameSet.add(row[2]);
    });

    return NextResponse.json(Array.from(nameSet));
  } catch (error) {
    console.error('Failed to fetch names:', error);
    return NextResponse.json({ error: 'Failed to fetch names' }, { status: 500 });
  }
}
