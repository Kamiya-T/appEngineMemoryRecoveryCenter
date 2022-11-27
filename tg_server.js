var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

// Room name => client count
var rooms = {};
app.use('/assets', express.static(__dirname + '/assets'));
app.use('/client', express.static(__dirname + '/client'));
//まずページを返す
app.get('/', function (req, res) {
  console.log('app.get => sendFile');
  res.sendFile(__dirname + '/index.html');
});
//接続があった
io.on('connection', (socket) => {
  console.log('イベント発生、クライアントとの接続が確立されました.');
  var roomName = 0;
  //********************SOCKET BIND*************************/

  //新規部屋作成
  socket.on('createNewRoom', (userName) =>{
    console.log('イベント発生、createRoomNameを受信しました.');
    roomName = createRoomName();
    joinRoom(socket, roomName, userName);
    socket.emit("roomInfo", roomName);
  })

  socket.on('joinExistRoom', function(room, name, callback) {
    console.log('接続要求を確認、クライアントの部屋入室を試みます.');
    callback = callback || function(){};
    // New room has to exist.
    if (!(room in rooms)) {
      console.log('接続要求中、部屋番号が存在しません.エラーです.');
      callback(false);
      return;
    }
    switchRooms(socket, roomName, room, name);
    roomName = room;
    socket.emit("roomInfo", roomName);
    callback(true);
  });

  socket.on('click', function(id) {
    console.log('on click -> broadcast click');
    socket.broadcast.to(roomName).emit('click', id);
  });

  // Sometimes passage arrivals might be driven by code.
  // Broadcast server passage arrivals to keep clients in line.
  socket.on('arrive', function(id) {
    console.log('arrive -> broadcast arrive');
    if (socket.isServer) {
      socket.broadcast.to(roomName).emit('arrive', id);
    }
  });



  socket.on('disconnect', function() {
    console.log('disconnect');
    if(roomName != 0){
      leaveRoom(socket, roomName);
    }else{
      console.log("切断しましたが、部屋は移動しません.");
    }
  });
  //********************BIND END*************************/
});



// Build a room number like '867-5309'
function createRoomName() {
  console.log('createRoomNameを実行しました.');
  return Math.floor(Math.random() * 9999);
}

function switchRooms(socket, oldRoom, newRoom, userName) {
  console.log('部屋を移動します.');
  if (!(oldRoom in rooms)) {
    console.log('元々の部屋は存在しませんでした、');
    joinRoom(socket, newRoom, userName);
  }else{
    leaveRoom(socket, oldRoom);
    joinRoom(socket, newRoom, userName);
  }
}

function leaveRoom(socket, roomName, userName) {
  console.log('部屋を離脱します.');
  socket.leave(roomName);
  let index = rooms[roomName].indexOf(userName)
  rooms[roomName].splice(index, 1)
  if (rooms[roomName].length > 0) {
    io.in(roomName).emit('newList', rooms[roomName]);
  } else {
    delete rooms[roomName];
  }
}

function joinRoom(socket, roomName, userName) {
  console.log('JoinRoomを実行しました.');
  if (roomName in rooms && rooms[roomName].length > 0) {
    console.log('ClientとしてJoinしました.');
    // Join as client
    socket.join(roomName);
    socket.emit('newList', rooms[roomName]);
    rooms[roomName].push(userName);
    socket.isServer = false;
    console.log('自分の名前をルーム内に送信します');
    io.in(roomName).emit('newMember', userName);
  } else {
    console.log('ServerとしてJoinしました.');
    // Join as server
    socket.join(roomName);
    rooms[roomName] = [userName];
    socket.emit('newList', rooms[roomName]);
    socket.isServer = true;
  }
}

var port = process.env.PORT || 8080;
console.log('Start Listening');
server.listen(port);

console.log('Listening on port ' + port);
