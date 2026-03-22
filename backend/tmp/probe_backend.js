import axios from 'axios';

async function main() {
  const url = 'http://localhost:5000/api/debug/health';
  console.log(`📡 Probing Backend Health at ${url}...`);

  try {
    const res = await axios.get(url);
    console.log('✅ BACKEND IS REACHABLE');
    console.log('Response Status:', res.status);
    console.log('Response Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log('❌ BACKEND UNREACHABLE OR ERROR');
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('Error Message:', err.message);
    }
  }
}

main();
