/**
 * Proposal Builder Functions
 * Handles proposal creation, PDF generation, and client communication
 */

/**
 * Create new proposal with enhanced debugging
 */
function createProposal(proposalData) {
  try {
    console.log('🚀 === CREATING NEW PROPOSAL ===');
    console.log('📝 Proposal Data:', proposalData);
    
    const spreadsheet = getSpreadsheet();
    const proposalsSheet = spreadsheet.getSheetByName(SHEETS.PROPOSALS);
    
    // Generate unique proposal ID
    const proposalId = generateId('PROP');
    console.log('🆔 Generated Proposal ID:', proposalId);
    
    // Generate acceptance URL
    const webAppUrl = getWebAppUrl();
    const acceptanceUrl = `${webAppUrl}?page=proposal&id=${proposalId}`;
    console.log('🔗 Acceptance URL:', acceptanceUrl);
    
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
    
    console.log('📊 Proposal Row Data:', newProposal);
    
    // Add to sheet
    proposalsSheet.appendRow(newProposal);
    console.log('✅ Proposal added to Google Sheets');
    
    // IMMEDIATELY try to generate PDF
    console.log('🔄 Starting PDF generation process...');
    const pdfResult = generateProposalPDF(proposalId);
    console.log('📄 PDF Generation Result:', pdfResult);
    
    // Log activity
    logActivity('Proposal', `New proposal created: ${proposalData.title}`, proposalId);
    console.log('📝 Activity logged');
    
    const result = {
      success: true,
      proposalId: proposalId,
      acceptanceUrl: acceptanceUrl,
      pdfResult: pdfResult
    };
    
    console.log('🎉 === PROPOSAL CREATION COMPLETE ===');
    console.log('Final Result:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ === PROPOSAL CREATION ERROR ===');
    console.error('Error creating proposal:', error);
    console.error('Error stack:', error.stack);
    
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
    console.log('📁 Setting up main proposals folder...');
    const rootFolder = getRootFolder();
    console.log(`✅ Root folder accessed: ${rootFolder.getName()}`);
    
    // Find or create main Proposals folder
    let proposalsFolder;
    const proposalsFolders = rootFolder.getFoldersByName('Proposals');
    
    if (!proposalsFolders.hasNext()) {
      console.log('❌ Main Proposals folder not found, creating it...');
      proposalsFolder = rootFolder.createFolder('Proposals');
      console.log(`✅ Created main Proposals folder: ${proposalsFolder.getName()}`);
    } else {
      proposalsFolder = proposalsFolders.next();
      console.log(`✅ Main Proposals folder found: ${proposalsFolder.getName()}`);
    }
    
    const fileName = `Proposal_${proposalId}_${proposal.Title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    console.log(`📄 Creating PDF file: ${fileName}`);
    console.log(`📁 Target folder: ${proposalsFolder.getName()} (${proposalsFolder.getId()})`);
    
    const pdfFile = proposalsFolder.createFile(pdfBlob.setName(fileName));
    console.log(`✅ PDF created successfully!`);
    console.log(`✅ PDF ID: ${pdfFile.getId()}`);
    console.log(`✅ PDF URL: ${pdfFile.getUrl()}`);
    
    // Update proposal with PDF URL
    updateProposalPdfUrl(proposalId, pdfFile.getUrl());
    
    // ENHANCED: Save to client folder with detailed debugging
    let clientFolderResult = null;
    try {
      console.log('🔄 === STARTING CLIENT FOLDER PDF COPY PROCESS ===');
      console.log(`🔍 Looking for client folder for: ${proposal.ClientID}`);
      console.log(`🔍 Client company name: ${client ? client.CompanyName : 'Unknown Client'}`);
      
      clientFolderResult = getClientProposalsFolder(proposal.ClientID, client ? client.CompanyName : 'Unknown Client');
      console.log('📁 Client folder search result:', clientFolderResult);
      
      if (clientFolderResult && clientFolderResult.success) {
        console.log('✅ Client folder found! Attempting to copy PDF...');
        console.log(`📁 Target proposals folder ID: ${clientFolderResult.proposalsFolderId}`);
        
        const clientProposalsFolder = DriveApp.getFolderById(clientFolderResult.proposalsFolderId);
        console.log(`📁 Proposals folder accessed: ${clientProposalsFolder.getName()}`);
        
        console.log(`📄 Copying PDF file: ${fileName}`);
        const clientPdfCopy = pdfFile.makeCopy(fileName, clientProposalsFolder);
        
        console.log(`✅ PDF successfully copied to client folder!`);
        console.log(`✅ Client PDF ID: ${clientPdfCopy.getId()}`);
        console.log(`✅ Client PDF URL: ${clientPdfCopy.getUrl()}`);
        console.log(`✅ Client Proposals Folder URL: ${clientProposalsFolder.getUrl()}`);
        
        clientFolderResult.clientPdfId = clientPdfCopy.getId();
        clientFolderResult.clientPdfUrl = clientPdfCopy.getUrl();
        
        // Verify the file was actually created
        const filesInFolder = clientProposalsFolder.getFilesByName(fileName);
        if (filesInFolder.hasNext()) {
          console.log('✅ VERIFICATION: PDF file confirmed in client folder');
        } else {
          console.log('❌ VERIFICATION: PDF file NOT found in client folder!');
        }
        
      } else {
        console.log('❌ Client folder search failed!');
        console.log('❌ Reason:', clientFolderResult ? clientFolderResult.error : 'No result returned');
        console.log('⚠️ PDF saved to main proposals folder only');
      }
    } catch (error) {
      console.error('❌ === CLIENT FOLDER PDF COPY ERROR ===');
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.log('⚠️ Fallback: PDF saved to main proposals folder only');
    }
    
    console.log('🔄 === CLIENT FOLDER PDF COPY PROCESS COMPLETE ===');
    
    logActivity('Proposal', `PDF generated for proposal: ${proposal.Title}`, proposalId);
    
    return {
      success: true,
      fileId: pdfFile.getId(),
      fileName: fileName,
      url: pdfFile.getUrl(),
      clientFolder: clientFolderResult
    };
    
  } catch (error) {
    console.error('Error generating proposal PDF:', error);
    logActivity('Proposal', `Failed to generate PDF: ${error.message}`, proposalId, 'Error');
    return { success: false, error: error.message };
  }
}

/**
 * Get client's proposals folder for saving PDF
 * ENHANCED version with better error handling and debugging
 */
function getClientProposalsFolder(clientId, clientName) {
  try {
    console.log('🔍 === FINDING CLIENT PROPOSALS FOLDER ===');
    console.log(`🔍 Client ID: ${clientId}`);
    console.log(`🔍 Client Name: ${clientName}`);
    
    // Step 1: Get root folder
    console.log('\n📁 Step 1: Accessing root folder...');
    const rootFolder = getRootFolder();
    console.log(`✅ Root folder: ${rootFolder.getName()} (ID: ${rootFolder.getId()})`);
    
    // Step 2: Find or create Clients folder
    console.log('\n📁 Step 2: Finding Clients folder...');
    let clientsFolder;
    const clientsFolders = rootFolder.getFoldersByName('Clients');
    
    if (!clientsFolders.hasNext()) {
      console.log('❌ Clients folder not found, creating it...');
      clientsFolder = rootFolder.createFolder('Clients');
      console.log(`✅ Created Clients folder: ${clientsFolder.getName()}`);
    } else {
      clientsFolder = clientsFolders.next();
      console.log(`✅ Clients folder found: ${clientsFolder.getName()}`);
    }
    
    // Step 3: Find or create client-specific folder
    console.log('\n📁 Step 3: Finding client-specific folder...');
    
    // Clean the client name for safe folder creation
    const safeClientName = clientName ? clientName.replace(/[^a-zA-Z0-9\s-_]/g, '').trim() : 'Unknown';
    
    // Try different folder name patterns that might exist
    const possibleClientFolderNames = [
      `${clientId} - ${safeClientName}`,  // Current standard
      `${safeClientName} (${clientId})`,  // Alternative format
      `${clientId}`,                      // Just ID
      `${safeClientName}`,                // Just name
      clientId,                           // Direct ID match
      clientName                          // Direct name match
    ];
    
    console.log('🔍 Searching for client folder with patterns:', possibleClientFolderNames);
    
    let clientFolder = null;
    let foundPattern = null;
    
    // Search for existing folder
    for (let pattern of possibleClientFolderNames) {
      if (!pattern) continue; // Skip empty patterns
      
      console.log(`🔍 Checking pattern: "${pattern}"`);
      const clientFolders = clientsFolder.getFoldersByName(pattern);
      
      if (clientFolders.hasNext()) {
        clientFolder = clientFolders.next();
        foundPattern = pattern;
        console.log(`✅ Found client folder: "${clientFolder.getName()}" using pattern: "${pattern}"`);
        break;
      }
    }
    
    // If not found, create new folder
    if (!clientFolder) {
      console.log('❌ Client folder not found in any pattern, creating new one...');
      const newFolderName = `${clientId} - ${safeClientName}`;
      console.log(`🔧 Creating folder: "${newFolderName}"`);
      
      clientFolder = clientsFolder.createFolder(newFolderName);
      console.log(`✅ Created client folder: ${clientFolder.getName()}`);
      
      // Create standard subfolders
      const subfolders = ['Proposals', 'Contracts', 'Projects', 'Invoices', 'Communications'];
      console.log('🔧 Creating subfolders:', subfolders);
      
      subfolders.forEach(subfolder => {
        try {
          const createdSubfolder = clientFolder.createFolder(subfolder);
          console.log(`✅ Created subfolder: ${subfolder} (ID: ${createdSubfolder.getId()})`);
        } catch (subError) {
          console.error(`❌ Failed to create subfolder ${subfolder}:`, subError.message);
        }
      });
    }
    
    // Step 4: Find or create Proposals subfolder
    console.log('\n📁 Step 4: Finding Proposals subfolder...');
    let proposalsFolder;
    const proposalsFolders = clientFolder.getFoldersByName('Proposals');
    
    if (proposalsFolders.hasNext()) {
      proposalsFolder = proposalsFolders.next();
      console.log(`✅ Proposals subfolder found: ${proposalsFolder.getName()}`);
    } else {
      console.log('❌ Proposals subfolder not found, creating it...');
      proposalsFolder = clientFolder.createFolder('Proposals');
      console.log(`✅ Created Proposals subfolder: ${proposalsFolder.getName()}`);
    }
    
    // Final result
    const result = {
      success: true,
      clientFolderId: clientFolder.getId(),
      proposalsFolderId: proposalsFolder.getId(),
      clientFolderName: clientFolder.getName(),
      proposalsFolderName: proposalsFolder.getName(),
      clientFolderUrl: clientFolder.getUrl(),
      proposalsFolderUrl: proposalsFolder.getUrl(),
      foundPattern: foundPattern,
      wasCreated: !foundPattern
    };
    
    console.log('\n✅ === CLIENT PROPOSALS FOLDER SUCCESS ===');
    console.log(`✅ Client Folder: ${result.clientFolderName} (${result.clientFolderId})`);
    console.log(`✅ Proposals Folder: ${result.proposalsFolderName} (${result.proposalsFolderId})`);
    console.log(`✅ Client URL: ${result.clientFolderUrl}`);
    console.log(`✅ Proposals URL: ${result.proposalsFolderUrl}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ === CLIENT PROPOSALS FOLDER ERROR ===');
    console.error('❌ Error finding client proposals folder:', error);
    console.error('❌ Error stack:', error.stack);
    
    return {
      success: false,
      error: error.message,
      stack: error.stack,
      clientId: clientId,
      clientName: clientName
    };
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
        /* OPTIMIZED FOR 2 PAGES MAXIMUM */
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 0; 
            padding: 15px; 
            color: #333; 
            line-height: 1.4; 
            font-size: 12px;
            background: white;
        }
        
        .proposal-header { 
            background: linear-gradient(135deg, #2c5aa0, #1e4080); 
            color: white; 
            padding: 20px; 
            margin-bottom: 20px; 
            border-radius: 8px;
            text-align: center;
        }
        .proposal-title { 
            font-size: 24px; 
            margin: 0; 
            font-weight: bold; 
            letter-spacing: 1px;
        }
        .proposal-subtitle { 
            font-size: 13px; 
            margin: 8px 0 0 0; 
            opacity: 0.9; 
        }
        
        .header-info {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
        }
        .company-section, .client-section {
            width: 48%;
        }
        .company-name { 
            font-size: 16px; 
            color: #2c5aa0; 
            margin-bottom: 8px; 
            font-weight: bold; 
        }
        .contact-info { 
            font-size: 11px; 
            line-height: 1.3;
        }
        
        .section { 
            margin: 15px 0; 
            padding: 12px; 
            background: #fdfdfd; 
            border-radius: 6px; 
            border-left: 3px solid #2c5aa0;
            page-break-inside: avoid;
        }
        .section h3 { 
            color: #2c5aa0; 
            margin: 0 0 8px 0; 
            font-size: 14px;
            font-weight: bold;
        }
        .section h4 { 
            color: #333; 
            margin: 8px 0 6px 0; 
            font-size: 13px;
            font-weight: bold;
        }
        .section p { 
            margin: 6px 0; 
            font-size: 12px;
        }
        
        .two-column {
            display: flex;
            justify-content: space-between;
            gap: 15px;
        }
        .column {
            width: 48%;
        }
        
        .amount-highlight { 
            font-size: 20px; 
            font-weight: bold; 
            color: #2c5aa0; 
            text-align: center; 
            background: #fff3cd; 
            padding: 12px; 
            margin: 10px 0; 
            border-radius: 6px; 
            border: 2px solid #ffc107;
        }
        
        .compact-list {
            margin: 8px 0;
            padding-left: 15px;
        }
        .compact-list li {
            margin: 4px 0;
            font-size: 11px;
            line-height: 1.3;
        }
        
        .highlight-box {
            background: #e8f4fd;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            border-left: 3px solid #007bff;
        }
        
        .cta-section { 
            text-align: center; 
            margin: 20px 0 15px 0;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
        }
        .accept-button { 
            background: #28a745; 
            color: white; 
            padding: 10px 20px; 
            font-size: 14px; 
            text-decoration: none; 
            border-radius: 4px; 
            display: inline-block;
            font-weight: bold;
        }
        
        .footer { 
            margin-top: 20px; 
            text-align: center; 
            font-size: 10px; 
            color: #666; 
            border-top: 1px solid #ddd; 
            padding-top: 15px;
        }
        
        .payment-grid {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            margin: 10px 0;
        }
        .payment-item {
            background: #d4edda;
            padding: 8px;
            border-radius: 4px;
            font-size: 11px;
            text-align: center;
            flex: 1;
        }
        
        /* Print optimization */
        @media print {
            body { font-size: 11px; }
            .section { margin: 10px 0; padding: 8px; }
        }
    </style>
</head>
<body>
    <div class="proposal-header">
        <h1 class="proposal-title">BUSINESS PROPOSAL</h1>
        <div class="proposal-subtitle">Proposal #${proposal.ProposalID} | ${new Date(proposal.CreatedDate).toLocaleDateString('en-PK')}</div>
    </div>

    <div class="header-info">
        <div class="company-section">
            <h2 class="company-name">${companyName}</h2>
            <div class="contact-info">
                📍 ${companyAddress}<br>
                📧 ${companyEmail}<br>
                📞 ${companyPhone}
            </div>
        </div>
        <div class="client-section">
            <h3 style="color: #2c5aa0; margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">👤 Prepared For</h3>
            <p style="margin: 4px 0; font-weight: bold;">${companyClientName}</p>
            <p style="margin: 4px 0; font-size: 11px;">Attention: ${clientName}</p>
        </div>
    </div>

    <div class="section">
        <h3>🎯 ${proposal.Title}</h3>
        <p>${proposal.Description.replace(/\n/g, '<br>')}</p>
        
        <div class="amount-highlight">
            Total Investment: ${currencySymbol} ${formattedAmount}
        </div>
    </div>

    <div class="two-column">
        <div class="column">
            <div class="section">
                <h3>📋 What's Included</h3>
                <ul class="compact-list">
                    <li>Complete project development as specified</li>
                    <li>Regular progress updates and communication</li>
                    <li>Quality assurance and testing</li>
                    <li>Post-delivery support (30 days)</li>
                    <li>Source files and documentation</li>
                </ul>
            </div>
        </div>
        <div class="column">
            <div class="section">
                <h3>⏰ Project Timeline</h3>
                <div class="highlight-box">
                    <strong>Estimated Completion:</strong><br>
                    ${new Date(Date.now() + 14*24*60*60*1000).toLocaleDateString('en-PK')}
                </div>
                <ul class="compact-list">
                    <li>Requirements gathering (1-2 days)</li>
                    <li>Development and implementation</li>
                    <li>Testing and quality assurance</li>
                    <li>Final delivery and documentation</li>
                </ul>
            </div>
        </div>
    </div>

    <div class="section">
        <h3>💳 Payment & Terms</h3>
        <div class="two-column">
            <div class="column">
                <p><strong>Payment Structure:</strong></p>
                <ul class="compact-list">
                    <li>50% advance to start project</li>
                    <li>50% upon completion</li>
                </ul>
                <div class="payment-grid">
                    <div class="payment-item">💳 JazzCash</div>
                    <div class="payment-item">💳 EasyPaisa</div>
                    <div class="payment-item">🏦 Bank Transfer</div>
                </div>
            </div>
            <div class="column">
                <p><strong>Why Choose Us:</strong></p>
                <ul class="compact-list">
                    <li><strong>Quality Assured</strong> - High-quality work guaranteed</li>
                    <li><strong>Timely Delivery</strong> - We respect deadlines</li>
                    <li><strong>Clear Communication</strong> - Regular updates</li>
                    <li><strong>Local Expertise</strong> - Pakistani market knowledge</li>
                    <li><strong>Ongoing Support</strong> - Post-delivery assistance</li>
                </ul>
            </div>
        </div>
    </div>

    <div class="cta-section">
        <h3 style="color: #2c5aa0; margin-bottom: 10px; font-size: 16px;">Ready to Get Started?</h3>
        <a href="${getWebAppUrl()}?action=accept&proposalId=${proposal.ProposalID}" class="accept-button">
            ✅ Accept Proposal & Start Project
        </a>
        <p style="margin-top: 10px; font-size: 11px; color: #666;">
            Contact us at ${companyEmail} for questions or modifications.
        </p>
    </div>

    <div class="footer">
        <p><strong>Thank you for considering our services!</strong> | Valid for 30 days</p>
        <p>Generated: ${new Date().toLocaleDateString('en-PK')} at ${new Date().toLocaleTimeString('en-PK')}</p>
        <p><strong>${companyName}</strong> | ${companyEmail} | ${companyPhone}</p>
    </div>
</body>
</html>`;
}

/**
 * Send proposal to client via email with automatic sheet updates
 */
function sendProposalToClient(proposalId, emailMessage = '') {
  try {
    console.log('📧 === SENDING PROPOSAL TO CLIENT ===');
    console.log('Proposal ID:', proposalId);
    
    const proposal = getProposalById(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    console.log('✅ Proposal found:', proposal.Title);
    
    const client = getClientById(proposal.ClientID);
    if (!client) {
      throw new Error('Client not found');
    }
    console.log('✅ Client found:', client.ContactName, '-', client.Email);
    
    // Generate PDF if not already generated
    let pdfFileId = null;
    if (!proposal.PDFURL || proposal.PDFURL === '') {
      console.log('📄 PDF not found, generating...');
      const pdfResult = generateProposalPDF(proposalId);
      if (!pdfResult.success) {
        throw new Error('Failed to generate PDF: ' + pdfResult.error);
      }
      pdfFileId = pdfResult.fileId;
      console.log('✅ PDF generated:', pdfFileId);
    } else {
      pdfFileId = extractFileIdFromUrl(proposal.PDFURL);
      console.log('✅ Using existing PDF:', pdfFileId);
    }
    
    // Get PDF file
    const pdfFile = DriveApp.getFileById(pdfFileId);
    console.log('📄 PDF file accessed:', pdfFile.getName());
    
    // Create personalized email content
    const subject = `📄 Business Proposal: ${proposal.Title} - ${getSetting('COMPANY_NAME')}`;
    const emailBody = createDetailedProposalEmail(proposal, client, emailMessage);
    
    // Send email with PDF attachment
    console.log('📧 Sending email to:', client.Email);
    GmailApp.sendEmail(
      client.Email,
      subject,
      '', // Plain text body (empty because we're using HTML)
      {
        htmlBody: emailBody,
        attachments: [pdfFile.getBlob()],
        name: getSetting('COMPANY_NAME') || 'Professional Services',
        replyTo: getSetting('COMPANY_EMAIL')
      }
    );
    
    // AUTOMATICALLY UPDATE SHEET: Sent Date + Status
    console.log('📊 Updating proposal sheet...');
    updateProposalStatus(proposalId, 'Sent', new Date());
    console.log('✅ Proposal status updated to "Sent"');
    
    // Log the activity
    logActivity('Proposal', `Proposal sent to ${client.Email}: ${proposal.Title}`, proposalId);
    
    console.log('🎉 === PROPOSAL SENT SUCCESSFULLY ===');
    return { 
      success: true, 
      message: 'Proposal sent successfully and sheet updated automatically',
      clientEmail: client.Email,
      sentDate: new Date().toLocaleString('en-PK')
    };
    
  } catch (error) {
    console.error('❌ === PROPOSAL SENDING ERROR ===');
    console.error('Error sending proposal:', error);
    console.error('Error stack:', error.stack);
    
    logActivity('Proposal', `Failed to send proposal: ${error.message}`, proposalId, 'Error');
    return { success: false, error: error.message };
  }
}

/**
 * Create detailed HTML email for proposal
 */
function createDetailedProposalEmail(proposal, client, personalMessage = '') {
  const companyName = getSetting('COMPANY_NAME') || 'Professional Services';
  const companyEmail = getSetting('COMPANY_EMAIL') || 'contact@company.com';
  const companyPhone = getSetting('COMPANY_PHONE') || '+92-XXX-XXXXXXX';
  const acceptanceUrl = proposal.AcceptanceURL;
  const currencySymbol = getSetting('CURRENCY_SYMBOL') || 'Rs.';
  const formattedAmount = parseFloat(proposal.Amount).toLocaleString('en-PK');
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #2c5aa0, #1e4080); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
        .content { padding: 20px; background: #f9f9f9; border-radius: 8px; margin-bottom: 20px; }
        .highlight { background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .amount { font-size: 24px; font-weight: bold; color: #2c5aa0; text-align: center; }
        .button { background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; font-size: 14px; color: #666; }
        .personal-message { background: #e8f4fd; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${companyName}</h1>
        <p>Professional Business Proposal</p>
    </div>
    
    <div class="content">
        <h2>Dear ${client.ContactName},</h2>
        
        <p>Assalam-o-Alaikum! We hope you are doing well.</p>
        
        <p>We are pleased to present our business proposal for <strong>"${proposal.Title}"</strong>. We have carefully reviewed your requirements and prepared a comprehensive solution that meets your needs.</p>
        
        ${personalMessage ? `<div class="personal-message"><strong>Personal Message:</strong><br>${personalMessage}</div>` : ''}
        
        <div class="highlight">
            <h3>📋 Project Overview:</h3>
            <p><strong>Project:</strong> ${proposal.Title}</p>
            <p><strong>Description:</strong> ${proposal.Description.substring(0, 200)}${proposal.Description.length > 200 ? '...' : ''}</p>
            <div class="amount">Investment: ${currencySymbol} ${formattedAmount}</div>
        </div>
        
        <h3>📎 What's Included:</h3>
        <ul>
            <li>✅ <strong>Detailed Proposal PDF</strong> - Attached to this email</li>
            <li>✅ <strong>Complete Project Specifications</strong></li>
            <li>✅ <strong>Timeline and Milestones</strong></li>
            <li>✅ <strong>Payment Terms</strong> (JazzCash, EasyPaisa, Bank Transfer)</li>
            <li>✅ <strong>Professional Support</strong> throughout the project</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptanceUrl}" class="button">
                ✅ REVIEW & ACCEPT PROPOSAL
            </a>
            <p style="font-size: 14px; color: #666;">Click the button above to review and accept this proposal online</p>
        </div>
        
        <h3>💡 Next Steps:</h3>
        <ol>
            <li><strong>Review</strong> the attached PDF proposal carefully</li>
            <li><strong>Contact us</strong> if you have any questions or need modifications</li>
            <li><strong>Click "Accept Proposal"</strong> button above to proceed</li>
            <li><strong>Start the project</strong> - We'll begin immediately after acceptance</li>
        </ol>
        
        <p>We understand that choosing the right partner is important for your business. We're committed to delivering high-quality work on time and within budget.</p>
        
        <p><strong>This proposal is valid for 30 days.</strong> We recommend accepting it soon to secure your project timeline.</p>
    </div>
    
    <div class="footer">
        <p><strong>Need to discuss? We're here to help!</strong></p>
        <p>📧 Email: ${companyEmail}</p>
        <p>📞 Phone: ${companyPhone}</p>
        <p>💬 WhatsApp: Available for quick questions</p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        
        <p><strong>${companyName}</strong><br>
        Professional Services for Modern Businesses</p>
        <p style="font-size: 12px;">This is an automated email. Please do not reply directly to this message.</p>
    </div>
</body>
</html>`;
}

/**
 * Send acceptance notification to business owner
 */
function sendAcceptanceNotification(proposalId) {
  try {
    console.log('🔔 === SENDING ACCEPTANCE NOTIFICATION ===');
    
    const proposal = getProposalById(proposalId);
    const client = getClientById(proposal.ClientID);
    const ownerEmail = getSetting('COMPANY_EMAIL') || getSetting('OWNER_EMAIL');
    const companyName = getSetting('COMPANY_NAME') || 'Your Business';
    
    if (!ownerEmail) {
      console.log('⚠️ No owner email set, skipping notification');
      return { success: false, error: 'No owner email configured' };
    }
    
    const subject = `🎉 PROPOSAL ACCEPTED! ${proposal.Title} - ${client.CompanyName}`;
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .success { background: #d4edda; padding: 20px; border-radius: 8px; border-left: 5px solid #28a745; }
        .details { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="success">
        <h2>🎉 Congratulations! A proposal has been accepted!</h2>
    </div>
    
    <div class="details">
        <h3>📋 Proposal Details:</h3>
        <p><strong>Proposal ID:</strong> ${proposal.ProposalID}</p>
        <p><strong>Project Title:</strong> ${proposal.Title}</p>
        <p><strong>Amount:</strong> ${proposal.Currency} ${parseFloat(proposal.Amount).toLocaleString('en-PK')}</p>
        <p><strong>Accepted Date:</strong> ${new Date().toLocaleString('en-PK')}</p>
    </div>
    
    <div class="details">
        <h3>👤 Client Information:</h3>
        <p><strong>Company:</strong> ${client.CompanyName}</p>
        <p><strong>Contact:</strong> ${client.ContactName}</p>
        <p><strong>Email:</strong> ${client.Email}</p>
        <p><strong>Phone:</strong> ${client.Phone}</p>
    </div>
    
    <div class="details">
        <h3>🚀 Next Steps:</h3>
        <ul>
            <li>✅ Project has been automatically created</li>
            <li>📁 Client folder structure is ready</li>
            <li>📧 Client has been sent acceptance confirmation</li>
            <li>💼 You can now start working on the project</li>
        </ul>
    </div>
    
    <p>Log in to your dashboard to manage this project: <a href="${getWebAppUrl()}">Open Dashboard</a></p>
    
    <hr>
    <p><strong>${companyName}</strong> - Automated Project Management System</p>
</body>
</html>`;
    
    GmailApp.sendEmail(
      ownerEmail,
      subject,
      '',
      {
        htmlBody: emailBody,
        name: companyName + ' - System Notification'
      }
    );
    
    console.log('✅ Acceptance notification sent to:', ownerEmail);
    return { success: true, message: 'Notification sent to business owner' };
    
  } catch (error) {
    console.error('❌ Error sending acceptance notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Enhanced accept proposal function with notifications
 */
function acceptProposalEnhanced(proposalId, clientSignature = '') {
  try {
    console.log('🎯 === ENHANCED PROPOSAL ACCEPTANCE ===');
    console.log('Proposal ID:', proposalId);
    
    const proposal = getProposalById(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    
    if (proposal.Status === 'Accepted') {
      return { success: false, error: 'Proposal already accepted' };
    }
    
    // AUTOMATICALLY UPDATE SHEET: Accepted Date + Status
    console.log('📊 Updating proposal status to Accepted...');
    const spreadsheet = getSpreadsheet();
    const proposalsSheet = spreadsheet.getSheetByName(SHEETS.PROPOSALS);
    const data = proposalsSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === proposalId) {
        proposalsSheet.getRange(i + 1, 7).setValue('Accepted'); // Status column
        proposalsSheet.getRange(i + 1, 10).setValue(new Date()); // Accepted Date column
        console.log('✅ Proposal sheet updated with acceptance');
        break;
      }
    }
    
    // Create project automatically
    console.log('🚀 Creating project from proposal...');
    const projectResult = createProjectFromProposal(proposal);
    console.log('✅ Project created:', projectResult.projectId);
    
    // Send confirmation to client
    console.log('📧 Sending confirmation to client...');
    sendProposalAcceptanceConfirmation(proposal);
    
    // Send notification to business owner
    console.log('🔔 Sending notification to business owner...');
    sendAcceptanceNotification(proposalId);
    
    // Log activity
    logActivity('Proposal', `Proposal accepted: ${proposal.Title}`, proposalId);
    console.log('📝 Activity logged');
    
    console.log('🎉 === PROPOSAL ACCEPTANCE COMPLETE ===');
    return { 
      success: true, 
      message: 'Proposal accepted successfully! Project created and notifications sent.',
      projectId: projectResult.projectId,
      acceptedDate: new Date().toLocaleString('en-PK')
    };
    
  } catch (error) {
    console.error('❌ === PROPOSAL ACCEPTANCE ERROR ===');
    console.error('Error accepting proposal:', error);
    console.error('Error stack:', error.stack);
    
    logActivity('Proposal', `Failed to accept proposal: ${error.message}`, proposalId, 'Error');
    return { success: false, error: error.message };
  }
}

/**
 * Get proposal by ID
 */
function getProposalById(proposalId) {
  const spreadsheet = getSpreadsheet();
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
  const spreadsheet = getSpreadsheet();
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
  const spreadsheet = getSpreadsheet();
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
 * Extract file ID from Google Drive URL
 */
function extractFileIdFromUrl(url) {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Create project from accepted proposal with enhanced error handling
 */
function createProjectFromProposal(proposal) {
  try {
    console.log('🚀 === CREATING PROJECT FROM PROPOSAL ===');
    console.log('Proposal:', proposal.Title);
    console.log('Client ID:', proposal.ClientID);
    
    const projectId = generateId('PROJ');
    console.log('✅ Generated Project ID:', projectId);
    
    const spreadsheet = getSpreadsheet();
    const projectsSheet = spreadsheet.getSheetByName(SHEETS.PROJECTS);
    console.log('✅ Projects sheet accessed');
    
    // Create project folder with error handling
    let projectFolderId = '';
    let projectFolderUrl = '';
    
    try {
      console.log('📁 Creating project folder...');
      const projectFolder = createProjectFolder(projectId, proposal.Title, proposal.ClientID);
      projectFolderId = projectFolder.getId();
      projectFolderUrl = projectFolder.getUrl();
      console.log('✅ Project folder created:', projectFolderId);
    } catch (folderError) {
      console.error('⚠️ Project folder creation failed:', folderError.message);
      console.log('⚠️ Continuing with project creation without folder...');
      projectFolderId = 'ERROR_CREATING_FOLDER';
      projectFolderUrl = 'Folder creation failed';
    }
    
    const newProject = [
      projectId,
      proposal.ProposalID,
      proposal.ClientID,
      proposal.Title,
      'Planning', // Initial status
      new Date(), // Start date
      '', // Due date (to be set later)
      '', // Completion date
      projectFolderId,
      `Created from accepted proposal ${proposal.ProposalID}${projectFolderId === 'ERROR_CREATING_FOLDER' ? ' (Folder creation failed)' : ''}`
    ];
    
    console.log('📊 Adding project to sheet...');
    projectsSheet.appendRow(newProject);
    console.log('✅ Project added to sheet');
    
    logActivity('Project', `Project created from proposal: ${proposal.Title}`, projectId);
    console.log('📝 Activity logged');
    
    console.log('🎉 === PROJECT CREATION COMPLETE ===');
    return { 
      success: true, 
      projectId: projectId,
      projectFolderId: projectFolderId,
      projectFolderUrl: projectFolderUrl,
      folderCreated: projectFolderId !== 'ERROR_CREATING_FOLDER'
    };
    
  } catch (error) {
    console.error('❌ === PROJECT CREATION ERROR ===');
    console.error('Error creating project from proposal:', error);
    console.error('Error stack:', error.stack);
    
    return { 
      success: false, 
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Create project folder in Drive with enhanced error handling
 */
function createProjectFolder(projectId, projectTitle, clientId) {
  try {
    console.log('🚀 === CREATING PROJECT FOLDER ===');
    console.log('Project ID:', projectId);
    console.log('Project Title:', projectTitle);
    console.log('Client ID:', clientId);
    
    // Get root folder with enhanced error handling
    const rootFolder = getRootFolder();
    console.log('✅ Root folder accessed:', rootFolder.getName());
    
    // Get projects folder
    const projectsFolder = createSubfolder(rootFolder, 'Projects');
    console.log('✅ Projects folder accessed:', projectsFolder.getName());
    
    // Create project folder with safe name
    const safeTitle = projectTitle.replace(/[^a-zA-Z0-9\s-_]/g, '').trim();
    const folderName = `${projectId} - ${safeTitle}`;
    console.log('📁 Creating project folder:', folderName);
    
    const projectFolder = projectsFolder.createFolder(folderName);
    console.log('✅ Project folder created:', projectFolder.getName());
    
    // Create project subfolders
    const subfolders = ['Documents', 'Assets', 'Deliverables', 'Communications'];
    console.log('📁 Creating project subfolders...');
    subfolders.forEach(subfolder => {
      projectFolder.createFolder(subfolder);
      console.log(`  ✅ Created: ${subfolder}`);
    });
    
    // Also create shortcut in client folder
    try {
      console.log('🔗 Creating shortcut in client folder...');
      const clientFolder = getClientFolder(clientId);
      if (clientFolder) {
        const clientProjectsFolder = createSubfolder(clientFolder, 'Projects');
        // Create a shortcut to the project folder
        DriveApp.createShortcut(projectFolder.getId()).moveTo(clientProjectsFolder);
        console.log('✅ Shortcut created in client Projects folder');
      } else {
        console.log('⚠️ Client folder not found, skipping shortcut creation');
      }
    } catch (error) {
      console.log('⚠️ Could not create shortcut in client folder:', error.message);
    }
    
    console.log('🎉 === PROJECT FOLDER CREATION COMPLETE ===');
    console.log('✅ Project Folder ID:', projectFolder.getId());
    console.log('✅ Project Folder URL:', projectFolder.getUrl());
    
    return projectFolder;
    
  } catch (error) {
    console.error('❌ === PROJECT FOLDER CREATION ERROR ===');
    console.error('Error creating project folder:', error);
    console.error('Error stack:', error.stack);
    
    // Return a dummy folder object to prevent further errors
    // In real implementation, we might want to create in a fallback location
    throw new Error(`Failed to create project folder: ${error.message}`);
  }
}

/**
 * Get client folder by client ID with enhanced error handling
 */
function getClientFolder(clientId) {
  try {
    console.log('🔍 Getting client folder for:', clientId);
    
    const client = getClientById(clientId);
    if (!client) {
      console.log('❌ Client not found:', clientId);
      return null;
    }
    
    console.log('✅ Client found:', client.CompanyName);
    
    const rootFolder = getRootFolder();
    const clientsFolder = createSubfolder(rootFolder, 'Clients');
    
    const folderName = `${clientId} - ${client.CompanyName}`;
    console.log('🔍 Looking for client folder:', folderName);
    
    const folders = clientsFolder.getFoldersByName(folderName);
    
    if (folders.hasNext()) {
      const clientFolder = folders.next();
      console.log('✅ Client folder found:', clientFolder.getName());
      return clientFolder;
    } else {
      console.log('❌ Client folder not found:', folderName);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error getting client folder:', error);
    return null;
  }
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
 * Get proposal acceptance page - ABSOLUTELY MINIMAL VERSION
 * NO JavaScript whatsoever to avoid serialization errors
 */
function getProposalAcceptancePage(proposalId) {
  const proposal = getProposalById(proposalId);
  
  if (!proposal) {
    return HtmlService.createHtmlOutput('<h1>Proposal not found or has expired.</h1>');
  }
  
  if (proposal.Status === 'Accepted') {
    return HtmlService.createHtmlOutput('<h1>Proposal Already Accepted</h1><p>Thank you for your business!</p>');
  }
  
  // Build completely static HTML - NO JavaScript, NO dynamic content that could cause serialization issues
  const html = [
    '<html>',
    '<head>',
    '<title>Accept Proposal</title>',
    '<style>',
    'body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }',
    '.container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }',
    '.amount { font-size: 24px; font-weight: bold; color: #2c3e50; margin: 20px 0; }',
    '.accept-btn { background: #27ae60; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px; width: 100%; cursor: pointer; }',
    '</style>',
    '</head>',
    '<body>',
    '<div class="container">',
    '<h1>Project Proposal</h1>',
    '<h2>' + String(proposal.Title || 'Project Proposal') + '</h2>',
    '<div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">',
    '<h3>Project Details</h3>',
    '<p><strong>Description:</strong> ' + String(proposal.Description || 'Project description') + '</p>',
    '<div class="amount">Investment: ' + String(proposal.Currency || 'PKR') + ' ' + String(parseFloat(proposal.Amount || 0).toLocaleString()) + '</div>',
    '</div>',
    '<form method="post" action="">',
    '<input type="hidden" name="action" value="acceptProposal">',
    '<input type="hidden" name="proposalId" value="' + String(proposalId) + '">',
    '<input type="hidden" name="clientSignature" value="Digital Acceptance">',
    '<div style="margin: 20px 0;">',
    '<label>',
    '<input type="checkbox" required> I agree to the terms and conditions',
    '</label>',
    '</div>',
    '<button type="submit" class="accept-btn">Accept Proposal</button>',
    '</form>',
    '<p style="font-size: 12px; color: #666; margin-top: 20px;">By accepting this proposal, you agree to the terms and payment schedule.</p>',
    '</div>',
    '</body>',
    '</html>'
  ].join('');
  
  return HtmlService.createHtmlOutput(html);
}

/**
 * Get all proposals
 */
function getAllProposals() {
  const spreadsheet = getSpreadsheet();
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