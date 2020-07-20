//Minesweeper!
//Coded by Mitchell Toth
//https://cse.taylor.edu/~mtoth/Minesweeper/minesweeper.html
//Images and icons made by Colin Toth

//Global variables
const MINE = "X";
const WIN = "WIN";
const LOSS = "LOSS";
const CONTINUE = "CONTINUE";
let NUMROWS = 16;
let NUMCOLS = 16;
let NUMMINES = 40;
let GAMEOVER = false;
let FIRSTCLICK = true;
const MAXROWS = 50;
const MAXCOLS = 50;

//Audio objects.
const mineSound = new Audio();
mineSound.src = "./resources/mine_sound.mp3";
const flagSound = new Audio();
flagSound.src = "./resources/flag_sound.mp3";
const winSound = new Audio();
winSound.src = "./resources/win_sound.mp3";

//Simple timer.
const timer = document.getElementById("timer");
let timerIntervalID;

//Number of mines left.
const numMinesLeft = document.getElementById("numMinesLeft");


//Create the visual board and logical board.
function buildBoard(mineSweeperBoard, numRows, numCols) {
	let logicalBoard = [];
	mineSweeperBoard.innerHTML = "";
	
	for (let r=0; r<numRows; r++) {
		boardRow = document.createElement("tr");
		logicalBoard[r] = [];
		for (let c=0; c<numCols; c++) {
			boardCol = document.createElement("td");
			boardCol.classList.add("unclicked");
			boardRow.appendChild(boardCol);
			logicalBoard[r][c] = {"content": 0, "visible": false, "flagged": false};
		}
		mineSweeperBoard.appendChild(boardRow);
	}
	return logicalBoard;
}


//Helper function to print out the logical board.
function printBoard(board) {
	for (let r=0; r<board.length; r++) {
		let row = "";
		for (let c=0; c<board[0].length; c++) {
			row += board[r][c].content + " ";
		}
		console.log(row);
	}
}


//Helper function to check if row and col coordinates are in bounds.
function ifInBounds(board, row, col) {
	if (row < 0 || col < 0 || row >= board.length || col >= board[0].length) {
		return false;
	}
	return true;
}


//Set the numbering around the mines.
function updateNumbering(logicalBoard, mineLocation) {
	let deltaArray = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
	for (let i=0; i<deltaArray.length; i++) {
		let deltas = deltaArray[i];
		let r = mineLocation.row + deltas[0];
		let c = mineLocation.col + deltas[1];
		if (ifInBounds(logicalBoard, r, c)) {
			if (logicalBoard[r][c].content != MINE) {
				logicalBoard[r][c].content++;
			}
		}
	}
	return logicalBoard;
}


//Place the mines.
function placeMinesAndConfigureBoard(logicalBoard, numMines) {
	const numRows = logicalBoard.length;
	const numCols = logicalBoard[0].length;
	let availablePositions = numRows * numCols;
	let availablePositionsArray = [];
	for (let i=0; i<availablePositions; i++) {
		let r = Math.floor(i/numCols);
		let c = i%numCols;
		availablePositionsArray.push({"row": r, "col": c});
	}
	
	availablePositionsArray = shuffleArray(availablePositionsArray);
	for (let i=0; i<numMines; i++) {
		let p = availablePositionsArray[i];
		logicalBoard[p.row][p.col].content = MINE;
		logicalBoard = updateNumbering(logicalBoard, p);
	}
	return logicalBoard;
}


//Called when a player clicks a valid square, displays the content and updates the logical board.
function displayContent(logicalBoard, mineSweeperBoard, r, c) {
	logicalBoard[r][c].visible = true;
	toggleFlag(r, c, logicalBoard, mineSweeperBoard, true);
	let square = mineSweeperBoard.rows[r].cells[c];
	let squareContent = logicalBoard[r][c].content;
	
	//Add styling classes based on content.
	let stylingClasses = {0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight"};
	square.classList = ["clicked"];
	if (squareContent == MINE) { square.classList.add("mine"); }
	else { square.classList.add(stylingClasses[squareContent]); }
	
	//If the square is a zero, automatically make the adjacent squares visible.
	if (squareContent == 0) {
		//Display content.
		square.innerText = "";
		let deltaArray = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
		for (let i=0; i<deltaArray.length; i++) {
			let deltas = deltaArray[i];
			let adjRow = r + deltas[0];
			let adjCol = c + deltas[1];
			if (ifInBounds(logicalBoard, adjRow, adjCol)) {
				if (logicalBoard[adjRow][adjCol].content != MINE && logicalBoard[adjRow][adjCol].visible == false) {
					displayContent(logicalBoard, mineSweeperBoard, adjRow, adjCol);
				}
			}
		}
	}
	//If the square is a mine, display a mine icon.
	else if (squareContent == MINE) {
		//Mine icon
		let mineImg = document.createElement("img");
		mineImg.src = "./resources/mine_image_small.png";
		mineImg.style.width = "16px";
		mineImg.style.height = "16px";
		square.appendChild(mineImg);
	}
	//If the square is a number square, display the content as is.
	else {
		//Display content.
		square.innerText = squareContent;
	}
}


//Called when a player clicks a valid square, checks if player won/lost.
function checkGameStatus(logicalBoard, mineSweeperBoard, numMines) {
	const totalSquaresMinusMines = (logicalBoard.length * logicalBoard[0].length) - numMines;
	let visibleSquares = 0;
	for (let r=0; r<logicalBoard.length; r++) {
		for (let c=0; c<logicalBoard[0].length; c++) {
			if (logicalBoard[r][c].visible) {
				if (logicalBoard[r][c].content == MINE) {
					return LOSS;
				}
				visibleSquares++;
			}
		}
	}
	if (visibleSquares == totalSquaresMinusMines) {
		winSound.play();
		return WIN;
	}
	else {
		return CONTINUE;
	}
}


//Show locations of all mines, called when game is won or lost.
function showMineLocations(logicalBoard, mineSweeperBoard, gameStatus) {
	for (let r=0; r<logicalBoard.length; r++) {
		for (let c=0; c<logicalBoard[0].length; c++) {
			if (logicalBoard[r][c].content == MINE && !logicalBoard[r][c].visible) {
				let square = mineSweeperBoard.rows[r].cells[c];
				displayContent(logicalBoard, mineSweeperBoard, r, c);
				if (gameStatus == WIN) {
					square.classList.add("defaultBackground");
				}
			}
			//If there's a flag in a location that isn't a mine, replace it's image with the crossed-out flag image.
			else if (logicalBoard[r][c].flagged && logicalBoard[r][c].content != MINE) {
				let square = mineSweeperBoard.rows[r].cells[c];
				square.innerHTML = "";
				let wrongFlagImg = document.createElement("img");
				wrongFlagImg.src = "./resources/wrong_flag_image_small.png";
				wrongFlagImg.style.width = "16px";
				wrongFlagImg.style.height = "16px";
				square.appendChild(wrongFlagImg);
			}
		}
	}
	if (gameStatus == WIN) {
		numMinesLeft.innerText = 0;
	}
	else if (gameStatus == LOSS) {
		numMinesLeft.innerText = NUMMINES;
	}
}


//Do a fancy color pattern when the game is won or lost.
function colorWave(logicalBoard, mineSweeperBoard, upperLeftCorner, lowerRightCorner, color) {
	let transitionTime = 1;
	while(upperLeftCorner.row >= 0 || upperLeftCorner.col >= 0 || lowerRightCorner.row < logicalBoard.length || lowerRightCorner.col < logicalBoard[0].length) {
		let numSquaresDown = lowerRightCorner.row - upperLeftCorner.row;
		for (let i=0; i<=numSquaresDown; i++) {
			if (ifInBounds(logicalBoard, upperLeftCorner.row+i, upperLeftCorner.col) && logicalBoard[upperLeftCorner.row+i][upperLeftCorner.col].content != MINE) {
				mineSweeperBoard.rows[upperLeftCorner.row+i].cells[upperLeftCorner.col].style.transition = "background-color " + transitionTime + "s";
				mineSweeperBoard.rows[upperLeftCorner.row+i].cells[upperLeftCorner.col].style.backgroundColor = color;
			}
			if (ifInBounds(logicalBoard, lowerRightCorner.row-i, lowerRightCorner.col) && logicalBoard[lowerRightCorner.row-i][lowerRightCorner.col].content != MINE) {
				mineSweeperBoard.rows[lowerRightCorner.row-i].cells[lowerRightCorner.col].style.transition = "background-color " + transitionTime + "s";
				mineSweeperBoard.rows[lowerRightCorner.row-i].cells[lowerRightCorner.col].style.backgroundColor = color;
			}
		}
		let numSquaresRight = lowerRightCorner.col - upperLeftCorner.col;
		for (let i=0; i<=numSquaresRight; i++) {
			if (ifInBounds(logicalBoard, upperLeftCorner.row, upperLeftCorner.col+i) && logicalBoard[upperLeftCorner.row][upperLeftCorner.col+i].content != MINE) {
				mineSweeperBoard.rows[upperLeftCorner.row].cells[upperLeftCorner.col+i].style.transition = "background-color " + transitionTime + "s";
				mineSweeperBoard.rows[upperLeftCorner.row].cells[upperLeftCorner.col+i].style.backgroundColor = color;
			}
			if (ifInBounds(logicalBoard, lowerRightCorner.row, lowerRightCorner.col-i) && logicalBoard[lowerRightCorner.row][lowerRightCorner.col-i].content != MINE) {
				mineSweeperBoard.rows[lowerRightCorner.row].cells[lowerRightCorner.col-i].style.transition = "background-color " + transitionTime + "s";
				mineSweeperBoard.rows[lowerRightCorner.row].cells[lowerRightCorner.col-i].style.backgroundColor = color;
			}
		}
		
		upperLeftCorner.row--; upperLeftCorner.col--;
		lowerRightCorner.row++; lowerRightCorner.col++;
		transitionTime++;
	}
}


//Place or remove a flag at the given coordinates, unFlagMode is used when looping over the board to remove all flags.
function toggleFlag(r, c, logicalBoard, mineSweeperBoard, unFlagMode) {
	//Toggle flagged boolean value in logical board.
	if (logicalBoard[r][c].flagged) {
		numMinesLeft.innerText++;
		logicalBoard[r][c].flagged = false;
	}
	else {
		if (!unFlagMode) {
			logicalBoard[r][c].flagged = true;
		}
	}
	let square = mineSweeperBoard.rows[r].cells[c];
	if (!unFlagMode && logicalBoard[r][c].flagged) {
		numMinesLeft.innerText--;
		//Flag icon
		let flagImg = document.createElement("img");
		flagImg.src = "./resources/flag_image_small.png";
		flagImg.style.width = "16px";
		flagImg.style.height = "16px";
		flagImg.classList.add("letPass");
		square.appendChild(flagImg);  //Add flag icon if flagging square.
	}
	else {
		square.innerHTML = "";  //Remove flag icon if "un-flagging".
	}
}


//Event listener to take care of player moves.
function handlePlayerClick(e, logicalBoard, mineSweeperBoard, numMines, isRightClick) {
	if (GAMEOVER) {return;}  //Ignore if game is won/lost.
	if (e.target.cellIndex == undefined && !e.target.classList.contains("letPass")) {return;}  //Ignore clicks that are outside data cells, but allow items with class "letPass".
	let square = e.target;
	if (e.target.classList.contains("letPass")) {
		while(square.cellIndex == undefined) {
			square = square.parentNode;
		}
	}
	let c = square.cellIndex;
	let row = square.parentElement;
	let r = row.rowIndex;
	if (logicalBoard[r][c].visible) {return;}  //Ignore already visible squares.
	
	//Place flag then return if click is right click.
	if (isRightClick || document.getElementById("flagModeCheckBox").checked) {
		flagSound.play();
		toggleFlag(r, c, logicalBoard, mineSweeperBoard, false);
		return;
	}
	
	if (logicalBoard[r][c].flagged) {return;}  //Don't allow player to click flagged squares.
	
	if (logicalBoard[r][c].content == MINE) { 
		mineSound.play(); 
	}
	
	//Start timer when player makes first move.
	if (FIRSTCLICK) {
		timer.innerText = 0;
		timerIntervalID = setInterval(function() {
			timer.innerText++;
		}, 1000);
		FIRSTCLICK = false;
	}
	
	displayContent(logicalBoard, mineSweeperBoard, r, c);  //Show what's beneath the click location.
	const gameStatus = checkGameStatus(logicalBoard, mineSweeperBoard, numMines);
	if (gameStatus == WIN || gameStatus == LOSS) {
		GAMEOVER = true;
		clearInterval(timerIntervalID);
		showMineLocations(logicalBoard, mineSweeperBoard, gameStatus);
		let upperLeftCorner = {"row": r, "col": c};
		let lowerRightCorner = {"row": r, "col": c};
		let color = "";
		if (gameStatus == WIN) {color = "lightgreen";}
		else if (gameStatus == LOSS) {color = "indianred";}
		colorWave(logicalBoard, mineSweeperBoard, upperLeftCorner, lowerRightCorner, color);
	}
}


//Initialize the board and start the game.
function setUpGame(numRows, numCols, numMines) {
	GAMEOVER = false;
	FIRSTCLICK = true;
	timer.innerText = 0;
	numMinesLeft.innerText = numMines;
	clearInterval(timerIntervalID);
	
	let mineSweeperBoard = document.getElementById("mineSweeperBoard");
	let logicalBoard = buildBoard(mineSweeperBoard, numRows, numCols);
	logicalBoard = placeMinesAndConfigureBoard(logicalBoard, numMines);
	
	//Clone the board so as to remove any previous click event listener.
	let mineSweeperBoardOld = mineSweeperBoard;
	mineSweeperBoard = mineSweeperBoard.cloneNode(true);
	mineSweeperBoardOld.parentNode.replaceChild(mineSweeperBoard, mineSweeperBoardOld);
	
	//Add the left-click event listener.
	mineSweeperBoard.addEventListener("click", function(e) {
		handlePlayerClick(e, logicalBoard, mineSweeperBoard, numMines, false);
	});
	//Add the right-click flagging event listener.
	mineSweeperBoard.addEventListener("contextmenu", function(e) {
		e.preventDefault();
		handlePlayerClick(e, logicalBoard, mineSweeperBoard, numMines, true);
	});
}


//Hide or unhide the options box, called by clicking the "Options" button or the "X" button. 
function toggleGameOptions() {
	let optionsButton = document.getElementById("gameOptionsButton");
	let gameOptions = document.getElementById("gameOptions");
	if (optionsButton.classList.contains("hidden")) {
		optionsButton.classList.remove("hidden");
		gameOptions.classList.add("hidden");
	}
	else {
		optionsButton.classList.add("hidden");
		gameOptions.classList.remove("hidden");
	}
}


//Take user input and change the global NUMROWS, NUMCOLS, and NUMMINES variables, called by clicking the "Apply" button.
function changeBoardPreferences() {
	let boardRadioButtons = document.getElementsByName("gameSettings");
	let boardPreferences = "";
	for (let i=0; i<boardRadioButtons.length; i++) {
		if (boardRadioButtons[i].checked) {
			if (boardRadioButtons[i].value == "custom") {
				boardPreferences = document.getElementById("customRows").value + " " + document.getElementById("customCols").value + " " + document.getElementById("customMines").value;
			}
			else {
				boardPreferences = boardRadioButtons[i].value;
			}
		}
	}
	boardPreferences = boardPreferences.split(" ");
	
	//Reject or fix bogus custom inputs.
	if (!boardPreferences[0] || !boardPreferences[1] || !boardPreferences[2]) {
		alert("Invalid custom board inputs!");
		return;
	}
	if (boardPreferences[0] < 0 || boardPreferences[1] < 0 || boardPreferences[2] < 0) {
		alert("Invalid custom board inputs!");
		return;
	}
	if (boardPreferences[2] > boardPreferences[0] * boardPreferences[1]) {
		alert("Too many mines specified in custom board input!");
		return;
	}
	if (boardPreferences[0] > MAXROWS || boardPreferences[1] > MAXCOLS) {
		boardPreferences[0] = MAXROWS;
		document.getElementById("customRows").value = MAXROWS;
		boardPreferences[1] = MAXCOLS;
		document.getElementById("customCols").value = MAXCOLS
	}
	
	NUMROWS = boardPreferences[0];
	NUMCOLS = boardPreferences[1];
	NUMMINES = boardPreferences[2];
	setUpGame(NUMROWS, NUMCOLS, NUMMINES);
}


//Start a new game, called by clicking the "New Game" button and on initial page load.
function startNewGame() {
	setUpGame(NUMROWS, NUMCOLS, NUMMINES);
}


//Go!
startNewGame();