from library.extension import ma


class UserSchema(ma.Schema):
    class Meta:
        fields = ('id', 'username', 'password', 'sid')


class ChatRoomSchema(ma.Schema):
    class Meta:
        fields = ('id', 'password')


class ChatMessageSchema(ma.Schema):
    class Meta:
        fields = ('id', 'room_id', 'username', 'message')


class MemberSchema(ma.Schema):
    class Meta:
        fields = ('id', 'room_id', 'username')
