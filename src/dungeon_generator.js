/**
 * @author Anthony Mills <https://www.anthony-mills.com>
 * @copyright 2017 Anthony Mills
 * @license GPLV3
 */

Phaser.Plugin.DungeonCreator = function (game, parent) {
  this.game = game;

  Phaser.Plugin.call(this, game, parent);
};

Phaser.Plugin.DungeonCreator.prototype = Object.create( Phaser.Plugin.prototype );

/**
* Set some of the required dungeon generation settings
*
*/
Phaser.Plugin.DungeonCreator.prototype.init = function() {
    this.levelMap = {};

    this.numRooms = 0;
    this.numTiles = 0;
    this.floorCount = 0;

    this.setupDungeon({});
}

/**
* Setup up the particulars for the dungeon being generated
*
* @param object mapParams
*/
Phaser.Plugin.DungeonCreator.prototype.setupDungeon = function( mapParams ) {
  this.wallKey = mapParams.wall || 'wall';
  this.floorKey = mapParams.floor || 'floor';

  // The maximum size a room can be
  this.roomMaxSize = mapParams.room_max_size || 5;

  // The minimum allowable size for a room
  this.roomMinSize = mapParams.room_min_size || 2;

  // The maximum number of rooms for the map
  this.maxRooms = mapParams.max_rooms || 15;

  // The size of the tile sprite
  this.tileSize = mapParams.tile_size || 128;

  // The overall size of the map in pixels
  this.mapSize = {};
  this.mapSize.x = mapParams.map_size_x || 3072;
  this.mapSize.y = mapParams.map_size_y || 3072;   
}

/**
* Destroy Map
*/
Phaser.Plugin.DungeonCreator.prototype.destroyMap = function() {

    // Kill all the sprites in the wall and floor group
    this.levelMap.walls.callAll('kill');
    this.levelMap.floors.callAll('kill');

    this.levelMap = {};

    // Reset the counters
    this.numRooms = 0;
    this.numTiles = 0;
    this.floorCount = 0;    
}


/**
* Random number
*
* @param integer minNum
* @param integer maxNum
*/
Phaser.Plugin.DungeonCreator.prototype.getRandom = function(minNum, maxNum) {

    return Math.floor( Math.random() * (maxNum - minNum) ) + minNum;

}

/** 
* Create a random dungeon
*/
Phaser.Plugin.DungeonCreator.prototype.createMap = function()
{

  this.levelMap.walls = this.game.add.group();
  this.levelMap.walls.enableBody = true;
        
  this.levelMap.floors = this.game.add.group();      

  for (var y=0; y < this.mapSize.y; y+= this.tileSize) {
      for (var x=0; x < this.mapSize.x; x+=this.tileSize) {
          var wall = this.levelMap.walls.create(x, y, this.wallKey);
          wall.body.immovable = true;
      }
  }
  
  this.lastRoomCoords = { x: 128, y: 128 };

  for (var r=0; r<this.maxRooms; r++) {
      var w = this.getRandom(this.roomMinSize, this.roomMaxSize) * this.tileSize;
      var h = this.getRandom(this.roomMinSize, this.roomMaxSize) * this.tileSize;
      
      x = this.getRandom(1, ((this.mapSize.x) / this.tileSize) - (w/this.tileSize + 1)) * this.tileSize;
      y = this.getRandom(1, ((this.mapSize.y) / this.tileSize) - (w/this.tileSize + 1)) * this.tileSize;
                      
      this.createRoom(x, x+w, y, y+h);
      
      var spawnX = x + (w/2);
      var spawnY = y + (h/2); 

      var newX = game.math.snapToFloor(x + (w/2), this.tileSize);
      var newY = game.math.snapToFloor(y + (h/2), this.tileSize);
      
      var prevX = game.math.snapToFloor(this.lastRoomCoords.x, this.tileSize);
      var prevY = game.math.snapToFloor(this.lastRoomCoords.y, this.tileSize);

      this.createHTunnel(prevX, newX, prevY);
      
      this.createVTunnel(prevY, newY, newX);

      this.lastRoomCoords = { x: x + (w/2), y: y + (h/2) };
      this.numRooms++;
  }

  this.game.physics.game.world.setBounds(0,0,this.mapSize.x,this.mapSize.y);;    
}

/**
* Create a floor tile in the dungeon
*
* @param integer xLoc
* @param integer yLoc
*/
Phaser.Plugin.DungeonCreator.prototype.createFloor = function( xLoc, yLoc ) {
    fl = this.levelMap.floors.create(xLoc, yLoc, this.floorKey);
    this.game.physics.arcade.enable(fl);

    this.game.physics.arcade.overlap(fl, this.levelMap.walls, function(floor, wall) {
        wall.destroy();
    });

    this.floorCount++;

    fl.destroy();
}

/**
* Create a room in the dungeon
*
* @param integer x1
* @param integer x2
* @param integer y1
* @param integer y2
*/
Phaser.Plugin.DungeonCreator.prototype.createRoom = function(x1, x2, y1, y2) {
    for (var x = x1; x<x2; x+=this.tileSize) {
        for (var y = y1; y<y2; y+=this.tileSize) {
            this.createFloor(x, y);
        }
    }
}

/**
* Create a vertical tunnel
*
* @param integer y1
* @param integer y2
* @param integer x
*/
Phaser.Plugin.DungeonCreator.prototype.createVTunnel = function(y1, y2, x) {
  var min = Math.min(y1, y2);
  var max = Math.max(y1, y2);

  for (var y = min; y < max + 8; y += 8) {
      this.createFloor(x, y);
  }
}   

/**
* Create a horizontal tunnel
*
* @param integer x1
* @param integer x2
* @param integer y
*/
Phaser.Plugin.DungeonCreator.prototype.createHTunnel = function(x1, x2, y) {
  var min = Math.min(x1, x2);
  var max = Math.max(x1, x2);

  for (var x = min; x<max+8; x+=8) {
      this.createFloor(x, y);
  }
}