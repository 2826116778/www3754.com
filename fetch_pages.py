import urllib.request
url = 'https://2826116778.github.io/www3754.com/'
try:
    with urllib.request.urlopen(url, timeout=10) as r:
        status = r.getcode()
        data = r.read(2048).decode('utf-8', errors='replace')
    print('URL:', url)
    print('HTTP status:', status)
    print('\n---PAGE PREVIEW (first 1000 chars)---\n')
    print(data[:1000])
except Exception as e:
    print('Error fetching URL:', e)
