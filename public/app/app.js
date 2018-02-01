var App = angular.module('ChatRoom',['ngResource','ngRoute','ngStorage','socket.io','ngFileUpload','Controllers','Services'])
.run(["$rootScope", function ($rootScope){
	// $rootScope.baseUrl = 'http://chat.systenics.com'; //Application URL
    $rootScope.baseUrl = 'http://192.168.0.18:6789'; //Application URL
}]);
App.config(function ($routeProvider, $socketProvider){
	// $socketProvider.setConnectionUrl('http://chat.systenics.com'); // Socket URL
    $socketProvider.setConnectionUrl('http://192.168.0.18:6789'); // Socket URL

    // $routeProvider	// AngularJS Routes
    // .when('/v1/', {
		// templateUrl: 'app/views/login.html',
		// controller: 'loginCtrl'
    // })
    // .when('/v1/ChatRoom', {
		// templateUrl: 'app/views/chatRoom.html',
		// controller: 'chatRoomCtrl'
    // })
    // .otherwise({
    //     redirectTo: '/v1/'	// Default Route
    // });
});
