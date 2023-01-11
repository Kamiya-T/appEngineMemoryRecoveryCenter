(function(){
  var TGClient = function(host) {
    var self = this;
    endpoint = host ||
               (location.protocol + '//' + location.hostname +
                   (location.port ? ':' + location.port : ''));
    console.log("接続開始");
    console.log(endpoint);
    var socket = io.connect(endpoint);
    this.roomName = '';
    this.userName;
    //********************SOCKET BIND*************************/
    socket.on('connect', function(){
      console.log("接続完了、イベント発信");
      self.trigger('connect');
    });
    socket.on('roomInfo', (room) => {
      console.log("socket.on roomInfoを受信しました.");
      self.roomName = room;
      console.log(room + "がRoomNumberです.")
      console.log("roomInfoイベントを発信します.")
      self.trigger('roomInfo', room);
    });

    socket.on('newList', function(newList) {
      console.log("socket.on newList arrived");
      self.trigger('newList', newList);
    });

    socket.on('newMember', function(newMember) {
      console.log("socket.on newMember arrived");
      self.trigger('newMember', newMember);
    });

    socket.on('userClickButton', function(id) {
      console.log("他ユーザのボタン押下を検知しました.");
      self.trigger('userClickButton', id);
    });

    socket.on('arrive', function(id) {
      console.log("socket on arrive");
      self.trigger('arrive', id);
      console.log('arrive: ' + id);
    });
    
    socket.on('otherAnswer', function(answer, name, id) {
      self.trigger("otherAnswer", answer, name, id);
    });
    socket.on('escapeAnswer', function(id) {
      self.trigger("escapeAnswer", id);
    });
    socket.on('returnHelp', function(id) {
      self.trigger("returnHelp", id);
    });
    socket.on('returnSacrifice', function(id) {
      self.trigger("returnSacrifice", id);
    });
    
    this._socket = socket;
    console.log("End of TGClient function");
  };
  //********************STORY EVENT*************************/
  
  //新規部屋の作成
  TGClient.prototype.createNewRoom = async function(data){
    this.userName = data;
    console.log("TGClient.prototype.createNewRoom");
    await this._socket.emit("createNewRoom", this.userName);
  }

  TGClient.prototype.joinExistRoom = function(room, name) {
    try {
      return new Promise(resolve =>{
        this.userName = name;
        console.log("TGClient.prototype.joinExistRoom");
        this._socket.emit('joinExistRoom', room, this.userName, function(callback) {
        if (callback == false) {
          console.error('Failed to join room: ' + room);
          resolve(false);
        }else{resolve(true);}
        });
    })
    } catch (error) {}
  };

  TGClient.prototype.clickButton = function(id) {
    console.log("TGClient.clickButton");
    this._socket.emit('clickButton', id);
    // console.log('emitted click');
  };

  TGClient.prototype.sendAnswer = function(answer, name) {
    console.log("TGClient.sendAnswer");
    this._socket.emit('sendAnswer', answer, name);
    // console.log('emitted click');
  };

  TGClient.prototype.sendEscape = function(password, name) {
    console.log("TGClient.sendEscape");
    this._socket.emit('sendAnswer', password, name);
    // console.log('emitted click');
  };
  TGClient.prototype.sendSacrifice = function(num) {
    console.log("TGClient.sendEscape");
    this._socket.emit('sendSacrifice', num);
    // console.log('emitted click');
  };

  TGClient.prototype.sendHelp = function(help) {

    console.log("TGClient.sendHelp");
    switch (help) {
      case 'help':
        this._socket.emit('sendHelp', true);
        break;
      case 'nohelp':
        this._socket.emit('sendHelp', false);
        break;
    }
  };
  TGClient.prototype.arrive = function(id) {
    console.log("TGClient.arrive");
    this._socket.emit('arrive', id);
    // console.log('emitted arrive', id);
  };
  console.log("Before Mixin");
  MicroEvent.mixin(TGClient);

  window.TwineGang = new TGClient();
  console.log('WORKIN ON A TWINE GANG');
})();

function Countdown(elem, seconds) {
  var that = {};

  that.elem = elem;
  that.seconds = seconds;
  that.totalTime = seconds * 100;
  that.usedTime = 0;
  that.startTime = +new Date();
  that.timer = null;

  that.count = function() {
    that.usedTime = Math.floor((+new Date() - that.startTime) / 10);
    var tt = that.totalTime - that.usedTime;
    if (tt <= 0) {
      that.elem.innerHTML = '00:00.00';
      clearInterval(that.timer);
    } else {
      var mi = Math.floor(tt / (60 * 100));
      var ss = Math.floor((tt - mi * 60 * 100) / 100);
      var ms = tt - Math.floor(tt / 100) * 100;
      that.elem.innerHTML = that.fillZero(mi) + ":" + that.fillZero(ss) + "." + that.fillZero(ms);
    }
  };

  that.easycount = function() {
    that.usedTime = Math.floor((+new Date() - that.startTime) / 10);
    var tt = that.totalTime - that.usedTime;
    if (tt <= 0) {
      that.elem.innerHTML = '00:00';
      clearInterval(that.timer);
    } else {
      var mi = Math.floor(tt / (60 * 100));
      var ss = Math.floor((tt - mi * 60 * 100) / 100);
      that.elem.innerHTML = that.fillZero(mi) + ":" + that.fillZero(ss);
    }
  };
  that.init = function() {
    if(that.timer){
      clearInterval(that.timer);
      that.elem.innerHTML = '00:00.00';
      that.totalTime = seconds * 100;
      that.usedTime = 0;
      that.startTime = +new Date();
      that.timer = null;
    }
  };

  that.start = function() {
    if(!that.timer){
       that.timer = setInterval(that.count, 10);
    }
  };

  that.easystart = function() {
    if(!that.timer){
       that.timer = setInterval(that.easycount, 10);
    }
  };

  that.stop = function(){
    if(!that.timer){
      clearInterval(that.timer);
    }
  }
  
  that.fillZero = function(num) {
    return num < 10 ? '0' + num : num;
  };

  return that;
}