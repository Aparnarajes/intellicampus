
# Verify all attendance status case issues are fixed
files = {
    'AttendanceView': r'C:\Users\cyborg\Desktop\intellicampus\frontend\src\pages\student\AttendanceView.jsx',
    'StudentDashboard': r'C:\Users\cyborg\Desktop\intellicampus\frontend\src\pages\student\StudentDashboard.jsx',
    'AttendanceHistory': r'C:\Users\cyborg\Desktop\intellicampus\frontend\src\pages\faculty\AttendanceHistory.jsx',
}

for name, path in files.items():
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    old_status = []
    for i, line in enumerate(content.splitlines(), 1):
        if ("=== 'Absent'" in line or "=== 'Present'" in line) and 'Absent' in line:
            old_status.append(f'  Line {i}: {line.strip()[:120]}')
    
    if old_status:
        print(f'[WARN] {name} still has mixed-case checks:')
        for s in old_status:
            print(s)
    else:
        print(f'[OK] {name} - all status comparisons use uppercase')

print('Done.')
