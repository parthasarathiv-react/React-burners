const fs = require('fs');
const file = 'src/components/dashboard/SettingsModal.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import RemoteDicomSettings')) {
  content = content.replace(
    "import AnimationSettings from '../settings/AnimationSettings';",
    "import AnimationSettings from '../settings/AnimationSettings';\nimport RemoteDicomSettings from '../settings/RemoteDicomSettings';"
  );
}

if (!content.includes("if (activeTab === 'Remote DICOM')")) {
  content = content.replace(
    "if (activeTab === 'Advanced') {",
    "if (activeTab === 'Remote DICOM') {\n      return <RemoteDicomSettings formData={formData} onChange={handleChange} />;\n    }\n\n    if (activeTab === 'Advanced') {"
  );
}

const writeRes = fs.writeFileSync(file, content, 'utf8');
console.log('PATCH APPLIED');
