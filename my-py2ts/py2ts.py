
from py2ts import filter_schemas, sch_to_intrf
import importlib
import sys
import os
import argparse
import importlib.util

arg_parser = argparse.ArgumentParser(description='Flaskerize')
arg_parser.add_argument('--camel-case', '-cc', action="store_true",
                        help='Convert snake_case Python names to lowerCamelCase')
arg_parser.add_argument('filenames', help='Target files', nargs='+')

parsed = arg_parser.parse_args()

for filename in parsed.filenames:
    if not os.path.isfile(filename):
        exit(f'{filename} is not a valid file.')

    name = os.path.split(filename)[-1].replace(".py","")

    spec = importlib.util.spec_from_file_location(filename, filename)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    print(f'loaded {name}', file=sys.stderr)
    spec.loader.exec_module(module)

print(f'outputting {name}', file=sys.stderr)
schemas = filter_schemas(module)
print()
for schema in schemas:
    sch_to_intrf(*schema, conv_camel=parsed.camel_case)
