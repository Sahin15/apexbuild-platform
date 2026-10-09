const fs = require('fs');
const path = require('path');

const pages = [
  'Dashboard', 'Projects', 'ProjectDetails', 'BOQ', 'SiteReports', 
  'Labour', 'Materials', 'Expenses', 'Measurements', 'Billing', 
  'Documents', 'Team', 'Reports', 'Settings', 'Login', 'NotFound'
];

const dir = path.join(__dirname, 'src', 'pages');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

pages.forEach(page => {
  const content = `export default function ${page}() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">${page}</h1>
      <div className="card p-6">
        <p className="text-slate-600">This module is under construction.</p>
      </div>
    </div>
  );
}
`;
  fs.writeFileSync(path.join(dir, `${page}.jsx`), content);
});

console.log('Pages scaffolded successfully.');
