import axios from 'axios';

async function test() {
    try {
        console.log('Testing /api/auth/check-email...');
        const res = await axios.post('http://localhost:5000/api/auth/check-email', {
            email: 'aparnaintellicampus@gmail.com'
        });
        console.log('SUCCESS:', res.data);
    } catch (err) {
        console.log('FAILED:', err.response ? err.response.data : err.message);
    }
}

test();
