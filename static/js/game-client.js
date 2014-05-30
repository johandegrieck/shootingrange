jQuery(function($){
	var socket = io.connect();
	var $body = $('body');
	var $nameEntry = $('#name-entry');
	var $nickForm = $('#frmRegister');
	var $nickError = $('#errNickname');
	var $txtNickName = $('#txtNickname');
	//var $players= $('#panePlayers');
	var $controllerPane = $('#paneController');
	var $confirmButton =$('#btnConfirm');

	var $nickname="";
	var $playerId=0;
	var $controllerPaneEnabled = false;
	var $width= $(document).width();
	var $height= $(document).height();
	var $cursor = $("#cursor");
	alert("document dimensions "+ $width + "x"+$height );


	function showDialog(){
		//socket.emit('player approved',{nick:$nickname,w:$width,h:$height});
		
		$confirmButton.show();
		//show confirm buttom. When clicked, the server will receive a signal			
		$confirmButton.click(function(){
	        console.log('Pushed tha button');
			socket.emit('player approved',{nick:$nickname,w:$width,h:$height},function(playerId){
				//set the PlayerId 
				$playerId= playerId;
				

			});
			$(this).hide();
			$(this).addClass("act");
			$controllerPane.addClass("act");
			$cursor.addClass("act");
			$controllerPane.toggleClass("act");
		});		
	}
	
	/******** FIRE AT WILL *************/

	$controllerPane.on('touchstart', function(e) {
		var posX = e.originalEvent.touches[0].pageX;
		var posY = e.originalEvent.touches[0].pageY;		
		socket.emit('shot',{id:$playerId,x:posX,y:posY});
		
		$cursor.css("left",e.originalEvent.touches[0].pageX);
		$cursor.css("top",e.originalEvent.touches[0].pageY);

	});
	
	/*$controllerPane.click(function(e) {

		if($controllerPaneEnabled){		
			var offset = $(this).offset();
			var posX = e.clientX - offset.left;
			var posY = e.clientY - offset.top;
				
			socket.emit('shot',{id:$playerId,posX:posX,posY:posY}, function(data){});
			//socket.emit('log',{str:'oi'},function(data){});
		}

	});*/
	/********** END FIRE AT WILL *****************/


	/***REMOVE CODE START **
	    $nickname = Math.random(0,100);
		socket.emit('send nick',$nickname,function(data,nicknames){
			if(data){
				
				//set the PlayerId 
				$playerId= nicknames.length -1;
				$nameEntry.hide();
				$controllerPane.show();
			}else{
				$nickError.html('Nickname already taken. Try another one!');
			}
		});
	 END REMOVE CODE **/

	$nickForm.submit(function(e){
		e.preventDefault();
		$nickname = $txtNickName.val();
		socket.emit('send nick',$nickname,function(data,nicknames){
			if(data){
				

				
				$nameEntry.hide();
				$controllerPane.show();
			}else{
				$nickError.html('Nickname already taken. Try another one!');
			}
		});
	});
	

	
	socket.on('requestready',function(data){
		showDialog();
	});
	socket.on('start',function(game,gamers){
		$controllerPaneEnabled=true;

	});
});




	