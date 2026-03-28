import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    // Support both direct invocation and entity automation payload
    const document_id = body.document_id || body.event?.entity_id || body.data?.id;

    if (!document_id) {
      return Response.json({ error: 'document_id required' }, { status: 400 });
    }

    // Mark as analyzing
    await base44.asServiceRole.entities.BankingDocument.update(document_id, { status: 'analyzing' });

    // Fetch the document record
    const docs = await base44.asServiceRole.entities.BankingDocument.list();
    const doc = docs.find(d => d.id === document_id);

    if (!doc || !doc.file_url) {
      await base44.asServiceRole.entities.BankingDocument.update(document_id, { status: 'pending' });
      return Response.json({ error: 'Document not found or missing file' }, { status: 404 });
    }

    const docType = doc.document_type;
    const isLoanDoc = docType === 'Loan Estimate' || docType === 'Closing Disclosure';
    const isPayOrTax = docType === 'Tax Return' || docType === 'Pay Stub';

    // Build prompt based on doc type
    const prompt = `You are an expert banking document auditor and fraud analyst. Carefully analyze this ${docType} document.

TASK 1 - DUPLICATE TRANSACTIONS (for Bank Statements):
Identify any duplicate transaction amounts that appear more than once in the same date range. List each with date, amount, description, and number of occurrences.

TASK 2 - HIDDEN FEES:
Flag any line items that contain words like 'fee', 'charge', 'adjustment', 'service charge', 'processing fee', 'origination', or similar. Provide the label, amount, date, and why it was flagged.

TASK 3 - FEE INCREASES (for Loan Estimates / Closing Disclosures):
${isLoanDoc ? 'Compare any fee items against expected estimates. Flag any fee that increased by more than 10%. Provide fee name, estimated amount, closing amount, and percent increase.' : 'Not applicable for this document type.'}

TASK 4 - LOAN READINESS (for Tax Returns / Pay Stubs / Bank Statements):
- Check if any required signatures appear to be missing.
- Check if any dates in the document are older than 60 days from today (${new Date().toISOString().split('T')[0]}).
- If income/deposit data is visible, estimate monthly income and monthly debt payments. Calculate DTI ratio as (monthly_debts / monthly_income * 100).
- Note whether bank statement deposits appear to reconcile with any listed income.
- List any specific issues found.

TASK 5 - SECURITY / FRAUD SCAN:
- Analyze the document for signs of digital manipulation: pixel inconsistencies, unusual font rendering, font mismatches between sections, or inconsistent metadata.
- Assess whether the bank/institution logo and layout matches standard known templates or looks altered.
- Assign a fraud_risk_score from 0 (clean) to 100 (highly suspicious).
- Assign fraud_risk_level: "Low" (0-30), "Medium" (31-60), "High" (61-100).
- List all fraud indicators found.

TASK 6 - SUMMARY:
Write a concise 2-3 sentence plain-English summary of all issues found. State the total number of issues.

Be thorough and conservative — flag anything suspicious.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [doc.file_url],
      response_json_schema: {
        type: "object",
        properties: {
          duplicate_transactions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                amount: { type: "number" },
                description: { type: "string" },
                occurrences: { type: "number" }
              }
            }
          },
          hidden_fees: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                amount: { type: "number" },
                date: { type: "string" },
                reason_flagged: { type: "string" }
              }
            }
          },
          fee_increases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                fee_name: { type: "string" },
                estimate_amount: { type: "number" },
                closing_amount: { type: "number" },
                percent_increase: { type: "number" }
              }
            }
          },
          loan_readiness: {
            type: "object",
            properties: {
              missing_signatures: { type: "boolean" },
              dates_outdated: { type: "boolean" },
              dti_ratio: { type: "number" },
              monthly_income: { type: "number" },
              monthly_debts: { type: "number" },
              income_deposit_match: { type: "boolean" },
              issues: { type: "array", items: { type: "string" } }
            }
          },
          security_scan: {
            type: "object",
            properties: {
              pixel_inconsistencies: { type: "boolean" },
              font_mismatches: { type: "boolean" },
              logo_verified: { type: "boolean" },
              fraud_indicators: { type: "array", items: { type: "string" } }
            }
          },
          fraud_risk_score: { type: "number" },
          fraud_risk_level: { type: "string" },
          summary: { type: "string" },
          total_issues: { type: "number" }
        }
      }
    });

    const totalIssues = (
      (result.duplicate_transactions?.length || 0) +
      (result.hidden_fees?.length || 0) +
      (result.fee_increases?.length || 0) +
      (result.loan_readiness?.issues?.length || 0) +
      (result.security_scan?.fraud_indicators?.length || 0)
    );

    const isFlagged = result.fraud_risk_level === 'High' || totalIssues > 3;

    await base44.asServiceRole.entities.BankingDocument.update(document_id, {
      status: isFlagged ? 'flagged' : 'complete',
      fraud_risk_score: result.fraud_risk_score || 0,
      fraud_risk_level: result.fraud_risk_level || 'Low',
      audit_results: {
        duplicate_transactions: result.duplicate_transactions || [],
        hidden_fees: result.hidden_fees || [],
        fee_increases: result.fee_increases || [],
        loan_readiness: result.loan_readiness || {},
        security_scan: result.security_scan || {},
        summary: result.summary || '',
        total_issues: totalIssues,
      }
    });

    return Response.json({ success: true, status: isFlagged ? 'flagged' : 'complete', total_issues: totalIssues });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});