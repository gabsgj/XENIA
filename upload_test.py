import requests, json, sys

def main():
    url = 'http://127.0.0.1:8000/api/ingest/syllabus'
    fname = 'test_syllabus.txt'
    headers = {'X-User-Id': 'dev-user-1234'}
    try:
        with open(fname, 'rb') as f:
            files = {'file': (fname, f, 'text/plain')}
            print('Uploading', fname, 'to', url)
            r = requests.post(url, files=files, headers=headers, timeout=300)
            print('Status:', r.status_code)
            try:
                print(json.dumps(r.json(), indent=2))
            except Exception:
                print('Response text:', r.text[:2000])
    except FileNotFoundError:
        print('File not found:', fname)
        sys.exit(2)

if __name__ == '__main__':
    main()
