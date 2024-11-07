import { NextResponse } from 'next/server';
import { readSpreadsheet } from '../../../lib/googleSheets';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const GROCERY_RANGE = 'Groceries!A2:N'; // Adjust the range as necessary

export async function GET(request: Request) {
  if (!SPREADSHEET_ID) {
    return NextResponse.json({ error: 'Spreadsheet ID is not configured' }, { status: 500 });
  }

  try {
    const groceryData = await readSpreadsheet(SPREADSHEET_ID, GROCERY_RANGE) || [];
    const subCategoryNames = new Set<string>();

    groceryData.slice(1).forEach((row: any[]) => {
      if (row[10]) { // Adjust the index based on where the sub-category is located in your sheet
        subCategoryNames.add(row[10]);
      }
    });

    return NextResponse.json(Array.from(subCategoryNames));
  } catch (error) {
    console.error('Failed to fetch sub-category names:', error);
    return NextResponse.json({ error: 'Failed to fetch sub-category names' }, { status: 500 });
  }
} 