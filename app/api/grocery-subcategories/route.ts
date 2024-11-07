import { NextResponse } from 'next/server';
import { readSpreadsheet } from '../../../lib/googleSheets';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const GROCERY_RANGE = 'Groceries!A2:N'; // Adjust the range as necessary

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  if (!SPREADSHEET_ID) {
    return NextResponse.json({ error: 'Spreadsheet ID is not configured' }, { status: 500 });
  }

  try {
    const groceryData = await readSpreadsheet(SPREADSHEET_ID, GROCERY_RANGE) || [];
    const subCategoryTotals: Record<string, number> = {};

    groceryData.slice(1).forEach((row: any[]) => {
      const date = new Date(row[1]); // Adjust the index based on your sheet structure
      const subCategory = row[10]; // Adjust the index based on where the sub-category is located
      const price = parseFloat(row[3]); // Parse the price as a float

      // Check if the price is a valid number
      if (!isNaN(price)) {
        if (date.getMonth() + 1 === parseInt(month) && date.getFullYear() === parseInt(year)) {
          if (subCategory) {
            subCategoryTotals[subCategory] = (subCategoryTotals[subCategory] || 0) + price;
          }
        }
      }
    });

    return NextResponse.json(subCategoryTotals);
  } catch (error) {
    console.error('Failed to fetch grocery sub-category data:', error);
    return NextResponse.json({ error: 'Failed to fetch grocery sub-category data' }, { status: 500 });
  }
} 