
/*
 * Module dependencies
 */



var sio = require('socket.io')
  , parseCookies = require('connect').utils.parseSignedCookies
  , cookie = require('cookie')
  , fs = require('fs')


/**
 * MONGO DB
 * */

  ,mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test',{
  useMongoClient:true
})


var db = mongoose.connection;
db.on('error',console.error);
db.once('open',function(){
    console.log("Connected to mognod server");
});



var chatSchema = mongoose.Schema({
    username : 'string',
    message : 'string',
    time : 'string'
});


var Chat = mongoose.model('Chat',chatSchema);

/**
 * Expose Sockets initialization
 */

module.exports = Sockets;

/**
 * Socket.io
 *
 * @param {Express} app `Express` instance.
 * @param {HTTPServer} server `http` server instance.
 * @api public
 */

function Sockets (app, server) {
  var config = app.get('config');
  var client = app.get('redisClient');
  var sessionStore = app.get('sessionStore');

  var io = sio.listen(server);
  io.set('authorization', function (hsData, accept) {
    console.log(hsData);
    if(hsData.headers.cookie) {
      var cookies = parseCookies(cookie.parse(hsData.headers.cookie), config.session.secret)
        // , sid = cookies['balloons'];
          ,sid = cookies['JSESSIONID'];

      console.log("hsData.headers.cookie==>"+hsData.headers.cookie);
      console.log("config.session.secret==>"+config.session.secret);
      console.log("sid==>" +sid);


        console.log("aaaaaaaaa"+/\/(?:([^\/]+?))\/?$/g.exec(hsData.headers.referer)[1]);


      // sessionStore.load(sid, function(err, session) {
        sessionStore.get(sid,function (err, session) {
          console.log("here is a sessionStore.get");

        // if(err || !session) {
        //   return accept('Error retrieving session!', false);
        // }

        // hsData.balloons = {
        //   user: session.passport.user,
        //   room: /\/(?:([^\/]+?))\/?$/g.exec(hsData.headers.referer)[1]
        // };

          console.log("here is a exec==>"+(/\/(?:([^\/]+?))\/?$/g.exec(hsData.headers.referer)[1]).split('?')[1].split('username=')[1]);
          hsData.JSESSIONID = {
              user: (/\/(?:([^\/]+?))\/?$/g.exec(hsData.headers.referer)[1]).split('?')[1].split('username=')[1],
              room: (/\/(?:([^\/]+?))\/?$/g.exec(hsData.headers.referer)[1]).split('?')[0]
          };

          // console.log("hsData.balloons==>"+hsData.balloons);
          console.log("hsData.JSESSIONID==>"+hsData.JSESSIONID);

        return accept(null, true);

      });
    } else {
      return accept('No cookie transmitted.', false);
    }
  });

  // io.configure(function() {
  //   console.log("io.configure")
  //   io.set('store', new sio.RedisStore({
  //     redisClient: client,
  //     redisPub: client,
  //     redisSub: client
  //   }));
  //   io.enable('browser client minification');
  //   io.enable('browser client gzip');
  // });


  io.sockets.on('connection', function (socket) {
    console.log("here is a connection");
    console.log("socket==>>>>"+socket.handshake);
    var hs = socket.handshake
      // , nickname = hs.balloons.user.username
        , nickname = hs.JSESSIONID.user
      // , provider = hs.balloons.user.provider
      // , userKey = provider + ":" + nickname
      // , room_id = hs.balloons.room
        , room_id = hs.JSESSIONID.room
      , now = new Date()
      // Chat Log handler
      // , chatlogFileName = './chats/' + room_id + (now.getFullYear()) + (now.getMonth() + 1) + (now.getDate()) + ".txt"
      // , chatlogWriteStream = fs.createWriteStream(chatlogFileName, {'flags': 'a'});
      console.log("hs==>>>"+hs.toString());
    console.log("here is a socket connection=>"+room_id);
    console.log("here is a socket connection nickname=>"+nickname);


    socket.join(room_id);

    /*

      Chat.find(function(err,result) {
          for (var i = 0; i < result.length; i++) {
              var dbData = {name: result[i].username, message: result[i].message};

              socket.emit('preload', dbData);
          }
      });
      */


    // client.sadd('sockets:for:' + userKey + ':at:' + room_id, socket.id, function(err, socketAdded) {
    //   if(socketAdded) {
    //     client.sadd('socketio:sockets', socket.id);
    //     client.sadd('rooms:' + room_id + ':online', userKey, function(err, userAdded) {
    //       if(userAdded) {
    //         client.hincrby('rooms:' + room_id + ':info', 'online', 1);
    //         client.get('users:' + userKey + ':status', function(err, status) {
              console.log("here is a io.sockets.in(room_id).emit new user ==>");
              io.sockets.in(room_id).emit('new user', {
                nickname: nickname,
                // provider: provider,
                // status: status || 'available'
                  status: 'available'
              });
            // });
          // }
        // });
      // }
    // });

    socket.on('my msg', function(data) {
      var no_empty = data.msg.replace("\n","");
      if(no_empty.length > 0) {
        // var chatlogRegistry = {
        //   type: 'message',
        //   // from: userKey,
        //   atTime: new Date(),
        //   withData: data.msg
        // }

        // chatlogWriteStream.write(JSON.stringify(chatlogRegistry) + "\n");
          console.log("here is a io.sockets.in(room_id).emit my message ==>");
          console.log(data);

        io.sockets.in(room_id).emit('new msg', {
          nickname: nickname,
          // provider: provider,
          msg: data.msg
        });
              /**
           * MONGO*/
          var chat = new Chat({username : nickname, message : data.msg, time : new Date()});
          chat.save(function(err,data){
              if(err){
                  console.log("error");
              }
              console.log('message is inserted');
          });
          /**
           * MONGO END
           */
      }   
    });


      /**
       * image EVENT
       */
      socket.on('my imgMsg',function(data){
          fs.readFile('uploads/'+data.imgMsg,function(err,buf){
              io.sockets.in(room_id).emit('new imgMsg',{
                  nickname: nickname,
                  msg: {
                      image: true,
                      buffer: buf.toString('base64')
                  }
              });
          })
      });

      socket.on('my message image', function(data){
          io.sockets.in(room_id).emit('new message image',data);
      });

    socket.on('set status', function(data) {
      var status = data.status;

      // client.set('users:' + userKey + ':status', status, function(err, statusSet) {
        io.sockets.emit('user-info update', {
          username: nickname,
          // provider: provider,
          status: status
        });
      // });
    });

    // socket.on('history request', function() {

      socket.on('history request', function() {
          var history = [];
          Chat.find(function(err,result) {
              for (var i = 0; i < result.length; i++) {
                  var dbData = {name: result[i].username, message: result[i].message};
                  history.push(dbData);
                  console.log("find dbData==>"+dbData);

              }
            socket.emit('history response', {
                history: history
            });
          });
      });

    //   var history = [];
    //   var tail = require('child_process').spawn('tail', ['-n', 5, chatlogFileName]);
    //   tail.stdout.on('data', function (data) {
    //     var lines = data.toString('utf-8').split("\n");
    //
    //     lines.forEach(function(line, index) {
    //       if(line.length) {
    //         var historyLine = JSON.parse(line);
    //         history.push(historyLine);
    //       }
    //     });
    //
    //     socket.emit('history response', {
    //       history: history
    //     });
    //   });
    // });




    socket.on('disconnect', function() {
      // 'sockets:at:' + room_id + ':for:' + userKey
      client.srem('sockets:for:' + userKey + ':at:' + room_id, socket.id, function(err, removed) {
        if(removed) {
          client.srem('socketio:sockets', socket.id);
          client.scard('sockets:for:' + userKey + ':at:' + room_id, function(err, members_no) {
            if(!members_no) {
              client.srem('rooms:' + room_id + ':online', userKey, function(err, removed) {
                if (removed) {
                  client.hincrby('rooms:' + room_id + ':info', 'online', -1);
                  // chatlogWriteStream.destroySoon();
                  io.sockets.in(room_id).emit('user leave', {
                    nickname: nickname,
                    // provider: provider
                  });
                }
              });
            }
          });
        }
      });
    });
  });

};