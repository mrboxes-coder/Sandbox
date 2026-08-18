const fs = require('fs');
const src = fs.readFileSync('work/capturelab-fixed/capturelab.html', 'utf8');
const m = src.match(/<script>([\s\S]*?)<\/script>/);
if (!m) throw new Error('No script block found');
fs.writeFileSync('work/capturelab-fixed/extracted-script.js', m[1], 'utf8');
console.log('Extracted script chars:', m[1].length);
