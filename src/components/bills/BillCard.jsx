import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Phone, FileText, AlertTriangle, ShieldAlert, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const categoryLabels = {
  utility: 'Utility',
  medical: 'Medical',
  internet: 'Internet',
  insurance: 'Insurance',
  other: 'Other',
};

const statusColors = {
  analyzing: 'bg-accent/20 text-accent-foreground',
  reviewed: 'bg-primary/10 text-primary',
  disputed: 'bg-destructive/10 text-destructive',
  resolved: 'bg-green-100 text-green-700',
};

export default function BillCard({ bill }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();
  const overcharges = bill.line_items?.filter(i => i.is_overcharge) || [];

  const handleDelete = async () => {
    if (!confirm('Delete this bill?')) return;
    await base44.entities.Bill.delete(bill.id);
    queryClient.invalidateQueries({ queryKey: ['bills'] });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="card-premium overflow-hidden">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-heading font-semibold text-foreground truncate">{bill.title}</h3>
                <button onClick={handleDelete} className="h-6 w-6 rounded-lg hover:bg-destructive/10 flex items-center justify-center shrink-0">
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {categoryLabels[bill.category] || bill.category}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-semibold text-foreground">${bill.total_amount?.toFixed(2)}</span>
                {bill.potential_savings > 0 && (
                  <span className="text-primary font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Save ${bill.potential_savings?.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            <Badge className={`${statusColors[bill.status]} text-[10px] border-0`}>
              {bill.status}
            </Badge>
          </div>

          {/* Insurance discrepancy for medical bills */}
          {bill.category === 'medical' && bill.insurance_should_pay != null && bill.insurance_paid != null && (
            <div className="mt-3 p-3 bg-destructive/5 rounded-xl border border-destructive/10">
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
                <span className="text-xs font-semibold text-destructive">Insurance Underpayment</span>
              </div>
              <div className="flex gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Insurance paid: </span>
                  <span className="font-semibold text-foreground">${bill.insurance_paid?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Should pay: </span>
                  <span className="font-semibold text-primary">${bill.insurance_should_pay?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* CDM issues */}
          {bill.cdm_issues?.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">CDM Rate Issues</p>
              {bill.cdm_issues.map((issue, idx) => (
                <div key={idx} className="flex justify-between text-xs bg-destructive/5 rounded-lg p-2 border border-destructive/10">
                  <div>
                    <span className="font-medium text-foreground">{issue.description}</span>
                    {issue.charge_code && <span className="text-muted-foreground ml-1">({issue.charge_code})</span>}
                    {issue.issue && <p className="text-destructive/80 mt-0.5">{issue.issue}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-destructive line-through">${issue.billed_amount?.toFixed(2)}</p>
                    <p className="text-primary">CDM: ${issue.cdm_rate?.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Overcharges summary */}
          {overcharges.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 w-full flex items-center justify-between text-sm text-primary font-medium hover:underline"
            >
              <span>{overcharges.length} potential overcharge{overcharges.length > 1 ? 's' : ''} found</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {/* Line items */}
                <div className="mt-3 space-y-2">
                  {bill.line_items?.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-sm ${
                        item.is_overcharge ? 'bg-destructive/5 border border-destructive/10' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <span className={item.is_overcharge ? 'text-destructive font-medium' : 'text-foreground'}>
                          {item.description}
                        </span>
                        {item.is_overcharge && item.reason && (
                          <p className="text-[11px] text-destructive/70 mt-0.5">{item.reason}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="font-medium">${item.amount?.toFixed(2)}</span>
                        {item.is_overcharge && item.fair_price != null && (
                          <p className="text-[11px] text-primary">Fair: ${item.fair_price?.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Negotiation Script */}
                {bill.negotiation_script && (
                  <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-primary">Negotiation Script</span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">{bill.negotiation_script}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-3 flex gap-2">
                  {bill.company_phone && (
                    <Button size="sm" className="flex-1 h-9 text-xs" asChild>
                      <a href={`tel:${bill.company_phone}`}>
                        <Phone className="w-3.5 h-3.5 mr-1.5" /> Call {bill.company_phone}
                      </a>
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}