const { execSync } = require('child_process');

const MAX_ARGS = 50;

function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function prettierChunked(files) {
  const chunks = chunk(files, MAX_ARGS);
  return chunks.map((c) => `prettier --write ${c.map((f) => `"${f}"`).join(' ')}`);
}

module.exports = {
  '*.{ts,js,json,md,yml,yaml,css,html}': prettierChunked,
};
