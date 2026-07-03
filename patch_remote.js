const fs = require('fs');
const file = 'src/components/settings/RemoteDicomSettings.js';
let content = fs.readFileSync(file, 'utf8');

// replace Status header with empty header
content = content.replace(
  '<th className="px-4 py-3 border-r border-[#444444] text-center w-12">Status</th>',
  '<th className="px-4 py-3 border-r border-[#444444] text-center w-12"></th>'
);

content = content.replace(
  'h-full flex flex-col relative w-full',
  'h-full flex flex-col relative w-full bg-white text-black'
);

content = content.replace(
  'bg-ot-bg-top/30 border border-ot-border/50 rounded-xl overflow-hidden shadow-inner',
  'bg-white border border-[#444444] shadow-inner overflow-hidden flex flex-col'
);


fs.writeFileSync(file, content, 'utf8');
console.log('PATCHED');
