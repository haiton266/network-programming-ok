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


export default function Register({ socket, onRegisterSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = () => {
    console.log(username, password, 'đã vào function');
    if (!username || !password) {
      return;
    }
    socket.emit("register", { username, password });
  };

  useEffect(() => {
    const handleRegisterStatus = (data) => {
      if (data.status === "success") {
        onRegisterSuccess();
        toast.success('Đăng ký thành công, vui lòng đăng nhập lại!');
      }
      else
        toast.error('Đăng ký thất bại, vui lòng thử lại!, Lỗi: ' + data.message);
    };

    socket.on("register_status", handleRegisterStatus);

    return () => {
      socket.off("register_status", handleRegisterStatus);
    };
  }, [socket, onRegisterSuccess]);

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

                <h5 className="fw-normal my-4 pb-3" style={{ letterSpacing: '1px' }}>Đăng ký tài khoản của bạn</h5>

                <MDBInput wrapperClass='mb-4' label='Username' type='email' onChange={(e) => setUsername(e.target.value)} size="lg" />
                <MDBInput wrapperClass='mb-4' label='Mật khẩu' type='password' onChange={(e) => setPassword(e.target.value)} size="lg" />

                <MDBBtn className="mb-4 px-5" color='dark' size='lg' onClick={handleRegister}>Đăng ký</MDBBtn>
                <a className="small text-muted" href="#!">Quên mật khẩu?</a>
                <p className="mb-5 pb-lg-2" style={{ color: '#393f81' }}>Bạn đã có tài khoản? <a href="#!" style={{ color: '#393f81' }}> Hãy nhấn vào phần đăng nhập ở thanh điều hướng !</a></p>


              </MDBCardBody>
            </MDBCol>

          </MDBRow>
        </MDBCard>

      </MDBContainer>
    </>
  );
}