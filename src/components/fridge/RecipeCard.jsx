import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Clock, ChefHat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const difficultyColors = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-accent/20 text-accent-foreground',
  hard: 'bg-destructive/10 text-destructive',
};

export default function RecipeCard({ recipe, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-heading font-semibold text-foreground">{recipe.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{recipe.description}</p>
            </div>
            <div className="flex gap-1.5 shrink-0 ml-2">
              {recipe.cook_time && (
                <Badge variant="secondary" className="text-[10px]">
                  <Clock className="w-3 h-3 mr-0.5" /> {recipe.cook_time}
                </Badge>
              )}
              <Badge className={`${difficultyColors[recipe.difficulty] || difficultyColors.medium} border-0 text-[10px]`}>
                {recipe.difficulty}
              </Badge>
            </div>
          </div>

          {recipe.missing_ingredients?.length > 0 && (
            <div className="mt-2">
              <span className="text-[11px] text-muted-foreground">Missing: </span>
              <span className="text-[11px] text-destructive font-medium">{recipe.missing_ingredients.join(', ')}</span>
            </div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            {expanded ? 'Hide steps' : 'View steps'}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  {recipe.steps?.map((step, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-foreground/80 text-xs leading-relaxed pt-0.5">{step}</p>
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