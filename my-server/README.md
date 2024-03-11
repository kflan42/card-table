# To run from a fresh checkout:

FYI - close IDEs while running installs else files get stuck.

```
cd my-server
python3 -m venv "venv"
source venv/bin/activate
pip3 install -r requirements.txt
./genTsInterfaces.sh
```
Then do the local part of cards update and frontend build.

## Cloud Deployment

There are 4 pieces to deploy to the cloud: card data, frontend, backend, and the function for updating cards.

### Cloud cards update

Set `GOOGLE_CLOUD_PROJECT` to the name of your project.

```
cd scryfall; python3 updateCards.py; extractCards.sh
gsutil cp -r ../my-server/cards gs://${GOOGLE_CLOUD_PROJECT}.appspot.com
```

### Cloud frontend update
See [../my-app/README.md](../my-app/README.md)

### Cloud backend server update

This is based on the [Google App Engine Docs](https://cloud.google.com/appengine/docs/standard/python3/building-app).

Set `VERSION` to something meaningful to you.

```
cd my-server
gcloud app deploy --version VERSION --verbosity info
```

## Local Deployment
For development or local hosting.
```
export FLASK_DEV=True; export BASE_IP=localhost; export BASE_PORT=5000
python3 hello.py

# Optionally run a dev ui from
cd my-app; npm start

# or a production build ui via
cd my-app; ./rebuildForServer.sh http://localhost:5000
cd build; python3 -m http.server 3000
```

### Local run using cloud storage
Because you never know what you'll need to debug.
```
export GOOGLE_APPLICATION_CREDENTIALS=$$$_key.json
export GOOGLE_CLOUD_PROJECT=
gunicorn --worker-class eventlet -w 1 hello:app
```