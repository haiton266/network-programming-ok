from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import eventlet
from library.model import Users, ChatRooms, ChatMesssages
from library.extension import db
from library.library_ma import UserSchema, ChatMessageSchema
import json

from library.library_ma import ChatMessageSchema
chat_message_schema = ChatMessageSchema(many=True)
users_schema = UserSchema(many=True)
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*",
                    ping_interval=10, ping_timeout=5)

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:@localhost/network_db'
# app.config['SECRET_KEY'] = 'my-secret-key'
db.init_app(app)
with app.app_context():
    db.create_all()
    print("Created DB")

room_user_map = {}  # Lưu trữ thông tin người dùng và phòng tương ứng


@app.route("/http-call")
def http_call():
    data = {'data': 'This text was fetched using an HTTP call to server on render'}
    return jsonify(data)


@socketio.on("connect")
def connected():
    print(request.sid)
    print(f"client has connected request.sid: {request.sid}")
    emit("connect", {"data": f"id: {request.sid} is connected"})


@socketio.on('register')
def register(data):
    username = data.get('username')
    password = data.get('password')

    # Check if the username already exists in the database
    existing_user = Users.query.filter_by(username=username).first()
    if existing_user:
        emit('register_status', {'status': 'failure',
             'message': 'Username already exists'})
    else:
        # Create a new user
        new_user = Users(username=username, password=password, sid='no')

        try:
            # Add the new user to the database
            db.session.add(new_user)
            db.session.commit()
            emit('register_status', {'status': 'success',
                 'message': 'User registered successfully'})
        except Exception as e:
            # Handle any exceptions that might occur during registration
            emit('register_status', {
                 'status': 'failure', 'message': 'Registration failed', 'error': str(e)})


logged_in_users = {}  # Dictionary to track logged-in users


@socketio.on('login')
def login(data):
    username = data.get('username')
    password = data.get('password')
    user = Users.query.filter_by(username=username).first()

    if user and username == user.username and password == user.password:
        existing_sid = logged_in_users.get(username)
        if existing_sid:
            emit('login_status', {
                 'status': 'failure', 'message': 'Already logged in from another location'})
        else:
            user.sid = request.sid
            db.session.commit()
            logged_in_users[username] = request.sid
            emit('login_status', {'status': 'success',
                 'message': 'Logged in successfully!'})
    else:
        emit('login_status', {'status': 'failure',
             'message': 'Invalid credentials'})


@socketio.on('autologin')
def login(data):
    username = data.get('username')
    if username and username not in logged_in_users:
        logged_in_users[username] = request.sid
        print('auto login success')
    else:
        print('auto login fail')


def is_user_logged_in(sid, username=None):
    return sid in logged_in_users.values()


@socketio.on('create')
def create(data):
    print(data.get('username'))
    if is_user_logged_in(request.sid, data.get('username')):
        room_password = data.get('password')

        # Create a new chat room
        new_room = ChatRooms(password=room_password)

        try:
            # Add the new room to the database
            db.session.add(new_room)
            db.session.commit()
            room_id = ChatRooms.query.order_by(ChatRooms.id.desc()).first().id
            join_room(room_id)
            room_user_map[request.sid] = room_id
            emit('create_status', {'status': 'success',
                 'message': 'Room created successfully', 'room_id': room_id})

        except Exception as e:
            # Handle any exceptions that might occur during room creation
            emit('create_status', {
                 'status': 'failure', 'message': 'Room creation failed', 'error': str(e)})
    else:
        emit('create_status', {'status': 'failure',
             'message': 'Please login first'})


@socketio.on('join')
def join(data):
    if is_user_logged_in(request.sid):
        room_id = data['room']
        room_password = data.get('password')

        # Query the ChatRooms table to find the room with the given room_id
        chat_room = ChatRooms.query.filter_by(id=room_id).first()

        if chat_room and chat_room.password == room_password:
            join_room(room_id)
            room_user_map[request.sid] = room_id
            emit("joined", {"data": f"You joined room {room_id}"})

            # Fetch old messages from Users table
            messages = ChatMesssages.query.filter_by(room_id=room_id).all()
            if messages:
                # Sử dụng chat_message_schema để serialize dữ liệu
                messages = json.dumps(chat_message_schema.dump(
                    messages), ensure_ascii=False)
                print('Old message: ', messages)
                emit("old_messages", {'messages': messages})
        else:
            # Emit a message if the room does not exist or the password is incorrect
            emit("joined", {"data": "Invalid room or password"})
    else:
        emit("joined", {"data": "Please login first"})


@socketio.on('data')
def handle_message(data):
    print("data from the front end: ", str(data))
    # Get the username of the sender
    sender_sid = request.sid
    sender_username = next(
        (username for username, sid in logged_in_users.items() if sid == sender_sid), None)

    if sender_username:
        room = room_user_map.get(sender_sid)
        if room:
            emit("data", {'data': data, 'name': sender_username}, room=room)
            new_message = ChatMesssages(room, sender_username, data)
            db.session.add(new_message)
            db.session.commit()
        else:
            print("User is not in any room")
    else:
        print("Unknown user sending message")


@socketio.on('logout')
def logout():
    for username, sid in logged_in_users.items():
        if sid == request.sid:
            # Remove user from logged_in_users
            del logged_in_users[username]
            # Remove user from room_user_map and leave the room
            room = room_user_map.pop(sid, None)
            user = Users.query.filter_by(username=username).first()
            user.sid = 'no'
            db.session.commit()
            if room:
                leave_room(room)
            emit('logout_status', {'status': 'success',
                 'message': 'Logged out successfully'})
            print("User logged out")
            return
    emit('logout_status', {'status': 'failure',
                           'message': 'Not logged in'})
    print("User not logged in")


@socketio.on("disconnect")
def disconnected():
    # Lấy lý do ngắt kết nối
    disconnect_reason = request.args.get('reason', 'unknown')

    # Xử lý việc rời khỏi phòng và xóa thông tin người dùng
    room = room_user_map.pop(request.sid, None)
    if room:
        leave_room(room)
        emit("disconnect", {'user': request.sid,
             'reason': disconnect_reason}, room=room)

    # Xóa thông tin người dùng đã đăng nhập
    for username, sid in logged_in_users.items():
        if sid == request.sid:
            del logged_in_users[username]
            break

    print(f"User {request.sid} disconnected due to: {disconnect_reason}")


if __name__ == '__main__':
    socketio.run(app, debug=True, port=5001)
