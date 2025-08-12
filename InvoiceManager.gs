/**
 * Invoice Management Functions
 * Handles invoice creation, PDF generation, payment tracking, and reminders
 */

/**
 * Create new invoice
 */
function createInvoice(invoiceData) {
  try {
    const spreadsheet = getSpreadsheet();
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
    const htmlContent = createInvoiceHTML(invoice);
    
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
 * Create invoice HTML template - Updated for Pakistani market
 */
function createInvoiceHTML(invoice) {
  const companyName = getSetting('COMPANY_NAME');
  const companyEmail = getSetting('COMPANY_EMAIL');
  const companyPhone = getSetting('COMPANY_PHONE');
  const companyAddress = getSetting('COMPANY_ADDRESS');
  const currencySymbol = getSetting('CURRENCY_SYMBOL') || 'Rs.';
  const jazzCash = getSetting('JAZZCASH_NUMBER');
  const easyPaisa = getSetting('EASYPAISA_NUMBER');
  const bankDetails = getSetting('BANK_DETAILS');
  
  // Format amount with Pakistani number formatting
  const formattedAmount = parseFloat(invoice.Amount).toLocaleString('en-PK');
  
  // Build payment methods section
  let paymentMethods = '';
  if (invoice.Currency === 'PKR' || invoice.Currency === 'Rs.' || !invoice.Currency) {
    paymentMethods = '<h3 style="color: #2c5aa0; margin-top: 30px;">Payment Methods</h3>';
    
    if (jazzCash && jazzCash !== '03XX-XXXXXXX') {
      paymentMethods += `
        <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-left: 4px solid #dc3545;">
          <strong>💳 JazzCash:</strong> ${jazzCash}<br>
          <small>Send via JazzCash app or dial *786#</small>
        </div>`;
    }
    
    if (easyPaisa && easyPaisa !== '03XX-XXXXXXX') {
      paymentMethods += `
        <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-left: 4px solid #28a745;">
          <strong>💳 EasyPaisa:</strong> ${easyPaisa}<br>
          <small>Send via EasyPaisa app or visit agent</small>
        </div>`;
    }
    
    if (bankDetails && !bankDetails.includes('Your Bank')) {
      paymentMethods += `
        <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-left: 4px solid #007bff;">
          <strong>🏦 Bank Transfer:</strong><br>
          ${bankDetails.replace(/\|/g, '<br>')}<br>
          <small>Transfer via mobile banking or visit branch</small>
        </div>`;
    }
    
    const paypalLink = getSetting('PAYPAL_ME_LINK');
    if (paypalLink && paypalLink.includes('paypal.me')) {
      paymentMethods += `
        <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-left: 4px solid #ffc107;">
          <strong>🌐 PayPal (International):</strong><br>
          <a href="${paypalLink}/${invoice.Amount}PKR" target="_blank">${paypalLink}</a><br>
          <small>For international clients only</small>
        </div>`;
    }
    
    paymentMethods += `
      <div style="margin-top: 15px; padding: 10px; background: #e8f4fd; border: 1px solid #bee5eb; border-radius: 5px;">
        <strong>📧 Payment Confirmation:</strong><br>
        Please send payment screenshot to: <strong>${companyEmail}</strong>
      </div>`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice ${invoice.InvoiceID}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .invoice-header { background: #2c5aa0; color: white; padding: 20px; margin-bottom: 30px; }
        .invoice-title { font-size: 28px; margin: 0; }
        .invoice-subtitle { font-size: 14px; margin: 5px 0 0 0; opacity: 0.9; }
        .company-info { margin-bottom: 20px; }
        .invoice-details { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .amount-total { font-size: 24px; font-weight: bold; color: #2c5aa0; text-align: center; 
                       background: #e8f4fd; padding: 20px; margin: 30px 0; border-radius: 5px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        .terms { margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="invoice-header">
        <h1 class="invoice-title">INVOICE</h1>
        <div class="invoice-subtitle">Invoice #${invoice.InvoiceID}</div>
    </div>

    <div class="company-info">
        <h2 style="color: #2c5aa0; margin-bottom: 10px;">${companyName}</h2>
        <div>${companyAddress}</div>
        <div>📧 ${companyEmail}</div>
        <div>📞 ${companyPhone}</div>
    </div>

    <div class="invoice-details">
        <div class="detail-row">
            <strong>Bill To:</strong>
            <span>${invoice.ClientName}</span>
        </div>
        <div class="detail-row">
            <strong>Project:</strong>
            <span>${invoice.ProjectTitle}</span>
        </div>
        <div class="detail-row">
            <strong>Invoice Date:</strong>
            <span>${new Date(invoice.CreatedDate).toLocaleDateString('en-PK')}</span>
        </div>
        <div class="detail-row">
            <strong>Due Date:</strong>
            <span>${new Date(invoice.DueDate).toLocaleDateString('en-PK')}</span>
        </div>
        <div class="detail-row">
            <strong>Payment Terms:</strong>
            <span>${getSetting('PAYMENT_TERMS_DAYS')} days</span>
        </div>
    </div>

    <div class="amount-total">
        <div>Total Amount Due</div>
        <div style="font-size: 32px; margin-top: 10px;">
            ${currencySymbol} ${formattedAmount}
        </div>
    </div>

    ${paymentMethods}

    <div class="terms">
        <h3 style="color: #2c5aa0;">Terms & Conditions</h3>
        <ul style="margin: 0; padding-left: 20px;">
            <li>Payment is due within ${getSetting('PAYMENT_TERMS_DAYS')} days of invoice date</li>
            <li>Late payment charges may apply after due date</li>
            <li>Please include invoice number in payment reference</li>
            <li>For queries, contact us at ${companyEmail}</li>
        </ul>
    </div>

    <div class="footer">
        <p>Thank you for your business!</p>
        <p style="margin-top: 20px;">This invoice was generated on ${new Date().toLocaleDateString('en-PK')} at ${new Date().toLocaleTimeString('en-PK')}</p>
    </div>
</body>
</html>`;
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
    const body = createInvoiceEmailBody(invoice);
    
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
 * Create invoice email body - Updated for Pakistani market
 */
function createInvoiceEmailBody(invoice) {
  const companyName = getSetting('COMPANY_NAME');
  const companyEmail = getSetting('COMPANY_EMAIL');
  const paymentTerms = getSetting('PAYMENT_TERMS_DAYS');
  const jazzCash = getSetting('JAZZCASH_NUMBER');
  const easyPaisa = getSetting('EASYPAISA_NUMBER');
  const bankDetails = getSetting('BANK_DETAILS');
  const currencySymbol = getSetting('CURRENCY_SYMBOL') || 'Rs.';
  
  let paymentOptions = '';
  
  // Build Pakistani payment options
  if (invoice.Currency === 'PKR' || invoice.Currency === 'Rs.' || !invoice.Currency) {
    paymentOptions = 'PAYMENT OPTIONS:\n';
    
    if (jazzCash && jazzCash !== '03XX-XXXXXXX') {
      paymentOptions += `💳 JazzCash: ${jazzCash}\n   (Send via JazzCash app or dial *786#)\n\n`;
    }
    
    if (easyPaisa && easyPaisa !== '03XX-XXXXXXX') {
      paymentOptions += `💳 EasyPaisa: ${easyPaisa}\n   (Send via EasyPaisa app or visit agent)\n\n`;
    }
    
    if (bankDetails && !bankDetails.includes('Your Bank')) {
      paymentOptions += `🏦 Bank Transfer: ${bankDetails}\n   (Transfer via mobile banking or branch)\n\n`;
    }
    
    const paypalLink = getSetting('PAYPAL_ME_LINK');
    if (paypalLink && paypalLink.includes('paypal.me')) {
      paymentOptions += `🌐 PayPal (International): ${paypalLink}/${invoice.Amount}PKR\n\n`;
    }
    
    paymentOptions += `📧 Send payment confirmation screenshot to: ${companyEmail}`;
  } else {
    // For non-PKR currencies
    paymentOptions = `PAYMENT OPTIONS:
1. Online Payment: ${invoice.PaymentLink}
2. PayPal: ${getSetting('PAYPAL_ME_LINK') || 'Contact us for PayPal details'}
3. Contact us for other payment methods`;
  }
  
  return `Subject: Invoice ${invoice.InvoiceID} from ${companyName}

Dear ${invoice.ClientName},

I hope this email finds you well. Please find attached your invoice for the services provided.

INVOICE DETAILS:
- Invoice Number: ${invoice.InvoiceID}
- Project: ${invoice.ProjectTitle}
- Amount: ${currencySymbol} ${invoice.Amount}
- Due Date: ${invoice.DueDate}
- Payment Terms: ${paymentTerms} days

${paymentOptions}

IMPORTANT NOTES:
• Payment is due within ${paymentTerms} days of invoice date
• Late payment charges may apply after due date
• Please include invoice number in payment reference
• Contact us immediately if you have any questions

Thank you for your business. We appreciate the opportunity to work with you.

Best regards,
${companyName}
${companyEmail}

---
This is an automated email. Please do not reply to this message.`;
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
    
    const spreadsheet = getSpreadsheet();
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
 * Generate payment link - Updated for Pakistani market
 */
function generatePaymentLink(invoiceId, amount, currency) {
  try {
    const paypalLink = getSetting('PAYPAL_ME_LINK');
    const jazzCash = getSetting('JAZZCASH_NUMBER');
    const easyPaisa = getSetting('EASYPAISA_NUMBER');
    const bankDetails = getSetting('BANK_DETAILS');
    const currencySymbol = getSetting('CURRENCY_SYMBOL') || 'Rs.';
    
    // For Pakistani Rupees, create comprehensive payment info
    if (currency === 'PKR' || currency === 'Rs.' || !currency) {
      let paymentInfo = `Payment Options for Invoice ${invoiceId} - Amount: ${currencySymbol} ${amount}\n\n`;
      
      if (jazzCash && jazzCash !== '03XX-XXXXXXX') {
        paymentInfo += `💳 JazzCash: ${jazzCash}\n`;
        paymentInfo += `   Send money via JazzCash app or dial *786#\n\n`;
      }
      
      if (easyPaisa && easyPaisa !== '03XX-XXXXXXX') {
        paymentInfo += `💳 EasyPaisa: ${easyPaisa}\n`;
        paymentInfo += `   Send money via EasyPaisa app or visit agent\n\n`;
      }
      
      if (bankDetails && !bankDetails.includes('Your Bank')) {
        paymentInfo += `🏦 Bank Transfer: ${bankDetails}\n`;
        paymentInfo += `   Transfer via mobile banking or visit branch\n\n`;
      }
      
      if (paypalLink && paypalLink.includes('paypal.me')) {
        paymentInfo += `🌐 PayPal (International): ${paypalLink}/${amount}PKR\n`;
        paymentInfo += `   For international clients only\n\n`;
      }
      
      paymentInfo += `Please send payment confirmation screenshot to: ${getSetting('COMPANY_EMAIL')}`;
      
      // Return as mailto link for easy sharing
      return `mailto:${getSetting('COMPANY_EMAIL')}?subject=Payment for Invoice ${invoiceId}&body=${encodeURIComponent(paymentInfo)}`;
    }
    
    // Fallback for other currencies (USD, EUR, etc.)
    if (paypalLink && paypalLink.includes('paypal.me')) {
      return `${paypalLink}/${amount}${currency}`;
    }
    
    return paypalLink || `mailto:${getSetting('COMPANY_EMAIL')}?subject=Payment for Invoice ${invoiceId}`;
    
  } catch (error) {
    console.error('Error generating payment link:', error);
    return `mailto:${getSetting('COMPANY_EMAIL')}?subject=Payment for Invoice ${invoiceId}`;
  }
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
  const spreadsheet = getSpreadsheet();
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
  const spreadsheet = getSpreadsheet();
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
  const spreadsheet = getSpreadsheet();
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
  const spreadsheet = getSpreadsheet();
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
  const spreadsheet = getSpreadsheet();
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
  const spreadsheet = getSpreadsheet();
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