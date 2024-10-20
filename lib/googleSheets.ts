import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function getAuthClient() {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  return new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
  });
}

export async function getGoogleSheetsInstance() {
  const auth = await getAuthClient();
  return google.sheets({ version: 'v4', auth });
}

export async function readSpreadsheet(spreadsheetId: string, range: string) {
  const sheets = await getGoogleSheetsInstance();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return response.data.values;
}

export async function writeToSpreadsheet(spreadsheetId: string, range: string, values: any[][]) {
  console.log('Writing to spreadsheet:', { spreadsheetId, range, values });
  try {
    const sheets = await getGoogleSheetsInstance();
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
    console.log('Spreadsheet update response:', response.data);
  } catch (error) {
    console.error('Error in writeToSpreadsheet:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

export async function appendToSpreadsheet(spreadsheetId: string, range: string, values: any[][]) {
  console.log('Appending to spreadsheet:', { spreadsheetId, range, values });
  try {
    const sheets = await getGoogleSheetsInstance();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
    console.log('Spreadsheet append response:', response.data);
  } catch (error) {
    console.error('Error in appendToSpreadsheet:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

export async function updateSpreadsheetRow(spreadsheetId: string, range: string, values: any[]) {
  console.log('Updating spreadsheet row:', { spreadsheetId, range, values });
  try {
    const sheets = await getGoogleSheetsInstance();
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });
    console.log('Spreadsheet update response:', response.data);
  } catch (error) {
    console.error('Error in updateSpreadsheetRow:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

export async function appendToGrocerySheet(spreadsheetId: string, values: any[][]) {
  console.log('Appending to grocery sheet:', { spreadsheetId, values });
  try {
    const sheets = await getGoogleSheetsInstance();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Groceries!A:M', // Adjust the range based on the number of columns
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
    console.log('Grocery sheet append response:', response.data);
  } catch (error) {
    console.error('Error in appendToGrocerySheet:', error);
    throw error;
  }
}

export async function updateGrocerySheetRow(spreadsheetId: string, range: string, values: any[]) {
  console.log('Updating grocery sheet row:', { spreadsheetId, range, values });
  try {
    const sheets = await getGoogleSheetsInstance();
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });
    console.log('Grocery sheet update response:', response.data);
  } catch (error) {
    console.error('Error in updateGrocerySheetRow:', error);
    throw error;
  }
}

export async function getNextId(spreadsheetId: string, sheetName: string) {
  const sheets = await getGoogleSheetsInstance();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:A`,
  });
  const values = response.data.values || [];
  return values.length + 1; // Assuming the first row is headers
}

// Add this function to the existing file
export async function readCategoryBudgets(spreadsheetId: string) {
  const sheets = await getGoogleSheetsInstance();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'CategoryWiseMaxBudget!A2:B', // Start from A2 to skip the header row
  });
  return response.data.values || [];
}

// Add this function to update a specific category budget
export async function updateCategoryBudget(spreadsheetId: string, category: string, budget: number) {
  const sheets = await getGoogleSheetsInstance();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'CategoryWiseMaxBudget!A:B',
  });
  const values = response.data.values;
  const rowIndex = values.findIndex(row => row[0] === category);
  if (rowIndex === -1) {
    throw new Error('Category not found');
  }
  const range = `CategoryWiseMaxBudget!B${rowIndex + 1}`; // +1 because sheets are 1-indexed
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[budget]] },
  });
}
