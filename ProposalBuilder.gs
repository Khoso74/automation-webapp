/**
 * Proposal Builder Functions
 * Handles proposal creation, PDF generation, and client communication
 */

/**
 * Create new proposal
 */
function createProposal(proposalData) {
  try {
    const spreadsheet = getOrCreateSpreadsheet();
    const proposalsSheet = spreadsheet.getSheetByName(SHEETS.PROPOSALS);
    
    // Generate unique proposal ID
    const proposalId = generateId('PROP');
    
    // Generate acceptance URL
    const webAppUrl = getWebAppUrl();
    const acceptanceUrl = `${webAppUrl}?page=proposal&id=${proposalId}`;
    
    // Prepare proposal data
    const newProposal = [
      proposalId,
      proposalData.clientId || '',
      proposalData.title || '',
      proposalData.description || '',
      parseFloat(proposalData.amount) || 0,
      proposalData.currency || getSetting('DEFAULT_CURRENCY') || 'USD',
      'Draft',
      new Date(),
      '', // Sent Date
      '', // Accepted Date
      '', // PDF URL
      acceptanceUrl
    ];
    
    // Add to sheet
    proposalsSheet.appendRow(newProposal);
    
    // Log activity
    logActivity('Proposal', `New proposal created: ${proposalData.title}`, proposalId);
    
    return {
      success: true,
      proposalId: proposalId,
      acceptanceUrl: acceptanceUrl
    };
    
  } catch (error) {
    console.error('Error creating proposal:', error);
    logActivity('Proposal', `Failed to create proposal: ${error.message}`, '', 'Error');
    return { success: false, error: error.message };
  }
}

/**
 * Generate proposal PDF
 */
function generateProposalPDF(proposalId) {
  try {
    const proposal = getProposalById(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    
    const client = getClientById(proposal.ClientID);
    if (!client) {
      throw new Error('Client not found');
    }
    
    // Create HTML content for PDF
    const htmlContent = createProposalHTML(proposal);
    
    // Convert HTML to PDF using Google Docs
    const pdfBlob = Utilities.newBlob(htmlContent, 'text/html')
      .getAs('application/pdf');
    
    // Save PDF to Drive
    const rootFolderId = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID');
    const rootFolder = DriveApp.getFolderById(rootFolderId);
    const proposalsFolder = createSubfolder(rootFolder, 'Proposals');
    
    const fileName = `Proposal_${proposalId}_${proposal.Title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const pdfFile = proposalsFolder.createFile(pdfBlob.setName(fileName));
    
    // Update proposal with PDF URL
    updateProposalPdfUrl(proposalId, pdfFile.getUrl());
    
    // Also save to client folder
    try {
      const clientFolder = getClientFolder(proposal.ClientID);
      if (clientFolder) {
        const clientProposalsFolder = createSubfolder(clientFolder, 'Proposals');
        pdfFile.makeCopy(fileName, clientProposalsFolder);
      }
    } catch (error) {
      console.log('Could not save to client folder:', error.message);
    }
    
    logActivity('Proposal', `PDF generated for proposal: ${proposal.Title}`, proposalId);
    
    return {
      success: true,
      fileId: pdfFile.getId(),
      fileName: fileName,
      url: pdfFile.getUrl()
    };
    
  } catch (error) {
    console.error('Error generating proposal PDF:', error);
    logActivity('Proposal', `Failed to generate PDF: ${error.message}`, proposalId, 'Error');
    return { success: false, error: error.message };
  }
}

/**
 * Create HTML content for proposal PDF
 */
function createProposalHTML(proposal) {
  const companyName = getSetting('COMPANY_NAME');
  const companyEmail = getSetting('COMPANY_EMAIL');
  const companyPhone = getSetting('COMPANY_PHONE');
  const companyAddress = getSetting('COMPANY_ADDRESS');
  const currencySymbol = getSetting('CURRENCY_SYMBOL') || 'Rs.';
  
  // Format amount with Pakistani number formatting
  const formattedAmount = parseFloat(proposal.Amount).toLocaleString('en-PK');
  
  // Get client information
  const client = getClientById(proposal.ClientID);
  const clientName = client ? client.ContactName : proposal.ClientName || 'Valued Client';
  const companyClientName = client ? client.CompanyName : 'Client Company';

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Proposal ${proposal.ProposalID}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; line-height: 1.6; }
        .proposal-header { background: linear-gradient(135deg, #2c5aa0, #1e4080); color: white; padding: 30px; margin-bottom: 30px; border-radius: 10px; }
        .proposal-title { font-size: 32px; margin: 0; font-weight: 300; }
        .proposal-subtitle { font-size: 16px; margin: 10px 0 0 0; opacity: 0.9; }
        .company-info { margin-bottom: 30px; }
        .company-name { font-size: 24px; color: #2c5aa0; margin-bottom: 10px; font-weight: bold; }
        .section { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #2c5aa0; }
        .section h3 { color: #2c5aa0; margin-top: 0; margin-bottom: 15px; }
        .client-info { background: #e8f4fd; border-left-color: #007bff; }
        .project-scope { background: #f0f8e8; border-left-color: #28a745; }
        .pricing-section { background: #fff3cd; border-left-color: #ffc107; }
        .amount-highlight { font-size: 28px; font-weight: bold; color: #2c5aa0; text-align: center; 
                           background: white; padding: 20px; margin: 20px 0; border-radius: 8px; 
                           border: 2px solid #2c5aa0; }
        .timeline { background: #f8d7da; border-left-color: #dc3545; }
        .payment-terms { background: #d4edda; border-left-color: #28a745; }
        .cta-section { text-align: center; margin: 40px 0; }
        .accept-button { background: #28a745; color: white; padding: 15px 30px; font-size: 18px; 
                        text-decoration: none; border-radius: 5px; display: inline-block; 
                        transition: background 0.3s; }
        .accept-button:hover { background: #218838; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; 
                 border-top: 1px solid #ddd; padding-top: 20px; }
        .contact-info { display: flex; justify-content: space-around; flex-wrap: wrap; margin: 20px 0; }
        .contact-item { margin: 10px; }
        ul { margin: 0; padding-left: 20px; }
        li { margin: 8px 0; }
    </style>
</head>
<body>
    <div class="proposal-header">
        <h1 class="proposal-title">BUSINESS PROPOSAL</h1>
        <div class="proposal-subtitle">Proposal #${proposal.ProposalID} | ${new Date(proposal.CreatedDate).toLocaleDateString('en-PK')}</div>
    </div>

    <div class="company-info">
        <h2 class="company-name">${companyName}</h2>
        <div class="contact-info">
            <div class="contact-item">📍 ${companyAddress}</div>
            <div class="contact-item">📧 ${companyEmail}</div>
            <div class="contact-item">📞 ${companyPhone}</div>
        </div>
    </div>

    <div class="section client-info">
        <h3>👤 Prepared For</h3>
        <p><strong>${companyClientName}</strong></p>
        <p>Attention: ${clientName}</p>
    </div>

    <div class="section project-scope">
        <h3>🎯 Project Overview</h3>
        <h4>${proposal.Title}</h4>
        <div>${proposal.Description.replace(/\n/g, '<br>')}</div>
    </div>

    <div class="section pricing-section">
        <h3>💰 Investment Required</h3>
        <div class="amount-highlight">
            Total Project Cost: ${currencySymbol} ${formattedAmount}
        </div>
        <p><strong>What's Included:</strong></p>
        <ul>
            <li>Complete project development as specified</li>
            <li>Regular progress updates and communication</li>
            <li>Quality assurance and testing</li>
            <li>Post-delivery support (${getSetting('PAYMENT_TERMS_DAYS')} days)</li>
            <li>Source files and documentation</li>
        </ul>
    </div>

    <div class="section timeline">
        <h3>⏰ Project Timeline</h3>
        <p><strong>Estimated Completion:</strong> ${new Date(proposal.Deadline).toLocaleDateString('en-PK')}</p>
        <p>We understand the importance of timely delivery and commit to completing your project within the agreed timeframe.</p>
        
        <p><strong>Project Phases:</strong></p>
        <ul>
            <li>Requirements gathering and planning (1-2 days)</li>
            <li>Development and implementation</li>
            <li>Testing and quality assurance</li>
            <li>Final delivery and documentation</li>
        </ul>
    </div>

    <div class="section payment-terms">
        <h3>💳 Payment Terms</h3>
        <p><strong>Currency:</strong> Pakistani Rupees (PKR)</p>
        <p><strong>Payment Structure:</strong></p>
        <ul>
            <li>50% advance payment to start the project</li>
            <li>50% upon completion and delivery</li>
        </ul>
        
        <p><strong>Accepted Payment Methods:</strong></p>
        <ul>
            <li>💳 JazzCash</li>
            <li>💳 EasyPaisa</li>
            <li>🏦 Bank Transfer</li>
            <li>🌐 PayPal (for international clients)</li>
        </ul>
        
        <p><strong>Payment Terms:</strong> ${getSetting('PAYMENT_TERMS_DAYS')} days from invoice date</p>
    </div>

    <div class="section">
        <h3>✅ Why Choose Us?</h3>
        <ul>
            <li><strong>Quality Assured:</strong> We deliver high-quality work that meets your expectations</li>
            <li><strong>Timely Delivery:</strong> We respect deadlines and deliver on time</li>
            <li><strong>Clear Communication:</strong> Regular updates throughout the project</li>
            <li><strong>Local Expertise:</strong> Understanding of Pakistani market and business needs</li>
            <li><strong>Ongoing Support:</strong> Post-delivery support to ensure smooth operation</li>
        </ul>
    </div>

    <div class="cta-section">
        <h3 style="color: #2c5aa0; margin-bottom: 20px;">Ready to Get Started?</h3>
        <p>Click the button below to accept this proposal and begin your project!</p>
        <a href="${getWebAppUrl()}?action=accept&proposalId=${proposal.ProposalID}" class="accept-button">
            ✅ Accept Proposal & Start Project
        </a>
        <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Or contact us at ${companyEmail} for any questions or modifications.
        </p>
    </div>

    <div class="footer">
        <p><strong>Thank you for considering our services!</strong></p>
        <p>This proposal is valid for 30 days from the date of issue.</p>
        <p>Generated on ${new Date().toLocaleDateString('en-PK')} at ${new Date().toLocaleTimeString('en-PK')}</p>
        
        <div style="margin-top: 20px;">
            <strong>${companyName}</strong><br>
            ${companyEmail} | ${companyPhone}<br>
            ${companyAddress}
        </div>
    </div>
</body>
</html>`;
}

/**
 * Send proposal to client
 */
function sendProposal(proposalId) {
  try {
    const proposal = getProposalById(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    
    const client = getClientById(proposal.ClientID);
    if (!client) {
      throw new Error('Client not found');
    }
    
    // Generate PDF if not already generated
    let pdfResult;
    if (!proposal.PDFURL) {
      pdfResult = generateProposalPDF(proposalId);
      if (!pdfResult.success) {
        throw new Error('Failed to generate PDF: ' + pdfResult.error);
      }
    }
    
    // Get PDF file
    const pdfFile = DriveApp.getFileById(pdfResult ? pdfResult.fileId : extractFileIdFromUrl(proposal.PDFURL));
    
    // Create email content
    const subject = `Proposal: ${proposal.Title}`;
    const body = createProposalEmailBody(proposal, client);
    
    // Send email with PDF attachment
    GmailApp.sendEmail(
      client.Email,
      subject,
      body,
      {
        attachments: [pdfFile.getBlob()],
        name: getSetting('COMPANY_NAME') || 'Your Business'
      }
    );
    
    // Update proposal status and sent date
    updateProposalStatus(proposalId, 'Sent', new Date());
    
    logActivity('Proposal', `Proposal sent to ${client.Email}: ${proposal.Title}`, proposalId);
    
    return { success: true, message: 'Proposal sent successfully' };
    
  } catch (error) {
    console.error('Error sending proposal:', error);
    logActivity('Proposal', `Failed to send proposal: ${error.message}`, proposalId, 'Error');
    return { success: false, error: error.message };
  }
}

/**
 * Create proposal email body
 */
function createProposalEmailBody(proposal, client) {
  const companyName = getSetting('COMPANY_NAME') || 'Your Business';
  const acceptanceUrl = proposal.AcceptanceURL;
  
  return `
Dear ${client.ContactName},

Thank you for considering ${companyName} for your project needs. Please find attached our proposal for "${proposal.Title}".

PROJECT SUMMARY:
${proposal.Description}

INVESTMENT: ${proposal.Currency} ${parseFloat(proposal.Amount).toLocaleString()}

To accept this proposal, please visit:
${acceptanceUrl}

This proposal is valid for 30 days. If you have any questions or would like to discuss the project further, please don't hesitate to reach out.

We look forward to the opportunity to work with you!

Best regards,
${companyName}
${getSetting('COMPANY_EMAIL')}
${getSetting('COMPANY_PHONE')}

---
This email was sent from our automated proposal system.
  `.trim();
}

/**
 * Get proposal by ID
 */
function getProposalById(proposalId) {
  const spreadsheet = getOrCreateSpreadsheet();
  const proposalsSheet = spreadsheet.getSheetByName(SHEETS.PROPOSALS);
  const data = proposalsSheet.getDataRange().getValues();
  
  if (data.length <= 1) return null;
  
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === proposalId) {
      const proposal = {};
      headers.forEach((header, index) => {
        proposal[header.replace(' ', '')] = data[i][index];
      });
      return proposal;
    }
  }
  return null;
}

/**
 * Update proposal PDF URL
 */
function updateProposalPdfUrl(proposalId, pdfUrl) {
  const spreadsheet = getOrCreateSpreadsheet();
  const proposalsSheet = spreadsheet.getSheetByName(SHEETS.PROPOSALS);
  const data = proposalsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === proposalId) {
      proposalsSheet.getRange(i + 1, 11).setValue(pdfUrl); // PDF URL column
      break;
    }
  }
}

/**
 * Update proposal status
 */
function updateProposalStatus(proposalId, status, sentDate = null) {
  const spreadsheet = getOrCreateSpreadsheet();
  const proposalsSheet = spreadsheet.getSheetByName(SHEETS.PROPOSALS);
  const data = proposalsSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === proposalId) {
      proposalsSheet.getRange(i + 1, 7).setValue(status); // Status column
      if (sentDate) {
        proposalsSheet.getRange(i + 1, 9).setValue(sentDate); // Sent Date column
      }
      break;
    }
  }
}

/**
 * Accept proposal (called from client-facing page)
 */
function acceptProposal(proposalId, clientSignature) {
  try {
    const proposal = getProposalById(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    
    if (proposal.Status === 'Accepted') {
      return { success: false, error: 'Proposal already accepted' };
    }
    
    // Update proposal status
    const spreadsheet = getOrCreateSpreadsheet();
    const proposalsSheet = spreadsheet.getSheetByName(SHEETS.PROPOSALS);
    const data = proposalsSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === proposalId) {
        proposalsSheet.getRange(i + 1, 7).setValue('Accepted'); // Status
        proposalsSheet.getRange(i + 1, 10).setValue(new Date()); // Accepted Date
        break;
      }
    }
    
    // Create project from accepted proposal
    const projectResult = createProjectFromProposal(proposal);
    
    // Send confirmation email
    sendProposalAcceptanceConfirmation(proposal);
    
    logActivity('Proposal', `Proposal accepted: ${proposal.Title}`, proposalId);
    
    return { 
      success: true, 
      message: 'Proposal accepted successfully',
      projectId: projectResult.projectId
    };
    
  } catch (error) {
    console.error('Error accepting proposal:', error);
    logActivity('Proposal', `Failed to accept proposal: ${error.message}`, proposalId, 'Error');
    return { success: false, error: error.message };
  }
}

/**
 * Create project from accepted proposal
 */
function createProjectFromProposal(proposal) {
  const projectId = generateId('PROJ');
  
  const spreadsheet = getOrCreateSpreadsheet();
  const projectsSheet = spreadsheet.getSheetByName(SHEETS.PROJECTS);
  
  // Create project folder
  const projectFolder = createProjectFolder(projectId, proposal.Title, proposal.ClientID);
  
  const newProject = [
    projectId,
    proposal.ProposalID,
    proposal.ClientID,
    proposal.Title,
    'Planning', // Initial status
    new Date(), // Start date
    '', // Due date (to be set later)
    '', // Completion date
    projectFolder.getId(),
    `Created from accepted proposal ${proposal.ProposalID}`
  ];
  
  projectsSheet.appendRow(newProject);
  
  logActivity('Project', `Project created from proposal: ${proposal.Title}`, projectId);
  
  return { success: true, projectId: projectId };
}

/**
 * Create project folder in Drive
 */
function createProjectFolder(projectId, projectTitle, clientId) {
  const rootFolderId = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID');
  const rootFolder = DriveApp.getFolderById(rootFolderId);
  
  // Get projects folder
  const projectsFolder = createSubfolder(rootFolder, 'Projects');
  
  // Create project folder
  const folderName = `${projectId} - ${projectTitle}`;
  const projectFolder = projectsFolder.createFolder(folderName);
  
  // Create project subfolders
  const subfolders = ['Documents', 'Assets', 'Deliverables', 'Communications'];
  subfolders.forEach(subfolder => {
    projectFolder.createFolder(subfolder);
  });
  
  // Also create shortcut in client folder
  try {
    const clientFolder = getClientFolder(clientId);
    if (clientFolder) {
      const clientProjectsFolder = createSubfolder(clientFolder, 'Projects');
      // Create a shortcut to the project folder
      DriveApp.createShortcut(projectFolder.getId()).moveTo(clientProjectsFolder);
    }
  } catch (error) {
    console.log('Could not create shortcut in client folder:', error.message);
  }
  
  return projectFolder;
}

/**
 * Get client folder by client ID
 */
function getClientFolder(clientId) {
  const client = getClientById(clientId);
  if (!client) return null;
  
  const rootFolderId = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID');
  const rootFolder = DriveApp.getFolderById(rootFolderId);
  const clientsFolder = createSubfolder(rootFolder, 'Clients');
  
  const folderName = `${clientId} - ${client.CompanyName}`;
  const folders = clientsFolder.getFoldersByName(folderName);
  
  return folders.hasNext() ? folders.next() : null;
}

/**
 * Send proposal acceptance confirmation
 */
function sendProposalAcceptanceConfirmation(proposal) {
  try {
    const client = getClientById(proposal.ClientID);
    if (!client) return;
    
    const subject = `Proposal Accepted - ${proposal.Title}`;
    const body = `
Dear ${client.ContactName},

Thank you for accepting our proposal for "${proposal.Title}"!

We're excited to work with you on this project. Here's what happens next:

1. We'll send you an invoice for the deposit (50% of project total)
2. Once payment is received, we'll begin work immediately
3. We'll keep you updated on progress throughout the project
4. Final payment will be due upon project completion

Project Details:
- Total Investment: ${proposal.Currency} ${parseFloat(proposal.Amount).toLocaleString()}
- Deposit Amount: ${proposal.Currency} ${(parseFloat(proposal.Amount) * 0.5).toLocaleString()}

If you have any questions, please don't hesitate to reach out.

Best regards,
${getSetting('COMPANY_NAME')}
    `.trim();
    
    GmailApp.sendEmail(
      client.Email,
      subject,
      body,
      { name: getSetting('COMPANY_NAME') || 'Your Business' }
    );
    
  } catch (error) {
    console.error('Error sending acceptance confirmation:', error);
  }
}

/**
 * Get proposal acceptance page
 */
function getProposalAcceptancePage(proposalId) {
  const proposal = getProposalById(proposalId);
  
  if (!proposal) {
    return HtmlService.createHtmlOutput('Proposal not found or has expired.');
  }
  
  if (proposal.Status === 'Accepted') {
    return HtmlService.createHtmlOutput(`
      <div style="text-align: center; font-family: Arial, sans-serif; margin: 50px;">
        <h2>Proposal Already Accepted</h2>
        <p>This proposal has already been accepted. Thank you for your business!</p>
      </div>
    `);
  }
  
  const client = getClientById(proposal.ClientID);
  
  const template = HtmlService.createTemplate(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Accept Proposal - ${proposal.Title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .proposal-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .amount { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .accept-btn { background: #27ae60; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; width: 100%; }
        .accept-btn:hover { background: #229954; }
        .terms { font-size: 12px; color: #666; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Project Proposal</h1>
          <p><strong>${proposal.Title}</strong></p>
        </div>
        
        <div class="proposal-details">
          <h3>Project Details</h3>
          <p><strong>Client:</strong> ${client ? client.CompanyName : 'Unknown'}</p>
          <p><strong>Description:</strong> ${proposal.Description}</p>
          <div class="amount">Investment: ${proposal.Currency} ${parseFloat(proposal.Amount).toLocaleString()}</div>
        </div>
        
        <form id="acceptForm" method="post">
          <input type="hidden" name="action" value="acceptProposal">
          <input type="hidden" name="proposalId" value="${proposalId}">
          
          <div style="margin: 20px 0;">
            <label>
              <input type="checkbox" required> I agree to the terms and conditions outlined in this proposal
            </label>
          </div>
          
          <button type="submit" class="accept-btn">Accept Proposal</button>
        </form>
        
        <div class="terms">
          By accepting this proposal, you agree to the terms and payment schedule outlined. 
          A deposit of 50% is required to begin work.
        </div>
      </div>
      
      <script>
        document.getElementById('acceptForm').onsubmit = function() {
          document.querySelector('.accept-btn').textContent = 'Processing...';
          document.querySelector('.accept-btn').disabled = true;
        };
      </script>
    </body>
    </html>
  `);
  
  return template.evaluate()
    .setTitle('Accept Proposal')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Get all proposals
 */
function getAllProposals() {
  const spreadsheet = getOrCreateSpreadsheet();
  const proposalsSheet = spreadsheet.getSheetByName(SHEETS.PROPOSALS);
  const data = proposalsSheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const headers = data[0];
  return data.slice(1).map(row => {
    const proposal = {};
    headers.forEach((header, index) => {
      proposal[header.replace(' ', '')] = row[index];
    });
    return proposal;
  });
}

/**
 * Extract file ID from Google Drive URL
 */
function extractFileIdFromUrl(url) {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Get web app URL
 */
function getWebAppUrl() {
  // This should be set after deployment
  return ScriptApp.getService().getUrl();
}