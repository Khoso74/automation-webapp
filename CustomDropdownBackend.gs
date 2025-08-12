/**
 * Custom Dropdown Backend - Google Apps Script
 * Handles client data retrieval and proposal creation
 */

// Configuration - Update these with your Google Sheet ID and folder ID
const DROPDOWN_CONFIG = {
  SHEET_ID: '1R1C4sXK550SHszOm4DOEUWQE1N0o84MfwFRljs9QGug', // Your Google Sheet ID
  DRIVE_FOLDER_ID: '13kL2PLSdrB7eL7D3ErjHbURjcHJ35OtG' // Your Google Drive folder ID
};

// Sheet tab names for dropdown
const DROPDOWN_SHEETS = {
  CLIENTS: 'Clients',
  PROPOSALS: 'Proposals'
};

/**
 * Get the main spreadsheet for dropdown
 */
function getDropdownSpreadsheet() {
  try {
    return SpreadsheetApp.openById(DROPDOWN_CONFIG.SHEET_ID);
  } catch (error) {
    console.error('Error accessing spreadsheet:', error);
    throw new Error('Cannot access spreadsheet. Check SHEET_ID in DROPDOWN_CONFIG.');
  }
}

/**
 * Get all clients from Google Sheets
 * Returns JSON array with ClientID and CompanyName
 */
function getAllClients() {
  try {
    console.log('🔄 Fetching all clients from sheet...');
    
    const spreadsheet = getDropdownSpreadsheet();
    const clientsSheet = spreadsheet.getSheetByName(DROPDOWN_SHEETS.CLIENTS);
    
    if (!clientsSheet) {
      console.error('Clients sheet not found');
      return [];
    }
    
    // Get all data from the sheet
    const data = clientsSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      console.log('No client data found (only headers or empty sheet)');
      return [];
    }
    
    const headers = data[0];
    console.log('Sheet headers:', headers);
    
    // Find column indices
    const clientIdCol = findColumnIndex(headers, ['Client ID', 'ClientID', 'ID']);
    const companyNameCol = findColumnIndex(headers, ['Company Name', 'CompanyName', 'Company', 'Name']);
    const contactNameCol = findColumnIndex(headers, ['Contact Name', 'ContactName', 'Contact']);
    const emailCol = findColumnIndex(headers, ['Email', 'EmailAddress']);
    const phoneCol = findColumnIndex(headers, ['Phone', 'PhoneNumber', 'Mobile']);
    const statusCol = findColumnIndex(headers, ['Status']);
    
    console.log('Column mapping:', {
      clientId: clientIdCol,
      companyName: companyNameCol,
      contactName: contactNameCol,
      email: emailCol,
      phone: phoneCol,
      status: statusCol
    });
    
    // Process client data
    const clients = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[clientIdCol] && !row[companyNameCol]) {
        continue;
      }
      
      const client = {
        ClientID: row[clientIdCol] || `AUTO-${i}`,
        CompanyName: row[companyNameCol] || 'Unknown Company',
        ContactName: row[contactNameCol] || '',
        Email: row[emailCol] || '',
        Phone: row[phoneCol] || '',
        Status: row[statusCol] || 'Active'
      };
      
      // Only include active clients
      if (client.Status.toLowerCase() !== 'inactive') {
        clients.push(client);
        console.log(`✅ Added client: ${client.CompanyName} (${client.ClientID})`);
      }
    }
    
    console.log(`✅ Successfully loaded ${clients.length} clients`);
    return clients;
    
  } catch (error) {
    console.error('Error fetching clients:', error);
    console.error('Error stack:', error.stack);
    throw new Error('Failed to fetch clients: ' + error.message);
  }
}

/**
 * Helper function to find column index by multiple possible names
 */
function findColumnIndex(headers, possibleNames) {
  for (let name of possibleNames) {
    const index = headers.findIndex(header => 
      header.toString().toLowerCase().replace(/\s+/g, '') === name.toLowerCase().replace(/\s+/g, '')
    );
    if (index !== -1) return index;
  }
  return -1; // Not found
}

/**
 * Create a new proposal
 * @param {Object} proposalData - Form data from frontend
 */
function createProposal(proposalData) {
  try {
    console.log('🔄 Creating proposal with data:', proposalData);
    
    const spreadsheet = getDropdownSpreadsheet();
    let proposalsSheet = spreadsheet.getSheetByName(DROPDOWN_SHEETS.PROPOSALS);
    
    // Create Proposals sheet if it doesn't exist
    if (!proposalsSheet) {
      console.log('Creating Proposals sheet...');
      proposalsSheet = spreadsheet.insertSheet(DROPDOWN_SHEETS.PROPOSALS);
      
      // Add headers
      const headers = [
        'Proposal ID',
        'Client ID', 
        'Client Name',
        'Proposal Title',
        'Amount (PKR)',
        'Description',
        'Status',
        'Created Date',
        'Created Time'
      ];
      
      proposalsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format headers
      const headerRange = proposalsSheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#667eea');
      headerRange.setFontColor('white');
    }
    
    // Generate proposal ID
    const lastRow = proposalsSheet.getLastRow();
    const proposalId = `PROP-${String(lastRow).padStart(3, '0')}`;
    
    // Prepare data for insertion
    const now = new Date();
    const proposalRow = [
      proposalId,
      proposalData.clientId,
      proposalData.clientName,
      proposalData.proposalTitle,
      parseFloat(proposalData.proposalAmount) || 0,
      proposalData.proposalDescription || '',
      'Draft',
      Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss')
    ];
    
    // Add row to sheet
    proposalsSheet.appendRow(proposalRow);
    
    console.log(`✅ Proposal created successfully: ${proposalId}`);
    
    // Return success response
    return {
      success: true,
      proposalId: proposalId,
      message: 'Proposal created successfully',
      data: {
        proposalId: proposalId,
        clientName: proposalData.clientName,
        title: proposalData.proposalTitle,
        amount: proposalData.proposalAmount,
        status: 'Draft',
        createdDate: now.toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error creating proposal:', error);
    console.error('Error stack:', error.stack);
    
    return {
      success: false,
      error: error.message,
      message: 'Failed to create proposal'
    };
  }
}

/**
 * Test function to verify backend connectivity
 */
function testBackendConnection() {
  try {
    console.log('🧪 Testing backend connection...');
    
    const spreadsheet = getDropdownSpreadsheet();
    const sheetCount = spreadsheet.getSheets().length;
    
    return {
      success: true,
      message: 'Backend connection successful',
      spreadsheetName: spreadsheet.getName(),
      sheetCount: sheetCount,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Backend connection test failed:', error);
    
    return {
      success: false,
      error: error.message,
      message: 'Backend connection failed'
    };
  }
}

/**
 * Test function to check client data
 */
function testClientData() {
  try {
    console.log('🧪 Testing client data...');
    
    const clients = getAllClients();
    
    return {
      success: true,
      message: `Found ${clients.length} clients`,
      clientCount: clients.length,
      sampleClients: clients.slice(0, 3), // First 3 clients
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Client data test failed:', error);
    
    return {
      success: false,
      error: error.message,
      message: 'Client data test failed'
    };
  }
}

/**
 * Initialize sheets if they don't exist
 */
function initializeSheets() {
  try {
    console.log('🔄 Initializing sheets...');
    
    const spreadsheet = getDropdownSpreadsheet();
    
    // Check and create Clients sheet
    let clientsSheet = spreadsheet.getSheetByName(DROPDOWN_SHEETS.CLIENTS);
    if (!clientsSheet) {
      console.log('Creating Clients sheet...');
              clientsSheet = spreadsheet.insertSheet(DROPDOWN_SHEETS.CLIENTS);
      
      // Add headers for Clients sheet
      const clientHeaders = [
        'Client ID',
        'Company Name',
        'Contact Name',
        'Email',
        'Phone',
        'Address',
        'Status',
        'Created Date'
      ];
      
      clientsSheet.getRange(1, 1, 1, clientHeaders.length).setValues([clientHeaders]);
      
      // Format headers
      const headerRange = clientsSheet.getRange(1, 1, 1, clientHeaders.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#667eea');
      headerRange.setFontColor('white');
      
      // Add sample data
      const sampleClients = [
        ['CLI-001', 'ABC Corporation', 'John Smith', 'john@abc.com', '+92-300-1234567', 'Karachi, Pakistan', 'Active', '2024-01-15'],
        ['CLI-002', 'XYZ Solutions', 'Sarah Ahmed', 'sarah@xyz.com', '+92-301-7654321', 'Lahore, Pakistan', 'Active', '2024-01-16'],
        ['CLI-003', 'Tech Innovators', 'Ali Hassan', 'ali@techinnovators.com', '+92-302-9876543', 'Islamabad, Pakistan', 'Active', '2024-01-17']
      ];
      
      clientsSheet.getRange(2, 1, sampleClients.length, clientHeaders.length).setValues(sampleClients);
      console.log('✅ Added sample client data');
    }
    
    // Check and create Proposals sheet
    let proposalsSheet = spreadsheet.getSheetByName(DROPDOWN_SHEETS.PROPOSALS);
    if (!proposalsSheet) {
      console.log('Creating Proposals sheet...');
              proposalsSheet = spreadsheet.insertSheet(DROPDOWN_SHEETS.PROPOSALS);
      
      // Add headers for Proposals sheet
      const proposalHeaders = [
        'Proposal ID',
        'Client ID',
        'Client Name',
        'Proposal Title',
        'Amount (PKR)',
        'Description',
        'Status',
        'Created Date',
        'Created Time'
      ];
      
      proposalsSheet.getRange(1, 1, 1, proposalHeaders.length).setValues([proposalHeaders]);
      
      // Format headers
      const headerRange = proposalsSheet.getRange(1, 1, 1, proposalHeaders.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#764ba2');
      headerRange.setFontColor('white');
    }
    
    console.log('✅ Sheet initialization completed');
    
    return {
      success: true,
      message: 'Sheets initialized successfully',
      sheetsCreated: {
        clients: !spreadsheet.getSheetByName(DROPDOWN_SHEETS.CLIENTS),
        proposals: !spreadsheet.getSheetByName(DROPDOWN_SHEETS.PROPOSALS)
      }
    };
    
  } catch (error) {
    console.error('Error initializing sheets:', error);
    throw new Error('Failed to initialize sheets: ' + error.message);
  }
}

/**
 * Get proposal statistics for dashboard
 */
function getProposalStats() {
  try {
    const spreadsheet = getDropdownSpreadsheet();
    const proposalsSheet = spreadsheet.getSheetByName(DROPDOWN_SHEETS.PROPOSALS);
    
    if (!proposalsSheet) {
      return {
        totalProposals: 0,
        draftProposals: 0,
        sentProposals: 0,
        acceptedProposals: 0,
        totalValue: 0
      };
    }
    
    const data = proposalsSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return {
        totalProposals: 0,
        draftProposals: 0,
        sentProposals: 0,
        acceptedProposals: 0,
        totalValue: 0
      };
    }
    
    const headers = data[0];
    const statusCol = headers.indexOf('Status');
    const amountCol = headers.indexOf('Amount (PKR)');
    
    let stats = {
      totalProposals: data.length - 1,
      draftProposals: 0,
      sentProposals: 0,
      acceptedProposals: 0,
      totalValue: 0
    };
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = row[statusCol] ? row[statusCol].toString().toLowerCase() : '';
      const amount = parseFloat(row[amountCol]) || 0;
      
      stats.totalValue += amount;
      
      switch (status) {
        case 'draft':
          stats.draftProposals++;
          break;
        case 'sent':
          stats.sentProposals++;
          break;
        case 'accepted':
          stats.acceptedProposals++;
          break;
      }
    }
    
    return stats;
    
  } catch (error) {
    console.error('Error getting proposal stats:', error);
    return {
      totalProposals: 0,
      draftProposals: 0,
      sentProposals: 0,
      acceptedProposals: 0,
      totalValue: 0,
      error: error.message
    };
  }
}

/**
 * Serve the HTML page
 */
function doGet() {
  return HtmlService.createTemplateFromFile('custom_dropdown_proposal')
    .evaluate()
    .setTitle('Custom Dropdown Proposal Form')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Include HTML files (for modular development)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}