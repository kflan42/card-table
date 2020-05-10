#!/bin/bash
# run from my-server
export PYTHONPATH="$(pwd)"
./venv/Scripts/python.exe ../my-py2ts/py2ts.py magic/dataclass_schemas.py magic/magic_models.py --camel-case > ../my-app/src/magicModels.ts