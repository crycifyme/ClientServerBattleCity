let express = require('express');
let app = express();
let serv = require('http').Server(app);
let io = require('socket.io')(serv, {});

app.get('/',function (req,res){
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname+ '/client'));

serv.listen(3000, '0.0.0.0');
//serv.listen(3000);

console.log("Server started");

let socket_list = {};
let player_list = {};

let Player = function(id, name){

    let randomX = Math.floor(Math.random() * (obstacleMatrix[0].length * 31));
    let randomY = Math.floor(Math.random() * (obstacleMatrix.length * 31));

    let self = {
        x: randomX,
        y: randomY,
        id:id,
        number: "" + Math.floor(10 * Math.random()),
        pressingRight:false,
        pressingLeft:false,
        pressingUp:false,
        pressingDown:false,
        maxSpd:10,
        rotation: 0,
        name: name,
        hp: 100,
        image:"/client/tank1.png"
    };
    self.updatePosition = function () {
        self.prevX = self.x;
        self.prevY = self.y;
        if (self.pressingRight && isValidPosition(self.x + self.maxSpd, self.y))
            self.x += self.maxSpd;
        if (self.pressingLeft && isValidPosition(self.x - self.maxSpd, self.y))
            self.x -= self.maxSpd;
        if (self.pressingUp && isValidPosition(self.x, self.y - self.maxSpd))
            self.y -= self.maxSpd;
        if (self.pressingDown && isValidPosition(self.x, self.y + self.maxSpd))
            self.y += self.maxSpd;
        if (self.pressingRight) {
            if (self.pressingUp) {
                self.rotation = -Math.PI / 4;
            } else if (self.pressingDown) {
                self.rotation = Math.PI / 4;
            } else {
                self.rotation = 0;
            }
        } else if (self.pressingLeft) {
            if (self.pressingUp) {
                self.rotation = -3 * Math.PI / 4;
            } else if (self.pressingDown) {
                self.rotation = 3 * Math.PI / 4;
            } else {
                self.rotation = Math.PI;
            }
        } else if (self.pressingUp) {
            self.rotation = -Math.PI / 2;
        } else if (self.pressingDown) {
            self.rotation = Math.PI / 2;
        }
        for (let i = 0; i < self.bullets.length; i++) {
            let bullet = self.bullets[i];
            bullet.x += Math.cos(bullet.direction) * bullet.speed;
            bullet.y += Math.sin(bullet.direction) * bullet.speed;

            if (
                bullet.x < 0 ||
                bullet.y < 0 ||
                bullet.x > 1400 ||
                bullet.y > 700
            ) {
                self.bullets.splice(i, 1);
                i--;
            }
        }
    }

    self.bullets = [];

    self.shoot = function() {
        let bullet = {
            x: self.x,
            y: self.y,
            speed: 15,
            direction: self.rotation,
        };
        self.bullets.push(bullet);
    };
    return self;
}

const obstacleMatrix = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,1, 1, 1, 1],
];

let obstacles = [];

for (let i = 0; i < obstacleMatrix.length; i++) {
    for (let j = 0; j < obstacleMatrix[i].length; j++) {
        if (obstacleMatrix[i][j] === 1) {
            obstacles.push({ x: j * 31, y: i * 31, image: "/client/kirpich.png" });
        }
    }
}

let obstacleWidth = 31;
let obstacleHeight = 31;

function isValidPosition(x, y) {
    if (x < 0 || y < 0 || x >= 1400 || y >= 700) {
        return false;
    }

    let i = Math.floor(y / obstacleHeight);
    let j = Math.floor(x / obstacleWidth);


    return obstacleMatrix[i] && obstacleMatrix[i][j] !== 1;
}

function handleBulletObstacleCollision(bullet) {
    for (let i = 0; i < obstacles.length; i++) {
        let obstacle = obstacles[i];
        if (
            bullet.x > obstacle.x &&
            bullet.x < obstacle.x + obstacleWidth &&
            bullet.y > obstacle.y &&
            bullet.y < obstacle.y + obstacleHeight
        ) {
            return true;
        }
    }
    return false;
}

io.sockets.on('connection', function(socket){

    socket.id = Math.random();
    socket_list[socket.id] = socket;
    let player = Player(socket.id);
    player_list[socket.id] = player;


    socket.on('disconnect', function(){
        delete socket_list[socket.id];
        delete player_list[socket.id];
    });
    socket.on('keyPress', function (data) {
        if (data.inputId === 'left')
            player.pressingLeft = data.state;
        else if (data.inputId === 'right')
            player.pressingRight = data.state;
        else if (data.inputId === 'up')
            player.pressingUp = data.state;
        else if (data.inputId === 'down')
            player.pressingDown = data.state;
        else if (data.inputId === 'shoot' && data.state)
            player.shoot();
    });
});



setInterval(function () {
    let pack = {
        players: [],
        obstacles: obstacles
    };

    for (const i in player_list) {
        let player = player_list[i];
        player.updatePosition();
        for (let j = 0; j < player.bullets.length; j++) {
            let bullet = player.bullets[j];
            if (handleBulletObstacleCollision(bullet)) {

                player.bullets.splice(j, 1);
                j--;
            }
            for (const k in player_list) {
                if (k !== i) {
                    let targetPlayer = player_list[k];

                    if (
                        bullet.x > targetPlayer.x - 15 &&
                        bullet.x < targetPlayer.x + 15 &&
                        bullet.y > targetPlayer.y - 15 &&
                        bullet.y < targetPlayer.y + 15
                    ) {
                        targetPlayer.hp -= 10;

                        if (targetPlayer.hp <= 0) {
                            delete socket_list[targetPlayer.id];
                            delete player_list[targetPlayer.id];
                        }


                        player.bullets.splice(j, 1);
                        j--;
                        break;
                    }
                }
            }
        }
        pack.players.push({
            x: player.x,
            y: player.y,
            image: player.image,
            hp: player.hp,
            rotation: player.rotation * (180 / Math.PI),
            bullets: player.bullets
        });
    }

    for (const i in socket_list) {
        let socket = socket_list[i];
        socket.emit('newPositions', pack);
    }
}, 1000 / 25);
