import React, { useState, useEffect } from "react";
import {
  MDBBtn,
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBCardImage,
  MDBRow,
  MDBCol,
  MDBIcon,
  MDBInput
} from 'mdb-react-ui-kit';
import { toast } from 'react-toastify';

export default function Login({ socket, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!username || !password) {
      return;
    }
    socket.emit("login", { username, password });
  };

  useEffect(() => {
    const handleLoginStatus = (data) => {
      if (data.status === "success") {
        onLoginSuccess();
        // Lưu thông tin đăng nhập vào localStorage
        localStorage.setItem("username", username);
        localStorage.setItem("isLoggedIn", "true");
        // Thực hiện các hành động khác khi đăng nhập thành công
        console.log('đã vào login success');
        toast.success('Đăng nhập thành công!');
      } else {
        toast.error('Đăng nhập thất bại, vui lòng thử lại!, Lỗi: ' + data.message);
      }
    };

    socket.on("login_status", handleLoginStatus);

    return () => {
      socket.off("login_status", handleLoginStatus);
    };
  }, [socket, onLoginSuccess, username]);


  return (
    <>
      <MDBContainer className="my-5">

        <MDBCard>
          <MDBRow className='g-0'>

            <MDBCol md='6'>
              <MDBCardImage src='../../logo2.png' alt="login form" className='rounded-start w-100' />
            </MDBCol>

            <MDBCol md='6'>
              <MDBCardBody className='d-flex flex-column'>

                <div className='d-flex flex-row mt-2'>
                  <MDBIcon fas icon="cubes fa-3x me-3" style={{ color: '#ff6219' }} />
                  <span className="h1 fw-bold mb-0">Chat App</span>
                </div>

                <h5 className="fw-normal my-4 pb-3" style={{ letterSpacing: '1px' }}>Đăng nhập tài khoản của bạn</h5>

                <MDBInput wrapperClass='mb-4' label='Username' id='formControlLg' type='email' onChange={(e) => setUsername(e.target.value)} size="lg" />
                <MDBInput wrapperClass='mb-4' label='Mật khẩu' id='formControlLg' type='password' onChange={(e) => setPassword(e.target.value)} size="lg" />

                <MDBBtn className="mb-4 px-5" color='dark' size='lg' onClick={handleLogin}>Đăng nhập</MDBBtn>
                <a className="small text-muted" href="#!">Quên mật khẩu?</a>
                <p className="mb-5 pb-lg-2" style={{ color: '#393f81' }}>Bạn chưa có tài khoản? <a href="#!" style={{ color: '#393f81' }}> Hãy nhấn vào phần đăng ký ở thanh điều hướng !</a></p>


              </MDBCardBody>
            </MDBCol>

          </MDBRow>
        </MDBCard>

      </MDBContainer>
    </>
  );
}