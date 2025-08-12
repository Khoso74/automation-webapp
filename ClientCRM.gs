/**
 * Client CRM Functions
 * Manages client data and relationships
 */

/**
 * Get all clients
 */
function getAllClients() {
  const spreadsheet = getOrCreateSpreadsheet();
  const clientsSheet = spreadsheet.getSheetByName(SHEETS.CLIENTS);
  const data = clientsSheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const headers = data[0];
  return data.slice(1).map(row => {
    const client = {};
    headers.forEach((header, index) => {
      client[header.replace(' ', '')] = row[index];
    });
    return client;
  });
}

/**
 * Get client by ID
 */
function getClientById(clientId) {
  const clients = getAllClients();
  return clients.find(client => client.ClientID === clientId);
}

/**
 * Create new client
 */
function createClient(clientData) {
  try {
    const spreadsheet = getOrCreateSpreadsheet();
    const clientsSheet = spreadsheet.getSheetByName(SHEETS.CLIENTS);
    
    // Generate unique client ID
    const clientId = generateId('CLI');
    
    // Prepare client data
    const newClient = [
      clientId,
      clientData.companyName || '',
      clientData.contactName || '',
      clientData.email || '',
      clientData.phone || '',
      clientData.address || '',
      new Date(),
      'Active'
    ];
    
    // Add to sheet
    clientsSheet.appendRow(newClient);
    
    // Create client folder in Drive
    const clientFolder = createClientFolder(clientId, clientData.companyName);
    
    // Log activity
    logActivity('Client', `New client created: ${clientData.companyName}`, clientId);
    
    return {
      success: true,
      clientId: clientId,
      folderId: clientFolder.getId()
    };
    
  } catch (error) {
    console.error('Error creating client:', error);
    logActivity('Client', `Failed to create client: ${error.message}`, '', 'Error');
    return { success: false, error: error.message };
  }
}

/**
 * Update client information
 */
function updateClient(clientId, clientData) {
  try {
    const spreadsheet = getOrCreateSpreadsheet();
    const clientsSheet = spreadsheet.getSheetByName(SHEETS.CLIENTS);
    const data = clientsSheet.getDataRange().getValues();
    
    // Find client row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === clientId) {
        // Update the row
        const updatedRow = [
          clientId,
          clientData.companyName || data[i][1],
          clientData.contactName || data[i][2],
          clientData.email || data[i][3],
          clientData.phone || data[i][4],
          clientData.address || data[i][5],
          data[i][6], // Keep original created date
          clientData.status || data[i][7]
        ];
        
        clientsSheet.getRange(i + 1, 1, 1, 8).setValues([updatedRow]);
        
        logActivity('Client', `Client updated: ${clientData.companyName}`, clientId);
        return { success: true };
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
    }
    return result;
  } catch (error) {
    console.error('Error deleting client:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create client folder in Drive
 */
function createClientFolder(clientId, companyName) {
  const rootFolderId = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID');
  const rootFolder = DriveApp.getFolderById(rootFolderId);
  
  // Get or create Clients folder
  const clientsFolder = createSubfolder(rootFolder, 'Clients');
  
  // Create folder for this client
  const folderName = `${clientId} - ${companyName}`;
  const clientFolder = clientsFolder.createFolder(folderName);
  
  // Create subfolders for client
  const subfolders = ['Proposals', 'Contracts', 'Projects', 'Invoices', 'Communications'];
  subfolders.forEach(subfolder => {
    clientFolder.createFolder(subfolder);
  });
  
  return clientFolder;
}

/**
 * Get client projects
 */
function getClientProjects(clientId) {
  const spreadsheet = getOrCreateSpreadsheet();
  const projectsSheet = spreadsheet.getSheetByName(SHEETS.PROJECTS);
  const data = projectsSheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const headers = data[0];
  return data.slice(1)
    .filter(row => row[2] === clientId) // Filter by Client ID column
    .map(row => {
      const project = {};
      headers.forEach((header, index) => {
        project[header.replace(' ', '')] = row[index];
      });
      return project;
    });
}

/**
 * Get client proposals
 */
function getClientProposals(clientId) {
  const spreadsheet = getOrCreateSpreadsheet();
  const proposalsSheet = spreadsheet.getSheetByName(SHEETS.PROPOSALS);
  const data = proposalsSheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const headers = data[0];
  return data.slice(1)
    .filter(row => row[1] === clientId) // Filter by Client ID column
    .map(row => {
      const proposal = {};
      headers.forEach((header, index) => {
        proposal[header.replace(' ', '')] = row[index];
      });
      return proposal;
    });
}

/**
 * Get client invoices
 */
function getClientInvoices(clientId) {
  const spreadsheet = getOrCreateSpreadsheet();
  const invoicesSheet = spreadsheet.getSheetByName(SHEETS.INVOICES);
  const data = invoicesSheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const headers = data[0];
  return data.slice(1)
    .filter(row => row[2] === clientId) // Filter by Client ID column
    .map(row => {
      const invoice = {};
      headers.forEach((header, index) => {
        invoice[header.replace(' ', '')] = row[index];
      });
      return invoice;
    });
}

/**
 * Search clients by name or email
 */
function searchClients(searchTerm) {
  const clients = getAllClients();
  const term = searchTerm.toLowerCase();
  
  return clients.filter(client => 
    client.CompanyName.toLowerCase().includes(term) ||
    client.ContactName.toLowerCase().includes(term) ||
    client.Email.toLowerCase().includes(term)
  );
}

/**
 * Get client summary (total projects, revenue, etc.)
 */
function getClientSummary(clientId) {
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
    acceptedProposals: proposals.filter(p => p.Status === 'Accepted').length,
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(i => i.Status === 'Paid').length,
    totalRevenue: invoices
      .filter(i => i.Status === 'Paid')
      .reduce((sum, i) => sum + (parseFloat(i.Amount) || 0), 0),
    outstandingAmount: invoices
      .filter(i => i.Status === 'Sent')
      .reduce((sum, i) => sum + (parseFloat(i.Amount) || 0), 0)
  };
  
  return summary;
}

/**
 * Export clients to CSV
 */
function exportClientsToCSV() {
  const clients = getAllClients();
  
  if (clients.length === 0) {
    return 'No clients to export';
  }
  
  // Create CSV content
  const headers = Object.keys(clients[0]);
  let csvContent = headers.join(',') + '\n';
  
  clients.forEach(client => {
    const row = headers.map(header => {
      const value = client[header] || '';
      // Escape commas and quotes
      return `"${value.toString().replace(/"/g, '""')}"`;
    });
    csvContent += row.join(',') + '\n';
  });
  
  // Create file in Drive
  const rootFolderId = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID');
  const rootFolder = DriveApp.getFolderById(rootFolderId);
  
  const fileName = `clients_export_${new Date().toISOString().split('T')[0]}.csv`;
  const file = rootFolder.createFile(fileName, csvContent, 'text/csv');
  
  logActivity('Export', `Clients exported to CSV: ${fileName}`, file.getId());
  
  return {
    success: true,
    fileId: file.getId(),
    fileName: fileName,
    url: file.getUrl()
  };
}