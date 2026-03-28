import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, TrendingDown } from 'lucide-react';
import FileUploadZone from '../components/shared/FileUploadZone';
import EmptyState from '../components/shared/EmptyState';
import BillCard from '../components/bills/BillCard';
import { motion } from 'framer-motion';

export default function BillAuditor() {
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: () => base44.entities.Bill.list('-created_date', 50),
  });

  const createBill = useMutation({
    mutationFn: (data) => base44.entities.Bill.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bills'] }),
  });

  const handleFileUploaded = async (fileUrl) => {
    setProcessing(true);
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a medical and household bill auditor AI. Analyze this bill document thoroughly.

1. IDENTIFY: Company/hospital name, bill category (utility, medical, internet, insurance, other), all line items with charge codes if present.

2. FOR MEDICAL BILLS specifically:
   - Cross-reference each charge against typical hospital CDM (Chargemaster) rates for that procedure/service.
   - Check if insurance paid the correct contracted rate. If there's an EOB (Explanation of Benefits), verify the insurance payment matches what they should pay under typical PPO/HMO rates.
   - Flag any upcoding, duplicate billing, unbundling, or charges for services not rendered.
   - Identify the specific hospital/provider name and look up their billing department phone number.

3. FOR ALL BILLS:
   - Compare each charge against fair market rates.
   - Flag junk fees, excessive admin charges, and overcharges.
   - Provide a firm but polite negotiation script tailored to the specific company and issues found.
   - Include the customer service/billing department phone number (extract from bill or use known number for the company).

Be very specific - name the hospital, name each problematic charge, cite CDM rates, and explain exactly what insurance should have covered.`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Company or hospital name" },
          category: { type: "string", enum: ["utility", "medical", "internet", "insurance", "other"] },
          total_amount: { type: "number" },
          potential_savings: { type: "number" },
          hospital_name: { type: "string", description: "Hospital or provider name if medical" },
          insurance_paid: { type: "number", description: "Amount insurance actually paid" },
          insurance_should_pay: { type: "number", description: "Amount insurance should pay based on CDM" },
          cdm_issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                charge_code: { type: "string" },
                description: { type: "string" },
                billed_amount: { type: "number" },
                cdm_rate: { type: "number" },
                insurance_paid: { type: "number" },
                issue: { type: "string" }
              }
            }
          },
          line_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                amount: { type: "number" },
                is_overcharge: { type: "boolean" },
                fair_price: { type: "number" },
                reason: { type: "string" }
              }
            }
          },
          company_phone: { type: "string", description: "Billing/customer service phone number" },
          negotiation_script: { type: "string" }
        }
      }
    });

    await createBill.mutateAsync({
      ...analysis,
      file_url: fileUrl,
      status: 'reviewed',
    });
    setProcessing(false);
  };

  const totalSavings = bills.reduce((sum, b) => sum + (b.potential_savings || 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading font-bold text-xl text-foreground">Bill Auditor</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Upload a bill — we'll check CDM rates, insurance payments & overcharges</p>
      </div>

      {totalSavings > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-4 flex items-center gap-3 border border-primary/20"
          style={{background:'linear-gradient(135deg,hsl(var(--primary)/0.12),hsl(var(--accent)/0.06))',boxShadow:'0 0 24px hsl(var(--primary)/0.15)'}}
        >
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total potential savings identified</p>
            <p className="font-heading font-bold text-xl text-primary">${totalSavings.toFixed(2)}</p>
          </div>
        </motion.div>
      )}

      <FileUploadZone
        onFileUploaded={handleFileUploaded}
        label="Upload a bill or EOB to audit"
        isProcessing={processing}
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : bills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No bills analyzed yet"
          description="Upload a medical bill, EOB, utility, or insurance statement to find overcharges"
        />
      ) : (
        <div className="space-y-3">
          {bills.map(bill => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </div>
      )}
    </div>
  );
}