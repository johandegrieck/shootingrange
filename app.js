var express = require('express'),
	app = express(),
	server= require('http').createServer(app),
	io=require('socket.io').listen(server),
	nicknames=[],
	approved=[],
	game=new Object(),
	players=[],
	playerColors = ["player-color-1","player-color-2","player-color-3","player-color-4"],
	playerCounter = 0;

server.listen(8000);

app.get('/', function(req,res){
	res.sendfile(__dirname + '/index.html');

});
// Handle request for client
app.get('/client', function(req, res){
  res.sendfile(__dirname + '/client.html');
});
// Handle request for client
app.get('/server', function(req, res){
  res.sendfile(__dirname + '/server.html');
});

app.use(express.static(__dirname + '/static'));


io.sockets.on('connection',function(socket){


	// RECEIVE NICKNAME, SEND ID
	socket.on('send nick',function(data, callback){
		//check if nickname is already taken
		if(nicknames.indexOf(data) !=-1){
			callback(false);
		}else{
			
			socket.nickname = data;
			nicknames.push(socket.nickname);
			callback(true,nicknames);
			//updateNicknames();
		}

	});

	// RECEIVE SHOOTING COORDINATES 
	socket.on('shot',function(data){
		
		io.sockets.emit('ss',data);

		players[data.id].bulletsInChamber-=1;
		if(players[data.id].bulletsInChamber<=0){
			players[data.id].bulletsInChamber=6;
		}
		//bullet chamber update
		io.sockets.emit('bcu',data.id,players[data.id].bulletsInChamber);
	

	});


	socket.on('disconnect',function(data){
		if(!socket.nickname) return;
		nicknames.splice(nicknames.indexOf(socket.nickname),1);
		
	});
	socket.on('ngrequest',function(gamedata){	

		//set game properties
		game.gameId = gamedata[0].value;
		game.gameSeconds = gamedata[1].value;
		game.amountOfTargetsX= gamedata[2].value;
		game.amountOfTargetsY= gamedata[3].value;
		game.targetRadius = gamedata[4].value;

		//send request to start new game
		io.sockets.emit('requestready');
	});

	socket.on('player approved',function(data,callback){
 		
		approved.push(data.nick);
		var player = new Object();
				player.nickname = nicknames[playerCounter];
				player.color = playerColors[playerCounter];
				player.score = 0;
				player.id=playerCounter;
				player.bulletsInChamber = 6;
				player.scrW = data.w;
				player.scrH = data.h;
				players.push(player);


		//send a playerId to the client
		// this playerId will be used to identify the client
		callback(playerCounter);

		playerCounter++;


		//emit a signal to start game as soon as all players have confirmed
		if(approved.length === nicknames.length){

			io.sockets.emit('start',game,players);

			
		}
		

	});

});