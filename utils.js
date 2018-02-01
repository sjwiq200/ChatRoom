var crypto = require('crypto')
  , type = require('component-type')
    , mongoose = require('mongoose');

mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://localhost/test',{
    useMongoClient:true
})

var db = mongoose.connection;
db.on('error',console.error);
db.once('open',function(){
    console.log("Connected to mognod server");
})

var roomSchema = mongoose.Schema({
    roomname : String,
    roomtime : String,
    key : String,
    online : String,
    roomUser : [{
        user: String,
        status: String
    }]
});

var Room =  mongoose.model('Room',roomSchema);


/*
 * Restrict paths
 */

exports.restrict = function(req, res, next){
  console.log("here is a restrict=>"+req.isAuthenticated());
    Room.find(function(err,result) {
        for (var i = 0; i < result.length; i++) {
            console.log("Room+find"+result[i]);
        };
    });

  //if(req.isAuthenticated()) next();

  next();
  //else res.redirect('/');

};

/*
 * 2. Generates a URI Like key for a room
 */       

/*
exports.genRoomKey = function() {
  var shasum = crypto.createHash('sha1');
  console.log(Date.now().toString());
  shasum.update(Date.now().toString());
  //console.log( "here is genRoomKey"+(shasum.digest('hex').substr(0,6)) );
    console.log("here is genRoomKey=>" + shasum);
  return shasum.digest('hex').substr(0,6);
};
*/

/*
 * 1. Room name is valid
 */

/*
exports.validRoomName = function(req, res, fn) {
  req.body.room_name = req.body.room_name.trim();
  console.log('validRoomName=>'+req.body.room_name);

    //MONGO
    var room = new Room({roomname: req.body.room_name});
    room.save(function(err,data){
        if(err){
            console.log("error");
        }
        console.log('message is inserted');
    });

     //MONGO END

  var nameLen = req.body.room_name.length;

  if(nameLen < 255 && nameLen >0) {
    fn();
  } else {
    res.redirect('back');
  }
};
*/

/*
 * Checks if room exists
 */
// exports.roomExists = function(req, res, client, fn) {
//   client.hget('balloons:rooms:keys', encodeURIComponent(req.body.room_name), function(err, roomKey) {
//     if(!err && roomKey) {
//       res.redirect( '/' + roomKey );
//     } else {
//       fn()
//     }
//   });
// };

/*
 * Creates a room
 */

/*
exports.createRoom = function(req, res, client) {
  var roomKey = exports.genRoomKey()
    , room = {
        key: roomKey,
        name: req.body.room_name,
        admin: req.user.provider + ":" + req.user.username,
        locked: 0,
        online: 0
      };

  client.hmset('rooms:' + roomKey + ':info', room, function(err, ok) {
    if(!err && ok) {
      client.hset('balloons:rooms:keys', encodeURIComponent(req.body.room_name), roomKey);
      client.sadd('balloons:public:rooms', roomKey);
      res.redirect('/' + roomKey);
    } else {
      res.send(500);
    }
  });
};

*/

/*
 * Get Room Info
 */
// exports.getRoomInfo = function(req, res, client, fn) {

exports.getRoomInfo = function(req, res, fn) {

  console.log("here is a getRoomInfo ==>"+req.params.id);
  Room.find({'key':req.params.id} , function (err,result) {
    console.log("getRoomInfo --find the roomname=>"+result);
    console.log("getRoomInfo --roomname==>"+result[0].roomname);

    var room = {
        key : result[0].key,
        name : result[0].roomname,
        online : result[0].online

    };
    fn(room);
  });

  // client.hgetall('rooms:' + req.params.id + ':info', function(err, room) {
  //   if(!err && room && Object.keys(room).length) fn(room);
  //   else res.redirect('back');
  //   fn(room);
  // });
};


exports.getPublicRoomsInfo = function(fn) {

    var rooms = [];

    //client.smembers('balloons:public:rooms', function(err, publicRooms) {
      Room.find(function(err,result) {

        for (var i = 0; i < result.length; i++) {
            console.log("getPublicRoomsInfo==>"+i+"===>"+result[i]);
            rooms.push({
                key: result[i].key,
                name: result[i].roomname,
                online: result[i].online
            });

            if(i+1 == result.length) fn(rooms);

          //client.hgetall('rooms:' + rooms.key + ':info', function(err, room) {

          //});
        };
        console.log("END getPublicRoomsInfo==>"+rooms);
  });
};


/*
exports.getPublicRoomsInfo = function(client, fn) {
//client => redis , fn =>
  client.smembers('balloons:public:rooms', function(err, publicRooms) {
    var rooms = []

      , len = publicRooms.length;
    if(!len) fn([]);


    //publicRooms.sort(exports.caseInsensitiveSort);

    console.log("publicRooms==>"+publicRooms);

    publicRooms.forEach(function(roomKey, index) {
      client.hgetall('rooms:' + roomKey + ':info', function(err, room) {
        // prevent for a room info deleted before this check
        if(!err && room && Object.keys(room).length) {
          // add room info
          rooms.push({
            key: room.key || room.name, // temp
            name: room.name,
            online: room.online || 0
          });


          // check if last room
         // if(rooms.length == len) fn(rooms);
        }
        else {
          // reduce check length
          len -= 1;
        }


      });
      console.log("END getPublicRoomsInfo");
      console.log(rooms);
    });
  });
};
*/


/*
 * Get connected users at room
 */


exports.getUsersInRoom = function(req, res, room, fn) {
    var users = [];
    console.log("here is getUsersInRooms ==>" + req.params.id);


    Room.find({'key': req.params.id}).select('roomUser').exec( function (err, result) {
        console.log("getUsersInRoom RESULT=>" + result);


            users.push({
                username: result['user'],
                status:result['status']
            });
    });
    console.log("here is a getUsersInRooms==>" + users);
    fn(users);
};


/*
exports.getUsersInRoom = function(req, res, client, room, fn) {
  client.smembers('rooms:' + req.params.id + ':online', function(err, online_users) {
    var users = [];

    online_users.forEach(function(userKey, index) {
      client.get('users:' + userKey + ':status', function(err, status) {
        var msnData = userKey.split(':')
          , username = msnData.length > 1 ? msnData[1] : msnData[0]
          // , provider = msnData.length > 1 ? msnData[0] : "twitter";

        users.push({
            username: username,
            // provider: provider,
            status: status || 'available'
        });
      });
    });

    fn(users);

  });
};
*/

/*
 * Get public rooms
 */

// exports.getPublicRooms = function(client, fn){
//   client.smembers("balloons:public:rooms", function(err, rooms) {
//     console.log("getpublicRooms =>"+rooms);
//     if (!err && rooms) fn(rooms);
//     else fn([]);
//   });
// };
/*
 * Get User status
 */

//exports.getUserStatus = function(user, client, fn){
exports.getUserStatus = function(req, fn){
  //client.get('users:' + user.provider + ":" + user.username + ':status', function(err, status) {
    //if (!err && status) fn(status);

    // if (status) fn(status);
    // else fn('available');

    Room.find({'key': req.params.id}).select('roomUser').exec( function (err, result) {
        console.log("getUserStatus RESULT=======>" + result[0].roomUser[0].status);
        fn(result[0].roomUser[0].status);
    });

  //});
};

/*
 * Enter to a room
 */

// exports.enterRoom = function(req, res, room, users, rooms, status){
exports.enterRoom = function(req, res, room, users, rooms, status){
  console.log("enterRoom : room==>"+JSON.stringify(room));

    console.log("enterRoom : rooms==>"+JSON.stringify(rooms));
    console.log("enterRoom : status==>"+JSON.stringify(status));
    console.log("enterRoom : Session = =>" +req.query.username);

  res.locals({
    room: room,
    rooms: rooms,
    user: {
      // nickname: req.user.username,
        nickname:req.query.username,
      // provider: req.user.provider,
      status: status
    }
    // ,
    // users_list: users
  });
  res.render('room');
};

/*
 * Sort Case Insensitive
 */

/*
exports.caseInsensitiveSort = function (a, b) { 
   var ret = 0;

   a = a.toLowerCase();
   b = b.toLowerCase();

   if(a > b) ret = 1;
   if(a < b) ret = -1; 

   return ret;
};
*/

/**
 * Merge object `b` into `a`.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api public
 */

exports.merge = function merge(a, b) {
  for (var key in b) {
    if (exports.has.call(b, key) && b[key]) {
      if ('object' === type(b[key])) {
        if ('undefined' === type(a[key])) a[key] = {};
        exports.merge(a[key], b[key]);
      } else {
        a[key] = b[key];
      }
    }
  }
  return a;
};

/**
 * HOP 
 */

exports.has = Object.prototype.hasOwnProperty;
