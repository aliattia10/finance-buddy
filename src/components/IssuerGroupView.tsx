import { useMemo, useState } from 'react';
import { ProcessedDocument } from '@/types/document';
import DocumentCard from './DocumentCard';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Building2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IssuerGroupViewProps {
  documents: ProcessedDocument[];
}

interface IssuerGroup {
  issuer: string;
  documents: ProcessedDocument[];
  totalAmount: number;
  documentCount: number;
}

const IssuerGroupView = ({ documents }: IssuerGroupViewProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group documents by issuer
  const groups = useMemo(() => {
    const groupMap = new Map<string, ProcessedDocument[]>();
    
    documents
      .filter(d => d.status === 'completed')
      .forEach(doc => {
        const issuer = doc.extractedData.issuer || 'Unknown';
        const existing = groupMap.get(issuer) || [];
        groupMap.set(issuer, [...existing, doc]);
      });

    // Convert to array and sort by document count
    const groupArray: IssuerGroup[] = Array.from(groupMap.entries())
      .map(([issuer, docs]) => ({
        issuer,
        documents: docs.sort((a, b) => 
          new Date(b.extractedData.documentDate || 0).getTime() - 
          new Date(a.extractedData.documentDate || 0).getTime()
        ),
        totalAmount: docs.reduce((sum, doc) => sum + (doc.extractedData.totalAmountCHF || 0), 0),
        documentCount: docs.length,
      }))
      .sort((a, b) => b.documentCount - a.documentCount);

    return groupArray;
  }, [documents]);

  const toggleGroup = (issuer: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(issuer)) {
        next.delete(issuer);
      } else {
        next.add(issuer);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedGroups(new Set(groups.map(g => g.issuer)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  if (groups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No completed documents to group
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {groups.length} vendor{groups.length !== 1 ? 's' : ''} • {documents.filter(d => d.status === 'completed').length} document{documents.filter(d => d.status === 'completed').length !== 1 ? 's' : ''}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {groups.map(group => (
          <div 
            key={group.issuer}
            className="card-elevated overflow-hidden"
          >
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.issuer)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-foreground">{group.issuer}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-3 h-3" />
                    <span>{group.documentCount} document{group.documentCount !== 1 ? 's' : ''}</span>
                    {group.totalAmount > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-foreground">
                          CHF {group.totalAmount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className={cn(
                "transition-transform",
                expandedGroups.has(group.issuer) ? "rotate-180" : ""
              )}>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </div>
            </button>

            {/* Group Content */}
            {expandedGroups.has(group.issuer) && (
              <div className="px-4 pb-4 border-t border-border">
                <div className="grid sm:grid-cols-2 gap-4 pt-4">
                  {group.documents.map(doc => (
                    <DocumentCard key={doc.id} document={doc} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IssuerGroupView;

