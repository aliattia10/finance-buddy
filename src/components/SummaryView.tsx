import { useMemo } from 'react';
import { ProcessedDocument } from '@/types/document';
import { Building2, TrendingUp, FileText, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryViewProps {
  documents: ProcessedDocument[];
}

interface CategorySummary {
  category: string;
  count: number;
  totalCHF: number;
  vatCHF: number;
  netCHF: number;
}

interface VendorSummary {
  vendor: string;
  count: number;
  totalCHF: number;
  documents: ProcessedDocument[];
}

const SummaryView = ({ documents }: SummaryViewProps) => {
  const completedDocs = documents.filter(d => d.status === 'completed');

  // Summary by category
  const categorySummary = useMemo(() => {
    const categoryMap = new Map<string, CategorySummary>();

    completedDocs.forEach(doc => {
      const category = doc.extractedData.expenseCategory || 'Uncategorized';
      const existing = categoryMap.get(category) || {
        category,
        count: 0,
        totalCHF: 0,
        vatCHF: 0,
        netCHF: 0,
      };

      categoryMap.set(category, {
        category,
        count: existing.count + 1,
        totalCHF: existing.totalCHF + (doc.extractedData.totalAmountCHF || 0),
        vatCHF: existing.vatCHF + (doc.extractedData.vatAmountCHF || 0),
        netCHF: existing.netCHF + (doc.extractedData.netAmountCHF || 0),
      });
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => b.totalCHF - a.totalCHF);
  }, [completedDocs]);

  // Summary by vendor
  const vendorSummary = useMemo(() => {
    const vendorMap = new Map<string, VendorSummary>();

    completedDocs.forEach(doc => {
      const vendor = doc.extractedData.issuer || 'Unknown';
      const existing = vendorMap.get(vendor) || {
        vendor,
        count: 0,
        totalCHF: 0,
        documents: [],
      };

      vendorMap.set(vendor, {
        vendor,
        count: existing.count + 1,
        totalCHF: existing.totalCHF + (doc.extractedData.totalAmountCHF || 0),
        documents: [...existing.documents, doc],
      });
    });

    return Array.from(vendorMap.values())
      .sort((a, b) => b.totalCHF - a.totalCHF)
      .slice(0, 10); // Top 10 vendors
  }, [completedDocs]);

  // Overall totals
  const totals = useMemo(() => {
    return completedDocs.reduce(
      (acc, doc) => ({
        totalCHF: acc.totalCHF + (doc.extractedData.totalAmountCHF || 0),
        vatCHF: acc.vatCHF + (doc.extractedData.vatAmountCHF || 0),
        netCHF: acc.netCHF + (doc.extractedData.netAmountCHF || 0),
        count: acc.count + 1,
      }),
      { totalCHF: 0, vatCHF: 0, netCHF: 0, count: 0 }
    );
  }, [completedDocs]);

  // Document type breakdown
  const typeBreakdown = useMemo(() => {
    const types = {
      bank_statement: completedDocs.filter(d => d.documentType === 'bank_statement').length,
      invoice: completedDocs.filter(d => d.documentType === 'invoice').length,
      receipt: completedDocs.filter(d => d.documentType === 'receipt').length,
      unknown: completedDocs.filter(d => d.documentType === 'unknown').length,
    };
    return types;
  }, [completedDocs]);

  if (completedDocs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No completed documents to summarize
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.count}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {typeBreakdown.bank_statement} statements, {typeBreakdown.invoice} invoices, {typeBreakdown.receipt} receipts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{formatCurrency(totals.totalCHF)}</div>
            <div className="text-xs text-muted-foreground mt-1">All currencies converted to CHF</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total VAT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.vatCHF)}</div>
            <div className="text-xs text-muted-foreground mt-1">7.7% Swiss VAT</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Net Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.netCHF)}</div>
            <div className="text-xs text-muted-foreground mt-1">Total minus VAT</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {categorySummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categorySummary.map(cat => (
                <div key={cat.category} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <div className="font-medium">{cat.category}</div>
                    <div className="text-sm text-muted-foreground">{cat.count} document{cat.count !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(cat.totalCHF)}</div>
                    {cat.vatCHF > 0 && (
                      <div className="text-xs text-muted-foreground">
                        VAT: {formatCurrency(cat.vatCHF)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Vendors */}
      {vendorSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Top Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vendorSummary.map(vendor => (
                <div key={vendor.vendor} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <div className="font-medium">{vendor.vendor}</div>
                    <div className="text-sm text-muted-foreground">
                      {vendor.count} transaction{vendor.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(vendor.totalCHF)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SummaryView;

