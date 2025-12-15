import { Download, FileSpreadsheet, Building2, CreditCard, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProcessedDocument } from '@/types/document';
import * as XLSX from 'xlsx';

interface ExportPanelProps {
  documents: ProcessedDocument[];
}

const ExportPanel = ({ documents }: ExportPanelProps) => {
  const completedDocs = documents.filter(d => d.status === 'completed');
  
  const bankStatements = completedDocs.filter(d => d.documentType === 'bank_statement');
  const invoices = completedDocs.filter(d => d.documentType === 'invoice');
  const receipts = completedDocs.filter(d => d.documentType === 'receipt');

  const exportToExcel = (docs: ProcessedDocument[], fileName: string) => {
    if (docs.length === 0) {
      alert(`No ${fileName.toLowerCase()} to export.`);
      return;
    }

    // Sort documents by date (newest first)
    const sortedDocs = [...docs].sort((a, b) => {
      const dateA = a.extractedData.documentDate ? new Date(a.extractedData.documentDate).getTime() : 0;
      const dateB = b.extractedData.documentDate ? new Date(b.extractedData.documentDate).getTime() : 0;
      return dateB - dateA;
    });

    // Prepare data rows
    const data = sortedDocs.map(doc => ({
      'File Name': doc.fileName,
      'Document Date': doc.extractedData.documentDate || '',
      'Issuer/Vendor': doc.extractedData.issuer || '',
      'Document Number': doc.extractedData.documentNumber || '',
      'Expense Category': doc.extractedData.expenseCategory || '',
      'Original Currency': doc.extractedData.originalCurrency || '',
      'Total Amount (Original)': doc.extractedData.totalAmount ?? '',
      'VAT Amount (Original)': doc.extractedData.vatAmount ?? '',
      'Net Amount (Original)': doc.extractedData.netAmount ?? '',
      'Total Amount (CHF)': doc.extractedData.totalAmountCHF ?? '',
      'VAT Amount (CHF)': doc.extractedData.vatAmountCHF ?? '',
      'Net Amount (CHF)': doc.extractedData.netAmountCHF ?? '',
    }));

    // Calculate summary totals
    const totals = {
      totalCHF: sortedDocs.reduce((sum, doc) => sum + (doc.extractedData.totalAmountCHF || 0), 0),
      vatCHF: sortedDocs.reduce((sum, doc) => sum + (doc.extractedData.vatAmountCHF || 0), 0),
      netCHF: sortedDocs.reduce((sum, doc) => sum + (doc.extractedData.netAmountCHF || 0), 0),
    };

    // Add summary row
    const summaryRow = {
      'File Name': 'TOTAL',
      'Document Date': '',
      'Issuer/Vendor': '',
      'Document Number': '',
      'Expense Category': '',
      'Original Currency': 'CHF',
      'Total Amount (Original)': '',
      'VAT Amount (Original)': '',
      'Net Amount (Original)': '',
      'Total Amount (CHF)': totals.totalCHF,
      'VAT Amount (CHF)': totals.vatCHF,
      'Net Amount (CHF)': totals.netCHF,
    };

    const allData = [...data, summaryRow];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(allData);
    
    // Set column widths
    const colWidths = [
      { wch: 30 }, // File Name
      { wch: 12 }, // Document Date
      { wch: 20 }, // Issuer/Vendor
      { wch: 15 }, // Document Number
      { wch: 18 }, // Expense Category
      { wch: 10 }, // Original Currency
      { wch: 18 }, // Total Amount (Original)
      { wch: 18 }, // VAT Amount (Original)
      { wch: 18 }, // Net Amount (Original)
      { wch: 18 }, // Total Amount (CHF)
      { wch: 18 }, // VAT Amount (CHF)
      { wch: 18 }, // Net Amount (CHF)
    ];
    worksheet['!cols'] = colWidths;

    // Note: xlsx library doesn't support cell styling, but the summary row is included

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const finalFileName = `${fileName}_${timestamp}.xlsx`;
    
    XLSX.writeFile(workbook, finalFileName);
  };

  const exportAll = () => {
    let exportedCount = 0;
    if (bankStatements.length > 0) {
      exportToExcel(bankStatements, 'Bank_Statements');
      exportedCount++;
    }
    if (invoices.length > 0) {
      exportToExcel(invoices, 'Invoices');
      exportedCount++;
    }
    if (receipts.length > 0) {
      exportToExcel(receipts, 'Receipts');
      exportedCount++;
    }

    if (exportedCount === 0) {
      alert('No completed documents to export.');
    }
  };

  if (completedDocs.length === 0) return null;

  return (
    <div className="card-elevated p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <FileSpreadsheet className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-serif text-lg text-foreground">Export Data</h3>
          <p className="text-sm text-muted-foreground">Download organized Excel files</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-foreground" />
            <span className="text-sm">Bank Statements</span>
            <span className="badge-type badge-bank">{bankStatements.length}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={bankStatements.length === 0}
            onClick={() => exportToExcel(bankStatements, 'Bank_Statements')}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-foreground" />
            <span className="text-sm">Invoices</span>
            <span className="badge-type badge-invoice">{invoices.length}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={invoices.length === 0}
            onClick={() => exportToExcel(invoices, 'Invoices')}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <Receipt className="w-4 h-4 text-foreground" />
            <span className="text-sm">Receipts</span>
            <span className="badge-type badge-receipt">{receipts.length}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={receipts.length === 0}
            onClick={() => exportToExcel(receipts, 'Receipts')}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Button
        variant="gold"
        className="w-full mt-4"
        onClick={exportAll}
      >
        <Download className="w-4 h-4" />
        Export All Files
      </Button>
    </div>
  );
};

export default ExportPanel;
