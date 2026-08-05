// Industry Templates for Organization Setup
// Provides pre-configured department structures for different industries

export const INDUSTRY_TEMPLATES = {
  'real-estate': {
    name: 'Real Estate',
    icon: 'Building2',
    description: 'Property sales, rentals, and real estate management',
    defaultDepartments: [
      { 
        name: 'Executive', 
        modules: ['dashboard', 'reports', 'analytics', 'goals'],
        icon: 'Briefcase',
        description: 'Company leadership and strategic oversight'
      },
      { 
        name: 'Sales', 
        modules: ['clients', 'deals', 'pipeline', 'forecasts', 'activities', 'sales'],
        icon: 'TrendingUp',
        description: 'Property sales agents and managers'
      },
      { 
        name: 'Leasing', 
        modules: ['clients', 'deals', 'pipeline', 'activities'],
        icon: 'Key',
        description: 'Property rentals and lease management'
      },
      { 
        name: 'Marketing', 
        modules: ['campaigns', 'leads', 'content', 'analytics'],
        icon: 'Megaphone',
        description: 'Property marketing and lead generation'
      },
      { 
        name: 'Property Management', 
        modules: ['tasks', 'maintenance', 'documents'],
        icon: 'Home',
        description: 'Property maintenance and tenant relations'
      },
      { 
        name: 'Finance', 
        modules: ['expenses', 'budgets', 'invoicing', 'reports'],
        icon: 'DollarSign',
        description: 'Financial operations and accounting'
      },
      { 
        name: 'Human Resources', 
        modules: ['employees', 'attendance', 'leave', 'performance'],
        icon: 'Users',
        description: 'Employee management and HR operations'
      }
    ],
    defaultTeams: {
      'Sales': ['Residential Sales', 'Commercial Sales', 'Luxury Properties'],
      'Leasing': ['Residential Leasing', 'Commercial Leasing']
    }
  },

  'ngo': {
    name: 'NGO / Non-Profit',
    icon: 'Heart',
    description: 'Non-profit organizations and development work',
    defaultDepartments: [
      { name: 'Executive', modules: ['dashboard', 'reports', 'analytics', 'goals'], icon: 'Briefcase' },
      { name: 'Programs', modules: ['projects', 'tasks', 'activities', 'beneficiaries'], icon: 'Target' },
      { name: 'Monitoring & Evaluation', modules: ['reports', 'analytics', 'data-collection'], icon: 'BarChart3' },
      { name: 'Finance', modules: ['expenses', 'budgets', 'grants', 'reports'], icon: 'DollarSign' },
      { name: 'Human Resources', modules: ['employees', 'attendance', 'leave'], icon: 'Users' },
      { name: 'Partnerships', modules: ['donors', 'relationships', 'agreements'], icon: 'Handshake' },
      { name: 'Communications', modules: ['content', 'social-media', 'reports'], icon: 'MessageCircle' }
    ],
    defaultTeams: {
      'Programs': ['Education', 'Health', 'Agriculture', 'Livelihoods']
    }
  },

  'software': {
    name: 'Software Company',
    icon: 'Code',
    description: 'Software development and technology companies',
    defaultDepartments: [
      { name: 'Executive', modules: ['dashboard', 'reports', 'analytics', 'goals'], icon: 'Briefcase' },
      { name: 'Engineering', modules: ['projects', 'tasks', 'sprints', 'code-review'], icon: 'Code' },
      { name: 'Product Management', modules: ['roadmap', 'features', 'releases'], icon: 'Package' },
      { name: 'Design', modules: ['design', 'prototypes', 'user-research'], icon: 'Palette' },
      { name: 'Quality Assurance', modules: ['testing', 'bugs', 'releases'], icon: 'CheckCircle' },
      { name: 'DevOps', modules: ['deployments', 'monitoring', 'incidents'], icon: 'Server' },
      { name: 'Sales', modules: ['clients', 'deals', 'pipeline', 'forecasts'], icon: 'TrendingUp' },
      { name: 'Marketing', modules: ['campaigns', 'leads', 'content'], icon: 'Megaphone' },
      { name: 'Customer Success', modules: ['support', 'tickets', 'satisfaction'], icon: 'Headphones' },
      { name: 'Finance', modules: ['expenses', 'budgets', 'invoicing'], icon: 'DollarSign' },
      { name: 'Human Resources', modules: ['employees', 'attendance', 'leave'], icon: 'Users' }
    ],
    defaultTeams: {
      'Engineering': ['Backend Team', 'Frontend Team', 'Mobile Team', 'AI Team'],
      'Sales': ['Enterprise Sales', 'SME Sales', 'Inside Sales']
    }
  },

  'consulting': {
    name: 'Consulting Firm',
    icon: 'Briefcase',
    description: 'Professional consulting and advisory services',
    defaultDepartments: [
      { name: 'Executive', modules: ['dashboard', 'reports', 'analytics', 'goals'], icon: 'Briefcase' },
      { name: 'Consulting', modules: ['projects', 'clients', 'deliverables', 'time-tracking'], icon: 'Users' },
      { name: 'Business Development', modules: ['clients', 'deals', 'pipeline', 'proposals'], icon: 'TrendingUp' },
      { name: 'Research', modules: ['projects', 'documents', 'insights'], icon: 'Search' },
      { name: 'Finance', modules: ['expenses', 'budgets', 'invoicing', 'reports'], icon: 'DollarSign' },
      { name: 'Human Resources', modules: ['employees', 'attendance', 'performance'], icon: 'Users' },
      { name: 'Marketing', modules: ['content', 'thought-leadership', 'events'], icon: 'Megaphone' }
    ],
    defaultTeams: {
      'Consulting': ['Strategy', 'Operations', 'Technology', 'HR Consulting']
    }
  },

  'marketing-agency': {
    name: 'Marketing Agency',
    icon: 'Megaphone',
    description: 'Marketing, advertising, and creative agencies',
    defaultDepartments: [
      { name: 'Executive', modules: ['dashboard', 'reports', 'analytics', 'goals'], icon: 'Briefcase' },
      { name: 'Account Management', modules: ['clients', 'projects', 'relationships'], icon: 'Users' },
      { name: 'Creative', modules: ['campaigns', 'designs', 'content', 'assets'], icon: 'Palette' },
      { name: 'Digital Marketing', modules: ['campaigns', 'social-media', 'analytics', 'seo'], icon: 'Globe' },
      { name: 'Content', modules: ['content-calendar', 'writing', 'publishing'], icon: 'FileText' },
      { name: 'Media Buying', modules: ['campaigns', 'budgets', 'placements'], icon: 'Target' },
      { name: 'Analytics', modules: ['reports', 'analytics', 'insights'], icon: 'BarChart3' },
      { name: 'Finance', modules: ['expenses', 'budgets', 'invoicing'], icon: 'DollarSign' },
      { name: 'Human Resources', modules: ['employees', 'attendance', 'performance'], icon: 'Users' }
    ],
    defaultTeams: {
      'Creative': ['Graphic Design', 'Video Production', 'Copywriting']
    }
  },

  'sales-organization': {
    name: 'Sales Organization',
    icon: 'TrendingUp',
    description: 'Sales-focused businesses and distributors',
    defaultDepartments: [
      { name: 'Executive', modules: ['dashboard', 'reports', 'analytics', 'goals'], icon: 'Briefcase' },
      { name: 'Sales', modules: ['clients', 'deals', 'pipeline', 'forecasts', 'activities', 'sales'], icon: 'TrendingUp' },
      { name: 'Business Development', modules: ['leads', 'prospecting', 'deals'], icon: 'Target' },
      { name: 'Customer Success', modules: ['clients', 'support', 'retention'], icon: 'Headphones' },
      { name: 'Marketing', modules: ['campaigns', 'leads', 'content'], icon: 'Megaphone' },
      { name: 'Operations', modules: ['orders', 'fulfillment', 'logistics'], icon: 'Package' },
      { name: 'Finance', modules: ['expenses', 'budgets', 'invoicing', 'reports'], icon: 'DollarSign' },
      { name: 'Human Resources', modules: ['employees', 'attendance', 'performance'], icon: 'Users' }
    ],
    defaultTeams: {
      'Sales': ['Field Sales', 'Inside Sales', 'Key Accounts']
    }
  },

  'professional-services': {
    name: 'Professional Services',
    icon: 'Award',
    description: 'Legal, accounting, and professional service firms',
    defaultDepartments: [
      { name: 'Executive', modules: ['dashboard', 'reports', 'analytics', 'goals'], icon: 'Briefcase' },
      { name: 'Client Services', modules: ['clients', 'projects', 'time-tracking', 'deliverables'], icon: 'Users' },
      { name: 'Business Development', modules: ['clients', 'deals', 'pipeline', 'proposals'], icon: 'TrendingUp' },
      { name: 'Finance', modules: ['expenses', 'budgets', 'invoicing', 'reports'], icon: 'DollarSign' },
      { name: 'Human Resources', modules: ['employees', 'attendance', 'performance'], icon: 'Users' },
      { name: 'Administration', modules: ['documents', 'compliance', 'facilities'], icon: 'FileText' }
    ],
    defaultTeams: {}
  },

  'sme-general': {
    name: 'Small-Medium Business',
    icon: 'Building',
    description: 'General small to medium-sized enterprises',
    defaultDepartments: [
      { name: 'Executive', modules: ['dashboard', 'reports', 'analytics', 'goals'], icon: 'Briefcase' },
      { name: 'Sales', modules: ['clients', 'deals', 'pipeline', 'activities', 'sales'], icon: 'TrendingUp' },
      { name: 'Operations', modules: ['tasks', 'projects', 'workflows'], icon: 'Settings' },
      { name: 'Marketing', modules: ['campaigns', 'leads', 'content'], icon: 'Megaphone' },
      { name: 'Customer Support', modules: ['tickets', 'support', 'satisfaction'], icon: 'Headphones' },
      { name: 'Finance', modules: ['expenses', 'budgets', 'invoicing', 'reports'], icon: 'DollarSign' },
      { name: 'Human Resources', modules: ['employees', 'attendance', 'leave'], icon: 'Users' },
      { name: 'Administration', modules: ['documents', 'facilities', 'assets'], icon: 'FileText' }
    ],
    defaultTeams: {}
  }
};

// Get all available industries
export const getIndustries = () => {
  return Object.keys(INDUSTRY_TEMPLATES).map(key => ({
    id: key,
    ...INDUSTRY_TEMPLATES[key]
  }));
};

// Get template by industry ID
export const getIndustryTemplate = (industryId) => {
  return INDUSTRY_TEMPLATES[industryId] || INDUSTRY_TEMPLATES['sme-general'];
};

// Check if industry exists
export const isValidIndustry = (industryId) => {
  return industryId in INDUSTRY_TEMPLATES;
};

export default INDUSTRY_TEMPLATES;
