/**
 * Email Automation and Follow-up Functions
 * Handles automated email workflows, templates, and scheduled communications
 */

/**
 * Send automatic follow-ups for proposals and invoices
 */
function sendAutomaticFollowUps() {
  try {
    let totalSent = 0;
    
    // Send proposal follow-ups
    const proposalFollowUps = sendProposalFollowUps();
    totalSent += proposalFollowUps.sent || 0;
    
    // Send invoice follow-ups
    const invoiceFollowUps = sendAutomaticPaymentReminders();
    totalSent += invoiceFollowUps.message ? parseInt(invoiceFollowUps.message.match(/\d+/)[0]) : 0;
    
    // Send project status updates
    const projectUpdates = sendProjectStatusUpdates();
    totalSent += projectUpdates.sent || 0;
    
    logActivity('Email', `Automatic follow-ups sent: ${totalSent}`, '');
    
    return { success: true, message: `Sent ${totalSent} follow-up emails` };
    
  } catch (error) {
    console.error('Error sending automatic follow-ups:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send proposal follow-ups
 */
function sendProposalFollowUps() {
  try {
    const proposals = getAllProposals();
    const followUpDays = parseInt(getSetting('FOLLOW_UP_DAYS')) || 7;
    const today = new Date();
    let sentCount = 0;
    
    proposals.forEach(proposal => {
      if (proposal.Status === 'Sent') {
        const sentDate = new Date(proposal.SentDate);
        const daysSinceSent = Math.ceil((today - sentDate) / (1000 * 60 * 60 * 24));
        
        // Send follow-up if enough days have passed and no recent follow-up sent
        if (daysSinceSent >= followUpDays && daysSinceSent % followUpDays === 0) {
          const result = sendProposalFollowUp(proposal.ProposalID);
          if (result.success) {
            sentCount++;
          }
        }
      }
    });
    
    return { success: true, sent: sentCount };
    
  } catch (error) {
    console.error('Error sending proposal follow-ups:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send individual proposal follow-up
 */
function sendProposalFollowUp(proposalId) {
  try {
    const proposal = getProposalById(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    
    const client = getClientById(proposal.ClientID);
    if (!client) {
      throw new Error('Client not found');
    }
    
    const sentDate = new Date(proposal.SentDate);
    const daysSinceSent = Math.ceil((new Date() - sentDate) / (1000 * 60 * 60 * 24));
    
    const subject = `Following up on proposal: ${proposal.Title}`;
    const body = createProposalFollowUpEmail(proposal, client, daysSinceSent);
    
    GmailApp.sendEmail(
      client.Email,
      subject,
      body,
      { name: getSetting('COMPANY_NAME') || 'Your Business' }
    );
    
    logActivity('Email', `Proposal follow-up sent: ${proposal.Title}`, proposalId);
    
    return { success: true, message: 'Follow-up sent successfully' };
    
  } catch (error) {
    console.error('Error sending proposal follow-up:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create proposal follow-up email body
 */
function createProposalFollowUpEmail(proposal, client, daysSinceSent) {
  const companyName = getSetting('COMPANY_NAME') || 'Your Business';
  
  return `
Dear ${client.ContactName},

I hope this email finds you well. I wanted to follow up on the proposal I sent ${daysSinceSent} days ago for "${proposal.Title}".

PROPOSAL SUMMARY:
- Project: ${proposal.Title}
- Investment: ${proposal.Currency} ${parseFloat(proposal.Amount).toLocaleString()}
- Proposal Date: ${new Date(proposal.SentDate).toLocaleDateString()}

I understand you may need time to review the proposal with your team. If you have any questions or would like to discuss any aspects of the project, I'm happy to jump on a call or provide additional information.

Some common questions I can address:
• Timeline and milestones
• Specific deliverables and scope
• Payment terms and options
• References from similar projects

To accept the proposal, you can use this link:
${proposal.AcceptanceURL}

If you've decided to move in a different direction, I'd appreciate a brief note so I can update my records.

Thank you for considering ${companyName} for your project needs.

Best regards,
${companyName}
${getSetting('COMPANY_EMAIL')}
${getSetting('COMPANY_PHONE')}

P.S. This proposal is valid until ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}. After that, pricing may be subject to change.
  `.trim();
}

/**
 * Send project status updates to clients
 */
function sendProjectStatusUpdates() {
  try {
    const projects = getAllProjects();
    let sentCount = 0;
    
    projects.forEach(project => {
      if (project.Status === 'In Progress') {
        const startDate = new Date(project.StartDate);
        const today = new Date();
        const daysInProgress = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
        
        // Send weekly updates (every 7 days)
        if (daysInProgress > 0 && daysInProgress % 7 === 0) {
          const result = sendProjectStatusUpdate(project.ProjectID);
          if (result.success) {
            sentCount++;
          }
        }
      }
    });
    
    return { success: true, sent: sentCount };
    
  } catch (error) {
    console.error('Error sending project status updates:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send individual project status update
 */
function sendProjectStatusUpdate(projectId) {
  try {
    const project = getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    
    const client = getClientById(project.ClientID);
    if (!client) {
      throw new Error('Client not found');
    }
    
    const subject = `Project Update: ${project.Title}`;
    const body = createProjectStatusUpdateEmail(project, client);
    
    GmailApp.sendEmail(
      client.Email,
      subject,
      body,
      { name: getSetting('COMPANY_NAME') || 'Your Business' }
    );
    
    logActivity('Email', `Project status update sent: ${project.Title}`, projectId);
    
    return { success: true, message: 'Status update sent successfully' };
    
  } catch (error) {
    console.error('Error sending project status update:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create project status update email body
 */
function createProjectStatusUpdateEmail(project, client) {
  const companyName = getSetting('COMPANY_NAME') || 'Your Business';
  const startDate = new Date(project.StartDate);
  const today = new Date();
  const daysInProgress = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
  
  // Calculate progress percentage (simplified)
  let progressPercentage = 25; // Default to 25%
  if (project.DueDate) {
    const dueDate = new Date(project.DueDate);
    const totalDays = Math.ceil((dueDate - startDate) / (1000 * 60 * 60 * 24));
    progressPercentage = Math.min(Math.round((daysInProgress / totalDays) * 100), 90);
  }
  
  return `
Dear ${client.ContactName},

I hope you're doing well! I wanted to provide you with a quick update on your project "${project.Title}".

PROJECT STATUS: ${project.Status}
Progress: ${progressPercentage}% complete
Days in progress: ${daysInProgress}
${project.DueDate ? `Expected completion: ${new Date(project.DueDate).toLocaleDateString()}` : ''}

RECENT ACCOMPLISHMENTS:
• Project setup and planning completed
• Initial design/development phase underway
• Regular progress being made according to timeline

UPCOMING MILESTONES:
• Continued development and refinement
• Internal review and quality assurance
• Client review and feedback incorporation

NEXT STEPS:
We're continuing to make steady progress on your project. If you have any questions, concerns, or additional requirements, please don't hesitate to reach out.

I'll send another update next week, but feel free to contact me anytime if you need immediate information about the project status.

Thank you for your patience and trust in our work!

Best regards,
${companyName}
${getSetting('COMPANY_EMAIL')}
${getSetting('COMPANY_PHONE')}

---
You're receiving this update because you have an active project with us.
  `.trim();
}

/**
 * Send welcome email to new clients
 */
function sendWelcomeEmail(clientId) {
  try {
    const client = getClientById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    
    const subject = `Welcome to ${getSetting('COMPANY_NAME')}!`;
    const body = createWelcomeEmail(client);
    
    GmailApp.sendEmail(
      client.Email,
      subject,
      body,
      { name: getSetting('COMPANY_NAME') || 'Your Business' }
    );
    
    logActivity('Email', `Welcome email sent to: ${client.CompanyName}`, clientId);
    
    return { success: true, message: 'Welcome email sent successfully' };
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create welcome email body
 */
function createWelcomeEmail(client) {
  const companyName = getSetting('COMPANY_NAME') || 'Your Business';
  
  return `
Dear ${client.ContactName},

Welcome to ${companyName}! We're thrilled to have ${client.CompanyName} as our newest client.

I wanted to personally reach out and introduce myself as your primary point of contact. My goal is to ensure you have an exceptional experience working with us.

WHAT TO EXPECT:
• Prompt communication and regular updates
• High-quality deliverables that exceed expectations
• Transparent processes and clear timelines
• Dedicated support throughout our partnership

HOW WE WORK:
1. We'll start with a detailed discovery call to understand your needs
2. Create a comprehensive project plan with clear milestones
3. Provide regular updates and opportunities for feedback
4. Deliver exceptional results on time and within budget

GETTING STARTED:
I'll be in touch within the next 24-48 hours to schedule our discovery call and discuss your project requirements in detail.

In the meantime, if you have any questions or immediate needs, please don't hesitate to reach out:

📧 Email: ${getSetting('COMPANY_EMAIL')}
📞 Phone: ${getSetting('COMPANY_PHONE')}

We're looking forward to building a successful long-term partnership with you!

Best regards,
${companyName}

P.S. Feel free to connect with us on social media for updates and industry insights.
  `.trim();
}

/**
 * Send project completion email
 */
function sendProjectCompletionEmail(projectId) {
  try {
    const project = getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    
    const client = getClientById(project.ClientID);
    if (!client) {
      throw new Error('Client not found');
    }
    
    const subject = `Project Completed: ${project.Title}`;
    const body = createProjectCompletionEmail(project, client);
    
    GmailApp.sendEmail(
      client.Email,
      subject,
      body,
      { name: getSetting('COMPANY_NAME') || 'Your Business' }
    );
    
    logActivity('Email', `Project completion email sent: ${project.Title}`, projectId);
    
    return { success: true, message: 'Project completion email sent successfully' };
    
  } catch (error) {
    console.error('Error sending project completion email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create project completion email body
 */
function createProjectCompletionEmail(project, client) {
  const companyName = getSetting('COMPANY_NAME') || 'Your Business';
  
  return `
Dear ${client.ContactName},

🎉 Congratulations! I'm excited to inform you that your project "${project.Title}" has been completed!

PROJECT SUMMARY:
• Start Date: ${new Date(project.StartDate).toLocaleDateString()}
• Completion Date: ${new Date().toLocaleDateString()}
• Status: Completed

DELIVERABLES:
All project deliverables have been finalized and are ready for your review. You can access your project files through the link provided separately or in your project folder.

WHAT'S NEXT:
1. Please review all deliverables at your convenience
2. Let us know if you need any minor adjustments or clarifications
3. We'll process final invoicing once you've approved everything
4. Consider leaving us a testimonial about your experience

ONGOING SUPPORT:
While this project is complete, we're here to provide ongoing support if needed. Whether you have questions about the deliverables or need additional work in the future, please don't hesitate to reach out.

FUTURE OPPORTUNITIES:
We'd love to continue our partnership! If you have other projects or know someone who could benefit from our services, we'd appreciate your referral.

REQUEST FOR FEEDBACK:
Your feedback is invaluable to us. Would you mind taking a few minutes to:
• Share your experience working with us
• Provide a testimonial we could use (with your permission)
• Let us know how we can improve our services

Thank you for choosing ${companyName} for your project needs. It was a pleasure working with you and the ${client.CompanyName} team!

Best regards,
${companyName}
${getSetting('COMPANY_EMAIL')}
${getSetting('COMPANY_PHONE')}

P.S. We'd be grateful if you could leave us a review or refer us to colleagues who might need similar services.
  `.trim();
}

/**
 * Send testimonial request email
 */
function sendTestimonialRequest(clientId, projectId = null) {
  try {
    const client = getClientById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    
    let project = null;
    if (projectId) {
      project = getProjectById(projectId);
    }
    
    const subject = `Would you share your experience with ${getSetting('COMPANY_NAME')}?`;
    const body = createTestimonialRequestEmail(client, project);
    
    GmailApp.sendEmail(
      client.Email,
      subject,
      body,
      { name: getSetting('COMPANY_NAME') || 'Your Business' }
    );
    
    logActivity('Email', `Testimonial request sent to: ${client.CompanyName}`, clientId);
    
    return { success: true, message: 'Testimonial request sent successfully' };
    
  } catch (error) {
    console.error('Error sending testimonial request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create testimonial request email body
 */
function createTestimonialRequestEmail(client, project) {
  const companyName = getSetting('COMPANY_NAME') || 'Your Business';
  
  return `
Dear ${client.ContactName},

I hope you're doing well! It's been a pleasure working with ${client.CompanyName}${project ? ` on "${project.Title}"` : ''}.

As a small business, testimonials and reviews from satisfied clients like you are incredibly valuable to us. They help other potential clients understand the quality and value of our work.

WOULD YOU MIND SHARING YOUR EXPERIENCE?

If you're happy with our work together, would you consider:

1. 📝 Writing a brief testimonial about your experience
2. ⭐ Leaving a review on Google/LinkedIn/your preferred platform
3. 🗣️ Referring us to colleagues who might need similar services

WHAT WOULD BE HELPFUL:
• What specific results or outcomes did we achieve for you?
• How was our communication and project management?
• What stood out about working with us?
• Would you work with us again or recommend us to others?

Even just a few sentences would be incredibly valuable to us!

EASY OPTIONS:
• Reply to this email with your testimonial
• Leave a review on our Google Business page: [Your Google Business URL]
• Connect with us on LinkedIn and share your experience

Of course, this is completely voluntary, and we understand if you don't have time. Regardless, we truly appreciate the opportunity to work with you and look forward to potential future projects.

Thank you for being such a wonderful client!

Best regards,
${companyName}
${getSetting('COMPANY_EMAIL')}
${getSetting('COMPANY_PHONE')}

P.S. If you have any other projects coming up or know someone who could use our services, we'd love to hear about it!
  `.trim();
}

/**
 * Setup automatic email triggers (to be run daily via time-based trigger)
 */
function setupAutomaticEmailTriggers() {
  try {
    // Delete existing triggers
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'sendAutomaticFollowUps') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Create new daily trigger
    ScriptApp.newTrigger('sendAutomaticFollowUps')
      .timeBased()
      .everyDays(1)
      .atHour(9) // 9 AM
      .create();
    
    logActivity('System', 'Automatic email triggers setup', '');
    
    return { success: true, message: 'Email triggers setup successfully' };
    
  } catch (error) {
    console.error('Error setting up email triggers:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send custom email to client
 */
function sendCustomEmail(clientId, subject, message, attachmentIds = []) {
  try {
    const client = getClientById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    
    const options = {
      name: getSetting('COMPANY_NAME') || 'Your Business'
    };
    
    // Add attachments if provided
    if (attachmentIds.length > 0) {
      options.attachments = attachmentIds.map(id => {
        return DriveApp.getFileById(id).getBlob();
      });
    }
    
    GmailApp.sendEmail(client.Email, subject, message, options);
    
    logActivity('Email', `Custom email sent to: ${client.CompanyName}`, clientId);
    
    return { success: true, message: 'Email sent successfully' };
    
  } catch (error) {
    console.error('Error sending custom email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate monthly report and email to owner
 */
function generateMonthlyReport() {
  try {
    const report = createMonthlyReportContent();
    const subject = `Monthly Business Report - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    
    // Send to business owner
    const ownerEmail = getSetting('COMPANY_EMAIL');
    
    GmailApp.sendEmail(
      ownerEmail,
      subject,
      report,
      { name: getSetting('COMPANY_NAME') || 'Your Business' }
    );
    
    logActivity('System', 'Monthly report generated and sent', '');
    
    return { success: true, message: 'Monthly report sent successfully' };
    
  } catch (error) {
    console.error('Error generating monthly report:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create monthly report content
 */
function createMonthlyReportContent() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Get data for the month
  const clients = getAllClients();
  const proposals = getAllProposals();
  const projects = getAllProjects();
  const invoices = getAllInvoices();
  
  // Filter for current month
  const monthProposals = proposals.filter(p => {
    const date = new Date(p.CreatedDate);
    return date >= firstDayOfMonth && date <= lastDayOfMonth;
  });
  
  const monthInvoices = invoices.filter(i => {
    const date = new Date(i.IssueDate);
    return date >= firstDayOfMonth && date <= lastDayOfMonth;
  });
  
  const monthRevenue = monthInvoices
    .filter(i => i.Status === 'Paid')
    .reduce((sum, i) => sum + parseFloat(i.Amount), 0);
  
  const monthlyReport = `
MONTHLY BUSINESS REPORT
${firstDayOfMonth.toLocaleDateString()} - ${lastDayOfMonth.toLocaleDateString()}

📊 OVERVIEW:
• Total Clients: ${clients.length}
• Proposals Created: ${monthProposals.length}
• Proposals Accepted: ${monthProposals.filter(p => p.Status === 'Accepted').length}
• Active Projects: ${projects.filter(p => p.Status === 'In Progress').length}
• Invoices Sent: ${monthInvoices.length}
• Revenue Collected: $${monthRevenue.toLocaleString()}

💰 FINANCIAL SUMMARY:
• Total Revenue This Month: $${monthRevenue.toLocaleString()}
• Outstanding Invoices: $${invoices.filter(i => i.Status === 'Sent').reduce((sum, i) => sum + parseFloat(i.Amount), 0).toLocaleString()}
• Overdue Invoices: ${invoices.filter(i => i.Status === 'Sent' && new Date(i.DueDate) < new Date()).length}

📈 PROPOSAL METRICS:
• Proposals Sent: ${monthProposals.filter(p => p.Status === 'Sent' || p.Status === 'Accepted').length}
• Acceptance Rate: ${monthProposals.length > 0 ? ((monthProposals.filter(p => p.Status === 'Accepted').length / monthProposals.length) * 100).toFixed(1) : 0}%
• Average Proposal Value: $${monthProposals.length > 0 ? (monthProposals.reduce((sum, p) => sum + parseFloat(p.Amount), 0) / monthProposals.length).toLocaleString() : 0}

🎯 PROJECT STATUS:
• Projects Started: ${projects.filter(p => new Date(p.StartDate) >= firstDayOfMonth && new Date(p.StartDate) <= lastDayOfMonth).length}
• Projects Completed: ${projects.filter(p => p.CompletionDate && new Date(p.CompletionDate) >= firstDayOfMonth && new Date(p.CompletionDate) <= lastDayOfMonth).length}
• Projects In Progress: ${projects.filter(p => p.Status === 'In Progress').length}

📧 EMAIL ACTIVITY:
Check your logs for detailed email automation statistics.

Generated automatically by your Freelancer Workflow System.
  `.trim();
  
  return monthlyReport;
}

/**
 * Batch send emails (utility function)
 */
function batchSendEmails(emailJobs) {
  const results = [];
  
  emailJobs.forEach(job => {
    try {
      const options = {
        name: getSetting('COMPANY_NAME') || 'Your Business'
      };
      
      if (job.attachments) {
        options.attachments = job.attachments;
      }
      
      GmailApp.sendEmail(job.to, job.subject, job.body, options);
      results.push({ success: true, to: job.to });
      
      // Add small delay to avoid hitting Gmail quota limits
      Utilities.sleep(1000);
      
    } catch (error) {
      console.error(`Error sending email to ${job.to}:`, error);
      results.push({ success: false, to: job.to, error: error.message });
    }
  });
  
  return results;
}