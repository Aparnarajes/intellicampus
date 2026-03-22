

async function testAnalytics() {
    console.log("Logging in...");
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'pavithra@intellicampus.com', password: 'intellicampus8187' })
    });

    if (!loginRes.ok) {
        console.error("Login failed!", await loginRes.text());
        return;
    }
    const loginData = await loginRes.json();
    const token = loginData.data?.token || loginData.token;
    console.log("Logged in gracefully! Token length:", token?.length);

    console.log("Fetching endpoints...");
    const endpoints = [
        '/api/analytics/student/attendance-trend',
        '/api/analytics/student/performance',
        '/api/analytics/student/prediction',
        '/api/analytics/weak-topics',
        '/api/analytics/recommendations',
        '/api/analytics/student/profile',
        '/api/analytics/batch/weak-students?batch=1',
        '/api/analytics/batch/heatmap?batch=1',
        '/api/analytics/academic-intelligence'
    ];

    for (const ep of endpoints) {
        try {
            const res = await fetch(`http://localhost:5000${ep}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const text = await res.text();
            console.log(`${ep} -> HTTP ${res.status}`);
            if (!res.ok || text.includes('"success":false')) {
                console.error(`ERROR on ${ep}:`, text);
                break;
            }
        } catch (e) {
            console.error(`Crashed on ${ep}:`, e.message);
            break;
        }
    }
}
testAnalytics();
