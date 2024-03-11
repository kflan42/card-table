#!/bin/bash

echo "Building frontend for API at ${1}"
export REACT_APP_API_URL=${1}; npm run-script build
rm -r ../my-server/public/
mkdir -p ../my-server/public/
cp -r ./build/ ../my-server/public/
echo "Built frontend for ${1}"
