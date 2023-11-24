import React, { useState, useEffect, useRef } from 'react';
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
} from 'mdb-react-ui-kit';
import { Form, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';

export default function ChatRoom({ socket }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState('');
  const currentUser = localStorage.getItem('username');
  const messagesEndRef = useRef(null);

  const handleText = (e) => {
    const inputMessage = e.target.value;
    setMessage(inputMessage);
  };

  const handleSubmit = () => {
    if (!message) {
      toast.error('Please enter a message!');
      return;
    } else if (!room) {
      toast.error('Please enter a room name!');
      return;
    }
    socket.emit('data', message);
    setMessage('');
  };

  const handleJoinRoom = () => {
    if (!room) {
      toast.error('Please enter a room name!');
      return;
    }
    socket.emit('join', { room });
  };

  useEffect(() => {
    socket.on('data', (data) => {
      setMessages((prevMessages) => [...prevMessages, { user: data.name, data: data.data }]);
    });

    socket.on('joined', (data) => {
      toast.info(data.data);
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

  return (
    <>
      <MDBContainer fluid className="py-5" style={{ backgroundColor: '#eee' }}>
        <MDBRow className="d-flex justify-content-center">
          <MDBCol md="10" lg="8" xl="6">
            <MDBCard id="chat2" style={{ borderRadius: '15px' }}>
              <MDBCardHeader className="d-flex justify-content-between align-items-center p-3">
                <h5 className="mb-0">You are in room: {room}</h5>
                <Form className="d-flex align-items-center">
                  <MDBInput label='Enter chat room' id='form1' type='text' value={room}
                    onChange={(e) => setRoom(e.target.value)} />
                  <Button size="sm" onClick={handleJoinRoom}>
                    Join Room
                  </Button>
                </Form>
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
                <Button onClick={handleSubmit} className="ms-2">
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
