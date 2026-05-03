export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = String(req.query.query || '').trim();
  const targetRole = String(req.query.targetRole || query || '').trim();
  const lane = String(req.query.lane || '').trim();
  const work = String(req.query.work || '').trim();
  const level = String(req.query.level || '').trim();
  const salary = Number(req.query.salary || 0);

  const searchTerm = encodeURIComponent(targetRole || query || lane || 'risk manager');
  const rawResults = [];
  const diagnostics = [];

  try {
    const remotiveUrl = `https://remotive.com/api/remote-jobs?search=${searchTerm}`;
    const remotiveResponse = await fetch(remotiveUrl, {
      headers: { 'User-Agent': 'Career-Rebuild-Navigator/1.0' },
      cache: 'no-store'
    });

    if (remotiveResponse.ok) {
      const data = await remotiveResponse.json();
      const jobs = Array.isArray(data.jobs) ? data.jobs : [];
      diagnostics.push(`Remotive returned ${jobs.length} raw jobs for ${decodeURIComponent(searchTerm)}.`);
      for (const job of jobs.slice(0, 50)) {
        rawResults.push({
          title: job.title || 'Untitled role',
          company: job.company_name || 'Unknown company',
          location: job.candidate_required_location || 'Remote',
          work: 'Remote',
          salary: extractSalary(job.salary),
          url: job.url || '',
          source: 'Remotive',
          description: stripHtml(job.description || '').slice(0, 1200),
          tags: Array.isArray(job.tags) ? job.tags : []
        });
      }
    } else {
      diagnostics.push(`Remotive returned HTTP ${remotiveResponse.status}.`);
    }
  } catch (error) {
    diagnostics.push(`Remotive fetch failed: ${error.message}`);
  }

  try {
    const arbeitnowUrl = 'https://www.arbeitnow.com/api/job-board-api';
    const arbeitnowResponse = await fetch(arbeitnowUrl, {
      headers: { 'User-Agent': 'Career-Rebuild-Navigator/1.0' },
      cache: 'no-store'
    });

    if (arbeitnowResponse.ok) {
      const data = await arbeitnowResponse.json();
      const jobs = Array.isArray(data.data) ? data.data : [];
      diagnostics.push(`Arbeitnow returned ${jobs.length} raw recent jobs.`);
      for (const job of jobs.slice(0, 120)) {
        rawResults.push({
          title: job.title || 'Untitled role',
          company: job.company_name || 'Unknown company',
          location: job.location || 'Not listed',
          work: job.remote ? 'Remote' : 'On-site / Hybrid',
          salary: 0,
          url: job.url || '',
          source: 'Arbeitnow',
          description: stripHtml(job.description || '').slice(0, 1200),
          tags: Array.isArray(job.tags) ? job.tags : []
        });
      }
    } else {
      diagnostics.push(`Arbeitnow returned HTTP ${arbeitnowResponse.status}.`);
    }
  } catch (error) {
    diagnostics.push(`Arbeitnow fetch failed: ${error.message}`);
  }

  const targetTerms = significantTerms(targetRole || query);
  const laneTermsList = laneTerms(lane);
  const deduped = dedupeJobs(rawResults);
  const scored = deduped
    .map(job => ({ ...job, match_score: serverScore(job, { targetTerms, laneTermsList, level, work, salary }) }))
    .filter(job => job.match_score >= 45)
    .filter(job => {
      if (work === 'Remote' && job.work !== 'Remote') return false;
      if (salary > 0 && job.salary > 0 && job.salary < salary * 0.80) return false;
      return true;
    })
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 20);

  return res.status(200).json({
    query,
    targetRole,
    lane,
    work,
    level,
    salary,
    searched_at: new Date().toISOString(),
    raw_count: rawResults.length,
    returned_count: scored.length,
    diagnostics,
    jobs: scored
  });
}

function stripHtml(value) {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractSalary(value) {
  if (!value) return 0;
  const text = String(value).replace(/,/g, '');
  const numbers = text.match(/\d{2,6}/g);
  if (!numbers || numbers.length === 0) return 0;
  const parsed = numbers.map(Number).filter(n => n > 1000);
  if (parsed.length === 0) return 0;
  return Math.max(...parsed);
}

function significantTerms(value) {
  const stop = new Set(['and', 'the', 'for', 'with', 'remote', 'hybrid', 'senior', 'lead', 'role', 'job', 'manager']);
  return String(value || '')
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^a-z0-9+#.-]/g, ''))
    .filter(word => word.length > 2 && !stop.has(word));
}

function laneTerms(lane) {
  const map = {
    'IT Risk': ['risk', 'controls', 'technology', 'audit', 'governance', 'rcsa', 'resilience', 'disruption'],
    'Cybersecurity': ['cyber', 'security', 'information security', 'controls', 'risk', 'iam', 'threat'],
    'AI Governance': ['ai', 'governance', 'risk', 'policy', 'model', 'controls', 'automation', 'regulatory'],
    'Technology Program Management': ['program', 'technology', 'delivery', 'stakeholder', 'governance', 'portfolio', 'roadmap'],
    'Operations Risk': ['operations', 'risk', 'controls', 'rcsa', 'issues', 'remediation'],
    'Data / Analytics': ['data', 'analytics', 'governance', 'risk', 'reporting', 'dashboard']
  };
  return map[lane] || [];
}

function seniorityTerms(level) {
  const map = {
    'Manager': ['manager', 'lead'],
    'Senior Manager': ['senior manager', 'sr manager', 'lead', 'principal'],
    'Director': ['director', 'head', 'senior director'],
    'Executive': ['executive', 'vp', 'vice president', 'svp', 'senior vice president', 'executive director', 'chief', 'head'],
    'Individual Contributor': ['analyst', 'specialist', 'advisor', 'consultant', 'engineer']
  };
  return map[level] || [];
}

function hasLowSeniority(text) {
  return /\b(intern|junior|associate|assistant|coordinator|entry level)\b/.test(text);
}

function serverScore(job, context) {
  const titleText = String(job.title || '').toLowerCase();
  const text = `${job.title || ''} ${job.company || ''} ${job.description || ''} ${(job.tags || []).join(' ')}`.toLowerCase();
  let score = 0;

  const targetTitleHits = context.targetTerms.filter(term => titleText.includes(term));
  const targetTextHits = context.targetTerms.filter(term => text.includes(term));
  const laneHits = context.laneTermsList.filter(term => text.includes(term));
  const seniorityHit = seniorityTerms(context.level).some(term => titleText.includes(term));

  score += Math.min(35, targetTitleHits.length * 12);
  score += Math.min(18, targetTextHits.length * 4);
  score += Math.min(22, laneHits.length * 5);

  if (seniorityHit) score += 18;
  if ((context.level === 'Director' || context.level === 'Executive') && hasLowSeniority(titleText)) score -= 45;
  if ((context.level === 'Director' || context.level === 'Executive') && !seniorityHit) score -= 8;

  if (context.work === 'Remote' && job.work === 'Remote') score += 10;
  if (context.salary > 0 && job.salary >= context.salary) score += 8;
  if (!job.salary) score += 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function dedupeJobs(jobs) {
  const seen = new Set();
  const output = [];
  for (const job of jobs) {
    const key = `${job.title}|${job.company}|${job.url}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(job);
  }
  return output;
}
