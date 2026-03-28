import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, TrendingDown } from 'lucide-react';

const Check = ({ label, passed, warn }) => {
  const Icon = passed ? CheckCircle2 : warn ? AlertCircle : XCircle;
  const color = passed ? 'text-emerald-400' : warn ? 'text-yellow-400' : 'text-destructive';
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
      <Icon className={`w-4 h-4 shrink-0 ${color}`} />
      <span className="text-sm text-foreground">{label}</span>
    </div>
  );
};

export default function LoanReadiness({ docs }) {
  // Aggregate loan readiness from all analyzed docs
  const readinessDocs = docs.filter(d => d.audit_results?.loan_readiness);
  if (readinessDocs.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-4 text-center">
        <p className="text-xs text-muted-foreground">Upload Tax Returns or Pay Stubs to see Loan Readiness</p>
      </div>
    );
  }

  // Use the most recent doc with loan readiness data
  const latest = readinessDocs[readinessDocs.length - 1];
  const lr = latest.audit_results.loan_readiness;
  const dti = lr.dti_ratio;
  const dtiColor = dti == null ? '#6b7280' : dti < 36 ? '#22c55e' : dti < 43 ? '#f97316' : '#ef4444';
  const dtiLabel = dti == null ? 'N/A' : dti < 36 ? 'Excellent' : dti < 43 ? 'Acceptable' : 'High Risk';

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40" style={{ background: 'hsl(var(--primary) / 0.06)' }}>
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
          <h3 className="font-heading font-bold text-sm text-foreground">Loan Readiness Checklist</h3>
        </div>
      </div>

      <div className="p-4 space-y-1">
        {/* DTI Ratio */}
        {dti != null && (
          <div className="mb-4 p-3 rounded-xl border" style={{ borderColor: `${dtiColor}30`, background: `${dtiColor}10` }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: dtiColor }}>Debt-to-Income Ratio</p>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(dti, 100)}%`, background: dtiColor }} />
              </div>
              <span className="text-base font-black" style={{ color: dtiColor }}>{dti?.toFixed(1)}%</span>
              <span className="text-xs font-semibold" style={{ color: dtiColor }}>{dtiLabel}</span>
            </div>
            {lr.monthly_income != null && (
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>Income: <strong className="text-foreground">${lr.monthly_income?.toFixed(0)}/mo</strong></span>
                <span>Debts: <strong className="text-foreground">${lr.monthly_debts?.toFixed(0)}/mo</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Checklist items */}
        <Check
          label="No missing signatures detected"
          passed={!lr.missing_signatures}
        />
        <Check
          label="All documents dated within last 60 days"
          passed={!lr.dates_outdated}
          warn={lr.dates_outdated}
        />
        <Check
          label="Bank deposits reconcile with pay stub income"
          passed={lr.income_deposit_match !== false}
          warn={lr.income_deposit_match == null}
        />
        <Check
          label={`DTI ratio ${dti != null ? dti.toFixed(1) + '%' : ''} within acceptable range (<43%)`}
          passed={dti != null && dti < 43}
          warn={dti == null}
        />

        {/* Extra issues */}
        {lr.issues?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Additional Issues</p>
            {lr.issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-destructive/80 mb-1">
                <XCircle className="w-3 h-3 mt-0.5 shrink-0" />
                {issue}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}