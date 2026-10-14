import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateFullAudio } from './audio_generator_utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import exact content from client
import { CITIZEN_SERVICES, UI_TRANSLATIONS } from '../../client/src/data/citizenContent.js';

async function main() {
  const outDir = path.resolve(__dirname, '../../client/public/audio/citizen/kn');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const audioTargets = [];

  // 1. Page overview
  const title = UI_TRANSLATIONS.kn.banner.title;
  const subtitle = UI_TRANSLATIONS.kn.banner.subtitle;
  const notice = UI_TRANSLATIONS.kn.disclaimer.text;
  const overviewText = `${title}. ${subtitle}. ${notice}`;
  audioTargets.push({
    id: 'page_overview',
    filename: 'page_overview.mp3',
    text: overviewText,
  });

  // 2 - 6. The 5 civic service guides
  for (const svc of CITIZEN_SERVICES) {
    const data = svc.kn;
    const stepLabel = UI_TRANSLATIONS.kn.serviceCard.stepNumber;
    const docsLabel = UI_TRANSLATIONS.kn.serviceCard.requiredDocs;

    const stepsText = data.steps
      .map((s) => `${stepLabel} ${s.step}: ${s.title}. ${s.instruction}`)
      .join('. ');
    const docsText = `${docsLabel}: ${data.documentsRequired.join(', ')}`;
    const fullText = `${data.title}. ${data.department}. ${data.shortDesc}. ${docsText}. ${stepsText}. ${data.helpline}.`;

    audioTargets.push({
      id: `svc_${svc.id}`,
      filename: `svc_${svc.id}.mp3`,
      text: fullText,
    });
  }

  console.log(`Starting genuine Kannada audio generation for ${audioTargets.length} sections...`);
  const results = [];

  for (const target of audioTargets) {
    console.log(`\n========================================================`);
    console.log(`Target: ${target.id} -> ${target.filename}`);
    console.log(`Text preview: ${target.text.slice(0, 80)}...`);

    const audioBuffer = await generateFullAudio(target.text, target.id);
    const destPath = path.join(outDir, target.filename);
    fs.writeFileSync(destPath, audioBuffer);

    const stats = fs.statSync(destPath);
    results.push({
      id: target.id,
      file: target.filename,
      sizeBytes: stats.size,
      path: destPath,
    });

    console.log(`Saved: ${target.filename} (${stats.size.toLocaleString()} bytes)`);
  }

  console.log(`\n========================================================`);
  console.log('SUMMARY OF GENERATED AUDIO ASSETS:');
  console.table(results);

  // Validate all 6 files are present and non-empty (> 10KB)
  for (const r of results) {
    if (r.sizeBytes < 10000) {
      throw new Error(`Asset ${r.file} is suspiciously small: ${r.sizeBytes} bytes`);
    }
  }

  console.log('All 6 Kannada audio assets successfully generated and verified!');
}

main().catch((err) => {
  console.error('Fatal error generating audio:', err);
  process.exit(1);
});
