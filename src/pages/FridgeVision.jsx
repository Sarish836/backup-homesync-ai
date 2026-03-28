import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Refrigerator, Trash2, RefreshCw, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [refreshingRecipes, setRefreshingRecipes] = useState(false);
  const [expandedScanId, setExpandedScanId] = useState(null);
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

  const deleteScan = async (id) => {
    if (!confirm('Delete this scan?')) return;
    await base44.entities.FridgeScan.delete(id);
    queryClient.invalidateQueries({ queryKey: ['fridge-scans'] });
  };

  const refreshRecipes = async (scan) => {
    setRefreshingRecipes(scan.id);
    const ingredients = (scan.ingredients || []).map(i => i.name).join(', ');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Suggest 3 NEW and DIFFERENT recipes using these ingredients: ${ingredients}. Make them different from any previous suggestions. Focus on variety - different cuisines or cooking styles.`,
      response_json_schema: {
        type: 'object',
        properties: {
          recipes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                cook_time: { type: 'string' },
                difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                ingredients_needed: { type: 'array', items: { type: 'string' } },
                missing_ingredients: { type: 'array', items: { type: 'string' } },
                steps: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    });
    const newRecipes = [...(scan.recipes || []), ...(result.recipes || [])];
    await base44.entities.FridgeScan.update(scan.id, { recipes: newRecipes });
    queryClient.invalidateQueries({ queryKey: ['fridge-scans'] });
    setRefreshingRecipes(false);
  };

  const latestScan = scans[0];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading font-bold text-xl text-foreground">Pantry Pal</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Snap your fridge or pantry, track staples & get recipes</p>
      </div>

      <AddressSetup profile={profile} onSave={saveProfile} />

      <StaplesManager profile={profile} onSave={saveProfile} />

      <FileUploadZone
        onFileUploaded={handleFileUploaded}
        label="Take a photo of your fridge, pantry, or kitchen"
        isProcessing={processing}
        accept="image/*"
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : scans.length === 0 ? (
        <EmptyState
          icon={Refrigerator}
          title="No scans yet"
          description="Take a photo of your fridge or pantry to identify ingredients, check staples, and get recipe ideas"
        />
      ) : (
        <div className="space-y-4">
          {scans.map((scan, scanIdx) => {
            const isExpanded = expandedScanId === scan.id || (expandedScanId === null && scanIdx === 0);
            return (
              <div key={scan.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                  <button
                    onClick={() => setExpandedScanId(isExpanded ? 'none' : scan.id)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <span className="font-heading font-semibold text-sm text-foreground">
                      Scan — {new Date(scan.scan_date).toLocaleDateString()}
                    </span>
                    {scanIdx === 0 && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Latest</span>}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-auto" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />}
                  </button>
                  <button
                    onClick={() => deleteScan(scan.id)}
                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center ml-2 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    <IngredientsList ingredients={scan.ingredients} />
                    {scan.missing_staples?.length > 0 && <MissingStaples items={scan.missing_staples} />}
                    <ShoppingList scan={scan} profile={profile} />
                    {scan.recipes?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suggested Recipes</h3>
                        {scan.recipes.map((recipe, i) => (
                          <RecipeCard key={i} recipe={recipe} index={i} />
                        ))}
                        <button
                          onClick={() => refreshRecipes(scan)}
                          disabled={refreshingRecipes === scan.id}
                          className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline disabled:opacity-50"
                        >
                          {refreshingRecipes === scan.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          Get more recipes
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}