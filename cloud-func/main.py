import json
import os
from datetime import datetime
import urllib.request

from google.cloud import storage
import jq

from utils import logger


def card_update(request):
    """HTTP Cloud Function."""

    GOOGLE_CLOUD_PROJECT = os.environ.get('MY_CLOUD_PROJECT')
    BUCKET = (GOOGLE_CLOUD_PROJECT + ".appspot.com")

    downloaded_cards = download_cards()
    cards, tokens = extract_cards(downloaded_cards)
    result = save_cards(cards, tokens, BUCKET)

    return result


def download_cards():
    logger.info("downloading URI for latest card data ...")
    with urllib.request.urlopen("https://api.scryfall.com/bulk-data/default_cards") as f:
        data1 = f.read()
    j1 = json.loads(data1)

    latest = datetime.fromisoformat(j1['updated_at']).replace(tzinfo=None)
    logger.info(f'latest cards from {latest}')
    download_uri = j1['download_uri']

    logger.info(f"downloading {download_uri} ...")
    with urllib.request.urlopen(download_uri) as f:
        all_cards = f.read().decode('UTF-8')

    logger.info("download complete")

    return all_cards


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


def extract_cards(all_cards):
    # use jq to extract fields we care about
    # see https://scryfall.com/docs/api/cards and https://scryfall.com/docs/api/images
    logger.info("extracting card fields via jq")
    cards_text = jq.compile(f'[.[] | {C_FILTER} | {CARD}]').input(text=all_cards).text()
    logger.info("extracting token fields via jq")
    tokens_text = jq.compile(f'[.[] | {T_FILTER} | {CARD}]').input(text=all_cards).text()

    logger.info("cards and tokens extracted")
    return cards_text, tokens_text


def save_cards(cards_text, tokens_text, bucket_name):
    # save them to bucket
    _storage_client = None
    _bucket = None

    # Get the bucket that the file will be uploaded to.
    bucket = storage.Client().get_bucket(bucket_name)

    # Create a new blob and upload the file's content.
    blob = bucket.blob("cards/cards.json")
    logger.info(f"Uploading {blob.public_url}")
    # The public URL can be used to directly access the uploaded file via HTTP.
    blob.upload_from_string(
        cards_text,
        content_type='application/json'
    )

    # Create a new blob and upload the file's content.
    blob = bucket.blob("cards/tokens.json")
    logger.info(f"Uploading {blob.public_url}")
    # The public URL can be used to directly access the uploaded file via HTTP.
    blob.upload_from_string(
        tokens_text,
        content_type='application/json'
    )

    return "saved new cards and tokens to bucket"
