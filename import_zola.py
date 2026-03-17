#!/usr/bin/env python3
"""Import old Zola content into the kassiopeia DB."""
import os, re, glob, tomllib
from datetime import datetime, date
import psycopg2

DATABASE_URL = os.environ['DATABASE_URL']
CONTENT = '/tmp/zola_content'

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

cur.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
row = cur.fetchone()
if not row:
    print("ERROR: no admin user found")
    exit(1)
admin_id = row[0]
print(f"Using admin user id={admin_id}")

def parse_md(path):
    with open(path, encoding='utf-8') as f:
        text = f.read()
    match = re.match(r'^\+\+\+(.*?)\+\+\+(.*)', text, re.DOTALL)
    if not match:
        return {}, text.strip()
    try:
        fm = tomllib.loads(match.group(1).strip())
    except Exception as e:
        print(f"  TOML parse error in {path}: {e}")
        fm = {}
    body = match.group(2).strip()
    return fm, body

def to_dt(val):
    if val is None:
        return datetime.now()
    if isinstance(val, datetime):
        return val
    if isinstance(val, date):
        return datetime(val.year, val.month, val.day)
    try:
        return datetime.fromisoformat(str(val))
    except Exception:
        return datetime.now()

def insert(post_type, title, body, description=None, created_at=None, sort_order=1000):
    if not title:
        return
    cur.execute(
        "SELECT id FROM posts WHERE type=%s AND title=%s LIMIT 1",
        (post_type, title)
    )
    if cur.fetchone():
        print(f"  SKIP (exists): [{post_type}] {title}")
        return
    dt = to_dt(created_at)
    cur.execute("""
        INSERT INTO posts
            (user_id, type, title, description, body, is_published, is_pinned, is_edited, sort_order, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, true, false, false, %s, %s, %s)
    """, (admin_id, post_type, title, description, body, sort_order, dt, dt))
    print(f"  INSERTED: [{post_type}] {title}")

# ── About pages ────────────────────────────────────────────────────────
print("\n── About ──")
for fname, order in [('about.md', 100), ('manifesto.md', 200), ('tech-and-gear.md', 300)]:
    path = f'{CONTENT}/about/{fname}'
    if not os.path.exists(path):
        print(f"  MISSING: {path}")
        continue
    fm, body = parse_md(path)
    insert('about', fm.get('title', fname), body, created_at=fm.get('date'), sort_order=order)

# ── Blog posts ─────────────────────────────────────────────────────────
print("\n── Blog ──")
for path in sorted(glob.glob(f'{CONTENT}/blog/[0-9]*.md')):
    fm, body = parse_md(path)
    title = fm.get('title', '')
    desc = fm.get('extra', {}).get('summary') or fm.get('description')
    insert('blog', title, body, description=desc, created_at=fm.get('date'))

# ── Shows ──────────────────────────────────────────────────────────────
print("\n── Shows ──")
for path in glob.glob(f'{CONTENT}/shows/*.md'):
    if '_index' in path:
        continue
    fm, body = parse_md(path)
    insert('show', fm.get('title', ''), body, created_at=fm.get('date'))

ROMAN = {'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
         'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10}

def roman_from_filename(fname):
    m = re.search(r'-([ivx]+)\.md$', fname)
    if m:
        return ROMAN.get(m.group(1), 1000)
    return 1000

def insert_track(parent_post_id, title, body, sort_order, music_album):
    if not title:
        return
    cur.execute(
        "SELECT id FROM posts WHERE type='track' AND title=%s AND parent_post_id=%s LIMIT 1",
        (title, parent_post_id)
    )
    if cur.fetchone():
        print(f"  SKIP (exists): [track] {title}")
        return
    cur.execute("""
        INSERT INTO posts
            (user_id, type, title, body, music_album, is_published, is_pinned, is_edited,
             sort_order, parent_post_id, created_at, updated_at)
        VALUES (%s, 'track', %s, %s, %s, true, false, false, %s, %s, now(), now())
    """, (admin_id, title, body or None, music_album, sort_order, parent_post_id))
    print(f"  INSERTED: [track {sort_order}] {title}")

# ── Release: The Redacted Plutonian Packet ─────────────────────────────
print("\n── Releases ──")
path = f'{CONTENT}/discography/the-plutonian-packet/_index.md'
if os.path.exists(path):
    fm, body = parse_md(path)
    release_date = fm.get('extra', {}).get('releasedate') or fm.get('date')
    insert('release', fm.get('title', 'The Redacted Plutonian Packet'), body,
           description=fm.get('description'), created_at=release_date)
    conn.commit()

    cur.execute("SELECT id FROM posts WHERE type='release' AND title=%s LIMIT 1",
                (fm.get('title', 'The Redacted Plutonian Packet'),))
    album_row = cur.fetchone()
    if album_row:
        album_id = album_row[0]
        album_name = fm.get('title', 'The Redacted Plutonian Packet')
        print(f"\n── Tracks (parent={album_id}) ──")
        track_dir = f'{CONTENT}/discography/the-plutonian-packet'
        for fpath in glob.glob(f'{track_dir}/*.md'):
            fname = os.path.basename(fpath)
            if fname == '_index.md':
                continue
            tfm, tbody = parse_md(fpath)
            order = roman_from_filename(fname)
            insert_track(album_id, tfm.get('title', ''), tbody, order, album_name)
else:
    print(f"  MISSING: {path}")

conn.commit()
cur.close()
conn.close()
print("\nDone.")
