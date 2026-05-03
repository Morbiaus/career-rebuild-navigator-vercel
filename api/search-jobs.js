export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = String(req.query.query || '').trim();
  const lane = String(req.query.lane || '').trim();
  const work = String(req.query.work || '').trim();
  const salary = Number(req.query.salary || 0);

  const searchTerm = encodeURIComponent(query || lane || 'risk manager');
  const results = [];

  try {
    // Remotive public API: remote jobs. Must attribute Remotive and link back to source URLs.
    const remotiveUrl = `https://remotive.com/api/remote-jobs?search=${searchTerm}`;
    const remotiveResponse = await fetch(remotiveUrl, {
      headers: { 'User-Agent': 'Career-Rebuild-Navigator/1.0' }
    });

    if (remotiveResponse.ok) {
      const data = await remotiveResponse.json();
      const jobs = Array.isArray(data.jobs) ? data.jobs : [];
      for (const job of jobs.slice(0, 30)) {
        results.push({
          title: job.title || 'Untitled role',
          company: job.company_name || 'Unknown company',
          location: job.candidate_required_location || 'Remote',
          work: 'Remote',
          salary: extractSalary(job.salary),
          url: job.url || '',
          source: 'Remotive',
          description: stripHtml(job.description || '').slice(0, 700),
          tags: Array.isArray(job.tags) ? job.tags : []
        });
      }
    }
  } catch (error) {
    console.error('Remotive fetch failed:', error.message);
  }

  try {
    // Arbeitnow public API: jobs including remote and Europe-focused roles. No API key required.
    const arbeitnowUrl = 'https://www.arbeitnow.com/api/job-board-api';
    const arbeitnowResponse = await fetch(arbeitnowUrl, {
      headers: { 'User-Agent': 'Career-Rebuild-Navigator/1.0' }
    });

    if (arbeitnowResponse.ok) {
      const data = await arbeitnowResponse.json();
      const jobs = Array.isArray(data.data) ? data.data : [];
      const words = (query || lane || '').toLowerCase().split(/\s+/).filter(Boolean);
      for (const job of jobs.slice(0, 80)) {
        const text = `${job.title || ''} ${job.company_name || ''} ${job.location || ''} ${(job.tags || []).join(' ')}`.toLowerCase();
        const matches = words.length === 0 || words.some(word => text.includes(word));
        if (!matches) continue;
        results.push({
          title: job.title || 'Untitled role',
          company: job.company_name || 'Unknown company',
          location: job.location || 'Not listed',
          work: job.remote ? 'Remote' : 'On-site / Hybrid',
          salary: 0,
          url: job.url || '',
          source: 'Arbeitnow',
          description: stripHtml(job.description || '').slice(0, 700),
          tags: Array.isArray(job.tags) ? job.tags : []
        });
      }
    }
  } catch (error) {
    console.error('Arbeitnow fetch failed:', error.message);
  }

  const deduped = dedupeJobs(results)
    .filter(job => {
      if (work === 'Remote' && job.work !== 'Remote') return false;
      if (salary > 0 && job.salary > 0 && job.salary < salary * 0.85) return false;
      return true;
    })
    .slice(0, 20);

  return res.status(200).json({
    query,
    lane,
    work,
    salary,
    count: deduped.length,
    jobs: deduped
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
