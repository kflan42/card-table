import unittest

from persistence import get_bucket, ls_dir
from utils import logger


class MyTestCase(unittest.TestCase):

    def test_something(self):
        from test_table import test_table
        from magic_models import Table

        tables = ls_dir("tables/")
        print(tables)

        magic_table = test_table("test3")

        # Get the bucket that the file will be uploaded to.
        bucket = get_bucket()
        times0 = upload(bucket, "hello world", lambda t: t)
        times1 = upload(bucket, magic_table.table, lambda t: Table.schema().dumps(t))
        times2 = upload(bucket, magic_table.table, lambda t: t.to_json())

        logger.info(f"Avg time {sum(times0) / len(times0):.3f}s hello world")
        logger.info(f"Avg time {sum(times1) / len(times1):.3f}s schema dumps")
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
    unittest.main()
