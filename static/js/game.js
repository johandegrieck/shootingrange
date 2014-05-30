jQuery(function($){
	var socket = io.connect();
	var $body = $('body');
	var $initserver = $('#initserver');
	var $nameEntry = $('#name-entry');
	var $nickForm = $('#frmRegister');
	var $nickError = $('#errNickname');
	var $initForm = $('#frmInitserver');
	var $rbtGameId = $('#rbtGameId');
	var $txtNickName = $('#txtNickname');
	//var $players= $('#panePlayers');
	var $controllerPane = $('#paneController');
	var $shootingPane=$('#paneShootingrange');
	var $confirmButton =$('#btnConfirm');

	var $loader = $('#loader');
	var $isServer = false;
	var $rnd = 1;
	var $nickname="";
	var $playerId=0;
	var $controllerPaneEnabled = false;

	//amount of different shot images
	var $dsi=3;

	
	var bSoundReady=false;

	soundManager.setup({
	  url: '../swf/',
	  onready: function() {
	    bSoundReady=true;
	  },
	  ontimeout: function() {
	    // Hrmm, SM2 could not start. Missing SWF? Flash blocked? Show an error, etc.?
	  }
	});
	

	function showBulletHole(n,x,y,w,h){
		//choose random shot image
		m=Math.floor((Math.random()*$dsi));
		
		//console.log("before x:"+x+"y:"+y);
		$bullet = $("<div class='shot shot-"+n+"-"+m+"'></div>");
		$bullet.css("position","absolute");
		$expl= $( "#cont-expl" ).clone();
		$expl.children().children().addClass("box-"+n);


		percX = x/w;
		x= Math.round(percX*100);
		percY = y/h;
		y= Math.round(percY*100);
		//console.log(" percX:"+percX+"percY:"+percY);
		//console.log("after x:"+x+"y:"+y);


		$bullet.css("left",x+"%");
		$bullet.css("top",y+"%");
		$expl.css("left",x+"%");
		$expl.css("top",y+"%");
		$shootingPane.append($bullet);
		$shootingPane.append($expl);

	}

	function showScore(player){
		//console.log("showScore() player.id: "+player.id+" player score: "+player.score);
		$('.playerstat-points p').eq(player.id).text(player.score);
	}

	function showPlayer(player,n){
		//console.log("showPlayer "+ player.nickname +" "+ n);
		$('.playerstat').eq(n).toggleClass("act");
		$('.playerstat-name').eq(n).text(player.nickname);
		$('.playerstat-name').eq(n).toggleClass(player.color);
		showScore(player,n);


	}


	function showPlayers(players){
		//var j=0;
		for(var i=0;i<players.length;i++){
			//console.log('showPlayers() - PLAYER: ',players[i].nickname);
			//j++;
			showPlayer(players[i], i);
		}

	}

	function initShootingRange(amountX, amountY){
		for(var i=0;i<amountY;i++){
			for(var j=0;j<amountX;j++){
				$target = $("<div class='target target-"+j+"-"+i+"'></div>");
				$shootingPane.append($target);
			}
		}			

	}

	function showDialog(){
		socket.emit('player approved',$nickname);
		/**** UNCOMMENT !! ***
		$confirmButton.show();
		//show confirm buttom. When clicked, the server will receive a signal			
		$confirmButton.click(function(){
	        console.log('Pushed tha button');
			socket.emit('player approved',$nickname);
			$(this).hide();
		});			
		***/
	}

	function initRound(game, gamers){
		showPlayers(gamers);
		initShootingRange(game.gameTargetsX,game.TargetsY);
	}

	
	/******** FIRE AT WILL *************/

	/*$controllerPane.on('touchstart', function(e) {
		var posX = e.originalEvent.touches[0].pageX;
		var posY = e.originalEvent.touches[0].pageY;
		var width= $(document).width();
		var height= $(document).height();

		if($controllerPaneEnabled){
			
			//var offset = $(this).offset();
			//var posX = e.clientX - offset.left;
			//ar posY = e.clientY - offset.top;
			socket.emit('shot',{id:$playerId,posX:posX,posY:posY,width:width,height:height}, function(data){
				//console.log("Shot data:"+data);
			});

		}
		socket.emit('log',{str:'oi'},function(data){});

	});*/
	
	$controllerPane.click(function(e) {

		if($controllerPaneEnabled){		
			var offset = $(this).offset();
			var posX = e.clientX - offset.left;
			var posY = e.clientY - offset.top;
			var width= $(document).width();
			var height= $(document).height();
				
			socket.emit('shot',{id:$playerId,posX:posX,posY:posY,width:width,height:height}, function(data){});
			socket.emit('log',{str:'oi'},function(data){});
		}

	});
	/********** END FIRE AT WILL *****************/

	

	$nickForm.submit(function(e){
		e.preventDefault();
		$nickname = $txtNickName.val();
		socket.emit('send nick',$nickname,function(data,nicknames){
			if(data){
				console.log('call back send nick: '+nicknames);
				//set the PlayerId 
				$playerId= nicknames.length -1;
				$nameEntry.hide();
				$initserver.hide();
				$controllerPane.show();
				


			}else{
				$nickError.html('Nickname already taken. Try another one!');
			}
		});
	});
	$initForm.submit(function(e){

		e.preventDefault();
		//Send request for a new game
		var formData = $initForm.serializeArray();
		socket.emit('ngrequest',formData);
		$nameEntry.hide();
		$isServer = true;
		$initserver.hide();

		//create explosion container
		$('#paneShootingrange').append('<div id="cont-expl"><div id="expl"><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div></div></div>');
	});
	socket.on('log',function(data){
		console.log("log: "+data);
	});

	socket.on('bulletChamberUpdate',function(id, bulletsInChamber){
		if($isServer){
			//$(".playerstat-container .playerstat:nth-child("+id+1+")").append("k");
			//var j = id+1;
			var gunChamber = $(".playerstat-container .playerstat-gunchamber:eq("+id+")");
			gunChamber.removeClass("barrel-0").removeClass("barrel-1").removeClass("barrel-2").removeClass("barrel-3").removeClass("barrel-4").removeClass("barrel-5").removeClass("barrel-6");

			gunChamber.addClass("barrel-"+bulletsInChamber);
			console.log("shot() : id-"+id+ " bulletsInchamber" + bulletsInChamber);
		}

	});

	socket.on('requestready',function(data){
		
		
		if(!$isServer){
			//show confirmation dialog to all players
			showDialog();
		}else{
			//show loader on server interface
			$loader.toggle();
		}
		

	});
	socket.on('start',function(game,gamers){
		//console.log('requestready game - gameId: '+game.gameId + ' - gameSeconds: '+game.gameSeconds );
		if($isServer){
			$loader.toggle();
			//alert('the game has begun!');
			$shootingPane.addClass('act');
			//console.log("socket on start - game:" + game.gameId +"gamers:" + gamers[0].nickname);
			initRound(game,gamers);
		}else{
			$controllerPaneEnabled=true;
		}
	});
	socket.on('showshot',function(data){
		
		if($isServer){
			//console.log("showhot data.id" +data.id+"data.posX:"+data.posX+" data.posY:"+data.posY);
			showBulletHole(data.id,data.posX,data.posY,data.width,data.height);
			if(bSoundReady){
		            var $mySound = soundManager.createSound({
		              id: 'aSound',
		              url: '../sounds/shot2.mp3'
		            });		            
		            $mySound.play();
		        }

		}


	});
});




	