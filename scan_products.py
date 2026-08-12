from pathlib import Path
import json
import re
import glob

p = Path('c:/Users/Administrator/Desktop/网站/www3754.com')
text = p.joinpath('data.js').read_text(encoding='utf-8')
m = re.search(r'window\.defaultProducts\s*=\s*(\[.*\])\s*;', text, re.S)
if not m:
    raise SystemExit('data.js parse failed')
arr = json.loads(m.group(1))
print('data.js count:', len(arr))
print('data.js ids:', [item['id'] for item in arr])
print('data.js names:', [item['name'] for item in arr])
exp = json.loads(p.joinpath('products-export.json').read_text(encoding='utf-8'))
print('products-export.json count:', len(exp))
print('products-export.json ids:', [item['id'] for item in exp])
print('products-export.json names:', [item['name'] for item in exp])
ids_data = {item['id'] for item in arr}
ids_exp = {item['id'] for item in exp}
print('duplicate ids between sources:', ids_data & ids_exp)
print('all ids unique count if merged:', len(ids_data | ids_exp))
print('all names unique count if merged:', len({item['name'] for item in arr + exp}))
print('names only in data.js:', sorted({item['name'] for item in arr} - {item['name'] for item in exp}))
print('names only in products-export.json:', sorted({item['name'] for item in exp} - {item['name'] for item in arr}))
print('missing keys:')
for src, items in [('data.js', arr), ('products-export.json', exp)]:
    for i, item in enumerate(items):
        if set(item.keys()) != {'id', 'name', 'category', 'price', 'stock', 'description', 'image'}:
            print(src, 'item', i, 'keys', sorted(item.keys()))
print('references:')
for path in sorted(list(glob.glob(str(p / '*.js'))) + list(glob.glob(str(p / '*.html'))) + list(glob.glob(str(p / '*.json')))):
    path_obj = Path(path)
    txt = path_obj.read_text(encoding='utf-8')
    toks = ['modern-shop-products', 'defaultProducts', 'products-export.json', 'localStorage', 'window.defaultProducts', 'getProducts(', 'getStoredProducts(', '烟弹克', '烟杆', '电子秤', '电子加热器', '整套化学试剂', '尖嘴瓶']
    found = [t for t in toks if t in txt]
    if found:
        print(path_obj.name, found)
