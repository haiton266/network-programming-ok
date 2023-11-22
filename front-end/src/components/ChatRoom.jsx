import React, { useState, useEffect } from "react";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardHeader,
  MDBCardBody,
  MDBCardFooter,
  MDBIcon,
  MDBBtn,
  MDBScrollspy,
  MDBInput,
  // MDBScrollbar,
} from "mdb-react-ui-kit";
import { Form, Button } from 'react-bootstrap';
import { toast } from "react-toastify";

export default function ChatRoom({ socket }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState("");

  const handleText = (e) => {
    const inputMessage = e.target.value;
    setMessage(inputMessage);
  };

  const handleSubmit = () => {
    if (!message) {
      toast.error("Vui lòng nhập tin nhắn!");
      return;
    }
    else if (!room) {
      toast.error("Vui lòng nhập tên phòng!");
      return;
    }
    socket.emit("data", message);
    setMessage("");
  };

  const handleJoinRoom = () => {
    if (!room) {
      toast.error("Vui lòng nhập tên phòng!");
      return;
    }
    socket.emit("join", { room });
  };

  // const handleLogout = () => {
  //   socket.emit("logout");
  // };

  useEffect(() => {
    socket.on("data", (data) => {
      setMessages([...messages, { 'user': data.name, 'data': data.data }]);
    });

    socket.on("joined", (data) => {
      toast.info(data.data);
      console.log(data);
    });

    return () => {
      socket.off("data");
      socket.off("joined");
    };
  }, [socket, messages]);

  return (
    <>
      {/* <input
        type="text"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        placeholder="Enter room name"
      />
      <button onClick={handleJoinRoom}>Join Room</button>
      <input type="text" value={message} onChange={handleText} />
      <button onClick={handleSubmit}>Submit</button> */}
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg.user}:{msg.data}</li>
        ))}
      </ul>
      <MDBContainer fluid className="py-5" style={{ backgroundColor: "#eee" }}>
        <MDBRow className="d-flex justify-content-center">
          <MDBCol md="10" lg="8" xl="6">
            <MDBCard id="chat2" style={{ borderRadius: "15px" }}>
              <MDBCardHeader className="d-flex justify-content-between align-items-center p-3">
                <h5 className="mb-0">Bạn đang ở phòng: {room}</h5>
                <Form className="d-flex align-items-center">
                  <MDBInput label='Nhập phòng chat' id='form1' type='text' value={room}
                    onChange={(e) => setRoom(e.target.value)} />
                  <Button size="sm" onClick={handleJoinRoom}>
                    Vào phòng
                  </Button>
                </Form>
              </MDBCardHeader>
              {/* <MDBScrollbar
                suppressScrollX
                style={{ position: "relative", height: "400px" }}
              > */}
              {/* <MDBScrollspy> */}
              <MDBCardBody>

                <div>
                  {messages.map((msg, index) => (
                    <>{msg.user !== "admin" ? (
                      <div className="d-flex flex-row justify-content-start">
                        {index === 0 || msg.user !== messages[index - 1].user ? (
                          <>
                            <div>
                              <img
                                src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3-bg.webp"
                                alt="avatar 1"
                                style={{ width: "45px", height: "100%" }}
                              />
                            </div>
                            <p className="small ms-3 mb-3 rounded-3 text-muted">{msg.user}</p>
                            <p
                              key={index}
                              className="small p-2 ms-3 mb-1 rounded-3"
                              style={{ backgroundColor: "#f5f6f7" }}
                            >
                              {msg.data}
                            </p>
                          </>
                        ) : (
                          <p
                            key={index}
                            className="small p-2 ms-3 mb-1 rounded-3"
                            style={{ backgroundColor: "#f5f6f7" }}
                          >
                            {msg.data}
                          </p>
                        )}
                      </div>
                    ) : (
                      index === 0 || msg.user !== messages[index - 1].user ? (
                        <>
                          <p className="small me-3 mb-3 rounded-3 text-muted d-flex justify-content-end">{msg.user}</p>
                          <p className="small p-2 me-3 mb-1 text-white rounded-3 bg-primary">
                            {msg.data}
                          </p>
                        </>
                      ) : (
                        <p className="small p-2 me-3 mb-1 text-white rounded-3 bg-primary">
                          {msg.data}
                        </p>
                      )
                    )}
                    </>
                  ))}
                </div>

                <div className="d-flex flex-row justify-content-end mb-4 pt-1">
                  <div>
                    <p className="small me-3 mb-3 rounded-3 text-muted d-flex justify-content-end">
                      00:06
                    </p>
                    <p className="small p-2 me-3 mb-1 text-white rounded-3 bg-primary">
                      Hiii, I'm good.
                    </p>
                  </div>
                  <img
                    src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava4-bg.webp"
                    alt="avatar 1"
                    style={{ width: "45px", height: "100%" }}
                  />
                </div>


                <div className="d-flex flex-row justify-content-start mb-4">
                  <img
                    src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3-bg.webp"
                    alt="avatar 1"
                    style={{ width: "45px", height: "100%" }}
                  />
                  <div>
                    <p
                      className="small p-2 ms-3 mb-1 rounded-3"
                      style={{ backgroundColor: "#f5f6f7" }}
                    >
                      Okay i will meet you on Sandon Square
                    </p>
                    <p className="small ms-3 mb-3 rounded-3 text-muted">
                      00:11
                    </p>
                  </div>
                </div>
              </MDBCardBody>
              {/* </MDBScrollbar> */}
              <MDBCardFooter className="text-muted d-flex justify-content-start align-items-center p-3">
                <img
                  src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava3-bg.webp"
                  alt="avatar 3"
                  style={{ width: "45px", height: "100%" }}
                />
                <input
                  type="text"
                  class="form-control form-control-lg"
                  id="exampleFormControlInput1"
                  placeholder="Nhập tin nhắn ở đây"
                  value={message} onChange={handleText}
                ></input>
                <Button onClick={handleSubmit}>
                  <MDBIcon fas icon="paper-plane" />
                </Button>
                {/* <a className="ms-3" href="#!">
                  <MDBIcon fas icon="paper-plane" />
                </a> */}
              </MDBCardFooter>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer >
    </>
  );
}