# Reports Module Documentation

## Overview

The Reports module has been completely redesigned to provide a comprehensive reporting system with 7 different report types, each satisfying specific requirements for organizational decision-making.

## Report Types

### 1. Registered Users Report (Simple List Report)
- **Category**: Simple List Report
- **Description**: Lists all registered users with their details
- **Features**: 
  - User ID, Username, Email, Role
  - Project count and active status
  - Export to PDF, JSON, Excel

### 2. Clients and Projects Report (Simple List Report)
- **Category**: Simple List Report
- **Description**: Shows clients and their associated projects
- **Features**:
  - Client information (ID, Name, Email, Phone)
  - Project counts (Total and Active)
  - Export to PDF, JSON, Excel

### 3. Model Training Session Report (Management Report with Graph)
- **Category**: Management Report with Graph
- **Description**: Training session analysis with charts and trends
- **Features**:
  - Training trends chart
  - Success rate chart
  - Session details table
  - Export to PDF, JSON, Excel

### 4. Model Deployment Report (Simple List Report)
- **Category**: Simple List Report
- **Description**: Model deployment status and details
- **Features**:
  - Deployment information (ID, App Name, Environment, Version)
  - Status tracking with color-coded badges
  - Export to PDF, JSON, Excel

### 5. Dataset Transaction Summary Report (Transactional Report with Control Breaks)
- **Category**: Transactional Report with Control Breaks
- **Description**: Transactional data with control breaks by developer and dataset
- **Features**:
  - Hierarchical structure (Developer → Dataset → Actions)
  - Control breaks with subtotals
  - Transaction details with timestamps
  - Export to PDF, JSON, Excel

### 6. Dataset Status Report (Simple List Report)
- **Category**: Simple List Report
- **Description**: Dataset status and validation results
- **Features**:
  - Dataset information (ID, Name, File Type, Version)
  - Validation status with color-coded badges
  - File count and size information
  - Export to PDF, JSON, Excel

### 7. Dataset Trends Report (Adjustable Criteria Report)
- **Category**: Adjustable Criteria Report
- **Description**: Trend analysis with adjustable filters
- **Features**:
  - Date range filters
  - Status and file type filters
  - Developer filter
  - Group by options (Date, Status, File Type)
  - Export to PDF, JSON, Excel

## UI Features

### Sub-sidebar Navigation
- **Location**: Left side of the reports page
- **Functionality**: 
  - Lists all 7 report types
  - Shows category badges (Simple, Transactional, Management, Adjustable)
  - Click to load different reports
  - Visual selection indicator

### Export Buttons
- **Location**: Top-right corner of the page
- **Buttons**: PDF, JSON, Excel
- **Features**:
  - Icons for each export type
  - Disabled state during loading
  - Automatic filename generation

### Dynamic Title
- **Functionality**: Page title changes based on selected report
- **Format**: "[Report Name]"

### Loading States
- **Loading Spinner**: Shows during report generation
- **Error Handling**: Displays error messages if report fails to load

## Backend Integration

### API Endpoints
All reports use the following endpoint pattern:
- `GET /api/report/{report-type}` - Get report data
- `GET /api/report/{report-type}/pdf` - Export as PDF
- `GET /api/report/{report-type}/json` - Export as JSON
- `GET /api/report/{report-type}/excel` - Export as Excel

### Report Service
The `ReportService` handles all API calls with proper error handling and parameter management.

## Requirements Satisfaction

### 3 Simple List Reports ✅
1. **Registered Users Report** - User details and status
2. **Clients and Projects Report** - Client and project relationships
3. **Dataset Status Report** - Dataset status and validation

### 2 Transactional Reports with Control Breaks ✅
1. **Dataset Transaction Summary Report** - Developer → Dataset → Actions hierarchy
2. **Model Training Summary Report** - Model Type → Model Name → Sessions hierarchy

### 1 Adjustable Criteria Report ✅
1. **Dataset Trends Report** - Date range, status, file type, and developer filters

### 1 Management Report with Graph ✅
1. **Model Training Session Report** - Training trends and success rate charts

## Technical Implementation

### Frontend Components
- **ReportsComponent**: Main component with sub-sidebar and content area
- **ReportService**: Service for API communication
- **Chart.js**: For graph visualization

### Styling
- **Responsive Design**: Works on mobile and desktop
- **Ionic Components**: Uses Ionic UI components for consistency
- **Custom CSS**: Enhanced styling for tables, cards, and sidebar

### Data Flow
1. User selects report type from sidebar
2. Component calls appropriate service method
3. Service makes API call to backend
4. Data is displayed in formatted tables/charts
5. Export buttons trigger additional API calls for file generation

## Usage Instructions

1. **Navigate to Reports**: Click "Reports" in the main sidebar
2. **Select Report Type**: Click on any report type in the sub-sidebar
3. **View Report**: Report data will load in the main content area
4. **Export Report**: Use the PDF, JSON, or Excel buttons in the top-right
5. **Apply Filters**: For adjustable reports, use the filter controls

## Future Enhancements

- **Saved Reports**: Save frequently used report configurations
- **Scheduled Reports**: Automatically generate reports on schedule
- **Email Reports**: Send reports via email
- **Advanced Filtering**: More complex filter options
- **Custom Charts**: Additional chart types and visualizations 