/**
 * FreelancerTools.gs - Premium Tools Backend
 * Advanced tools for freelancer workflow management
 */

// ================================
// TIME TRACKING FUNCTIONS
// ================================

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
      const headers = [
        'SessionID', 'ProjectID', 'TaskDescription', 'StartTime', 
        'EndTime', 'Duration', 'HourlyRate', 'Amount', 'Status', 'Date'
      ];
      timeSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      timeSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    // Check for active session
    const activeSession = getActiveTimeSession();
    if (activeSession) {
      return {
        success: false,
        error: 'Active session already running. Please stop current session first.'
      };
    }
    
    const sessionId = generateId();
    const startTime = new Date();
    const hourlyRate = getSetting('DEFAULT_HOURLY_RATE') || 50;
    
    // Add new session to sheet
    const newRow = [
      sessionId,
      projectId || 'GENERAL',
      taskDescription || 'General Work',
      startTime,
      '', // EndTime (empty)
      '', // Duration (empty)
      hourlyRate,
      '', // Amount (empty)
      'ACTIVE',
      Utilities.formatDate(startTime, Session.getScriptTimeZone(), 'yyyy-MM-dd')
    ];
    
    timeSheet.appendRow(newRow);
    
    // Store active session in PropertiesService
    PropertiesService.getScriptProperties().setProperties({
      'ACTIVE_TIME_SESSION': sessionId,
      'SESSION_START_TIME': startTime.getTime().toString(),
      'SESSION_PROJECT_ID': projectId || 'GENERAL',
      'SESSION_TASK_DESC': taskDescription || 'General Work'
    });
    
    // Save time tracking record to Drive
    try {
      const rootFolder = getRootFolder();
      console.log('📁 Root folder for time tracking:', rootFolder.getName(), 'ID:', rootFolder.getId());
      
      const timeTrackingFolder = createSubfolder(rootFolder, 'TimeTracking');
      console.log('📂 TimeTracking folder:', timeTrackingFolder.getName(), 'ID:', timeTrackingFolder.getId());
      
      const sessionRecord = {
        sessionId: sessionId,
        projectId: projectId || 'GENERAL',
        taskDescription: taskDescription || 'General Work',
        startTime: startTime.toISOString(),
        hourlyRate: hourlyRate,
        status: 'ACTIVE',
        date: Utilities.formatDate(startTime, Session.getScriptTimeZone(), 'yyyy-MM-dd')
      };
      
      const fileName = `TimeSession_${sessionId}_${startTime.toISOString().split('T')[0]}.json`;
      timeTrackingFolder.createFile(
        Utilities.newBlob(JSON.stringify(sessionRecord, null, 2), 'application/json', fileName)
      );
    } catch (driveError) {
      console.log('Drive save failed but continuing:', driveError.toString());
    }
    
    logActivity('TIME_TRACKING_STARTED', `Started tracking: ${taskDescription}`, sessionId);
    
    return {
      success: true,
      sessionId: sessionId,
      startTime: startTime.toISOString(),
      message: 'Time tracking started successfully'
    };
    
  } catch (error) {
    logActivity('TIME_TRACKING_ERROR', `Failed to start tracking: ${error.toString()}`);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Stop active time tracking session
 */
function stopTimeTracking(sessionId) {
  try {
    const spreadsheet = getSpreadsheet();
    const timeSheet = spreadsheet.getSheetByName('TimeTracking');
    
    if (!timeSheet) {
      return {
        success: false,
        error: 'TimeTracking sheet not found'
      };
    }
    
    const data = timeSheet.getDataRange().getValues();
    const headers = data[0];
    const sessionIdCol = headers.indexOf('SessionID');
    const endTimeCol = headers.indexOf('EndTime');
    const durationCol = headers.indexOf('Duration');
    const amountCol = headers.indexOf('Amount');
    const statusCol = headers.indexOf('Status');
    const hourlyRateCol = headers.indexOf('HourlyRate');
    const startTimeCol = headers.indexOf('StartTime');
    
    // Find session row
    let sessionRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][sessionIdCol] === sessionId) {
        sessionRow = i + 1;
        break;
      }
    }
    
    if (sessionRow === -1) {
      return {
        success: false,
        error: 'Session not found'
      };
    }
    
    const endTime = new Date();
    const startTime = new Date(data[sessionRow - 1][startTimeCol]);
    const durationMs = endTime - startTime;
    const durationHours = durationMs / (1000 * 60 * 60);
    const hourlyRate = data[sessionRow - 1][hourlyRateCol];
    const amount = durationHours * hourlyRate;
    
    // Update session in sheet
    timeSheet.getRange(sessionRow, endTimeCol + 1).setValue(endTime);
    timeSheet.getRange(sessionRow, durationCol + 1).setValue(durationHours.toFixed(2));
    timeSheet.getRange(sessionRow, amountCol + 1).setValue(amount.toFixed(2));
    timeSheet.getRange(sessionRow, statusCol + 1).setValue('COMPLETED');
    
    // Clear active session from PropertiesService
    PropertiesService.getScriptProperties().deleteProperty('ACTIVE_TIME_SESSION');
    PropertiesService.getScriptProperties().deleteProperty('SESSION_START_TIME');
    PropertiesService.getScriptProperties().deleteProperty('SESSION_PROJECT_ID');
    PropertiesService.getScriptProperties().deleteProperty('SESSION_TASK_DESC');
    
    // Save completed session to Drive
    try {
      const rootFolder = getRootFolder();
      const timeTrackingFolder = createSubfolder(rootFolder, 'TimeTracking');
      
      const sessionRecord = {
        sessionId: sessionId,
        projectId: data[sessionRow - 1][projectIdCol],
        taskDescription: data[sessionRow - 1][taskDescCol],
        startTime: data[sessionRow - 1][startTimeCol],
        endTime: endTime.toISOString(),
        duration: durationHours.toFixed(2),
        hourlyRate: hourlyRate,
        amount: amount.toFixed(2),
        status: 'COMPLETED',
        date: data[sessionRow - 1][dateCol]
      };
      
      const fileName = `TimeSession_${sessionId}_COMPLETED.json`;
      const sessionFile = timeTrackingFolder.createFile(
        Utilities.newBlob(JSON.stringify(sessionRecord, null, 2), 'application/json', fileName)
      );
    } catch (driveError) {
      console.log('Drive save failed but continuing:', driveError.toString());
    }
    
    logActivity('TIME_TRACKING_STOPPED', `Completed session: ${durationHours.toFixed(2)} hours, Rs. ${amount.toFixed(2)}`, sessionId);
    
    return {
      success: true,
      duration: durationHours.toFixed(2),
      amount: amount.toFixed(2),
      message: 'Time tracking stopped and saved to Drive successfully'
    };
    
  } catch (error) {
    logActivity('TIME_TRACKING_ERROR', `Failed to stop tracking: ${error.toString()}`);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get active time tracking session
 */
function getActiveTimeSession() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const sessionId = properties.getProperty('ACTIVE_TIME_SESSION');
    
    if (!sessionId) {
      return null;
    }
    
    const startTime = properties.getProperty('SESSION_START_TIME');
    const projectId = properties.getProperty('SESSION_PROJECT_ID');
    const taskDescription = properties.getProperty('SESSION_TASK_DESC');
    
    return {
      sessionId: sessionId,
      startTime: new Date(parseInt(startTime)).toISOString(),
      projectId: projectId,
      taskDescription: taskDescription
    };
    
  } catch (error) {
    console.log('Error getting active session:', error);
    return null;
  }
}

// ================================
// EXPENSE MANAGEMENT FUNCTIONS
// ================================

/**
 * Add new expense with Drive storage
 */
function addExpense(expenseData) {
  try {
    const spreadsheet = getSpreadsheet();
    let expenseSheet = spreadsheet.getSheetByName('Expenses');
    
    // Create Expenses sheet if it doesn't exist
    if (!expenseSheet) {
      expenseSheet = spreadsheet.insertSheet('Expenses');
      const headers = [
        'ExpenseID', 'Amount', 'Currency', 'Category', 'Description', 
        'Date', 'CreatedAt', 'Status', 'Receipt'
      ];
      expenseSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      expenseSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    const expenseId = generateId();
    const currentDate = new Date();
    
    // Save expense record to Drive with logging
    const rootFolder = getRootFolder();
    console.log('📁 Root folder for expense:', rootFolder.getName(), 'ID:', rootFolder.getId());
    
    const expensesFolder = createSubfolder(rootFolder, 'Expenses');
    console.log('📂 Expenses folder:', expensesFolder.getName(), 'ID:', expensesFolder.getId());
    
    // Create detailed expense record
    const expenseRecord = {
      expenseId: expenseId,
      amount: expenseData.amount,
      currency: expenseData.currency || 'PKR',
      category: expenseData.category,
      description: expenseData.description,
      date: expenseData.date,
      createdAt: currentDate.toISOString(),
      status: 'RECORDED'
    };
    
    const fileName = `Expense_${expenseData.category.replace(/\s+/g, '_')}_${expenseData.date}_${expenseId}.json`;
    console.log('💰 Creating expense file:', fileName);
    
    const expenseFile = expensesFolder.createFile(
      Utilities.newBlob(JSON.stringify(expenseRecord, null, 2), 'application/json', fileName)
    );
    console.log('✅ Expense file created:', expenseFile.getName(), 'ID:', expenseFile.getId());
    
    const newRow = [
      expenseId,
      expenseData.amount,
      expenseData.currency,
      expenseData.category,
      expenseData.description,
      expenseData.date,
      currentDate,
      'RECORDED',
      expenseFile.getId() // Store Drive file ID
    ];
    
    expenseSheet.appendRow(newRow);
    
    logActivity('EXPENSE_ADDED', `Added expense: ${expenseData.currency} ${expenseData.amount} - ${expenseData.category}`, expenseId);
    
    return {
      success: true,
      expenseId: expenseId,
      fileId: expenseFile.getId(),
      fileUrl: expenseFile.getUrl(),
      fileName: fileName,
      message: 'Expense added successfully and saved to Drive'
    };
    
  } catch (error) {
    logActivity('EXPENSE_ERROR', `Failed to add expense: ${error.toString()}`);
    return {
      success: false,
      error: error.toString()
    };
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
      return {
        success: true,
        summary: {
          totalExpenses: 0,
          monthlyExpenses: 0,
          topCategories: [],
          recentExpenses: []
        }
      };
    }
    
    const data = expenseSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return {
        success: true,
        summary: {
          totalExpenses: 0,
          monthlyExpenses: 0,
          topCategories: [],
          recentExpenses: []
        }
      };
    }
    
    const headers = data[0];
    const amountCol = headers.indexOf('Amount');
    const currencyCol = headers.indexOf('Currency');
    const categoryCol = headers.indexOf('Category');
    const dateCol = headers.indexOf('Date');
    const descCol = headers.indexOf('Description');
    
    let totalExpenses = 0;
    let monthlyExpenses = 0;
    const categories = {};
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    for (let i = 1; i < data.length; i++) {
      const amount = parseFloat(data[i][amountCol]) || 0;
      const currency = data[i][currencyCol];
      const category = data[i][categoryCol];
      const expenseDate = new Date(data[i][dateCol]);
      
      // Convert to PKR (simplified - assuming 1:1 for now)
      const amountPKR = currency === 'PKR' ? amount : amount * 280; // Approximate USD to PKR
      
      totalExpenses += amountPKR;
      
      // Monthly expenses
      if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
        monthlyExpenses += amountPKR;
      }
      
      // Category summary
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += amountPKR;
    }
    
    // Top categories
    const topCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({
        category: category,
        amount: amount.toFixed(2)
      }));
    
    return {
      success: true,
      summary: {
        totalExpenses: totalExpenses.toFixed(2),
        monthlyExpenses: monthlyExpenses.toFixed(2),
        topCategories: topCategories,
        recentExpenses: data.slice(-5).reverse() // Last 5 expenses
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ================================
// CURRENCY CONVERSION FUNCTIONS
// ================================

/**
 * Get live currency rates
 */
function getCurrencyRates() {
  try {
    const url = 'https://api.exchangerate-api.com/v4/latest/USD';
    
    try {
      const response = UrlFetchApp.fetch(url, {
        method: 'GET',
        muteHttpExceptions: true
      });
      
      if (response.getResponseCode() === 200) {
        const data = JSON.parse(response.getContentText());
        
        // Store rates in cache
        const cache = CacheService.getScriptCache();
        cache.put('CURRENCY_RATES', JSON.stringify(data.rates), 3600); // 1 hour
        
        return {
          success: true,
          rates: data.rates,
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (fetchError) {
      console.log('API fetch failed, using fallback rates');
    }
    
    // Fallback rates if API fails
    const fallbackRates = {
      'PKR': 280.50,
      'USD': 1.00,
      'EUR': 0.85,
      'GBP': 0.73,
      'CAD': 1.25,
      'AUD': 1.35,
      'JPY': 110.00
    };
    
    return {
      success: true,
      rates: fallbackRates,
      lastUpdated: new Date().toISOString(),
      note: 'Using fallback rates'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Convert currency
 */
function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    if (fromCurrency === toCurrency) {
      return {
        success: true,
        convertedAmount: amount,
        rate: 1,
        message: 'Same currency conversion'
      };
    }
    
    // Get rates from cache or API
    let rates;
    const cache = CacheService.getScriptCache();
    const cachedRates = cache.get('CURRENCY_RATES');
    
    if (cachedRates) {
      rates = JSON.parse(cachedRates);
    } else {
      const ratesResult = getCurrencyRates();
      if (ratesResult.success) {
        rates = ratesResult.rates;
      } else {
        throw new Error('Failed to get currency rates');
      }
    }
    
    // Convert via USD
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];
    
    if (!fromRate || !toRate) {
      throw new Error('Currency not supported');
    }
    
    // Convert: amount -> USD -> target currency
    const usdAmount = fromCurrency === 'USD' ? amount : amount / fromRate;
    const convertedAmount = toCurrency === 'USD' ? usdAmount : usdAmount * toRate;
    const exchangeRate = toRate / fromRate;
    
    return {
      success: true,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      rate: exchangeRate.toFixed(4),
      message: 'Conversion successful'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ================================
// BUSINESS ANALYTICS FUNCTIONS
// ================================

/**
 * Get comprehensive business analytics
 */
function getBusinessAnalytics() {
  try {
    const spreadsheet = getSpreadsheet();
    
    const analytics = {
      revenue: calculateRevenueAnalytics(spreadsheet),
      proposals: calculateProposalAnalytics(spreadsheet),
      timeTracking: calculateTimeAnalytics(spreadsheet),
      expenses: calculateExpenseAnalytics(spreadsheet),
      clients: calculateClientAnalytics(spreadsheet),
      projects: calculateProjectAnalytics(spreadsheet)
    };
    
    return analytics;
    
  } catch (error) {
    console.log('Analytics error:', error);
    return {
      revenue: { currentMonth: 0, lastMonth: 0, growth: 0 },
      proposals: { total: 0, accepted: 0, conversionRate: 0 },
      timeTracking: { thisWeekHours: 0, avgHourlyRate: 0 },
      expenses: { monthlyExpenses: 0, topCategory: 'None' },
      clients: { total: 0, active: 0 },
      projects: { active: 0, completed: 0 }
    };
  }
}

function calculateRevenueAnalytics(spreadsheet) {
  try {
    const invoiceSheet = spreadsheet.getSheetByName('Invoices');
    if (!invoiceSheet) return { currentMonth: 0, lastMonth: 0, growth: 0 };
    
    const data = invoiceSheet.getDataRange().getValues();
    if (data.length <= 1) return { currentMonth: 0, lastMonth: 0, growth: 0 };
    
    const headers = data[0];
    const amountCol = headers.indexOf('Amount');
    const statusCol = headers.indexOf('Status');
    const dateCol = headers.indexOf('IssueDate');
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const lastMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;
    const lastMonthYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    
    let currentMonthRevenue = 0;
    let lastMonthRevenue = 0;
    
    for (let i = 1; i < data.length; i++) {
      const status = data[i][statusCol];
      const amount = parseFloat(data[i][amountCol]) || 0;
      const invoiceDate = new Date(data[i][dateCol]);
      
      if (status === 'PAID') {
        if (invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear) {
          currentMonthRevenue += amount;
        } else if (invoiceDate.getMonth() === lastMonth && invoiceDate.getFullYear() === lastMonthYear) {
          lastMonthRevenue += amount;
        }
      }
    }
    
    const growth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;
    
    return {
      currentMonth: currentMonthRevenue,
      lastMonth: lastMonthRevenue,
      growth: Math.round(growth * 100) / 100
    };
    
  } catch (error) {
    return { currentMonth: 0, lastMonth: 0, growth: 0 };
  }
}

function calculateProposalAnalytics(spreadsheet) {
  try {
    const proposalSheet = spreadsheet.getSheetByName('Proposals');
    if (!proposalSheet) return { total: 0, accepted: 0, conversionRate: 0 };
    
    const data = proposalSheet.getDataRange().getValues();
    if (data.length <= 1) return { total: 0, accepted: 0, conversionRate: 0 };
    
    const headers = data[0];
    const statusCol = headers.indexOf('Status');
    
    let total = data.length - 1;
    let accepted = 0;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][statusCol] === 'ACCEPTED') {
        accepted++;
      }
    }
    
    const conversionRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    
    return {
      total: total,
      accepted: accepted,
      conversionRate: conversionRate
    };
    
  } catch (error) {
    return { total: 0, accepted: 0, conversionRate: 0 };
  }
}

function calculateTimeAnalytics(spreadsheet) {
  try {
    const timeSheet = spreadsheet.getSheetByName('TimeTracking');
    if (!timeSheet) return { thisWeekHours: 0, avgHourlyRate: 0 };
    
    const data = timeSheet.getDataRange().getValues();
    if (data.length <= 1) return { thisWeekHours: 0, avgHourlyRate: 0 };
    
    const headers = data[0];
    const durationCol = headers.indexOf('Duration');
    const hourlyRateCol = headers.indexOf('HourlyRate');
    const dateCol = headers.indexOf('Date');
    const statusCol = headers.indexOf('Status');
    
    const currentDate = new Date();
    const weekStart = new Date(currentDate.getTime() - (currentDate.getDay() * 24 * 60 * 60 * 1000));
    
    let thisWeekHours = 0;
    let totalHours = 0;
    let totalRate = 0;
    let sessionCount = 0;
    
    for (let i = 1; i < data.length; i++) {
      const sessionDate = new Date(data[i][dateCol]);
      const duration = parseFloat(data[i][durationCol]) || 0;
      const hourlyRate = parseFloat(data[i][hourlyRateCol]) || 0;
      const status = data[i][statusCol];
      
      if (status === 'COMPLETED') {
        totalHours += duration;
        totalRate += hourlyRate;
        sessionCount++;
        
        if (sessionDate >= weekStart) {
          thisWeekHours += duration;
        }
      }
    }
    
    const avgHourlyRate = sessionCount > 0 ? totalRate / sessionCount : 0;
    
    return {
      thisWeekHours: Math.round(thisWeekHours * 100) / 100,
      avgHourlyRate: Math.round(avgHourlyRate * 100) / 100
    };
    
  } catch (error) {
    return { thisWeekHours: 0, avgHourlyRate: 0 };
  }
}

function calculateExpenseAnalytics(spreadsheet) {
  try {
    const expenseSheet = spreadsheet.getSheetByName('Expenses');
    if (!expenseSheet) return { monthlyExpenses: 0, topCategory: 'None' };
    
    const data = expenseSheet.getDataRange().getValues();
    if (data.length <= 1) return { monthlyExpenses: 0, topCategory: 'None' };
    
    const headers = data[0];
    const amountCol = headers.indexOf('Amount');
    const categoryCol = headers.indexOf('Category');
    const dateCol = headers.indexOf('Date');
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    let monthlyExpenses = 0;
    const categories = {};
    
    for (let i = 1; i < data.length; i++) {
      const expenseDate = new Date(data[i][dateCol]);
      const amount = parseFloat(data[i][amountCol]) || 0;
      const category = data[i][categoryCol];
      
      if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
        monthlyExpenses += amount;
        
        if (!categories[category]) {
          categories[category] = 0;
        }
        categories[category] += amount;
      }
    }
    
    const topCategory = Object.keys(categories).length > 0 
      ? Object.entries(categories).sort(([,a], [,b]) => b - a)[0][0]
      : 'None';
    
    return {
      monthlyExpenses: monthlyExpenses,
      topCategory: topCategory
    };
    
  } catch (error) {
    return { monthlyExpenses: 0, topCategory: 'None' };
  }
}

function calculateClientAnalytics(spreadsheet) {
  try {
    const clientSheet = spreadsheet.getSheetByName('Clients');
    if (!clientSheet) return { total: 0, active: 0 };
    
    const data = clientSheet.getDataRange().getValues();
    if (data.length <= 1) return { total: 0, active: 0 };
    
    const headers = data[0];
    const statusCol = headers.indexOf('Status');
    
    let total = data.length - 1;
    let active = 0;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][statusCol] === 'ACTIVE') {
        active++;
      }
    }
    
    return {
      total: total,
      active: active
    };
    
  } catch (error) {
    return { total: 0, active: 0 };
  }
}

function calculateProjectAnalytics(spreadsheet) {
  try {
    const projectSheet = spreadsheet.getSheetByName('Projects');
    if (!projectSheet) return { active: 0, completed: 0 };
    
    const data = projectSheet.getDataRange().getValues();
    if (data.length <= 1) return { active: 0, completed: 0 };
    
    const headers = data[0];
    const statusCol = headers.indexOf('Status');
    
    let active = 0;
    let completed = 0;
    
    for (let i = 1; i < data.length; i++) {
      const status = data[i][statusCol];
      if (status === 'IN_PROGRESS') {
        active++;
      } else if (status === 'COMPLETED') {
        completed++;
      }
    }
    
    return {
      active: active,
      completed: completed
    };
    
  } catch (error) {
    return { active: 0, completed: 0 };
  }
}

// ================================
// CONTRACT GENERATION FUNCTIONS
// ================================

/**
 * Generate professional contract
 */
function generateContract(contractData) {
  try {
    const template = getContractTemplate('service');
    
    // Replace placeholders with actual data
    let contractHTML = template
      .replace(/{{CLIENT_NAME}}/g, contractData.clientName)
      .replace(/{{CLIENT_COMPANY}}/g, contractData.clientCompany)
      .replace(/{{PROJECT_TITLE}}/g, contractData.projectTitle)
      .replace(/{{PROJECT_DESCRIPTION}}/g, contractData.projectDescription)
      .replace(/{{AMOUNT}}/g, contractData.amount.toLocaleString())
      .replace(/{{CURRENCY}}/g, contractData.currency)
      .replace(/{{START_DATE}}/g, contractData.startDate)
      .replace(/{{END_DATE}}/g, contractData.endDate)
      .replace(/{{CURRENT_DATE}}/g, new Date().toLocaleDateString())
      .replace(/{{FREELANCER_NAME}}/g, getSetting('BUSINESS_NAME') || 'Freelancer')
      .replace(/{{FREELANCER_EMAIL}}/g, getSetting('BUSINESS_EMAIL') || Session.getActiveUser().getEmail());
    
    // Generate PDF
    const blob = Utilities.newBlob(contractHTML, 'text/html', 'contract.html');
    const pdfBlob = blob.getAs('application/pdf');
    
    // Save to Drive with detailed logging
    const rootFolder = getRootFolder();
    console.log('📁 Root folder obtained:', rootFolder.getName(), 'ID:', rootFolder.getId());
    
    const contractsFolder = createSubfolder(rootFolder, 'Contracts');
    console.log('📂 Contracts folder:', contractsFolder.getName(), 'ID:', contractsFolder.getId());
    
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `Contract_${contractData.clientCompany.replace(/\s+/g, '_')}_${timestamp}.pdf`;
    console.log('📄 Creating PDF file:', fileName);
    
    const file = contractsFolder.createFile(pdfBlob.setName(fileName));
    console.log('✅ PDF file created:', file.getName(), 'ID:', file.getId());
    console.log('🔗 PDF URL:', file.getUrl());
    
    // Create contract metadata file
    const metadataFileName = `Contract_Metadata_${contractData.clientCompany.replace(/\s+/g, '_')}_${timestamp}.json`;
    const metadata = {
      contractId: generateId(),
      clientName: contractData.clientName,
      clientCompany: contractData.clientCompany,
      projectTitle: contractData.projectTitle,
      amount: contractData.amount,
      currency: contractData.currency,
      startDate: contractData.startDate,
      endDate: contractData.endDate,
      createdDate: new Date().toISOString(),
      pdfFileId: file.getId(),
      pdfFileName: fileName,
      pdfFileUrl: file.getUrl(),
      status: 'GENERATED'
    };
    
    const metadataFile = contractsFolder.createFile(
      Utilities.newBlob(JSON.stringify(metadata, null, 2), 'application/json', metadataFileName)
    );
    
    logActivity('CONTRACT_GENERATED', `Generated contract for ${contractData.clientName}`, file.getId());
    
    return {
      success: true,
      fileName: fileName,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      metadataFileId: metadataFile.getId(),
      metadataFileUrl: metadataFile.getUrl(),
      contractId: metadata.contractId
    };
    
  } catch (error) {
    logActivity('CONTRACT_ERROR', `Failed to generate contract: ${error.toString()}`);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get contract template
 */
function getContractTemplate(type) {
  const template = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; }
        .title { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .section { margin: 20px 0; }
        .section-title { font-size: 18px; font-weight: bold; color: #34495e; margin-bottom: 10px; }
        .amount { font-size: 20px; font-weight: bold; color: #27ae60; }
        .footer { margin-top: 40px; border-top: 1px solid #bdc3c7; padding-top: 20px; }
        .signature { margin-top: 30px; }
        .signature-line { border-bottom: 1px solid #000; width: 200px; display: inline-block; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">SERVICE AGREEMENT</div>
        <p>Contract Date: {{CURRENT_DATE}}</p>
    </div>
    
    <div class="section">
        <div class="section-title">1. PARTIES</div>
        <p><strong>Service Provider:</strong> {{FREELANCER_NAME}}<br>
        Email: {{FREELANCER_EMAIL}}</p>
        
        <p><strong>Client:</strong> {{CLIENT_NAME}}<br>
        Company: {{CLIENT_COMPANY}}</p>
    </div>
    
    <div class="section">
        <div class="section-title">2. PROJECT DETAILS</div>
        <p><strong>Project Title:</strong> {{PROJECT_TITLE}}</p>
        <p><strong>Description:</strong><br>{{PROJECT_DESCRIPTION}}</p>
        <p><strong>Project Period:</strong> {{START_DATE}} to {{END_DATE}}</p>
    </div>
    
    <div class="section">
        <div class="section-title">3. COMPENSATION</div>
        <p class="amount">Total Amount: {{CURRENCY}} {{AMOUNT}}</p>
        <p><strong>Payment Terms:</strong></p>
        <ul>
            <li>50% advance payment upon contract signing</li>
            <li>50% final payment upon project completion</li>
            <li>Payments to be made within 7 days of invoice</li>
        </ul>
    </div>
    
    <div class="section">
        <div class="section-title">4. SCOPE OF WORK</div>
        <p>The Service Provider agrees to deliver the project as described above within the specified timeframe. Any additional work beyond the agreed scope will be subject to separate agreement and billing.</p>
    </div>
    
    <div class="section">
        <div class="section-title">5. INTELLECTUAL PROPERTY</div>
        <p>Upon full payment, all intellectual property rights related to the project deliverables will transfer to the Client, except for any pre-existing materials or general methodologies used by the Service Provider.</p>
    </div>
    
    <div class="section">
        <div class="section-title">6. CONFIDENTIALITY</div>
        <p>Both parties agree to maintain confidentiality of any proprietary information shared during the course of this project.</p>
    </div>
    
    <div class="section">
        <div class="section-title">7. TERMINATION</div>
        <p>Either party may terminate this agreement with 7 days written notice. The Client will pay for all work completed up to the termination date.</p>
    </div>
    
    <div class="footer">
        <div class="signature">
            <p><strong>Service Provider:</strong></p>
            <p>{{FREELANCER_NAME}}</p>
            <p>Signature: <span class="signature-line"></span> Date: ___________</p>
        </div>
        
        <div class="signature" style="margin-top: 30px;">
            <p><strong>Client:</strong></p>
            <p>{{CLIENT_NAME}}</p>
            <p>Signature: <span class="signature-line"></span> Date: ___________</p>
        </div>
    </div>
</body>
</html>`;
  
  return template;
}

// ================================
// DATA BACKUP FUNCTIONS
// ================================

/**
 * Create comprehensive data backup
 */
function createDataBackup() {
  try {
    const spreadsheet = getSpreadsheet();
    const allData = {};
    
    // Get all sheet data
    const sheetNames = ['Clients', 'Proposals', 'Projects', 'Invoices', 'Tasks', 'Settings', 'TimeTracking', 'Expenses'];
    
    sheetNames.forEach(sheetName => {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (sheet) {
        const data = sheet.getDataRange().getValues();
        const headers = data[0] || [];
        const rows = data.slice(1);
        
        allData[sheetName] = {
          headers: headers,
          data: rows.map(row => {
            const rowObj = {};
            headers.forEach((header, index) => {
              rowObj[header] = row[index];
            });
            return rowObj;
          })
        };
      }
    });
    
    // Add metadata
    allData._metadata = {
      backupDate: new Date().toISOString(),
      version: '1.0',
      totalSheets: Object.keys(allData).length - 1,
      createdBy: Session.getActiveUser().getEmail()
    };
    
    // Convert to JSON
    const jsonData = JSON.stringify(allData, null, 2);
    
    // Save to Drive with detailed logging
    const rootFolder = getRootFolder();
    console.log('📁 Root folder for backup:', rootFolder.getName(), 'ID:', rootFolder.getId());
    
    const backupFolder = createSubfolder(rootFolder, 'Backups');
    console.log('📂 Backup folder:', backupFolder.getName(), 'ID:', backupFolder.getId());
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
    const fileName = `FreelancerData_Backup_${timestamp[0]}_${timestamp[1].split('.')[0]}.json`;
    console.log('💾 Creating backup file:', fileName);
    
    const file = backupFolder.createFile(Utilities.newBlob(jsonData, 'application/json', fileName));
    console.log('✅ Backup file created:', file.getName(), 'ID:', file.getId());
    console.log('🔗 Backup URL:', file.getUrl());
    
    // Create summary file
    const summaryData = {
      backupDate: new Date().toISOString(),
      fileName: fileName,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      backupSize: jsonData.length,
      sheetsBackedUp: Object.keys(allData).filter(key => key !== 'metadata').length,
      sheets: Object.keys(allData).filter(key => key !== 'metadata'),
      recordCounts: {}
    };
    
    // Add record counts for each sheet
    Object.keys(allData).forEach(sheetName => {
      if (sheetName !== 'metadata' && allData[sheetName].data) {
        summaryData.recordCounts[sheetName] = allData[sheetName].data.length;
      }
    });
    
    const summaryFileName = `Backup_Summary_${timestamp[0]}_${timestamp[1].split('.')[0]}.json`;
    const summaryFile = backupFolder.createFile(
      Utilities.newBlob(JSON.stringify(summaryData, null, 2), 'application/json', summaryFileName)
    );
    
    logActivity('DATA_BACKUP', `Created data backup: ${fileName}`, file.getId());
    
    return {
      success: true,
      fileName: fileName,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      summaryFileId: summaryFile.getId(),
      summaryFileUrl: summaryFile.getUrl(),
      backupSize: jsonData.length,
      sheetsBackedUp: Object.keys(allData).filter(key => key !== 'metadata').length
    };
    
  } catch (error) {
    logActivity('BACKUP_ERROR', `Failed to create backup: ${error.toString()}`);
    return {
      success: false,
      error: error.toString()
    };
  }
}