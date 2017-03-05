"use strict";

class Dizastre {
    constructor(startData) {
        this._gameId = startData.game_id;
        this._boardWidth = startData.width;
        this._boardHeight = startData.height;
        this._snake = null;
    }

    get gameId() {
        return this._gameId;
    }

    get boardWidth() {
        return this._boardWidth;
    }

    get boardHeight() {
        return this._boardHeight;
    }
    
    get snake() {
        return this._snake;
    }
    
    get snakeLength() {
        return this.snake.coords.length;
    }
    
    get justAte() {
        return this._justAte;
    }

    static get snakeData() {
        return {
            color: "#22313F",
            secondary_color: "#F9BF3B",
            name: "Dizastre",
            head_url: "http://mogzol.mooo.com/dizastre.jpg", // optional, but encouraged!
            taunt: "No bonus features!? 80%", // optional, but encouraged!
            head_type: "fang",
            tail_type: "freckled",
        };
    }

    getMove(gameData) {
        // 0 = regular square, 1 = food square, 2 = snake/potential snake body, 3 = snake head, 4 = our snake head, 5 = our tail
        
        //Create board with all 0's
        var board = [];
        for (var i = 0; i < this.boardWidth; i++) {
            board[i] = [];
            for (var j = 0; j < this.boardHeight; j++) {
                board[i][j] = 0;
            }
        }

        // Get our snake
        this._snake = gameData.snakes.find((snake) => {
            return snake.id === gameData.you;
        });

        // Fill foods with 1's
        gameData.food.forEach((foodCoord) => {
            board[foodCoord[0]][foodCoord[1]] = 1;
        });

        // Fill bad squares with 2's for body, 3's for head
        gameData.snakes.forEach((snake) => {

            // If snek is a big guy, the locations its head can move are bad
            if (snake.id !== this.snake.id && snake.coords.length >= this.snakeLength) {
                var headX = snake.coords[0][0];
                var headY = snake.coords[0][1];
                
                if(headX > 0)
                    board[headX - 1][headY] = 2;
                if(headY > 0)
                    board[headX][headY - 1] = 2;
                if(headX < this.boardWidth - 1)    
                    board[headX + 1][headY] = 2;
                if(headY < this.boardHeight - 1)
                    board[headX][headY + 1] = 2;
                
            }

            var isFirst = true;
            // Fill board with bad squares where da snakeys are

            snake.coords.forEach((coord) => {
                board[coord[0]][coord[1]] = isFirst ? !(isFirst = false) && 3 : 2;
            });
        });
        
        //Find tail and track it with 5
        var tailCoords = this.snake.coords[this.snakeLength - 1];
        board[tailCoords[0]][tailCoords[1]] = 5;

        console.log('filled snakeys ' + this.snake.coords[0][0] + ',' + this.snake.coords[0][1]);

        // Find our head and make it 4
        var ourHeadX = this.snake.coords[0][0];
        var ourHeadY = this.snake.coords[0][1];
        board[ourHeadX][ourHeadY] = 4;

        // Try to find food
        var foundNode = this.findPath(board, this.snake.coords[0], this.findMode.food);
        var foundFood = foundNode !== null;
        
        // If no food found
        if (!foundFood) {
            console.log('no food. ' + this.snake.coords[0][0] + ',' + this.snake.coords[0][1]);
            //FUCK ME NO FOOD, FIND TAIL
            var tailPlace;
            
            //Find Tail
            for(var i = this.snakeLength - 1; i > 0; i--) {
                tailPlace = this.snake.coords[i];
                board[tailPlace[0]][tailPlace[1]] = 5; 
                
                foundNode = this.findPath(board, this.snake.coords[0], this.findMode.tail);
                
                if(foundNode !== null)
                    break;
                    
                board[tailPlace[0]][tailPlace[1]] = 2;
            }
            
            console.log('yo looked for tail bro: ' + tailPlace + '   ' + this.snake.coords[0][0] + ',' + this.snake.coords[0][1]);
        }
        
        var dir = foundNode ? foundNode.dir : this.lastResort(board)

        /*if(finalDir == -1){
          //FUCK NO TAIL, STALL
          finalDir = findFood(board,us.coords[0],STALLID);
        }*/
        
        console.log(dir);
        
        if (this.justAte)
            this._justAte = false;
        
        if (foundFood && foundNode.len === 1) // if we are about to eat
            this._justAte = true;

        return {
            move: dir, // one of: ['up','down','left','right']
            taunt: 'Girth first baby', // optional, but encouraged!
        }
    }

    get findMode() {
        return {
            food: 1,
            snake: 2,
            tail: 3,
        }
    }

    findPath(board, pos, mode) {
        var visited = [];
        for (var i = 0; i < this.boardWidth; i++) {
            visited[i] = [];
            for (var j = 0; j < this.boardHeight; j++) {
                visited[i][j] = false;
            }
        }

        var queue = [];

        var rootNode = {
            pos: pos,
            dir: null,
            len: 0
        };

        visited[pos[0]][pos[1]] = true;
        queue.push(rootNode);

        // Set up variables based on mode
        var isTarget;
        var isSafe;
        var foundTarget;
        switch (mode) {
            case this.findMode.food:
                isTarget = (num) => {
                    return num === 1; // Food
                };
                isSafe = (num) => {
                    return num < 2; // Square is food or empty
                };
                foundTarget = (node) => {
                    // See if we are closest (or equal dist)
                    var closest = this.findPath(board, node.pos, this.findMode.snake);
                    if (closest.len < node.len)
                        return false;
                        
                    //if (this.snakeLength > 3) {
                    //    // Find next position
                    //    var nextPos = pos;
                    //    switch (node.dir) {
                    //        case 'up':
                    //            nextPos[1]--;
                    //            break;
                    //        case 'right':
                    //            nextPos[0]++;
                    //            break;
                    //        case 'down':
                    //            nextPos[1]++;
                    //            break;
                    //        case 'left':
                    //            nextPos[0]--;
                    //            break;
                    //    }
                    //    
                    //    // Check if we can see our tail from next position
                    //    if (this.findPath(board, nextPos, this.findMode.tail) === null)
                    //        return false;
                    //}
                    
                    return true; // If we are the closest snek, go go eat mmm
                };
                break;
            case this.findMode.snake:
                isTarget = (num) => {
                    return num === 3 || num === 4; // Snake head or our head
                };
                isSafe = (num) => {
                    return num < 5 && num !== 2; // empty, food, snake head, or our head
                };
                foundTarget = (node) => {
                    return true;
                };
                break;
            case this.findMode.tail:
                isTarget = (num) => {
                    return num === 5; // our tail 
                };
                isSafe = (num) => {
                    return num < 2 || num === 5; // empty, food, our tail
                };
                foundTarget = (node) => {
                    var realTailX = this.snake.coords[this.snakeLength - 1][0];
                    var realTailY = this.snake.coords[this.snakeLength - 1][1];
                    
                    return (!this.justAte && node.pos[0] === realTailX && node.pos[1] === realTailY) || node.len > 1; //return direction to tail piece
                };
        }


        while (queue.length > 0) {
            var thisNode = queue.shift();
            var thisX = thisNode.pos[0];
            var thisY = thisNode.pos[1];

            if (isTarget(board[thisX][thisY]) && foundTarget(thisNode)) {
                return thisNode;
            }

            // Add to queue all valid directions
            if (thisY > 0 && isSafe(board[thisX][thisY - 1]) && visited[thisX][thisY - 1] === false) {
                visited[thisX][thisY - 1] = true;
                queue.push({
                    pos: [thisX, thisY - 1],
                    dir: thisNode.dir === null ? "up" : thisNode.dir,
                    len: thisNode.len + 1
                });
            }

            if (thisX < this.boardWidth - 1 && isSafe(board[thisX + 1][thisY]) && visited[thisX + 1][thisY] === false) {
                visited[thisX + 1][thisY] = true;
                queue.push({
                    pos: [thisX + 1, thisY],
                    dir: thisNode.dir === null ? "right" : thisNode.dir,
                    len: thisNode.len + 1
                });
            }

            if (thisY < this.boardHeight - 1 && isSafe(board[thisX][thisY + 1]) && visited[thisX][thisY + 1] === false) {
                visited[thisX][thisY + 1] = true;
                queue.push({
                    pos: [thisX, thisY + 1],
                    dir: thisNode.dir === null ? "down" : thisNode.dir,
                    len: thisNode.len + 1
                });
            }

            if (thisX > 0 && isSafe(board[thisX - 1][thisY]) && visited[thisX - 1][thisY] === false) {
                visited[thisX - 1][thisY] = true;
                queue.push({
                    pos: [thisX - 1, thisY],
                    dir: thisNode.dir === null ? "left" : thisNode.dir,
                    len: thisNode.len + 1
                });
            }
        }

        //no food move
        return null;
    }
    
    lastResort(board) {
        
        console.log('fukin last resort boissssss fuk me. ' + this.snake.coords[0][0] + ',' + this.snake.coords[0][1])
        //Lasttttt resortttt
        // Try up, right, down, left
        var ourHeadX = this.snake.coords[0][0]; 
        var ourHeadY = this.snake.coords[0][1]; 
        if (ourHeadY > 0 && board[ourHeadX][ourHeadY - 1] < 2)
            return "up";
        else if (ourHeadX < this.boardWidth - 1 && board[ourHeadX + 1][ourHeadY] < 2)
            return "right";
        else if (ourHeadY < this.boardHeight - 1 && board[ourHeadX][ourHeadY + 1] < 2)
            return "down";
        else if (ourHeadX > 0 && board[ourHeadX - 1][ourHeadY] < 2)
            return "left";
        else
            console.log('kill me'); 
    }
}

module.exports = Dizastre;
