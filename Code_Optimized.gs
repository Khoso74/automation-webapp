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
 * UTILITY: Test your connections with detailed Drive folder verification
 */
function testConnections() {
  try {
    console.log('Testing connections...');
    
    // Test spreadsheet
    const sheet = getSpreadsheet();
    console.log('✅ Spreadsheet connection successful:', sheet.getName());
    
    // Test Drive folder with detailed info
    const folder = getRootFolder();
    console.log('✅ Drive folder connection successful:', folder.getName());
    console.log('📁 Drive folder ID:', folder.getId());
    console.log('🔗 Drive folder URL:', folder.getUrl());
    console.log('📂 Expected folder ID:', CONFIG.ROOT_FOLDER_ID);
    
    // Verify it's the correct folder
    if (folder.getId() === CONFIG.ROOT_FOLDER_ID) {
      console.log('✅ Correct folder confirmed!');
    } else {
      console.log('❌ WARNING: Folder ID mismatch!');
    }
    
    // Test settings
    const companyName = getSetting('COMPANY_NAME');
    console.log('✅ Settings access successful. Company name:', companyName);
    
    console.log('🎉 All connections working perfectly!');
    return `All connections successful!\nDrive Folder: ${folder.getName()}\nFolder ID: ${folder.getId()}\nFolder URL: ${folder.getUrl()}\nExpected ID: ${CONFIG.ROOT_FOLDER_ID}`;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return 'Connection test failed: ' + error.message;
  }
}

/**
 * UTILITY: Test PDF generation and verify Drive location
 */
function testPdfGeneration() {
  try {
    console.log('Testing PDF generation and Drive saving...');
    
    // Test contract generation with sample data
    const testContractData = {
      clientName: 'Test Client',
      clientCompany: 'Test Company Ltd',
      projectTitle: 'Test Project',
      projectDescription: 'This is a test project for PDF generation',
      amount: 50000,
      currency: 'PKR',
      startDate: '2024-01-15',
      endDate: '2024-02-15'
    };
    
    const result = generateContract(testContractData);
    
    if (result.success) {
      console.log('✅ PDF generated successfully');
      console.log('📄 File name:', result.fileName);
      console.log('🔗 File URL:', result.fileUrl);
      console.log('📁 File ID:', result.fileId);
      
      // Verify file is in correct folder
      const file = DriveApp.getFileById(result.fileId);
      const parentFolders = file.getParents();
      let folderPath = '';
      let isInCorrectFolder = false;
      
      while (parentFolders.hasNext()) {
        const parent = parentFolders.next();
        folderPath = parent.getName() + '/' + folderPath;
        console.log('📂 Parent folder:', parent.getName(), 'ID:', parent.getId());
        
        if (parent.getId() === CONFIG.ROOT_FOLDER_ID) {
          isInCorrectFolder = true;
        }
      }
      
      if (isInCorrectFolder) {
        console.log('✅ PDF saved in correct Drive folder!');
      } else {
        console.log('❌ WARNING: PDF not in expected folder!');
      }
      
      return `PDF Test Successful!\nFile: ${result.fileName}\nURL: ${result.fileUrl}\nFolder Path: ${folderPath}\nIn Correct Folder: ${isInCorrectFolder}`;
    } else {
      return `PDF Test Failed: ${result.error}`;
    }
    
  } catch (error) {
    console.error('❌ PDF test failed:', error);
    return 'PDF test failed: ' + error.message;
  }
}

/**
 * ===============================================
 * TESTING FUNCTIONS FOR APPS SCRIPT CONSOLE
 * Run these functions directly in Apps Script to test system
 * ===============================================
 */

/**
 * Test 1: Basic System Connectivity
 */
function testSystemConnectivity() {
  try {
    console.log('🧪 TESTING SYSTEM CONNECTIVITY...');
    
    // Test spreadsheet access
    const spreadsheet = getSpreadsheet();
    console.log('✅ Spreadsheet connected:', spreadsheet.getName());
    console.log('✅ Spreadsheet ID:', spreadsheet.getId());
    
    // Test Drive folder access
    const rootFolder = getRootFolder();
    console.log('✅ Drive folder connected:', rootFolder.getName());
    console.log('✅ Drive folder ID:', rootFolder.getId());
    
    // Test sheet tabs
    const sheets = spreadsheet.getSheets();
    const sheetNames = sheets.map(sheet => sheet.getName());
    console.log('✅ Available sheets:', sheetNames);
    
    // Test clients sheet specifically
    const clientsSheet = spreadsheet.getSheetByName(SHEETS.CLIENTS);
    if (clientsSheet) {
      const lastRow = clientsSheet.getLastRow();
      console.log(`✅ Clients sheet found with ${lastRow} rows`);
    } else {
      console.log('❌ Clients sheet not found');
    }
    
    return {
      success: true,
      spreadsheetName: spreadsheet.getName(),
      driveFolder: rootFolder.getName(),
      availableSheets: sheetNames,
      clientsSheetRows: clientsSheet ? clientsSheet.getLastRow() : 0,
      message: 'System connectivity test successful'
    };
    
  } catch (error) {
    console.error('❌ System connectivity test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'System connectivity test failed'
    };
  }
}

/**
 * Test 2: Client Data Retrieval
 */
function testClientDataRetrieval() {
  try {
    console.log('🧪 TESTING CLIENT DATA RETRIEVAL...');
    
    // Test getClientsForDropdown function
    console.log('Testing getClientsForDropdown...');
    const dropdownClients = getClientsForDropdown();
    console.log('✅ getClientsForDropdown result:', dropdownClients);
    
    // Test getAllClients function
    console.log('Testing getAllClients...');
    const allClients = getAllClients();
    console.log('✅ getAllClients result:', allClients);
    
    // Test getAllClientsSimple function
    console.log('Testing getAllClientsSimple...');
    const simpleClients = getAllClientsSimple();
    console.log('✅ getAllClientsSimple result:', simpleClients);
    
    return {
      success: true,
      dropdownClientsCount: dropdownClients ? dropdownClients.length : 0,
      allClientsCount: allClients ? allClients.length : 0,
      simpleClientsCount: simpleClients ? simpleClients.length : 0,
      sampleDropdownClient: dropdownClients && dropdownClients[0] ? dropdownClients[0] : null,
      message: 'Client data retrieval test successful'
    };
    
  } catch (error) {
    console.error('❌ Client data retrieval test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Client data retrieval test failed'
    };
  }
}

/**
 * Test 3: Proposal Dropdown Data
 */
function testProposalDropdownData() {
  try {
    console.log('🧪 TESTING PROPOSAL DROPDOWN DATA...');
    
    // Test the exact function used by proposal dropdown
    const clients = getClientsForDropdown();
    
    if (!clients || clients.length === 0) {
      console.log('❌ No clients found - checking sheet data...');
      
      const spreadsheet = getSpreadsheet();
      const clientsSheet = spreadsheet.getSheetByName(SHEETS.CLIENTS);
      const data = clientsSheet.getDataRange().getValues();
      
      console.log('Raw sheet data:', data);
      console.log('Headers:', data[0]);
      console.log('Data rows:', data.length - 1);
      
      return {
        success: false,
        clientsFound: 0,
        rawDataRows: data.length - 1,
        headers: data[0],
        message: 'No clients found in dropdown data'
      };
    }
    
    // Process clients for dropdown display
    const dropdownOptions = [];
    clients.forEach((client, index) => {
      const companyName = client.CompanyName || client.companyName || `Company ${index + 1}`;
      const clientId = client.ClientID || client.clientId || `CLI-${index + 1}`;
      const displayName = `${companyName} (${clientId})`;
      
      dropdownOptions.push({
        value: clientId,
        text: displayName,
        originalData: client
      });
    });
    
    console.log('✅ Processed dropdown options:', dropdownOptions);
    
    return {
      success: true,
      clientsFound: clients.length,
      dropdownOptions: dropdownOptions,
      sampleOption: dropdownOptions[0],
      message: `Successfully processed ${clients.length} clients for dropdown`
    };
    
  } catch (error) {
    console.error('❌ Proposal dropdown data test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Proposal dropdown data test failed'
    };
  }
}

/**
 * Test 4: Sheet Structure Validation
 */
function testSheetStructure() {
  try {
    console.log('🧪 TESTING SHEET STRUCTURE...');
    
    const spreadsheet = getSpreadsheet();
    const results = {};
    
    // Check each required sheet
    Object.keys(SHEETS).forEach(sheetKey => {
      const sheetName = SHEETS[sheetKey];
      const sheet = spreadsheet.getSheetByName(sheetName);
      
      if (sheet) {
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const dataRows = sheet.getLastRow() - 1;
        
        results[sheetName] = {
          exists: true,
          headers: headers,
          dataRows: dataRows
        };
        
        console.log(`✅ ${sheetName} sheet: ${dataRows} rows, Headers: ${headers}`);
      } else {
        results[sheetName] = {
          exists: false,
          headers: [],
          dataRows: 0
        };
        
        console.log(`❌ ${sheetName} sheet: NOT FOUND`);
      }
    });
    
    return {
      success: true,
      sheetResults: results,
      message: 'Sheet structure validation completed'
    };
    
  } catch (error) {
    console.error('❌ Sheet structure test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Sheet structure test failed'
    };
  }
}

/**
 * Test 5: Add Sample Client Data
 */
function addSampleClientData() {
  try {
    console.log('🧪 ADDING SAMPLE CLIENT DATA...');
    
    const spreadsheet = getSpreadsheet();
    const clientsSheet = spreadsheet.getSheetByName(SHEETS.CLIENTS);
    
    if (!clientsSheet) {
      throw new Error('Clients sheet not found');
    }
    
    // Sample client data
    const sampleClients = [
      ['CLI-001', 'ABC Corporation', 'John Smith', 'john@abc.com', '+92-300-1234567', 'Karachi, Pakistan', 'Active', new Date()],
      ['CLI-002', 'XYZ Solutions', 'Sarah Ahmed', 'sarah@xyz.com', '+92-301-7654321', 'Lahore, Pakistan', 'Active', new Date()],
      ['CLI-003', 'Tech Innovators', 'Ali Hassan', 'ali@techinnovators.com', '+92-302-9876543', 'Islamabad, Pakistan', 'Active', new Date()],
      ['CLI-004', 'Digital Agency', 'Fatima Khan', 'fatima@digital.com', '+92-303-1111111', 'Peshawar, Pakistan', 'Active', new Date()],
      ['CLI-005', 'Web Masters', 'Ahmed Ali', 'ahmed@webmasters.com', '+92-304-2222222', 'Multan, Pakistan', 'Active', new Date()]
    ];
    
    // Check if headers exist
    const lastRow = clientsSheet.getLastRow();
    if (lastRow === 0) {
      // Add headers first
      const headers = ['Client ID', 'Company Name', 'Contact Name', 'Email', 'Phone', 'Address', 'Status', 'Created Date'];
      clientsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      console.log('✅ Added headers to Clients sheet');
    }
    
    // Add sample data
    const startRow = clientsSheet.getLastRow() + 1;
    clientsSheet.getRange(startRow, 1, sampleClients.length, sampleClients[0].length).setValues(sampleClients);
    
    console.log(`✅ Added ${sampleClients.length} sample clients`);
    
    return {
      success: true,
      clientsAdded: sampleClients.length,
      startRow: startRow,
      message: `Successfully added ${sampleClients.length} sample clients`
    };
    
  } catch (error) {
    console.error('❌ Add sample client data failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Add sample client data failed'
    };
  }
}

/**
 * Test 6: Detailed Dropdown Data Analysis
 * Specifically for debugging why dropdown is not showing client data
 */
function testDropdownDataIssue() {
  try {
    console.log('🔍 DETAILED DROPDOWN DATA ANALYSIS...');
    console.log('=========================================');
    
    const results = {
      step1_sheetAccess: null,
      step2_rawData: null,
      step3_headerAnalysis: null,
      step4_dataValidation: null,
      step5_functionResults: null,
      step6_dropdownFormat: null,
      issues: [],
      solutions: []
    };
    
    // STEP 1: Basic Sheet Access
    console.log('\n🔍 STEP 1: Testing Sheet Access...');
    try {
      const spreadsheet = getSpreadsheet();
      const clientsSheet = spreadsheet.getSheetByName(SHEETS.CLIENTS);
      
      if (!clientsSheet) {
        results.issues.push('Clients sheet does not exist');
        results.solutions.push('Run setupApplicationOptimized() or create Clients sheet manually');
        throw new Error('Clients sheet not found');
      }
      
      results.step1_sheetAccess = {
        success: true,
        sheetName: clientsSheet.getName(),
        lastRow: clientsSheet.getLastRow(),
        lastColumn: clientsSheet.getLastColumn()
      };
      
      console.log(`✅ Sheet found: ${clientsSheet.getName()}`);
      console.log(`✅ Dimensions: ${clientsSheet.getLastRow()} rows x ${clientsSheet.getLastColumn()} columns`);
      
    } catch (error) {
      results.step1_sheetAccess = { success: false, error: error.message };
      console.error('❌ Sheet access failed:', error.message);
      return results;
    }
    
    // STEP 2: Raw Data Analysis
    console.log('\n🔍 STEP 2: Analyzing Raw Sheet Data...');
    try {
      const spreadsheet = getSpreadsheet();
      const clientsSheet = spreadsheet.getSheetByName(SHEETS.CLIENTS);
      const data = clientsSheet.getDataRange().getValues();
      
      results.step2_rawData = {
        totalRows: data.length,
        headers: data[0] || [],
        dataRows: data.length - 1,
        sampleDataRow: data[1] || null,
        allData: data
      };
      
      console.log(`✅ Total rows: ${data.length} (including header)`);
      console.log(`✅ Headers: [${data[0] ? data[0].join(', ') : 'No headers'}]`);
      console.log(`✅ Data rows: ${data.length - 1}`);
      
      if (data.length <= 1) {
        results.issues.push('No data rows found (only headers or empty sheet)');
        results.solutions.push('Add client data manually or run addSampleClientData()');
      }
      
      if (data[1]) {
        console.log(`✅ Sample data row: [${data[1].join(', ')}]`);
      } else {
        console.log('❌ No sample data row found');
      }
      
    } catch (error) {
      results.step2_rawData = { success: false, error: error.message };
      console.error('❌ Raw data analysis failed:', error.message);
    }
    
    // STEP 3: Header Analysis
    console.log('\n🔍 STEP 3: Analyzing Headers...');
    try {
      const headers = results.step2_rawData.headers;
      const headerAnalysis = {
        foundHeaders: headers,
        clientIdColumn: -1,
        companyNameColumn: -1,
        statusColumn: -1,
        headerMapping: {}
      };
      
      // Find column indices for important fields
      const clientIdVariations = ['Client ID', 'ClientID', 'ID', 'client_id'];
      const companyNameVariations = ['Company Name', 'CompanyName', 'Company', 'Name', 'company_name'];
      const statusVariations = ['Status', 'status'];
      
      headers.forEach((header, index) => {
        const cleanHeader = header.toString().toLowerCase().replace(/\s+/g, '');
        
        // Check for Client ID
        clientIdVariations.forEach(variation => {
          if (cleanHeader === variation.toLowerCase().replace(/\s+/g, '')) {
            headerAnalysis.clientIdColumn = index;
            headerAnalysis.headerMapping['ClientID'] = header;
          }
        });
        
        // Check for Company Name
        companyNameVariations.forEach(variation => {
          if (cleanHeader === variation.toLowerCase().replace(/\s+/g, '')) {
            headerAnalysis.companyNameColumn = index;
            headerAnalysis.headerMapping['CompanyName'] = header;
          }
        });
        
        // Check for Status
        statusVariations.forEach(variation => {
          if (cleanHeader === variation.toLowerCase().replace(/\s+/g, '')) {
            headerAnalysis.statusColumn = index;
            headerAnalysis.headerMapping['Status'] = header;
          }
        });
      });
      
      results.step3_headerAnalysis = headerAnalysis;
      
      console.log(`✅ Client ID found at column: ${headerAnalysis.clientIdColumn} (${headerAnalysis.headerMapping['ClientID'] || 'Not found'})`);
      console.log(`✅ Company Name found at column: ${headerAnalysis.companyNameColumn} (${headerAnalysis.headerMapping['CompanyName'] || 'Not found'})`);
      console.log(`✅ Status found at column: ${headerAnalysis.statusColumn} (${headerAnalysis.headerMapping['Status'] || 'Not found'})`);
      
      if (headerAnalysis.clientIdColumn === -1) {
        results.issues.push('Client ID column not found');
        results.solutions.push('Add "Client ID" or "ClientID" column header');
      }
      
      if (headerAnalysis.companyNameColumn === -1) {
        results.issues.push('Company Name column not found');
        results.solutions.push('Add "Company Name" or "CompanyName" column header');
      }
      
    } catch (error) {
      results.step3_headerAnalysis = { success: false, error: error.message };
      console.error('❌ Header analysis failed:', error.message);
    }
    
    // STEP 4: Data Validation
    console.log('\n🔍 STEP 4: Validating Data Rows...');
    try {
      const data = results.step2_rawData.allData;
      const headerAnalysis = results.step3_headerAnalysis;
      const validation = {
        totalDataRows: data.length - 1,
        validRows: 0,
        emptyRows: 0,
        activeClients: 0,
        inactiveClients: 0,
        rowDetails: []
      };
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rowDetail = {
          rowNumber: i,
          clientId: row[headerAnalysis.clientIdColumn] || '',
          companyName: row[headerAnalysis.companyNameColumn] || '',
          status: row[headerAnalysis.statusColumn] || '',
          isEmpty: !row[headerAnalysis.clientIdColumn] && !row[headerAnalysis.companyNameColumn],
          isActive: row[headerAnalysis.statusColumn] ? row[headerAnalysis.statusColumn].toString().toLowerCase() !== 'inactive' : true
        };
        
        validation.rowDetails.push(rowDetail);
        
        if (rowDetail.isEmpty) {
          validation.emptyRows++;
        } else {
          validation.validRows++;
          if (rowDetail.isActive) {
            validation.activeClients++;
          } else {
            validation.inactiveClients++;
          }
        }
        
        console.log(`Row ${i}: ID="${rowDetail.clientId}", Company="${rowDetail.companyName}", Status="${rowDetail.status}", Active=${rowDetail.isActive}`);
      }
      
      results.step4_dataValidation = validation;
      
      console.log(`✅ Total data rows: ${validation.totalDataRows}`);
      console.log(`✅ Valid rows: ${validation.validRows}`);
      console.log(`✅ Empty rows: ${validation.emptyRows}`);
      console.log(`✅ Active clients: ${validation.activeClients}`);
      console.log(`✅ Inactive clients: ${validation.inactiveClients}`);
      
      if (validation.activeClients === 0) {
        results.issues.push('No active clients found');
        results.solutions.push('Add client data with Status="Active" or leave Status blank');
      }
      
    } catch (error) {
      results.step4_dataValidation = { success: false, error: error.message };
      console.error('❌ Data validation failed:', error.message);
    }
    
    // STEP 5: Function Results Testing
    console.log('\n🔍 STEP 5: Testing All Client Functions...');
    try {
      const functionResults = {};
      
      // Test getClientsForDropdown
      try {
        functionResults.getClientsForDropdown = getClientsForDropdown();
        console.log(`✅ getClientsForDropdown(): ${functionResults.getClientsForDropdown ? functionResults.getClientsForDropdown.length : 0} clients`);
      } catch (error) {
        functionResults.getClientsForDropdown = { error: error.message };
        console.log(`❌ getClientsForDropdown() failed: ${error.message}`);
      }
      
      // Test getAllClients
      try {
        functionResults.getAllClients = getAllClients();
        console.log(`✅ getAllClients(): ${functionResults.getAllClients ? functionResults.getAllClients.length : 0} clients`);
      } catch (error) {
        functionResults.getAllClients = { error: error.message };
        console.log(`❌ getAllClients() failed: ${error.message}`);
      }
      
      // Test getAllClientsSimple
      try {
        functionResults.getAllClientsSimple = getAllClientsSimple();
        console.log(`✅ getAllClientsSimple(): ${functionResults.getAllClientsSimple ? functionResults.getAllClientsSimple.length : 0} clients`);
      } catch (error) {
        functionResults.getAllClientsSimple = { error: error.message };
        console.log(`❌ getAllClientsSimple() failed: ${error.message}`);
      }
      
      results.step5_functionResults = functionResults;
      
      // Check if any function returned data
      const hasData = Object.values(functionResults).some(result => result && Array.isArray(result) && result.length > 0);
      if (!hasData) {
        results.issues.push('All client functions returned empty or null');
        results.solutions.push('Check sheet data and column headers');
      }
      
    } catch (error) {
      results.step5_functionResults = { success: false, error: error.message };
      console.error('❌ Function testing failed:', error.message);
    }
    
    // STEP 6: Dropdown Format Testing
    console.log('\n🔍 STEP 6: Testing Dropdown Format...');
    try {
      const clients = results.step5_functionResults.getClientsForDropdown;
      
      if (clients && Array.isArray(clients) && clients.length > 0) {
        const dropdownOptions = clients.map((client, index) => {
          const companyName = client.CompanyName || client.companyName || client['Company Name'] || `Company ${index + 1}`;
          const clientId = client.ClientID || client.clientId || client['Client ID'] || `CLI-${index + 1}`;
          
          return {
            value: clientId,
            text: `${companyName} (${clientId})`,
            originalClient: client
          };
        });
        
        results.step6_dropdownFormat = dropdownOptions;
        
        console.log('✅ Dropdown options generated:');
        dropdownOptions.forEach((option, index) => {
          console.log(`   ${index + 1}. Value: "${option.value}", Text: "${option.text}"`);
        });
        
      } else {
        results.step6_dropdownFormat = [];
        results.issues.push('No clients available for dropdown formatting');
        console.log('❌ No clients available for dropdown formatting');
      }
      
    } catch (error) {
      results.step6_dropdownFormat = { success: false, error: error.message };
      console.error('❌ Dropdown format testing failed:', error.message);
    }
    
    // FINAL SUMMARY
    console.log('\n=========================================');
    console.log('🏁 DROPDOWN ANALYSIS COMPLETE');
    console.log('=========================================');
    
    if (results.issues.length === 0) {
      console.log('🎉 NO ISSUES FOUND - Dropdown should work correctly!');
    } else {
      console.log(`⚠️  FOUND ${results.issues.length} ISSUES:`);
      results.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      
      console.log('\n💡 SUGGESTED SOLUTIONS:');
      results.solutions.forEach((solution, index) => {
        console.log(`   ${index + 1}. ${solution}`);
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Dropdown analysis failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Dropdown analysis failed'
    };
  }
}

/**
 * Test Proposal PDF Drive Integration
 */
function testProposalPDFIntegration() {
  try {
    console.log('🧪 TESTING PROPOSAL PDF DRIVE INTEGRATION...');
    
    // Test data
    const testProposalData = {
      proposalId: 'PROP-TEST-001',
      clientId: 'CLI17549788052741908',
      clientName: 'visa elite',
      title: 'Website Development Project',
      description: 'Complete website redesign and development',
      amount: 50000,
      currency: 'PKR'
    };
    
    console.log('Test proposal data:', testProposalData);
    
    // Test client folder finding
    console.log('\n🔍 Testing client folder access...');
    const clientFolderResult = getClientProposalsFolder(testProposalData.clientId, testProposalData.clientName);
    
    if (clientFolderResult.success) {
      console.log('✅ Client folder structure:');
      console.log(`   Client Folder: ${clientFolderResult.clientFolderName}`);
      console.log(`   Client Folder ID: ${clientFolderResult.clientFolderId}`);
      console.log(`   Proposals Folder: ${clientFolderResult.proposalsFolderName}`);
      console.log(`   Proposals Folder ID: ${clientFolderResult.proposalsFolderId}`);
      console.log(`   Client Folder URL: ${clientFolderResult.clientFolderUrl}`);
      console.log(`   Proposals Folder URL: ${clientFolderResult.proposalsFolderUrl}`);
      
      return {
        success: true,
        message: 'Client folder structure working correctly',
        clientFolder: clientFolderResult,
        testData: testProposalData
      };
    } else {
      console.log('❌ Client folder test failed:', clientFolderResult.error);
      return {
        success: false,
        error: clientFolderResult.error,
        message: 'Client folder structure test failed'
      };
    }
    
  } catch (error) {
    console.error('❌ Proposal PDF integration test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Proposal PDF integration test failed'
    };
  }
}

/**
 * Quick Test - Just for Missing Function
 */
function testMissingFunction() {
  try {
    console.log('🧪 TESTING MISSING FUNCTION FIX...');
    
    // Test the function that was missing
    console.log('Testing getClientsForDropdown...');
    const dropdownClients = getClientsForDropdown();
    
    console.log('✅ getClientsForDropdown result:', dropdownClients);
    console.log(`✅ Found ${dropdownClients ? dropdownClients.length : 0} clients`);
    
    if (dropdownClients && dropdownClients.length > 0) {
      console.log('✅ Sample client:', dropdownClients[0]);
      
      // Test dropdown format
      const dropdownOptions = dropdownClients.map(client => {
        const displayName = `${client.CompanyName} (${client.ClientID})`;
        return {
          value: client.ClientID,
          text: displayName
        };
      });
      
      console.log('✅ Dropdown options:');
      dropdownOptions.forEach((option, index) => {
        console.log(`   ${index + 1}. "${option.text}"`);
      });
      
      return {
        success: true,
        clientsFound: dropdownClients.length,
        dropdownOptions: dropdownOptions,
        message: 'Function fix successful!'
      };
    } else {
      return {
        success: false,
        message: 'Function exists but returns no data'
      };
    }
    
  } catch (error) {
    console.error('❌ Missing function test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Function fix failed'
    };
  }
}

/**
 * Master Test Function - Run All Tests
 */
function runAllTests() {
  console.log('🚀 RUNNING ALL SYSTEM TESTS...');
  console.log('==========================================');
  
  const results = {};
  
  // Test 1: System Connectivity
  console.log('\n1. Testing System Connectivity...');
  results.connectivity = testSystemConnectivity();
  
  // Test 2: Client Data Retrieval
  console.log('\n2. Testing Client Data Retrieval...');
  results.clientData = testClientDataRetrieval();
  
  // Test 3: Proposal Dropdown Data
  console.log('\n3. Testing Proposal Dropdown Data...');
  results.proposalDropdown = testProposalDropdownData();
  
  // Test 4: Sheet Structure
  console.log('\n4. Testing Sheet Structure...');
  results.sheetStructure = testSheetStructure();
  
  // Test 5: Detailed Dropdown Analysis
  console.log('\n5. Testing Dropdown Data Issue...');
  results.dropdownAnalysis = testDropdownDataIssue();
  
  // Test 6: Client Folder Structure Debug
  console.log('\n6. Debugging Client Folder Structure...');
  results.folderStructure = debugClientFolderStructure();
  
  // Test 7: Specific Client Folder Finding
  console.log('\n7. Testing Specific Client Folder Finding...');
  results.clientFolderFinding = testSpecificClientFolder();
  
  console.log('\n==========================================');
  console.log('🏁 ALL TESTS COMPLETED');
  console.log('==========================================');
  
  // Summary
  const passedTests = Object.values(results).filter(result => result && result.success !== false).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED - System is working correctly!');
  } else {
    console.log('⚠️ Some tests failed - Check individual test results above');
  }
  
  return {
    testResults: results,
    summary: {
      passed: passedTests,
      total: totalTests,
      allPassed: passedTests === totalTests
    }
  };
}

/**
 * Debug Client Folder Structure - Check what exists in Drive
 */
function debugClientFolderStructure() {
  try {
    console.log('🔍 DEBUGGING CLIENT FOLDER STRUCTURE...');
    console.log('==========================================');
    
    const rootFolder = getRootFolder();
    console.log(`✅ Root folder: ${rootFolder.getName()} (ID: ${rootFolder.getId()})`);
    console.log(`✅ Root folder URL: ${rootFolder.getUrl()}`);
    
    // Check if Clients folder exists
    const clientsFolders = rootFolder.getFoldersByName('Clients');
    if (!clientsFolders.hasNext()) {
      console.log('❌ No "Clients" folder found in root directory');
      
      // List all folders in root to see what's there
      console.log('\n📁 Folders in root directory:');
      const rootSubfolders = rootFolder.getFolders();
      let count = 0;
      while (rootSubfolders.hasNext() && count < 20) {
        const folder = rootSubfolders.next();
        console.log(`   📁 ${folder.getName()} (ID: ${folder.getId()})`);
        count++;
      }
      
      return {
        success: false,
        error: 'Clients folder not found',
        rootFolderId: rootFolder.getId(),
        rootFolderName: rootFolder.getName()
      };
    }
    
    const clientsFolder = clientsFolders.next();
    console.log(`✅ Clients folder found: ${clientsFolder.getName()} (ID: ${clientsFolder.getId()})`);
    
    // List all client folders
    console.log('\n👥 Client folders found:');
    const clientSubfolders = clientsFolder.getFolders();
    const clientFolders = [];
    let count = 0;
    
    while (clientSubfolders.hasNext() && count < 50) {
      const folder = clientSubfolders.next();
      const folderInfo = {
        name: folder.getName(),
        id: folder.getId(),
        url: folder.getUrl()
      };
      
      console.log(`   📁 ${folderInfo.name} (ID: ${folderInfo.id})`);
      
      // Check subfolders in each client folder
      const subfolders = folder.getFolders();
      const subfolderNames = [];
      while (subfolders.hasNext()) {
        subfolderNames.push(subfolders.next().getName());
      }
      
      if (subfolderNames.length > 0) {
        console.log(`      📂 Subfolders: ${subfolderNames.join(', ')}`);
        folderInfo.subfolders = subfolderNames;
      } else {
        console.log(`      📂 No subfolders found`);
        folderInfo.subfolders = [];
      }
      
      clientFolders.push(folderInfo);
      count++;
    }
    
    return {
      success: true,
      rootFolder: {
        name: rootFolder.getName(),
        id: rootFolder.getId(),
        url: rootFolder.getUrl()
      },
      clientsFolder: {
        name: clientsFolder.getName(),
        id: clientsFolder.getId(),
        url: clientsFolder.getUrl()
      },
      clientFolders: clientFolders,
      totalClientFolders: clientFolders.length
    };
    
  } catch (error) {
    console.error('❌ Error debugging client folder structure:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Test Specific Client Folder Finding
 */
function testSpecificClientFolder() {
  try {
    console.log('🧪 TESTING SPECIFIC CLIENT FOLDER FINDING...');
    
    // Get a real client from the database
    const clients = getAllClients();
    console.log(`Found ${clients.length} clients in database`);
    
    if (clients.length === 0) {
      return {
        success: false,
        error: 'No clients found in database'
      };
    }
    
    // Test with first client
    const testClient = clients[0];
    console.log(`Testing with client: ${testClient.CompanyName} (${testClient.ClientID})`);
    
    // Test the actual function that's being used
    const result = getClientProposalsFolder(testClient.ClientID, testClient.CompanyName);
    
    console.log('Folder finding result:', result);
    
    return {
      success: true,
      testClient: testClient,
      folderResult: result
    };
    
  } catch (error) {
    console.error('❌ Error testing specific client folder:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Force Create Missing Client Folders
 */
function forceCreateClientFolders() {
  try {
    console.log('🔧 FORCE CREATING CLIENT FOLDERS...');
    
    const clients = getAllClients();
    console.log(`Found ${clients.length} clients to process`);
    
    if (clients.length === 0) {
      return {
        success: false,
        error: 'No clients found'
      };
    }
    
    const results = [];
    
    for (let client of clients) {
      console.log(`\n🔄 Processing client: ${client.CompanyName} (${client.ClientID})`);
      
      try {
        const folderResult = createClientFolderOptimized(client.ClientID, client.CompanyName);
        console.log(`✅ Folder result for ${client.CompanyName}:`, folderResult);
        
        results.push({
          client: client,
          folder: folderResult,
          success: true
        });
        
      } catch (error) {
        console.error(`❌ Failed to create folder for ${client.CompanyName}:`, error);
        results.push({
          client: client,
          error: error.message,
          success: false
        });
      }
    }
    
    return {
      success: true,
      processed: results.length,
      results: results
    };
    
  } catch (error) {
    console.error('❌ Error force creating client folders:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test Real Proposal Creation Process
 */
function testRealProposalCreation() {
  try {
    console.log('🧪 === TESTING REAL PROPOSAL CREATION PROCESS ===');
    
    // Get first client for testing
    const clients = getAllClients();
    if (!clients || clients.length === 0) {
      return {
        success: false,
        error: 'No clients found for testing'
      };
    }
    
    const testClient = clients[0];
    console.log('🎯 Testing with client:', testClient.CompanyName, '(' + testClient.ClientID + ')');
    
    // Create test proposal data (same as frontend would send)
    const testProposalData = {
      clientId: testClient.ClientID,
      title: 'Test Website Development Project',
      description: 'Complete website redesign and development with modern features and responsive design.',
      amount: 75000,
      currency: 'PKR'
    };
    
    console.log('📝 Test proposal data:', testProposalData);
    
    // Call the actual createProposal function (same as frontend)
    console.log('🚀 Calling createProposal function...');
    const result = createProposal(testProposalData);
    
    console.log('🎯 === PROPOSAL CREATION TEST RESULT ===');
    console.log('Result:', result);
    
    if (result.success) {
      console.log('✅ Proposal created successfully!');
      console.log(`✅ Proposal ID: ${result.proposalId}`);
      
      if (result.pdfResult) {
        console.log('📄 PDF Result:', result.pdfResult);
        
        if (result.pdfResult.success) {
          console.log('✅ PDF generated successfully!');
          
          if (result.pdfResult.clientFolder && result.pdfResult.clientFolder.success) {
            console.log('✅ PDF saved to client folder!');
            console.log(`📁 Client PDF URL: ${result.pdfResult.clientFolder.clientPdfUrl}`);
          } else {
            console.log('❌ PDF NOT saved to client folder');
            console.log('❌ Client folder error:', result.pdfResult.clientFolder ? result.pdfResult.clientFolder.error : 'No client folder data');
          }
        } else {
          console.log('❌ PDF generation failed:', result.pdfResult.error);
        }
      } else {
        console.log('❌ No PDF result returned');
      }
    } else {
      console.log('❌ Proposal creation failed:', result.error);
    }
    
    return {
      success: true,
      testClient: testClient,
      proposalData: testProposalData,
      result: result
    };
    
  } catch (error) {
    console.error('❌ Test proposal creation failed:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Quick Check - What happens when we manually try to copy a file to client folder
 */
function testManualClientFolderCopy() {
  try {
    console.log('🧪 === TESTING MANUAL CLIENT FOLDER COPY ===');
    
    // Get first client
    const clients = getAllClients();
    if (!clients || clients.length === 0) {
      return { success: false, error: 'No clients found' };
    }
    
    const testClient = clients[0];
    console.log('🎯 Testing with client:', testClient.CompanyName, '(' + testClient.ClientID + ')');
    
    // Find client's proposals folder
    const folderResult = getClientProposalsFolder(testClient.ClientID, testClient.CompanyName);
    
    if (!folderResult.success) {
      return {
        success: false,
        error: 'Could not find client folder: ' + folderResult.error
      };
    }
    
    console.log('✅ Client folder found:', folderResult.clientFolderName);
    console.log('✅ Proposals folder found:', folderResult.proposalsFolderName);
    
    // Try to create a simple test file in the client's proposals folder
    const proposalsFolder = DriveApp.getFolderById(folderResult.proposalsFolderId);
    console.log('📁 Accessing proposals folder...');
    
    // Create a simple text file as test
    const testFileName = `Test_File_${new Date().getTime()}.txt`;
    const testContent = `Test file created at ${new Date().toISOString()}\nClient: ${testClient.CompanyName}\nClient ID: ${testClient.ClientID}`;
    
    console.log('📄 Creating test file:', testFileName);
    const testFile = proposalsFolder.createFile(testFileName, testContent, 'text/plain');
    
    console.log('✅ Test file created successfully!');
    console.log('✅ File ID:', testFile.getId());
    console.log('✅ File URL:', testFile.getUrl());
    
    // Verify file exists
    const verifyFiles = proposalsFolder.getFilesByName(testFileName);
    if (verifyFiles.hasNext()) {
      console.log('✅ VERIFICATION: Test file confirmed in client folder');
      
      // Clean up - delete test file
      testFile.setTrashed(true);
      console.log('🗑️ Test file cleaned up');
      
      return {
        success: true,
        message: 'Manual file creation in client folder works correctly',
        testClient: testClient,
        folderResult: folderResult,
        testFileId: testFile.getId()
      };
    } else {
      console.log('❌ VERIFICATION: Test file NOT found in client folder!');
      return {
        success: false,
        error: 'Test file creation appeared to succeed but file not found in folder'
      };
    }
    
  } catch (error) {
    console.error('❌ Manual client folder copy test failed:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}