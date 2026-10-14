import http from 'node:http';

function testEndpoint(queryText) {
  return new Promise((resolve, reject) => {
    const url = `http://localhost:5000/api/tts/kannada?text=${encodeURIComponent(queryText)}`;
    http.get(url, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
        });
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  console.log('Testing /api/tts/kannada validation and response...');

  // Test 1: Empty text
  const res1 = await testEndpoint('');
  console.log(`Test 1 (empty text) - Status: ${res1.statusCode}`);
  if (res1.statusCode !== 400) throw new Error('Expected 400 for empty text');

  // Test 2: Valid text
  const res2 = await testEndpoint('ನಮಸ್ಕಾರ, ಇದು ಪರೀಕ್ಷಾರ್ಥ ಆಡಿಯೋ.');
  console.log(`Test 2 (valid text) - Status: ${res2.statusCode}, Content-Type: ${res2.headers['content-type']}, Length: ${res2.body.length}`);
  if (res2.statusCode !== 200) throw new Error(`Expected 200 for valid text, got ${res2.statusCode}`);
  if (!res2.headers['content-type']?.includes('audio/mpeg')) throw new Error('Expected audio/mpeg content type');

  // Verify MPEG sync
  const isMpegFrameSync = res2.body.length >= 2 && res2.body[0] === 0xFF && (res2.body[1] & 0xE0) === 0xE0;
  console.log(`Test 2 - MPEG sync verified: ${isMpegFrameSync}`);
  if (!isMpegFrameSync) throw new Error('Response body is not valid MPEG audio');

  console.log('ALL API TTS ENDPOINT TESTS PASSED!');
}

run().catch((err) => {
  console.error('API TTS test failed:', err);
  process.exit(1);
});
