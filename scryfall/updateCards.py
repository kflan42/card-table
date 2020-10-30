"""
Runs with system python packages, no other dependencies.
"""

import json
import os
import shutil
import urllib.request
from datetime import datetime, timedelta

print("downloading URI for latest card data ...")
with urllib.request.urlopen("https://api.scryfall.com/bulk-data/default_cards") as f:
    data1 = f.read()
j1 = json.loads(data1)

latest = datetime.fromisoformat(j1['updated_at']).replace(tzinfo=None)
download_uri = j1['download_uri']

reload = True
existing = None
default_cards_json = 'scryfall-default-cards.json'

if os.path.isfile(default_cards_json):
    existing = datetime.utcfromtimestamp(os.stat(default_cards_json).st_mtime)
    reload = latest - existing > timedelta(1)

if reload:
    print(f"downloading {download_uri} ...")
    with urllib.request.urlopen(download_uri) as f:
        data1 = f.read()
    # cards = json.loads(data1) # parsing this all in is too slow
    filename = os.path.split(download_uri)[-1]
    with open(filename, mode="wb") as o:
        # json.dump(data1, o, ensure_ascii=False)  # some card names are unicode
        o.write(data1)
    os.rename(default_cards_json, 'scryfall-default-cards.json.bk')
    shutil.copyfile(filename, default_cards_json)
    print("complete")
else:
    print(f"card json files new enough")
