// Mock fixtures for local development without real API keys.
// These responses simulate what Claude would return for a
// "platform engineering" creator with ~3 years of LinkedIn history.

import type { GraphExtraction } from '@/lib/anthropic/prompts/graph-extraction'
import type { BriefingResult }  from '@/lib/anthropic/prompts/briefing'

export const MOCK_CLERK_ID   = 'mock-user-001'
export const MOCK_USER_EMAIL = 'demo@creatorgraph.dev'
export const MOCK_USER_NAME  = 'Demo Creator'

// ── Graph extraction fixture ───────────────────────────────────────────────

export const MOCK_GRAPH_EXTRACTION: GraphExtraction = {
  topics: [
    { name: 'Platform Engineering',     parentTopic: 'Software Engineering',     hasGap: false, confidence: 92 },
    { name: 'Developer Experience',     parentTopic: 'Software Engineering',     hasGap: false, confidence: 88 },
    { name: 'Team Scaling',             parentTopic: 'Engineering Leadership',   hasGap: false, confidence: 85 },
    { name: 'Microservices',            parentTopic: 'Software Architecture',    hasGap: false, confidence: 80 },
    { name: 'Incident Management',      parentTopic: 'Site Reliability',         hasGap: true,  confidence: 70 },
    { name: 'AI-assisted Development',  parentTopic: 'Software Engineering',     hasGap: true,  confidence: 65 },
  ],
  hooks: [
    { text: 'Think of your platform team like a restaurant kitchen — if every cook had to make their own knives, nothing would ever get cooked.',     hookType: 'analogy',    confidence: 91 },
    { text: 'The 3 questions I ask before approving any new microservice: who owns it, who pages for it, who can delete it?',                       hookType: 'framework',  confidence: 86 },
    { text: 'Most engineering org charts lie. Here is how to read the real one.',                                                                   hookType: 'opener',     confidence: 82 },
    { text: 'We went from 4 deploys a week to 40 deploys a day. The bottleneck was not technical.',                                                 hookType: 'statistic',  confidence: 79 },
    { text: 'What is the difference between a platform team and a tools team? One gets called at 2am.',                                             hookType: 'question',   confidence: 75 },
  ],
  audienceSegments: ['CTOs', 'Staff Engineers', 'Engineering Managers', 'Startup Founders'],
  audienceQuestions: [
    {
      question:  'When should we invest in a platform team vs just using off-the-shelf tools?',
      painPoint: 'unsure how to justify internal platform investment to executives',
      segments:  ['CTOs', 'Engineering Managers'],
      resolved:  false,
    },
    {
      question:  'How do you stop platform teams from becoming ivory tower gatekeepers?',
      painPoint: 'platform team slows down product teams instead of enabling them',
      segments:  ['CTOs', 'Staff Engineers'],
      resolved:  false,
    },
    {
      question:  'What metrics should a platform team actually own?',
      painPoint: 'hard to show the value of platform work in planning cycles',
      segments:  ['Engineering Managers'],
      resolved:  true,
    },
  ],
  contentTags: [
    { index: 1, topics: ['Platform Engineering', 'Developer Experience'], hooks: ['restaurant kitchen analogy'] },
    { index: 2, topics: ['Microservices', 'Team Scaling'],                 hooks: ['3 questions framework'] },
    { index: 3, topics: ['Team Scaling', 'Engineering Leadership'],         hooks: ['most engineering org charts lie'] },
  ],
}

// ── Briefing fixture ───────────────────────────────────────────────────────

export const MOCK_BRIEFING: BriefingResult = {
  summary: 'Your knowledge graph shows strong depth in platform engineering but two open questions your audience keeps raising — platform team ROI and the gatekeeper problem — are unaddressed. The highest-value move today is a direct, opinionated piece on one of these gaps. Your analogy toolkit (restaurant kitchen, 2am calls) gives you the voice to make it land.',
  rawResponse: '',
  ideas: [
    {
      title:          'The Platform Team ROI Argument Your CFO Will Actually Believe',
      hook:           'Your CFO does not care about developer happiness. Here is what they do care about — and how to connect your platform investment to it.',
      rationale:      'This is your top open question from CTOs and EMs. You have the credibility (3 years of platform work) and the analogy toolkit to make it concrete. Nobody in your feed is writing this from a practitioner perspective.',
      audienceFit:    'CTOs and Engineering Managers who need to justify platform headcount in annual planning. Hits exactly when budgets are being set.',
      competitorGap:  'Most content on this is from vendors selling platform tools. You can write from the operator side — rare and credible.',
      repetitionRisk: 'new — you have written about platform team structure but never about the financial justification',
      validationScore: 91,
    },
    {
      title:          'How to Run a Platform Team Without Becoming the Team Everyone Hates',
      hook:           'Platform teams fail in one of two ways. They either do too little and become invisible. Or they do too much and become a bottleneck. Here is how to walk the line.',
      rationale:      'Second highest open question in your audience. Directly answers the gatekeeper concern. Your 3-question framework is the perfect structural backbone.',
      audienceFit:    'Staff Engineers and CTOs who are building or inheriting a platform org. High share potential — this is a pain everyone has felt.',
      competitorGap:  'Lots of generic "platform team best practices" posts. Nobody is writing about the failure modes with this level of specificity.',
      repetitionRisk: 'new — tangentially related to your org chart post but different enough to stand alone',
      validationScore: 87,
    },
    {
      title:          'The 40 Deploys a Day Story: What Actually Changed',
      hook:           'We went from 4 deploys a week to 40 deploys a day. The bottleneck was not the CI pipeline.',
      rationale:      'Your strongest performance signal is the statistic hook. Turn it into the full story — what changed, what you would do differently, what it cost socially.',
      audienceFit:    'Startup Founders and Engineering Managers who are trying to increase deployment velocity. High relatability.',
      competitorGap:  'Most velocity content is about tooling. Your angle is organisational — much less crowded.',
      repetitionRisk: 'sequel — builds on your deploys statistic but goes deeper into the human side',
      validationScore: 82,
    },
  ],
}

// ── Seed data: mock content items ─────────────────────────────────────────

export const MOCK_CONTENT_ITEMS = [
  {
    externalId:  'mock-post-001',
    platform:    'linkedin' as const,
    title:       'Why your platform team needs a product manager',
    body:        'Three years ago I argued that platform teams did not need PMs. I was wrong. Here is what changed my mind...\n\nThe moment we hired a PM onto our platform team, our ticket resolution time dropped by 40%. Not because the PM wrote better tickets. Because for the first time someone was asking: should we even be solving this problem?\n\nMost platform teams get stuck in a mode where they react to requests. A PM breaks that loop. They sit with product teams, understand what is actually slowing them down, and help the platform team prioritise ruthlessly.',
    publishedAt: new Date('2024-11-15'),
    views:       4200,
    likes:       318,
    comments:    47,
    topics:      ['Platform Engineering', 'Developer Experience'],
    hooks:       ['restaurant kitchen analogy'],
  },
  {
    externalId:  'mock-post-002',
    platform:    'linkedin' as const,
    title:       'The 3 questions we ask before approving any new microservice',
    body:        'We used to approve microservices in architecture review. Then we noticed something: most of the services approved in review were the ones causing the most incidents 18 months later.\n\nSo we changed the criteria. Now we ask three questions before a new service gets the green light:\n\n1. Who owns this service on a Sunday at 2am?\n2. What is the blast radius if it goes down?\n3. Can we delete it in 6 months if the bet does not pay off?\n\nIf you cannot answer all three, the service does not get built. This sounds harsh. It has eliminated about 30% of the services we would have built.',
    publishedAt: new Date('2024-10-03'),
    views:       8100,
    likes:       612,
    comments:    89,
    topics:      ['Microservices', 'Team Scaling'],
    hooks:       ['3 questions framework'],
  },
  {
    externalId:  'mock-post-003',
    platform:    'linkedin' as const,
    title:       'Most engineering org charts lie',
    body:        'The org chart says your platform team reports to the CTO. The real org chart — the one that shows how decisions actually get made — shows your platform team reporting to whoever owns the Q3 delivery milestone.\n\nI spent years trying to fix platforms by fixing the org chart. It rarely worked. The chart is a lagging indicator. Power follows incentives, not boxes.\n\nIf you want to know how engineering decisions really get made in your company, track the escalation paths when something goes wrong. That is the real org chart.',
    publishedAt: new Date('2024-08-20'),
    views:       11300,
    likes:       894,
    comments:    134,
    topics:      ['Team Scaling', 'Engineering Leadership'],
    hooks:       ['most engineering org charts lie'],
  },
]
