//Snake!
//Coded by Mitchell Toth
//https://cse.taylor.edu/~mtoth/Snake/snake.html


{ //Secure code block START...

/*--------Global Variables--------*/

//Game board:
let NUM_ROWS = 11;  //Default board size of 11x11.
let NUM_COLS = 11;
let SNAKE_BOARD_VISUAL = document.getElementById("snakeBoard");

//Logical board and snake linked list:
let SNAKE_BOARD_LOGICAL = [];
let SNAKE_LL = {};  //The game of Snake practically screams for a linked list implementation.

//Macro-like definitions for the logical board contents:
const EMPTY      = 'E';
const SNAKE_BODY = 's';
const SNAKE_HEAD = 'S';
const FRUIT      = 'F';

//Macro-like definitions for the degrees of snake CSS rotation:
//(the snake always starts out facing to the right).
const RIGHT = 0;
const DOWN  = 90;
const LEFT  = 180;
const UP    = 270;
let DIRECTION = RIGHT;  //The tentative direction in which the user wants the snake to move.
let CURRENT_DIRECTION = DIRECTION;  //The confirmed direction that the snake is currently moving. Used to ensure the snake can't do a sudden 180 degree turn on itself.

//Game status:
let GAME_RUNNING = false;
let GAME_OVER = false;
let INITIAL_PAGE_LOAD = true;

//Relative game speed:
let GAME_SPEED = 3;  //Default speed of 3.

//User's high scores, based on chosen game speed, row, and cols:
let HIGH_SCORE_RECORDS = [];  //Default is an empty array that will be built as high scores are recorded.

//User's top 10 skilled games.
let TOP_SKILL_SCORES = [];
	
//Game colors:
let COLOR_SNAKE = "#FFFFFF";  //Default is white.
let COLOR_FRUIT = "#FF0000";  //Default is red.
let COLOR_BOARD = "#000000";  //Default is black.

//Miscellaneous:
let AVAILABLE_FRUIT = 1;  //Default is 1.
let FRUIT_EFFECT = 1;  //The number of snake body parts to add after eating a single fruit.
let ZOOM_LEVEL = 1;  //Default is 100% (normal board size).
let GAME_TIMER_ID = null;  //The game timer. It needs to be global so that the timer can be cleared when the user spins up a new game while still playing an ongoing one.

//The object to be saved in local storage.
let SNAKE_STORAGE = {}
updateSnakeStorage();
/*--------------------------------*/



/*---------------------------------------Local Storage code---------------------------------------*/
/*------------------------------------------------------------------------------------------------*/

//Called upon game startup. 
//Looks at Local Storage and gets the user's high score data and preferences, if they exist.
//The idea is that if they don't exist (value of null), then the default global variable values will be used.
//This is what the second parameter to 'getLocalStorageItem' is doing.
function getSavedUserData() {
	SNAKE_STORAGE = getLocalStorageItem("Snake", SNAKE_STORAGE);
	HIGH_SCORE_RECORDS = SNAKE_STORAGE.high_score_records;  //High score data.
	GAME_SPEED = SNAKE_STORAGE.game_speed;                  //Snake speed.
	NUM_ROWS = SNAKE_STORAGE.num_rows;                      //Number of board rows.
	NUM_COLS = SNAKE_STORAGE.num_cols;                      //Number of board cols.
	AVAILABLE_FRUIT = SNAKE_STORAGE.available_fruit;        //Available fruit.
	FRUIT_EFFECT = SNAKE_STORAGE.fruit_effect;              //Fruit effect.
	COLOR_SNAKE = SNAKE_STORAGE.color_snake;                //Snake color.
	COLOR_FRUIT = SNAKE_STORAGE.color_fruit;                //Fruit color.
	COLOR_BOARD = SNAKE_STORAGE.color_board;                //Background board color.
	ZOOM_LEVEL = SNAKE_STORAGE.zoom_level;	                //Zoom level.
	TOP_SKILL_SCORES = SNAKE_STORAGE.top_skill_scores;      //Skill data.
	
	//Now set all of the page messages and widgets to reflect the user's data and preferences.
	//Game captions:
	document.getElementById("gameCaption_highScore").innerText = getUserHighScoreData(true);
	document.getElementById("gameSkillHighScoreCaption").innerText = calculateSkillPoints(getUserHighScoreData(true));
	document.getElementById("gameCaption_numRows").innerText = NUM_ROWS;
	document.getElementById("gameCaption_numCols").innerText = NUM_COLS;
	document.getElementById("gameCaption_speed").innerText = GAME_SPEED;
	//'Options' tab widgets.
	document.getElementById("rowsRangeInput").value = NUM_ROWS;
	document.getElementById("rowsRangeDisplay").innerText = NUM_ROWS;
	document.getElementById("colsRangeInput").value = NUM_COLS;
	document.getElementById("colsRangeDisplay").innerText = NUM_COLS;
	document.getElementById("speedRangeInput").value = GAME_SPEED;
	document.getElementById("speedRangeDisplay").innerText = GAME_SPEED;
	document.getElementById("numFruitRangeInput").value = AVAILABLE_FRUIT;
	document.getElementById("numFruitRangeDisplay").innerText = AVAILABLE_FRUIT;
	document.getElementById("fruitEffectRangeInput").value = FRUIT_EFFECT;
	document.getElementById("fruitEffectRangeDisplay").innerText = FRUIT_EFFECT;
	document.getElementById("zoomRangeInput").value = ZOOM_LEVEL;
	document.getElementById("zoomRangeDisplay").innerText = (100+((ZOOM_LEVEL-1)*50)) + "%";
	//'Options' tab color widgets.
	document.getElementById("snakeColorPicker").value = COLOR_SNAKE;
	document.getElementById("fruitColorPicker").value = COLOR_FRUIT;
	document.getElementById("backgroundColorPicker").value = COLOR_BOARD;
	//Change the actual color of the snake elements.
	changeStyleCSS(`background-color: ${COLOR_SNAKE};`, "#snakeBoardContainer .snakeHead div", "snake");
	changeStyleCSS(`background-color: ${COLOR_SNAKE};`, "#snakeBoardContainer .snakeBody div", "snake");
	changeStyleCSS(`background-color: ${COLOR_FRUIT};`, "#snakeBoardContainer .fruit div", "snake");
	changeStyleCSS(`background-color: ${COLOR_BOARD};`, "#snakeBoardContainer #snakeBoard td", "snake");
	//And change the zoom level of the board.
	changeStyleCSS(`width: ${20+((ZOOM_LEVEL-1)*10)}px; height: ${20+((ZOOM_LEVEL-1)*10)}px; padding: 0px;`, "#snakeBoard td", "snake");
}


//----------------------------------------------------------------------------------
//Update the 'SNAKE_STORAGE' global variable with all of the latest preferences/data.
function updateSnakeStorage() {
	SNAKE_STORAGE = {
		high_score_records: HIGH_SCORE_RECORDS,
		game_speed: GAME_SPEED,
		num_rows: NUM_ROWS,
		num_cols: NUM_COLS,
		available_fruit: AVAILABLE_FRUIT,
		fruit_effect: FRUIT_EFFECT,
		color_snake: COLOR_SNAKE,
		color_fruit: COLOR_FRUIT,
		color_board: COLOR_BOARD,
		zoom_level: ZOOM_LEVEL,
		top_skill_scores: TOP_SKILL_SCORES
	}
}


//----------------------------------------------------------------------------------
//Save all of the user's chosen preferences to Local Storage.
//Called upon clicking 'Apply' in the 'Options' tab.
//Updates the user's preferences in Local Storage if these exist.
//Creates the user's Local Storage presence if not.
let saveUserData = function() {
	updateSnakeStorage();
	setLocalStorageItem("Snake", SNAKE_STORAGE);
}


//----------------------------------------------------------------------------------
//Get the user's saved high score for the current game configuration.
//Returns in numeric form ("WIN" becomes the highest score possible).
function getUserHighScoreData(useWinString) {
	if (!NullorUndf(HIGH_SCORE_RECORDS[GAME_SPEED])
	 && !NullorUndf(HIGH_SCORE_RECORDS[GAME_SPEED][NUM_ROWS])
	 && !NullorUndf(HIGH_SCORE_RECORDS[GAME_SPEED][NUM_ROWS][NUM_COLS])
	 && !NullorUndf(HIGH_SCORE_RECORDS[GAME_SPEED][NUM_ROWS][NUM_COLS][FRUIT_EFFECT])
	 && !NullorUndf(HIGH_SCORE_RECORDS[GAME_SPEED][NUM_ROWS][NUM_COLS][FRUIT_EFFECT][AVAILABLE_FRUIT])) {
		let highScore = HIGH_SCORE_RECORDS[GAME_SPEED][NUM_ROWS][NUM_COLS][FRUIT_EFFECT][AVAILABLE_FRUIT];
		if (highScore == "WIN" && !useWinString) { highScore = (NUM_ROWS * NUM_COLS)-3; }		
		return highScore;
	}
	return 0;
}


//----------------------------------------------------------------------------------
//Record a new high score to be saved to Local Storage.
let recordUserHighScoreData = function(newHighScore) {
	if (NullorUndf(HIGH_SCORE_RECORDS[GAME_SPEED])) { 
		HIGH_SCORE_RECORDS[GAME_SPEED] = []; 
	}
	if (NullorUndf(HIGH_SCORE_RECORDS[GAME_SPEED][NUM_ROWS])) { 
		HIGH_SCORE_RECORDS[GAME_SPEED][NUM_ROWS] = []; 
	}
	if (NullorUndf(HIGH_SCORE_RECORDS[GAME_SPEED][NUM_ROWS][NUM_COLS])) { 
		HIGH_SCORE_RECORDS[GAME_SPEED][NUM_ROWS][NUM_COLS] = []; 
	}
	if (NullorUndf(HIGH_SCORE_RECORDS[GAME_SPEED][NUM_ROWS][NUM_COLS][FRUIT_EFFECT])) { 
		HIGH_SCORE_RECORDS[GAME_SPEED][NUM_ROWS][NUM_COLS][FRUIT_EFFECT] = []; 
	}
	if (NullorUndf(HIGH_SCORE_RECORDS[GAME_SPEED][NUM_ROWS][NUM_COLS][FRUIT_EFFECT][AVAILABLE_FRUIT])) { 
		HIGH_SCORE_RECORDS[GAME_SPEED][NUM_ROWS][NUM_COLS][FRUIT_EFFECT][AVAILABLE_FRUIT] = []; 
	}
	//High score variable is now set up. Stick the value in there.
	HIGH_SCORE_RECORDS[GAME_SPEED][NUM_ROWS][NUM_COLS][FRUIT_EFFECT][AVAILABLE_FRUIT] = newHighScore;
}


//----------------------------------------------------------------------------------
//See if the user's new high score is noteworthy.
//If so, record a new "top skill points" entry or update an existing one to be saved to Local Storage.
let recordUserSkillPointData = function(score) {
	//Sub-function to see if an entry with the same game configuration is already recorded.
	//If so, return that entry so that it can be updated.
	function getExistingEntry(newEntry) {
		for (let i=0; i<TOP_SKILL_SCORES.length; i++) {
			let existingEntry = TOP_SKILL_SCORES[i];
			if (JSON.stringify(existingEntry.gameConfig) === JSON.stringify(newEntry.gameConfig)) {
				return existingEntry;
			}
		}
		return null;
	}
	
	//The new skill data entry.
	let newEntry = {
		score: score,          //The score.
		exact_date: Date(),    //Exact date of when the user set the score.
		display_date: Now(),   //A nicer date format to display.
		count: 1,              //How many times the user has achieved this particular score.
		gameConfig: {          //The game configuration used to achieve this score.
			game_speed: GAME_SPEED,
			num_rows: NUM_ROWS,
			num_cols: NUM_COLS,
			available_fruit: AVAILABLE_FRUIT,
			fruit_effect: FRUIT_EFFECT
		}
	}
	
	let newChange = false;
	
	let existingEntry = getExistingEntry(newEntry);
	if (existingEntry) {  //Udpdate an existing entry.
		if (existingEntry.score == score) { existingEntry.count++; }
		else { existingEntry.count = 1; }
		existingEntry.score = score;
		existingEntry.exact_date = new Date();
		existingEntry.display_date = Now();
		newChange = true;
	}
	else {  //Insert the new entry.
		TOP_SKILL_SCORES.push(newEntry);
	}
	
	//Sort the entries by skill points.
	TOP_SKILL_SCORES.sort(function(a, b){
		return calculateSkillPoints(b.score, b.gameConfig) - calculateSkillPoints(a.score, a.gameConfig);
	});
	//Leave only the 10 best entries.
	if (TOP_SKILL_SCORES.length > 10) { TOP_SKILL_SCORES.pop(); }
	
	if (TOP_SKILL_SCORES.indexOf(newEntry) != -1) { newChange = true; }
	populateSkillScoresTable(newChange);
}


//----------------------------------------------------------------------------------
//Reset the user's high score and skill level stats.
function resetUserStats() {
	let msg = "Are you sure you want to reset your stats? You will lose all high score and skill level data.";
	if (confirm(msg)) {
		TOP_SKILL_SCORES = [];
		HIGH_SCORE_RECORDS = [];
		populateSkillScoresTable(false);
		saveUserData();
		setupGame();
	}
}


/*---------------------------------------Snake event listeners---------------------------------------*/
/*---------------------------------------------------------------------------------------------------*/

//User is on a computer:
//Handle keyboard input.
window.addEventListener('keydown', function(event) {
	handleKeyPress(event.key, event);
});

//User is on a mobile device:
//Below uses custom swipe events to handle mobile touch action.
//The swipe is simply converted into its corresponding keyboard arrow key and treated as a keyboard press.

//Left swipe.
SNAKE_BOARD_VISUAL.addEventListener('swiped-left', function(event) {
    handleKeyPress("ArrowLeft", event);
});
//Right swipe.
SNAKE_BOARD_VISUAL.addEventListener('swiped-right', function(event) {
    handleKeyPress("ArrowRight", event);
});
//Up swipe.
SNAKE_BOARD_VISUAL.addEventListener('swiped-up', function(event) {
    handleKeyPress("ArrowUp", event);
});
//Down swipe.
SNAKE_BOARD_VISUAL.addEventListener('swiped-down', function(event) {
    handleKeyPress("ArrowDown", event);
});


//----------------------------------------------------------------------------------
//Handle the user's snake-moving intentions. 
//All keys except the arrow keys and WASD are filtered out.
//Based on the key pressed, set the global DIRECTION to the corresponding direction.
function handleKeyPress(key, event) {
	//I lied. The 'Enter' key is also kind of allowed in. I like it as a shortcut to clicking 'New Game'.
	if (key == "Enter") { document.getElementById("startGameButton").click(); }
	
	const arrowKeys = ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft", "w", "a", "s", "d", "W", "A", "S", "D"];
	//Filter out kepyresses that aren't the arrow keys.
	if (!ifItemInArray(key, arrowKeys)) { return; }
	//Prevent the arrow keys from scrolling the page.
	event.preventDefault();
	
	switch(key) {
	case "w":
	case "W":
	case "ArrowUp":     //Up
		if (CURRENT_DIRECTION != DOWN) { DIRECTION = UP; }  //Ensure the snake can't do a 180 degree turn on itself.
		break;
	case "d":
	case "D":
	case "ArrowRight":  //Right
		if (CURRENT_DIRECTION != LEFT) { DIRECTION = RIGHT; }
		break;
	case "s":
	case "S":
	case "ArrowDown":   //Down
		if (CURRENT_DIRECTION != UP) { DIRECTION = DOWN; }
		break;
	case "a":
	case "A":
	case "ArrowLeft":   //Left
		if (CURRENT_DIRECTION != RIGHT) { DIRECTION = LEFT; }
		break;
	}
	
	//If the game has not started (and this game hasn't been won or lost yet), then start the game.
	//This is how any game is initially started.
	if (!GAME_RUNNING && !GAME_OVER) { runGame(); }
}



/*---------------------------------------Game logic code---------------------------------------*/
/*---------------------------------------------------------------------------------------------*/

//Set up the logical board with all empty squares.
function initializeLogicalBoard() {
	SNAKE_BOARD_LOGICAL = [];
	for (let r=0; r<NUM_ROWS; r++) {
		SNAKE_BOARD_LOGICAL[r] = [];
		for (let c=0; c<NUM_COLS; c++) {
			SNAKE_BOARD_LOGICAL[r][c] = EMPTY;
		}
	}
}


//----------------------------------------------------------------------------------
//Set up the visual board with all empty squares.
function initializeVisualBoard() {
	SNAKE_BOARD_VISUAL.innerHTML = "";
	for (let r=0; r<NUM_ROWS; r++) {
		let row = document.createElement("tr");
		for (let c=0; c<NUM_COLS; c++) {
			let col = document.createElement("td");
			row.appendChild(col);
		}
		SNAKE_BOARD_VISUAL.appendChild(row);
	}
}


//----------------------------------------------------------------------------------
//Visually update the board.
//This is called everytime after a move is made.
//It essentially does a fresh rewrite of the visual board's contents, using the contents of the logical board as a guide.
function updateSnakeBoard() {
	for (let r=0; r<NUM_ROWS; r++) {
		for (let c=0; c<NUM_COLS; c++) {
			SNAKE_BOARD_VISUAL.rows[r].cells[c].classList = [];  //Clear out any styling from before.
			if (SNAKE_BOARD_VISUAL.rows[r].cells[c].childElementCount) {
				SNAKE_BOARD_VISUAL.rows[r].cells[c].removeChild(SNAKE_BOARD_VISUAL.rows[r].cells[c].children[0]);  //Remove the square's contents.
			}
			
			let square = SNAKE_BOARD_LOGICAL[r][c];
			//Draw a snake body part.
			if (square == SNAKE_BODY) {
				SNAKE_BOARD_VISUAL.rows[r].cells[c].classList.add("snakeBody");
				let snakeBodyPart = document.createElement("div");
				snakeBodyPart.classList.add("blockCenter");
				SNAKE_BOARD_VISUAL.rows[r].cells[c].appendChild(snakeBodyPart);
			}
			//Draw the snake head.
			else if (square == SNAKE_HEAD) {
				SNAKE_BOARD_VISUAL.rows[r].cells[c].classList.add("snakeHead");
				let snakeHead = document.createElement("div");
				snakeHead.classList.add("blockCenter");
				SNAKE_BOARD_VISUAL.rows[r].cells[c].appendChild(snakeHead);
			}
			//Draw a fruit piece.
			else if (square == FRUIT) {
				SNAKE_BOARD_VISUAL.rows[r].cells[c].classList.add("fruit");
				let fruit = document.createElement("div");
				fruit.classList.add("blockCenter");
				SNAKE_BOARD_VISUAL.rows[r].cells[c].appendChild(fruit);
			}
		}
	}
}


//----------------------------------------------------------------------------------
//Calculate a numeric "skill points" value that tells the user how their good their score is.
//This measurement takes the game's configuration into account as well as the user's score.
function calculateSkillPoints(score, manualArgs = null) {
	//Use the current game settings by default.
	let game_speed = GAME_SPEED;
	let num_rows = NUM_ROWS;
	let num_cols = NUM_COLS;
	let available_fruit = AVAILABLE_FRUIT;
	let fruit_effect = FRUIT_EFFECT;
	
	//But use arbitrary game settings if given.
	if (manualArgs !== null) {
		game_speed = manualArgs.game_speed;
		num_rows = manualArgs.num_rows;
		num_cols = manualArgs.num_cols;
		available_fruit = manualArgs.available_fruit;
		fruit_effect = manualArgs.fruit_effect;
	}
	
	if (score == "WIN") { score = (num_rows * num_cols)-3; }
	//My forumla for calculating skill points:
	let skillPoints = Math.pow(1.625, game_speed) * (score/((num_rows*num_cols)-3)) * score * (1/available_fruit) * (1/fruit_effect);
	skillPoints = skillPoints.toFixed(2);
	return parseFloat(skillPoints);
}


//----------------------------------------------------------------------------------
//Return a string that describes the user's relative skill based on a given score.
function getSkillLevel(skillPoints) {
	const beginnerThreshold = 0;        //       0 - 200
	const intermediateThreshold = 150;  //     150 - 600
	const expertThreshold = 600;        //     600 - 1,000
	const masterThreshold = 1000;       //   1,000 - 2,000
	const legendaryThreshold = 2000;    //   2,000 - 10,000
	const insaneThreshold = 10000;      //  10,000 - MAX_VALUE
	const perfectThreshold = calculateSkillPoints("WIN", {game_speed: 10, num_rows: 50, num_cols: 50, available_fruit: 1, fruit_effect: 1});  //MAX_VALUE
	let level, threshold, range;
	
	//Sub-function to check if the user's skill points are within a provided range.
	//If so, set some values that will be needed for calculating the user's skill level.
	function doSetSkillRange(skillLevelName, thresholdLowerBound, thresholdUpperBound) {
		if (skillPoints >= thresholdLowerBound) {
			level = skillLevelName;
			threshold = thresholdLowerBound;
			range = thresholdUpperBound - thresholdLowerBound;
			return true;
		}
		return false;
	}
	
	//See which category the given 'skillPoints' value is in.
	//Honestly, this is very weird code here. I've never seen anyone do this kind of thing, but it works well to control the flow of execution with these ranges.
	if (doSetSkillRange("Perfect", perfectThreshold, perfectThreshold+1)) { return level; }
	else if (doSetSkillRange("Insane", insaneThreshold, perfectThreshold)) {}
	else if (doSetSkillRange("Legendary", legendaryThreshold, insaneThreshold)) {}
	else if (doSetSkillRange("Master", masterThreshold, legendaryThreshold)) {}
	else if (doSetSkillRange("Expert", expertThreshold, masterThreshold)) {}
	else if (doSetSkillRange("Intermediate", intermediateThreshold, expertThreshold)) {}
	else { doSetSkillRange("Beginner", beginnerThreshold, intermediateThreshold); }
	
	//return `${level} ${(((skillPoints-threshold)/range)*10).toFixed(2)}`;
	return `${level} ${Math.round(((skillPoints-threshold)/range)*100)}%`;
}


//----------------------------------------------------------------------------------
//Populate the top skill scores table with the user's top skill scores.
//Parameter 'highlistMostRecent' is used to differentiate between new additions (which should be highlighted) and merely loading the table.
function populateSkillScoresTable(highlightMostRecent) {
	//Helper sub-function to return a new tr.
	function newTr() { return document.createElement("tr"); }
	//Helper sub-function to return a new td with innerText and class properties already set.
	function newTd(contents, className=null) { 
		let td = document.createElement("td");
		td.innerText = contents;
		if (className) { td.classList.add(className); }
		return td; 
	}
	
	let skillScoresTable = document.getElementById("topSkillScoresTable");
	let skillScoresTableBody = document.getElementById("topSkillScoresTableBody");
	
	//Clear the table.
	let numRows = skillScoresTableBody.rows.length;
	for (let i=numRows-1; i>=0; i--) {
		skillScoresTableBody.removeChild(skillScoresTableBody.rows[i]);
	}
	
	let mostRecentDate = null;
	let indexOfMostRecentDate = null;
	let numSkillScoreEntries = TOP_SKILL_SCORES.length;
	
	//Hide or show the no-saved-games-message depending on whether there is data to display or not.
	if (numSkillScoreEntries > 0) {
		hide(document.getElementById("noSavedGamesMessage"));
		show(skillScoresTable);
	}
	else {
		hide(skillScoresTable);
		show(document.getElementById("noSavedGamesMessage"));
		return;
	}
	
	//Sort the entries by skill points.
	TOP_SKILL_SCORES.sort(function(a, b){
		return calculateSkillPoints(b.score, b.gameConfig) - calculateSkillPoints(a.score, a.gameConfig);
	});
	
	//Loop through the user's top skill scores and populate the table.
	for (let i=0; i<numSkillScoreEntries; i++) {
		let s = TOP_SKILL_SCORES[i];
		let row = newTr();
		row.appendChild(newTd(`${i+1}`, "skillEntryRank"));
		row.appendChild(newTd(getSkillLevel(calculateSkillPoints(s.score, s.gameConfig))));
		row.appendChild(newTd(s.score));
		row.appendChild(newTd(`${s.gameConfig.game_speed} speed, ${s.gameConfig.num_rows}x${s.gameConfig.num_cols} board`));
		row.appendChild(newTd(s.gameConfig.available_fruit));
		row.appendChild(newTd(s.gameConfig.fruit_effect));
		//Keep track of the most recent date and its row index.
		if (NullorUndf(mostRecentDate) || new Date(s.exact_date) > new Date(mostRecentDate)) { 
			mostRecentDate = s.exact_date;
			indexOfMostRecentDate = i;
		}
		row.appendChild(newTd(s.display_date));
		row.appendChild(newTd(s.count));
		skillScoresTableBody.appendChild(row);
	}
	
	//Highlight the table datum containing the most recent date.
	skillScoresTableBody.rows[indexOfMostRecentDate].cells[6].classList.add("mostRecentDate");
	
	//Highlight the row containing the most recent entry if desired.
	if (highlightMostRecent && !NullorUndf(indexOfMostRecentDate)) {
		skillScoresTableBody.rows[indexOfMostRecentDate].classList.add("mostRecentAddition");
	}
}


//----------------------------------------------------------------------------------
//Place a new fruit in a random empty location on the board.
let placeNewFruit = function() {
	//First, get all of the board's empty squares.
	let emptySquares = [];
	for (let r=0; r<NUM_ROWS; r++) {
		for (let c=0; c<NUM_COLS; c++) {
			if (SNAKE_BOARD_LOGICAL[r][c] == EMPTY) {
				emptySquares.push({"r": r, "c": c});
			}
		}
	}
	//If there are no empty squares left (the player won the game at this point), no need to try and place a fruit.
	if (emptySquares.length == 0) { return; }
	//Shuffle them and pick the first one.
	shuffleArray(emptySquares);
	let r = emptySquares[0].r;
	let c = emptySquares[0].c;
	SNAKE_BOARD_LOGICAL[r][c] = FRUIT;
}


//----------------------------------------------------------------------------------
//Called upon clicking the 'Options' button. Toggles the display of the game options.
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


//----------------------------------------------------------------------------------
//Helper function to rotate the snake's head.
//The snake's head is unique in that it has a small border-radius set for two of its sides.
//This must be rotated as the snake changes direction.
function rotateSnakeSquare(r, c, deg) {
	if (GAME_RUNNING) {
		//Locate the snake head on the board and rotate it with a CSS transform.
		SNAKE_BOARD_VISUAL.rows[r].cells[c].style.transform = `rotate(${deg}deg)`;
	}
}


//----------------------------------------------------------------------------------
//Helper function to determine if a snake position is within the bounds of the board.
function isInBounds(row, col) {
	if (row < 0 || row >= NUM_ROWS || col < 0 || col >= NUM_COLS) { return false; }
	return true;
}


//----------------------------------------------------------------------------------
//Helper function to determine if the snake has either hit a wall or itself.
function isDeathSquare(row, col) {
	if (!isInBounds(row, col)) { return true; }  //Oops! The snake ran into the wall.
	if (SNAKE_BOARD_LOGICAL[row][col] == SNAKE_BODY) { return true; }  //Yikes! The snake ran into itself.
	return false;
}


//----------------------------------------------------------------------------------
//Advance the snake by 1 square in the appropriate direction.
//This is called upon every iteration of the main game loop.
//Returning true = the player lost the game on this move.
//Returning false = the player lives on.
function moveSnake(direction) {
	if (!GAME_RUNNING) { return; }
	let moveInfo = {"gameWon": false, "gameLost": false, "fruitWasEaten": false, "newTailRow": null, "newTailCol": null, "previousTail": null};
	//Figure out the appropriate increments for the snake head's row and column.
	let incR, incC;
	switch(DIRECTION) {
	case UP:     //Up
		incR = -1; incC = 0; 
		break;
	case RIGHT:  //Right
		incR = 0; incC = 1; 
		break;
	case DOWN:   //Down
		incR = 1; incC = 0; 
		break;
	case LEFT:   //Left
		incR = 0; incC = -1; 
		break;
	}
	
	//Grab the snake head's previous row and column.
	let prevRow = SNAKE_LL.r
	let prevCol = SNAKE_LL.c;
	//Change the snake head's position. But don't actually move the snake head just yet.
	SNAKE_LL.r += incR;
	SNAKE_LL.c += incC;
	//If the game is already won, no need to allow the player to move further.
	if (isGameWon()) { 
		//Restore the snake head's position.
		SNAKE_LL.r = prevRow;
		SNAKE_LL.c = prevCol;
		rotateSnakeSquare(prevRow, prevCol, DIRECTION);
		moveInfo.gameWon = true;  //Game win.
		return moveInfo; 
	}
	//If this new square results in losing the game (it isn't an empty square)...
	if (isDeathSquare(SNAKE_LL.r, SNAKE_LL.c)) { 
		//Restore the snake head's position.
		SNAKE_LL.r = prevRow;
		SNAKE_LL.c = prevCol;
		//But rotate the head in the game-losing direction at least (to show the user where they went wrong).
		rotateSnakeSquare(prevRow, prevCol, DIRECTION);
		moveInfo.gameLost = true;  //Game loss.
		return moveInfo;
	}
	//Rotate the snake's head in the appropriate direction.
	rotateSnakeSquare(SNAKE_LL.r, SNAKE_LL.c, DIRECTION);
	rotateSnakeSquare(prevRow, prevCol, 0);  //Rotate the previous square back to normal.
	
	//Now actually move the snake's head.
	SNAKE_BOARD_LOGICAL[prevRow][prevCol] = EMPTY;
	//But before wiping out the contents of the new head position with SNAKE_HEAD, check if a fruit was there.
	let fruitWasEaten = (SNAKE_BOARD_LOGICAL[SNAKE_LL.r][SNAKE_LL.c] == FRUIT);
	moveInfo.fruitWasEaten = fruitWasEaten;
	SNAKE_BOARD_LOGICAL[SNAKE_LL.r][SNAKE_LL.c] = SNAKE_HEAD;
	
	//Traverse through the snake linked list to have the rest of the body follow the head's lead.
	let addNewTailInfo = moveSnakeBody(prevRow, prevCol);
	moveInfo.newTailRow = addNewTailInfo.r;
	moveInfo.newTailCol = addNewTailInfo.c;
	moveInfo.previousTail = addNewTailInfo.previousTail;
	
	return moveInfo;
}


//----------------------------------------------------------------------------------
//Helper function to move the rest of the snake body (everything but the head).
//Of course, the body should follow the head's lead, trekking in the same path.
//This traverses through the linked list and sets each body part's location to be that of its successor's previous square.
function moveSnakeBody(prevRow, prevCol) {
	let snakeNode = SNAKE_LL;  //Start out 'snakeNode' as the head. This will get immediately replaced with the first non-head body part.
	let tempPrevRow, tempPrevCol;
	//While there's still a body part to move...
	while (snakeNode.prev) {
		snakeNode = snakeNode.prev;
		//Get the node's current position (which will become the previous position).
		tempPrevRow = snakeNode.r;
		tempPrevCol = snakeNode.c;
		//Give this node a new position..
		snakeNode.r = prevRow;
		snakeNode.c = prevCol;
		//Officially move this body part.
		SNAKE_BOARD_LOGICAL[tempPrevRow][tempPrevCol] = EMPTY;
		SNAKE_BOARD_LOGICAL[prevRow][prevCol] = SNAKE_BODY;
		//Set up for the next iteration.
		prevRow = tempPrevRow;
		prevCol = tempPrevCol;
	}
	//Return information about the current tail. If the snake has just eaten a fruit, this will be needed in order to create a new tail.
	return {"r": prevRow, "c": prevCol, "previousTail": snakeNode};
}


//----------------------------------------------------------------------------------
//The main game loop.
//This is only entered after the user has made some kind of snake-moving input on the board, whether a swipe or a keyboard press.
//The timing is done with a setInterval, and the snake simply is told to move in the direction specified in DIRECTION on every iteration.
function runGame() {
	GAME_RUNNING = true;  //Officially start the game.
	let gameScore = 0;
	let moveInfo;
	let numBodyPartsToAdd = 0;  //Keep track of how many snake body parts to add. Because of FRUIT_EFFECT, there can be a backlog that we need to keep track of.
	let addNewFruit = false;  //Flag used to determine when to place another fruit and when not to.
	GAME_TIMER_ID = setInterval(function() {
		moveInfo = moveSnake(DIRECTION);
		CURRENT_DIRECTION = DIRECTION;
		
		//Has the player won or lost? If so, handle the endgame condition and finish.
		if (moveInfo.gameWon || moveInfo.gameLost) { 
			//The game has ended. Stop the looping.
			clearInterval(GAME_TIMER_ID);
			//Officially end the game.
			GAME_RUNNING = false;
			GAME_OVER = true;
			//Run end-of-game code.
			handleEndOfGame(gameScore);
			return;
		}	
		
		addNewFruit = false;
		//If a fruit was just eaten...
		if (moveInfo.fruitWasEaten) {
			numBodyPartsToAdd += parseInt(FRUIT_EFFECT);
			addNewFruit = true;
		}
		//If there's a body part queued up to be added, then add it.
		if (numBodyPartsToAdd > 0) {
			//Increment the snake's length by adding a new tail.
			addToSnakeLength(moveInfo.newTailRow, moveInfo.newTailCol, moveInfo.previousTail);
			//Place another fruit on the board.
			if (addNewFruit) { placeNewFruit(); }
			//Increment the game score.
			gameScore++;
			document.getElementById("gameCaption_score").innerText = gameScore;
			document.getElementById("gameSkillScoreCaption").innerText = getSkillLevel(calculateSkillPoints(gameScore));
			numBodyPartsToAdd--;
		}
		
		//Visually update the board with this iteration's new changes.
		updateSnakeBoard();
		
	//This interval time is kind of peculiar, I agree. It takes a number (GAME_SPEED), which is between 0 and 10, and converts it to an appropriate number of milliseconds.
	}, (40 + ((10-GAME_SPEED)*20)));
}


//----------------------------------------------------------------------------------
//Helper function to give the snake a new tail.
let addToSnakeLength = function(newTailRow, newTailCol, previousTail) {
	//Create the new tail.
	let newTail = newSnakeNode(newTailRow, newTailCol, null);
	previousTail.prev = newTail;
	//Officially recognize this new body part in the logical board.
	SNAKE_BOARD_LOGICAL[newTailRow][newTailCol] = SNAKE_BODY;
	return newTail;  //Sometimes the new tail information is needed (for example, making yet another new tail).
}


//----------------------------------------------------------------------------------
//Called upon the game being won or lost.
//Does a neat color wave that washes over the snake.
//Also, handles score and high score information.
let handleEndOfGame = function(gameScore) {
	let gameWon = isGameWon();
	//First of all, make sure that the game-terminating-board-state is showing.
	updateSnakeBoard();
	//Kind of strange, but this timeout is needed so that the board changes made in 'updateSnakeBoard' are properly flushed before altering the snake's CSS styling.
	//Without, the color wave does not work. The call to 'updateSnakeBoard' would take precedence and would result in boring, regular styling.
	setTimeout(function() {
		let color;
		if (gameWon) { color = "green"; }
		else { color = "red"; }
		
		//Use CSS transitions to give the color wave its cool effect.
		let transitionTime = 0.5;
		let snakeNode = SNAKE_LL;
		//Traverse through the linked list, starting at the head, and style the snake.
		while (snakeNode) {
			SNAKE_BOARD_VISUAL.rows[snakeNode.r].cells[snakeNode.c].children[0].style.transition = "all " + transitionTime + "s";
			SNAKE_BOARD_VISUAL.rows[snakeNode.r].cells[snakeNode.c].children[0].style.backgroundColor = color;
			transitionTime += 1;
			snakeNode = snakeNode.prev;
		}
	}, 50);
	
	//Check if the user's score is better than (or equal to) their best.
	if (gameScore > 0 && gameScore >= getUserHighScoreData(false)) {
		//If the player won the game...
		if (gameWon) {
			//Give the player a score of "WIN".
			document.getElementById("gameCaption_score").innerText = `${gameScore} (WIN)`;
			gameScore = "WIN";
		}
		document.getElementById("gameCaption_highScore").innerText = gameScore;
		//Save the new high score and related items.
		recordUserHighScoreData(gameScore);
		recordUserSkillPointData(gameScore);
		saveUserData();  //Commit to Local Storage.
	}
}


//----------------------------------------------------------------------------------
//Helper function to determine if the game has been won.
//Checks if the board is completely filled with the snake.
function isGameWon() {
	let snakeLength = 0;
	let totalSquares = 0;
	for (let r=0; r<NUM_ROWS; r++) {
		for (let c=0; c<NUM_COLS; c++) {
			totalSquares++;
			if (SNAKE_BOARD_LOGICAL[r][c] == SNAKE_BODY || SNAKE_BOARD_LOGICAL[r][c] == SNAKE_HEAD) {
				snakeLength++;
			}
		}
	}
	//Compare the total number of squares with the number of squares occupied by the snake.
	if (snakeLength == totalSquares) { return true; }
	return false;
}


//----------------------------------------------------------------------------------
//Called upon clicking the 'Apply' button in the 'Options' tab. 
//This takes all of the widget values and applies them to the game, redrawing the entire board and queueing up a new game.
//Essentially, it ensures that the game's global variables are all up to date with the newest preferences, and re-sets-up the game.
function applyOptionsChanges() {
	//Important game stuff. 
	GAME_SPEED = parseInt(document.getElementById("speedRangeInput").value);
	NUM_ROWS = parseInt(document.getElementById("rowsRangeInput").value);
	NUM_COLS = parseInt(document.getElementById("colsRangeInput").value);
	AVAILABLE_FRUIT = parseInt(document.getElementById("numFruitRangeInput").value);
	FRUIT_EFFECT = parseInt(document.getElementById("fruitEffectRangeInput").value);
	ZOOM_LEVEL = parseInt(document.getElementById("zoomRangeInput").value);
	changeStyleCSS(`width: ${20+((ZOOM_LEVEL-1)*10)}px; height: ${20+((ZOOM_LEVEL-1)*10)}px; padding: 0px;`, "#snakeBoard td", "snake");
	//Color stuff.
	COLOR_SNAKE = document.getElementById("snakeColorPicker").value;
	changeStyleCSS(`background-color: ${COLOR_SNAKE};`, "#snakeBoardContainer .snakeHead div", "snake");
	changeStyleCSS(`background-color: ${COLOR_SNAKE};`, "#snakeBoardContainer .snakeBody div", "snake");
	COLOR_FRUIT = document.getElementById("fruitColorPicker").value;
	changeStyleCSS(`background-color: ${COLOR_FRUIT};`, "#snakeBoardContainer .fruit div", "snake");
	COLOR_BOARD = document.getElementById("backgroundColorPicker").value;
	changeStyleCSS(`background-color: ${COLOR_BOARD};`, "#snakeBoardContainer #snakeBoard td", "snake");
	//Make sure the captions around the board are up to date.
	document.getElementById("gameCaption_numRows").innerText = NUM_ROWS;
	document.getElementById("gameCaption_numCols").innerText = NUM_COLS;
	document.getElementById("gameCaption_speed").innerText = GAME_SPEED;
	//Save these new preferences into Local Storage.
	saveUserData();
	//Set up the game. This does a fresh redraw of the board.
	setupGame();
	//Finally, close the 'Options' tab.
	toggleGameOptions();
}


//----------------------------------------------------------------------------------
//Helper function to create a new, generic snake body part node.
function newSnakeNode(r, c, previousNode) {
	return {"r": r, "c": c, "prev": previousNode};
}


//----------------------------------------------------------------------------------
//Set up the game, relying on the values of global variables to dictate how things are set up.
function setupGame() {
	//Reset game status global variables.
	clearInterval(GAME_TIMER_ID);
	GAME_RUNNING = false;
	GAME_OVER = false;
	DIRECTION = RIGHT;
	CURRENT_DIRECTION = DIRECTION;
	
	//If this is the first call to 'setupGame()', then get the user's data out on Local Storage.
	if (INITIAL_PAGE_LOAD) { 
		getSavedUserData();
		populateSkillScoresTable(false);
		INITIAL_PAGE_LOAD = false; 
	}
	
	//Reset score data.
	let savedUserHighScore = getUserHighScoreData(true);
	document.getElementById("gameCaption_highScore").innerText = savedUserHighScore;
	document.getElementById("gameCaption_score").innerText = 0;
	
	document.getElementById("gameSkillScoreCaption").innerText = "-";
	if (savedUserHighScore == 0) { document.getElementById("gameSkillHighScoreCaption").innerText = "-"; }
	else { document.getElementById("gameSkillHighScoreCaption").innerText = getSkillLevel(calculateSkillPoints(savedUserHighScore)); }
	document.getElementById("gameSkillMaxScoreCaption").innerText = getSkillLevel(calculateSkillPoints("WIN"));
	
	let skillScoresTableBody = document.getElementById("topSkillScoresTableBody");
	let highlightedRows = skillScoresTableBody.getElementsByClassName("mostRecentAddition");
	if (highlightedRows.length > 0) {
		highlightedRows[0].classList.remove("mostRecentAddition");
	}

	//Create the logical and visual boards.
	initializeLogicalBoard();
	initializeVisualBoard();
	
	//Create the initial snake. I chose to have it initially consist of a head and 2 additional body parts.
	//Place the snake in the middle of the board toward the left edge.
	let row = Math.floor(NUM_ROWS/2);
	let snakeHead = newSnakeNode(row, 3, null);
	SNAKE_BOARD_LOGICAL[row][3] = SNAKE_HEAD;
	let newTail = addToSnakeLength(row, 2, snakeHead);
	addToSnakeLength(row, 1, newTail);
	//Set the snake linked list to point to the head, which contains info about the next node in line, which contains info about the last node (the tail).
	SNAKE_LL = snakeHead;
	
	//Depending on how many fruit should be placed on the board, place them.
	//This loop need only happen once, since every individual fruit will be replaced as it is eaten.
	for (let i=0; i<AVAILABLE_FRUIT; i++) {
		placeNewFruit();
	}
	//Draw the logical board's contents.
	updateSnakeBoard();
}


//----------------------------------------------------------------------------------
//When the DOM is loaded, set up everything as needed.
window.addEventListener("load", function() {
	//Add event listeners for the 'Options' tab sliders so that their corresponding labels can display their values.
	document.getElementById("rowsRangeInput").addEventListener("input", function() {
		document.getElementById("rowsRangeDisplay").innerText = document.getElementById("rowsRangeInput").value;
	});
	document.getElementById("colsRangeInput").addEventListener("input", function() {
		document.getElementById("colsRangeDisplay").innerText = document.getElementById("colsRangeInput").value;
	});
	document.getElementById("speedRangeInput").addEventListener("input", function() {
		document.getElementById("speedRangeDisplay").innerText = document.getElementById("speedRangeInput").value;
	});
	document.getElementById("numFruitRangeInput").addEventListener("input", function() {
		document.getElementById("numFruitRangeDisplay").innerText = document.getElementById("numFruitRangeInput").value;
	});
	document.getElementById("fruitEffectRangeInput").addEventListener("input", function() {
		document.getElementById("fruitEffectRangeDisplay").innerText = document.getElementById("fruitEffectRangeInput").value;
	});
	document.getElementById("zoomRangeInput").addEventListener("input", function() {
		document.getElementById("zoomRangeDisplay").innerText = (100+((document.getElementById("zoomRangeInput").value-1)*50)) + "%";
	});
	//Add swipe events to the board.
	addSwipeEventListeners(document.getElementById("snakeBoardContainer"), true);
	//And... go!
	setupGame();
});

} //Secure code block END...