import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertTriangle, ShieldAlert, ExternalLink, Clock, DollarSign, Phone, Store, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const difficultyConfig = {
  easy: { label: 'Easy DIY', color: 'bg-green-100 text-green-700' },
  moderate: { label: 'Moderate', color: 'bg-accent/20 text-accent-foreground' },
  hard: { label: 'Advanced', color: 'bg-destructive/10 text-destructive' },
  professional_required: { label: 'Hire a Pro', color: 'bg-destructive text-destructive-foreground' },
};

export default function RepairCard({ job }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();
  const config = difficultyConfig[job.difficulty] || difficultyConfig.moderate;

  const handleDelete = async () => {
    if (!confirm('Delete this repair job?')) return;
    await base44.entities.RepairJob.delete(job.id);
    queryClient.invalidateQueries({ queryKey: ['repair-jobs'] });
  };
  const isPro = job.difficulty === 'professional_required';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`card-premium overflow-hidden ${isPro ? 'border-destructive/30' : ''}`}>
        <CardContent className="p-4">
          {/* Safety Warning */}
          {job.safety_warning && (
            <div className="mb-3 p-3 bg-destructive/5 rounded-xl border border-destructive/10 flex gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-destructive">Safety Warning</p>
                <p className="text-xs text-destructive/80 mt-0.5">{job.safety_warning}</p>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-foreground">{job.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{job.description}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
              <button onClick={handleDelete} className="h-7 w-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center mb-1">
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
              <Badge className={`${config.color} border-0 text-[10px]`}>{config.label}</Badge>
              {job.damage_rating != null && (
                <div className="flex items-center gap-1">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <div key={n} className={`w-1.5 h-3 rounded-sm ${n <= job.damage_rating
                        ? job.damage_rating >= 8 ? 'bg-destructive' : job.damage_rating >= 5 ? 'bg-accent' : 'bg-primary'
                        : 'bg-muted'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{job.damage_rating}/10</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
            {job.estimated_time && (
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {job.estimated_time}</span>
            )}
            {job.estimated_cost && (
              <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {job.estimated_cost}</span>
            )}
          </div>

          {/* Parts list */}
          {job.parts_list?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Parts Needed</p>
              <div className="space-y-2">
                {job.parts_list.map((part, idx) => (
                  <div key={idx} className="bg-muted/50 rounded-lg p-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{part.name}</span>
                      <div className="flex items-center gap-2">
                        {part.estimated_cost && <span className="text-xs text-muted-foreground">{part.estimated_cost}</span>}
                        {part.search_url && (
                          <a href={part.search_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                    {part.local_store_prices?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {part.local_store_prices.map((s, i) => (
                          <span key={i} className="flex items-center gap-1 text-[10px] bg-background border border-border px-1.5 py-0.5 rounded">
                            <Store className="w-2.5 h-2.5 text-muted-foreground" />
                            {s.store} <strong>{s.price}</strong>
                            {s.distance_miles && <span className="text-muted-foreground">· {s.distance_miles}mi</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nearby professionals */}
          {job.nearby_professionals?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-[11px] font-semibold text-destructive uppercase tracking-wider mb-2">Professionals Near You</p>
              <div className="space-y-1.5">
                {job.nearby_professionals.map((pro, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-destructive/5 border border-destructive/10 rounded-lg p-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{pro.name}</p>
                      <p className="text-[11px] text-muted-foreground">{pro.specialty}{pro.estimated_cost ? ` · ${pro.estimated_cost}` : ''}</p>
                    </div>
                    {pro.phone && (
                      <a href={`tel:${pro.phone}`} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline shrink-0 ml-2">
                        <Phone className="w-3.5 h-3.5" /> {pro.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Steps toggle */}
          {job.steps?.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              {expanded ? 'Hide instructions' : `View ${job.steps.length} steps`}
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
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
                <div className="mt-3 space-y-3">
                  {job.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {step.step_number || idx + 1}
                      </span>
                      <div className="pt-0.5">
                        <p className="text-sm text-foreground">{step.instruction}</p>
                        {step.tip && (
                          <p className="text-xs text-primary mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {step.tip}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}