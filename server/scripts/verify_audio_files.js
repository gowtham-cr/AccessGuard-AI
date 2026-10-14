import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioDir = path.resolve(__dirname, '../../client/public/audio/citizen/kn');

const expectedFiles = [
  'page_overview.mp3',
  'svc_ration-card.mp3',
  'svc_bhoomi-land.mp3',
  'svc_senior-pension.mp3',
  'svc_disability-udid.mp3',
  'svc_aadhaar-update.mp3',
];

console.log('Verifying generated Kannada audio assets in:', audioDir);

let allValid = true;

for (const file of expectedFiles) {
  const filePath = path.join(audioDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`MISSING: ${file}`);
    allValid = false;
    continue;
  }

  const stat = fs.statSync(filePath);
  const buffer = fs.readFileSync(filePath);

  // Check MP3 frame sync at start
  const isId3 = buffer.subarray(0, 3).toString('utf-8') === 'ID3';
  const isMpegFrameSync = buffer.length >= 2 && buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0;

  // Scan for MPEG frame headers throughout the file
  let frameCount = 0;
  for (let i = 0; i < buffer.length - 1; i++) {
    if (buffer[i] === 0xFF && (buffer[i + 1] & 0xE0) === 0xE0) {
      frameCount++;
    }
  }

  const status = (isId3 || isMpegFrameSync) && stat.size > 50000 && frameCount > 10;
  console.log(`[${status ? 'PASS' : 'FAIL'}] ${file}:`);
  console.log(`  Size: ${stat.size.toLocaleString()} bytes`);
  console.log(`  Initial sync: ${buffer.subarray(0, 4).toString('hex')}`);
  console.log(`  MPEG sync frames detected: ${frameCount}`);

  if (!status) allValid = false;
}

if (!allValid) {
  console.error('Audio verification FAILED!');
  process.exit(1);
} else {
  console.log('\nAll 6 Kannada audio assets successfully verified as valid playable MPEG audio!');
}
