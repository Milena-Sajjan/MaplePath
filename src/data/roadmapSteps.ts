export interface RoadmapStep {
  id: string
  phase: number
  title: string
  desc: string
  link?: string
  statusTypes: string[]
  estimatedDays: number
}

export const phaseNames: Record<number, string> = {
  1: 'First Week Essentials',
  2: 'Health & IDs',
  3: 'Financial Setup',
  4: 'Immigration & Future',
}

export const roadmapSteps: RoadmapStep[] = [
  // PHASE 1 — First week
  {
    id: 'sin',
    phase: 1,
    title: 'Get your SIN',
    desc: 'Social Insurance Number from Service Canada',
    link: 'https://www.canada.ca/en/employment-social-development/services/sin.html',
    statusTypes: ['international_student', 'permanent_resident', 'refugee'],
    estimatedDays: 1,
  },
  {
    id: 'bank',
    phase: 1,
    title: 'Open a bank account',
    desc: 'TD, Scotiabank, RBC — all have newcomer packages',
    statusTypes: ['all'],
    estimatedDays: 2,
  },
  {
    id: 'sim',
    phase: 1,
    title: 'Get a Canadian SIM card',
    desc: 'Koodo, Freedom Mobile, or Fido for best student rates',
    statusTypes: ['all'],
    estimatedDays: 1,
  },
  {
    id: 'housing_reg',
    phase: 1,
    title: 'Register your address',
    desc: 'You need a Canadian address for all government services',
    statusTypes: ['all'],
    estimatedDays: 1,
  },

  // PHASE 2 — Health & IDs
  {
    id: 'ohip',
    phase: 2,
    title: 'Apply for OHIP health card',
    desc: '3-month waiting period. Apply at ServiceOntario',
    link: 'https://www.ontario.ca/page/apply-ohip-and-get-health-card',
    statusTypes: ['international_student', 'permanent_resident', 'refugee'],
    estimatedDays: 1,
  },
  {
    id: 'doctor',
    phase: 2,
    title: 'Register with a family doctor',
    desc: 'Health Care Connect — free service to find a family doctor',
    statusTypes: ['all'],
    estimatedDays: 7,
  },
  {
    id: 'photo_id',
    phase: 2,
    title: 'Get Ontario photo ID or licence',
    desc: 'DriveTest Centre — bring study permit + proof of address',
    statusTypes: ['all'],
    estimatedDays: 3,
  },

  // PHASE 3 — Financial
  {
    id: 'tax_return',
    phase: 3,
    title: 'File your first tax return',
    desc: 'Due April 30. Use Wealthsimple Tax (free)',
    statusTypes: ['all'],
    estimatedDays: 1,
  },
  {
    id: 'gst_credit',
    phase: 3,
    title: 'Apply for GST/HST credit',
    desc: 'Up to $519/year — automatic when you file taxes',
    statusTypes: ['all'],
    estimatedDays: 1,
  },
  {
    id: 'trillium',
    phase: 3,
    title: 'Apply for Ontario Trillium Benefit',
    desc: 'Monthly benefit for low-to-moderate income residents',
    statusTypes: ['international_student', 'permanent_resident', 'refugee'],
    estimatedDays: 1,
  },
  {
    id: 'tfsa',
    phase: 3,
    title: 'Open a TFSA',
    desc: 'Tax-Free Savings Account — any bank, no income tax on growth',
    statusTypes: ['permanent_resident', 'refugee'],
    estimatedDays: 1,
  },

  // PHASE 4 — Immigration
  {
    id: 'permit_renew',
    phase: 4,
    title: 'Renew your study/work permit',
    desc: 'Apply 90 days before expiry — do not miss this',
    link: 'https://ircc.canada.ca',
    statusTypes: ['international_student'],
    estimatedDays: 1,
  },
  {
    id: 'pgwp',
    phase: 4,
    title: 'Apply for PGWP after graduation',
    desc: 'Post-Graduate Work Permit — apply within 180 days of final marks',
    statusTypes: ['international_student'],
    estimatedDays: 1,
  },
  {
    id: 'pr_research',
    phase: 4,
    title: 'Research PR pathways',
    desc: 'Express Entry, Ontario PNP, Canadian Experience Class',
    statusTypes: ['international_student', 'visitor'],
    estimatedDays: 7,
  },
]
