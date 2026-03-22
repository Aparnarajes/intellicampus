
path = r'C:\Users\cyborg\Desktop\intellicampus\frontend\src\pages\student\AttendanceView.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# Fix ABSENT comparisons in timeline card section
content = content.replace(
    "r.status === 'Absent' ? 'bg-rose-500/20 text-rose-400' : 'bg-primary-500/10 text-primary-400'",
    "r.status === 'ABSENT' ? 'bg-rose-500/20 text-rose-400' : 'bg-primary-500/10 text-primary-400'"
)
content = content.replace(
    "{r.status === 'Absent' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}",
    "{r.status === 'ABSENT' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}"
)
content = content.replace(
    "r.status === 'Absent' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'",
    "r.status === 'ABSENT' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'"
)

# Fix h5 to show subject name from the Prisma object
content = content.replace(
    '<h5 className="text-white font-bold leading-tight mb-1">{r.subject}</h5>',
    '<h5 className="text-white font-bold leading-tight mb-1">{r.subject?.subjectName || "Unknown Subject"}</h5>'
)

if content == original:
    print("WARNING: No changes made - patterns may not match!")
else:
    changed = sum(1 for a, b in zip(content.splitlines(), original.splitlines()) if a != b)
    print(f"Applied fixes ({changed} lines changed)")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
