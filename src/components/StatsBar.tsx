import { useMemo } from 'react';
import { FileText, Building2, CreditCard, Receipt, Loader2, TrendingUp } from 'lucide-react';
import { ProcessedDocument } from '@/types/document';

interface StatsBarProps {
  documents: ProcessedDocument[];
}

interface VendorStat {
  name: string;
  count: number;
  total: number;
}

const StatsBar = ({ documents }: StatsBarProps) => {
  const processing = documents.filter(d => d.status === 'processing').length;
  const completed = documents.filter(d => d.status === 'completed');
  
  const bankStatements = completed.filter(d => d.documentType === 'bank_statement').length;
  const invoices = completed.filter(d => d.documentType === 'invoice').length;
  const receipts = completed.filter(d => d.documentType === 'receipt').length;

  const totalCHF = completed.reduce((sum, doc) => 
    sum + (doc.extractedData.totalAmountCHF || 0), 0
  );

  // Group by vendor/issuer
  const topVendors = useMemo(() => {
    const vendorMap = new Map<string, VendorStat>();
    
    completed.forEach(doc => {
      const issuer = doc.extractedData.issuer || 'Unknown';
      const existing = vendorMap.get(issuer) || { name: issuer, count: 0, total: 0 };
      vendorMap.set(issuer, {
        name: issuer,
        count: existing.count + 1,
        total: existing.total + (doc.extractedData.totalAmountCHF || 0),
      });
    });

    return Array.from(vendorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [completed]);

  const uniqueVendors = topVendors.length;

  if (documents.length === 0) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <FileText className="w-3 h-3" />
            <span>Total Documents</span>
          </div>
          <div className="font-serif text-2xl text-foreground flex items-center gap-2">
            {documents.length}
            {processing > 0 && (
              <Loader2 className="w-4 h-4 text-accent animate-spin" />
            )}
          </div>
        </div>

        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Building2 className="w-3 h-3" />
            <span>Bank Statements</span>
          </div>
          <div className="font-serif text-2xl text-foreground">{bankStatements}</div>
        </div>

        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <CreditCard className="w-3 h-3" />
            <span>Invoices</span>
          </div>
          <div className="font-serif text-2xl text-foreground">{invoices}</div>
        </div>

        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Receipt className="w-3 h-3" />
            <span>Receipts</span>
          </div>
          <div className="font-serif text-2xl text-foreground">{receipts}</div>
        </div>

        <div className="card-elevated p-4 col-span-2 md:col-span-1">
          <div className="text-muted-foreground text-xs mb-1">Total Value</div>
          <div className="font-serif text-2xl text-accent">
            {new Intl.NumberFormat('de-CH', {
              style: 'currency',
              currency: 'CHF',
            }).format(totalCHF)}
          </div>
        </div>
      </div>

      {/* Vendor Breakdown */}
      {topVendors.length > 0 && (
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-3">
            <TrendingUp className="w-3 h-3" />
            <span>Top Vendors ({uniqueVendors} total)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {topVendors.map(vendor => (
              <div
                key={vendor.name}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-sm"
              >
                <span className="font-medium text-foreground">{vendor.name}</span>
                <span className="text-muted-foreground">({vendor.count})</span>
                {vendor.total > 0 && (
                  <span className="text-accent text-xs">
                    CHF {vendor.total.toLocaleString('de-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsBar;
