import "./App.css";
import RouteApp from "./components/RouteApp";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";

function App() {
  const [socketInstance, setSocketInstance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Khởi tạo Socket.IO Client
    const socket = io("localhost:5001/", {
      transports: ["websocket"],
      cors: {
        origin: "http://localhost:3000/",
      },
      reconnection: true,           // Kích hoạt tái kết nối tự động
      reconnectionAttempts: 5,      // Số lần tái kết nối tối đa
      reconnectionDelay: 3000,      // Khoảng thời gian giữa các lần tái kết nối
    });

    setSocketInstance(socket);

    socket.on("connect", () => {
      console.log("Connected to socket");
      setLoading(false);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket");
      setLoading(true);  // Hiển thị loading khi mất kết nối
    });

    socket.on("reconnect", () => {
      console.log("Reconnected to socket");
      setLoading(false); // Tắt loading khi kết nối lại thành công
    });

    // Dọn dẹp khi component unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Tạm thời ẩn các hàm điều hướng không sử dụng
  // const navigate = useNavigate();
  // const handleRegisterClick = () => { navigate('/register'); };
  // const handleLoginClick = () => { navigate('/login'); };
  // const handleChatRoomClick = () => { navigate('/'); };

  return (
    <div className="">
      {loading ? <p>Loading...</p> : <RouteApp socket={socketInstance} />}
    </div>
  );
}

export default App;
