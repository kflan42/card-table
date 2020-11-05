#!/bin/bash
# run from my-server
./venv/Scripts/py-ts-interfaces.exe -o t.ts magic_models.py || echo " ^ okay we're not in windows"
py-ts-interfaces -o t.ts magic_models.py || echo " ^ okay we're not in *nix"
sed -E 's/^interface/export interface/g' t.ts > ../my-app/src/magic_models.ts
rm t.ts
echo "complete"
