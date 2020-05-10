import inspect

import marshmallow
from marshmallow import Schema, fields


TYPE_MAP = {
    fields.Bool: 'boolean',
    fields.Boolean: 'boolean',
    fields.Constant: 'any',
    fields.DateTime: 'Date',
    fields.Decimal: 'number',
    fields.Dict: 'object',
    fields.Email: 'string',
    fields.Field: 'any',
    fields.Float: 'number',
    fields.Function: 'any',
    fields.Int: 'number',
    fields.Integer: 'number',
    fields.List: 'any[]',
    fields.Mapping: 'any',
    fields.Method: 'any',
    fields.Nested: 'any',
    fields.Number: 'number',
    fields.Raw: 'any',
    fields.Str: 'string',
    fields.String: 'string',
    fields.TimeDelta: 'any',
    # fields.Tuple: 'any',
    fields.URL: 'string',
    fields.Url: 'string',
    fields.UUID: 'string',
}

VersionDependentTypes = {
    'LocalDateTime': 'Date',
    'NaiveDateTime': 'Date',
    'AwareDateTime': 'Date',
}

for (pytype, ngtype) in VersionDependentTypes.items():
    try:
        TYPE_MAP[getattr(fields, pytype)] = ngtype
    except AttributeError:
        continue


def to_camel(snake):
    tkns = snake.split('_')
    return tkns[0] + ''.join(t.title() for t in tkns[1:])


def filter_schemas(module):
    schemas = [(name, obj) for (name, obj)
               in inspect.getmembers(module)
               if inspect.isclass(obj)
               and issubclass(obj, Schema)
               and name != "Schema"
               and obj is not Schema]  # ignore lines that import Marshmallow.Schema
    return schemas


def resolve_value(v):
    if type(v) is marshmallow.fields.Nested:
        ts_type = v.nested.__name__.replace('Schema', '')
        if v.many:
            ts_type += '[]'
    elif type(v) is marshmallow.fields.List:
        ts_type = f'{resolve_value(v.inner)}[]'
    elif type(v) is marshmallow.fields.Dict:
        ts_type = f'{{ [index: {resolve_value(v.key_field)}]: {resolve_value(v.value_field)} }}'
    else:
        ts_type = TYPE_MAP.get(type(v), 'any')
    return ts_type

def sch_to_intrf(name, schema, conv_camel=False):
    name = name.replace('Schema', '')  # + 'Interface'
    fields = []
    indent = ' ' * 4
    initialized = schema()

    items = initialized.fields.items()
    items = sorted(items)
    for k, v in items:
        ts_type = resolve_value(v)
        fields.append(
            f'{indent}{k if not conv_camel else to_camel(k)}: {ts_type};')
    fields = '\n'.join(fields)
    CONTENT = f'''export interface {name} {{
{fields}
}}
    '''
    print(CONTENT)