export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY is not configured in Vercel Environment Variables.'
    });
  }

  const body = req.body || {};
  const candidateName = clean(body.candidateName);
  const company = clean(body.company);
  const roleTitle = clean(body.roleTitle);
  const targetLane = clean(body.targetLane);
  const targetLevel = clean(body.targetLevel);
  const cvText = clean(body.cvText);
  const jobText = clean(body.jobText);

  if (!roleTitle || cvText.length < 250 || jobText.length < 250) {
    return res.status(400).json({
      error: 'Please provide a role title, a fuller CV, and a fuller job description.'
    });
  }

  const prompt = buildPrompt({ candidateName, company, roleTitle, targetLane, targetLevel, cvText, jobText });

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        instructions: 'You are a careful AI placement-agency job-fit reviewer. You must be practical, truthful, evidence-based, and conservative. Never invent experience. Return only valid JSON.',
        input: prompt,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: 'OpenAI request failed.', details: text.slice(0, 1000) });
    }

    const data = await response.json();
    const outputText = extractOutputText(data);
    const parsed = parseJson(outputText);

    if (!parsed) {
      return res.status(502).json({
        error: 'The AI response could not be parsed as JSON.',
        raw: outputText.slice(0, 2000)
      });
    }

    return res.status(200).json({
      source: 'openai_responses_api',
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      reviewed_at: new Date().toISOString(),
      result: parsed
    });
  } catch (error) {
    return res.status(500).json({ error: 'AI job-fit review failed.', details: error.message });
  }
}

function clean(value) {
  return String(value || '').trim().slice(0, 20000);
}

function buildPrompt({ candidateName, company, roleTitle, targetLane, targetLevel, cvText, jobText }) {
  return `Review the candidate CV against the job description. Be conservative and evidence-based.

Candidate: ${candidateName || 'Not provided'}
Company: ${company || 'Not provided'}
Role: ${roleTitle}
Target lane: ${targetLane || 'Not provided'}
Target level: ${targetLevel || 'Not provided'}

Rules:
- Do not invent experience.
- Separate direct evidence from adjacent experience.
- If the CV is weak for the role, say so plainly.
- Give a routing decision: Apply now, Light tailoring first, Optimize before applying, or Stretch role / drop.
- Return only JSON. No markdown.

Required JSON shape:
{
  "score": number,
  "decision": string,
  "decisionReason": string,
  "positioningSummary": string,
  "matchStrengths": string[],
  "missingOrWeakRequirements": string[],
  "truthCheckQuestions": string[],
  "optimizationInstructions": string[],
  "suggestedRoleSpecificBullets": string[],
  "applicationPackageReadiness": string,
  "recommendedNextAction": string,
  "safeClaims": string[],
  "claimsToSoften": string[],
  "assumptions": string[]
}

CV:
${cvText}

JOB DESCRIPTION:
${jobText}`;
}

function extractOutputText(data) {
  if (typeof data.output_text === 'string') return data.output_text;
  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) parts.push(content.text);
      if (content.text) parts.push(content.text);
    }
  }
  return parts.join('\n').trim();
}

function parseJson(text) {
  try { return JSON.parse(text); } catch (_) {}
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch (_) {}
  }
  return null;
}
