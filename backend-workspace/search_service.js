const fs = require('fs');
const content = fs.readFileSync('d:/quanlymamnon/backend-workspace/apps/academic-service/src/academic-service.service.ts', 'utf8');
const lines = content.split('\n');
console.log("Total lines:", lines.length);
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('choi') || line.toLowerCase().includes('enroll') || line.toLowerCase().includes('tuổi')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
