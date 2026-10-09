const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/Sahin Mondal/OneDrive/Desktop/apexbuild-const/frontend/src/pages/distributor';

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.jsx')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix wrapper
    content = content.replace(/w-full max-w-md mx-auto/g, 'w-full max-w-md md:max-w-7xl mx-auto');
    
    // Fix grids inside Dashboard
    if (file === 'DistributorDashboard.jsx') {
      content = content.replace('flex flex-col gap-3', 'flex flex-col md:flex-row gap-3');
      content = content.replace('grid grid-cols-2 gap-3 mt-2', 'grid grid-cols-2 md:grid-cols-4 gap-4 mt-4');
      content = content.replace(/className=\"cursor-pointer active:scale-95 transition-transform\"/g, 'className=\"cursor-pointer active:scale-95 transition-transform flex-1\"');
    }

    // Fix other pages lists to use grid on desktop
    const listPattern = /className=\"space-y-3\"/g;
    content = content.replace(listPattern, 'className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3\"');
    
    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
  }
});
