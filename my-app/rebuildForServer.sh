#!/bin/bash

echo "Building frontend for API at ${MY_API_SERVER_URL}"
export REACT_APP_API_URL=$MY_API_SERVER_URL; npm run-script build
rm -r ../my-server/build/
cp -r ./build/ ../my-server/
