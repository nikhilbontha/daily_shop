const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwind = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');

const input = path.resolve(__dirname, '..', 'public', 'css', 'tailwind.css');
const output = path.resolve(__dirname, '..', 'public', 'css', 'modern.css');

async function build() {
  try {
    const css = fs.readFileSync(input, 'utf8');
    const result = await postcss([tailwind, autoprefixer]).process(css, { from: input, to: output });
    fs.writeFileSync(output, result.css, 'utf8');
    console.log('Built', output);
    if (result.map) fs.writeFileSync(output + '.map', result.map.toString(), 'utf8');
  } catch (err) {
    console.error('Build failed:', err);
    process.exitCode = 1;
  }
}

// If --watch provided, do a simple fs.watch on the input file
if (process.argv.includes('--watch')) {
  console.log('Watching', input);
  build();
  fs.watch(input, { persistent: true }, (eventType) => {
    if (eventType === 'change') {
      console.log('Change detected, rebuilding...');
      build();
    }
  });
} else {
  build();
}
