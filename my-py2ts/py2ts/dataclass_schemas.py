from dataclasses import is_dataclass, MISSING

from marshmallow import fields, post_load, missing, decorators
from marshmallow.schema import BaseSchema


def make_camelcase(s):
    parts = iter(s.split("_"))
    return next(parts) + "".join(i.title() for i in parts)

# based on https://stevenloria.com/dynamic-schemas-in-marshmallow/

class Schema(BaseSchema):
    DATACLASS_TYPE_MAPPING = {**BaseSchema.TYPE_MAPPING, list: fields.List, dict: fields.Dict}

    @classmethod
    def from_dataclass(cls, datacls, camelcase=True):
        """Generate a Schema from a dataclass."""
        c = cls.from_dict(
            {
                name: cls.make_field_for_type(dc_field.type, dc_field.default)
                for name, dc_field in datacls.__dataclass_fields__.items()
            },
            name=f"{datacls.__name__}Schema",
        )

        @post_load  # decorator doesn't work here, add to _hooks below
        def make_it(self, data, **kwargs):
            return datacls(**data)

        if camelcase:
            def on_bind_field(self, field_name, field_obj):
                field_obj.data_key = make_camelcase(field_obj.data_key or field_name)

            setattr(c, on_bind_field.__name__, on_bind_field)

        post_load_fn_name = f"make_{datacls.__name__}"
        setattr(c, post_load_fn_name, make_it)
        c._hooks[(decorators.POST_LOAD, False)] = [post_load_fn_name]
        return c

    @classmethod
    def make_field_for_type(cls, type_, default=missing):
        """Generate a marshmallow Field instance from a Python type."""
        if is_dataclass(type_):
            return fields.Nested(cls.from_dataclass(type_))
        # Get marshmallow field class for Python type
        origin_cls = getattr(type_, "__origin__", None) or type_
        FieldClass = cls.DATACLASS_TYPE_MAPPING[origin_cls]
        # Set `required` and `missing`
        required = default is MISSING
        field_kwargs = {"required": required}
        if not required:
            field_kwargs["missing"] = default
        # Handle list types
        if issubclass(FieldClass, fields.List):
            # Construct inner class
            args = getattr(type_, "__args__", [])
            if args:
                inner_type = args[0]
                inner_field = cls.make_field_for_type(inner_type)
            else:
                inner_field = fields.Field()
            field_kwargs["cls_or_instance"] = inner_field
        if issubclass(FieldClass, fields.Dict):
            # Construct inner class
            args = getattr(type_, "__args__", {})
            if args:
                if args[0]:
                    key_type = args[0]
                    field_kwargs["keys"] = cls.make_field_for_type(key_type)
                if args[1]:
                    value_type = args[1]
                    field_kwargs["values"] = cls.make_field_for_type(value_type)

        return FieldClass(**field_kwargs)
