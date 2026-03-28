import React from 'react';
import { AlertTriangle, Store } from 'lucide-react';

export default function MissingStaples({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-destructive/5 rounded-2xl border border-destructive/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider">
          Missing Staples ({items.length})
        </h3>
      </div>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground">{item.name}</span>
              {item.expected_quantity && (
                <span className="text-xs text-muted-foreground">need: {item.expected_quantity}</span>
              )}
            </div>
            {item.price_estimates?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.price_estimates.map((p, i) => (
                  <span key={i} className="flex items-center gap-1 text-[11px] bg-background border border-border px-2 py-1 rounded-lg">
                    <Store className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{p.store}</span>
                    <span className="font-semibold text-foreground">{p.estimated_price}</span>
                    {p.distance_miles && <span className="text-muted-foreground">· {p.distance_miles}mi</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}