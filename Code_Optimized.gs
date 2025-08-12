/**
 * Freelancer Workflow Management System - OPTIMIZED VERSION
 * Google Apps Script Web Application
 * 
 * CONFIGURED FOR YOUR SPECIFIC GOOGLE SHEET & DRIVE FOLDER
 * Sheet ID: 1R1C4sXK550SHszOm4DOEUWQE1N0o84MfwFRljs9QGug
 * Drive Folder ID: 13kL2PLSdrB7eL7D3ErjHbURjcHJ35OtG
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Replace your Code.gs with this optimized version
 * 2. No need to run setupApplication() - uses your existing sheet and folder
 * 3. Deploy as web app
 * 4. Update settings in your Google Sheet's Settings tab
 */

// Your Specific Configuration
const CONFIG = {
  SHEET_ID: '1R1C4sXK550SHszOm4DOEUWQE1N0o84MfwFRljs9QGug', // Your Google Sheet ID
  ROOT_FOLDER_ID: '13kL2PLSdrB7eL7D3ErjHbURjcHJ35OtG', // Your Google Drive Folder ID
  SHEET_NAME: 'FreelancerDB',
  ROOT_FOLDER_NAME: 'FreelancerWorkflow'
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
 * OPTIMIZED: Setup function for your existing sheet and folder
 */
function setupApplicationOptimized() {
  try {
    console.log('Starting optimized setup with your existing resources...');
    
    // Use your existing spreadsheet
    const sheet = getSpreadsheet();
    
    // Create sheet tabs if they don't exist
    createSheetTabsOptimized(sheet);
    
    // Initialize settings if needed
    initializeSettings();
    
    // Verify folder structure in your Drive folder
    verifyFolderStructure();
    
    console.log('Optimized setup completed successfully!');
    return 'Optimized setup completed! Using your Google Sheet and Drive folder.';
    
  } catch (error) {
    console.error('Optimized setup failed:', error);
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
 * OPTIMIZED: Get your specific spreadsheet
 */
function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(CONFIG.SHEET_ID);
  } catch (error) {
    throw new Error(`Cannot access your Google Sheet. Please ensure the sheet ID ${CONFIG.SHEET_ID} is correct and you have edit permissions.`);
  }
}

/**
 * OPTIMIZED: Get your specific Drive folder
 */
function getRootFolder() {
  try {
    return DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
  } catch (error) {
    throw new Error(`Cannot access your Google Drive folder. Please ensure the folder ID ${CONFIG.ROOT_FOLDER_ID} is correct and you have edit permissions.`);
  }
}

/**
 * OPTIMIZED: Create sheet tabs only if they don't exist
 */
function createSheetTabsOptimized(spreadsheet) {
  const existingSheets = spreadsheet.getSheets().map(sheet => sheet.getName());
  
  // Create Clients sheet if needed
  if (!existingSheets.includes(SHEETS.CLIENTS)) {
    const clientsSheet = spreadsheet.insertSheet(SHEETS.CLIENTS);
    clientsSheet.getRange(1, 1, 1, 8).setValues([[
      'Client ID', 'Company Name', 'Contact Name', 'Email', 'Phone', 
      'Address', 'Created Date', 'Status'
    ]]);
    clientsSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
    console.log('Created Clients sheet');
  }
  
  // Create Proposals sheet if needed
  if (!existingSheets.includes(SHEETS.PROPOSALS)) {
    const proposalsSheet = spreadsheet.insertSheet(SHEETS.PROPOSALS);
    proposalsSheet.getRange(1, 1, 1, 12).setValues([[
      'Proposal ID', 'Client ID', 'Title', 'Description', 'Amount', 
      'Currency', 'Status', 'Created Date', 'Sent Date', 'Accepted Date',
      'PDF URL', 'Acceptance URL'
    ]]);
    proposalsSheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#34a853').setFontColor('white');
    console.log('Created Proposals sheet');
  }
  
  // Create Projects sheet if needed
  if (!existingSheets.includes(SHEETS.PROJECTS)) {
    const projectsSheet = spreadsheet.insertSheet(SHEETS.PROJECTS);
    projectsSheet.getRange(1, 1, 1, 10).setValues([[
      'Project ID', 'Proposal ID', 'Client ID', 'Title', 'Status',
      'Start Date', 'Due Date', 'Completion Date', 'Drive Folder ID', 'Notes'
    ]]);
    projectsSheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#fbbc04').setFontColor('white');
    console.log('Created Projects sheet');
  }
  
  // Create Invoices sheet if needed
  if (!existingSheets.includes(SHEETS.INVOICES)) {
    const invoicesSheet = spreadsheet.insertSheet(SHEETS.INVOICES);
    invoicesSheet.getRange(1, 1, 1, 11).setValues([[
      'Invoice ID', 'Project ID', 'Client ID', 'Amount', 'Currency',
      'Issue Date', 'Due Date', 'Status', 'Payment Date', 'PDF URL', 'Payment Link'
    ]]);
    invoicesSheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#ea4335').setFontColor('white');
    console.log('Created Invoices sheet');
  }
  
  // Create Tasks sheet if needed
  if (!existingSheets.includes(SHEETS.TASKS)) {
    const tasksSheet = spreadsheet.insertSheet(SHEETS.TASKS);
    tasksSheet.getRange(1, 1, 1, 8).setValues([[
      'Task ID', 'Project ID', 'Title', 'Description', 'Status',
      'Priority', 'Due Date', 'Completed Date'
    ]]);
    tasksSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#9c27b0').setFontColor('white');
    console.log('Created Tasks sheet');
  }
  
  // Create Logs sheet if needed
  if (!existingSheets.includes(SHEETS.LOGS)) {
    const logsSheet = spreadsheet.insertSheet(SHEETS.LOGS);
    logsSheet.getRange(1, 1, 1, 5).setValues([[
      'Timestamp', 'Type', 'Description', 'Reference ID', 'Status'
    ]]);
    logsSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#607d8b').setFontColor('white');
    console.log('Created Logs sheet');
  }
  
  // Create Settings sheet if needed
  if (!existingSheets.includes(SHEETS.SETTINGS)) {
    const settingsSheet = spreadsheet.insertSheet(SHEETS.SETTINGS);
    settingsSheet.getRange(1, 1, 1, 3).setValues([['Setting', 'Value', 'Description']]);
    settingsSheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#ff9800').setFontColor('white');
    console.log('Created Settings sheet');
  }
}

/**
 * OPTIMIZED: Verify folder structure in your Drive folder
 */
function verifyFolderStructure() {
  const rootFolder = getRootFolder();
  
  const requiredSubfolders = [
    'Clients',
    'Proposals', 
    'Projects',
    'Invoices',
    'Templates',
    'Templates/Proposals',
    'Templates/Invoices', 
    'Templates/Emails',
    'TimeTracking',
    'Expenses',
    'Contracts',
    'Backups'
  ];
  
  requiredSubfolders.forEach(folderPath => {
    createSubfolderIfNeeded(rootFolder, folderPath);
  });
  
  console.log('Verified folder structure in your Drive folder');
}

/**
 * OPTIMIZED: Create subfolder only if it doesn't exist
 */
function createSubfolderIfNeeded(parentFolder, path) {
  const parts = path.split('/');
  let currentFolder = parentFolder;
  
  for (const part of parts) {
    const existing = currentFolder.getFoldersByName(part);
    if (existing.hasNext()) {
      currentFolder = existing.next();
    } else {
      currentFolder = currentFolder.createFolder(part);
      console.log(`Created subfolder: ${part}`);
    }
  }
  
  return currentFolder;
}

/**
 * Create subfolder for tools data (used by FreelancerTools.gs)
 */
function createSubfolder(parentFolder, folderName) {
  const existing = parentFolder.getFoldersByName(folderName);
  if (existing.hasNext()) {
    return existing.next();
  } else {
    const newFolder = parentFolder.createFolder(folderName);
    console.log(`Created subfolder: ${folderName}`);
    return newFolder;
  }
}

/**
 * Initialize default settings - Updated for Pakistani market
 */
function initializeSettings() {
  try {
    const sheet = getSpreadsheet();
    const settingsSheet = sheet.getSheetByName('Settings');
    
    if (!settingsSheet) {
      throw new Error('Settings sheet not found');
    }
    
    const defaultSettings = [
      ['COMPANY_NAME', 'Your Freelance Business', 'Your company/business name'],
      ['COMPANY_EMAIL', 'your-email@gmail.com', 'Your business email address'],
      ['COMPANY_PHONE', '+92-300-1234567', 'Your business phone number (Pakistani format)'],
      ['COMPANY_ADDRESS', 'Your City, Pakistan', 'Your business address'],
      ['DEFAULT_CURRENCY', 'PKR', 'Default currency for proposals and invoices'],
      ['PAYPAL_ME_LINK', 'https://paypal.me/yourusername', 'Your PayPal.me payment link (optional)'],
      ['PAYMENT_TERMS_DAYS', '30', 'Default payment terms in days'],
      ['FOLLOW_UP_DAYS', '7', 'Days before sending follow-up emails'],
      ['REMINDER_DAYS', '3', 'Days before due date to send reminders'],
      ['JAZZCASH_NUMBER', '03XX-XXXXXXX', 'Your JazzCash mobile wallet number'],
      ['EASYPAISA_NUMBER', '03XX-XXXXXXX', 'Your EasyPaisa mobile wallet number'],
      ['BANK_DETAILS', 'Bank Name: Your Bank | Account Title: Your Name | Account Number: XXXXX', 'Your bank account details for direct transfer'],
      ['CURRENCY_SYMBOL', 'Rs.', 'Currency symbol for PKR'],
      ['TAX_RATE', '0', 'Default tax rate percentage (0 for no tax)'],
      ['BUSINESS_REGISTRATION', 'Your NTN/CNIC', 'Your business registration number']
    ];
    
    // Check existing settings to avoid duplicates
    const existingData = settingsSheet.getDataRange();
    let existingSettings = [];
    
    if (existingData && existingData.getNumRows() > 1) {
      const values = existingData.getValues();
      existingSettings = values.slice(1).map(row => row[0]); // Skip header, get setting names
    }
    
    // Add only new settings
    const newSettings = defaultSettings.filter(setting => !existingSettings.includes(setting[0]));
    
    if (newSettings.length > 0) {
      const lastRow = settingsSheet.getLastRow();
      const range = settingsSheet.getRange(lastRow + 1, 1, newSettings.length, 3);
      range.setValues(newSettings);
      
      console.log(`✅ Added ${newSettings.length} new settings for Pakistani market`);
    } else {
      console.log('✅ All Pakistani settings already exist');
    }
    
    logActivity('Settings', 'Initialized with Pakistani payment methods');
    
  } catch (error) {
    console.error('❌ Error initializing settings:', error);
    throw new Error('Failed to initialize settings: ' + error.message);
  }
}

/**
 * OPTIMIZED: Get setting value with caching
 */
function getSetting(settingName) {
  // Simple caching to reduce API calls
  if (!getSetting.cache) {
    getSetting.cache = {};
    getSetting.cacheTime = 0;
  }
  
  const now = Date.now();
  if (now - getSetting.cacheTime > 300000) { // Cache for 5 minutes
    getSetting.cache = {};
    getSetting.cacheTime = now;
  }
  
  if (getSetting.cache[settingName]) {
    return getSetting.cache[settingName];
  }
  
  const spreadsheet = getSpreadsheet();
  const settingsSheet = spreadsheet.getSheetByName(SHEETS.SETTINGS);
  const data = settingsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === settingName) {
      getSetting.cache[settingName] = data[i][1];
      return data[i][1];
    }
  }
  return null;
}

/**
 * Set setting value and clear cache
 */
function setSetting(settingName, value) {
  const spreadsheet = getSpreadsheet();
  const settingsSheet = spreadsheet.getSheetByName(SHEETS.SETTINGS);
  const data = settingsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === settingName) {
      settingsSheet.getRange(i + 1, 2).setValue(value);
      // Clear cache
      if (getSetting.cache) {
        getSetting.cache[settingName] = value;
      }
      return;
    }
  }
  
  // Setting doesn't exist, add it
  settingsSheet.appendRow([settingName, value, '']);
  if (getSetting.cache) {
    getSetting.cache[settingName] = value;
  }
}

/**
 * Generate unique ID with better randomness
 */
function generateId(prefix = '') {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return prefix + timestamp + random.toString().padStart(4, '0');
}

/**
 * OPTIMIZED: Log activity with batch writing
 */
function logActivity(type, description, referenceId = '', status = 'Success') {
  try {
    const spreadsheet = getSpreadsheet();
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
 * OPTIMIZED: Get dashboard statistics with better performance
 */
function getDashboardStats() {
  const spreadsheet = getSpreadsheet();
  
  try {
    // Get all data in one go for better performance
    const clientsData = spreadsheet.getSheetByName(SHEETS.CLIENTS).getDataRange().getValues();
    const proposalsData = spreadsheet.getSheetByName(SHEETS.PROPOSALS).getDataRange().getValues();
    const projectsData = spreadsheet.getSheetByName(SHEETS.PROJECTS).getDataRange().getValues();
    const invoicesData = spreadsheet.getSheetByName(SHEETS.INVOICES).getDataRange().getValues();
    
    // Calculate current month revenue (Pakistani format)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = invoicesData.slice(1)
      .filter(row => {
        const invoiceDate = new Date(row[8]); // CreatedDate column
        return row[7] === 'Paid' && 
               invoiceDate.getMonth() === currentMonth && 
               invoiceDate.getFullYear() === currentYear;
      })
      .reduce((sum, row) => sum + (parseFloat(row[3]) || 0), 0);
    
    const stats = {
      totalClients: Math.max(0, clientsData.length - 1),
      totalProposals: Math.max(0, proposalsData.length - 1),
      pendingProposals: proposalsData.slice(1).filter(row => row[6] === 'Sent').length,
      activeProjects: projectsData.slice(1).filter(row => row[4] === 'In Progress').length,
      overdueInvoices: invoicesData.slice(1).filter(row => {
        return row[7] === 'Sent' && new Date(row[6]) < new Date();
      }).length,
      monthlyRevenue: monthlyRevenue,
      totalRevenue: invoicesData.slice(1)
        .filter(row => row[7] === 'Paid')
        .reduce((sum, row) => sum + (parseFloat(row[3]) || 0), 0)
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return {
      totalClients: 0,
      totalProposals: 0,
      pendingProposals: 0,
      activeProjects: 0,
      overdueInvoices: 0,
      monthlyRevenue: 0,
      totalRevenue: 0
    };
  }
}

/**
 * Get recent activity
 */
function getRecentActivity() {
  try {
    const spreadsheet = getSpreadsheet();
    const logsSheet = spreadsheet.getSheetByName(SHEETS.LOGS);
    const data = logsSheet.getDataRange().getValues();
    
    // Get last 10 activities, skip header
    return data.length > 1 ? data.slice(-10).reverse() : [];
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}

/**
 * OPTIMIZED: Get upcoming deadlines with better date handling
 */
function getUpcomingDeadlines() {
  const spreadsheet = getSpreadsheet();
  const deadlines = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  
  try {
    // Check project due dates
    const projectsData = spreadsheet.getSheetByName(SHEETS.PROJECTS).getDataRange().getValues();
    
    for (let i = 1; i < projectsData.length; i++) {
      const row = projectsData[i];
      if (row[4] === 'In Progress' && row[6]) { // Status = In Progress and has due date
        const dueDate = new Date(row[6]);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 7 && daysUntilDue >= -3) { // Include slightly overdue items
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
    const invoicesData = spreadsheet.getSheetByName(SHEETS.INVOICES).getDataRange().getValues();
    
    for (let i = 1; i < invoicesData.length; i++) {
      const row = invoicesData[i];
      if (row[7] === 'Sent' && row[6]) { // Status = Sent and has due date
        const dueDate = new Date(row[6]);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
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
    
  } catch (error) {
    console.error('Error getting upcoming deadlines:', error);
    return [];
  }
}

/**
 * Include other HTML files
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * UTILITY: Get web app URL
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * UTILITY: Test your connections
 */
function testConnections() {
  try {
    console.log('Testing connections...');
    
    // Test spreadsheet
    const sheet = getSpreadsheet();
    console.log('✅ Spreadsheet connection successful:', sheet.getName());
    
    // Test Drive folder
    const folder = getRootFolder();
    console.log('✅ Drive folder connection successful:', folder.getName());
    
    // Test settings
    const companyName = getSetting('COMPANY_NAME');
    console.log('✅ Settings access successful. Company name:', companyName);
    
    console.log('🎉 All connections working perfectly!');
    return 'All connections successful!';
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return 'Connection test failed: ' + error.message;
  }
}