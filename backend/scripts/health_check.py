"""Health / debug script to exercise core API flows with real keys.

Run (PowerShell):
  python backend/scripts/health_check.py --base http://localhost:8000 --user <UUID>
"""
from __future__ import annotations
import argparse, json, io, requests

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='http://localhost:8000')
    ap.add_argument('--user', help='User UUID or demo id', default=None)
    args = ap.parse_args()
    headers = {}
    if args.user:
        headers['X-User-Id'] = args.user

    def show(name, resp):
        print(f"\n=== {name} ({resp.status_code}) ===")
        try:
            print(json.dumps(resp.json(), indent=2)[:1500])
        except Exception:
            print(resp.text[:500])

    import requests as rq
    show('health', rq.get(f"{args.base}/health"))
    syllabus_bytes = b"Topic: Linear Algebra Basics\nSection: Probability Foundations\nChapter: Calculus Review"
    files = {'file': ('syllabus.txt', syllabus_bytes, 'text/plain')}
    show('upload syllabus', rq.post(f"{args.base}/api/upload/syllabus", headers=headers, files=files))
    show('topics', rq.get(f"{args.base}/api/resources/topics", headers=headers))
    show('plan current', rq.get(f"{args.base}/api/plan/current", headers=headers))
    show('tutor ask', rq.post(f"{args.base}/api/tutor/ask", headers={**headers, 'Content-Type':'application/json'}, json={'question':'Explain variance in statistics.'}))

if __name__ == '__main__':
    main()