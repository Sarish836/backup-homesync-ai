import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, ShieldCheck, Copy, DollarSign, RefreshCw, TrendingUp, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Section = ({ title, icon: Icon, count, color, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border/60 overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className="font-heading font-semibold text-sm text-foreground">{title}</span>
          {count > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
              {count}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{open ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function AuditReport({ doc }) {
  const r = doc.audit_results || {};
  const riskColor = doc.fraud_risk_level === 'High' ? '#ef4444' : doc.fraud_risk_level === 'Medium' ? '#f97316' : '#22c55e';

  return (
    <div className="space-y-3">
      {/* Summary banner */}
      {r.summary && (
        <div className="rounded-2xl p-4 border" style={{ background: 'hsl(var(--primary) / 0.07)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'hsl(var(--primary))' }}>AI Audit Summary</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{r.summary}</p>
          <p className="text-xs text-muted-foreground mt-2">{r.total_issues || 0} total issues found</p>
        </div>
      )}

      {/* Fraud risk score */}
      {doc.fraud_risk_score != null && (
        <div className="rounded-2xl p-4 border flex items-center gap-4" style={{ borderColor: `${riskColor}30`, background: `${riskColor}10` }}>
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${riskColor}20` }}>
            {doc.fraud_risk_level === 'High' ? <ShieldAlert className="w-6 h-6" style={{ color: riskColor }} /> : <ShieldCheck className="w-6 h-6" style={{ color: riskColor }} />}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: riskColor }}>Fraud Risk: {doc.fraud_risk_level}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${doc.fraud_risk_score}%`, background: riskColor }} />
              </div>
              <span className="text-sm font-bold" style={{ color: riskColor }}>{doc.fraud_risk_score}/100</span>
            </div>
          </div>
          {doc.fraud_risk_level === 'High' && (
            <span className="ml-auto text-xs font-bold text-white bg-destructive px-2.5 py-1 rounded-full animate-pulse">⚠ HIGH RISK</span>
          )}
        </div>
      )}

      {/* Duplicate Transactions */}
      {r.duplicate_transactions?.length > 0 && (
        <Section title="Duplicate Transactions" icon={Copy} count={r.duplicate_transactions.length} color="#f97316" defaultOpen>
          <div className="space-y-2">
            {r.duplicate_transactions.map((t, i) => (
              <div key={i} className="flex justify-between text-xs bg-orange-500/5 border border-orange-500/15 rounded-xl p-2.5">
                <div>
                  <p className="font-semibold text-foreground">{t.description}</p>
                  <p className="text-muted-foreground">{t.date} · {t.occurrences}x occurrences</p>
                </div>
                <p className="font-bold text-orange-400">${t.amount?.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Hidden Fees */}
      {r.hidden_fees?.length > 0 && (
        <Section title="Hidden Fees Detected" icon={DollarSign} count={r.hidden_fees.length} color="#ef4444" defaultOpen>
          <div className="space-y-2">
            {r.hidden_fees.map((f, i) => (
              <div key={i} className="flex justify-between text-xs bg-destructive/5 border border-destructive/15 rounded-xl p-2.5">
                <div>
                  <p className="font-semibold text-foreground">{f.label}</p>
                  <p className="text-destructive/70">{f.reason_flagged}</p>
                  {f.date && <p className="text-muted-foreground">{f.date}</p>}
                </div>
                <p className="font-bold text-destructive">${f.amount?.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Fee Increases */}
      {r.fee_increases?.length > 0 && (
        <Section title="Fee Increases >10%" icon={TrendingUp} count={r.fee_increases.length} color="#a855f7">
          <div className="space-y-2">
            {r.fee_increases.map((f, i) => (
              <div key={i} className="flex justify-between text-xs bg-violet-500/5 border border-violet-500/15 rounded-xl p-2.5">
                <div>
                  <p className="font-semibold text-foreground">{f.fee_name}</p>
                  <p className="text-muted-foreground">Estimate: ${f.estimate_amount?.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-violet-400">${f.closing_amount?.toFixed(2)}</p>
                  <p className="text-violet-400">+{f.percent_increase?.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Security Scan */}
      {r.security_scan && (
        <Section title="Security Scan" icon={Fingerprint} count={r.security_scan?.fraud_indicators?.length || 0} color="#06b6d4">
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Pixel Inconsistencies', val: r.security_scan.pixel_inconsistencies },
                { label: 'Font Mismatches', val: r.security_scan.font_mismatches },
                { label: 'Logo Verified', val: r.security_scan.logo_verified, invert: true },
              ].map(({ label, val, invert }) => (
                <div key={label} className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-bold ${(invert ? !val : val) ? 'text-destructive' : 'text-emerald-400'}`}>
                    {val == null ? '—' : val ? 'Yes' : 'No'}
                  </span>
                </div>
              ))}
            </div>
            {r.security_scan.fraud_indicators?.length > 0 && (
              <div className="mt-2 space-y-1">
                {r.security_scan.fraud_indicators.map((fi, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-destructive/80">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{fi}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}