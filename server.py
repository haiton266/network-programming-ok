import MySQLdb
from flask import Flask, request, jsonify, session
from flask_socketio import SocketIO, disconnect, emit, join_room, leave_room
from flask_cors import CORS
import eventlet
from library.model import Users, ChatRooms, ChatMesssages, Members
from library.extension import db
from library.library_ma import UserSchema, ChatMessageSchema, ChatRoomSchema, MemberSchema
import json
import bcrypt
import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from library.library_ma import ChatMessageSchema
chat_message_schema = ChatMessageSchema(many=True)
users_schema = UserSchema(many=True)
rooms_schema = ChatRoomSchema(many=True)
members_schema = MemberSchema(many=True)


app = Flask(__name__)



app.config['SECRET_KEY'] = 'secret!'
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*",
                    ping_interval=10, ping_timeout=5, async_mode='eventlet')






app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:@localhost/network_db'
# app.config['SECRET_KEY'] = 'my-secret-key'
db.init_app(app)
with app.app_context():
    db.create_all()
    print("Created DB")

room_user_map = {}  # Lưu trữ thông tin người dùng và phòng tương ứng

eventlet.monkey_patch()
@app.route("/http-call")
async def http_call():
    # Simulating an asynchronous operation
    await asyncio.sleep(1)  # Wait for 1 second
    data = {'data': 'Async data fetched'}
    return jsonify(data)



async_engine = create_async_engine('mysql+aiomysql://root:@localhost/network_db')
AsyncSessionLocal = sessionmaker(bind=async_engine, class_=AsyncSession)

@app.route('/some-data')
async def get_data():
    some_query = text("SELECT * FROM my_table")  # Replace with your actual query
    async with AsyncSessionLocal() as session:
        result = await session.execute(some_query)
        data = result.scalars().all()
        return jsonify(data)







@socketio.on('some_event')
async def handle_some_event(data):
    await asyncio.sleep(1)  # Wait for 1 second
    emit('response', {'data': 'Processed asynchronously'})



def some_long_running_task():
    # Time-consuming task
    pass

@socketio.on('start_task')
def start_task(data):
    socketio.start_background_task(some_long_running_task)
    emit('task_started', {'data': 'Task started'})



@socketio.on("connect")
def connected():
    print(request.sid)
    print(f"client has connected request.sid: {request.sid}")
    emit("connect", {"data": f"id: {request.sid} is connected"})



@socketio.on('inactive_user')
def handle_inactive_user(data):
    username = data.get('username')
    sid = logged_in_users.get(username)

    # Kiểm tra xem người dùng có đang đăng nhập không
    if sid and sid == request.sid:
        # Tạo thông báo hoặc thực hiện hành động khác
        emit('force_logout', {'message': 'You have been inactive. Please login again.'}, room=sid)

        # Xóa thông tin người dùng từ danh sách đăng nhập
        del logged_in_users[username]
        
        # Xóa SID từ room_user_map và yêu cầu rời phòng (nếu cần)
        room = room_user_map.pop(sid, None)
        if room:
            leave_room(room)
        socketio.emit('inactive_user', room=sid)
        disconnect()
        
        print(f"User {username} has been marked as inactive and logged out.")



@socketio.on('register')
def register(data):
    username = data.get('username')
    password = data.get('password').encode('utf-8')

    # Check if the user already exists
    existing_user = Users.query.filter_by(username=username).first()
    if existing_user:
        emit('register_status', {'status': 'failure', 'message': 'Username already exists'})
        return

    # Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password, salt)

    # Create a new user instance
    new_user = Users(username=username, password=hashed_password, sid='no')
    
    try:
        # Add the new user to the database
        db.session.add(new_user)
        db.session.commit()
        emit('register_status', {'status': 'success', 'message': 'User registered successfully'})
    except Exception as e:
        # Handle any exceptions that might occur during registration
        emit('register_status', {'status': 'failure', 'message': 'Registration failed', 'error': str(e)})


logged_in_users = {}  # Dictionary to track logged-in users


@socketio.on('login')
def login(data):
    username = data.get('username')
    password = data.get('password').encode('utf-8')

    user = Users.query.filter_by(username=username).first()

    if user and bcrypt.checkpw(password, user.password.encode('utf-8')):
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
        emit('login_status', {'status': 'failure', 'message': 'Invalid credentials'})


@socketio.on('autologin')
def login(data):
    username = data.get('username')
    if username and username not in logged_in_users:
        logged_in_users[username] = request.sid
        print('username: ', username)
        room_of_user = Members.query.filter_by(username=username).all()
        room_of_user = json.dumps(members_schema.dump(
            room_of_user), ensure_ascii=False)
        emit('get_rooms', {'rooms': room_of_user})
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
            username = next(
                (username for username, sid in logged_in_users.items() if sid == request.sid), None)
            member = Members(room_id, username)
            db.session.add(member)
            db.session.commit()

            room_of_user = Members.query.filter_by(username=username).all()
            room_of_user = json.dumps(members_schema.dump(
                room_of_user), ensure_ascii=False)
            emit('get_rooms', {'rooms': room_of_user})

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
            username = next(
                (username for username, sid in logged_in_users.items() if sid == request.sid), None)
            member = Members(room_id, username)
            if Members.query.filter_by(room_id=room_id, username=username).first() is None:
                db.session.add(member)
                db.session.commit()

            room_of_user = Members.query.filter_by(username=username).all()
            room_of_user = json.dumps(members_schema.dump(
                room_of_user), ensure_ascii=False)
            emit('get_rooms', {'rooms': room_of_user})

            # Fetch old messages from Users table
            messages = ChatMesssages.query.filter_by(room_id=room_id).all()
            if messages:
                # Sử dụng chat_message_schema để serialize dữ liệu
                messages = json.dumps(chat_message_schema.dump(
                    messages), ensure_ascii=False)
                print('Old message: ', messages)
                emit("old_messages", {'messages': messages})
            else:
                emit("old_messages", {'messages': '[]'})
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
            # Clear the session when logging out
            session.pop('username', None)
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
