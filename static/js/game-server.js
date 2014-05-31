jQuery(function($){

	/*var socket = io.connect();*/
	/* openshift config */
	var socket = io.connect("http://shootingrange-shootingrange.rhcloud.com:8000");
	var $body = $('body');
	var $initserver = $('#initserver');
	
	var $initForm = $('#frmInitserver');
	var $rbtGameId = $('#rbtGameId');

	var $shootingPane=$('#paneShootingrange');
	var $pStatCont = $('.playerstat-container');
    var $targetsCont = $('#targetsContainer');
    var $scrW= $(document).width();
    var $scrH= $(document).height();

	var $loader = $('#loader');
	var $rnd = 1;
	//amount of different shot images
	var $dsi=3;
	var $players=[];
	
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
	

	function showBulletHole(n,x,y){
		console.log("player number:"+n);
		console.log("player="+$players[n].nickname);
		//choose random shot image
		var w=$players[n].scrW;
		var h=$players[n].scrH;
		console.log("playerwidth: "+ w + "playerheight : "+h + "playerX: "+ x + "playerY : "+y );
		var m=Math.floor((Math.random()*$dsi));
		percX = x/w;
		x= Math.round(percX*100);
		percY = y/h;
		y= Math.round(percY*100);
		// translate client x and y positions (in pixels) to servers width and height
		
		var serverHitX = Math.round($scrW*percX);
		var serverHitY = Math.round($scrH*percY);
		var hitElem = document.elementFromPoint(serverHitX, serverHitY);

		//console.log("************ showBulletHole -+" + hitElem.className + "+- serverHitX:"+serverHitX+"  serverHitY:"+serverHitY);
		//console.log(hitElem);
		strHitElem = ""+hitElem.className;
		//hitELem.css("background-color","#FF0000;")
		//console.log("*===================== strHitElem  before string Replace=========================: "+strHitElem);

		strHitElem = strHitElem.replace(/\s/g, ".");
		//console.log("*===================== strHitElem =========================: "+strHitElem);
		var $hitElem = $('.'+strHitElem);

		var hitElemPosition = $hitElem.position()
		//console.log("************ hitElem position -++- hitElem left:"+hitElemPosition.left +"  hitElem top:"+hitElemPosition.top);
		$bullet = $("<div class='shot shot-"+n+"-"+m+"'></div>");
		$bullet.css("position","absolute");
		$expl= $( "div #cont-expl-"+n );

		$expl.children().children().addClass("box-"+n);;
		//$expl.children().children().addClass("box-"+n);

		$bullet.css("left",x);
		$bullet.css("top",y);
		$expl.css("left",x+"%");
		$expl.css("top",y+"%");
		$shootingPane.append($expl);
		//console.log($hitElem);

		var offset=$expl.position();
			//console.log('offset top:'+offset.top);

			$bullet.css("position","absolute");
			$bullet.css("left",offset.left-hitElemPosition.left);
			$bullet.css("top",offset.top-hitElemPosition.top);
			$bullet.addClass("touche");


		if($hitElem.hasClass("target")){
			
			$bullet.clone().appendTo($hitElem);
			//$hitElem.append($bullet);
			$hitElem.addClass("touche");
	      
	        

			$players[n].score +=10;
			showScore($players[n]);

		}
		else if($hitElem.hasClass("touche") && $hitElem.hasClass("shot")){
			//console.log('hit an other element!');
			//console.log($hitElem);

			$bullet.clone().appendTo($hitElem.parent());
			
		}
		else{
			//console.log('hit an other element!');
			//console.log($hitElem);
			$shootingPane.append($bullet);
		}
		
		
		
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

	function initShootingRange(amountX, amountY, targetRadius){

		//console.log("- initShootingRange()- amountX "+amountX+"amountY"+amountY);
		for(var i=0;i<amountY;i++){
			for(var j=0;j<amountX;j++){
				$target = $("<div class='target target-"+j+"-"+i+"'></div>");
				//$shootingPane.append($target);
				
				$target.css("left",j*(100/amountX)+"%");
				$target.css("top",i*(100/amountY)+"%");
				$target.css("width",targetRadius+"px");
				$target.css("height",targetRadius+"px");
				$target.css("background-position","50% 50%");
				$target.css("background-repeat","no-repeat");
				$target.css("background-image","url(../img/bullseye_"+targetRadius+"px.png)");
				$target.addClass("act");
				$targetsCont.append($target);
			}
		}			

	}
	function showRandomTarget(amountX,amountY){
		//remove all active targets
		$targetsCont.find(".target").removeClass("act");
		//select random target
		var n = Math.floor(Math.random() * amountX*amountY) + 1;
		//check if target isn't already shot, else choose other target
		if(!$targetsCont.find(".target:nth-child("+n+")").hasClass("touche")){
			$targetsCont.find(".target:nth-child("+n+")").addClass("act");
		}else{
			showRandomTarget(amountX,amountY);
		}

	}

	function initRound(game, gamers){
		showPlayers(gamers);
		initShootingRange(game.amountOfTargetsX,game.amountOfTargetsY,game.targetRadius);
		//deactivat all targets first
		$targetsCont.find('.target').toggleClass('act');
		setInterval(function() { showRandomTarget(game.amountOfTargetsX,game.amountOfTargetsY); },3000);
	}

	$initForm.submit(function(e){

		e.preventDefault();
		//Send request for a new game
		var formData = $initForm.serializeArray();
		socket.emit('ngrequest',formData);
		$isServer = true;
		$initserver.hide();

		//create explosion containers for four players
		$('#paneShootingrange').append('<div id="cont-expl-0"><div id="expl"><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div></div></div>');
		$('#paneShootingrange').append('<div id="cont-expl-1"><div id="expl"><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div></div></div>');
		$('#paneShootingrange').append('<div id="cont-expl-2"><div id="expl"><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div></div></div>');
		$('#paneShootingrange').append('<div id="cont-expl-3"><div id="expl"><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div><div class="box"></div></div></div>');
	});

	socket.on('bcu',function(id, bulletsInChamber){
		if($isServer){
			//$(".playerstat-container .playerstat:nth-child("+id+1+")").append("k");
			//var j = id+1;
			var gunChamber = $(".playerstat-container .playerstat-gunchamber:eq("+id+")");
			gunChamber.removeClass("barrel-0").removeClass("barrel-1").removeClass("barrel-2").removeClass("barrel-3").removeClass("barrel-4").removeClass("barrel-5").removeClass("barrel-6");

			gunChamber.addClass("barrel-"+bulletsInChamber);
			
		}

	});

	socket.on('requestready',function(data){
		$loader.toggle();
	});
	socket.on('start',function(game,gamers){
		$players = gamers;
		//console.log('requestready game - gameId: '+game.gameId + ' - gameSeconds: '+game.gameSeconds );
		$loader.toggle();
		//alert('the game has begun!');
		$shootingPane.addClass('act');
		console.log("socket on start - game:" + game.gameId +"gamer 0 scrW:" + gamers[0].scrW+" game targetRadius:" + game.targetRadius);
		initRound(game,gamers);
		
	});
	socket.on('ss',function(data){
		console.log("showhot data.id" +data.id+"data.posX:"+data.x+" data.posY:"+data.y);
		showBulletHole(data.id,data.x,data.y);
		if(bSoundReady){
            var $mySound = soundManager.createSound({
              id: 'aSound',
              url: '../sounds/shot2.mp3'
            });		            
            $mySound.play();
        }
	});
});
