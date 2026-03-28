import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Refrigerator } from 'lucide-react';
import FileUploadZone from '../components/shared/FileUploadZone';
import EmptyState from '../components/shared/EmptyState';
import IngredientsList from '../components/fridge/IngredientsList';
import RecipeCard from '../components/fridge/RecipeCard';
import ShoppingList from '../components/fridge/ShoppingList';
import StaplesManager from '../components/fridge/StaplesManager';
import MissingStaples from '../components/fridge/MissingStaples';
import AddressSetup from '../components/shared/AddressSetup';
import { useLocationAndProfile } from '../hooks/useLocationAndProfile';

export default function FridgeVision() {
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();
  const { profile, location, saveProfile } = useLocationAndProfile();

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
    const staples = profile?.household_staples || [];
    const staplesList = staples.map(s => `${s.name} (${s.quantity || 'some'})`).join(', ');
    const locationStr = location ? `lat ${location.lat.toFixed(4)}, lng ${location.lng.toFixed(4)}` : null;
    const homeAddress = profile?.home_address || null;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a smart kitchen AI. Analyze this photo of a fridge or pantry interior.

1. IDENTIFY all visible ingredients/food items. Estimate quantities and whether each item is expiring soon (within 3 days).

2. RECIPES: Suggest 3 recipes that prioritize using ingredients about to expire. Include cooking steps, time, and difficulty.

3. SHOPPING LIST: List common ingredients needed for the recipes that are NOT visible in the photo.

${staplesList ? `4. MISSING STAPLES: The user expects to always have these items in their house: [${staplesList}]. Check each one — if it's NOT visible in the fridge photo, add it to missing_staples. For each missing staple, estimate the price at 3 common grocery stores (Walmart, Kroger/local grocery, Whole Foods or similar premium store). ${homeAddress ? `The user is located near ${homeAddress}.` : locationStr ? `The user is near coordinates ${locationStr}.` : ''} Mention store names realistic for their area.` : ''}

Be practical and suggest everyday recipes a home cook can make.`,
      file_urls: [fileUrl],
      add_context_from_internet: !!(locationStr || homeAddress),
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
          missing_staples: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                expected_quantity: { type: "string" },
                price_estimates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      store: { type: "string" },
                      estimated_price: { type: "string" },
                      distance_miles: { type: "string" }
                    }
                  }
                }
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
                bought: { type: "boolean" },
                price_estimates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      store: { type: "string" },
                      estimated_price: { type: "string" }
                    }
                  }
                }
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
      missing_staples: analysis.missing_staples || [],
    });
    setProcessing(false);
  };

  const latestScan = scans[0];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading font-bold text-xl text-foreground">Fridge Vision</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Snap your fridge, track staples & get recipes</p>
      </div>

      <AddressSetup profile={profile} onSave={saveProfile} />

      <StaplesManager profile={profile} onSave={saveProfile} />

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
          description="Take a photo of your fridge to identify ingredients, check staples, and get recipe ideas"
        />
      ) : (
        <div className="space-y-5">
          <IngredientsList ingredients={latestScan.ingredients} />

          {latestScan.missing_staples?.length > 0 && (
            <MissingStaples items={latestScan.missing_staples} />
          )}

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