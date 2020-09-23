import json
import logging
import os

from google.cloud import storage

# Configure this environment variable via app.yaml
CLOUD_STORAGE_BUCKET = os.environ.get('CLOUD_STORAGE_BUCKET', None)

LOCAL = False

_storage_client = None


def get_client():
    global _storage_client
    if not _storage_client:
        # Create a Cloud Storage client once and re-use it.
        _storage_client = storage.Client()
    return _storage_client


def save(file_path: str, what: str, is_json=True):
    if LOCAL:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, mode='w') as f:
            f.write(what)
    else:
        gcs = get_client()
        # Get the bucket that the file will be uploaded to.
        bucket = gcs.get_bucket(CLOUD_STORAGE_BUCKET)
        # Create a new blob and upload the file's content.
        blob = bucket.blob(file_path)
        logging.info(f"Uploading {blob.public_url}")
        # The public URL can be used to directly access the uploaded file via HTTP.
        blob.upload_from_string(
            what,
            content_type='application/json' if is_json else 'text/plain'
        )


def load(file_path: str, encoding=None, is_json=True):
    if LOCAL:
        if os.path.isfile(file_path):
            with open(file_path, mode='r', encoding=encoding) as f:
                if is_json:
                    return json.load(f)
        return None
    else:
        gcs = get_client()
        # Get the bucket that the file will be uploaded to.
        bucket = gcs.get_bucket(CLOUD_STORAGE_BUCKET)
        blob = bucket.get_blob(file_path)
        if blob:
            # download the blob as a string
            logging.info(f"Downloading {blob.public_url}")
            as_bytes = blob.download_as_bytes()
            if encoding:
                data = as_bytes.decode(encoding=encoding)
            else:
                data = as_bytes.decode()
            return json.loads(data)
        else:
            logging.info(f"No blob at {file_path}")
            return None
