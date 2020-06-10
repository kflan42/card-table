#!/bin/bash
# run from my-server
./venv/Scripts/py-ts-interfaces.exe -o t.ts magic/magic_models.py || echo " ^ okay not exe"
./venv/bin/py-ts-interfaces -o t.ts magic/magic_models.py || echo " ^ okay not *nix"
sed -E 's/^interface/export interface/g' t.ts > ../my-app/src/magic_models.ts
rm t.ts
echo "complete"
