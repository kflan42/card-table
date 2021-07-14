import json
import os

from google.cloud import storage
from google.cloud.storage import Client, Bucket

from utils import logger

# Configure this environment variable via app.yaml
GOOGLE_CLOUD_PROJECT = os.environ.get('GOOGLE_CLOUD_PROJECT', None)

BUCKET = (GOOGLE_CLOUD_PROJECT + ".appspot.com") if GOOGLE_CLOUD_PROJECT else None

logger.info(f"Using {'local disk' if not GOOGLE_CLOUD_PROJECT else BUCKET} for persistence.")

_storage_client = None
_bucket = None


def get_client() -> Client:
    global _storage_client
    if not _storage_client:
        # Create a Cloud Storage client once and re-use it.
        _storage_client = storage.Client()
    return _storage_client


def get_bucket() -> Bucket:
    global _bucket
    if not _bucket:
        # Re-use the bucket object too.
        _bucket = get_client().get_bucket(BUCKET)
    return _bucket


def ls_dir(file_path: str):
    if not BUCKET:
        if os.path.isdir(file_path):
            logger.info(f"Listing {file_path}")
            files = os.listdir(file_path)
            times = [os.stat(os.path.join(file_path, f)).st_mtime for f in files]
            return list(zip(files, times))
        return []
    else:
        blobs = get_client().list_blobs(BUCKET, prefix=file_path, fields='items(name,updated)')
        return [(b.name.replace(file_path, "", 1), b.updated.timestamp()) for b in blobs]


def save(file_path: str, what: str, is_json=True):
    if not BUCKET:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        logger.info(f"Writing {file_path}")
        with open(file_path, mode='w') as f:
            f.write(what)
    else:
        # Get the bucket that the file will be uploaded to.
        bucket = get_bucket()
        # Create a new blob and upload the file's content.
        blob = bucket.blob(file_path)
        logger.info(f"Uploading {blob.public_url}")
        # The public URL can be used to directly access the uploaded file via HTTP.
        blob.upload_from_string(
            what,
            content_type='application/json' if is_json else 'text/plain'
        )


def load(file_path: str, encoding=None, decoder=json.loads):
    if not BUCKET:
        if os.path.isfile(file_path):
            logger.info(f"Reading {file_path}")
            with open(file_path, mode='r', encoding=encoding) as f:
                return decoder(f.read())
        return None
    else:
        # Get the bucket that the file will be uploaded to.
        bucket = get_bucket()
        blob = bucket.get_blob(file_path)
        if blob:
            # download the blob as a string
            logger.info(f"Downloading {blob.public_url}")
            as_bytes = blob.download_as_bytes()
            if encoding:
                data = as_bytes.decode(encoding=encoding)
            else:
                data = as_bytes.decode()
            return decoder(data)
        else:
            logger.info(f"No blob at {file_path}")
            return None

