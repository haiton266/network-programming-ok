import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import ChatRoom from './ChatRoom';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
function AppRoutes({ socket }) {
  const navigate = useNavigate();

  const handleRegisterSuccess = () => {
    navigate('/login'); // Navigate to the '/login' route
  };

  const handleLoginSuccess = () => {
    navigate('/'); // Navigate to the '/chatroom' route
  };

  const handleLogout = () => {
    socket.emit("logout");
    // Xóa thông tin đăng nhập khỏi localStorage
    localStorage.removeItem("username");
    localStorage.removeItem("isLoggedIn");
    navigate('/login'); // Navigate to the '/login' route
    toast.success("Đăng xuất thành công!");
  };

  return (
    <>
      <Navbar bg="light" data-bs-theme="light">
        <Container>
          <Navbar.Brand href="/">
            <img
              src='../../logo2.png'
              width="30"
              height="30"
              className="d-inline-block align-top"
              alt="React Bootstrap logo"
            />
            <span>Chat App</span>
          </Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="/">ChatRoom</Nav.Link>
            <Nav.Link href="/register">Register</Nav.Link>
            <Nav.Link href="/login">Login</Nav.Link>
            <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      <Routes>
        <Route path="/register" element={<Register socket={socket} onRegisterSuccess={handleRegisterSuccess} />} />
        <Route path="/login" element={<Login socket={socket} onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/" element={<ChatRoom socket={socket} />} />
      </Routes>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default function App({ socket }) {
  return (
    <Router>
      <AppRoutes socket={socket} />
    </Router>
  );
}
