import React from 'react';
import { CheckSquare, Square, ShoppingCart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function ShoppingList({ scan }) {
  const queryClient = useQueryClient();
  const items = scan?.shopping_list || [];

  if (items.length === 0) return null;

  const toggleItem = async (idx) => {
    const newList = [...items];
    newList[idx] = { ...newList[idx], bought: !newList[idx].bought };
    await base44.entities.FridgeScan.update(scan.id, { shopping_list: newList });
    queryClient.invalidateQueries({ queryKey: ['fridge-scans'] });
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShoppingCart className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shopping List</h3>
      </div>
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => toggleItem(idx)}
            className="flex items-center gap-2 w-full text-left text-sm hover:bg-muted/50 rounded-lg p-1.5 transition-colors"
          >
            {item.bought ? (
              <CheckSquare className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <span className={`flex-1 ${item.bought ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {item.item}
            </span>
            {item.for_recipe && (
              <span className="text-[10px] text-muted-foreground">for {item.for_recipe}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}