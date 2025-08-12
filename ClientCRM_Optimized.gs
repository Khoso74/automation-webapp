/**
 * Client CRM Functions - OPTIMIZED VERSION
 * Manages client data and relationships with your specific Google resources
 */

/**
 * OPTIMIZED: Get all clients with better performance
 */
function getAllClients() {
  try {
    const spreadsheet = getSpreadsheet();
    const clientsSheet = spreadsheet.getSheetByName(SHEETS.CLIENTS);
    const data = clientsSheet.getDataRange().getValues();
    
    if (data.length <= 1) return [];
    
    const headers = data[0];
    return data.slice(1).map(row => {
      const client = {};
      headers.forEach((header, index) => {
        client[header.replace(/\s+/g, '')] = row[index];
      });
      return client;
    });
  } catch (error) {
    console.error('Error getting all clients:', error);
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
    // Validate required fields
    if (!clientData.companyName || !clientData.contactName || !clientData.email) {
      return { success: false, error: 'Company name, contact name, and email are required' };
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientData.email)) {
      return { success: false, error: 'Invalid email format' };
    }
    
    const spreadsheet = getSpreadsheet();
    const clientsSheet = spreadsheet.getSheetByName(SHEETS.CLIENTS);
    
    // Check for duplicate email
    const existingClients = getAllClients();
    if (existingClients.some(client => client.Email === clientData.email)) {
      return { success: false, error: 'A client with this email already exists' };
    }
    
    // Generate unique client ID
    const clientId = generateId('CLI');
    
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
    
    // Add to sheet
    clientsSheet.appendRow(newClient);
    
    // Create client folder in your Drive folder
    const clientFolder = createClientFolderOptimized(clientId, clientData.companyName);
    
    // Log activity
    logActivity('Client', `New client created: ${clientData.companyName}`, clientId);
    
    return {
      success: true,
      clientId: clientId,
      folderId: clientFolder.getId(),
      message: 'Client created successfully'
    };
    
  } catch (error) {
    console.error('Error creating client:', error);
    logActivity('Client', `Failed to create client: ${error.message}`, '', 'Error');
    return { success: false, error: error.message };
  }
}

/**
 * OPTIMIZED: Create client folder in your specific Drive folder
 */
function createClientFolderOptimized(clientId, companyName) {
  try {
    const rootFolder = getRootFolder();
    
    // Get or create Clients folder
    const clientsFolder = createSubfolderIfNeeded(rootFolder, 'Clients');
    
    // Create folder for this client with safe name
    const safeName = companyName.replace(/[^a-zA-Z0-9\s-_]/g, '').trim();
    const folderName = `${clientId} - ${safeName}`;
    const clientFolder = clientsFolder.createFolder(folderName);
    
    // Create subfolders for client
    const subfolders = ['Proposals', 'Contracts', 'Projects', 'Invoices', 'Communications'];
    subfolders.forEach(subfolder => {
      clientFolder.createFolder(subfolder);
    });
    
    console.log(`Created client folder: ${folderName}`);
    return clientFolder;
    
  } catch (error) {
    console.error('Error creating client folder:', error);
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