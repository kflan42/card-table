import json
import os

from google.cloud import storage

# Configure this environment variable via app.yaml
from utils import logger

CLOUD_STORAGE_BUCKET = os.environ.get('CLOUD_STORAGE_BUCKET', None)

LOCAL = not CLOUD_STORAGE_BUCKET

logger.info(f"Using {'Local' if LOCAL else CLOUD_STORAGE_BUCKET} persistence.")

_storage_client = None
_bucket = None


def get_bucket():
    global _storage_client
    if not _storage_client:
        # Create a Cloud Storage client once and re-use it.
        _storage_client = storage.Client()
    global _bucket
    if not _bucket:
        # Re-use the bucket object too.
        _bucket = _storage_client.get_bucket(CLOUD_STORAGE_BUCKET)
    return _bucket


def save(file_path: str, what: str, is_json=True):
    if LOCAL:
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
    if LOCAL:
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


def main():
    from test_table import test_table
    from magic_models import Table
    # Get the bucket that the file will be uploaded to.
    bucket = get_bucket()
    magic_table = test_table("test3")

    times0 = upload(bucket, "hello world", lambda t: t)
    times1 = upload(bucket, magic_table.table, lambda t: Table.schema().dumps(t))
    times2 = upload(bucket, magic_table.table, lambda t: t.to_json())

    logger.info(f"Avg time {sum(times0)/len(times0):.3f}s hello world")
    logger.info(f"Avg time {sum(times1)/len(times1):.3f}s schema dumps")
    logger.info(f"Avg time {sum(times2) / len(times2):.3f}s to_json")


def upload(bucket, table, f):
    import time
    times = []
    for _ in range(5):
        is_json = True
        t0 = time.time()
        # Create a new blob and upload the file's content.
        blob = bucket.blob('speed_test.json')
        logger.info(f"Uploading {blob.public_url}")
        # The public URL can be used to directly access the uploaded file via HTTP.
        blob.upload_from_string(
            f(table),
            content_type='application/json' if is_json else 'text/plain'
        )
        t1 = time.time()
        logger.info(f"Saved in {t1 - t0:.3f}s")
        times.append(t1 - t0)
        time.sleep(1)  # avoid getting throttled
    return times


if __name__ == '__main__':
    main()
