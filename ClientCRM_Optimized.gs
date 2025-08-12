/**
 * Client CRM Functions - OPTIMIZED VERSION
 * Manages client data and relationships with your specific Google resources
 */

/**
 * Test function to verify client creation setup
 */
function testClientCreation() {
  try {
    console.log('=== TESTING CLIENT CREATION SETUP ===');
    
    // Test spreadsheet access
    const spreadsheet = getSpreadsheet();
    console.log('✅ Spreadsheet access OK:', spreadsheet.getName());
    
    // Test clients sheet
    const clientsSheet = spreadsheet.getSheetByName(SHEETS.CLIENTS);
    console.log('✅ Clients sheet access OK:', clientsSheet.getName());
    
    // Test getting existing clients
    const existingClients = getAllClients();
    console.log('✅ Existing clients count:', existingClients.length);
    
    // Test root folder access
    const rootFolder = getRootFolder();
    console.log('✅ Root folder access OK:', rootFolder.getName());
    console.log('Root folder ID:', rootFolder.getId());
    
    // Test creating test client data
    const testClientData = {
      companyName: 'Test Company',
      contactName: 'Test Contact',
      email: 'test@example.com',
      phone: '+92-300-1234567',
      address: 'Test Address'
    };
    
    console.log('Test client data prepared:', testClientData);
    console.log('=== SETUP TEST COMPLETED ===');
    
    return 'Setup test completed successfully';
    
  } catch (error) {
    console.error('=== SETUP TEST FAILED ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
}

/**
 * Test function to debug client retrieval specifically
 */
function testClientRetrieval() {
  try {
    console.log('=== TESTING CLIENT RETRIEVAL ===');
    
    // Get all clients with debugging
    const clients = getAllClients();
    
    console.log('Retrieved clients:', clients);
    console.log('Client count:', clients.length);
    
    if (clients.length > 0) {
      console.log('Sample client structure:', clients[0]);
      console.log('Client keys:', Object.keys(clients[0]));
    }
    
    return {
      success: true,
      clientCount: clients.length,
      clients: clients
    };
    
  } catch (error) {
    console.error('=== CLIENT RETRIEVAL TEST FAILED ===');
    console.error('Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * OPTIMIZED: Get all clients with better performance
 */
function getAllClients() {
  try {
    console.log('=== GETTING ALL CLIENTS DEBUG ===');
    const spreadsheet = getSpreadsheet();
    const clientsSheet = spreadsheet.getSheetByName(SHEETS.CLIENTS);
    const data = clientsSheet.getDataRange().getValues();
    
    console.log('Total rows in clients sheet:', data.length);
    
    if (data.length <= 1) {
      console.log('No client data found (only headers or empty sheet)');
      return [];
    }
    
    const headers = data[0];
    console.log('Sheet headers:', headers);
    
    const clients = data.slice(1).map((row, index) => {
      const client = {};
      headers.forEach((header, headerIndex) => {
        // Create both original and cleaned key versions for compatibility
        const cleanKey = header.replace(/\s+/g, '');
        client[cleanKey] = row[headerIndex];
        client[header] = row[headerIndex];
      });
      
      // Ensure standard keys exist for frontend compatibility
      client.ClientID = client.ClientID || client['Client ID'] || client.clientId;
      client.CompanyName = client.CompanyName || client['Company Name'] || client.companyName;
      client.ContactName = client.ContactName || client['Contact Name'] || client.contactName;
      client.Email = client.Email || client.email;
      client.Phone = client.Phone || client.phone;
      client.Address = client.Address || client.address;
      
      console.log(`Client ${index + 1}:`, {
        ClientID: client.ClientID,
        CompanyName: client.CompanyName,
        ContactName: client.ContactName,
        Email: client.Email
      });
      
      return client;
    });
    
    console.log('Total clients processed:', clients.length);
    console.log('=== CLIENTS RETRIEVAL SUCCESS ===');
    return clients;
    
  } catch (error) {
    console.error('=== CLIENTS RETRIEVAL ERROR ===');
    console.error('Error getting all clients:', error);
    console.error('Error stack:', error.stack);
    return [];
  }
}

/**
 * Get client by ID with validation
 */
function getClientById(clientId) {
  if (!clientId) return null;
  
  try {
    const clients = getAllClients();
    return clients.find(client => client.ClientID === clientId) || null;
  } catch (error) {
    console.error('Error getting client by ID:', error);
    return null;
  }
}

/**
 * OPTIMIZED: Create new client with your specific Drive folder
 */
function createClient(clientData) {
  try {
    console.log('=== CLIENT CREATION DEBUG ===');
    console.log('Received clientData:', JSON.stringify(clientData));
    
    // Validate required fields
    if (!clientData.companyName || !clientData.contactName || !clientData.email) {
      console.error('Missing required fields:', {
        companyName: !!clientData.companyName,
        contactName: !!clientData.contactName,
        email: !!clientData.email
      });
      return { success: false, error: 'Company name, contact name, and email are required' };
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientData.email)) {
      console.error('Invalid email format:', clientData.email);
      return { success: false, error: 'Invalid email format' };
    }
    
    console.log('Validation passed, getting spreadsheet...');
    const spreadsheet = getSpreadsheet();
    const clientsSheet = spreadsheet.getSheetByName(SHEETS.CLIENTS);
    console.log('Got clients sheet:', clientsSheet.getName());
    
    // Check for duplicate email
    console.log('Checking for duplicate emails...');
    const existingClients = getAllClients();
    console.log('Found existing clients:', existingClients.length);
    
    if (existingClients.some(client => client.Email === clientData.email)) {
      console.error('Duplicate email found:', clientData.email);
      return { success: false, error: 'A client with this email already exists' };
    }
    
    // Generate unique client ID
    const clientId = generateId('CLI');
    console.log('Generated client ID:', clientId);
    
    // Prepare client data
    const newClient = [
      clientId,
      clientData.companyName.trim(),
      clientData.contactName.trim(),
      clientData.email.toLowerCase().trim(),
      clientData.phone || '',
      clientData.address || '',
      new Date(),
      'Active'
    ];
    
    console.log('Prepared client data for sheet:', newClient);
    
    // Add to sheet
    console.log('Adding row to sheet...');
    clientsSheet.appendRow(newClient);
    console.log('✅ Client added to sheet successfully');
    
    // Create client folder in your Drive folder
    console.log('Creating client folder...');
    const clientFolder = createClientFolderOptimized(clientId, clientData.companyName);
    console.log('✅ Client folder created:', clientFolder.getName());
    
    // Log activity
    logActivity('Client', `New client created: ${clientData.companyName}`, clientId);
    console.log('✅ Activity logged');
    
    console.log('=== CLIENT CREATION SUCCESS ===');
    return {
      success: true,
      clientId: clientId,
      folderId: clientFolder.getId(),
      folderUrl: clientFolder.getUrl(),
      message: 'Client created successfully'
    };
    
  } catch (error) {
    console.error('=== CLIENT CREATION ERROR ===');
    console.error('Error creating client:', error);
    console.error('Error stack:', error.stack);
    logActivity('Client', `Failed to create client: ${error.message}`, '', 'Error');
    return { success: false, error: error.message };
  }
}

/**
 * OPTIMIZED: Create client folder in your specific Drive folder
 */
function createClientFolderOptimized(clientId, companyName) {
  try {
    console.log('=== CLIENT FOLDER CREATION DEBUG ===');
    console.log('Creating folder for:', clientId, companyName);
    
    const rootFolder = getRootFolder();
    console.log('Root folder ID:', rootFolder.getId());
    console.log('Root folder name:', rootFolder.getName());
    
    // Get or create Clients folder
    console.log('Getting/creating Clients folder...');
    const clientsFolder = createSubfolderIfNeeded(rootFolder, 'Clients');
    console.log('Clients folder ID:', clientsFolder.getId());
    console.log('Clients folder name:', clientsFolder.getName());
    
    // Create folder for this client with safe name
    const safeName = companyName.replace(/[^a-zA-Z0-9\s-_]/g, '').trim();
    const folderName = `${clientId} - ${safeName}`;
    console.log('Creating client folder with name:', folderName);
    
    const clientFolder = clientsFolder.createFolder(folderName);
    console.log('✅ Client folder created:', clientFolder.getName());
    console.log('Client folder ID:', clientFolder.getId());
    console.log('Client folder URL:', clientFolder.getUrl());
    
    // Create subfolders for client
    const subfolders = ['Proposals', 'Contracts', 'Projects', 'Invoices', 'Communications'];
    console.log('Creating subfolders:', subfolders);
    
    subfolders.forEach(subfolder => {
      const createdSubfolder = clientFolder.createFolder(subfolder);
      console.log(`Created subfolder: ${subfolder} (ID: ${createdSubfolder.getId()})`);
    });
    
    console.log('=== CLIENT FOLDER CREATION SUCCESS ===');
    return clientFolder;
    
  } catch (error) {
    console.error('=== CLIENT FOLDER CREATION ERROR ===');
    console.error('Error creating client folder:', error);
    console.error('Error stack:', error.stack);
    // Return a fallback - at least the client record was created
    throw new Error('Client folder creation failed: ' + error.message);
  }
}

/**
 * Update client information with validation
 */
function updateClient(clientId, clientData) {
  try {
    if (!clientId) {
      return { success: false, error: 'Client ID is required' };
    }
    
    const spreadsheet = getSpreadsheet();
    const clientsSheet = spreadsheet.getSheetByName(SHEETS.CLIENTS);
    const data = clientsSheet.getDataRange().getValues();
    
    // Find client row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === clientId) {
        // Validate email if provided
        if (clientData.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(clientData.email)) {
            return { success: false, error: 'Invalid email format' };
          }
          
          // Check for duplicate email (excluding current client)
          const existingClients = getAllClients();
          const duplicateEmail = existingClients.find(client => 
            client.Email === clientData.email && client.ClientID !== clientId
          );
          if (duplicateEmail) {
            return { success: false, error: 'Another client with this email already exists' };
          }
        }
        
        // Update the row
        const updatedRow = [
          clientId,
          clientData.companyName ? clientData.companyName.trim() : data[i][1],
          clientData.contactName ? clientData.contactName.trim() : data[i][2],
          clientData.email ? clientData.email.toLowerCase().trim() : data[i][3],
          clientData.phone !== undefined ? clientData.phone : data[i][4],
          clientData.address !== undefined ? clientData.address : data[i][5],
          data[i][6], // Keep original created date
          clientData.status || data[i][7]
        ];
        
        clientsSheet.getRange(i + 1, 1, 1, 8).setValues([updatedRow]);
        
        logActivity('Client', `Client updated: ${updatedRow[1]}`, clientId);
        return { success: true, message: 'Client updated successfully' };
      }
    }
    
    return { success: false, error: 'Client not found' };
    
  } catch (error) {
    console.error('Error updating client:', error);
    logActivity('Client', `Failed to update client: ${error.message}`, clientId, 'Error');
    return { success: false, error: error.message };
  }
}

/**
 * Delete client (soft delete by setting status to Inactive)
 */
function deleteClient(clientId) {
  try {
    const result = updateClient(clientId, { status: 'Inactive' });
    if (result.success) {
      logActivity('Client', `Client deactivated: ${clientId}`, clientId);
      result.message = 'Client deactivated successfully';
    }
    return result;
  } catch (error) {
    console.error('Error deleting client:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get client projects with performance optimization
 */
function getClientProjects(clientId) {
  if (!clientId) return [];
  
  try {
    const spreadsheet = getSpreadsheet();
    const projectsSheet = spreadsheet.getSheetByName(SHEETS.PROJECTS);
    const data = projectsSheet.getDataRange().getValues();
    
    if (data.length <= 1) return [];
    
    const headers = data[0];
    return data.slice(1)
      .filter(row => row[2] === clientId) // Filter by Client ID column
      .map(row => {
        const project = {};
        headers.forEach((header, index) => {
          project[header.replace(/\s+/g, '')] = row[index];
        });
        return project;
      });
  } catch (error) {
    console.error('Error getting client projects:', error);
    return [];
  }
}

/**
 * Get client proposals with performance optimization
 */
function getClientProposals(clientId) {
  if (!clientId) return [];
  
  try {
    const spreadsheet = getSpreadsheet();
    const proposalsSheet = spreadsheet.getSheetByName(SHEETS.PROPOSALS);
    const data = proposalsSheet.getDataRange().getValues();
    
    if (data.length <= 1) return [];
    
    const headers = data[0];
    return data.slice(1)
      .filter(row => row[1] === clientId) // Filter by Client ID column
      .map(row => {
        const proposal = {};
        headers.forEach((header, index) => {
          proposal[header.replace(/\s+/g, '')] = row[index];
        });
        return proposal;
      });
  } catch (error) {
    console.error('Error getting client proposals:', error);
    return [];
  }
}

/**
 * Get client invoices with performance optimization
 */
function getClientInvoices(clientId) {
  if (!clientId) return [];
  
  try {
    const spreadsheet = getSpreadsheet();
    const invoicesSheet = spreadsheet.getSheetByName(SHEETS.INVOICES);
    const data = invoicesSheet.getDataRange().getValues();
    
    if (data.length <= 1) return [];
    
    const headers = data[0];
    return data.slice(1)
      .filter(row => row[2] === clientId) // Filter by Client ID column
      .map(row => {
        const invoice = {};
        headers.forEach((header, index) => {
          invoice[header.replace(/\s+/g, '')] = row[index];
        });
        return invoice;
      });
  } catch (error) {
    console.error('Error getting client invoices:', error);
    return [];
  }
}

/**
 * Search clients with improved performance
 */
function searchClients(searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') {
    return getAllClients();
  }
  
  try {
    const clients = getAllClients();
    const term = searchTerm.toLowerCase().trim();
    
    return clients.filter(client => 
      (client.CompanyName && client.CompanyName.toLowerCase().includes(term)) ||
      (client.ContactName && client.ContactName.toLowerCase().includes(term)) ||
      (client.Email && client.Email.toLowerCase().includes(term)) ||
      (client.ClientID && client.ClientID.toLowerCase().includes(term))
    );
  } catch (error) {
    console.error('Error searching clients:', error);
    return [];
  }
}

/**
 * OPTIMIZED: Get client summary with better calculations
 */
function getClientSummary(clientId) {
  if (!clientId) return null;
  
  try {
    const client = getClientById(clientId);
    if (!client) return null;
    
    const projects = getClientProjects(clientId);
    const proposals = getClientProposals(clientId);
    const invoices = getClientInvoices(clientId);
    
    const summary = {
      client: client,
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.Status === 'In Progress').length,
      completedProjects: projects.filter(p => p.Status === 'Completed').length,
      totalProposals: proposals.length,
      pendingProposals: proposals.filter(p => p.Status === 'Sent').length,
      acceptedProposals: proposals.filter(p => p.Status === 'Accepted').length,
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(i => i.Status === 'Paid').length,
      sentInvoices: invoices.filter(i => i.Status === 'Sent').length,
      totalRevenue: invoices
        .filter(i => i.Status === 'Paid')
        .reduce((sum, i) => sum + (parseFloat(i.Amount) || 0), 0),
      outstandingAmount: invoices
        .filter(i => i.Status === 'Sent')
        .reduce((sum, i) => sum + (parseFloat(i.Amount) || 0), 0),
      lastActivity: getLastClientActivity(clientId)
    };
    
    return summary;
  } catch (error) {
    console.error('Error getting client summary:', error);
    return null;
  }
}

/**
 * Get last activity for client
 */
function getLastClientActivity(clientId) {
  try {
    const spreadsheet = getSpreadsheet();
    const logsSheet = spreadsheet.getSheetByName(SHEETS.LOGS);
    const data = logsSheet.getDataRange().getValues();
    
    if (data.length <= 1) return null;
    
    // Find the most recent activity for this client
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][3] === clientId) { // Reference ID column
        return {
          date: data[i][0],
          type: data[i][1],
          description: data[i][2]
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting last client activity:', error);
    return null;
  }
}

/**
 * OPTIMIZED: Export clients to CSV with better formatting
 */
function exportClientsToCSV() {
  try {
    const clients = getAllClients();
    
    if (clients.length === 0) {
      return { success: false, error: 'No clients to export' };
    }
    
    // Create CSV content with proper escaping
    const headers = ['Client ID', 'Company Name', 'Contact Name', 'Email', 'Phone', 'Address', 'Created Date', 'Status'];
    let csvContent = headers.join(',') + '\n';
    
    clients.forEach(client => {
      const row = [
        client.ClientID || '',
        `"${(client.CompanyName || '').replace(/"/g, '""')}"`,
        `"${(client.ContactName || '').replace(/"/g, '""')}"`,
        client.Email || '',
        `"${(client.Phone || '').replace(/"/g, '""')}"`,
        `"${(client.Address || '').replace(/"/g, '""')}"`,
        client.CreatedDate ? new Date(client.CreatedDate).toLocaleDateString() : '',
        client.Status || ''
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Create file in your Drive folder
    const rootFolder = getRootFolder();
    
    const fileName = `clients_export_${new Date().toISOString().split('T')[0]}.csv`;
    const file = rootFolder.createFile(fileName, csvContent, 'text/csv');
    
    logActivity('Export', `Clients exported to CSV: ${fileName}`, file.getId());
    
    return {
      success: true,
      fileId: file.getId(),
      fileName: fileName,
      url: file.getUrl(),
      message: 'Clients exported successfully'
    };
    
  } catch (error) {
    console.error('Error exporting clients:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get active clients only
 */
function getActiveClients() {
  try {
    const allClients = getAllClients();
    return allClients.filter(client => client.Status === 'Active');
  } catch (error) {
    console.error('Error getting active clients:', error);
    return [];
  }
}

/**
 * Get client statistics
 */
function getClientStatistics() {
  try {
    const clients = getAllClients();
    
    return {
      total: clients.length,
      active: clients.filter(c => c.Status === 'Active').length,
      inactive: clients.filter(c => c.Status === 'Inactive').length,
      thisMonth: clients.filter(c => {
        const createdDate = new Date(c.CreatedDate);
        const thisMonth = new Date();
        return createdDate.getMonth() === thisMonth.getMonth() && 
               createdDate.getFullYear() === thisMonth.getFullYear();
      }).length
    };
  } catch (error) {
    console.error('Error getting client statistics:', error);
    return { total: 0, active: 0, inactive: 0, thisMonth: 0 };
  }
}

/**
 * Bulk update client status
 */
function bulkUpdateClientStatus(clientIds, newStatus) {
  try {
    if (!Array.isArray(clientIds) || clientIds.length === 0) {
      return { success: false, error: 'No client IDs provided' };
    }
    
    if (!['Active', 'Inactive'].includes(newStatus)) {
      return { success: false, error: 'Invalid status. Must be Active or Inactive' };
    }
    
    let updated = 0;
    let errors = 0;
    
    clientIds.forEach(clientId => {
      const result = updateClient(clientId, { status: newStatus });
      if (result.success) {
        updated++;
      } else {
        errors++;
      }
    });
    
    logActivity('Client', `Bulk status update: ${updated} clients updated to ${newStatus}`, '');
    
    return {
      success: true,
      updated: updated,
      errors: errors,
      message: `${updated} clients updated successfully`
    };
    
  } catch (error) {
    console.error('Error in bulk update:', error);
    return { success: false, error: error.message };
  }
}