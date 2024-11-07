import { NextResponse } from 'next/server';
import { readSpreadsheet } from '../../../lib/googleSheets';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SUBCATEGORY_RANGE = 'Groceries!A2:N'; // Adjust the range as necessary

export async function GET(request: Request) {
  if (!SPREADSHEET_ID) {
    return NextResponse.json({ error: 'Spreadsheet ID is not configured' }, { status: 500 });
  }

  try {
    const groceryData = await readSpreadsheet(SPREADSHEET_ID, SUBCATEGORY_RANGE) || [];
    const subCategorySet = new Set<string>();

    groceryData.slice(1).forEach((row: any[]) => {
      const subCategory = row[10]; // Adjust the index based on where the sub-category is located
      if (subCategory) {
        subCategorySet.add(subCategory);
      }
    });

    return NextResponse.json(Array.from(subCategorySet));
  } catch (error) {
    console.error('Failed to fetch sub-categories:', error);
    return NextResponse.json({ error: 'Failed to fetch sub-categories' }, { status: 500 });
  }
} 