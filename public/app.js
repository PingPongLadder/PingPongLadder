angular.module('ladderApp', [])
  .controller('LadderController', ['$scope','$http', '$timeout', function($scope, $http, $timeout) {
    
	var test = function() {
		Parse.initialize('myAppId','');
		Parse.serverURL = 'https://ttladder.stage1.eu-gb.mybluemix.net/parse';

		var obj = new Parse.Object('GameScore');
		obj.set('score',1337);
		obj.save().then(function(obj) {
		  console.log(obj.toJSON());
		  var query = new Parse.Query('GameScore');
		  query.get(obj.id).then(function(objAgain) {
			console.log(objAgain.toJSON());
		  }, function(err) {console.log(err); });
		}, function(err) { console.log(err); });
	}();
	
	var parseAppKey = "myAppId";
    var parseJavascriptKey = ""
    Parse.initialize(parseAppKey, parseJavascriptKey);

    //###################################################################################################//
    //##################################### Application Constants #####################################//
    //###################################################################################################//
    this.players = [];
    this.currentPlayer = "";
    //###################################################################################################//
    //######################################### Scope Constants #########################################//
    //###################################################################################################//
    $scope.appStatus=0; //0 for loading, 1 for ready
    
    //###################################################################################################//
    //#################################### Application Main Methods #####################################//
    //###################################################################################################//

    this.addNewPlayerCancel = function() {
      $scope.newpName = "";
      $scope.newpRank = "";
    }
    this.addNewPlayer = function(name,rank) {
      console.log("addNewPlayer", name,rank);
      if (name && rank && name != "" && rank != "") {  
        var app = this;
        this.new_players = [];
        for(i=0; i<Number(rank)-1; i++) {
          this.new_players.push(this.players[i]);
        }
        this.new_players.push({"id":"", "name": name, "rank":Number(rank), "change":0});
        for(i=Number(rank)-1; i<app.players.length; i++) {
          this.players[i].change=-1;
          this.new_players.push(this.players[i]);
        }
        this.players = this.new_players;


        for(i in app.players)
          app.players[i].rank = Number(i)+1;

        app.storeLadder();
      }
    }

    this.addNewGameCancel = function() {
      $scope.p1Name = "";
      $scope.p1Score = "";
      $scope.p2Name = "";
      $scope.p2Score = "";
      
    }
    this.addNewGame = function(p1n,p1s,p2n,p2s) {
      var app = this;
      console.log(p1n,p1s,p2n,p2s);
      if (p1s && p1s == "Technical") {
        p1s = 3;
        p2s = -1;
      }
      if (p2s && p2s == "Technical") {
        p2s = 3;
        p1s = -1;
      }
      if (p1n && p1s && p2n && p2s) {  
        var p1 = this.getPlayerByName(p1n);
        var p2 = this.getPlayerByName(p2n);
        if (p1.id != p2.id) {
          var Game = Parse.Object.extend("Game");
          var newGame = new Game();
          var Player = Parse.Object.extend("Player");
          var ptrP1 = new Player();
          var ptrP2 = new Player();
          ptrP1.id = p1.id;
          ptrP2.id = p2.id;
          newGame.set("Player1", ptrP1);
          newGame.set("Player2", ptrP2);
          newGame.set("score1",Number(p1s));
          newGame.set("score2",Number(p2s));
          console.log(newGame);
          newGame.save({
            success: function(gameTurnAgain) {
            // The save was successful.
            },
            error: function(gameTurnAgain, error) {
            console.log(error);
            }
            });        
          
          r1 = Number(p1.rank);
          r2 = Number(p2.rank);

          if (p1s > p2s && r1 > r2) {
            this.moveTo(r1,r2);
            //p1 is the winner and ranked below p2
            //TODO: put p1 in p2 position and chenge all in between
          }

          else if (p2s > p1s && r2 > r1) {
            this.moveTo(r2,r1);
            //p2 is the winner and ranked below p1
            //TODO: put p2 in p1 position and chenge all in between
          }

          var game = {"p1":p1n, "p2":p2n, "s1":p1s,"s2":p2s, "winner":0};
          if (p1s == -1) {
            game = {"p1":p1n, "p2":p2n, "s1":"","s2":"Technical", "winner":2};
          }
          else if (p2s == -1) {
            game = {"p1":p1n, "p2":p2n, "s1":"Technical","s2":"", "winner":1};
          }
          else if (p1s < p2s) {
            game.winner = 2;
          }
          else if (p1s > p2s) {
            game.winner = 1;
          }
          else {
            
          }
          
          var newLastGames = [];
          newLastGames.push(game);
          for (var i in app.lastGames) {
            newLastGames.push(app.lastGames[i]);
            if (newLastGames.length == 10) {
              break;
            }
          }
          app.lastGames = newLastGames;

        }
        this.addNewGameCancel();
      }
    }

    this.showResults = function(id) {
        this.currentPlayer = this.getPlayerById(id).name;
        var app = this;
        var Game = Parse.Object.extend("Game");
        var query1 = new Parse.Query(Game);
        var query2 = new Parse.Query(Game);
        var Player = Parse.Object.extend("Player");
        var ptrP1 = new Player();
        var ptrP2 = new Player();
        ptrP1.id = id;
        ptrP2.id = id;
        query1.equalTo("Player1",ptrP1);
        query2.equalTo("Player2",ptrP2);
        var query = Parse.Query.or(query1,query2);
        query.include("Player1");
        query.include("Player2");
        app.games = [];
        query.find({
          success: function(results) {
            for (i in results) {
              var gp1 = results[i].toJSON()["Player1"];
              var gp2 = results[i].toJSON()["Player2"];
              var game = {"p1" : gp1.Name, "p2" : gp2.Name, "s1":results[i].toJSON().score1, "s2":results[i].toJSON().score2, "winner":0};
              if (game.s1 == -1) {
                game.s1 = "";
                game.s2 = "Technical";
                game.winner = 2;
              }
              else if (game.s2 == -1) {
                game.s2 = "";
                game.s1 = "Technical";
                game.winner = 1;
              }
              else if (Number(game.s1) > Number(game.s2)) {
                game.winner = 1;
              }
              else if (Number(game.s1) < Number(game.s2)) {
                game.winner = 2;
              }
              else {

              }
              app.games.push(game)
              $scope.$apply();
              $("#modalLatestScores").modal();
            }
            
          },
          error: function(error) {
            console.log(error);
          }
        });
    }


    this.moveTo = function(winner,looser) {
      var app = this;
      var tmpList = [];
      for (var i = 0; i<Number(looser)-1; i++) {
        tmpList.push(app.players[i]);
      }
      app.players[Number(winner)-1]['change']=1;
      tmpList.push(app.players[Number(winner)-1]);
      for (var i = Number(looser)-1; i<app.players.length; i++) {
        if (app.players[i].rank != winner) {
          if (i<Number(winner)-1)
              app.players[i]['change']=-1;
          tmpList.push(app.players[i]);  
        }
      }
      for (i in tmpList) {
        tmpList[i].rank = Number(i)+1;
      }
      app.players = tmpList;
      console.log(app.players)
      app.storeLadder();
    }

    this.getPlayerByName = function(playerName) {
      var app = this;
      for (var i in app.players) {
        if (this.players[i].name == playerName)
          return this.players[i];
      }
    }

    this.getPlayerById = function(playerId) {
      var app = this;
      for (var i in app.players) {
        if (this.players[i].id == playerId)
          return this.players[i];
      }
    }



    this.init = function() 
    {
      var app = this;
      $scope.appStatus=0
      app.getLadder();
      app.getGames();
    };


    this.getLadder = function() {
        var app = this;
        var Player = Parse.Object.extend("Player");
        var query = new Parse.Query(Player);
        query.ascending("Rank");
        app.players = [];
        app.ranks = [];
        query.find({
          success: function(results) {
            for (i in results) {
                var id = results[i].id;
                var rank = results[i].get("Rank");
                var name = results[i].get("Name");
                var change = results[i].get("Change") || 0;
                var tmp = {"id" : id, "name" : name, "rank": rank, "change":change};
                app.players.push(tmp);
                // app.ranks.push(Number(i)+1);
            }
            $scope.appStatus= Number($scope.appStatus) + 1;
            $scope.$apply();
          },
          error: function(error) {
          }
        });
    }

    this.getGames = function() {
        var app = this;
        var Game = Parse.Object.extend("Game");
        var query = new Parse.Query(Game);
        query.include("Player1");
        query.include("Player2");
        query.descending("createdAt");
        query.limit(10);
        app.lastGames = [];
        query.find({
          success: function(results) {
            for (i in results) {
              var gp1 = results[i].toJSON()["Player1"];
              var gp2 = results[i].toJSON()["Player2"];
              var game = {"p1" : gp1.Name, "p2" : gp2.Name, "s1":results[i].toJSON().score1, "s2":results[i].toJSON().score2, "winner":0};

              if (Number(game.s1) == -1) {
                game.s1 = "";
                game.s2 = "Technical";
                game.winner = 2;

              }
              else if (Number(game.s2) == -1) {
                game.s2 = "";
                game.s1 = "Technical";
                game.winner = 1;
              }
              else if (Number(game.s1) > Number(game.s2)) {
                game.winner = 1; 
              }
              else if (Number(game.s1) < Number(game.s2)) {
                game.winner = 2; 
              }

              app.lastGames.push(game)
            }
                $timeout(function() {
                  $scope.appStatus= Number($scope.appStatus) + 1;
                }, 1000);

            $scope.$apply();
          },
          error: function(error) {
          }
        });
    }

  this.storeLadder = function() {
    var app = this;
    for (i in app.players) {
      if (app.players[i].id == "")
        app.createPlayer(app.players[i]);
      else
        app.updatePlayer(app.players[i]);
    }
  }

  this.updatePlayer = function(player) {
    var app = this;
    var Player = Parse.Object.extend("Player");
    var query = new Parse.Query(Player);
    query.get(player.id, {
      success: function(object) {
        object.set('Rank', player.rank);
        object.set('Change', Number(player.change));
        object.save();
      },
      error: function(error) {
        console.log("Error: " + error.code + " " + error.message);
      }
    }); 
  }
  this.createPlayer = function(player) {
    if (player) {
          var app = this;
    var Player = Parse.Object.extend("Player");
      var newPlayer = new Player();
      newPlayer.set("Rank",Number(player.rank));
      newPlayer.set("Name",player.name);
      newPlayer.set("Change",Number(player.change));
      newPlayer.save(null, {
        success: function(object) {
          app.players[Number(player.rank) - 1].id = object.id;
        },
        error: function(object, error) {
          alert('Failed to create new object, with error code: ' + error.message);
        }
      });
    }
  }



  this.removePlayer = function(id) {
    var app = this;
    
    //Remove the player from DB
    var Player = Parse.Object.extend("Player");
    var query = new Parse.Query(Player);
    query.get(id, {
      success: function(object) {
        object.destroy();
      },
      error: function(error) {
        console.log("Error: " + error.code + " " + error.message);
      }
    }); 
  
    //Remove the player from the list
    var tmpList = [];
    for (var i in app.players) {
      if (app.players[i].id != id) {
        tmpList.push(app.players[i]);
      }
    }
    for (var i in tmpList) {
      tmpList[i].rank = Number(i)+1;
    }
    app.players = tmpList;
    app.storeLadder();
  }

  this.resetDB = function() {
  	console.log('resetDB');
  	this.removeGames();
  	this.removePlayers();
  }
  this.removeGames = function() {
    	console.log('resetGames');
    var app = this;
    var Game = Parse.Object.extend("Game");
    var query = new Parse.Query(Game);
    query.find({
      success: function(list) {
        for (var i in list) {
        	list[i].destroy();
        }
      },
      error: function(error) {
        console.log("Error: " + error.code + " " + error.message);
      }
    });
  } 
  this.removePlayers = function() {
    	console.log('resetPlayers');
    var app = this;
    var Player = Parse.Object.extend("Player");
    var query = new Parse.Query(Player);
    query.find({
      success: function(list) {
        for (var i in list) {
			list[i].destroy();
        }
      },
      error: function(error) {
        console.log("Error: " + error.code + " " + error.message);
      }
    });
  } 


}]);