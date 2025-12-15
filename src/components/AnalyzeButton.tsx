import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { ProcessedDocument } from '@/types/document';
import { toast } from '@/hooks/use-toast';

interface AnalyzeButtonProps {
  documents: ProcessedDocument[];
  onAnalyze?: () => void;
}

const AnalyzeButton = ({ documents, onAnalyze }: AnalyzeButtonProps) => {
  const completedDocs = documents.filter(d => d.status === 'completed');
  const processingDocs = documents.filter(d => d.status === 'processing');

  const handleAnalyze = () => {
    if (completedDocs.length === 0) {
      toast({
        title: 'No Documents',
        description: 'Please upload and process some documents first.',
        variant: 'destructive',
      });
      return;
    }

    // Calculate summary statistics
    const stats = {
      totalDocuments: completedDocs.length,
      bankStatements: completedDocs.filter(d => d.documentType === 'bank_statement').length,
      invoices: completedDocs.filter(d => d.documentType === 'invoice').length,
      receipts: completedDocs.filter(d => d.documentType === 'receipt').length,
      totalAmountCHF: completedDocs.reduce((sum, doc) => sum + (doc.extractedData.totalAmountCHF || 0), 0),
      totalVATCHF: completedDocs.reduce((sum, doc) => sum + (doc.extractedData.vatAmountCHF || 0), 0),
      totalNetCHF: completedDocs.reduce((sum, doc) => sum + (doc.extractedData.netAmountCHF || 0), 0),
      vendors: new Set(completedDocs.map(d => d.extractedData.issuer).filter(Boolean)).size,
      categories: new Set(completedDocs.map(d => d.extractedData.expenseCategory).filter(Boolean)).size,
    };

    // Group by vendor
    const vendorGroups: Record<string, number> = {};
    completedDocs.forEach(doc => {
      const vendor = doc.extractedData.issuer || 'Unknown';
      vendorGroups[vendor] = (vendorGroups[vendor] || 0) + 1;
    });

    // Create summary message
    const vendorSummary = Object.entries(vendorGroups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([vendor, count]) => `${count} from ${vendor}`)
      .join(', ');

    const summary = `
📊 FINANCIAL DOCUMENT ANALYSIS SUMMARY

📄 Total Documents: ${stats.totalDocuments}
   • Bank Statements: ${stats.bankStatements}
   • Invoices: ${stats.invoices}
   • Receipts: ${stats.receipts}

💰 Financial Overview:
   • Total Amount (CHF): ${new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(stats.totalAmountCHF)}
   • Total VAT (CHF): ${new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(stats.totalVATCHF)}
   • Net Amount (CHF): ${new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(stats.totalNetCHF)}

🏢 Vendors: ${stats.vendors} unique vendors
   Top vendors: ${vendorSummary || 'N/A'}

📁 Categories: ${stats.categories} expense categories

${processingDocs.length > 0 ? `\n⏳ ${processingDocs.length} document(s) still processing...` : ''}
    `.trim();

    // Show summary in toast
    toast({
      title: 'Analysis Complete',
      description: summary,
      duration: 10000,
    });

    // Also log to console for easy copying
    console.log('=== FINANCIAL DOCUMENT ANALYSIS ===');
    console.log(summary);
    console.log('===================================');

    if (onAnalyze) {
      onAnalyze();
    }
  };

  if (completedDocs.length === 0 && processingDocs.length === 0) {
    return null;
  }

  return (
    <Button
      variant="gold"
      onClick={handleAnalyze}
      disabled={processingDocs.length > 0}
      className="w-full"
    >
      {processingDocs.length > 0 ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          Analyze & Summarize All
        </>
      )}
    </Button>
  );
};

export default AnalyzeButton;

