import axios from 'axios';

async function test() {
    try {
        console.log('Logging in as admin...');
        const auth = await axios.post('http://localhost:5000/api/auth/login', {
            identifier: 'aparnaintellicampus@gmail.com',
            password: 'intellicampus8187'
        });
        
        const token = auth.data.data.token;
        console.log('Token received! Fetching stats...');

        const stats = await axios.get('http://localhost:5000/api/admin/stats', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('STATS SUCCESS:', JSON.stringify(stats.data.data, null, 2));
    } catch (err) {
        console.log('FAILED:', err.response ? err.response.data : err.message);
    }
}

test();
