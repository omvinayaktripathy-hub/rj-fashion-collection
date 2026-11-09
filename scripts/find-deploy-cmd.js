const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:\\Users\\omvin\\.gemini\\antigravity\\brain\\06f1869d-6800-43d7-a186-40ba50f38d09\\.system_generated\\logs\\transcript_full.jsonl')
});

rl.on('line', (line) => {
  if (line.includes('task-3885') && line.includes('CommandLine')) {
    console.log(line);
  } else if (line.includes('task-3593') && line.includes('CommandLine')) {
    console.log(line);
  }
});
