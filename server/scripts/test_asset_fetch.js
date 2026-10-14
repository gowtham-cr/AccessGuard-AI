async function test() {
  try {
    const res = await fetch('http://localhost:5173/audio/citizen/kn/page_overview.mp3');
    console.log('Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    const buf = await res.arrayBuffer();
    console.log('Length:', buf.byteLength);
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}

test();
