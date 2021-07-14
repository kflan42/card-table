"""
Runs with system python packages, no other dependencies.
"""

import json
import os
import shutil
import subprocess
import urllib.request
from datetime import datetime, timedelta

from utils import logger

DEFAULT_CARDS_JSON = "scryfall-default-cards.json"

logger.info("hello from logger")

# TODO do all this in memory instead of writing to /tmp since that counts against memory quota

def download_cards(where='.'):
    logger.info("downloading URI for latest card data ...")
    with urllib.request.urlopen("https://api.scryfall.com/bulk-data/default_cards") as f:
        data1 = f.read()
    j1 = json.loads(data1)

    latest = datetime.fromisoformat(j1['updated_at']).replace(tzinfo=None)
    download_uri = j1['download_uri']

    reload = True
    default_cards_json = os.path.join(where, DEFAULT_CARDS_JSON)

    if os.path.isfile(default_cards_json):
        existing = datetime.utcfromtimestamp(os.stat(default_cards_json).st_mtime)
        reload = latest - existing > timedelta(1)

    if reload:
        logger.info(f"downloading {download_uri} ...")
        with urllib.request.urlopen(download_uri) as f:
            data1 = f.read()
        # cards = json.loads(data1) # parsing this all in is too slow
        downloaded_cards_json = os.path.join(where, os.path.split(download_uri)[-1])
        with open(downloaded_cards_json, mode="wb") as o:
            # json.dump(data1, o, ensure_ascii=False)  # some card names are unicode
            o.write(data1)
        if where == '/tmp':
            os.rename(downloaded_cards_json, default_cards_json)
        else:
            logger.info("moving current to .bk")
            os.rename(default_cards_json, os.path.join(where, DEFAULT_CARDS_JSON + '.bk'))
            shutil.copyfile(downloaded_cards_json, default_cards_json)
        logger.info("complete")
        return f"downloaded {downloaded_cards_json}"
    else:
        logger.info(f"card json files new enough")
        return f"card json files new enough"


def extract_cards(where='../my-server/cards'):
    # see https://scryfall.com/docs/api/cards and https://scryfall.com/docs/api/images

    default_json_path = os.path.join(where, DEFAULT_CARDS_JSON)

    # subject 2 from line number to get array index for examples
    # jq "[.[12,2135,10399] | ...

    # test to filter for "Official sets always have a three-letter set code". weird cards have 4 letter. tokens have "t..."

    CORE = 'sf_id: .id, name: .name, set_name: .set, number: .collector_number'

    CARD = f'''
    {{{CORE},
     face: (if.image_uris then
            .image_uris | {{normal:.normal, small:.small}}
            else
            null
            end),
    faces: (if.card_faces then
            [.card_faces[] | {{name:.name, normal:.image_uris.normal, small:.image_uris.small}}]
            else
            []
            end),
    }}'''

    # All official sets are 3 characters and token sets prepend T, so filter down to those.
    # Stick to English since it's unfortunately the only language I'm fluent in.
    # Avoid digital only cards since they often have bad print pictures.
    C_FILTER = 'select( (.set|test("^...$")) and (.lang|test("en")) and (.digital != true) )'
    T_FILTER = 'select( (.set|test("^t...$")) and (.lang|test("en")) and (.digital != true) )'

    os.makedirs(where, exist_ok=True)

    import jq

    logger.info("reading cards")
    with open(default_json_path, mode='r') as f:
        all_cards = f.read()

        logger.info("extracting fields via jq")
        cards_json = jq.compile(f'[.[] | {C_FILTER} | {CARD}]').input(text=all_cards).text()
        logger.info("dumping cards to file")
        with open(os.path.join(where, "cards.json"), mode="w") as o:
            o.write(cards_json)

        logger.info("extracting fields via jq")
        tokens_json = jq.compile(f'[.[] | {T_FILTER} | {CARD}]').input(text=all_cards).text()
        logger.info("dumping tokens to file")
        with open(os.path.join(where, "tokens.json"), mode="w") as o:
            o.write(tokens_json)

    return "cards and tokens extracted"


def save_cards(from_where='/tmp'):
    GOOGLE_CLOUD_PROJECT = os.environ.get('GOOGLE_CLOUD_PROJECT')
    BUCKET = (GOOGLE_CLOUD_PROJECT + ".appspot.com")
    _storage_client = None
    _bucket = None

    from google.cloud import storage

    # Get the bucket that the file will be uploaded to.
    bucket = storage.Client().get_bucket(BUCKET)

    with open(os.path.join(from_where, "cards.json"), mode="rb") as o:
        cards = o.read()
        # Create a new blob and upload the file's content.
        blob = bucket.blob("cards/cards.json")
        logger.info(f"Uploading {blob.public_url}")
        # The public URL can be used to directly access the uploaded file via HTTP.
        blob.upload_from_string(
            cards,
            content_type='application/json'
        )

    with open(os.path.join(from_where, "tokens.json"), mode="rb") as o:
        tokens = o.read()
        # Create a new blob and upload the file's content.
        blob = bucket.blob("cards/tokens.json")
        logger.info(f"Uploading {blob.public_url}")
        # The public URL can be used to directly access the uploaded file via HTTP.
        blob.upload_from_string(
            tokens,
            content_type='application/json'
        )

    return "saved to bucket"
