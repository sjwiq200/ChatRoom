
/*
 * Module dependencies
 */

// var passport = require('passport')
var http = require('http');
http.globalAgent.maxSockets = 100;			// limiting socket connections to 100
var utils = require('../utils')
    , formidable = require('formidable');
var files_array  = [];
var expiryTime = 8;


/** express에 multer모듈 적용 (for 파일업로드)
 *
 * @type {multer}
 */
// var multer = require('multer');
//
// var storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/')
//     },
//     filename: function (req, file, cb) {
//         // cb(null, file.originalname + '-' + Date.now())
//         cb(null, file.originalname)
//     }
// });
//
// var upload = multer({ storage: storage });

/**
 * Expose routes
 */

module.exports = Routes;

/**
 * Defines routes for application
 *
 * @param {Express} app `Express` instance.
 * @api public
 */

function Routes (app) {
  var config = app.get('config');
  // var client = app.get('redisClient');
  
  /*
   * Homepage
   */


  app.get('/', function(req, res, next) {
    //if(req.isAuthenticated()){
      if(true){
      //console.log("provider=>" + req.user.provider + "username=>" + req.user.username);
      /*
      client.hmset(
          'users:' + req.user.provider + ":" + req.user.username
        , req.user
      );
      */
      // res.redirect('/rooms');
          res.redirect('http://localhost:8080');
    } else{
      res.render('index');
    }
  });



  /*
   * Authentication routes
   */

  // if(config.auth.twitter.consumerkey.length) {
  //   app.get('/auth/twitter', passport.authenticate('twitter'));
  //
  //   app.get('/auth/twitter/callback',
  //     passport.authenticate('twitter', {
  //       successRedirect: '/',
  //       failureRedirect: '/'
  //     })
  //   );
  // }
/*
  if(config.auth.facebook.clientid.length) {
    app.get('/auth/facebook', passport.authenticate('facebook'));

    app.get('/auth/facebook/callback', 
      passport.authenticate('facebook', {
        successRedirect: '/',
        failureRedirect: '/'
      })
    );
  }
  */

  // if(config.auth.github.clientid.length) {
  //   app.get('/auth/github', passport.authenticate('github'));
  //
  //   app.get('/auth/github/callback',
  //     passport.authenticate('github', {
  //       successRedirect: '/',
  //       failureRedirect: '/'
  //     })
  //   );
  // }

  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  /*
   * Rooms list
   */

  //app.get('/rooms', utils.restrict, function(req, res) {
    app.get('/rooms',function(req,res) {
    console.log("URL /rooms!!!");

/*
      utils.getPublicRoomsInfo(client, function(rooms) {
      console.log("here is a rooms");
      console.log(rooms);
      res.render('room_list', { rooms: rooms });
    });
*/



    utils.getPublicRoomsInfo(function(rooms){
      console.log("here is getPublicRoomsInfo==>"+rooms);
      res.render('room_list', {rooms: rooms});
    });

  });

  /*
   * Create a rooom
   */

  // app.post('/create', utils.restrict, function(req, res) {
  //   utils.validRoomName(req, res, function(roomKey) {
  //     utils.roomExists(req, res, client, function() {
  //       utils.createRoom(req, res, client);
  //     });
  //   });
  // });

  /*
   * Join a room
   */

  //app.get('/:id', utils.restrict, function(req, res) {
    app.get('/:id',  function(req, res) {
    console.log("URL /:id==>"+req.params.id);
    console.log("queryString==>"+req.query.username);
    //utils.getRoomInfo(req, res, client, function(room) {
      //utils.getUsersInRoom(req, res, client, room, function(users) {
        //utils.getPublicRoomsInfo(client, function(rooms) {
          //utils.getUserStatus(req.user, client, function(status) {
            // utils.enterRoom(req, res, room, users, rooms, status);
    utils.getRoomInfo(req, res, function(room) {
        utils.getUsersInRoom(req, res, room, function(users) {
            utils.getPublicRoomsInfo(function(rooms) {
                utils.getUserStatus(req, function(status) {
                    utils.enterRoom(req, res, room, users, rooms, status);
          });
        });
      });
    });
  });

    /**
     * multer 삽질 실패..
     */
    // app.post('/:id', upload.single('userfile'), function(req, res){
    //     console.log("FILE ==> "+req.file); // 콘솔(터미널)을 통해서 req.file Object 내용 확인 가능.
    //
    // });

    app.post('/:id',function (req, res){
        console.log("here is a app.post(/:id)");
        var imgdatetimenow = Date.now();
        var form = new formidable.IncomingForm({
            uploadDir: __dirname + '/../uploads',
            keepExtensions: true
        });

        form.on('end', function() {
            res.end();
        });

        form.parse(req,function(err,fields,files){
            console.log(req.toString());

            console.log("form.parse ==> "+JSON.stringify(fields));

            var data = {
                // username : fields.username,
                username : req.query.username,
                userAvatar : fields.userAvatar,
                repeatMsg : true,
                // hasFile : fields.hasFile,
                hasFile : true,
                // isImageFile : fields.isImageFile,
                isImageFile : true,
                // istype : fields.istype,
                istype : 'image',
                showme : fields.showme,
                dwimgsrc : fields.dwimgsrc,
                dwid : fields.dwid,
                serverfilename : baseName(files.file.path),
                msgTime : fields.msgTime,
                filename : files.file.name,
                size : bytesToSize(files.file.size)
            };
            var image_file = {
                dwid : fields.dwid,
                filename : files.file.name,
                filetype : fields.istype,
                // serverfilename : baseName(files.file.path),
                serverfilepath : files.file.path,
                expirytime : imgdatetimenow + (3600000 * expiryTime)
            };
            files_array.push(image_file);
            console.log("here is a app.post() ==>" +data);
            socket.emit('my message image', data);
            // ios.sockets.emit('new message image', data);
        });
    });

    // Size Conversion
    function bytesToSize(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return 'n/a';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        if (i == 0) return bytes + ' ' + sizes[i];
        return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
    };

    //get file name from server file path
    function baseName(str)
    {
        var base = new String(str).substring(str.lastIndexOf('/') + 1);
        return base;
    }




}
