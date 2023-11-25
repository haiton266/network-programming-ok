# Chat Application

This chat application is built using ReactJS, Flask Python, and Socket.IO. It provides a real-time communication platform where users can join and create chat rooms. The application ensures user authentication and data persistence while offering a seamless chat experience.

## Features

- **User Authentication**: Register, Login, and Logout functionalities.
- **Auto-login**: Automatic reconnection and session restoration if disconnected.
- **Single Active Session**: Restricts users to one active session at a time to enhance security.
- **Message History**: Loads old messages upon joining a room, allowing users to catch up on the conversation.
- **Efficient Messaging**: When a user sends a chat message, only the new message is sent to other clients, avoiding redundant data transmission.
- **Room Access Control**: Users can join rooms with valid credentials and participate in secure conversations.
- **Room Creation**: Users have the ability to create new chat rooms.
- **Multi-client Support**: The server can handle connections from multiple clients simultaneously.

## Tech Stack

**Client:** ReactJS,socket.io,socket.io-client

**Server:** Python,eventlet,Flask-Cors,Flask-SocketIO

## Installation

Make sure you have installed Node.js, npm, Python, and pip.
After installation please follow the instructions below to download the repo.

- Within the terminal window, create a folder in your local drive.
- Navigate to the folder created.
- Run the following command:

```bash
  git clone ...
```

- Navigate into the new sub-folder created called **WebSocket-App**.
- Run the following commands to create an environment and install the dependencies:

```bash
  virtualenv myenv
  source myenv/bin/activate
  pip install -r requirements.txt
```

- Navigate into the /**front-end** folder and run the following command:
- Should open new terminal 

```bash
  npm i
```

## Run Locally

Open two terminal windows, one to be used by the Flask server and the other
to be used by the React client.
Make sure the server is initialized before the client to avoid any issues.

Terminal **window 1** - start the server:

```bash
  source env/bin/activate
  python server.py
```

Terminal **window 2** - start the client:

```bash
  cd front-end
  npm start
```
