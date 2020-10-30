#!/bin/bash

echo "Building frontend for API at ${1}"
export REACT_APP_API_URL=${1}; npm run-script build
rm -r ../my-server/build/
cp -r ./build/ ../my-server/
echo "Built frontend for ${1}"
echo "Run this to deploy it: gsutil cp -r build/*  gs://$FRONTEND_BUCKET"
