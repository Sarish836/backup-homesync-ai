import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench } from 'lucide-react';
import FileUploadZone from '../components/shared/FileUploadZone';
import EmptyState from '../components/shared/EmptyState';
import RepairCard from '../components/repair/RepairCard';
import AddressSetup from '../components/shared/AddressSetup';
import { useLocationAndProfile } from '../hooks/useLocationAndProfile';

export default function HomeFixIt() {
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();
  const { profile, location, saveProfile } = useLocationAndProfile();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['repair-jobs'],
    queryFn: () => base44.entities.RepairJob.list('-created_date', 50)
  });

  const createJob = useMutation({
    mutationFn: (data) => base44.entities.RepairJob.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repair-jobs'] })
  });

  const handleFileUploaded = async (fileUrl) => {
    setProcessing(true);
    const locationStr = location ? `lat ${location.lat.toFixed(4)}, lng ${location.lng.toFixed(4)}` : null;
    const homeAddress = profile?.home_address || null;
    const locationContext = homeAddress || locationStr;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a home repair expert AI. Analyze this photo of household damage or a broken item.

1. TITLE & DESCRIBE the problem clearly.

2. DAMAGE RATING: Rate the severity from 1-10 (1=cosmetic scratch, 10=structural collapse/gas leak).

3. ASSESS DIFFICULTY: easy (anyone can do it), moderate (some experience needed), hard (advanced DIY), or professional_required (involves electricity, gas, structural, asbestos, mold, or anything dangerous).

4. SAFETY WARNING: Provide a warning if this is dangerous.

5. PARTS LIST: List all materials needed with estimated costs. For each part provide a search URL like https://www.amazon.com/s?k={url-encoded-part-name}.${locationContext ? ` Also give local_store_prices with 2-3 stores near "${locationContext}" (e.g. Home Depot, Lowe's, Ace Hardware) with estimated prices and approximate distance.` : ''}

6. STEP-BY-STEP INSTRUCTIONS with tips.

7. ESTIMATED time and total cost range.

${locationContext && `8. IF damage_rating is 7 or higher OR difficulty is professional_required: Search for real professionals near "${locationContext}" who can fix this type of repair. Provide their name, phone number, specialty, and estimated cost range. Include at least 2-3 real businesses if possible.`}`,
      file_urls: [fileUrl],
      add_context_from_internet: !!locationContext,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "moderate", "hard", "professional_required"] },
          damage_rating: { type: "number", description: "1-10 severity score" },
          safety_warning: { type: "string" },
          description: { type: "string" },
          parts_list: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                estimated_cost: { type: "string" },
                search_url: { type: "string" },
                local_store_prices: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      store: { type: "string" },
                      price: { type: "string" },
                      distance_miles: { type: "string" }
                    }
                  }
                }
              }
            }
          },
          nearby_professionals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                phone: { type: "string" },
                specialty: { type: "string" },
                estimated_cost: { type: "string" }
              }
            }
          },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                step_number: { type: "number" },
                instruction: { type: "string" },
                tip: { type: "string" }
              }
            }
          },
          estimated_time: { type: "string" },
          estimated_cost: { type: "string" }
        }
      }
    });

    await createJob.mutateAsync({
      ...analysis,
      file_url: fileUrl,
      status: 'diagnosed'
    });
    setProcessing(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading font-bold text-xl text-foreground">Damage Assessor</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Diagnose damage & find local repair help</p>
      </div>

      <AddressSetup profile={profile} onSave={saveProfile} />

      <FileUploadZone
        onFileUploaded={handleFileUploaded}
        label="Take a photo of the damage"
        isProcessing={processing}
        accept="image/*" />
      

      {isLoading ?
      <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div> :
      jobs.length === 0 ?
      <EmptyState
        icon={Wrench}
        title="No repair jobs yet"
        description="Upload a photo of something broken to get a diagnosis, cost breakdown & local pros" /> :


      <div className="space-y-3">
          {jobs.map((job) =>
        <RepairCard key={job.id} job={job} />
        )}
        </div>
      }
    </div>);

}