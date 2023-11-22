from library.extension import ma


class UserSchema(ma.Schema):
    class Meta:
        fields = ('id', 'username', 'password')
