from library.extension import db


class Users(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(100), nullable=False)
    sid = db.Column(db.String(100), nullable=True)

    def __init__(self, username, password, sid):
        self.username = username
        self.password = password
        self.sid = sid


class ChatRooms(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    password = db.Column(db.String(100), nullable=False)

    def __init__(self, password):
        self.password = password


class ChatMesssages(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    room_id = db.Column(db.Integer, nullable=False)

    def __init__(self, room_id, username, message):
        self.room_id = room_id
        self.username = username
        self.message = message


class Members(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False)
    room_id = db.Column(db.Integer, nullable=False)

    def __init__(self, room_id, username):
        self.room_id = room_id
        self.username = username
