/**
 * Invoice Management Functions
 * Handles invoice creation, PDF generation, payment tracking, and reminders
 */

/**
 * Create new invoice
 */
function createInvoice(invoiceData) {
  try {
    const spreadsheet = getOrCreateSpreadsheet();
    const invoicesSheet = spreadsheet.getSheetByName(SHEETS.INVOICES);
    
    // Generate unique invoice ID
    const invoiceId = generateId('INV');
    
    // Calculate due date if not provided
    const issueDate = new Date();
    const paymentTermsDays = parseInt(getSetting('PAYMENT_TERMS_DAYS')) || 30;
    const dueDate = invoiceData.dueDate ? new Date(invoiceData.dueDate) : 
                   new Date(issueDate.getTime() + paymentTermsDays * 24 * 60 * 60 * 1000);
    
    // Generate payment link
    const paymentLink = generatePaymentLink(invoiceId, invoiceData.amount, invoiceData.currency);
    
    // Prepare invoice data
    const newInvoice = [
      invoiceId,
      invoiceData.projectId || '',
      invoiceData.clientId || '',
      parseFloat(invoiceData.amount) || 0,
      invoiceData.currency || getSetting('DEFAULT_CURRENCY') || 'USD',
      issueDate,
      dueDate,
      'Draft',
      '', // Payment Date
      '', // PDF URL
      paymentLink
    ];
    
    // Add to sheet
    invoicesSheet.appendRow(newInvoice);
    
    // Log activity
    logActivity('Invoice', `New invoice created: ${invoiceId}`, invoiceId);
    
    return {
      success: true,
      invoiceId: invoiceId,
      paymentLink: paymentLink
    };
    
  } catch (error) {
    console.error('Error creating invoice:', error);
    logActivity('Invoice', `Failed to create invoice: ${error.message}`, '', 'Error');
    return { success: false, error: error.message };
  }
}

/**
 * Generate invoice PDF
 */
function generateInvoicePDF(invoiceId) {
  try {
    const invoice = getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    const client = getClientById(invoice.ClientID);
    if (!client) {
      throw new Error('Client not found');
    }
    
    let project = null;
    if (invoice.ProjectID) {
      project = getProjectById(invoice.ProjectID);
    }
    
    // Create HTML content for PDF
    const htmlContent = createInvoiceHTML(invoice, client, project);
    
    // Convert HTML to PDF
    const pdfBlob = Utilities.newBlob(htmlContent, 'text/html')
      .getAs('application/pdf');
    
    // Save PDF to Drive
    const rootFolderId = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID');
    const rootFolder = DriveApp.getFolderById(rootFolderId);
    const invoicesFolder = createSubfolder(rootFolder, 'Invoices');
    
    const fileName = `Invoice_${invoiceId}_${new Date(invoice.IssueDate).getFullYear()}_${String(new Date(invoice.IssueDate).getMonth() + 1).padStart(2, '0')}.pdf`;
    const pdfFile = invoicesFolder.createFile(pdfBlob.setName(fileName));
    
    // Update invoice with PDF URL
    updateInvoicePdfUrl(invoiceId, pdfFile.getUrl());
    
    // Also save to client folder
    try {
      const clientFolder = getClientFolder(invoice.ClientID);
      if (clientFolder) {
        const clientInvoicesFolder = createSubfolder(clientFolder, 'Invoices');
        pdfFile.makeCopy(fileName, clientInvoicesFolder);
      }
    } catch (error) {
      console.log('Could not save to client folder:', error.message);
    }
    
    logActivity('Invoice', `PDF generated for invoice: ${invoiceId}`, invoiceId);
    
    return {
      success: true,
      fileId: pdfFile.getId(),
      fileName: fileName,
      url: pdfFile.getUrl()
    };
    
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    logActivity('Invoice', `Failed to generate PDF: ${error.message}`, invoiceId, 'Error');
    return { success: false, error: error.message };
  }
}

/**
 * Create HTML content for invoice PDF
 */
function createInvoiceHTML(invoice, client, project) {
  const companyName = getSetting('COMPANY_NAME') || 'Your Business';
  const companyEmail = getSetting('COMPANY_EMAIL') || 'your-email@gmail.com';
  const companyPhone = getSetting('COMPANY_PHONE') || '+1-234-567-8900';
  const companyAddress = getSetting('COMPANY_ADDRESS') || 'Your Business Address';
  
  const issueDate = new Date(invoice.IssueDate).toLocaleDateString();
  const dueDate = new Date(invoice.DueDate).toLocaleDateString();
  
  // Calculate tax (if applicable) - set to 0 for now, can be configured
  const subtotal = parseFloat(invoice.Amount);
  const taxRate = 0; // Could be a setting
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice - ${invoice.InvoiceID}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .invoice-title { font-size: 36px; font-weight: bold; color: #2c3e50; }
        .invoice-number { font-size: 18px; color: #7f8c8d; margin-top: 10px; }
        .company-info { text-align: right; }
        .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
        .bill-to { margin-bottom: 30px; }
        .bill-to h3 { color: #2c3e50; margin-bottom: 10px; }
        .invoice-details { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .amount-column { text-align: right; }
        .total-section { margin-top: 30px; text-align: right; }
        .total-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .total-label { font-weight: bold; }
        .grand-total { font-size: 20px; font-weight: bold; color: #2c3e50; border-top: 2px solid #2c3e50; padding-top: 10px; }
        .payment-info { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 30px 0; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #7f8c8d; }
        .status { display: inline-block; padding: 5px 15px; border-radius: 15px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .status-draft { background-color: #f8d7da; color: #721c24; }
        .status-sent { background-color: #fff3cd; color: #856404; }
        .status-paid { background-color: #d4edda; color: #155724; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-number"># ${invoice.InvoiceID}</div>
          <div class="status status-${invoice.Status.toLowerCase()}">${invoice.Status}</div>
        </div>
        <div class="company-info">
          <div class="company-name">${companyName}</div>
          <div>${companyAddress}</div>
          <div>Email: ${companyEmail}</div>
          <div>Phone: ${companyPhone}</div>
        </div>
      </div>
      
      <div class="bill-to">
        <h3>Bill To:</h3>
        <strong>${client.CompanyName}</strong><br>
        Attention: ${client.ContactName}<br>
        Email: ${client.Email}<br>
        ${client.Address || ''}
      </div>
      
      <div class="invoice-details">
        <table>
          <tr>
            <th>Invoice Date</th>
            <td>${issueDate}</td>
            <th>Due Date</th>
            <td>${dueDate}</td>
          </tr>
          ${project ? `<tr><th>Project</th><td colspan="3">${project.Title}</td></tr>` : ''}
        </table>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Rate</th>
            <th class="amount-column">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${project ? `${project.Title} - Project Work` : 'Professional Services'}</td>
            <td>1</td>
            <td>${invoice.Currency} ${parseFloat(invoice.Amount).toLocaleString()}</td>
            <td class="amount-column">${invoice.Currency} ${parseFloat(invoice.Amount).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="total-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${invoice.Currency} ${subtotal.toLocaleString()}</span>
        </div>
        ${taxRate > 0 ? `
        <div class="total-row">
          <span>Tax (${(taxRate * 100).toFixed(1)}%):</span>
          <span>${invoice.Currency} ${taxAmount.toLocaleString()}</span>
        </div>` : ''}
        <div class="total-row grand-total">
          <span>Total Amount Due:</span>
          <span>${invoice.Currency} ${total.toLocaleString()}</span>
        </div>
      </div>
      
      <div class="payment-info">
        <h3>Payment Information</h3>
        <p><strong>Payment Terms:</strong> Net ${getSetting('PAYMENT_TERMS_DAYS') || '30'} days</p>
        <p><strong>Payment Methods:</strong></p>
        <ul>
          <li>Bank Transfer: [Your bank details here]</li>
          <li>PayPal: ${getSetting('PAYPAL_ME_LINK') || 'your-paypal-link'}</li>
          <li>Online Payment: Use the payment link provided in the email</li>
        </ul>
        <p><strong>Late Fee:</strong> 1.5% per month on overdue amounts</p>
      </div>
      
      <div class="footer">
        <p>Thank you for your business!</p>
        <p>Questions about this invoice? Contact us at ${companyEmail}</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send invoice to client
 */
function sendInvoice(invoiceId) {
  try {
    const invoice = getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    const client = getClientById(invoice.ClientID);
    if (!client) {
      throw new Error('Client not found');
    }
    
    // Generate PDF if not already generated
    let pdfResult;
    if (!invoice.PDFURL) {
      pdfResult = generateInvoicePDF(invoiceId);
      if (!pdfResult.success) {
        throw new Error('Failed to generate PDF: ' + pdfResult.error);
      }
    }
    
    // Get PDF file
    const pdfFile = DriveApp.getFileById(pdfResult ? pdfResult.fileId : extractFileIdFromUrl(invoice.PDFURL));
    
    // Create email content
    const subject = `Invoice ${invoice.InvoiceID} - ${getSetting('COMPANY_NAME')}`;
    const body = createInvoiceEmailBody(invoice, client);
    
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
    
    // Update invoice status
    updateInvoiceStatus(invoiceId, 'Sent');
    
    logActivity('Invoice', `Invoice sent to ${client.Email}: ${invoice.InvoiceID}`, invoiceId);
    
    return { success: true, message: 'Invoice sent successfully' };
    
  } catch (error) {
    console.error('Error sending invoice:', error);
    logActivity('Invoice', `Failed to send invoice: ${error.message}`, invoiceId, 'Error');
    return { success: false, error: error.message };
  }
}

/**
 * Create invoice email body
 */
function createInvoiceEmailBody(invoice, client) {
  const companyName = getSetting('COMPANY_NAME') || 'Your Business';
  const dueDate = new Date(invoice.DueDate).toLocaleDateString();
  
  return `
Dear ${client.ContactName},

Please find attached invoice ${invoice.InvoiceID} for our recent work.

INVOICE DETAILS:
- Invoice Number: ${invoice.InvoiceID}
- Amount Due: ${invoice.Currency} ${parseFloat(invoice.Amount).toLocaleString()}
- Due Date: ${dueDate}

PAYMENT OPTIONS:
1. Online Payment: ${invoice.PaymentLink}
2. PayPal: ${getSetting('PAYPAL_ME_LINK') || 'Contact us for PayPal details'}
3. Bank Transfer: Contact us for banking details

Payment terms are Net ${getSetting('PAYMENT_TERMS_DAYS') || '30'} days. Please remit payment by the due date to avoid any late fees.

If you have any questions about this invoice, please don't hesitate to contact us.

Thank you for your business!

Best regards,
${companyName}
${getSetting('COMPANY_EMAIL')}
${getSetting('COMPANY_PHONE')}

---
This invoice was generated automatically from our billing system.
  `.trim();
}

/**
 * Mark invoice as paid
 */
function markInvoicePaid(invoiceId, paymentDate = null) {
  try {
    const invoice = getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    const spreadsheet = getOrCreateSpreadsheet();
    const invoicesSheet = spreadsheet.getSheetByName(SHEETS.INVOICES);
    const data = invoicesSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === invoiceId) {
        invoicesSheet.getRange(i + 1, 8).setValue('Paid'); // Status
        invoicesSheet.getRange(i + 1, 9).setValue(paymentDate || new Date()); // Payment Date
        break;
      }
    }
    
    // Send payment confirmation email
    sendPaymentConfirmation(invoice);
    
    logActivity('Invoice', `Invoice marked as paid: ${invoiceId}`, invoiceId);
    
    return { success: true, message: 'Invoice marked as paid' };
    
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    logActivity('Invoice', `Failed to mark invoice as paid: ${error.message}`, invoiceId, 'Error');
    return { success: false, error: error.message };
  }
}

/**
 * Send payment reminder
 */
function sendPaymentReminder(invoiceId) {
  try {
    const invoice = getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    if (invoice.Status === 'Paid') {
      return { success: false, error: 'Invoice already paid' };
    }
    
    const client = getClientById(invoice.ClientID);
    if (!client) {
      throw new Error('Client not found');
    }
    
    const dueDate = new Date(invoice.DueDate);
    const today = new Date();
    const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
    
    const subject = `Payment Reminder - Invoice ${invoice.InvoiceID}`;
    let body;
    
    if (daysOverdue > 0) {
      // Overdue reminder
      body = `
Dear ${client.ContactName},

This is a friendly reminder that invoice ${invoice.InvoiceID} is now ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue.

INVOICE DETAILS:
- Invoice Number: ${invoice.InvoiceID}
- Amount Due: ${invoice.Currency} ${parseFloat(invoice.Amount).toLocaleString()}
- Original Due Date: ${dueDate.toLocaleDateString()}

Please arrange payment at your earliest convenience to avoid any late fees.

PAYMENT OPTIONS:
1. Online Payment: ${invoice.PaymentLink}
2. PayPal: ${getSetting('PAYPAL_ME_LINK') || 'Contact us for PayPal details'}

If you have already made payment, please disregard this notice. If you have any questions or concerns, please contact us immediately.

Best regards,
${getSetting('COMPANY_NAME')}
      `.trim();
    } else {
      // Pre-due reminder
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      body = `
Dear ${client.ContactName},

This is a friendly reminder that invoice ${invoice.InvoiceID} is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}.

INVOICE DETAILS:
- Invoice Number: ${invoice.InvoiceID}
- Amount Due: ${invoice.Currency} ${parseFloat(invoice.Amount).toLocaleString()}
- Due Date: ${dueDate.toLocaleDateString()}

PAYMENT OPTIONS:
1. Online Payment: ${invoice.PaymentLink}
2. PayPal: ${getSetting('PAYPAL_ME_LINK') || 'Contact us for PayPal details'}

Thank you for your prompt attention to this matter.

Best regards,
${getSetting('COMPANY_NAME')}
      `.trim();
    }
    
    GmailApp.sendEmail(
      client.Email,
      subject,
      body,
      { name: getSetting('COMPANY_NAME') || 'Your Business' }
    );
    
    logActivity('Invoice', `Payment reminder sent for invoice: ${invoice.InvoiceID}`, invoiceId);
    
    return { success: true, message: 'Payment reminder sent' };
    
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    logActivity('Invoice', `Failed to send payment reminder: ${error.message}`, invoiceId, 'Error');
    return { success: false, error: error.message };
  }
}

/**
 * Send automatic payment reminders
 */
function sendAutomaticPaymentReminders() {
  try {
    const invoices = getAllInvoices();
    const reminderDays = parseInt(getSetting('REMINDER_DAYS')) || 3;
    const today = new Date();
    let sentCount = 0;
    
    invoices.forEach(invoice => {
      if (invoice.Status === 'Sent') {
        const dueDate = new Date(invoice.DueDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
        
        // Send reminder if within reminder window or overdue
        if (daysUntilDue <= reminderDays || daysOverdue > 0) {
          const result = sendPaymentReminder(invoice.InvoiceID);
          if (result.success) {
            sentCount++;
          }
        }
      }
    });
    
    logActivity('System', `Automatic payment reminders sent: ${sentCount}`, '');
    
    return { success: true, message: `Sent ${sentCount} payment reminders` };
    
  } catch (error) {
    console.error('Error sending automatic payment reminders:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate payment link
 */
function generatePaymentLink(invoiceId, amount, currency) {
  const paypalLink = getSetting('PAYPAL_ME_LINK');
  
  if (paypalLink && paypalLink.includes('paypal.me')) {
    // Create PayPal.me link with amount
    return `${paypalLink}/${amount}${currency}`;
  }
  
  // Fallback to basic PayPal link or custom payment page
  return paypalLink || `mailto:${getSetting('COMPANY_EMAIL')}?subject=Payment for Invoice ${invoiceId}`;
}

/**
 * Send payment confirmation
 */
function sendPaymentConfirmation(invoice) {
  try {
    const client = getClientById(invoice.ClientID);
    if (!client) return;
    
    const subject = `Payment Received - Invoice ${invoice.InvoiceID}`;
    const body = `
Dear ${client.ContactName},

Thank you! We have received your payment for invoice ${invoice.InvoiceID}.

PAYMENT DETAILS:
- Invoice Number: ${invoice.InvoiceID}
- Amount Paid: ${invoice.Currency} ${parseFloat(invoice.Amount).toLocaleString()}
- Payment Date: ${new Date().toLocaleDateString()}

Your account is now current. We appreciate your prompt payment and your continued business.

If you need a receipt or have any questions, please don't hesitate to contact us.

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
    console.error('Error sending payment confirmation:', error);
  }
}

/**
 * Get invoice by ID
 */
function getInvoiceById(invoiceId) {
  const spreadsheet = getOrCreateSpreadsheet();
  const invoicesSheet = spreadsheet.getSheetByName(SHEETS.INVOICES);
  const data = invoicesSheet.getDataRange().getValues();
  
  if (data.length <= 1) return null;
  
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === invoiceId) {
      const invoice = {};
      headers.forEach((header, index) => {
        invoice[header.replace(' ', '')] = data[i][index];
      });
      return invoice;
    }
  }
  return null;
}

/**
 * Get all invoices
 */
function getAllInvoices() {
  const spreadsheet = getOrCreateSpreadsheet();
  const invoicesSheet = spreadsheet.getSheetByName(SHEETS.INVOICES);
  const data = invoicesSheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const headers = data[0];
  return data.slice(1).map(row => {
    const invoice = {};
    headers.forEach((header, index) => {
      invoice[header.replace(' ', '')] = row[index];
    });
    return invoice;
  });
}

/**
 * Update invoice PDF URL
 */
function updateInvoicePdfUrl(invoiceId, pdfUrl) {
  const spreadsheet = getOrCreateSpreadsheet();
  const invoicesSheet = spreadsheet.getSheetByName(SHEETS.INVOICES);
  const data = invoicesSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === invoiceId) {
      invoicesSheet.getRange(i + 1, 10).setValue(pdfUrl); // PDF URL column
      break;
    }
  }
}

/**
 * Update invoice status
 */
function updateInvoiceStatus(invoiceId, status) {
  const spreadsheet = getOrCreateSpreadsheet();
  const invoicesSheet = spreadsheet.getSheetByName(SHEETS.INVOICES);
  const data = invoicesSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === invoiceId) {
      invoicesSheet.getRange(i + 1, 8).setValue(status); // Status column
      break;
    }
  }
}

/**
 * Get project by ID
 */
function getProjectById(projectId) {
  const spreadsheet = getOrCreateSpreadsheet();
  const projectsSheet = spreadsheet.getSheetByName(SHEETS.PROJECTS);
  const data = projectsSheet.getDataRange().getValues();
  
  if (data.length <= 1) return null;
  
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === projectId) {
      const project = {};
      headers.forEach((header, index) => {
        project[header.replace(' ', '')] = data[i][index];
      });
      return project;
    }
  }
  return null;
}

/**
 * Get all projects
 */
function getAllProjects() {
  const spreadsheet = getOrCreateSpreadsheet();
  const projectsSheet = spreadsheet.getSheetByName(SHEETS.PROJECTS);
  const data = projectsSheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const headers = data[0];
  return data.slice(1).map(row => {
    const project = {};
    headers.forEach((header, index) => {
      project[header.replace(' ', '')] = row[index];
    });
    return project;
  });
}