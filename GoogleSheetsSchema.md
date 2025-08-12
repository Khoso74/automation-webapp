# Google Sheets Database Schema

## Overview

The Freelancer Workflow Management System uses a single Google Spreadsheet with multiple tabs to store all data. Each tab serves a specific purpose and has a defined structure.

## Tab Structure

### 1. Clients Tab

**Purpose**: Store client information and contact details

| Column | Data Type | Description | Example |
|--------|-----------|-------------|---------|
| Client ID | Text | Unique identifier (CLI + timestamp) | CLI1640995200123 |
| Company Name | Text | Client company name | Acme Corporation |
| Contact Name | Text | Primary contact person | John Smith |
| Email | Email | Contact email address | john@acmecorp.com |
| Phone | Text | Phone number | +1-555-123-4567 |
| Address | Text | Business address | 123 Business Ave, City, ST 12345 |
| Created Date | Date | When client was added | 2024-01-15 |
| Status | Text | Client status (Active/Inactive) | Active |

**Sample Data:**
```
Client ID          | Company Name      | Contact Name | Email                | Phone           | Address                    | Created Date | Status
CLI1640995200123   | Acme Corporation  | John Smith   | john@acmecorp.com    | +1-555-123-4567 | 123 Business Ave, City, ST | 2024-01-15   | Active
CLI1640995300456   | Tech Startup Inc  | Jane Doe     | jane@techstartup.com | +1-555-987-6543 | 456 Tech St, City, ST      | 2024-01-20   | Active
CLI1640995400789   | Local Business    | Bob Johnson  | bob@localbiz.com     | +1-555-555-5555 | 789 Main St, City, ST      | 2024-01-25   | Inactive
```

### 2. Proposals Tab

**Purpose**: Track project proposals from creation to acceptance

| Column | Data Type | Description | Example |
|--------|-----------|-------------|---------|
| Proposal ID | Text | Unique identifier (PROP + timestamp) | PROP1640995500123 |
| Client ID | Text | Reference to Clients tab | CLI1640995200123 |
| Title | Text | Project title | Website Redesign Project |
| Description | Text | Project description | Complete redesign of company website |
| Amount | Number | Proposal amount | 5000 |
| Currency | Text | Currency code | USD |
| Status | Text | Proposal status | Draft/Sent/Accepted/Rejected |
| Created Date | Date | When proposal was created | 2024-01-16 |
| Sent Date | Date | When proposal was sent | 2024-01-17 |
| Accepted Date | Date | When proposal was accepted | 2024-01-20 |
| PDF URL | URL | Google Drive link to PDF | https://drive.google.com/file/d/... |
| Acceptance URL | URL | Client acceptance page link | https://script.google.com/... |

**Sample Data:**
```
Proposal ID        | Client ID        | Title                | Description           | Amount | Currency | Status   | Created Date | Sent Date  | Accepted Date | PDF URL                        | Acceptance URL
PROP1640995500123  | CLI1640995200123 | Website Redesign     | Complete redesign...  | 5000   | USD      | Accepted | 2024-01-16  | 2024-01-17 | 2024-01-20   | https://drive.google.com/...   | https://script.google.com/...
PROP1640995600456  | CLI1640995300456 | Mobile App          | iOS/Android app       | 8000   | USD      | Sent     | 2024-01-18  | 2024-01-19 |               | https://drive.google.com/...   | https://script.google.com/...
PROP1640995700789  | CLI1640995400789 | SEO Optimization    | Search engine opt     | 2500   | USD      | Draft    | 2024-01-22  |            |               |                                |
```

### 3. Projects Tab

**Purpose**: Manage active and completed projects

| Column | Data Type | Description | Example |
|--------|-----------|-------------|---------|
| Project ID | Text | Unique identifier (PROJ + timestamp) | PROJ1640995800123 |
| Proposal ID | Text | Reference to Proposals tab | PROP1640995500123 |
| Client ID | Text | Reference to Clients tab | CLI1640995200123 |
| Title | Text | Project title | Website Redesign Project |
| Status | Text | Project status | Planning/In Progress/Completed |
| Start Date | Date | Project start date | 2024-01-21 |
| Due Date | Date | Project due date | 2024-03-15 |
| Completion Date | Date | When project was completed | 2024-03-10 |
| Drive Folder ID | Text | Google Drive folder ID | 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms |
| Notes | Text | Project notes | Initial mockups approved |

**Sample Data:**
```
Project ID         | Proposal ID      | Client ID        | Title              | Status      | Start Date | Due Date   | Completion Date | Drive Folder ID                    | Notes
PROJ1640995800123  | PROP1640995500123| CLI1640995200123 | Website Redesign   | Completed   | 2024-01-21 | 2024-03-15 | 2024-03-10     | 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs | Project completed ahead of schedule
PROJ1640995900456  | PROP1640995600456| CLI1640995300456 | Mobile App         | In Progress | 2024-02-01 | 2024-05-01 |                | 2BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbc | Backend development phase
```

### 4. Invoices Tab

**Purpose**: Track invoices and payment status

| Column | Data Type | Description | Example |
|--------|-----------|-------------|---------|
| Invoice ID | Text | Unique identifier (INV + timestamp) | INV1640996000123 |
| Project ID | Text | Reference to Projects tab | PROJ1640995800123 |
| Client ID | Text | Reference to Clients tab | CLI1640995200123 |
| Amount | Number | Invoice amount | 2500 |
| Currency | Text | Currency code | USD |
| Issue Date | Date | When invoice was issued | 2024-02-01 |
| Due Date | Date | Payment due date | 2024-03-02 |
| Status | Text | Invoice status | Draft/Sent/Paid/Overdue |
| Payment Date | Date | When payment was received | 2024-02-28 |
| PDF URL | URL | Google Drive link to PDF | https://drive.google.com/file/d/... |
| Payment Link | URL | PayPal or payment link | https://paypal.me/username/2500USD |

**Sample Data:**
```
Invoice ID         | Project ID       | Client ID        | Amount | Currency | Issue Date | Due Date   | Status | Payment Date | PDF URL                      | Payment Link
INV1640996000123   | PROJ1640995800123| CLI1640995200123 | 2500   | USD      | 2024-02-01 | 2024-03-02 | Paid   | 2024-02-28   | https://drive.google.com/... | https://paypal.me/username/2500USD
INV1640996100456   | PROJ1640995800123| CLI1640995200123 | 2500   | USD      | 2024-03-15 | 2024-04-14 | Sent   |              | https://drive.google.com/... | https://paypal.me/username/2500USD
INV1640996200789   | PROJ1640995900456| CLI1640995300456 | 4000   | USD      | 2024-03-01 | 2024-03-31 | Draft  |              |                              |
```

### 5. Tasks Tab

**Purpose**: Track individual tasks within projects

| Column | Data Type | Description | Example |
|--------|-----------|-------------|---------|
| Task ID | Text | Unique identifier (TASK + timestamp) | TASK1640996300123 |
| Project ID | Text | Reference to Projects tab | PROJ1640995800123 |
| Title | Text | Task title | Create homepage mockup |
| Description | Text | Task description | Design homepage layout with hero section |
| Status | Text | Task status | Todo/In Progress/Completed |
| Priority | Text | Task priority | Low/Medium/High |
| Due Date | Date | Task due date | 2024-02-05 |
| Completed Date | Date | When task was completed | 2024-02-03 |

**Sample Data:**
```
Task ID            | Project ID       | Title                | Description                    | Status    | Priority | Due Date   | Completed Date
TASK1640996300123  | PROJ1640995800123| Create homepage      | Design homepage layout         | Completed | High     | 2024-02-05 | 2024-02-03
TASK1640996400456  | PROJ1640995800123| Setup hosting        | Configure production server    | Completed | Medium   | 2024-02-10 | 2024-02-08
TASK1640996500789  | PROJ1640995900456| Database design      | Design app database schema     | In Progress| High     | 2024-03-01 |
```

### 6. Logs Tab

**Purpose**: Track system activity and audit trail

| Column | Data Type | Description | Example |
|--------|-----------|-------------|---------|
| Timestamp | DateTime | When activity occurred | 2024-01-15 14:30:25 |
| Type | Text | Activity type | Email/Proposal/Invoice/Client/System |
| Description | Text | Activity description | New client created: Acme Corporation |
| Reference ID | Text | Related record ID | CLI1640995200123 |
| Status | Text | Activity status | Success/Error |

**Sample Data:**
```
Timestamp           | Type     | Description                        | Reference ID      | Status
2024-01-15 14:30:25 | Client   | New client created: Acme Corp      | CLI1640995200123  | Success
2024-01-16 09:15:30 | Proposal | Proposal created: Website Redesign | PROP1640995500123 | Success
2024-01-17 10:45:12 | Email    | Proposal sent to john@acmecorp.com | PROP1640995500123 | Success
2024-01-20 16:22:18 | Proposal | Proposal accepted: Website Redesign| PROP1640995500123 | Success
2024-02-01 11:30:45 | Invoice  | Invoice created: INV1640996000123  | INV1640996000123  | Success
```

### 7. Settings Tab

**Purpose**: Store application configuration settings

| Column | Data Type | Description | Example |
|--------|-----------|-------------|---------|
| Setting | Text | Setting name | COMPANY_NAME |
| Value | Text | Setting value | John's Web Design |
| Description | Text | Setting description | Your company/business name |

**Sample Data:**
```
Setting              | Value                          | Description
COMPANY_NAME         | John's Web Design              | Your company/business name
COMPANY_EMAIL        | john@webdesign.com             | Your business email address
COMPANY_PHONE        | +1-555-123-4567                | Your business phone number
COMPANY_ADDRESS      | 123 Main St, City, State 12345| Your business address
DEFAULT_CURRENCY     | USD                            | Default currency for proposals and invoices
PAYPAL_ME_LINK       | https://paypal.me/johnsmith    | Your PayPal.me payment link
PAYMENT_TERMS_DAYS   | 30                             | Default payment terms in days
FOLLOW_UP_DAYS       | 7                              | Days before sending follow-up emails
REMINDER_DAYS        | 3                              | Days before due date to send reminders
```

## Data Relationships

### Primary Keys
- **Clients**: Client ID
- **Proposals**: Proposal ID
- **Projects**: Project ID
- **Invoices**: Invoice ID
- **Tasks**: Task ID
- **Logs**: Timestamp + Reference ID (composite)
- **Settings**: Setting (unique)

### Foreign Key Relationships
- **Proposals.Client ID** → **Clients.Client ID**
- **Projects.Proposal ID** → **Proposals.Proposal ID**
- **Projects.Client ID** → **Clients.Client ID**
- **Invoices.Project ID** → **Projects.Project ID**
- **Invoices.Client ID** → **Clients.Client ID**
- **Tasks.Project ID** → **Projects.Project ID**

## Data Validation Rules

### ID Format
- Client IDs: `CLI` + 13-digit timestamp + 3-digit random
- Proposal IDs: `PROP` + 13-digit timestamp + 3-digit random
- Project IDs: `PROJ` + 13-digit timestamp + 3-digit random
- Invoice IDs: `INV` + 13-digit timestamp + 3-digit random
- Task IDs: `TASK` + 13-digit timestamp + 3-digit random

### Status Values
- **Client Status**: Active, Inactive
- **Proposal Status**: Draft, Sent, Accepted, Rejected
- **Project Status**: Planning, In Progress, On Hold, Completed, Cancelled
- **Invoice Status**: Draft, Sent, Paid, Overdue, Cancelled
- **Task Status**: Todo, In Progress, Completed, Cancelled
- **Task Priority**: Low, Medium, High
- **Log Status**: Success, Error, Warning

### Required Fields
- **Clients**: Client ID, Company Name, Contact Name, Email, Created Date, Status
- **Proposals**: Proposal ID, Client ID, Title, Amount, Currency, Status, Created Date
- **Projects**: Project ID, Client ID, Title, Status, Start Date
- **Invoices**: Invoice ID, Client ID, Amount, Currency, Issue Date, Due Date, Status
- **Tasks**: Task ID, Project ID, Title, Status
- **Logs**: Timestamp, Type, Description, Status
- **Settings**: Setting, Value

## Usage Notes

### Data Entry
- All IDs are automatically generated by the system
- Dates are automatically set for creation timestamps
- Status fields have predefined values
- Email addresses must be valid format
- Amounts must be positive numbers

### Data Integrity
- Foreign key relationships are maintained by the application logic
- Deletion is handled as status changes (Active → Inactive)
- Historical data is preserved in the Logs tab
- Settings are validated before saving

### Performance Considerations
- Sheet has built-in filters for easy data navigation
- Large datasets (1000+ records) may require pagination
- Regular cleanup of old log entries recommended
- Backup sheets created automatically on major updates

### Security
- Sheet access controlled through Google Sheets permissions
- No sensitive data (passwords, payment details) stored
- Email addresses used only for system communications
- Payment links are external (PayPal, Stripe, etc.)

## Query Examples

### Common Queries

**Active Clients:**
```
=FILTER(Clients!A:H, Clients!H:H="Active")
```

**Pending Proposals:**
```
=FILTER(Proposals!A:L, Proposals!G:G="Sent")
```

**Projects Due This Month:**
```
=FILTER(Projects!A:J, (Projects!G:G>=EOMONTH(TODAY(),-1)+1)*(Projects!G:G<=EOMONTH(TODAY(),0)))
```

**Overdue Invoices:**
```
=FILTER(Invoices!A:K, (Invoices!H:H="Sent")*(Invoices!G:G<TODAY()))
```

**Revenue This Year:**
```
=SUMIFS(Invoices!D:D, Invoices!H:H, "Paid", Invoices!F:F, ">="&DATE(YEAR(TODAY()),1,1))
```

### Analytics Queries

**Proposal Conversion Rate:**
```
=COUNTIFS(Proposals!G:G,"Accepted")/COUNTIFS(Proposals!G:G,"Sent","Accepted")*100
```

**Average Project Duration:**
```
=AVERAGE(Projects!H:H-Projects!F:F)
```

**Client Lifetime Value:**
```
=SUMIFS(Invoices!D:D, Invoices!C:C, [Client ID], Invoices!H:H, "Paid")
```

This schema provides a complete foundation for the freelancer workflow management system with proper data structure, relationships, and validation rules.