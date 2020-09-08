#!/bin/bash

npm run-script build
rm -r ../my-server/build/
cp -r ./build/ ../my-server/