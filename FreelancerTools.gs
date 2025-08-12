/**
 * Freelancer Premium Tools - Professional Features
 * Time Tracking, Expense Management, Analytics, and More
 */

/**
 * Time Tracking Functions
 */

/**
 * Start time tracking for a project
 */
function startTimeTracking(projectId, taskDescription) {
  try {
    const spreadsheet = getSpreadsheet();
    let timeSheet = spreadsheet.getSheetByName('TimeTracking');
    
    // Create TimeTracking sheet if it doesn't exist
    if (!timeSheet) {
      timeSheet = spreadsheet.insertSheet('TimeTracking');
      timeSheet.getRange(1, 1, 1, 8).setValues([[
        'Session ID', 'Project ID', 'Task Description', 'Start Time', 
        'End Time', 'Duration (Hours)', 'Hourly Rate', 'Amount'
      ]]);
      timeSheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#4CAF50').setFontColor('white');
    }
    
    const sessionId = generateId('TIME');
    const startTime = new Date();
    
    // Add new time session
    const newSession = [
      sessionId,
      projectId,
      taskDescription || 'General Work',
      startTime,
      '', // End time (empty)
      '', // Duration (calculated later)
      getSetting('DEFAULT_HOURLY_RATE') || 50, // Default rate
      '' // Amount (calculated later)
    ];
    
    timeSheet.appendRow(newSession);
    
    // Store active session in properties
    PropertiesService.getScriptProperties().setProperty('ACTIVE_TIME_SESSION', sessionId);
    
    logActivity('Time Tracking', `Started timer: ${taskDescription}`, sessionId);
    
    return {
      success: true,
      sessionId: sessionId,
      startTime: startTime,
      message: 'Time tracking started'
    };
    
  } catch (error) {
    console.error('Error starting time tracking:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Stop time tracking and calculate duration
 */
function stopTimeTracking(sessionId) {
  try {
    const spreadsheet = getSpreadsheet();
    const timeSheet = spreadsheet.getSheetByName('TimeTracking');
    const data = timeSheet.getDataRange().getValues();
    
    const endTime = new Date();
    
    // Find and update the session
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === sessionId && !data[i][4]) { // Session ID matches and no end time
        const startTime = new Date(data[i][3]);
        const durationMs = endTime - startTime;
        const durationHours = durationMs / (1000 * 60 * 60);
        const hourlyRate = parseFloat(data[i][6]) || 50;
        const amount = durationHours * hourlyRate;
        
        // Update the row
        timeSheet.getRange(i + 1, 5).setValue(endTime); // End time
        timeSheet.getRange(i + 1, 6).setValue(durationHours.toFixed(2)); // Duration
        timeSheet.getRange(i + 1, 8).setValue(amount.toFixed(2)); // Amount
        
        // Clear active session
        PropertiesService.getScriptProperties().deleteProperty('ACTIVE_TIME_SESSION');
        
        logActivity('Time Tracking', `Stopped timer: ${durationHours.toFixed(2)} hours`, sessionId);
        
        return {
          success: true,
          duration: durationHours.toFixed(2),
          amount: amount.toFixed(2),
          message: `Session completed: ${durationHours.toFixed(2)} hours`
        };
      }
    }
    
    return { success: false, error: 'Active session not found' };
    
  } catch (error) {
    console.error('Error stopping time tracking:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get active time session
 */
function getActiveTimeSession() {
  try {
    const sessionId = PropertiesService.getScriptProperties().getProperty('ACTIVE_TIME_SESSION');
    if (!sessionId) return null;
    
    const spreadsheet = getSpreadsheet();
    const timeSheet = spreadsheet.getSheetByName('TimeTracking');
    if (!timeSheet) return null;
    
    const data = timeSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === sessionId && !data[i][4]) {
        const startTime = new Date(data[i][3]);
        const currentTime = new Date();
        const elapsedMs = currentTime - startTime;
        const elapsedHours = elapsedMs / (1000 * 60 * 60);
        
        return {
          sessionId: sessionId,
          projectId: data[i][1],
          taskDescription: data[i][2],
          startTime: startTime,
          elapsedTime: elapsedHours.toFixed(2)
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting active session:', error);
    return null;
  }
}

/**
 * Expense Management Functions
 */

/**
 * Add expense
 */
function addExpense(expenseData) {
  try {
    const spreadsheet = getSpreadsheet();
    let expenseSheet = spreadsheet.getSheetByName('Expenses');
    
    // Create Expenses sheet if it doesn't exist
    if (!expenseSheet) {
      expenseSheet = spreadsheet.insertSheet('Expenses');
      expenseSheet.getRange(1, 1, 1, 9).setValues([[
        'Expense ID', 'Date', 'Category', 'Description', 'Amount', 
        'Currency', 'Project ID', 'Receipt URL', 'Status'
      ]]);
      expenseSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#FF9800').setFontColor('white');
    }
    
    const expenseId = generateId('EXP');
    
    const newExpense = [
      expenseId,
      expenseData.date || new Date(),
      expenseData.category || 'General',
      expenseData.description || '',
      parseFloat(expenseData.amount) || 0,
      expenseData.currency || 'PKR',
      expenseData.projectId || '',
      expenseData.receiptUrl || '',
      'Active'
    ];
    
    expenseSheet.appendRow(newExpense);
    
    logActivity('Expense', `New expense added: ${expenseData.description}`, expenseId);
    
    return {
      success: true,
      expenseId: expenseId,
      message: 'Expense added successfully'
    };
    
  } catch (error) {
    console.error('Error adding expense:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get expenses summary
 */
function getExpensesSummary() {
  try {
    const spreadsheet = getSpreadsheet();
    const expenseSheet = spreadsheet.getSheetByName('Expenses');
    
    if (!expenseSheet) {
      return { totalExpenses: 0, monthlyExpenses: 0, categories: {} };
    }
    
    const data = expenseSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { totalExpenses: 0, monthlyExpenses: 0, categories: {} };
    }
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let totalExpenses = 0;
    let monthlyExpenses = 0;
    const categories = {};
    
    for (let i = 1; i < data.length; i++) {
      const amount = parseFloat(data[i][4]) || 0;
      const category = data[i][2] || 'General';
      const date = new Date(data[i][1]);
      
      totalExpenses += amount;
      
      // Monthly expenses
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        monthlyExpenses += amount;
      }
      
      // Category breakdown
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += amount;
    }
    
    return {
      totalExpenses: totalExpenses,
      monthlyExpenses: monthlyExpenses,
      categories: categories
    };
    
  } catch (error) {
    console.error('Error getting expenses summary:', error);
    return { totalExpenses: 0, monthlyExpenses: 0, categories: {} };
  }
}

/**
 * Currency Conversion Functions
 */

/**
 * Get live currency rates (using free API)
 */
function getCurrencyRates() {
  try {
    // Using exchangerate-api.com (free tier: 1500 requests/month)
    const response = UrlFetchApp.fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = JSON.parse(response.getContentText());
    
    return {
      success: true,
      rates: data.rates,
      lastUpdated: data.date
    };
  } catch (error) {
    console.error('Error fetching currency rates:', error);
    // Fallback static rates
    return {
      success: false,
      rates: {
        PKR: 280,
        EUR: 0.85,
        GBP: 0.73,
        CAD: 1.25,
        AUD: 1.35
      },
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  }
}

/**
 * Convert currency
 */
function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    if (fromCurrency === toCurrency) {
      return { success: true, convertedAmount: amount, rate: 1 };
    }
    
    const rates = getCurrencyRates();
    let convertedAmount;
    let rate;
    
    if (fromCurrency === 'USD') {
      rate = rates.rates[toCurrency];
      convertedAmount = amount * rate;
    } else if (toCurrency === 'USD') {
      rate = 1 / rates.rates[fromCurrency];
      convertedAmount = amount * rate;
    } else {
      // Convert through USD
      const toUsd = amount / rates.rates[fromCurrency];
      convertedAmount = toUsd * rates.rates[toCurrency];
      rate = rates.rates[toCurrency] / rates.rates[fromCurrency];
    }
    
    return {
      success: true,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      rate: Math.round(rate * 10000) / 10000
    };
    
  } catch (error) {
    console.error('Error converting currency:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Business Analytics Functions
 */

/**
 * Get comprehensive business analytics
 */
function getBusinessAnalytics() {
  try {
    const spreadsheet = getSpreadsheet();
    
    // Get data from all sheets
    const clientsData = spreadsheet.getSheetByName(SHEETS.CLIENTS).getDataRange().getValues();
    const proposalsData = spreadsheet.getSheetByName(SHEETS.PROPOSALS).getDataRange().getValues();
    const projectsData = spreadsheet.getSheetByName(SHEETS.PROJECTS).getDataRange().getValues();
    const invoicesData = spreadsheet.getSheetByName(SHEETS.INVOICES).getDataRange().getValues();
    
    // Time tracking data
    const timeSheet = spreadsheet.getSheetByName('TimeTracking');
    const timeData = timeSheet ? timeSheet.getDataRange().getValues() : [];
    
    // Expense data
    const expenseSheet = spreadsheet.getSheetByName('Expenses');
    const expenseData = expenseSheet ? expenseSheet.getDataRange().getValues() : [];
    
    const analytics = {
      // Revenue Analytics
      revenue: calculateRevenueAnalytics(invoicesData),
      
      // Proposal Analytics
      proposals: calculateProposalAnalytics(proposalsData),
      
      // Time Analytics
      timeTracking: calculateTimeAnalytics(timeData),
      
      // Expense Analytics
      expenses: calculateExpenseAnalytics(expenseData),
      
      // Client Analytics
      clients: calculateClientAnalytics(clientsData, invoicesData),
      
      // Project Analytics
      projects: calculateProjectAnalytics(projectsData)
    };
    
    return analytics;
    
  } catch (error) {
    console.error('Error getting business analytics:', error);
    return null;
  }
}

/**
 * Calculate revenue analytics
 */
function calculateRevenueAnalytics(invoicesData) {
  const current = new Date();
  const currentMonth = current.getMonth();
  const currentYear = current.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  let totalRevenue = 0;
  let currentMonthRevenue = 0;
  let lastMonthRevenue = 0;
  const monthlyData = {};
  
  for (let i = 1; i < invoicesData.length; i++) {
    if (invoicesData[i][7] === 'Paid') {
      const amount = parseFloat(invoicesData[i][3]) || 0;
      const paymentDate = new Date(invoicesData[i][8]);
      const month = paymentDate.getMonth();
      const year = paymentDate.getFullYear();
      const monthKey = `${year}-${month + 1}`;
      
      totalRevenue += amount;
      
      if (month === currentMonth && year === currentYear) {
        currentMonthRevenue += amount;
      }
      
      if (month === lastMonth && year === lastMonthYear) {
        lastMonthRevenue += amount;
      }
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += amount;
    }
  }
  
  const growth = lastMonthRevenue > 0 ? 
    ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : 0;
  
  return {
    total: totalRevenue,
    currentMonth: currentMonthRevenue,
    lastMonth: lastMonthRevenue,
    growth: parseFloat(growth),
    monthlyData: monthlyData
  };
}

/**
 * Calculate proposal analytics
 */
function calculateProposalAnalytics(proposalsData) {
  let totalProposals = proposalsData.length - 1;
  let acceptedProposals = 0;
  let rejectedProposals = 0;
  let pendingProposals = 0;
  let totalProposalValue = 0;
  let acceptedValue = 0;
  
  for (let i = 1; i < proposalsData.length; i++) {
    const status = proposalsData[i][6];
    const amount = parseFloat(proposalsData[i][4]) || 0;
    
    totalProposalValue += amount;
    
    switch (status) {
      case 'Accepted':
        acceptedProposals++;
        acceptedValue += amount;
        break;
      case 'Rejected':
        rejectedProposals++;
        break;
      case 'Sent':
        pendingProposals++;
        break;
    }
  }
  
  const conversionRate = totalProposals > 0 ? 
    (acceptedProposals / totalProposals * 100).toFixed(1) : 0;
  
  return {
    total: totalProposals,
    accepted: acceptedProposals,
    rejected: rejectedProposals,
    pending: pendingProposals,
    conversionRate: parseFloat(conversionRate),
    totalValue: totalProposalValue,
    acceptedValue: acceptedValue
  };
}

/**
 * Calculate time analytics
 */
function calculateTimeAnalytics(timeData) {
  if (timeData.length <= 1) {
    return { totalHours: 0, thisWeekHours: 0, averageHourlyRate: 0 };
  }
  
  let totalHours = 0;
  let thisWeekHours = 0;
  let totalEarnings = 0;
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  
  for (let i = 1; i < timeData.length; i++) {
    const duration = parseFloat(timeData[i][5]) || 0;
    const amount = parseFloat(timeData[i][7]) || 0;
    const sessionDate = new Date(timeData[i][3]);
    
    totalHours += duration;
    totalEarnings += amount;
    
    if (sessionDate >= weekStart) {
      thisWeekHours += duration;
    }
  }
  
  const averageHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;
  
  return {
    totalHours: totalHours.toFixed(1),
    thisWeekHours: thisWeekHours.toFixed(1),
    averageHourlyRate: averageHourlyRate.toFixed(0),
    totalEarnings: totalEarnings.toFixed(0)
  };
}

/**
 * Calculate expense analytics
 */
function calculateExpenseAnalytics(expenseData) {
  if (expenseData.length <= 1) {
    return { totalExpenses: 0, monthlyExpenses: 0, categories: {} };
  }
  
  return getExpensesSummary();
}

/**
 * Calculate client analytics
 */
function calculateClientAnalytics(clientsData, invoicesData) {
  const clientRevenue = {};
  
  // Calculate revenue per client
  for (let i = 1; i < invoicesData.length; i++) {
    if (invoicesData[i][7] === 'Paid') {
      const clientId = invoicesData[i][2];
      const amount = parseFloat(invoicesData[i][3]) || 0;
      
      if (!clientRevenue[clientId]) {
        clientRevenue[clientId] = 0;
      }
      clientRevenue[clientId] += amount;
    }
  }
  
  // Find top clients
  const topClients = Object.entries(clientRevenue)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  return {
    total: clientsData.length - 1,
    topClients: topClients
  };
}

/**
 * Calculate project analytics
 */
function calculateProjectAnalytics(projectsData) {
  let completedProjects = 0;
  let activeProjects = 0;
  
  for (let i = 1; i < projectsData.length; i++) {
    const status = projectsData[i][4];
    
    if (status === 'Completed') {
      completedProjects++;
    } else if (status === 'In Progress') {
      activeProjects++;
    }
  }
  
  return {
    total: projectsData.length - 1,
    completed: completedProjects,
    active: activeProjects
  };
}

/**
 * Data Export and Backup Functions
 */

/**
 * Export all data to backup
 */
function createDataBackup() {
  try {
    const spreadsheet = getSpreadsheet();
    const sheets = spreadsheet.getSheets();
    const backupData = {};
    
    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      const data = sheet.getDataRange().getValues();
      backupData[sheetName] = data;
    });
    
    // Create backup file
    const rootFolder = getRootFolder();
    const backupFolder = createSubfolderIfNeeded(rootFolder, 'Backups');
    
    const fileName = `FreelancerData_Backup_${new Date().toISOString().split('T')[0]}.json`;
    const backupFile = backupFolder.createFile(
      fileName, 
      JSON.stringify(backupData, null, 2), 
      'application/json'
    );
    
    logActivity('Backup', `Data backup created: ${fileName}`, backupFile.getId());
    
    return {
      success: true,
      fileName: fileName,
      fileId: backupFile.getId(),
      url: backupFile.getUrl()
    };
    
  } catch (error) {
    console.error('Error creating backup:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Contract and Agreement Generator
 */

/**
 * Generate contract from template
 */
function generateContract(contractData) {
  try {
    const template = getContractTemplate(contractData.type || 'standard');
    
    // Replace placeholders with actual data
    let contractContent = template
      .replace(/\{CLIENT_NAME\}/g, contractData.clientName || '')
      .replace(/\{CLIENT_COMPANY\}/g, contractData.clientCompany || '')
      .replace(/\{PROJECT_TITLE\}/g, contractData.projectTitle || '')
      .replace(/\{PROJECT_DESCRIPTION\}/g, contractData.projectDescription || '')
      .replace(/\{AMOUNT\}/g, contractData.amount || '')
      .replace(/\{CURRENCY\}/g, contractData.currency || 'PKR')
      .replace(/\{START_DATE\}/g, contractData.startDate || '')
      .replace(/\{END_DATE\}/g, contractData.endDate || '')
      .replace(/\{FREELANCER_NAME\}/g, getSetting('COMPANY_NAME') || '')
      .replace(/\{FREELANCER_EMAIL\}/g, getSetting('COMPANY_EMAIL') || '')
      .replace(/\{FREELANCER_PHONE\}/g, getSetting('COMPANY_PHONE') || '');
    
    // Create PDF
    const pdfBlob = Utilities.newBlob(contractContent, 'text/html')
      .getAs('application/pdf');
    
    const rootFolder = getRootFolder();
    const contractsFolder = createSubfolderIfNeeded(rootFolder, 'Contracts');
    
    const fileName = `Contract_${contractData.projectTitle || 'Project'}_${new Date().toISOString().split('T')[0]}.pdf`;
    const contractFile = contractsFolder.createFile(pdfBlob.setName(fileName));
    
    return {
      success: true,
      fileName: fileName,
      fileId: contractFile.getId(),
      url: contractFile.getUrl()
    };
    
  } catch (error) {
    console.error('Error generating contract:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get contract template
 */
function getContractTemplate(type) {
  const templates = {
    standard: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Freelance Service Agreement</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2c5aa0; padding-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; color: #2c5aa0; }
        .section { margin: 30px 0; }
        .section-title { font-size: 18px; font-weight: bold; color: #2c5aa0; margin-bottom: 15px; }
        .terms { background: #f8f9fa; padding: 20px; border-left: 4px solid #2c5aa0; margin: 20px 0; }
        .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-block { width: 40%; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">FREELANCE SERVICE AGREEMENT</div>
        <p>Professional Services Contract</p>
    </div>
    
    <div class="section">
        <div class="section-title">1. PARTIES</div>
        <p><strong>Service Provider (Freelancer):</strong><br>
        {FREELANCER_NAME}<br>
        Email: {FREELANCER_EMAIL}<br>
        Phone: {FREELANCER_PHONE}</p>
        
        <p><strong>Client:</strong><br>
        {CLIENT_NAME}<br>
        Company: {CLIENT_COMPANY}</p>
    </div>
    
    <div class="section">
        <div class="section-title">2. PROJECT DETAILS</div>
        <p><strong>Project Title:</strong> {PROJECT_TITLE}</p>
        <p><strong>Description:</strong><br>{PROJECT_DESCRIPTION}</p>
        <p><strong>Project Value:</strong> {CURRENCY} {AMOUNT}</p>
        <p><strong>Start Date:</strong> {START_DATE}</p>
        <p><strong>Expected Completion:</strong> {END_DATE}</p>
    </div>
    
    <div class="section">
        <div class="section-title">3. PAYMENT TERMS</div>
        <div class="terms">
            <ul>
                <li>Total project fee: {CURRENCY} {AMOUNT}</li>
                <li>Payment schedule: 50% advance, 50% upon completion</li>
                <li>Payment method: JazzCash, EasyPaisa, or Bank Transfer</li>
                <li>Late payment fee: 2% per month on overdue amounts</li>
            </ul>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">4. SCOPE OF WORK</div>
        <div class="terms">
            <ul>
                <li>The freelancer will deliver the project as described above</li>
                <li>Any additional work beyond the agreed scope will be charged separately</li>
                <li>Client will provide necessary materials and feedback in a timely manner</li>
                <li>Freelancer retains the right to showcase the work in their portfolio</li>
            </ul>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">5. TERMS & CONDITIONS</div>
        <div class="terms">
            <ul>
                <li>This agreement is governed by the laws of Pakistan</li>
                <li>Any disputes will be resolved through mutual discussion</li>
                <li>Either party may terminate with 7 days written notice</li>
                <li>Completed work must be paid for even if project is terminated</li>
            </ul>
        </div>
    </div>
    
    <div class="signature-section">
        <div class="signature-block">
            <div class="signature-line">
                <strong>Client Signature</strong><br>
                {CLIENT_NAME}<br>
                Date: _____________
            </div>
        </div>
        <div class="signature-block">
            <div class="signature-line">
                <strong>Freelancer Signature</strong><br>
                {FREELANCER_NAME}<br>
                Date: _____________
            </div>
        </div>
    </div>
</body>
</html>`
  };
  
  return templates[type] || templates.standard;
}