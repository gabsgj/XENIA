try:
    from marshmallow import Schema, fields, validate  # type: ignore
except Exception:  # pragma: no cover - environment fallback
    # Minimal fallback so tests can import schemas without installing marshmallow.
    # This implements just enough behavior for `.validate()` calls used in routes/tests.
    class _Field:
        def __init__(self, *args, **kwargs):
            # capture metadata used by simple validator
            self.required = bool(kwargs.get('required', False))
            self.type = kwargs.get('type')
            self.inner = None

        def __repr__(self):
            return f"_Field(required={self.required}, type={self.type})"

    class _Fields:
        def Str(self, **kw):
            return _Field(**kw)

        def Date(self, **kw):
            return _Field(**kw)

        def Bool(self, **kw):
            return _Field(**kw)

        def List(self, inner=None, **kw):
            f = _Field(**kw)
            f.inner = inner
            return f

        def Raw(self, **kw):
            return _Field(**kw)

    class Schema:  # pragma: no cover - lightweight stub
        def validate(self, data):
            """Basic validation: ensure required fields exist in provided data.

            `data` may be a dict-like (request.files or request.json). Returns a dict
            of field->error messages or an empty dict.
            """
            errors = {}
            # normalize to dict-like
            try:
                keys = set(data.keys())
            except Exception:
                keys = set()

            for name, value in self.__class__.__dict__.items():
                if name.startswith('_'):
                    continue
                # field instances in class dict
                if isinstance(value, _Field):
                    if value.required:
                        # treat absence as error
                        if name not in keys:
                            errors[name] = ['Missing required field']
            return errors

    fields = _Fields()


class PlanSchema(Schema):
    user_id = fields.Str(required=True)
    new_deadline = fields.Date(required=False)
    preserve_progress = fields.Bool(required=False)
    excluded_topics = fields.List(fields.Str(), required=False)
    priority_adjustment = fields.Str(required=False)
    learning_pace = fields.Str(required=False)
    topics = fields.List(fields.Str(), required=False)


class UploadSchema(Schema):
    # Let the route handle the presence/absence of the file so it can raise
    # specific error codes (SYLLABUS_INVALID_FORMAT / ASSESSMENT_PARSE_FAIL).
    file = fields.Raw(type='file', required=False)
