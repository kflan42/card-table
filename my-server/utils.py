import logging
import sys

logger = logging.getLogger('my_logger')
logger.setLevel(logging.INFO)

# create console handler and set level to debug
ch = logging.StreamHandler(stream=sys.stdout)
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s %(name)s %(levelname)-8s %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)
