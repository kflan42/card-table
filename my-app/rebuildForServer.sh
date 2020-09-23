#!/bin/bash

export REACT_APP_API_URL=$MY_API_SERVER_URL; npm run-script build
rm -r ../my-server/build/
cp -r ./build/ ../my-server/
