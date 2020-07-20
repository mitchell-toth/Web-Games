//Checkers!
//Coded by Mitchell Toth
//https://cse.taylor.edu/~mtoth/Checkers/checkers.html


/*--------Global Variables--------*/
//Board details
const NUM_ROWS = 8;
const NUM_COLS = 8;

//Board content details:
const RED = "r";  //Also the variable representing the red player.
const RED_KING = "R";
const BLACK = "b";  //Also the variable representing the black player.
const BLACK_KING = "B";
const EMPTY = "e";

//Differentiate between human/computer in addition to red/black:
let HUMAN = RED;
let COMPUTER = BLACK;

//Difficulty levels:
let EASY = "Weak";
let INTERMEDIATE = "Strong";
let HARD = "Grandmaster";

//Move details:
let HUMAN_MOVE = null;
let TENTATIVE_MOVE = {"made": false, "type": null};
let TENTATIVE_JUMPED_SQUARES = {};
let MOVE_CONFIRMED = false;
let TURN = null;  //Used only to make sure the player can't drag a piece around while it's the enemy's turn.

//Game state details:
let GAME_IN_PROGRESS = false;
let HUMAN_RESIGNED = false;
let STALEMATE = false;
let MOVES_WITHOUT_JUMPING_OR_KINGING = 0;

//Sounds:
/*
const CHECKER_PLACEMENT_SOUND = new Audio();
CHECKER_PLACEMENT_SOUND.src = "./resources/checker_sound.mp3";
CHECKER_PLACEMENT_SOUND.volume = 0.1;
*/

//Miscellaneous:
let CHECKER_ID_COUNTER = 1;
let CLICK_CHECKER_SOURCE = null;  //Added to make the game mobile-friendly.
let FIRST_GAME_AFTER_PAGE_LOAD = true;  //Added to deal with checker piece colors.
let HUMAN_COLOR = "#FF0000";  //Red is default.
let COMPUTER_COLOR = "#000000";  //Black is default.
/*--------------------------------*/


//Create the visual DOM board. 
function createCheckersBoard(checkersBoard) {
	let farPiecesColor; let closePiecesColor;
	//Figure out which pieces should be close (always the human's) and far (always the computer's)
	if (HUMAN == RED) {
		farPiecesColor = BLACK;
		closePiecesColor = RED;
	}
	else {
		farPiecesColor = RED;
		closePiecesColor = BLACK;
	}
	//Go through all the board squares and populate them with checker pieces as needed.
	//Places the checkers in the starting setup.
	for (let r=0; r<NUM_ROWS; r++) {
		for (let c=0; c<NUM_COLS; c++) {
			//Remove any styling from previous games.
			checkersBoard.rows[r].cells[c].innerHTML = "";
			checkersBoard.rows[r].cells[c].classList = [];
			checkersBoard.rows[r].cells[c].style.transition = null;
			let checkerPiece = null;
			//This formula grabs the correct squares that need checker pieces.
			if (r <= 2 && (c+r)%2 == 1) {
				checkerPiece = generateCheckerPiece(farPiecesColor, true);
			}
			else if (r >= 5 && (c+r)%2 == 1) {
				checkerPiece = generateCheckerPiece(closePiecesColor, true);
			}
			if (checkerPiece) { checkersBoard.rows[r].cells[c].appendChild(checkerPiece); }
			
			//Give the square all of its needed 'drag' event listeners.
			//These give each square the ability to be a drag destination.
			checkersBoard.rows[r].cells[c].addEventListener("dragenter", function (event) { event.preventDefault(); });
			checkersBoard.rows[r].cells[c].addEventListener("dragover", function (event) { event.preventDefault(); });
			checkersBoard.rows[r].cells[c].addEventListener("drop", function (event) {
				event.preventDefault();
				//Upon dropping a dragged element into the square, do special stuff.
				//Namely, we have to handle the appending and make sure that the dropped item is legal.
				handleHumanDragMove(event, checkersBoard, this);			
			});
			//Added to make the game mobile-friendly. Allows players to click pieces around as well.
			checkersBoard.rows[r].cells[c].addEventListener("click", function (event) {
				handleHumanDragMove(event, checkersBoard, this);			
			});
		}
	}
}


//Create and return a logical 2D board based on the current state of the visual (DOM) checkers board.
//Used initially to create the "master" logicalBoard as the game starts up. 
//But also used throughout the code to better access the board state, generate legal moves, etc.
//Side note: I didn't want the "master" logicalBoard to be global, since users can alter global variables.
//	So I opted to keep it local as much as possible, which made things a bit more complex but safer.
function createLogicalBoard(checkersBoard) {
	let logicalBoard = [];
	//Loop through all the rows and columns and create a logical board.
	for (let r=0; r<NUM_ROWS; r++) {
		logicalBoard[r] = [];
		for (let c=0; c<NUM_COLS; c++) {
			//Use the class attributes of the cell children to determine red/black and king/not king.
			if (checkersBoard.rows[r].cells[c].children[0] && checkersBoard.rows[r].cells[c].children[0].classList.contains("redPiece")) {
				if (checkersBoard.rows[r].cells[c].children[0].classList.contains("king")) {
					logicalBoard[r][c] = RED_KING;
				}
				else { logicalBoard[r][c] = RED; }
			}
			else if (checkersBoard.rows[r].cells[c].children[0] && checkersBoard.rows[r].cells[c].children[0].classList.contains("blackPiece")) {
				if (checkersBoard.rows[r].cells[c].children[0].classList.contains("king")) {
					logicalBoard[r][c] = BLACK_KING;
				}
				else { logicalBoard[r][c] = BLACK; }
			}
			//Otherwise, mark the square as empty.
			else {
				logicalBoard[r][c] = EMPTY;
			}
		}
	}
	return logicalBoard;
}


//Generate a DOM checker piece.
//Additional parameters 'functional' and 'generateAsKing' allow it to be flexible and create
//	working/display pieces, as well as king/regular pieces.
function generateCheckerPiece(color, functional, generateAsKing=false) {
	let checkerPiece = document.createElement("div");
	checkerPiece.id = CHECKER_ID_COUNTER;  //ID value needed for the drag events to work properly.
	CHECKER_ID_COUNTER++;
	//Make the DOM parts and style them with classes.
	checkerPiece.classList.add("checkerPiece");
	checkerPiece.classList.add("blockCenter");
	let cc1 = document.createElement("div");  //Concentric circle 1.
	let cc2 = document.createElement("div");  //Concentric circle 2.
	cc1.classList.add("cc1");
	cc1.classList.add("blockCenter");
	cc2.classList.add("cc2");
	cc2.classList.add("blockCenter");
	cc1.appendChild(cc2);
	checkerPiece.appendChild(cc1);
	
	//Color the piece.
	if (color == RED) {
		checkerPiece.classList.add("redPiece");
	}
	else if (color == BLACK) {
		checkerPiece.classList.add("blackPiece");
	}
	else { console.warn("Invalid color parameter passed to 'generateCheckerPiece()'"); }
	//If the piece should be functional or not. Also, only add a drag event on human-controlled pieces.
	if (functional && color == HUMAN) {
		checkerPiece.draggable = true;
		checkerPiece.addEventListener("dragstart", function (event) {
			event.dataTransfer.setData('text', this.id);
		});
		//Added to make the game mobile-friendly. Allows players to click pieces around as well.
		checkerPiece.addEventListener("click", function (event) {
			if (!GAME_IN_PROGRESS) { return; }
			if (TURN != color) { return; }
			//Remove previous highlighting.
			if (CLICK_CHECKER_SOURCE && !TENTATIVE_MOVE.made) { 
				checkersBoard.rows[CLICK_CHECKER_SOURCE[0]].cells[CLICK_CHECKER_SOURCE[1]].classList.remove("tentativeMove_source"); 
			}
			CLICK_CHECKER_SOURCE = `${this.parentNode.parentNode.rowIndex}${this.parentNode.cellIndex}`;  //Set a global variable.
			//Highlight the square of the clicked checker.
			if (!TENTATIVE_MOVE.made) {
				checkersBoard.rows[CLICK_CHECKER_SOURCE[0]].cells[CLICK_CHECKER_SOURCE[1]].classList.add("tentativeMove_source");
			}
		});
	}
	//If the piece should be rendered as a king or not.
	if (generateAsKing) { checkerPiece.classList.add("king"); }
	return checkerPiece;
}


//Event handler that is called upon dropping an element into a board square.
//This function does a number of things related to the human's ability to move pieces.
//It checks if the move is legal, ensures that it is not an illegal 2nd move, and handles multiple jumps.
//It also ensures that the visual board gets updated as the human moves stuff around.
function handleHumanDragMove(event, checkersBoard, destination) {
	if (!GAME_IN_PROGRESS) { return; }  //Reject move if game is not going.
	if (TURN != HUMAN) { return; }  //Reject move if it is not the human's turn.
	
	let checkerPiece;
	if (event.type == "click") {
		if (!CLICK_CHECKER_SOURCE) { return; }
		checkerPiece = checkersBoard.rows[CLICK_CHECKER_SOURCE[0]].cells[CLICK_CHECKER_SOURCE[1]].children[0];
	}
	else {
		let id = event.dataTransfer.getData('text');
		checkerPiece = document.getElementById(id);
	}
	if (!checkerPiece) { return; }  //If the checker piece can't be found (undefined), return.
	
	//Now ensure that the move is legal. Make a logical board and use it to generate valid jumps and moves.
	let logicalBoard_temp = createLogicalBoard(checkersBoard);
	let validMoves = getAllValidMoves(logicalBoard_temp, HUMAN);
	let validJumps = getAllValidJumps(logicalBoard_temp, HUMAN);
	//Create the move string. Format: RC:RC:etc.
	let moveString = `${checkerPiece.parentNode.parentNode.rowIndex}${checkerPiece.parentNode.cellIndex}:${destination.parentNode.rowIndex}${destination.cellIndex}`;
	
	if (validJumps.length) {
		if (!ifItemInArray(moveString, validJumps)) { return; }  //Reject move if there's a jump to be made but the human's move is not a jump.
		//console.log(validJumps);
	}
	else {
		if (!ifItemInArray(moveString, validMoves)) { return; }  //Reject move if the player's move is invalid.
		//console.log(validMoves);
	}
	CLICK_CHECKER_SOURCE = `${destination.parentNode.rowIndex}${destination.cellIndex}`;
	
	if (TENTATIVE_MOVE.made) { 
		if (TENTATIVE_MOVE.type != "jump") { return; }  //Only allow moving again if there's multiple-jump possibilites.
		if (!ifItemInArray(moveString, validJumps)) { return; }  //So yeah, if the player's move is not a jump, no deal.
		//Grab the checker that was moved previously.
		let movedCheckerPiece = `${HUMAN_MOVE[HUMAN_MOVE.length-2]}${HUMAN_MOVE[HUMAN_MOVE.length-1]}`;
		//If the checker that the human just moved (as another jump) wasn't this original checker, reject the move.
		if (`${moveString[0]}${moveString[1]}` !=  movedCheckerPiece) { return; }
		//Otherwise, this must be the human adding onto the jump, thus making it a multiple jump.
		HUMAN_MOVE += `:${moveString[moveString.length-2]}${moveString[moveString.length-1]}`;
	}
	else {
		HUMAN_MOVE = moveString;
	}
	
	//Update the visual board to reflect the changes.
	changeVisualBoard(checkersBoard, moveString, checkerPiece, destination);
	TENTATIVE_MOVE.made = true;
	//Enable the 'Undo' and 'Confirm Move' buttons since a move has been made.
	document.getElementById("undoButton").disabled = false;
	document.getElementById("confirmMoveButton").disabled = false;
}


//Update the visual (DOM) board to reflect new human move changes.
//Called by the event handler 'handleHumanDragMove' above.
function changeVisualBoard(checkersBoard, moveString, checkerPiece, destination) {
	let move = parseMove(moveString);
	let isJump = (Math.abs(move.rs - move.rd) > 1);
	if (isJump) {  //Jump.
		TENTATIVE_MOVE.type = "jump";
		//Grab the coordinates of the jumped checker.
		let jumped_r = (move.rs + move.rd)/2;
		let jumped_c = (move.cs + move.cd)/2;
		let wasKing = (checkersBoard.rows[jumped_r].cells[jumped_c].children[0].classList.contains("king"));
		//Remove the checker from the board.
		checkersBoard.rows[jumped_r].cells[jumped_c].innerHTML = "";
		//But keep track of what it was (king or not), because the human might want to undo the move.
		TENTATIVE_JUMPED_SQUARES[`${jumped_r}${jumped_c}`] = wasKing;
	}
	else {  //Move.
		TENTATIVE_MOVE.type = "move";
	}
	//Add styling classes that show where the human has moved.
	checkersBoard.rows[move.rs].cells[move.cs].classList.remove("tentativeMove_destination");
	checkersBoard.rows[move.rs].cells[move.cs].classList.add("tentativeMove_source");
	checkersBoard.rows[move.rd].cells[move.cd].classList.add("tentativeMove_destination");
	//Finally, append the moved checker to the destination square. This also removes it from its original location automatically.
	destination.appendChild(checkerPiece);
	//CHECKER_PLACEMENT_SOUND.play();
}


//Helper function to parse out a move in the format RC:RC:etc.
function parseMove(str) {
	let length = str.length;
	return {
		"len": length,  //Move length.
		"rs": parseInt(str[0]),  //Row source.
		"cs": parseInt(str[1]),  //Column source.
		"rd": parseInt(str[length-2]),  //Row destination.
		"cd": parseInt(str[length-1])   //Column destination.
	};
}


//Called upon clicking 'Undo'.
//Returns the visual (DOM) board to its original state before the human moved.
//Since the logical board is not global (for integrity reasons), the switching-back is done manually.
function undoHumanMove() {
	let checkersBoard = document.getElementById("checkersBoard");
	//Get the human move.
	let move = parseMove(HUMAN_MOVE);
	let destination;
	//Now go through each part of the move, undoing the move/jump.
	for (let i=0; i<move.len-3; i+=3) {
		let source = checkersBoard.rows[HUMAN_MOVE[i]].cells[HUMAN_MOVE[i+1]];
		destination = checkersBoard.rows[HUMAN_MOVE[i+3]].cells[HUMAN_MOVE[i+4]];
		//Remove any styling.
		destination.classList.remove("tentativeMove_destination");
		destination.classList.remove("tentativeMove_source");
		//If the move was a jump, restore the checker that was jumped.
		let isJump = (Math.abs(parseInt(HUMAN_MOVE[i]) - parseInt(HUMAN_MOVE[i+3])) > 1);
		if (isJump) {
			let jumped_r = (parseInt(HUMAN_MOVE[i]) + parseInt(HUMAN_MOVE[i+3]))/2;
			let jumped_c = (parseInt(HUMAN_MOVE[i+1]) + parseInt(HUMAN_MOVE[i+4]))/2;
			let wasKing = TENTATIVE_JUMPED_SQUARES[`${jumped_r}${jumped_c}`];
			checkersBoard.rows[jumped_r].cells[jumped_c].appendChild(generateCheckerPiece(COMPUTER, true, wasKing));
		}
	}
	
	//Grab the checker and place it where it came from.
	let movedCheckerPiece = destination.children[0];
	let source = checkersBoard.rows[move.rs].cells[move.cs];
	source.classList.remove("tentativeMove_source");
	source.appendChild(movedCheckerPiece);
	
	//Reset global board state variables.
	TENTATIVE_MOVE.made = false;
	TENTATIVE_MOVE.type = null;
	TENTATIVE_JUMPED_SQUARES = {};
	HUMAN_MOVE = null;
	CLICK_CHECKER_SOURCE = null;
	//Disable the 'Undo' and 'Confirm Move' buttons again.
	document.getElementById("undoButton").disabled = true;
	document.getElementById("confirmMoveButton").disabled = true;
}


//Handle the crowning ceremony for a checker when it reaches the opponent's back row.
function crownHimWithManyCrowns(checkersBoard, logicalBoard, player, row, col, visual) {
	//Update the logical board.
	if (player == RED) { logicalBoard[row][col] = RED_KING; }
	else { logicalBoard[row][col] = BLACK_KING; }
	//Update the visual board by adding a 'king' class.
	if (visual) { 
		checkersBoard.rows[row].cells[col].children[0].classList.add("king"); 
		MOVES_WITHOUT_JUMPING_OR_KINGING = 0;  //A kinging move just happened. Reset the benign-moves counter.
	}
}


//By request of my mother, add each jumped checker to the side of the board so that 
//	you can easily see how the match is going.
//The checkers captured by the human always go on the left of the board, while the computer's on the right.
function addJumpedCheckerToSideOfBoard(checkersBoard, logicalBoard, jumped_r, jumped_c) {
	let jumpedChecker = logicalBoard[jumped_r][jumped_c];
	const kingTokens = [RED_KING, BLACK_KING];
	let humanTokens; let computerTokens;
	//Establish what 'tokens' belong to which player.
	if (HUMAN == RED) {
		humanTokens = [RED, RED_KING];
		computerTokens = [BLACK, BLACK_KING];
	}
	else {
		humanTokens = [BLACK, BLACK_KING];
		computerTokens = [RED, RED_KING];
	}
	//Jumped checker was one of the human's checkers. This checker will be placed on the RIGHT side of the board.
	if (ifItemInArray(jumpedChecker, humanTokens)) {
		let wasKing = false;
		if (ifItemInArray(jumpedChecker, kingTokens)) { wasKing = true; }
		let checkerCollectionArea = document.getElementById("rightCheckerSpace");
		const numRows = checkerCollectionArea.rows.length;
		const numCols = checkerCollectionArea.rows[0].cells.length;
		for (let c=0; c<numCols; c++) {
			for (let r=0; r<numRows; r++) {
				if (!checkerCollectionArea.rows[r].cells[c].childElementCount) {
					//Parameter 'functional' is false so that this new checker can't be moved around.
					checkerCollectionArea.rows[r].cells[c].appendChild(generateCheckerPiece(HUMAN, false, wasKing));
					return;
				}
			}
		}
	}
	//Jumped checker was one of the computers's checkers. This checker will be placed on the LEFT side of the board.
	else if (ifItemInArray(jumpedChecker, computerTokens)) {
		let wasKing = false;
		if (ifItemInArray(jumpedChecker, kingTokens)) { wasKing = true; }
		let checkerCollectionArea = document.getElementById("leftCheckerSpace");
		const numRows = checkerCollectionArea.rows.length;
		const numCols = checkerCollectionArea.rows[0].cells.length;
		for (let c=numCols-1; c>=0; c--) {
			for (let r=0; r<numRows; r++) {
				if (!checkerCollectionArea.rows[r].cells[c].childElementCount) {
					//Parameter 'functional' is false so that this new checker can't be moved around.
					checkerCollectionArea.rows[r].cells[c].appendChild(generateCheckerPiece(COMPUTER, false, wasKing));
					return;
				}
			}
		}
	}
	else {
		console.warn(`Jumped checker at row ${jumped_r} col ${jumped_c} was empty.`);
	}
}


//Called by the main game loop to get the human's move.
//The human is easy, from a programming perspective, because the human player is the one who decides on the best move!
//Essentially, this loops with a 'setInterval' until the human presses 'Confirm Move'.
function getHumanMove(logicalBoard, player) {
	//Wrapped in a promise.
	return new Promise((resolve) => {
		//Loop until global variables tell it to stop looping.
		let timerID = setInterval(() => {
			if (MOVE_CONFIRMED || HUMAN_RESIGNED || STALEMATE) { 
				clearInterval(timerID);
				MOVE_CONFIRMED = false;
				TENTATIVE_MOVE.made = false;
				TENTATIVE_MOVE.type = null;
				TENTATIVE_JUMPED_SQUARES = {};
				CLICK_CHECKER_SOURCE = null;
				resolve(HUMAN_MOVE);  //Resolve the move, sending it off to the main game loop.
				HUMAN_MOVE = null;
				document.getElementById("undoButton").disabled = true;
				document.getElementById("confirmMoveButton").disabled = true;
			}
		}, 200);
	});
}


//Called by the main game loop to get the computer's move.
//Based on the difficulty, get a move that the computer decides is the best.
function getComputerMove(logicalBoard, player, difficulty) {
	//Wrapped in a promise.
	return new Promise((resolve) => {
		//setTimeout is here so that the DOM can update before potentially 'freezing' (grandmaster level).
		setTimeout(() => {
			let moves = getAllLegalMoves(logicalBoard, player);
			//console.log(moves);
			let move;
			if (difficulty == EASY) {
				move = getRandomMove(logicalBoard, player, moves);  //Easy -- Simply pick a random move.
			}
			else if (difficulty == INTERMEDIATE) {
				move = getMinMaxMove(logicalBoard, player, 0, 3);  //Pretty dang hard -- Use min/max to look ahead 3 moves.
			}
			else if (difficulty == HARD) {
				move = getMinMaxMove(logicalBoard, player, 0, 7);  //Crazy hard -- Use min/max to look ahead 7 moves.
			}
			else {
				alert("Invalid difficulty level!");
			}
			resolve(move);
		}, 100);
	});
}


//Important function that is responsible for executing a given move.
//'Visual' mode means that an actual move is being played, and so the logicalBoard and DOM board must be updated.
//Otherwise, 'visual' as false means that the computer player is testing out moves to see how good they are.
function makeMove(checkersBoard, board, movePlayed, turn, visual=true) {	
	if (visual) {
		MOVES_WITHOUT_JUMPING_OR_KINGING++;  //Increment the benign-moves counter.
		for (let r=0; r<NUM_ROWS; r++) {
			for (let c=0; c<NUM_COLS; c++) {
				//Remove any class styling that is residual from previous moves.
				checkersBoard.rows[r].cells[c].classList = [];
			}
		}
	}
	//Update the logical board, looking only at source and destination.
	let move = parseMove(movePlayed);
	board[move.rd][move.cd] = board[move.rs][move.cs];
	board[move.rs][move.cs] = EMPTY;
	
	//Now update the logical board, looking also at any jumped checkers.
	for (let i=0; i<move.len-3; i+=3) {
		let isJump = (Math.abs(parseInt(movePlayed[i]) - parseInt(movePlayed[i+3])) > 1);
		if (isJump) {
			let jumped_r = (parseInt(movePlayed[i]) + parseInt(movePlayed[i+3]))/2;
			let jumped_c = (parseInt(movePlayed[i+1]) + parseInt(movePlayed[i+4]))/2;
			//Add jumped checker to side of board if in 'visual' mode.
			if (visual) { 
				addJumpedCheckerToSideOfBoard(checkersBoard, board, jumped_r, jumped_c); 
				MOVES_WITHOUT_JUMPING_OR_KINGING = 0;  //A jump was made. Reset the benign-moves counter.
			}
			board[jumped_r][jumped_c] = EMPTY;
		}
	}
	
	//If it was the computer's move last, handle the visual board change.
	//This is because the human's moves already change the board as they happen.
	if (turn == COMPUTER && visual) {
		let destination;
		for (let i=0; i<move.len-3; i+=3) {
			let source = checkersBoard.rows[movePlayed[i]].cells[movePlayed[i+1]];
			destination = checkersBoard.rows[movePlayed[i+3]].cells[movePlayed[i+4]];
			let isJump = (Math.abs(parseInt(movePlayed[i]) - parseInt(movePlayed[i+3])) > 1);
			if (isJump) {
				let jumped_r = (parseInt(movePlayed[i]) + parseInt(movePlayed[i+3]))/2;
				let jumped_c = (parseInt(movePlayed[i+1]) + parseInt(movePlayed[i+4]))/2;
				checkersBoard.rows[jumped_r].cells[jumped_c].innerHTML = "";
			}
			//Source -- style the computer's moves so that the human can see what the computer just did.
			source.classList.add("computerLatestMove_source");
			let checker = source.children[0];
			destination.appendChild(checker);
		}
		//Destination -- style the computer's moves so that the human can see what the computer just did.
		destination.classList.add("computerLatestMove_destination");
		//Re-enable the 'Offer Draw' button.
		document.getElementById("stalemateButton").disabled = false;
		let message = document.getElementById("gameOptionsMessage");
		//Erase any old message.
		message.style.color = "black";
		message.innerText = "";
		message.style.opacity = "0";
		//CHECKER_PLACEMENT_SOUND.play();
	}
	
	//Handle kinging
	let kingTokens = [RED_KING, BLACK_KING];
	if (turn == HUMAN) {
		//Human's target back row is always row 0.
		if (move.rd == 0 && !ifItemInArray(board[move.rd][move.cd], kingTokens)) {
			crownHimWithManyCrowns(checkersBoard, board, HUMAN, move.rd, move.cd, visual);
		}
	}
	else {
		//Computer's target back row is always row (NUM_ROWS-1).
		if (move.rd == NUM_ROWS-1 && !ifItemInArray(board[move.rd][move.cd], kingTokens)) {
			crownHimWithManyCrowns(checkersBoard, board, COMPUTER, move.rd, move.cd, visual);
		}
	}
	//if (visual) { print2DBoard(board); }
	return board;
}


//Helper function to help the main game loop switch turns.
function switchTurns(turn, gameMessage) {
	if (turn == RED) { turn = BLACK; }
	else { turn = RED; }
	TURN = turn;  //update the global 'TURN' variable as well. Used only for human move enforcement.
	if (turn == HUMAN) { gameMessage.innerText = "Your move"; gameMessage.style.color = HUMAN_COLOR; }
	else { gameMessage.innerText = "Opponent's move"; gameMessage.style.color = COMPUTER_COLOR; }
	return turn;
}


//Wrapper function to get the move from the player whose turn it is.
async function getPlayerMove(logicalBoard, turn, difficulty) {
	//Human's turn.
	if (turn == HUMAN) {
		move = await getHumanMove(logicalBoard, turn);
	}
	//The computer's turn.
	else {
		move = await getComputerMove(logicalBoard, turn, difficulty);
	}
	return move;
}


/*-----The main game loop-----*/
/*----------------------------*/
//Pretty simple really. It loops until there's a winner, getting moves and switching turns as it should.
async function startPlay(checkersBoard, logicalBoard, difficulty) {
	let gameMessage = document.getElementById("gameMessage");
	let winner = null;
	let move = null;
	let turn = RED;
	TURN = turn;
	if (turn == HUMAN) { gameMessage.innerText = "You start"; gameMessage.style.color = HUMAN_COLOR; }
	else { gameMessage.innerText = "Opponent starts"; gameMessage.style.color = COMPUTER_COLOR; }
	while (!winner) {
		move = await getPlayerMove(logicalBoard, turn, difficulty);
		if (!HUMAN_RESIGNED && !STALEMATE) { logicalBoard = makeMove(checkersBoard, logicalBoard, move, turn); }
		turn = switchTurns(turn, gameMessage);
		winner = checkGameStatus(logicalBoard, turn);
	}
	handleEndOfGame(checkersBoard, winner);
}
/*----------------------------*/
/*----------------------------*/


//Called upon clicking 'Switch Sides'. Simply changes some global variables and re-draws the visual board.
function switchSides() {
	if (HUMAN == RED) { HUMAN = BLACK; COMPUTER = RED; }
	else { HUMAN = RED; COMPUTER = BLACK; }
	//Swap the global color variables.
	let temp = HUMAN_COLOR;
	HUMAN_COLOR = COMPUTER_COLOR;
	COMPUTER_COLOR = temp;
	let checkersBoard = document.getElementById("checkersBoard");
	createCheckersBoard(checkersBoard);
}


//Helper function called by the main game loop to evaluate the game's state.
//It counts up the number of player pieces to determine if there's a winner.
//If either player has no moves left (but still pieces on the board), then the opponent is the winner.
//Also, some global variables are used to determine human-initiated changes to the game state,
//	such as an agreed-upon stalemate or the human's hopeless resignation.
function checkGameStatus(logicalBoard, turn) {
	let winner = null;
	let redPiecesCount = 0;
	let blackPiecesCount = 0;
	for (let r=0; r<NUM_ROWS; r++) {
		for (let c=0; c<NUM_COLS; c++) {
			if (logicalBoard[r][c] == RED || logicalBoard[r][c] == RED_KING) {
				redPiecesCount++;
			}
			else if (logicalBoard[r][c] == BLACK || logicalBoard[r][c] == BLACK_KING) {
				blackPiecesCount++;
			}
		}
	}
	if (redPiecesCount == 0) {
		winner = BLACK;
	}
	else if (turn == RED && getAllLegalMoves(logicalBoard, RED).length == 0) {
		winner = BLACK;
	}
	else if (blackPiecesCount == 0) {
		winner = RED;
	}
	else if (turn == BLACK && getAllLegalMoves(logicalBoard, BLACK).length == 0) {
		winner = RED;
	}
	else if (HUMAN_RESIGNED) {
		winner = COMPUTER;
	}
	else if (STALEMATE) {
		winner = "Stalemate";
	}
	else if (MOVES_WITHOUT_JUMPING_OR_KINGING == 100) {  //No action after 100 moves = automatic draw.
		winner = "Stalemate";
	}
	return winner;
}


//Called upon clicking 'Offer Draw'. The computer will evaluate the board state and determine if a draw is favorable or not.
function offerStalemate() {
	document.getElementById("stalemateButton").disabled = true;
	//Get a logical board based on the current game state.
	let checkersBoard = document.getElementById("checkersBoard");
	let logicalBoard_temp = createLogicalBoard(checkersBoard);
	let gameDifferential = (quantifyBoardPosition(logicalBoard_temp, COMPUTER, 10, 19) - quantifyBoardPosition(logicalBoard_temp, HUMAN, 10, 19));
	
	let playerTokens;
	if (COMPUTER == RED) { playerTokens = [RED, RED_KING]; }
	else { playerTokens = [BLACK, BLACK_KING]; }
	let computerPieceCount = 0;
	for (let r=0; r<NUM_ROWS; r++) {
		for (let c=0; c<NUM_COLS; c++) {
			if (ifItemInArray(logicalBoard_temp[r][c], playerTokens)) {
				computerPieceCount++;
			}
		}
	}
	let message = document.getElementById("gameOptionsMessage");
	//Accept a stalemate if the computer has a low enough amount of pieces AND the computer is either even with the human or at a disadvantage.
	let computerResponse = ((gameDifferential <= 0) && (computerPieceCount <= 4));
	if (computerResponse) { 
		//Stalemate accepted.
		message.style.color = "darkgreen";
		message.innerText = "Draw offer accepted";
		message.style.opacity = "1";
		STALEMATE = true; 
	}
	else {
		//Stalemate rejected.
		message.style.color = "darkred";
		message.innerText = "Draw offer rejected";
		message.style.opacity = "1";
	}
}


//Called upon clicking 'Resign'. The human must have a hopelessly lost position to resort to this...
function resign() {
	//Main thing is simply to set a global variable.
	HUMAN_RESIGNED = true;
	//But a message is also nice.
	let message = document.getElementById("gameOptionsMessage");
	message.style.color = "darkred";
	message.innerText = "You resigned";
	message.style.opacity = "1";
}


//Handy "Enter" key event listener to conveniently confirm a move.
//Also, "Backspace" key for 'undo'.
//Of course, the human can still click the buttons manually.
window.addEventListener("keyup", function(event) {
    if (event.key === 'Enter') {
		document.getElementById("confirmMoveButton").click();
    }
	else if (event.key === 'Backspace') {
		document.getElementById("undoButton").click();
	}
});


//To ensure accessibility to all the color blind folk out there, allow the user to change the colors of the checker pieces.
document.addEventListener("DOMContentLoaded", function() {
	//Computer's pieces.
	document.getElementById("computerColorPicker").addEventListener("change", function() {
		changePlayerColor(COMPUTER, this.value);
		setLocalStorageItem("Checkers_Computer_Color", COMPUTER_COLOR);
	});
	//Human's pieces.
	document.getElementById("humanColorPicker").addEventListener("change", function() {
		changePlayerColor(HUMAN, this.value);
		setLocalStorageItem("Checkers_Human_Color", HUMAN_COLOR);
	});
});


//Called upon changing the checker piece color-pickers. Changes the appropriate player's checkers to be the user's preferred color.
function changePlayerColor(player, preferredColor) {
	let pieceClass; 
	let border = "1pt solid #646262";
	if (player == RED) { pieceClass = ".redPiece"; }
	else { pieceClass = ".blackPiece"; }
	changeStyleCSS(`background-color: ${preferredColor}; border: ${border};`, pieceClass, "checkers");
	//Change game message color as well.
	if (player == COMPUTER) { COMPUTER_COLOR = preferredColor; }
	else { HUMAN_COLOR = preferredColor; }
	if (GAME_IN_PROGRESS && player == HUMAN) {
		document.getElementById("gameMessage").style.color = preferredColor;
	}
}


//Helper function used by the main game loop to implement the end-of-game event.
//Colors the board and displays a nice/taunting message based on win/stalemate/loss.
function handleEndOfGame(checkersBoard, winner) {
	GAME_IN_PROGRESS = false;  //Oficially end the game.

	//The human won!
	if (winner == HUMAN) {
		gameMessage.style.color = HUMAN_COLOR;
		gameMessage.innerText = `YOU WIN!`;
		gameMessage.innerText += "\nShow that computer who's boss!";
		colorWave(checkersBoard, "human_win_1", "human_win_2");
	}
	//The computer won...
	else if (winner == COMPUTER) {
		gameMessage.style.color = COMPUTER_COLOR;
		gameMessage.innerText = `YOU LOST!`;
		gameMessage.innerText += "\nBeaten by an inanimate object, huh? Pity...";
		colorWave(checkersBoard, "computer_win_1", "computer_win_2");
	}
	//There was a draw.
	else {
		if (MOVES_WITHOUT_JUMPING_OR_KINGING == 100) {
			gameMessage.innerText = `Draw!\n100 moves passed with no action...`;
		}
		else {
			gameMessage.innerText = `Draw!\nMaybe try to win next time? Just a thought...`;
		}
		gameMessage.style.color = "#747070";
		colorWave(checkersBoard, "stalemate_1", "stalemate_2");
	}
	//Hide and show various buttons. Namely, show the 'New Game' button.
	hide(document.getElementById("undoButton"));
	hide(document.getElementById("confirmMoveButton"));
	document.getElementById("stalemateButton").disabled = true;
	document.getElementById("resignButton").disabled = true;
	show(document.getElementById("newGameButton"));
}


//Create a nice color wave that will wash over the board.
//CSS transitions are used to give it a nice effect.
function colorWave(checkersBoard, colorClass1, colorClass2) {
	let transitionTime = 0.5;
	for (let r=0; r<NUM_ROWS; r++) {
		for (let c=0; c<NUM_COLS; c++) {
			checkersBoard.rows[r].cells[c].classList = [];
			checkersBoard.rows[r].cells[c].style.transition = "all " + transitionTime + "s";
			if ((c+r)%2 == 1) {
				checkersBoard.rows[r].cells[c].classList.add(colorClass1);
			}
			else {
				checkersBoard.rows[r].cells[c].classList.add(colorClass2);
			}
			transitionTime += 0.2;
		}
		transitionTime += 1;
	}
}


//Called upon clicking the 'More Options' button. Toggles the display of the game options.
function toggleGameOptions() {
	let optionsButton = document.getElementById("gameOptionsButton");
	let gameOptions = document.getElementById("gameOptions");
	if (isHidden(optionsButton)) {  //If the 'Options' button is hidden, then the game options must be showing. So hide them.
		show(optionsButton);
		hide(gameOptions);
	}
	else {  //Otherwise, the game options must be hidden. So unhide them.
		hide(optionsButton);
		show(gameOptions);
	}
}


//Helper function used to get the chosen difficulty level.
function getDifficulty() {
	let difficultyRadioButtons = document.getElementsByName("difficultySettings");
	let difficulty = EASY;
	//Iterate over the radio buttons to see which one is checked.
	for (let i=0; i<difficultyRadioButtons.length; i++) {
		if (difficultyRadioButtons[i].checked) {
			if (difficultyRadioButtons[i].value == "E") {
				difficulty = EASY; break;
			}
			else if (difficultyRadioButtons[i].value == "I") {
				difficulty = INTERMEDIATE; break;
			}
			else if (difficultyRadioButtons[i].value == "H") {
				difficulty = HARD; break;
			}
			else {
				alert("Invalid difficulty level!");
				return;
			}
		}
	}
	//Set up the difficulty message and return the difficulty. 
	document.getElementById("difficultyMessage").innerText = `Difficulty: ${difficulty}`;
	return difficulty;
}


//Called upon clicking the 'New Game' button. 
//Sets up everything to look like it originally did after first loading the page.
function newGame() {
	//Hide a bunch of buttons, and show the 'Switch Sides' button, 'Start Game' button, and difficulty options.
	hide(document.getElementById("gameOptionsButton"));
	hide(document.getElementById("gameOptions"));
	hide(document.getElementById("newGameButton"));
	hide(document.getElementById("difficultyMessage"));
	show(document.getElementById("switchSidesButton"));
	show(document.getElementById("startGameButton"));
	show(document.getElementById("gameDifficultySettings"));
	
	//Reset some messages.
	document.getElementById("gameMessage").innerText = "";
	let message = document.getElementById("gameOptionsMessage");
	message.style.color = "black";
	message.innerText = "";
	message.style.opacity = "0";
	
	//Empty the left and right checker collection spaces.
	let leftCheckerCollectionArea = document.getElementById("leftCheckerSpace");
	let rightCheckerCollectionArea = document.getElementById("rightCheckerSpace");
	const numRows = leftCheckerCollectionArea.rows.length;
	const numCols = leftCheckerCollectionArea.rows[0].cells.length;
	for (let c=0; c<numCols; c++) {
		for (let r=0; r<numRows; r++) {
			leftCheckerCollectionArea.rows[r].cells[c].innerHTML = "";
			rightCheckerCollectionArea.rows[r].cells[c].innerHTML = "";
		}
	}
	//Display the starting board position.
	createCheckersBoard(checkersBoard);
}


//Called upon clicking 'Start Game'. 
//Sets up everything as needed and then enters into the main game loop.
function startGame() {
	let checkersBoard = document.getElementById("checkersBoard");
	let logicalBoard = createLogicalBoard(checkersBoard);
	hide(document.getElementById("switchSidesButton"));
	hide(document.getElementById("startGameButton"));
	hide(document.getElementById("gameDifficultySettings"));
	show(document.getElementById("undoButton"));
	show(document.getElementById("confirmMoveButton"));
	show(document.getElementById("gameOptionsButton"));
	show(document.getElementById("difficultyMessage"));
	document.getElementById("stalemateButton").disabled = false;
	document.getElementById("resignButton").disabled = false;
	document.getElementById("humanColorPicker").value = HUMAN_COLOR;
	document.getElementById("computerColorPicker").value = COMPUTER_COLOR;
	FIRST_GAME_AFTER_PAGE_LOAD = false;
	let difficulty = getDifficulty();  //Get the chosen difficulty.
	//Reset some global variables.
	HUMAN_RESIGNED = false;
	STALEMATE = false;
	MOVES_WITHOUT_JUMPING_OR_KINGING = 0;
	GAME_IN_PROGRESS = true;  //Officially start the game.
	//Start the main game loop!
	startPlay(checkersBoard, logicalBoard, difficulty);
}


//Start up a new game. Called on initial page load.
function initializeGame() {
	let checkersBoard = document.getElementById("checkersBoard");
	//Get saved color values, if they exist. Otherwise, use defaults of red and black.
	HUMAN_COLOR = getLocalStorageItem("Checkers_Human_Color", HUMAN_COLOR);
	changePlayerColor(HUMAN, HUMAN_COLOR);
	COMPUTER_COLOR = getLocalStorageItem("Checkers_Computer_Color", COMPUTER_COLOR);
	changePlayerColor(COMPUTER, COMPUTER_COLOR);
	//Draw the board.
	createCheckersBoard(checkersBoard);
}


//On page load, initially create the board but don't start the game yet.
window.addEventListener("load", initializeGame);





/*--------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------------Move Generation Code---------------------------------------------*/


//The implementations for 'getAllValidMoves' and 'getAllValidJumps' were taken from earlier implementations
//	I had coded in Python (for one of my freshman level COS classes). 
//So I converted them over to JavaScript and made a few changes.
//But yeah, 'getAllValidMoves' only looks at normal moves (not jumps), and returns a list of all valid moves. 
function getAllValidMoves(logicalBoard, player) {
	let rowIncr;
	let playerTokens;
	if (player == HUMAN) { rowIncr = -1; }  //human means player's back row is row 7. So the player is moving UP the board.
	else { rowIncr = 1; }  //computer means player's back row is row 0. So the player is moving DOWN the board.
	
	if (player == RED) { playerTokens = [RED, RED_KING]; }
	else { playerTokens = [BLACK, BLACK_KING]; }
	
	let validMoves = [];
	let kingTokens = [RED_KING, BLACK_KING];
	for (let r=0; r<NUM_ROWS; r++) {
		for (let c=0; c<NUM_COLS; c++) {
			let p = logicalBoard[r][c];
			if (!ifItemInArray(p, playerTokens)) { continue; }
			if (!ifItemInArray(p, kingTokens)) {  //Piece is regular
				let deltas_c = [-1,1];
				for (let i=0; i<2; i++) {
					let c_i = deltas_c[i];
					if (ifInBounds(r+rowIncr) && ifInBounds(c+c_i) && logicalBoard[r+rowIncr][c+c_i] == EMPTY) {
						validMoves.push(`${r}${c}:${r+rowIncr}${c+c_i}`);
					}
				}
			}
			else {  //Piece is a king
				let deltas_r = [-1,1];
				let deltas_c = [-1,1];
				for (let i=0; i<2; i++) {
					let r_i = deltas_r[i];
					for (let q=0; q<2; q++) {
						let c_i = deltas_c[q];
						if (ifInBounds(r+r_i) && ifInBounds(c+c_i) && logicalBoard[r+r_i][c+c_i] == EMPTY) {
							validMoves.push(`${r}${c}:${r+r_i}${c+c_i}`);
						}
					}
				}
			}
		}
	}
    return validMoves;
}


//'getAllValidJumps' looks at all available jumps, and returns a list of all the valid ones.
//Special care is given to evaluate all multiple jumps as well, which is harder than you might think.
function getAllValidJumps(logicalBoard, player) {
	let rowIncr;
	let playerTokens; let enemyTokens;
	if (player == HUMAN) { rowIncr = -1; }  //human means player's back row is row 7. So the player is moving UP the board.
	else { rowIncr = 1; }  //computer means player's back row is row 0. So the player is moving DOWN the board.
	
	if (player == RED) { playerTokens = [RED, RED_KING]; enemyTokens = [BLACK, BLACK_KING]; }
	else { playerTokens = [BLACK, BLACK_KING]; enemyTokens = [RED, RED_KING]; }
	
	let validSingleJumps = [];
	let kingTokens = [RED_KING, BLACK_KING];
	for (let r=0; r<NUM_ROWS; r++) {
		for (let c=0; c<NUM_COLS; c++) {
			let p = logicalBoard[r][c];
			if (!ifItemInArray(p, playerTokens)) { continue; }
			if (!ifItemInArray(p, kingTokens)) {  //Piece is regular
				let deltas_c = [-1,1];
				for (let i=0; i<2; i++) {
					let c_i = deltas_c[i];
					if (ifInBounds(r+rowIncr) && ifInBounds(c+c_i) && ifItemInArray(logicalBoard[r+rowIncr][c+c_i], enemyTokens)) {
						let rowJumpIncr = rowIncr*2;
						let colJumpIncr = c_i*2;
						if (ifInBounds(r+rowJumpIncr) && ifInBounds(c+colJumpIncr) && logicalBoard[r+rowJumpIncr][c+colJumpIncr] == EMPTY) {
							validSingleJumps.push(`${r}${c}:${r+rowJumpIncr}${c+colJumpIncr}`);
						}
					}
				}
			}
			else {  //Piece is a king
				let deltas_r = [-1,1];
				let deltas_c = [-1,1];
				for (let i=0; i<2; i++) {
					let r_i = deltas_r[i];
					for (let q=0; q<2; q++) {
						let c_i = deltas_c[q];
						if (ifInBounds(r+r_i) && ifInBounds(c+c_i) && ifItemInArray(logicalBoard[r+r_i][c+c_i], enemyTokens)) {
							let rowJumpIncr = r_i*2;
							let colJumpIncr = c_i*2;
							if (ifInBounds(r+rowJumpIncr) && ifInBounds(c+colJumpIncr) && logicalBoard[r+rowJumpIncr][c+colJumpIncr] == EMPTY) {
								validSingleJumps.push(`${r}${c}:${r+rowJumpIncr}${c+colJumpIncr}`);
							}
						}
					}
				}
			}
		}
	}

	//At this point, all the single jumps are accounted for. What we need now is to expand this list and get all the mutliple jumps too.
	let validJumps = [];
	validJumps = findAnyMultipleJumps(logicalBoard, player, validSingleJumps);  //Get all the multiple jumps.
	
	//But what actually happened there is that each single jump got expanded into a multiple jump (if the jump had a continuation).
	//But we want ALL possible jumps, so the loop below takes care to get all "sub-jumps" within the list of expanded jumps.
	let numJumps = validJumps.length;
	for (let i=0; i<numJumps; i++) {
		let jump = validJumps[i];
		let jumpLength = jump.length;
		if (jumpLength > 5) {
			let r_start = jump[0];
			let c_start = jump[1];
			let previousJump = null;
			for (let p=3; p<jumpLength-2; p+=3) {
				if (!previousJump) {
					validJumps.push(`${r_start}${c_start}:${jump[p]}${jump[p+1]}`);
					previousJump = `${r_start}${c_start}:${jump[p]}${jump[p+1]}`;
				}
				else {
					validJumps.push(`${previousJump}:${jump[p]}${jump[p+1]}`);
					previousJump = `${previousJump}:${jump[p]}${jump[p+1]}`;
				}
			}
		}
	}
	return validJumps;
}


//Helper function used to expand a list of single jumps into a list of multiple jumps (supposing the original jump had a continuation).
function findAnyMultipleJumps(logicalBoard, player, jumps_old) {
	//Expand the list of jumps by going one layer deeper.
	let jumps_new = expandJumps(logicalBoard, player, jumps_old);
	//So long as expanding the list changes the list, keep going another level deeper.
    while (!arraysEqual(jumps_new, jumps_old)) {
        jumps_old = JSON.parse(JSON.stringify(jumps_new));
        jumps_new = expandJumps(logicalBoard, player, jumps_old)
	}
	//Return the expanded jumps list.
    return jumps_new;
}


//Helper function used to expand a list of jumps one level deeper.
//It does this by taking the last part of each move and seeing if any more jumps exist from that spot.
//If so, append the new destination square onto the jump string.
function expandJumps(logicalBoard, player, jumps) {
	let incrs = [1,-1];
    let rowIncr;
	let playerTokens; let enemyTokens;
	if (player == HUMAN) { rowIncr = -1; }
	else { rowIncr = 1; }
	
	if (player == RED) { playerTokens = [RED, RED_KING]; enemyTokens = [BLACK, BLACK_KING]; }
	else { playerTokens = [BLACK, BLACK_KING]; enemyTokens = [RED, RED_KING]; }
	let kingTokens = [RED_KING, BLACK_KING];
	
	let jumps_new = [];
	let length = jumps.length;
	for (let i=0; i<length; i++) {
		let jump = jumps[i];
		let r = parseInt(jump[jump.length-2]);
		let c = parseInt(jump[jump.length-1]);
		jumps_new.push(jump);
		let r_start = parseInt(jump[0]);
		let c_start = parseInt(jump[1]);
		if (!ifItemInArray(logicalBoard[r_start][c_start], kingTokens)) {  //Piece is regular
			for (let q=0; q<2; q++) {
				let c_i = incrs[q];
				let r_jump = r+rowIncr;
				let c_jump = c+c_i;
				let r_destination = r + (rowIncr*2);
				let c_destination = c + (c_i*2);
				if (ifInBounds(r_jump) && ifInBounds(c_jump) && ifInBounds(r_destination) && ifInBounds(c_destination)) {
					if (ifItemInArray(logicalBoard[r_jump][c_jump], enemyTokens) && logicalBoard[r_destination][c_destination] == EMPTY) {
						jumps_new.push(`${jump}:${r_destination}${c_destination}`);
						if (ifItemInArray(jump, jumps_new)) {
							jumps_new.splice(jumps_new.indexOf(jump), 1);
						}
					}
				}
			}
		}
		else {  //Piece is a king
			for (let q=0; q<2; q++) {
				let c_i = incrs[q];
				for (let p=0; p<2; p++) {
					let r_i = incrs[p];
					let r_jump = r+r_i;
					let c_jump = c+c_i;
					let r_destination = r + (r_i*2);
					let c_destination = c + (c_i*2);
					//Oh boy. Totally readable, clean conditional statement below. You could lick your breakfast off of it it's so clean.
					if (ifInBounds(r_jump) && ifInBounds(c_jump) && ifInBounds(r_destination) && ifInBounds(c_destination)) {
						if (ifItemInArray(logicalBoard[r_jump][c_jump], enemyTokens)) {
							if (logicalBoard[r_destination][c_destination] == EMPTY || (`${r_start}${c_start}` == `${r_destination}${c_destination}`)) {
								if (!jump.includes(`${r}${c}:${r_destination}${c_destination}`)) {
									if (!jump.includes(`${r_destination}${c_destination}:${r}${c}`)) {
										if (`${r_destination}${c_destination}` != `${jump[jump.length-5]}${jump[jump.length-4]}`) {
											jumps_new.push(`${jump}:${r_destination}${c_destination}`);
											if (ifItemInArray(jump, jumps_new)) {
												jumps_new.splice(jumps_new.indexOf(jump), 1);
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
    return jumps_new; 
}


//Helper function to check if an index is within the bounds of the board.
function ifInBounds(num) {
	let validRange = [];
	for (let i=0; i<NUM_ROWS; i++) {
		validRange.push(i);
	}
	return ifItemInArray(parseInt(num), validRange);
}


//Helper function to get all "legal" moves.
//Essentially this combines 'getAllValidMoves' and 'getAllValidJumps' by returning one list or the other.
//This, of course, is because if there's a jump then it has to be taken.
function getAllLegalMoves(board, player) {
	let validMoves = getAllValidMoves(board, player);
	let validJumps = getAllValidJumps(board, player);
	if (validJumps.length) { return validJumps; }
	else { return validMoves; }
}


//Evaluates the board position for a given player by assigning a number to each piece.
//Regular pieces get 'regularPieceValue' while kings get 'kingPieceValue'.
//This is how I chose to evaluate if a move is good or not. 
//After making a move, the material value of the player's board state can be evaluated.
//And this is especially valuable information after comparing it to the opponent player's material value.
function quantifyBoardPosition(logicalBoard, player, regularPieceValue, kingPieceValue) {
	let playerTokens; let enemyTokens;
	let numPlayerPieces = 0; let numEnemyPieces = 0;
	const kingTokens = [RED_KING, BLACK_KING];
	if (player == RED) { playerTokens = [RED, RED_KING]; enemyTokens = [BLACK, BLACK_KING]; }
	else { playerTokens = [BLACK, BLACK_KING]; enemyTokens = [RED, RED_KING]; }
	let value = 0;
	let enemyValue = 0;
	//Accumulate the worth of the player's board position in 'val'.
	//And while doing so, count up the number of player pieces and enemy pieces.
	for (let r=0; r<NUM_ROWS; r++) {
		for (let c=0; c<NUM_COLS; c++) {
			let squareContent = logicalBoard[r][c];
			if (ifItemInArray(squareContent, playerTokens)) {
				numPlayerPieces++;
				if (ifItemInArray(squareContent, kingTokens)) { value += kingPieceValue; }
				else { value += regularPieceValue; }
			}
			else if (ifItemInArray(squareContent, enemyTokens)) {
				numEnemyPieces++;
				if (ifItemInArray(squareContent, kingTokens)) { enemyValue += kingPieceValue; }
				else { enemyValue += regularPieceValue; }
			}
		}
	}
	//Get the number of moves each player would have at this board position.
	let numPlayerMoves = getAllLegalMoves(logicalBoard, player);
	let numEnemyMoves = getAllLegalMoves(logicalBoard, enemyTokens[0]);
	
	//Here I have chosen to introduce a 'win' and 'lose' bias.
	let winBias = 0;
	let loseBias = 0;
	//If the board position shows the player winning, then weight that scenario very highly. Absolutely pursue this position!
	if (numEnemyPieces == 0) { winBias = 1000; }
	//If the board position shows the player losing, then give it negative worth. Absolutely avoid this position!
	if (numPlayerPieces == 0) { loseBias = -1000; }
	//Introduce an evaluation bias to favor positions where the enemy has no moves left (which means the player wins!).
	//And avoid board positions where the player has no moves left (which means the player loses!).
	if (numEnemyMoves.length == 0) { winBias += 500; }
	if (numPlayerMoves.length == 0) { loseBias += -500; }
	
	let lessPiecesOnTheBoardBias = 0;
	if (value >= enemyValue && numEnemyPieces <= 5) { lessPiecesOnTheBoardBias = (5-numEnemyPieces); }
	
	return value + winBias + loseBias + lessPiecesOnTheBoardBias;
}


//Implementation of 'Weak' difficulty mode. Simply pick a random move.
function getRandomMove(logicalBoard, player, moves) {
	let randomIdx = Math.floor(Math.random()*moves.length);
	return moves[randomIdx];
}


/*
Implementation of 'Strong' and 'Grandmaster' difficulty modes.
I chose to use the concept behind the min/max algorithm to create a recursive look-ahead-based solution.
Essentially, it explores the full move tree for each of the original moves, up to depth 'maxDepth'.
At each leaf node (when 'depth' == 'maxDepth'), evaluate the player's relative advantage. This is done
	by creating what I call a board position 'differential', which is the difference between one player's 
	material value and the other player's, for a given board position.
These relative advantage values are propagated up the chain, where either the max or min aggregates are taken,
	depending on the depth.
So the Computer is trying to MAXimize its differential, whereas the human is trying to MINimize it.
Eventually, this gets up to very top, where the max is taken. The move corresponding to this max value is chosen.
Or if there are multiple moves, take a random one from the list of the best ones.
*/
function getMinMaxMove(logicalBoard, player, depth, maxDepth) {
	let moves = getAllLegalMoves(logicalBoard, player);
	//If only one move, no need to look ahead. This move has to be taken.
	if (moves.length == 1) {
		return moves[0];
	}
	let maxValue = null;
	let movesAndValues = {};  //Keep track of the move-value associations with an object.
	let bestMoveArray = [];
	let bestMove;
	//Depth = 0
	//Iterate over all the possible moves, seeing which ones produce the best (maximum) result.
	for (let i=0; i<moves.length; i++) {
		let move = moves[i];
		let board = JSON.parse(JSON.stringify(logicalBoard));
		//Make the move.
		board = makeMove(null, board, move, player, false);
		let value = minMax(board, depth+1, maxDepth, -9999, 9999);
		//console.log(`Move: ${move}, Value: ${value}`);
		movesAndValues[move] = value;
		if (maxValue == null || value > maxValue) {
			maxValue = value;
		}
	}
	//Keep track of all the moves that give the maximum gain (there may be multiple).
	for (let i=0; i<moves.length; i++) {
		let move = moves[i];
		if (movesAndValues[move] == maxValue) {
			bestMoveArray.push(move);
		}
	}
	//Randomly index into the 'bestMoveArray'. The result is the best move available (or one of them, at least).
	let randomIdx = Math.floor(Math.random()*bestMoveArray.length);
	bestMove = bestMoveArray[randomIdx];
	//console.log("\n");
	return bestMove;
}


//The actual recursive function in my min/max implementation.
//This one goes to deep, dark depths of look-ahead land.
function minMax(logicalBoard, depth, maxDepth, alpha, beta) {
	//Depth = 1+
	let player;
	//Take the maximum differential on even-numbered depths.
	if (depth%2 == 0) {
		player = COMPUTER;
	}
	//Take the minimum differential on odd-numbered depths.
	else {
		player = HUMAN;
	}
	
	//Get all moves available with this board state.
	let moves = getAllLegalMoves(logicalBoard, player);
	//The base case: when the depth has reached 'maxDepth' or when there are no moves left.
	if (depth == maxDepth || moves.length == 0) {
		//Return the differential.
		let differential = quantifyBoardPosition(logicalBoard, COMPUTER, 10, 19) - quantifyBoardPosition(logicalBoard, HUMAN, 10, 19);
		return differential;
	}
	let max = null;
	let min = null;
	//Iterate over all available moves.
	for (let i=0; i<moves.length; i++) {
		let move = moves[i];
		let board = JSON.parse(JSON.stringify(logicalBoard));
		//Make the move.
		board = makeMove(null, board, move, player, false);
		let value = minMax(board, depth+1, maxDepth, alpha, beta);
		
		//Keep track of min and max values seen so far.
		if (max == null || value > max) { max = value; }
		if (min == null || value < min) { min = value; }
		
		//Alpha-beta pruning:
		if (player == COMPUTER) {  //Maximizing player. The computer.
			if (max > alpha) { alpha = max; }
		}
		else {  //Minimizing player. The human.
			if (min < beta) { beta = min; }
		}
		if (alpha >= beta) { break; }  //No need to look down this tree further.
	}
	//Return either the min or max.
	if (player == COMPUTER) { return max; }
	else { return min; }
}