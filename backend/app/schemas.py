from marshmallow import Schema, fields, validate

class PlanSchema(Schema):
    user_id = fields.Str(required=True)
    new_deadline = fields.Date(required=False)
    preserve_progress = fields.Bool(required=False)
    excluded_topics = fields.List(fields.Str(), required=False)
    priority_adjustment = fields.Str(required=False)
    learning_pace = fields.Str(required=False)
    topics = fields.List(fields.Str(), required=False)

class UploadSchema(Schema):
    file = fields.Raw(type='file', required=True)
