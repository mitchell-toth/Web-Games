//Sudoku!
//Coded by Mitchell Toth
//https://cse.taylor.edu/~mtoth/Sudoku/sudoku.html


//Global board information
let SELECTED_CELL = null;
const NUM_ROWS = 9;
const NUM_COLS = 9;
const TOTAL_NUM_SQUARES = NUM_ROWS*NUM_COLS;
//Global difficulty levels
const EASY = 44;
const INTERMEDIATE = 35;
const HARD = 26;
let DIFFICULTY_LEVEL = EASY;
let NUM_STARTER_NUMBERS = DIFFICULTY_LEVEL;
let SYMMETRICAL = false;
//Global timer
let SOLVE_TIME = 0;
let TIMER_ID = null;
//Global logical board keeping track of the user's board
let logicalBoard_user = [];


//Initialize and fill in all of the boards: the HTML board, master board, solver board, and user board.
function createBoard(sudokuBoard) {
	let logicalBoard_master = [];
	let logicalBoard_solver = [];
	for (let r=0; r<NUM_ROWS; r++) {
		logicalBoard_master[r] = [];
		logicalBoard_solver[r] = [];
		logicalBoard_user[r] = [];
		for (let c=0; c<NUM_COLS; c++) {
			let cell = document.createElement("div");
			cell.classList.add("numberInputter");
			cell.addEventListener("click", function() {
				toggleChoicesBox(cell, r, c);
			});
			let notesInput = document.createElement("input");
			notesInput.classList.add("notes");
			sudokuBoard.rows[r].cells[c].innerHTML = "";
			sudokuBoard.rows[r].cells[c].style = null;
			sudokuBoard.rows[r].cells[c].classList.add("normalSquare");
			sudokuBoard.rows[r].cells[c].appendChild(notesInput);
			sudokuBoard.rows[r].cells[c].appendChild(cell);
			logicalBoard_master[r][c] = null;
			logicalBoard_solver[r][c] = null;
			logicalBoard_user[r][c] = null;
		}
	}
	//Find a valid sudoku solution.
	fillOutSolutionBoard(logicalBoard_master, logicalBoard_solver);
	//Now remove some squares (according to the difficulty level).
	removeSquares(logicalBoard_master, logicalBoard_solver);
}


//Find a valid sudoku solution and put it in the logical boards. Uses recursive backtracking.
function fillOutSolutionBoard(logicalBoard_master, logicalBoard_solver) {
	let rowCol = getNextUnfilledSquare(logicalBoard_master);
	if (!rowCol) { return true; }
	let r = rowCol.row;
	let c = rowCol.col;
	let numbers = [1,2,3,4,5,6,7,8,9];
	shuffleArray(numbers);
	for (let i=0; i<9; i++) {
		let val = numbers[i];
		if (isSafe(logicalBoard_master, r, c, val)) {
			logicalBoard_master[r][c] = val;
			logicalBoard_solver[r][c] = val;
			logicalBoard_user[r][c] = val;
			if (fillOutSolutionBoard(logicalBoard_master, logicalBoard_solver)) {
				return true;
			}
			else {
				logicalBoard_master[r][c] = null;
				logicalBoard_solver[r][c] = null;
				logicalBoard_user[r][c] = null;
			}
		}
	}
	return false;
}


//Helper function to retrieve the next empty square in a given logical board.
function getNextUnfilledSquare(board, startRow=0, startCol=0) {
	for (let r=startRow; r<NUM_ROWS; r++) {
		for (let c=startCol; c<NUM_COLS; c++) {
			if (!board[r][c]) {
				return {"row": r, "col": c};
			}
		}
	}
	return null;
}


//Helper function to determine if a number at a row and col in a logical board is valid according to sudoku rules.
function isSafe(board, row, col, val) {
	//Row
	for (let c=NUM_COLS-1; c>=0; c--) {
		if (board[row][c] == val && c != col) { return false; }
	}
	//Column
	for (let r=NUM_ROWS-1; r>=0; r--) {
		if (board[r][col] == val && r != row) { return false; }
	}
	//Block
	let sq_row = row-(row%3);
	let sq_col = col-(col%3);
	for (let r=sq_row+2; r>=sq_row; r--) {
		for (let c=sq_col+2; c>=sq_col; c--) {
			if (board[r][c] == val && !(r == row && c == col)) { return false; }
		}
	}
	return true;
}


//Given a fully-filled-out solution board, randomly pick holes and see if the result is solvable.
//The method I use is essentially brute force. I tried using backtracking but to no avail. 
//But I suppose a do-while loop suffices. This method ended up being fast enough.
function removeSquares(logicalBoard_master, logicalBoard_solver) {
	do {
		//Get all squares and shuffle them.
		//Also, make sure that the solver and user boards are up to date. 
		//Keep in mind that these boards are given holes, but that hole placement may not have been solvable from the previous iteration.
		let squares = [];
		let row_limit = NUM_ROWS;
		let col_limit = NUM_COLS;
		//if (SYMMETRICAL) { col_limit = Math.ceil(NUM_COLS/2); }
		for (let r=0; r<row_limit; r++) {
			for (let c=0; c<col_limit; c++) {
				let originalValue = logicalBoard_master[r][c];
				logicalBoard_solver[r][c] = originalValue;
				logicalBoard_user[r][c] = originalValue;
				squares.push({"row": r, "col": c});
			}
		}
		shuffleArray(squares);
		
		//Randomly place holes in the filled-out boards.
		if (SYMMETRICAL) {  //Remove the squares with diagonal symmetry.
			let numSquaresToRemove = ((NUM_ROWS*NUM_COLS)-(NUM_STARTER_NUMBERS))/2;
			for (let i=0; i<numSquaresToRemove; i++) {
				let square = squares[i];
				logicalBoard_solver[square.row][square.col] = null;
				logicalBoard_user[square.row][square.col] = null;
				logicalBoard_solver[NUM_ROWS-1-square.row][NUM_COLS-1-square.col] = null;
				logicalBoard_user[NUM_ROWS-1-square.row][NUM_COLS-1-square.col] = null;
			}
		}
		else {  //Just remove the squares randomly.
			let numSquaresToRemove = ((NUM_ROWS*NUM_COLS)-NUM_STARTER_NUMBERS);
			for (let i=0; i<numSquaresToRemove; i++) {
				let square = squares[i];
				logicalBoard_solver[square.row][square.col] = null;
				logicalBoard_user[square.row][square.col] = null;
			}
		}
	} while (!isSolvable(logicalBoard_solver));
}


//Determine if the sudoku board is solvable given its empty squares.
//The logic attempts to mimic how humans approach playing sudoku. 
//Using a solver board, it plays the game, testing every square to see if only one value can work in that square's block, row, or column.
//If so, then that number is placed in the solver board. It is the solution for that square.
//This process repeats until either all squares are filled in (solvable) or it iterates through every square with no changes (not solvable).
//And it turns out that a recursive solution is slower than an iterative one. So I opted for an iterative solution.
function isSolvable(logicalBoard_solver) {
	//Use a boolean to keep track of any changes.
	let theresBeenAChange;
	//Get all unfilled squares.
	let unfilledSquares = [];
	for (let r=0; r<NUM_ROWS; r++) {
		for (let c=0; c<NUM_COLS; c++) {
			if (!logicalBoard_solver[r][c]) {
				unfilledSquares.push({"row": r, "col": c});
			}
		}
	}
	while(unfilledSquares.length) {
		theresBeenAChange = false;
		//Iterate over every square.
		for (let idx = unfilledSquares.length-1; idx >= 0; idx--) {
			if (theresBeenAChange) { break; }
			let r = unfilledSquares[idx].row;
			let c = unfilledSquares[idx].col;
			let valid_numbers_for_this_square = [];  //Generate a list of possible, valid values for this square.
			//Iterate over 1-9.
			for (let val=1; val<=9; val++) {
				if (isSafe(logicalBoard_solver, r, c, val)) {
					valid_numbers_for_this_square.push(val);
				}
			}
			
			let length = valid_numbers_for_this_square.length;
			//If this square has only one possible value, then we're done. That must be the value.
			if (length == 1) {
				//Place the value at this location in the solver board.
				logicalBoard_solver[r][c] = valid_numbers_for_this_square[0];
				unfilledSquares.splice(idx,1);
				theresBeenAChange = true;
				break;
			}
			//Otherwise, check if the number is the only possible value in any of its block, row, or column. 
			else if (length > 1) {
				//Iterate over the possbile values.
				for (let i=0; i<length; i++) {
					//Block
					let val = valid_numbers_for_this_square[i];
					let sq_row = r-(r%3);
					let sq_col = c-(c%3);
					let canGoElsewhere = false;
					for (let rr=sq_row; rr<sq_row+3; rr++) {
						if (canGoElsewhere) { break; }
						for (let cc=sq_col; cc<sq_col+3; cc++) {
							if (rr == r && cc == c) { continue; }
							if (!logicalBoard_solver[rr][cc]) {
								if (isSafe(logicalBoard_solver, rr, cc, val)) { canGoElsewhere = true; break; }
							}
						}
					}
					if (!canGoElsewhere) { logicalBoard_solver[r][c] = val; unfilledSquares.splice(idx,1); theresBeenAChange = true; break; }
					
					//Row
					canGoElsewhere = false;
					for (let cc=0; cc<NUM_COLS; cc++) {
						if (cc == c) { continue; }
						if (!logicalBoard_solver[r][cc]) {
							if (isSafe(logicalBoard_solver, r, cc, val)) { canGoElsewhere = true; break; }
						}
					}
					if (!canGoElsewhere) { logicalBoard_solver[r][c] = val; unfilledSquares.splice(idx,1); theresBeenAChange = true; break; }
					
					//Column
					canGoElsewhere = false;
					for (let rr=0; rr<NUM_ROWS; rr++) {
						if (rr == r) { continue; }
						if (!logicalBoard_solver[rr][c]) {
							if (isSafe(logicalBoard_solver, rr, c, val)) { canGoElsewhere = true; break; }
						}
					}
					if (!canGoElsewhere) { logicalBoard_solver[r][c] = val; unfilledSquares.splice(idx,1); theresBeenAChange = true; break; }
				}
			}
		}
		//No change after checking every square means that no logical move exists. The puzzle is not solvable.
		if (!theresBeenAChange) {
			return false;
		}
	}
	
	//If there are no more unfilled squares, then the solver must have solved it.
	return true;
}


//After a solvable puzzle has been created, "cement" the numbers that are given and remove those squares' input fields.
function displayVisualBoard(sudokuBoard) {
	for (let r=0; r<NUM_ROWS; r++) {
		for (let c=0; c<NUM_COLS; c++) {
			if (logicalBoard_user[r][c]) {
				//These squares' HTML becomes just a number.
				sudokuBoard.rows[r].cells[c].innerHTML = logicalBoard_user[r][c];
			}
		}
	}
}


//Called upon clicking an empty square. This brings up the number choice box, allowing the user to pick a number for that square.
function toggleChoicesBox(cell, row, col) {
	//To get the placement of the number choice box just right, I make it a child of the chosen cell. 
	let cellChoicesBox = document.getElementById("cellChoicesBox");
	cellChoicesBox.classList.add("hidden");
	cell.appendChild(cellChoicesBox);
	cellChoicesBox.classList.remove("hidden");
	
	//Update the global SELECTED_CELL variable. The actual placement of the number is handled by the window click event listener (below).
	SELECTED_CELL = {"cell": cell, "row": row, "col": col};
}


//Handle all clicks on the page, letting in only the meaningful clicks.
//Most importantly, this event handler places the numbers in the squares as the user chooses them.
window.addEventListener("click", function(e) {
	//Filter out unneeded clicks.
	if (!e.target.classList) { return; }
	if (e.target.classList.contains("numberInputter")) { return; }
	
	
	let cellChoicesBox = document.getElementById("cellChoicesBox");
	let content = document.getElementsByTagName("content")[0];
	//If the user is clicking a number to place into a square, then place the appropriate number there.
	if (e.target.classList.contains("choiceCell")) {
		SELECTED_CELL.cell.innerText = e.target.innerText;
		//If the user clicked on the 'empty' choice, null out the square in the logical user board.
		if (e.target.innerText == " ") {
			logicalBoard_user[SELECTED_CELL.row][SELECTED_CELL.col] = null;
		}
		else {
			logicalBoard_user[SELECTED_CELL.row][SELECTED_CELL.col] = e.target.innerText;
		}
		SELECTED_CELL.cell.classList.add("inputtedNumber");
	}
	
	//Now hide the number choice box.
	if (!cellChoicesBox.classList.contains("hidden")) {
		cellChoicesBox.classList.add("hidden");
	}
	//Move around the number choice box back to where it normally dwells, in the 'content' tag. Otherwise, the number choice box would be gone.
	content.appendChild(cellChoicesBox);
});


//The user has won! Inform the user with some green goodness and some stats.
function sudokuCompleted(sudokuBoard, message) {
	document.getElementById("checkProgressButton").disabled = true;
	clearInterval(TIMER_ID);  //Stop the timer.
	//Figure out the difficulty as a string.
	let difficulty = "";
	if (DIFFICULTY_LEVEL == EASY) { difficulty = "easy"; }
	else if (DIFFICULTY_LEVEL == INTERMEDIATE) { difficulty = "intermediate"; }
	else if (DIFFICULTY_LEVEL == HARD) { difficulty = "hard"; }
	
	//Figure out the time in Hours, Minutes, and Seconds.
	let time = "";
	let hours = Math.floor(SOLVE_TIME/3600);
	let minutes = Math.floor((SOLVE_TIME-(hours*3600))/60);
	let seconds = Math.floor((SOLVE_TIME-(hours*3600)-(minutes*60)));
	if (hours) { time += `${hours}h, `; }
	if (minutes || hours) { time += `${minutes}m, `; }
	time += `${seconds}s`;
	
	message.innerText += `\nDifficulty: ${difficulty}, Solve Time: ${time}`;
	displayVisualBoard(sudokuBoard);  //"Cement" all the numbers.
	
	//Do a cool green wave pattern.
	let transitionTime = 0.5;
	for (let r=0; r<NUM_ROWS; r++) {
		for (let c=0; c<NUM_COLS; c++) {
			sudokuBoard.rows[r].cells[c].style.transition = "all " + transitionTime + "s";
			sudokuBoard.rows[r].cells[c].style.backgroundColor = "lightgreen";
			transitionTime += 0.2;
		}
		transitionTime += 1;
	}
}


//Called upon clicking the 'Check Progress' button. Checks the user's board and looks for any logic errors.
//Verbose is normally true, meaning it displays a helpful message above the board and handles the win condition.
//Verbose being false simply returns 'false' if the user committed a logic error, 'true' if everything checks out.
function checkUserProgress(verbose = true) {
	let sudokuBoard = document.getElementById("sudokuBoard");
	let message = document.getElementById("checkMessage");
	if (verbose) {
		message.innerText = "";
		message.style.color = "black";
	}
	let numFilledInSquares = 0;  //Count up the filled-in squares.
	for (let r=0; r<NUM_ROWS; r++) {
		for (let c=0; c<NUM_COLS; c++) {
			if (logicalBoard_user[r][c]) {
				numFilledInSquares++;
				if (sudokuBoard.rows[r].cells[c].childElementCount && !isSafe(logicalBoard_user, r, c, logicalBoard_user[r][c])) {
					//The user's entry for this square is not valid! Tell the user and highlight the offending square with red.
					sudokuBoard.rows[r].cells[c].classList.add("incorrectNumber");
					if (verbose) {
						message.innerText = "Logic error detected!";
						message.style.color = "darkred";
					}
					//Remove the red highlighting after 3 seconds.
					setTimeout(() => {
						sudokuBoard.rows[r].cells[c].classList.remove("incorrectNumber");
						if (verbose) { message.innerText = ""; }
					}, 3000);
					return false;
				}
			}
		}
	}
	//If the flow of execution gets here, then there must be no errors.
	//Now check if every square is filled out. If so, then the user msut have won!
	if (numFilledInSquares == TOTAL_NUM_SQUARES && verbose) {
		message.innerText = "Puzzle solved!";
		message.style.color = "green";
		sudokuCompleted(sudokuBoard, message);  //Add some extra flare.
	}
	else {
		if (verbose) {
			message.innerText = "No invalid entries detected";
			//Remove the message after 3 seconds.
			setTimeout(() => {
				message.innerText = "";
			}, 3000);
		}
	}
	return true;
}


//Called upon clicking the 'Options' button. Toggles the display of the game options.
function toggleGameOptions() {
	let optionsButton = document.getElementById("gameOptionsButton");
	let gameOptions = document.getElementById("gameOptions");
	if (optionsButton.classList.contains("hidden")) {  //If the 'Options' button is hidden, then the game options must be showing. Now hide them.
		optionsButton.classList.remove("hidden");
		gameOptions.classList.add("hidden");
	}
	else {  //Otherwise, the game options must be hidden. So unhide them.
		optionsButton.classList.add("hidden");
		gameOptions.classList.remove("hidden");
	}
}


//Called upon clicking the 'Reveal Logical Step' button. 
//This searches the user's input much like the 'isSolvable()' function but returns upon finding the first solution number.
//Go ahead and place this number on the board as a way to help the user solve the puzzle.
function revealOneNumber() {
	const noErrorsDetected = checkUserProgress(false);
	//If there are any errors, first have the user fix those.
	if (!noErrorsDetected) { 
		let message = document.getElementById("checkMessage");
		message.style.color = "darkred";
		message.innerText = "Logic error detected! Is this why you're stuck?";
		setTimeout(() => {
			message.innerText = "";
		}, 3000);
		return; 
	}
	
	//Get all unfilled squares and then shuffle them.
	let unfilledSquares = [];
	for (let r=0; r<NUM_ROWS; r++) {
		for (let c=0; c<NUM_COLS; c++) {
			if (!logicalBoard_user[r][c]) {
				unfilledSquares.push({"row": r, "col": c});
			}
		}
	}
	//If board is fully filled out, there's nothing to do.
	if (unfilledSquares.length == 0) { return; }
	
	shuffleArray(unfilledSquares);
	const numUnfilledSquares = unfilledSquares.length;
	let advancedSolutionNumDiscovered = {"row": null, "col": null, "val": null};
	//Iterate over every unfilled square.
	for (let i=0; i<numUnfilledSquares; i++) {
		let r = unfilledSquares[i].row;
		let c = unfilledSquares[i].col;
		let valid_numbers_for_this_square = [];
		for (let val=1; val<=9; val++) {
			if (isSafe(logicalBoard_user, r, c, val)) {
				valid_numbers_for_this_square.push(val);
			}
		}
		let length = valid_numbers_for_this_square.length;
		
		//If there is only one possible number that can go in this square, it must be the solution.
		//But this strategy is kind of advanced and nonintuitive. So I opted to have this be the prioritized less than the other options.
		if (length == 1) {
			advancedSolutionNumDiscovered.row = r;
			advancedSolutionNumDiscovered.col = c;
			advancedSolutionNumDiscovered.val = valid_numbers_for_this_square[0];
		}
		
		//Check if these values are the only possibility in their row, col, or block. If so, put it there.
		for (let i=0; i<length; i++) {
			//Block
			let val = valid_numbers_for_this_square[i];
			let sq_row = r-(r%3);
			let sq_col = c-(c%3);
			let canGoElsewhere = false;
			for (let rr=sq_row; rr<sq_row+3; rr++) {
				if (canGoElsewhere) { break; }
				for (let cc=sq_col; cc<sq_col+3; cc++) {
					if (rr == r && cc == c) { continue; }
					if (!logicalBoard_user[rr][cc]) {
						if (isSafe(logicalBoard_user, rr, cc, val)) { canGoElsewhere = true; break; }
					}
				}
			}
			if (!canGoElsewhere) { showNumber(r, c, val, "block"); return; }
			
			//Row
			canGoElsewhere = false;
			for (let cc=0; cc<NUM_COLS; cc++) {
				if (cc == c) { continue; }
				if (!logicalBoard_user[r][cc]) {
					if (isSafe(logicalBoard_user, r, cc, val)) { canGoElsewhere = true; break; }
				}
			}
			if (!canGoElsewhere) { showNumber(r, c, val, "row"); return; }
			
			//Column
			canGoElsewhere = false;
			for (let rr=0; rr<NUM_ROWS; rr++) {
				if (rr == r) { continue; }
				if (!logicalBoard_user[rr][c]) {
					if (isSafe(logicalBoard_user, rr, c, val)) { canGoElsewhere = true; break; }
				}
			}
			if (!canGoElsewhere) { showNumber(r, c, val, "column"); return; }
		}
	}
	//Use the advanced solution only after all other options have been checked.
	if (advancedSolutionNumDiscovered.val) {
		showNumber(advancedSolutionNumDiscovered.row, advancedSolutionNumDiscovered.col, advancedSolutionNumDiscovered.val, "onlyNumberPossible"); return;
	}
}


//Function called upon 'revealOneNumber()' finding a solution number. 
//Display that number on the board, and also display the context in which the algorithm found that solution.
function showNumber(row, col, val, context) {
	let sudokuBoard = document.getElementById("sudokuBoard");
	//Iterate over every square and remove any blue highlighting. This is to ensure that the only blue highlighting is for the most recent solution number.
	for (let r=0; r<NUM_ROWS; r++) {
		for (let c=0; c<NUM_COLS; c++) {
			if (sudokuBoard.rows[r].cells[c].classList.contains("revealedContext")) {
				sudokuBoard.rows[r].cells[c].classList.remove("revealedContext");
			}
			else if (sudokuBoard.rows[r].cells[c].classList.contains("revealedNumber")) {
				sudokuBoard.rows[r].cells[c].classList.remove("revealedNumber");
			}
		}
	}
	
	logicalBoard_user[row][col] = val;  //Put the value in the logical board.
	sudokuBoard.rows[row].cells[col].getElementsByClassName("numberInputter")[0].innerText = val;  //Put the value on the visual board.
	sudokuBoard.rows[row].cells[col].getElementsByClassName("numberInputter")[0].classList.add("inputtedNumber");
	sudokuBoard.rows[row].cells[col].classList.add("revealedNumber");  //Add dark blue highlighting.
	//Now show the context in lightblue.
	//Block.
	if (context == "block") {
		let sq_row = row-(row%3);
		let sq_col = col-(col%3);
		for (let r=sq_row; r<sq_row+3; r++) {
			for (let c=sq_col; c<sq_col+3; c++) {
				if (r == row && c == col) { continue; }
				sudokuBoard.rows[r].cells[c].classList.add("revealedContext");
				setTimeout(() => {
					sudokuBoard.rows[r].cells[c].classList.remove("revealedContext");
				}, 5000);
			}
		}
	}
	//Row.
	else if (context == "row") {
		for (let c=0; c<NUM_COLS; c++) {
			if (c == col) { continue; }
			sudokuBoard.rows[row].cells[c].classList.add("revealedContext");
			setTimeout(() => {
				sudokuBoard.rows[row].cells[c].classList.remove("revealedContext");
			}, 5000);
		}
	}
	//Column.
	else if (context == "column") {
		for (let r=0; r<NUM_ROWS; r++) {
			if (r == row) { continue; }
			sudokuBoard.rows[r].cells[col].classList.add("revealedContext");
			setTimeout(() => {
				sudokuBoard.rows[r].cells[col].classList.remove("revealedContext");
			}, 5000);
		}
	}
	//Only possible number.
	else if (context == "onlyNumberPossible") {
		//No context to show.
	}
	else {
		console.warn("Invalid context argument!");
	}
	//Remove the highlighting after 5 seconds.
	setTimeout(() => {
		sudokuBoard.rows[row].cells[col].classList.remove("revealedNumber");
	}, 5000);
}


//Spin up a new game.
function newGame() {
	let message = document.getElementById("checkMessage");
	message.innerText = "";
	let optionsButton = document.getElementById("gameOptionsButton");
	let gameOptions = document.getElementById("gameOptions");
	if (optionsButton.classList.contains("hidden")) {
		optionsButton.classList.remove("hidden");
		gameOptions.classList.add("hidden");
	}
	
	//Find the chosen difficulty level and set global variables.
	let boardRadioButtons = document.getElementsByName("gameSettings");
	for (let i=0; i<boardRadioButtons.length; i++) {
		if (boardRadioButtons[i].checked) {
			if (boardRadioButtons[i].value == "E") {
				DIFFICULTY_LEVEL = EASY; break;
			}
			else if (boardRadioButtons[i].value == "I") {
				DIFFICULTY_LEVEL = INTERMEDIATE; break;
			}
			else if (boardRadioButtons[i].value == "H") {
				DIFFICULTY_LEVEL = HARD; break;
			}
			else {
				alert("Invalid difficulty level!");
				return;
			}
		}
	}
	NUM_STARTER_NUMBERS = DIFFICULTY_LEVEL;
	setUpGame();  //Create the board.
	
	//Reset and intialize the timer.
	SOLVE_TIME = 0;
	if (TIMER_ID) { clearInterval(TIMER_ID); }
	//Add 1 every 1 second.
	TIMER_ID = setInterval(() => {
		SOLVE_TIME++;
	}, 1000);
	document.getElementById("checkProgressButton").disabled = false;
}


//The real heavy lifting when starting up a new game is creating the board.
function setUpGame() {
	let sudokuBoard = document.getElementById("sudokuBoard");
	createBoard(sudokuBoard);
	displayVisualBoard(sudokuBoard);
}


//Go!
newGame();