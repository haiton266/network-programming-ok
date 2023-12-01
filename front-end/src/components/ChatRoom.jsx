import React, { useState, useEffect, useRef } from 'react';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardHeader,
  MDBCardBody,
  MDBCardFooter,
  MDBIcon,
  MDBInput,
  MDBListGroup,
  MDBListGroupItem
} from 'mdb-react-ui-kit';
import { Form, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';


export default function ChatRoom({ socket }) {
  const [lastActive, setLastActive] = useState(Date.now());
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState('');
  const [password, setPassword] = useState('');
  const [rooms, setRooms] = useState([
    { id: 1, name: "Room 1" },
    { id: 2, name: "Room 2" },
    { id: 3, name: "Room 3" },
    // thêm các phòng khác tùy ý
  ]);
  // const [isInRoom, setIsInRoom] = useState(false);
  const currentUser = localStorage.getItem('username');
  const messagesEndRef = useRef(null);



  const secretKey = 'your-secret-key'; // Đặt khóa bí mật của bạn

  function encryptMessage(message) {
    return AES.encrypt(message, secretKey).toString();
  }
  
  function decryptMessage(encryptedMessage) {
    const bytes = AES.decrypt(encryptedMessage, secretKey);
    return bytes.toString(Utf8);
  }   


  const handleText = (e) => {
    const inputMessage = e.target.value;
    setMessage(inputMessage);
  };

  const handleMessageSubmit = () => {
    if (!message) {
      toast.error('Please enter a message!');
      return;
    } else if (!room) {
      toast.error('Please enter a room name!');
      return;
    }
  
    const encryptedMessage = encryptMessage(message);
    socket.emit('data', encryptedMessage);
    setMessage('');
  };

  const handleJoinRoom = () => {
    if (!room || !password) {
      toast.error('Please enter a room name and password!');
      return;
    }
    socket.emit('join', { 'room': room, 'password': password });
  };

  const handleCreateRoom = () => {
    if (!password) {
      toast.error('Please enter password!');
      return;
    }
    setMessages([]);
    socket.emit('create', { 'password': password, 'username': currentUser });
  };

  const updateActivity = () => {
    setLastActive(Date.now());
  };


  useEffect(() => {
    socket.emit('autologin', { 'username': currentUser });
    socket.on('get_rooms', (data) => {
      let x = JSON.parse(data.rooms);
      console.log('x', x);
      const rooms_get = x.map(room => ({
        id: room.id,
        name: 'Room ' + room.room_id
      }));
      console.log('rooms', rooms_get);
      setRooms(rooms_get);
    }
    );
    socket.on('old_messages', (data) => {
      let x = JSON.parse(data.messages);
      // Transform x into the desired format for messages
      const newMessages = x.map(msg => {
        let decryptedMessage;
        try {
          decryptedMessage = decryptMessage(msg.message);
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          decryptedMessage = msg.message; // Use the original message if decryption fails
        }
        return {
          user: msg.username,
          data: decryptedMessage
        };
      });
      console.log('newMessages', newMessages);
      setMessages(newMessages);
    });

    socket.on('data', (data) => {
 
      try {
        const decryptedMessage = decryptMessage(data.data);
        setMessages((prevMessages) => [...prevMessages, { user: data.name, data: decryptedMessage }]);
      } catch (error) {
        console.error('Failed to decrypt message:', error);
      }
    });

    socket.on('joined', (data) => {
      toast.info(data.data);
    });

    socket.on('create_status', (data) => {
      toast.info(data.message);
      if (data.message === 'Room created successfully') {
        setRoom(data.room_id);
      }
    });

    return () => {
      socket.off('data');
      socket.off('joined');
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll to bottom whenever the messages array changes

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const checkActivity = () => {
      const now = Date.now();
      const inactiveDuration = now - lastActive;
      // Giả sử timeout là 5 phút (300000 milliseconds)
      if (inactiveDuration > 2000000) {
        // Gửi thông tin không hoạt động tới server
        socket.emit('inactive_user', { username: currentUser });
      }
    };
        // Thiết lập interval kiểm tra mỗi phút
        const intervalId = setInterval(checkActivity, 200000);

        return () => {
          clearInterval(intervalId);
        };
      }, [lastActive, socket]);
    
      // Thêm event listeners để cập nhật hoạt động
      useEffect(() => {
        window.addEventListener('mousemove', updateActivity);
        window.addEventListener('keydown', updateActivity);
    
        return () => {
          window.removeEventListener('mousemove', updateActivity);
          window.removeEventListener('keydown', updateActivity);
        };
      }, []);
  return (
    <>
      <MDBContainer fluid className="py-5" style={{ backgroundColor: '#eee' }}>
        <MDBRow className="d-flex justify-content-center">
          <MDBCol md="1" style={{ paddingRight: 0, marginRight: 0 }}>
            <MDBListGroup>
              {rooms.map((room) => (
                <MDBListGroupItem
                  key={room.id}
                  onClick={() => toast.info(`You are in room: ${room.name}`)}
                >
                  {room.name}
                </MDBListGroupItem>
              ))}
            </MDBListGroup>
          </MDBCol>
          <MDBCol md="5" lg="2" xl="5" style={{ paddingLeft: 0, marginLeft: 0 }}>
            <MDBCard id="chat2" style={{ borderRadius: '15px' }}>
              <MDBCardHeader className="d-flex justify-content-between align-items-center p-3">
                <h5 className="mb-0">You are in room: {room}</h5>
                <div>
                  <Form className="d-flex align-items-center">
                    <MDBInput label='Enter chat room' id='form1' type='text' value={room}
                      onChange={(e) => setRoom(e.target.value)} />
                    <MDBInput label='Enter password' id='form1' type='password'
                      onChange={(e) => setPassword(e.target.value)} />
                    <Button size="sm" onClick={handleJoinRoom}>
                      Join Room
                    </Button>
                    <Button size="sm" onClick={handleCreateRoom}>
                      Create Room
                    </Button>
                  </Form>
                  <h5 style={{ fontSize: 'small', fontStyle: 'italic', color: '#ffcc00' }}>
                    If you create room, you only enter password!
                  </h5>
                </div>
              </MDBCardHeader>
              <MDBCardBody style={{ overflowY: 'auto', maxHeight: '400px' }}>
                {messages.map((msg, index) => (
                  msg.user === currentUser ? (
                    <div className="d-flex flex-row justify-content-end mb-4 pt-1">
                      <div>
                        <p className="small me-3 mb-3 rounded-3 text-muted d-flex justify-content-end">
                          {msg.user}
                        </p>
                        <p className="small p-2 me-3 mb-1 text-white rounded-3 bg-primary">
                          {msg.data}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-start">
                      <div>
                        <p className="small ms-3 mb-3 rounded-3 text-muted">
                          {msg.user}
                        </p>
                        <p
                          className="small p-2 ms-3 mb-1 rounded-3"
                          style={{ backgroundColor: "#f5f6f7" }}
                        >
                          {msg.data}
                        </p>
                      </div>
                    </div>
                  )
                ))}
                <div ref={messagesEndRef} />
              </MDBCardBody>
              <MDBCardFooter className="text-muted d-flex justify-content-start align-items-center p-3">
                <MDBInput type="text" className="form-control form-control-lg" placeholder="Type your message here" value={message} onChange={handleText} />
                <Button onClick={handleMessageSubmit} className="ms-2">
  <MDBIcon fas icon="paper-plane" />
</Button>
              </MDBCardFooter>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </>
  );
}
