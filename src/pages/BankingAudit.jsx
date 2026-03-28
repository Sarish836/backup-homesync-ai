import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Trash2, Clock, CheckCircle2, AlertTriangle, ShieldAlert, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import FileUploadZone from '../components/shared/FileUploadZone';
import EmptyState from '../components/shared/EmptyState';
import AuditReport from '../components/banking/AuditReport';
import LoanReadiness from '../components/banking/LoanReadiness';

const DOC_TYPES = ['Bank Statement', 'Loan Estimate', 'Closing Disclosure', 'Tax Return', 'Pay Stub'];

const statusConfig = {
  pending: { label: 'Pending', color: 'text-muted-foreground', bg: 'bg-muted', icon: Clock },
  analyzing: { label: 'Analyzing…', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Loader2 },
  complete: { label: 'Complete', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  flagged: { label: 'Flagged', color: 'text-destructive', bg: 'bg-destructive/10', icon: ShieldAlert },
};

export default function BankingAudit() {
  const [selectedType, setSelectedType] = useState('Bank Statement');
  const [processing, setProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['banking-documents'],
    queryFn: () => base44.entities.BankingDocument.list('-created_date', 20),
    refetchInterval: (data) => {
      // Auto-refetch while any doc is analyzing
      const analyzing = data?.some?.(d => d.status === 'analyzing' || d.status === 'pending');
      return analyzing ? 3000 : false;
    },
  });

  const handleFileUploaded = async (fileUrl) => {
    setProcessing(true);
    const newDoc = await base44.entities.BankingDocument.create({
      document_type: selectedType,
      file_url: fileUrl,
      status: 'pending',
    });
    queryClient.invalidateQueries({ queryKey: ['banking-documents'] });

    // Trigger audit
    await base44.functions.invoke('auditBankingDocument', { document_id: newDoc.id });
    queryClient.invalidateQueries({ queryKey: ['banking-documents'] });
    setProcessing(false);
  };

  const deleteDoc = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this document?')) return;
    await base44.entities.BankingDocument.delete(id);
    queryClient.invalidateQueries({ queryKey: ['banking-documents'] });
  };

  const flaggedDocs = documents.filter(d => d.status === 'flagged');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="section-label mb-1">AI-Powered</p>
        <h2 className="font-heading font-black text-2xl text-foreground tracking-tight">Banking Audit</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload banking docs to detect fraud, hidden fees & loan readiness</p>
      </div>

      {/* High Risk Alert */}
      {flaggedDocs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-4 border border-destructive/30 bg-destructive/8 flex items-center gap-3"
        >
          <ShieldAlert className="w-6 h-6 text-destructive shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-bold text-destructive">⚠ High Risk Document Detected</p>
            <p className="text-xs text-destructive/70 mt-0.5">{flaggedDocs.length} document{flaggedDocs.length > 1 ? 's' : ''} flagged — review audit reports below immediately.</p>
          </div>
        </motion.div>
      )}

      {/* Loan Readiness */}
      <LoanReadiness docs={documents} />

      {/* Upload section */}
      <div className="space-y-3">
        <div>
          <p className="section-label mb-2">Document Type</p>
          <div className="flex flex-wrap gap-2">
            {DOC_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                  selectedType === type
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <FileUploadZone
          onFileUploaded={handleFileUploaded}
          label={`Upload ${selectedType}`}
          isProcessing={processing}
          accept="application/pdf,image/*"
        />
      </div>

      {/* Document list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload a bank statement, loan estimate, or other banking document to start an AI audit"
        />
      ) : (
        <div className="space-y-3">
          {documents.map(doc => {
            const cfg = statusConfig[doc.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === doc.id;
            const hasReport = doc.audit_results && doc.status !== 'pending';

            return (
              <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className={`card-premium rounded-2xl border bg-card overflow-hidden ${doc.status === 'flagged' ? 'border-destructive/30' : ''}`}>
                  <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))' }} />
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => hasReport && setExpandedId(isExpanded ? null : doc.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-9 w-9 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                          <FileText className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-heading font-bold text-sm text-foreground truncate">{doc.document_type}</p>
                          <p className="text-[11px] text-muted-foreground">{new Date(doc.created_date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {doc.fraud_risk_level && doc.fraud_risk_level !== 'Low' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: doc.fraud_risk_level === 'High' ? '#ef444420' : '#f9731620',
                              color: doc.fraud_risk_level === 'High' ? '#ef4444' : '#f97316'
                            }}>
                            {doc.fraud_risk_level} Risk
                          </span>
                        )}
                        <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon className={`w-3.5 h-3.5 ${doc.status === 'analyzing' ? 'animate-spin' : ''}`} />
                          {cfg.label}
                        </div>
                        {hasReport && (
                          <span className="text-muted-foreground">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                        )}
                        <button
                          onClick={(e) => deleteDoc(doc.id, e)}
                          className="h-7 w-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    {doc.audit_results?.total_issues > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                        {doc.audit_results.total_issues} issue{doc.audit_results.total_issues > 1 ? 's' : ''} found
                        {doc.fraud_risk_score != null && <span>· Fraud Score: {doc.fraud_risk_score}/100</span>}
                      </div>
                    )}
                  </div>

                  {isExpanded && hasReport && (
                    <div className="px-4 pb-4 border-t border-border/30 pt-4">
                      <AuditReport doc={doc} />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}