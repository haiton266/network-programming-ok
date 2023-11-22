import "./App.css";
import HttpCall from "./components/HttpCall";
import RouteApp from "./components/RouteApp";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';

function App() {
  const [socketInstance, setSocketInstance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = io("localhost:5001/", {
      transports: ["websocket"],
      cors: {
        origin: "http://localhost:3000/",
      },
    });

    setSocketInstance(socket);

    socket.on("connect", () => {
      console.log("Connected to socket");
      socket.emit("get_time");
      setLoading(false);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket");
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);
  // const navigate = useNavigate();

  // const handleRegisterClick = () => {
  //   navigate('/register');
  // };

  // const handleLoginClick = () => {
  //   navigate('/login');
  // };

  // const handleChatRoomClick = () => {
  //   navigate('/');
  // };
  return (
    <div className="">
      {!loading && <RouteApp socket={socketInstance} />}
    </div>
  );
}

export default App;
