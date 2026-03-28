import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Leaf } from 'lucide-react';

export default function IngredientsList({ ingredients = [] }) {
  if (ingredients.length === 0) return null;

  const expiringSoon = ingredients.filter(i => i.expires_soon);
  const fresh = ingredients.filter(i => !i.expires_soon);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In Stock</h3>

      {expiringSoon.length > 0 && (
        <div className="bg-accent/10 rounded-xl p-3 border border-accent/20">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-accent-foreground" />
            <span className="text-xs font-semibold text-accent-foreground">Use Soon</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {expiringSoon.map((item, i) => (
              <Badge key={i} variant="secondary" className="bg-accent/20 text-accent-foreground border-0 text-xs">
                {item.name} {item.quantity && `(${item.quantity})`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {fresh.map((item, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            <Leaf className="w-3 h-3 mr-1 text-primary" />
            {item.name} {item.quantity && `(${item.quantity})`}
          </Badge>
        ))}
      </div>
    </div>
  );
}