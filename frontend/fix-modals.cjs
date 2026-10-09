const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/Sahin Mondal/OneDrive/Desktop/apexbuild-const/frontend/src/pages/distributor';

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.jsx')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix modal wrapper
    content = content.replace(/className=\"fixed inset-0 z-\[100\] flex flex-col justify-end\"/g, 'className=\"fixed inset-0 z-[100] flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6\"');
    
    // Fix modal inner container
    content = content.replace(/className=\"bg-white w-full (h-\[[^\]]+\]) rounded-t-3xl([^>]+)\"/g, 'className=\"bg-white w-full md:max-w-xl $1 md:h-auto md:max-h-full rounded-t-3xl md:rounded-3xl$2 overflow-hidden flex flex-col\"');
    
    // Adjust header radius
    content = content.replace(/rounded-t-3xl shrink-0/g, 'rounded-t-3xl md:rounded-t-none shrink-0');

    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
  }
});
