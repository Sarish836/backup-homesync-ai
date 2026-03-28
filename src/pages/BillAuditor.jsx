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
      prompt: `You are a bill auditor AI. Analyze this bill image/document thoroughly.
Extract all line items, identify the company name, determine the bill category (utility, medical, internet, insurance, or other).
Compare each charge against typical market rates. Flag any potential overcharges, junk fees, administrative fees that seem excessive, or medical upcoding.
Provide a customer service phone number if visible on the bill (or your best guess for the company).
Write a polite but firm negotiation script the user can read when calling to dispute overcharges.

Be specific about WHY each flagged item is an overcharge and what the fair price should be.`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Company or bill name" },
          category: { type: "string", enum: ["utility", "medical", "internet", "insurance", "other"] },
          total_amount: { type: "number" },
          potential_savings: { type: "number" },
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
          company_phone: { type: "string" },
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
      {/* Header */}
      <div>
        <h2 className="font-heading font-bold text-xl text-foreground">Bill Auditor</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Upload a bill to find hidden overcharges</p>
      </div>

      {/* Savings banner */}
      {totalSavings > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total potential savings</p>
            <p className="font-heading font-bold text-xl text-primary">${totalSavings.toFixed(2)}</p>
          </div>
        </motion.div>
      )}

      {/* Upload */}
      <FileUploadZone
        onFileUploaded={handleFileUploaded}
        label="Upload a bill to audit"
        isProcessing={processing}
      />

      {/* Bills list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : bills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No bills analyzed yet"
          description="Upload a utility, medical, internet, or insurance bill to get started"
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