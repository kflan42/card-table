
from flask import Flask
from flask import request
from flask_cors import CORS

from update_cards import download_cards, extract_cards, save_cards

from utils import logger

logger.info("hello from logger")

app = Flask(__name__)

CORS(app)  # necessary for api in app engine and frontend in storage bucket


@app.route('/table-admin/update-cards', methods=['GET', 'PUT'])
def update_cards():
    try:
        if request.method == 'PUT' or request.headers.get('X-Appengine-Cron') == 'true':
            logger.warning(f"Updating cards.")
            cards_text, tokens_text = extract_cards(download_cards())
            output = save_cards(cards_text, tokens_text)
            return {"message": output}
        elif request.method == 'GET':
            return {"hello stranger": "danger!"}
        else:
            return "Bad Request", 400
    except Exception as e:
        logger.warning("problem updating cards", exc_info=True)
        return str(e), 400


@app.route('/_ah/warmup')
def warmup():
    # google cloud will call this
    logger.info(f"Warmed up.")
    return '', 200, {}


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080, debug=True)
    logger.warning("goodbye world")
