import https from 'node:https';

function fetchKannadaTtsChunk(text) {
  return new Promise((resolve, reject) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=kn&client=tw-ob&q=${encodeURIComponent(text)}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      },
    };

    https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`TTS request failed with status ${res.statusCode}`));
      }
      const contentType = res.headers['content-type'] || '';
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({ buffer, contentType });
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Testing Kannada TTS endpoint...');
  const sample = 'ನಮಸ್ಕಾರ, ಆಕ್ಸೆಸ್‌ಗಾರ್ಡ್ ನಾಗರಿಕ ಮಾರ್ಗದರ್ಶಿಗೆ ಸ್ವಾಗತ.';
  const { buffer, contentType } = await fetchKannadaTtsChunk(sample);
  console.log(`Response Content-Type: ${contentType}`);
  console.log(`Buffer byte length: ${buffer.length}`);

  // Check first bytes for MP3 sync or ID3 tag
  const isId3 = buffer.subarray(0, 3).toString('utf-8') === 'ID3';
  // MP3 frame sync: 11 bits set (0xFF followed by 0xE0 mask)
  const isMpegFrameSync = (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0);

  console.log(`Starts with ID3 tag? ${isId3}`);
  console.log(`First 4 bytes hex: ${buffer.subarray(0, 4).toString('hex')}`);
  console.log(`Has MPEG frame sync? ${isMpegFrameSync}`);

  if (buffer.length < 1000 || (!isId3 && !isMpegFrameSync)) {
    throw new Error('Response is not valid playable MPEG audio');
  }

  console.log('SUCCESS: Kannada TTS chunk successfully fetched and verified as valid MPEG audio!');
}

main().catch((err) => {
  console.error('Error during TTS test:', err);
  process.exit(1);
});
