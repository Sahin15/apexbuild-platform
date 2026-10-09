export const mockDashboardData = {
  kpis: {
    totalProjects: 5,
    projectValue: '₹2.45 Cr',
    totalExpense: '₹1.12 Cr',
    pendingBills: '₹38.50 L',
    amountReceivable: '₹24.00 L',
    amountPayable: '₹12.50 L'
  },
  activeProjects: [
    { id: '1', name: 'New Town Residential Project', location: 'Rajarhat, Kolkata', progress: 65, status: 'On Track', value: '₹1.20 Cr' },
    { id: '2', name: 'Salt Lake Commercial Building', location: 'Salt Lake, Kolkata', progress: 40, status: 'Delayed', value: '₹85.00 L' },
    { id: '3', name: 'Barasat Apartment', location: 'Barasat, Kolkata', progress: 80, status: 'On Track', value: '₹40.00 L' },
    { id: '4', name: 'Kalyani Warehouse', location: 'Kalyani, West Bengal', progress: 25, status: 'Planning', value: '₹--' }
  ],
  expenseOverview: [
    { name: 'Jan', value: 4.5 },
    { name: 'Feb', value: 5.2 },
    { name: 'Mar', value: 6.8 },
    { name: 'Apr', value: 4.1 },
    { name: 'May', value: 7.5 },
    { name: 'Jun', value: 5.9 }
  ],
  recentReports: [
    { id: '1', date: '2023-10-24', project: 'New Town Residential', engineer: 'Rahul Sharma', status: 'Submitted' },
    { id: '2', date: '2023-10-24', project: 'Salt Lake Commercial', engineer: 'Vikash Singh', status: 'Approved' },
    { id: '3', date: '2023-10-23', project: 'Barasat Apartment', engineer: 'Amit Kumar', status: 'Submitted' }
  ]
};

export const mockProjects = [
  { 
    id: '1', 
    name: 'New Town Residential Project', 
    client: 'ABC Developers', 
    location: 'Rajarhat, Kolkata', 
    value: '₹1.20 Cr', 
    progress: 65, 
    startDate: '2023-01-15', 
    expectedCompletion: '2024-03-30', 
    status: 'Active',
    manager: 'Arun Das'
  },
  { 
    id: '2', 
    name: 'Salt Lake Commercial Building', 
    client: 'XYZ Corp', 
    location: 'Salt Lake, Kolkata', 
    value: '₹85.00 L', 
    progress: 40, 
    startDate: '2023-04-10', 
    expectedCompletion: '2024-06-15', 
    status: 'Active',
    manager: 'Sanjay Roy'
  },
  { 
    id: '3', 
    name: 'Barasat Apartment', 
    client: 'Sunrise Builders', 
    location: 'Barasat, Kolkata', 
    value: '₹40.00 L', 
    progress: 80, 
    startDate: '2022-11-05', 
    expectedCompletion: '2023-12-20', 
    status: 'Active',
    manager: 'Vikash Singh'
  },
  { 
    id: '4', 
    name: 'Kalyani Warehouse', 
    client: 'Logistics Pro', 
    location: 'Kalyani, West Bengal', 
    value: '₹--', 
    progress: 25, 
    startDate: '2023-09-01', 
    expectedCompletion: '2024-08-30', 
    status: 'Planning',
    manager: 'Rahul Sharma'
  },
  { 
    id: '5', 
    name: 'Howrah Bridge Renovation', 
    client: 'Govt. Dept', 
    location: 'Howrah', 
    value: '₹3.50 Cr', 
    progress: 100, 
    startDate: '2021-05-10', 
    expectedCompletion: '2023-02-15', 
    status: 'Completed',
    manager: 'Amit Kumar'
  }
];

export const mockBoq = [
  { id: '1', section: 'Foundation', item: 'Excavation for foundation', unit: 'Cum', qty: 1200, rate: 150, amount: 180000, completed: 1200 },
  { id: '2', section: 'Foundation', item: 'PCC (1:4:8)', unit: 'Cum', qty: 150, rate: 4500, amount: 675000, completed: 150 },
  { id: '3', section: 'Structure', item: 'RCC (1:1.5:3) for Columns', unit: 'Cum', qty: 450, rate: 7500, amount: 3375000, completed: 300 },
  { id: '4', section: 'Structure', item: 'Brick Work (1:6)', unit: 'Cum', qty: 850, rate: 4200, amount: 3570000, completed: 400 },
  { id: '5', section: 'Finishing', item: 'Plastering (1:4)', unit: 'Sqm', qty: 4500, rate: 250, amount: 1125000, completed: 1000 },
  { id: '6', section: 'Finishing', item: 'Vitrified Flooring', unit: 'Sqm', qty: 2500, rate: 950, amount: 2375000, completed: 0 },
];
