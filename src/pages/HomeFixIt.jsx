import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench } from 'lucide-react';
import FileUploadZone from '../components/shared/FileUploadZone';
import EmptyState from '../components/shared/EmptyState';
import RepairCard from '../components/repair/RepairCard';

export default function HomeFixIt() {
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['repair-jobs'],
    queryFn: () => base44.entities.RepairJob.list('-created_date', 50),
  });

  const createJob = useMutation({
    mutationFn: (data) => base44.entities.RepairJob.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repair-jobs'] }),
  });

  const handleFileUploaded = async (fileUrl) => {
    setProcessing(true);
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a home repair expert AI. Analyze this photo of household damage or a broken item.

1. IDENTIFY the problem and describe it clearly.
2. ASSESS difficulty: easy (anyone can do it), moderate (some experience needed), hard (advanced DIY), or professional_required (dangerous - involves high-voltage electricity, gas lines, structural damage, or other hazards).
3. SAFETY WARNING: If this involves electricity, gas lines, asbestos, mold, structural load-bearing elements, or any hazardous materials, provide a clear safety warning recommending a professional.
4. PARTS LIST: List all parts/materials needed with estimated costs. For each part, provide a search URL like https://www.amazon.com/s?k={url-encoded-part-name}.
5. STEP-BY-STEP INSTRUCTIONS: Provide clear DIY instructions with helpful tips.
6. ESTIMATE time and total cost.`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "moderate", "hard", "professional_required"] },
          safety_warning: { type: "string", description: "Safety warning if applicable, null if safe" },
          description: { type: "string" },
          parts_list: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                estimated_cost: { type: "string" },
                search_url: { type: "string" }
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
      status: 'diagnosed',
    });
    setProcessing(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading font-bold text-xl text-foreground">Home Fix-It</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Diagnose repairs & get DIY instructions</p>
      </div>

      <FileUploadZone
        onFileUploaded={handleFileUploaded}
        label="Take a photo of the damage"
        isProcessing={processing}
        accept="image/*"
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No repair jobs yet"
          description="Upload a photo of something broken to get a diagnosis and DIY instructions"
        />
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <RepairCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}