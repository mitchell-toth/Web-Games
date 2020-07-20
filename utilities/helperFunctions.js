//Mitchell Toth
//helperFunctions.js
//Some really handy helper functions for the Games site.


//Fisher-Yates array shuffle algorithm.
function shuffleArray(a) {
    let j, x, i;
    for (i = a.length-1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}


//Helper function to print out a 2D logical board.
function print2DBoard(board) {
	for (let r=0; r<board.length; r++) {
		let row = "";
		for (let c=0; c<board[0].length; c++) {
			if (board[r][c]) { row += board[r][c] + " "; }
			else { row += "-" + " "; }
		}
		console.log(row);
	}
	console.log("\n");
}


//Helper function to check if two 1D arrays are equal.
function arraysEqual(a1, a2) {
	if (a1.length != a2.length) { return false; }
	let length = a1.length;
	for (let i=0; i<length; i++) {
		if (a1[i] != a2[i]) { return false; }
	}
	return true;
}


//Helper function to determine if an item is in an array.
function ifItemInArray(item, a) {
	let length = a.length-1;
	for (let i=length; i>=0; i--) {
		if (a[i] == item) { return true; }
	}
	return false;
}


//Helper function returning true if 'val' is null or undefined, false otherwise.
function NullorUndf(val) {
	return (val === undefined || val === null);
}


//Hide a DOM element.
function hide(elem) {
	elem.classList.add("hidden");
}

//Unhide a DOM element.
function show(elem) {
	elem.classList.remove("hidden");
}

//Check if a DOM element is hidden.
function isHidden(elem) {
	return elem.classList.contains("hidden");
}


//Helper function to update any CSS identifier in a specified stylesheet.
//Awesome for making easy, clean styling updates.
function changeStyleCSS(newStyleContents, elemStyleIdentifier, cssSheetTitle) {
	//Peer into the depths of the document's css style sheets and change the element's class.
	for (let i=0; i<document.styleSheets.length; i++) {
		let sheet = document.styleSheets[i];
		if (sheet.title == cssSheetTitle) {
			for (let q=0; q<sheet.cssRules.length; q++) {
				let rule = sheet.cssRules[q];
				if (rule.selectorText == elemStyleIdentifier) {
					sheet.removeRule(q);  //Remove the old.
					sheet.insertRule(`${elemStyleIdentifier} { ${newStyleContents} }`, 0);  //Insert the new.
					break;
				}
			}
			break;
		}
	}
}


//Helper function to create/update a Local Storage variable to hold user data.
function setLocalStorageItem(id_string, value) {
	window.localStorage.setItem(id_string, JSON.stringify(value));
}


//Helper function to get a Local Storage variable. Parameter 'default_value' is returned if variable is not set.
function getLocalStorageItem(id_string, default_value, parseAsInteger=false) {
	let localStorageValue = window.localStorage.getItem(id_string);
	if (parseAsInteger) {
		if (localStorageValue) { return parseInt(JSON.parse(localStorageValue)); }
		else { return parseInt(default_value); }
	}
	else {
		if (localStorageValue) { return JSON.parse(localStorageValue); }
		else { return default_value; }
	}
}


//Get the current date and time in a nice format.
function Now() {
	//12-hour-time conversion function: https://stackoverflow.com/questions/8888491/how-do-you-display-javascript-datetime-in-12-hour-am-pm-format/17538193
	function format12HourTime(date) {
		let hours = date.getHours();
		let minutes = date.getMinutes();
		let ampm = hours >= 12 ? 'pm' : 'am';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		minutes = minutes < 10 ? '0'+minutes : minutes;
		return hours + ':' + minutes + ampm;
	}

	let today = new Date();
	let date = (today.getMonth()+1)+'/'+today.getDate()+'/'+today.getFullYear();
	let time = format12HourTime(today);
	return date+' '+time;
}