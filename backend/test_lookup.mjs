import axios from 'axios';

async function test() {
    try {
        const res = await axios.post('http://127.0.0.1:5000/api/auth/lookup', {
            identifier: '1AB22CS001',
            role: 'student'
        });
        console.log('Response:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        if (err.response) {
            console.log('Error Response:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('Error:', err.message);
        }
    }
}

test();
