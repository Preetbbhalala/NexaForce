'use strict';

const axios = require('axios');

const MOCK_ARTICLES = [
  {
    source:      { name: 'Forbes' },
    title:       'How AI Is Transforming Talent Acquisition in 2026',
    description: 'Artificial intelligence tools are reshaping how companies identify, recruit and retain top talent, cutting time-to-hire by up to 40% at Fortune 500 firms.',
    url:         'https://www.forbes.com',
    publishedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    source:      { name: 'HR Magazine' },
    title:       'Remote Work Policies: What Leading Companies Are Doing in 2026',
    description: 'A new survey of 1,200 HR directors reveals that hybrid work is now standard at 78% of enterprises, with a sharp focus on asynchronous collaboration tools.',
    url:         'https://www.hrmagazine.co.uk',
    publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    source:      { name: 'TechCrunch' },
    title:       'Microsoft Unveils Copilot for HR: Automated Onboarding Workflows',
    description: 'Microsoft\'s new HR Copilot module promises to reduce onboarding paperwork by 60%, offering automated document generation, task assignment and compliance checks.',
    url:         'https://techcrunch.com',
    publishedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    source:      { name: 'Wall Street Journal' },
    title:       'Employee Compensation Trends: Pay Transparency Laws Spread to 12 New States',
    description: 'Legislators in twelve additional US states have passed pay-transparency mandates, requiring employers to list salary ranges in all job postings effective January 2027.',
    url:         'https://www.wsj.com',
    publishedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    source:      { name: 'Bloomberg' },
    title:       'The Great Stay: Why Employee Turnover Hit a 10-Year Low in Q1 2026',
    description: 'Voluntary attrition has dropped to 9.2% annually — the lowest since 2016 — as workers prioritise job security amid economic uncertainty and rising cost of living.',
    url:         'https://www.bloomberg.com',
    publishedAt: new Date(Date.now() - 7 * 3600000).toISOString(),
  },
  {
    source:      { name: 'SHRM' },
    title:       'Mental Health Benefits Now Top Priority for Job Seekers, SHRM Study Finds',
    description: 'SHRM\'s annual benefits survey shows that mental health support, counselling access and wellness stipends have overtaken retirement matching as the most sought-after employee benefit.',
    url:         'https://www.shrm.org',
    publishedAt: new Date(Date.now() - 10 * 3600000).toISOString(),
  },
  {
    source:      { name: 'Harvard Business Review' },
    title:       'Four-Day Work Week: The Data After Two Years of Corporate Trials',
    description: 'Companies that adopted a four-day week reported 22% higher productivity, 31% lower absenteeism and a 19% increase in employee net-promoter scores, according to HBR\'s longitudinal study.',
    url:         'https://hbr.org',
    publishedAt: new Date(Date.now() - 13 * 3600000).toISOString(),
  },
  {
    source:      { name: 'TechCrunch' },
    title:       'Workday Acquires AI Scheduling Startup Kronologic for $420M',
    description: 'HR-software giant Workday has acquired Kronologic, a startup specialising in AI-driven meeting and shift scheduling, in a deal valued at $420 million.',
    url:         'https://techcrunch.com',
    publishedAt: new Date(Date.now() - 16 * 3600000).toISOString(),
  },
  {
    source:      { name: 'Financial Times' },
    title:       'Global Skills Gap Widens: 40% of Employers Cannot Fill Technical Roles',
    description: 'A World Economic Forum report warns that the gap between required digital skills and available talent has grown to its widest point, with engineering and AI roles among the hardest to fill.',
    url:         'https://www.ft.com',
    publishedAt: new Date(Date.now() - 20 * 3600000).toISOString(),
  },
  {
    source:      { name: 'HR Dive' },
    title:       'DEI Programmes Under Scrutiny: How HR Leaders Are Adapting Strategies',
    description: 'HR professionals are recalibrating diversity, equity and inclusion initiatives, shifting from broad awareness campaigns to measurable outcome-based frameworks tied to promotion and pay data.',
    url:         'https://www.hrdive.com',
    publishedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    source:      { name: 'Reuters' },
    title:       'LinkedIn Reports Record 2.1 Billion Job Applications Filed in 2025',
    description: 'LinkedIn\'s annual workforce report reveals job application volume hit an all-time high of 2.1 billion last year, driven by AI-assisted applications and a surge in career-change seekers.',
    url:         'https://www.reuters.com',
    publishedAt: new Date(Date.now() - 30 * 3600000).toISOString(),
  },
  {
    source:      { name: 'Business Insider' },
    title:       'Gen Z Workers Demand Career Maps: Why Traditional Job Ladders Are Dead',
    description: 'Research from Deloitte shows that 74% of Gen Z employees expect a documented career lattice — not just a ladder — with lateral moves, skill badges and mentorship circles built into HR systems.',
    url:         'https://www.businessinsider.com',
    publishedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
  },
];

const getNews = async (req, res, next) => {
  try {
    const category = req.query.category || 'business';
    const q        = req.query.q        || '';
    const apiKey   = process.env.NEWS_API_KEY;

    if (apiKey && apiKey.trim() !== '') {
      // Proxy to newsapi.org
      const params = {
        category,
        language: 'en',
        pageSize: 20,
        apiKey,
      };
      if (q) params.q = q;

      const response = await axios.get('https://newsapi.org/v2/top-headlines', { params, timeout: 8000 });
      const articles = (response.data.articles || []).map(a => ({
        source:      a.source,
        title:       a.title,
        description: a.description,
        url:         a.url,
        urlToImage:  a.urlToImage,
        publishedAt: a.publishedAt,
      }));

      return res.status(200).json({ success: true, articles, isMock: false });
    }

    // No API key — return mock data (optionally filter by search query)
    let articles = MOCK_ARTICLES;
    if (q) {
      const lq = q.toLowerCase();
      articles = articles.filter(
        a =>
          (a.title       && a.title.toLowerCase().includes(lq)) ||
          (a.description && a.description.toLowerCase().includes(lq))
      );
    }

    res.status(200).json({ success: true, articles, isMock: true });
  } catch (err) {
    // If the news API call fails, fall back to mock data
    res.status(200).json({ success: true, articles: MOCK_ARTICLES, isMock: true });
  }
};

module.exports = { getNews };
