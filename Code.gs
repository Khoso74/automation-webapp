/**
 * Freelancer Workflow Management System
 * Google Apps Script Web Application
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Create a new Google Apps Script project at script.google.com
 * 2. Paste this code into Code.gs
 * 3. Add the HTML files (dashboard.html, etc.) to the project
 * 4. Create a Google Sheet and get its ID
 * 5. Create a root Drive folder and get its ID
 * 6. Run the setupApplication() function once
 * 7. Deploy as a web app with execute permissions for "Anyone"
 * 
 * REQUIRED SCOPES:
 * - https://www.googleapis.com/auth/spreadsheets
 * - https://www.googleapis.com/auth/drive
 * - https://www.googleapis.com/auth/gmail.send
 * - https://www.googleapis.com/auth/script.webapp.deploy
 */

// Configuration Constants
const CONFIG = {
  SHEET_NAME: 'FreelancerDB', // Update with your Google Sheet name
  ROOT_FOLDER_NAME: 'FreelancerWorkflow', // Root Drive folder name
  EMAIL_TEMPLATE_FOLDER: 'EmailTemplates',
  PROPOSAL_TEMPLATE_FOLDER: 'ProposalTemplates',
  INVOICE_TEMPLATE_FOLDER: 'InvoiceTemplates'
};

// Sheet Tab Names
const SHEETS = {
  CLIENTS: 'Clients',
  PROPOSALS: 'Proposals', 
  PROJECTS: 'Projects',
  INVOICES: 'Invoices',
  TASKS: 'Tasks',
  LOGS: 'Logs',
  SETTINGS: 'Settings'
};

/**
 * Initial setup function - run this once after deployment
 */
function setupApplication() {
  try {
    console.log('Starting application setup...');
    
    // Create or get the main spreadsheet
    const sheet = getOrCreateSpreadsheet();
    
    // Create all required sheet tabs
    createSheetTabs(sheet);
    
    // Create Drive folder structure
    createDriveFolderStructure();
    
    // Initialize settings
    initializeSettings();
    
    // Create sample data
    createSampleData();
    
    console.log('Application setup completed successfully!');
    return 'Setup completed successfully!';
    
  } catch (error) {
    console.error('Setup failed:', error);
    throw new Error('Setup failed: ' + error.message);
  }
}

/**
 * Main web app entry point
 */
function doGet(e) {
  try {
    const page = e.parameter.page || 'dashboard';
    
    switch (page) {
      case 'proposal':
        return getProposalAcceptancePage(e.parameter.id);
      default:
        return getDashboard();
    }
  } catch (error) {
    console.error('doGet error:', error);
    return HtmlService.createHtmlOutput('Error loading page: ' + error.message);
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    const action = e.parameter.action;
    
    switch (action) {
      case 'acceptProposal':
        return acceptProposal(e.parameter.proposalId, e.parameter.clientSignature);
      default:
        return ContentService.createTextOutput('Invalid action');
    }
  } catch (error) {
    console.error('doPost error:', error);
    return ContentService.createTextOutput('Error: ' + error.message);
  }
}

/**
 * Get or create the main spreadsheet
 */
function getOrCreateSpreadsheet() {
  const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  
  if (sheetId) {
    try {
      return SpreadsheetApp.openById(sheetId);
    } catch (error) {
      console.log('Existing sheet not found, creating new one...');
    }
  }
  
  // Create new spreadsheet
  const sheet = SpreadsheetApp.create(CONFIG.SHEET_NAME);
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', sheet.getId());
  
  console.log('Created new spreadsheet with ID:', sheet.getId());
  return sheet;
}

/**
 * Create all required sheet tabs
 */
function createSheetTabs(spreadsheet) {
  const existingSheets = spreadsheet.getSheets().map(sheet => sheet.getName());
  
  // Create Clients sheet
  if (!existingSheets.includes(SHEETS.CLIENTS)) {
    const clientsSheet = spreadsheet.insertSheet(SHEETS.CLIENTS);
    clientsSheet.getRange(1, 1, 1, 8).setValues([[
      'Client ID', 'Company Name', 'Contact Name', 'Email', 'Phone', 
      'Address', 'Created Date', 'Status'
    ]]);
    clientsSheet.getRange(1, 1, 1, 8).setFontWeight('bold');
  }
  
  // Create Proposals sheet
  if (!existingSheets.includes(SHEETS.PROPOSALS)) {
    const proposalsSheet = spreadsheet.insertSheet(SHEETS.PROPOSALS);
    proposalsSheet.getRange(1, 1, 1, 12).setValues([[
      'Proposal ID', 'Client ID', 'Title', 'Description', 'Amount', 
      'Currency', 'Status', 'Created Date', 'Sent Date', 'Accepted Date',
      'PDF URL', 'Acceptance URL'
    ]]);
    proposalsSheet.getRange(1, 1, 1, 12).setFontWeight('bold');
  }
  
  // Create Projects sheet
  if (!existingSheets.includes(SHEETS.PROJECTS)) {
    const projectsSheet = spreadsheet.insertSheet(SHEETS.PROJECTS);
    projectsSheet.getRange(1, 1, 1, 10).setValues([[
      'Project ID', 'Proposal ID', 'Client ID', 'Title', 'Status',
      'Start Date', 'Due Date', 'Completion Date', 'Drive Folder ID', 'Notes'
    ]]);
    projectsSheet.getRange(1, 1, 1, 10).setFontWeight('bold');
  }
  
  // Create Invoices sheet
  if (!existingSheets.includes(SHEETS.INVOICES)) {
    const invoicesSheet = spreadsheet.insertSheet(SHEETS.INVOICES);
    invoicesSheet.getRange(1, 1, 1, 11).setValues([[
      'Invoice ID', 'Project ID', 'Client ID', 'Amount', 'Currency',
      'Issue Date', 'Due Date', 'Status', 'Payment Date', 'PDF URL', 'Payment Link'
    ]]);
    invoicesSheet.getRange(1, 1, 1, 11).setFontWeight('bold');
  }
  
  // Create Tasks sheet
  if (!existingSheets.includes(SHEETS.TASKS)) {
    const tasksSheet = spreadsheet.insertSheet(SHEETS.TASKS);
    tasksSheet.getRange(1, 1, 1, 8).setValues([[
      'Task ID', 'Project ID', 'Title', 'Description', 'Status',
      'Priority', 'Due Date', 'Completed Date'
    ]]);
    tasksSheet.getRange(1, 1, 1, 8).setFontWeight('bold');
  }
  
  // Create Logs sheet
  if (!existingSheets.includes(SHEETS.LOGS)) {
    const logsSheet = spreadsheet.insertSheet(SHEETS.LOGS);
    logsSheet.getRange(1, 1, 1, 5).setValues([[
      'Timestamp', 'Type', 'Description', 'Reference ID', 'Status'
    ]]);
    logsSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  }
  
  // Create Settings sheet
  if (!existingSheets.includes(SHEETS.SETTINGS)) {
    const settingsSheet = spreadsheet.insertSheet(SHEETS.SETTINGS);
    settingsSheet.getRange(1, 1, 1, 3).setValues([['Setting', 'Value', 'Description']]);
    settingsSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
  }
  
  // Delete default Sheet1 if it exists and is empty
  const sheet1 = spreadsheet.getSheetByName('Sheet1');
  if (sheet1 && sheet1.getLastRow() <= 1) {
    spreadsheet.deleteSheet(sheet1);
  }
}

/**
 * Create Drive folder structure
 */
function createDriveFolderStructure() {
  let rootFolder;
  const rootFolderId = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID');
  
  if (rootFolderId) {
    try {
      rootFolder = DriveApp.getFolderById(rootFolderId);
    } catch (error) {
      console.log('Existing root folder not found, creating new one...');
    }
  }
  
  if (!rootFolder) {
    rootFolder = DriveApp.createFolder(CONFIG.ROOT_FOLDER_NAME);
    PropertiesService.getScriptProperties().setProperty('ROOT_FOLDER_ID', rootFolder.getId());
  }
  
  // Create subfolders
  const subfolders = [
    'Clients',
    'Proposals', 
    'Projects',
    'Invoices',
    'Templates',
    'Templates/Proposals',
    'Templates/Invoices',
    'Templates/Emails'
  ];
  
  subfolders.forEach(folderPath => {
    createSubfolder(rootFolder, folderPath);
  });
  
  console.log('Drive folder structure created with root ID:', rootFolder.getId());
}

/**
 * Create subfolder if it doesn't exist
 */
function createSubfolder(parentFolder, path) {
  const parts = path.split('/');
  let currentFolder = parentFolder;
  
  for (const part of parts) {
    const existing = currentFolder.getFoldersByName(part);
    if (existing.hasNext()) {
      currentFolder = existing.next();
    } else {
      currentFolder = currentFolder.createFolder(part);
    }
  }
  
  return currentFolder;
}

/**
 * Initialize application settings
 */
function initializeSettings() {
  const spreadsheet = getOrCreateSpreadsheet();
  const settingsSheet = spreadsheet.getSheetByName(SHEETS.SETTINGS);
  
  const defaultSettings = [
    ['COMPANY_NAME', 'Your Freelance Business', 'Your company/business name'],
    ['COMPANY_EMAIL', 'your-email@gmail.com', 'Your business email address'],
    ['COMPANY_PHONE', '+1-234-567-8900', 'Your business phone number'],
    ['COMPANY_ADDRESS', '123 Business St, City, State 12345', 'Your business address'],
    ['DEFAULT_CURRENCY', 'USD', 'Default currency for proposals and invoices'],
    ['PAYPAL_ME_LINK', 'https://paypal.me/yourusername', 'Your PayPal.me payment link'],
    ['PAYMENT_TERMS_DAYS', '30', 'Default payment terms in days'],
    ['FOLLOW_UP_DAYS', '7', 'Days before sending follow-up emails'],
    ['REMINDER_DAYS', '3', 'Days before due date to send reminders']
  ];
  
  // Only add settings that don't already exist
  const existingSettings = settingsSheet.getRange(2, 1, settingsSheet.getLastRow() - 1, 1).getValues().flat();
  
  defaultSettings.forEach(setting => {
    if (!existingSettings.includes(setting[0])) {
      settingsSheet.appendRow(setting);
    }
  });
}

/**
 * Create sample data for testing
 */
function createSampleData() {
  const spreadsheet = getOrCreateSpreadsheet();
  
  // Add sample client
  const clientsSheet = spreadsheet.getSheetByName(SHEETS.CLIENTS);
  if (clientsSheet.getLastRow() <= 1) {
    clientsSheet.appendRow([
      'CLI001',
      'Acme Corporation',
      'John Smith',
      'john@acmecorp.com',
      '+1-555-0123',
      '456 Business Ave, Business City, BC 12345',
      new Date(),
      'Active'
    ]);
  }
}

/**
 * Utility function to get setting value
 */
function getSetting(settingName) {
  const spreadsheet = getOrCreateSpreadsheet();
  const settingsSheet = spreadsheet.getSheetByName(SHEETS.SETTINGS);
  const data = settingsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === settingName) {
      return data[i][1];
    }
  }
  return null;
}

/**
 * Utility function to set setting value
 */
function setSetting(settingName, value) {
  const spreadsheet = getOrCreateSpreadsheet();
  const settingsSheet = spreadsheet.getSheetByName(SHEETS.SETTINGS);
  const data = settingsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === settingName) {
      settingsSheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  
  // Setting doesn't exist, add it
  settingsSheet.appendRow([settingName, value, '']);
}

/**
 * Generate unique ID
 */
function generateId(prefix = '') {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return prefix + timestamp + random;
}

/**
 * Log activity
 */
function logActivity(type, description, referenceId = '', status = 'Success') {
  try {
    const spreadsheet = getOrCreateSpreadsheet();
    const logsSheet = spreadsheet.getSheetByName(SHEETS.LOGS);
    
    logsSheet.appendRow([
      new Date(),
      type,
      description,
      referenceId,
      status
    ]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

/**
 * Get dashboard HTML
 */
function getDashboard() {
  const template = HtmlService.createTemplateFromFile('dashboard');
  
  // Pass data to template
  template.stats = getDashboardStats();
  template.recentActivity = getRecentActivity();
  template.upcomingDeadlines = getUpcomingDeadlines();
  
  return template.evaluate()
    .setTitle('Freelancer Workflow Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Get dashboard statistics
 */
function getDashboardStats() {
  const spreadsheet = getOrCreateSpreadsheet();
  
  // Get proposal stats
  const proposalsSheet = spreadsheet.getSheetByName(SHEETS.PROPOSALS);
  const proposalData = proposalsSheet.getDataRange().getValues();
  
  // Get project stats
  const projectsSheet = spreadsheet.getSheetByName(SHEETS.PROJECTS);
  const projectData = projectsSheet.getDataRange().getValues();
  
  // Get invoice stats
  const invoicesSheet = spreadsheet.getSheetByName(SHEETS.INVOICES);
  const invoiceData = invoicesSheet.getDataRange().getValues();
  
  const stats = {
    totalProposals: proposalData.length - 1,
    pendingProposals: proposalData.filter(row => row[6] === 'Sent').length,
    activeProjects: projectData.filter(row => row[4] === 'In Progress').length,
    overdueInvoices: invoiceData.filter(row => {
      return row[7] === 'Sent' && new Date(row[6]) < new Date();
    }).length,
    totalRevenue: invoiceData.filter(row => row[7] === 'Paid')
      .reduce((sum, row) => sum + (parseFloat(row[3]) || 0), 0)
  };
  
  return stats;
}

/**
 * Get recent activity
 */
function getRecentActivity() {
  const spreadsheet = getOrCreateSpreadsheet();
  const logsSheet = spreadsheet.getSheetByName(SHEETS.LOGS);
  const data = logsSheet.getDataRange().getValues();
  
  // Get last 10 activities, skip header
  return data.slice(-10).reverse();
}

/**
 * Get upcoming deadlines
 */
function getUpcomingDeadlines() {
  const spreadsheet = getOrCreateSpreadsheet();
  const deadlines = [];
  
  // Check project due dates
  const projectsSheet = spreadsheet.getSheetByName(SHEETS.PROJECTS);
  const projectData = projectsSheet.getDataRange().getValues();
  
  for (let i = 1; i < projectData.length; i++) {
    const row = projectData[i];
    if (row[4] === 'In Progress' && row[6]) { // Status = In Progress and has due date
      const dueDate = new Date(row[6]);
      const daysUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 7 && daysUntilDue >= 0) {
        deadlines.push({
          type: 'Project',
          title: row[3],
          dueDate: dueDate,
          daysUntilDue: daysUntilDue
        });
      }
    }
  }
  
  // Check invoice due dates
  const invoicesSheet = spreadsheet.getSheetByName(SHEETS.INVOICES);
  const invoiceData = invoicesSheet.getDataRange().getValues();
  
  for (let i = 1; i < invoiceData.length; i++) {
    const row = invoiceData[i];
    if (row[7] === 'Sent' && row[6]) { // Status = Sent and has due date
      const dueDate = new Date(row[6]);
      const daysUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 7) {
        deadlines.push({
          type: 'Invoice',
          title: 'Invoice ' + row[0],
          dueDate: dueDate,
          daysUntilDue: daysUntilDue
        });
      }
    }
  }
  
  return deadlines.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

/**
 * Include other HTML files
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}