import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Receipt, Landmark, TrendingDown, ShieldAlert, AlertTriangle, Clock, CheckCircle2, Loader2, Trash2, ChevronDown, ChevronUp, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FileUploadZone from '../components/shared/FileUploadZone';
import EmptyState from '../components/shared/EmptyState';
import AuditReport from '../components/banking/AuditReport';
import LoanReadiness from '../components/banking/LoanReadiness';
import { Badge } from '@/components/ui/badge';
import FadedImage from '../components/shared/FadedImage';

const bankingStatusConfig = {
  pending: { label: 'Pending', color: 'text-muted-foreground', bg: 'bg-muted', icon: Clock },
  analyzing: { label: 'Analyzing…', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Loader2 },
  complete: { label: 'Complete', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  flagged: { label: 'Flagged', color: 'text-destructive', bg: 'bg-destructive/10', icon: ShieldAlert },
};

const categoryLabels = {
  utility: 'Utility', medical: 'Medical', internet: 'Internet', insurance: 'Insurance', other: 'Other',
};

const BANKING_TYPES = ['Bank Statement', 'Loan Estimate', 'Closing Disclosure', 'Tax Return', 'Pay Stub'];

export default function DocumentScanner() {
  const [processing, setProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: bills = [] } = useQuery({
    queryKey: ['bills'],
    queryFn: () => base44.entities.Bill.list('-created_date', 50),
  });

  const { data: bankDocs = [] } = useQuery({
    queryKey: ['banking-documents'],
    queryFn: () => base44.entities.BankingDocument.list('-created_date', 20),
    refetchInterval: (data) => {
      const analyzing = data?.some?.(d => d.status === 'analyzing' || d.status === 'pending');
      return analyzing ? 3000 : false;
    },
  });

  const handleFileUploaded = async (fileUrl) => {
    setProcessing(true);

    // Single combined LLM call: detect type + analyze bill simultaneously
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert financial document auditor. First identify what type of document this is, then perform a full analysis.

Step 1 — Classify:
- If it's a Bill/Invoice (utility, medical, internet, insurance, other) → set category="bill"
- If it's a banking/loan document (Bank Statement, Loan Estimate, Closing Disclosure, Tax Return, Pay Stub) → set category="banking" and set sub_type accordingly

Step 2 — If category is "bill", perform a DEEP AUDIT:
Extract title, company name, total amount, all line items. Flag overcharges, duplicate charges, math errors, hidden fees, wrong rates. For medical bills: cross-check CPT codes, insurance underpayment, balance billing. Calculate potential_savings. Provide company phone number and a negotiation script referencing specific dollar amounts and issues.

If category is "banking", just provide document_type and company_name — the full audit runs separately.`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["bill", "banking"] },
          sub_type: { type: "string" },
          company_name: { type: "string" },
          // Bill fields
          title: { type: "string" },
          bill_category: { type: "string", enum: ["utility", "medical", "internet", "insurance", "other"] },
          total_amount: { type: "number" },
          potential_savings: { type: "number" },
          hospital_name: { type: "string" },
          insurance_paid: { type: "number" },
          insurance_should_pay: { type: "number" },
          cdm_issues: { type: "array", items: { type: "object", properties: { charge_code: { type: "string" }, description: { type: "string" }, billed_amount: { type: "number" }, cdm_rate: { type: "number" }, insurance_paid: { type: "number" }, issue: { type: "string" } } } },
          line_items: { type: "array", items: { type: "object", properties: { description: { type: "string" }, amount: { type: "number" }, is_overcharge: { type: "boolean" }, fair_price: { type: "number" }, reason: { type: "string" } } } },
          company_phone: { type: "string" },
          negotiation_script: { type: "string" }
        }
      }
    });

    if (result.category === 'banking') {
      const BANKING_TYPES = ['Bank Statement', 'Loan Estimate', 'Closing Disclosure', 'Tax Return', 'Pay Stub'];
      const docType = BANKING_TYPES.includes(result.sub_type) ? result.sub_type : 'Bank Statement';
      const newDoc = await base44.entities.BankingDocument.create({
        document_type: docType,
        file_url: fileUrl,
        status: 'pending',
      });
      queryClient.invalidateQueries({ queryKey: ['banking-documents'] });
      await base44.functions.invoke('auditBankingDocument', { document_id: newDoc.id });
      queryClient.invalidateQueries({ queryKey: ['banking-documents'] });
    } else {
      await base44.entities.Bill.create({
        title: result.title || result.company_name || 'Bill',
        category: result.bill_category || 'other',
        total_amount: result.total_amount,
        potential_savings: result.potential_savings,
        hospital_name: result.hospital_name,
        insurance_paid: result.insurance_paid,
        insurance_should_pay: result.insurance_should_pay,
        cdm_issues: result.cdm_issues,
        line_items: result.line_items,
        company_phone: result.company_phone,
        negotiation_script: result.negotiation_script,
        file_url: fileUrl,
        status: 'reviewed',
      });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    }

    setProcessing(false);
  };

  const deleteBill = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this document?')) return;
    await base44.entities.Bill.delete(id);
    queryClient.invalidateQueries({ queryKey: ['bills'] });
  };

  const deleteDoc = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this document?')) return;
    await base44.entities.BankingDocument.delete(id);
    queryClient.invalidateQueries({ queryKey: ['banking-documents'] });
  };

  const totalSavings = bills.reduce((sum, b) => sum + (b.potential_savings || 0), 0);
  const flaggedDocs = bankDocs.filter(d => d.status === 'flagged');
  const hasAnyDocs = bills.length > 0 || bankDocs.length > 0;
  const isProcessing = processing;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading font-bold text-xl text-foreground">Document Scanner</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Upload any financial document — we'll detect the type and audit it automatically</p>
      </div>

      {/* Alerts */}
      {flaggedDocs.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-4 border border-destructive/30 bg-destructive/8 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-destructive shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-bold text-destructive">⚠ High Risk Document Detected</p>
            <p className="text-xs text-destructive/70 mt-0.5">{flaggedDocs.length} document{flaggedDocs.length > 1 ? 's' : ''} flagged — review below immediately.</p>
          </div>
        </motion.div>
      )}

      {totalSavings > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-4 flex items-center gap-3 border border-primary/20"
          style={{ background: 'linear-gradient(135deg,hsl(var(--primary)/0.12),hsl(var(--accent)/0.06))', boxShadow: '0 0 24px hsl(var(--primary)/0.15)' }}>
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total potential savings identified</p>
            <p className="font-heading font-bold text-xl text-primary">${totalSavings.toFixed(2)}</p>
          </div>
        </motion.div>
      )}

      {/* Loan Readiness */}
      <LoanReadiness docs={bankDocs} />

      {/* Upload */}
      <div className="space-y-2">

        <FileUploadZone
          onFileUploaded={handleFileUploaded}
          label="Upload any bill, statement, or financial document"
          isProcessing={isProcessing}
          accept="application/pdf,image/*"
        />
      </div>

      {/* Document Lists */}
      {!hasAnyDocs ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload a bill, bank statement, loan document, or any financial file — we'll auto-detect and audit it"
        />
      ) : (
        <div className="space-y-3">
          {/* Banking Documents */}
          {bankDocs.map(doc => {
            const cfg = bankingStatusConfig[doc.status] || bankingStatusConfig.pending;
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === doc.id;
            const hasReport = doc.audit_results && doc.status !== 'pending';

            return (
              <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className={`card-premium rounded-2xl border bg-card overflow-hidden ${doc.status === 'flagged' ? 'border-destructive/30' : ''}`}>
                  <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))' }} />
                  <div className="p-4 cursor-pointer" onClick={() => hasReport && setExpandedId(isExpanded ? null : doc.id)}>
                   <FadedImage src={doc.file_url} alt="document" />
                  <div className="flex items-center justify-between gap-3">
                     <div className="flex items-center gap-3 flex-1 min-w-0">
                       <div className="h-9 w-9 rounded-xl shrink-0 flex items-center justify-center bg-primary/10">
                         <Landmark className="w-4 h-4 text-primary" />
                       </div>
                        <div className="min-w-0">
                          <p className="font-heading font-bold text-sm text-foreground truncate">{doc.document_type}</p>
                          <p className="text-[11px] text-muted-foreground">{new Date(doc.created_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {doc.fraud_risk_level && doc.fraud_risk_level !== 'Low' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: doc.fraud_risk_level === 'High' ? '#ef444420' : '#f9731620', color: doc.fraud_risk_level === 'High' ? '#ef4444' : '#f97316' }}>
                            {doc.fraud_risk_level} Risk
                          </span>
                        )}
                        <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon className={`w-3.5 h-3.5 ${doc.status === 'analyzing' ? 'animate-spin' : ''}`} />
                          {cfg.label}
                        </div>
                        {hasReport && <span className="text-muted-foreground">{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>}
                        <button onClick={(e) => deleteDoc(doc.id, e)} className="h-7 w-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center">
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

          {/* Bill Documents */}
          {bills.map(bill => {
            const isExpanded = expandedId === bill.id;
            const overcharges = bill.line_items?.filter(i => i.is_overcharge) || [];

            return (
              <motion.div key={bill.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="card-premium rounded-2xl border bg-card overflow-hidden">
                  <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--primary)))' }} />
                  <div className="p-4">
                   <FadedImage src={bill.file_url} alt="bill" />
                  <div className="flex items-start justify-between">
                     <div className="flex items-center gap-3 flex-1 min-w-0">
                       <div className="h-9 w-9 rounded-xl shrink-0 flex items-center justify-center bg-accent/10">
                         <Receipt className="w-4 h-4 text-accent" />
                       </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-heading font-bold text-sm text-foreground truncate">{bill.title}</p>
                            <Badge variant="secondary" className="text-[10px]">{categoryLabels[bill.category] || bill.category}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs mt-0.5">
                            <span className="font-semibold text-foreground">${bill.total_amount?.toFixed(2)}</span>
                            {bill.potential_savings > 0 && (
                              <span className="text-primary font-medium flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" /> Save ${bill.potential_savings?.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button onClick={(e) => deleteBill(bill.id, e)} className="h-7 w-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    {/* Medical insurance discrepancy */}
                    {bill.category === 'medical' && bill.insurance_should_pay != null && bill.insurance_paid != null && (
                      <div className="mt-3 p-3 bg-destructive/5 rounded-xl border border-destructive/10">
                        <div className="flex items-center gap-1.5 mb-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
                          <span className="text-xs font-semibold text-destructive">Insurance Underpayment</span>
                        </div>
                        <div className="flex gap-4 text-xs">
                          <div><span className="text-muted-foreground">Paid: </span><span className="font-semibold">${bill.insurance_paid?.toFixed(2)}</span></div>
                          <div><span className="text-muted-foreground">Should pay: </span><span className="font-semibold text-primary">${bill.insurance_should_pay?.toFixed(2)}</span></div>
                        </div>
                      </div>
                    )}

                    {overcharges.length > 0 && (
                      <button onClick={() => setExpandedId(isExpanded ? null : bill.id)}
                        className="mt-3 w-full flex items-center justify-between text-sm text-primary font-medium hover:underline">
                        <span>{overcharges.length} potential overcharge{overcharges.length > 1 ? 's' : ''} found</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="mt-3 space-y-2">
                            {bill.line_items?.map((item, idx) => (
                              <div key={idx} className={`flex items-center justify-between p-2.5 rounded-xl text-sm ${item.is_overcharge ? 'bg-destructive/5 border border-destructive/10' : 'bg-muted/50'}`}>
                                <div className="flex-1 min-w-0">
                                  <span className={item.is_overcharge ? 'text-destructive font-medium' : 'text-foreground'}>{item.description}</span>
                                  {item.is_overcharge && item.reason && <p className="text-[11px] text-destructive/70 mt-0.5">{item.reason}</p>}
                                </div>
                                <div className="text-right shrink-0 ml-3">
                                  <span className="font-medium">${item.amount?.toFixed(2)}</span>
                                  {item.is_overcharge && item.fair_price != null && <p className="text-[11px] text-primary">Fair: ${item.fair_price?.toFixed(2)}</p>}
                                </div>
                              </div>
                            ))}
                          </div>

                          {bill.negotiation_script && (
                            <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="text-xs font-semibold text-primary">Negotiation Script</span>
                              </div>
                              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">{bill.negotiation_script}</p>
                            </div>
                          )}

                          {bill.company_phone && (
                            <a href={`tel:${bill.company_phone}`} className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                              <Phone className="w-4 h-4" /> Call {bill.company_phone}
                            </a>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}