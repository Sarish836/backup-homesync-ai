import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Refrigerator } from 'lucide-react';
import FileUploadZone from '../components/shared/FileUploadZone';
import EmptyState from '../components/shared/EmptyState';
import IngredientsList from '../components/fridge/IngredientsList';
import RecipeCard from '../components/fridge/RecipeCard';
import ShoppingList from '../components/fridge/ShoppingList';

export default function FridgeVision() {
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data: scans = [], isLoading } = useQuery({
    queryKey: ['fridge-scans'],
    queryFn: () => base44.entities.FridgeScan.list('-created_date', 10),
  });

  const createScan = useMutation({
    mutationFn: (data) => base44.entities.FridgeScan.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fridge-scans'] }),
  });

  const handleFileUploaded = async (fileUrl) => {
    setProcessing(true);
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a smart kitchen AI. Analyze this photo of a fridge or pantry interior.

1. IDENTIFY all visible ingredients/food items. Estimate quantities and whether each item is expiring soon (within 3 days).
2. SUGGEST 3 recipes that prioritize using ingredients about to expire. Include cooking steps, time, and difficulty.
3. CREATE a shopping list of common ingredients needed for the recipes that are NOT visible in the photo.

Be practical and suggest everyday recipes that a home cook can make.`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          ingredients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "string" },
                expires_soon: { type: "boolean" },
                estimated_expiry: { type: "string" }
              }
            }
          },
          recipes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                cook_time: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                ingredients_needed: { type: "array", items: { type: "string" } },
                missing_ingredients: { type: "array", items: { type: "string" } },
                steps: { type: "array", items: { type: "string" } }
              }
            }
          },
          shopping_list: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                for_recipe: { type: "string" },
                bought: { type: "boolean" }
              }
            }
          }
        }
      }
    });

    await createScan.mutateAsync({
      ...analysis,
      scan_date: new Date().toISOString().split('T')[0],
      file_url: fileUrl,
      shopping_list: (analysis.shopping_list || []).map(i => ({ ...i, bought: false })),
    });
    setProcessing(false);
  };

  const latestScan = scans[0];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading font-bold text-xl text-foreground">Fridge Vision</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Snap your fridge, get recipes & a shopping list</p>
      </div>

      <FileUploadZone
        onFileUploaded={handleFileUploaded}
        label="Take a photo of your fridge or pantry"
        isProcessing={processing}
        accept="image/*"
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : !latestScan ? (
        <EmptyState
          icon={Refrigerator}
          title="No scans yet"
          description="Take a photo of your fridge to identify ingredients and get recipe ideas"
        />
      ) : (
        <div className="space-y-5">
          <IngredientsList ingredients={latestScan.ingredients} />

          <ShoppingList scan={latestScan} />

          {latestScan.recipes?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suggested Recipes</h3>
              {latestScan.recipes.map((recipe, i) => (
                <RecipeCard key={i} recipe={recipe} index={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}