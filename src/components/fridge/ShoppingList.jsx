import React, { useState } from 'react';
import { CheckSquare, Square, ShoppingCart, RefreshCw, Pencil, Trash2, Plus, ExternalLink, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

export default function ShoppingList({ scan, profile }) {
  const queryClient = useQueryClient();
  const items = scan?.shopping_list || [];
  const [selectedStore, setSelectedStore] = useState(0);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  if (items.length === 0) return null;

  // Collect unique store names across all items
  const allStores = [];
  items.forEach(item => {
    (item.price_estimates || []).forEach(pe => {
      if (pe.store && !allStores.includes(pe.store)) allStores.push(pe.store);
    });
  });

  const homeAddress = [profile?.home_address, profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ');

  const getMapsUrl = (storeName, storeAddress) => {
    const dest = storeAddress || storeName;
    const origin = homeAddress || '';
    if (origin) {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest)}`;
  };

  const toggleItem = async (idx) => {
    const newList = [...items];
    newList[idx] = { ...newList[idx], bought: !newList[idx].bought };
    await base44.entities.FridgeScan.update(scan.id, { shopping_list: newList });
    queryClient.invalidateQueries({ queryKey: ['fridge-scans'] });
  };

  const deleteItem = async (idx) => {
    const newList = items.filter((_, i) => i !== idx);
    await base44.entities.FridgeScan.update(scan.id, { shopping_list: newList });
    queryClient.invalidateQueries({ queryKey: ['fridge-scans'] });
  };

  const saveEdit = async (idx) => {
    const newList = [...items];
    newList[idx] = { ...newList[idx], item: editValue };
    await base44.entities.FridgeScan.update(scan.id, { shopping_list: newList });
    queryClient.invalidateQueries({ queryKey: ['fridge-scans'] });
    setEditingIdx(null);
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    const newList = [...items, { item: newItem.trim(), bought: false }];
    await base44.entities.FridgeScan.update(scan.id, { shopping_list: newList });
    queryClient.invalidateQueries({ queryKey: ['fridge-scans'] });
    setNewItem('');
    setAddingItem(false);
  };

  const refreshStores = async () => {
    setRefreshing(true);
    const itemNames = items.map(i => i.item).join(', ');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Find 3 different grocery stores near "${homeAddress || 'the user'}" where someone can buy ALL of these items in one trip: ${itemNames}.

For each store, provide a name, address, estimated distance in miles, and an estimated total price for all items combined.
Suggest DIFFERENT stores than: ${allStores.join(', ')}.
Use real store names.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          stores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                store: { type: "string" },
                address: { type: "string" },
                distance_miles: { type: "string" },
                estimated_total: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Distribute new store options across items
    const newStores = result.stores || [];
    const updatedList = items.map(item => ({
      ...item,
      price_estimates: newStores.map(s => ({ store: s.store, estimated_price: 'see total', store_address: s.address, distance_miles: s.distance_miles, estimated_total: s.estimated_total }))
    }));
    await base44.entities.FridgeScan.update(scan.id, { shopping_list: updatedList });
    queryClient.invalidateQueries({ queryKey: ['fridge-scans'] });
    setRefreshing(false);
  };

  const currentStoreName = allStores[selectedStore];
  const currentStoreItem = items[0]?.price_estimates?.find(p => p.store === currentStoreName);

  return (
    <div className="card-premium bg-card rounded-2xl border border-border/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shopping List</h3>
        </div>
        <button
          onClick={refreshStores}
          disabled={refreshing}
          className="flex items-center gap-1 text-xs text-primary hover:underline font-medium disabled:opacity-50"
        >
          {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Find other stores
        </button>
      </div>

      {/* Store Tabs */}
      {allStores.length > 0 && (
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          {allStores.map((store, i) => (
            <button
              key={i}
              onClick={() => setSelectedStore(i)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                selectedStore === i
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border text-foreground hover:bg-muted'
              }`}
            >
              {store}
            </button>
          ))}
        </div>
      )}

      {/* Directions to selected store */}
      {currentStoreName && (
        <a
          href={getMapsUrl(currentStoreName, currentStoreItem?.store_address)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-xl px-3 py-2 mb-3 hover:bg-primary/10 transition-colors"
        >
          <div>
            <p className="text-xs font-semibold text-primary">{currentStoreName}</p>
            {currentStoreItem?.distance_miles && (
              <p className="text-[11px] text-muted-foreground">{currentStoreItem.distance_miles} miles away</p>
            )}
            {currentStoreItem?.estimated_total && (
              <p className="text-[11px] text-primary font-medium">~{currentStoreItem.estimated_total} total</p>
            )}
          </div>
          <ExternalLink className="w-4 h-4 text-primary shrink-0" />
        </a>
      )}

      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 group">
            {editingIdx === idx ? (
              <div className="flex gap-2 w-full">
                <input
                  className="input-field flex-1 py-1"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit(idx)}
                  autoFocus
                />
                <button onClick={() => saveEdit(idx)} className="text-primary text-xs font-medium">Save</button>
                <button onClick={() => setEditingIdx(null)} className="text-muted-foreground text-xs">Cancel</button>
              </div>
            ) : (
              <>
                <button onClick={() => toggleItem(idx)} className="shrink-0">
                  {item.bought
                    ? <CheckSquare className="w-4 h-4 text-primary" />
                    : <Square className="w-4 h-4 text-muted-foreground" />
                  }
                </button>
                <span className={`flex-1 text-sm ${item.bought ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {item.item}
                </span>
                {currentStoreName && (
                  <span className="text-[10px] text-muted-foreground">
                    {item.price_estimates?.find(p => p.store === currentStoreName)?.estimated_price}
                  </span>
                )}
                {item.for_recipe && !currentStoreName && (
                  <span className="text-[10px] text-muted-foreground">for {item.for_recipe}</span>
                )}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingIdx(idx); setEditValue(item.item); }}>
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                  <button onClick={() => deleteItem(idx)}>
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add item */}
      {addingItem ? (
        <div className="flex gap-2 mt-3">
          <input
            className="input-field flex-1 py-1.5"
            placeholder="Item name..."
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            autoFocus
          />
          <button onClick={addItem} className="text-xs text-primary font-medium">Add</button>
          <button onClick={() => setAddingItem(false)} className="text-xs text-muted-foreground">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setAddingItem(true)}
          className="mt-3 flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> Add item
        </button>
      )}
    </div>
  );
}