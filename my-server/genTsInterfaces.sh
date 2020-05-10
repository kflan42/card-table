#!/bin/bash
# run from my-server
# TODO undo this mix of windows and bash
./venv/Scripts/py-ts-interfaces.exe -o t.ts magic/magic_models.py
sed -E 's/^interface/export interface/g' t.ts > ../my-app/src/magic_models.ts
rm t.ts