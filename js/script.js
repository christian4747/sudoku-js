/**
 * !!IMPORTANT!!
 * As opposed to traditional x and y, refer to x as the row and y as the column number.
 * The board's top left is the origin 0, 0.
 * The x coordinate goes up as the row gets lower (bottom left is 8, 0).
 * The y coordinate goes up as the column gets higher (top right is 0, 8). 
 *
 * Other notes about the structure of this project:
 * The grid itself is composed of 9 rows or "sudoku-cells".
 * Each "sudoku-cell" contains a "sudoku-number" which stores the number value and shows it to the user.
 * Each "sudoku-cell" also contains a "note-container".
 * Each "note-container" stores "note-{1-9}" which controls showing number notes for each cell.
 * Manipulations on the board are mainly composed of changing the textContent of "sudoku-number" elements which are stored in "sudokuGrid".
 */

// # CONSTANT VARIABLES # //

// List of keys that can be used to edit a square's value
const editKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Backspace'];
// List of keys that can be used to move around the grid space
const movementKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
// Center of each 3x3 on the grid used for calcuations
const gridCenters = [
    [1, 1], [1, 4], [1, 7],
    [4, 1], [4, 4], [4, 7],
    [7, 1], [7, 4], [7, 7],
];
// Used to add confetti on game win
const jsConfetti = new JSConfetti();
// Symbols used for loading boards
const symbols = ['!', '@', '#', '$', '%', '^', '&', '*', '('];

// # NON-CONSTANT VARIABLES # //

// Contains the "sudoku-number" (element storing the number in plain text on the html) for each cell in the grid
let sudokuGrid = [];
// An array of performed actions for the undo functionality
let previousActions = [];
// An array of "undo'd" actions, allowing them to be "redo'd"
let redoActions = [];
// Whether or not the last performed user action was an undo
let lastActionUndo = false;
// The user's currently selected cell
let selectedCell = '';
// How many seconds have passed in the game
let secondsPassed = 0;
// Stores the setInterval() for the game's timer
let timerInterval;
// Whether or not the game is paused
let paused = false;
// Whether or not the user is setting notes for grid spaces
let noteMode = false;
// Whether or not darkMode is enabled
let darkMode = false;
// Number of errors currently on the board
let numberOfErrors = 0;

// # GAME FUNCTIONS & LOGIC # //

/**
 * Initializes a brand new sudoku grid.
 * @param {int} hintNum the number of hints to include in the new board
 */
const initializeGrid = (hintNum) => {
    clearBoard();
    backTrackMe(sudokuGrid);

    let randomArray = [];
    for (let i = 0; i < 81; i++) {
        randomArray.push(i);
        let to2d = positionConversion(i, 9);
        sudokuGrid[to2d[0]][to2d[1]].unmodifiable = true;
    }
    fisherYatesShuffle(randomArray);

    let positions = [];
    for (let i = 0; i < 81 - hintNum; i++) {
        positions.push(randomArray.pop());
    }

    for (let pos of positions) {
        let to2d = positionConversion(pos, 9);
        sudokuGrid[to2d[0]][to2d[1]].textContent = '';
        sudokuGrid[to2d[0]][to2d[1]].unmodifiable = false;
        sudokuGrid[to2d[0]][to2d[1]].classList.add('modifiable');
    }
}

/**
 * Performs the Fisher-Yates shuffle algorithm on an array.
 * Mutates the given array.
 * @param {Array} arr the array to be shuffled
 */
const fisherYatesShuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (arr.length - 1));
        let temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}

/**
 * Returns a position (Array [x, y]) based on the given 1d position and total cells in the grid.
 * Helpful for transforming a flat 1d position (cell 1-81) to a 2d position (cell [x, y]).
 * @param {int} num the cell's position to convert to x and y
 * @param {int} len the number of rows on the grid
 * @returns an Array [x, y] where position num is located on the grid
 */
const positionConversion = (num, len) => {
    return [Math.floor(num / len), num % len];
}

/**
 * Returns whether a given x or y is valid for the sudoku grid.
 * @param {int} x the x value coordinate on the grid 
 * @param {int} y the y value coordinate on the grid
 * @returns true if x and y position is valid for the grid, false otherwise
 */
const validPosition = (x, y) => {
    return !(x < 0 || x > 8 || y < 0 || y > 8);
}

/**
 * Transforms a 1d Array to a 2d Array.
 * @param {Array} arr Array to be transformed to 2d
 * @param {int} len width and height of the new array
 * @returns the given 1d Array transformed into a 2d Array
 */
const flatTo2d = (arr, len) => {
    let newArray = new Array(len);
    for (let i = 0; i < len; i++) {
        newArray[i] = new Array(len);
    }

    for (let i = 0; i < arr.length; i++) {
        newArray[Math.floor(i / len)][i % len] = arr[i];
    }
    return newArray;
}

/**
 * Highlights the sudoku cell that is clicked or navigated to with arrow keys.
 * @param {Element} e the sudoku cell element to highlight
 */
const clickCell = (e) => {
    if (selectedCell.length != 0) {
        highlightSelection(selectedCell.x, selectedCell.y);
        highlightSameNumbers(selectedCell.x, selectedCell.y);
    }
    selectedCell = e.parentElement;
    // console.log(selectedCell.x, selectedCell.y);
    highlightSelection(selectedCell.x, selectedCell.y);
    highlightSameNumbers(selectedCell.x, selectedCell.y);
}

/**
 * Handles what should happen when a sudoku cell is directly clicked.
 * @param {Event} e the Event from clicking
 */
const clickCellEvent = (e) => {
    if (paused) {
        return;
    }
    clickCell(e.target);
}


/**
 * Handles movement around the grid with arrow keys.
 * @param {String} key the key which has been pressed
 */
const moveInDirection = (key) => {
    if (key == 'ArrowUp') {
        if (validPosition(selectedCell.x - 1, selectedCell.y)) {
            clickCell(sudokuGrid[selectedCell.x - 1][selectedCell.y]);
        }
    } else if (key == 'ArrowDown') {
        if (validPosition(selectedCell.x + 1, selectedCell.y)) {
            clickCell(sudokuGrid[selectedCell.x + 1][selectedCell.y]);
        }
    } else if (key == 'ArrowLeft') {
        if (validPosition(selectedCell.x, selectedCell.y - 1)) {
            clickCell(sudokuGrid[selectedCell.x][selectedCell.y - 1]);
        }
    } else if (key == 'ArrowRight') {
        if (validPosition(selectedCell.x, selectedCell.y + 1)) {
            clickCell(sudokuGrid[selectedCell.x][selectedCell.y + 1]);
        }
    }
}

/**
 * Checks whether a given x and y is a valid sudoku value for the current number arrangement.
 * @param {int} x the x position of the cell
 * @param {int} y the y position of the cell
 * @returns true if number is valid, false otherwise
 */
const checkCoordinate = (x, y) => {
    // check if empty: empty = no conflicts, skip unmodifiable cells
    let val = sudokuGrid[x][y].textContent;
    if (val == '' || sudokuGrid[x][y].unmodifiable) {
        return true;
    }
    // check horizontally
    for (let i = 0; i < 9; i++) {
        // skip if comparing current cell
        if (i != y) {
            let check = sudokuGrid[x][i].textContent;
            if (val == check || check.length > 1) {
                return false;
            }
        }
    }
    // check vertically
    for (let i = 0; i < 9; i++) {
        let check = sudokuGrid[i][y].textContent;
        // skip if comparing current cell
        if (i != x) {
            if (val == check || check.length > 1) {
                return false;
            }
        }
    }
    // check the grid it exists in
    let centerPoint = closestGrid(x, y);
    for (let i = centerPoint[0] - 1; i < centerPoint[0] + 2; i++) {
        for (let j = centerPoint[1] - 1; j < centerPoint[1] + 2; j++) {
            if (i != x && j != y) {
                let check = sudokuGrid[i][j].textContent;
                if (val == check || check.length > 1) {
                    return false;
                }
            }
        }
    }
    return true;
}

/**
 * Checks whether row x is a valid row according to sudoku rules.
 * @param {int} x the row to check
 * @returns true if the row is valid, false otherwise
 */
const checkRow = (x) => {
    let current = [];
    for (let i = 0; i < 9; i++) {
        let check = sudokuGrid[x][i].textContent;
        if (current.includes(check) || check.length > 1) {
            return false;
        }
        if (check != '') {
            current.push(check);
        }
    }
    return true;
}

/**
 * Checks whether column y a valid column according to sudoku rules.
 * @param {int} y the column to be checked
 * @returns true if the column is valid, false otherwise
 */
const checkCol = (y) => {
    let current = [];
    for (let i = 0; i < 9; i++) {
        let check = sudokuGrid[i][y].textContent;
        if (current.includes(check) || check.length > 1) {
            return false;
        }
        if (check != '') {
            current.push(check);
        }
    }
    return true;
}

/**
 * Checks whether the 3x3 grid closest to the x and y position is valid according to sudoku rules.
 * @param {int} x the x position of the position to check
 * @param {int} y the y position of the position to check
 * @returns true if the grid is valid, false otherwise
 */
const checkGrid = (x, y) => {
    let centerPoint = closestGrid(x, y);
    let current = [];

    for (let i = centerPoint[0] - 1; i < centerPoint[0] + 2; i++) {
        for (let j = centerPoint[1] - 1; j < centerPoint[1] + 2; j++) {
            let check = sudokuGrid[i][j].textContent;
            if (current.includes(check) || check.length > 1) {
                return false;
            }
            if (check != '') {
                current.push(check);
            }
        }
    }
    return true;
}

/**
 * Returns a position (Array [x, y]) of the nearest grid's center point from the given x and y position.
 * @param {int} x the x position of the nearest grid to find for
 * @param {int} y the y position of the nearest grid to find for
 * @returns the position (Array [x, y]) of the nearest grid center to the given x and y position.
 */
const closestGrid = (x, y) => {
    let least, centerPoint;
    for (let gridCenter of gridCenters) {
        if (x == gridCenter[0] && y == gridCenter[1]) {
            return gridCenter;
        }
        let currentDist = dist(x, y, gridCenter[0], gridCenter[1]);
        if (!least) {
            least = currentDist;
            centerPoint = gridCenter;
        } else if (currentDist < least) {
            least = currentDist;
            centerPoint = gridCenter;
        }
    }
    return centerPoint;
}

/**
 * Returns the distance between two [x, y] position.
 * @param {int} x1 the x of the first position
 * @param {int} y1 the y of the first position
 * @param {int} x2 the x of the second position
 * @param {int} y2 the y of the second position
 * @returns the distance between the two given positions
 */
const dist = (x1, y1, x2, y2) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Checks whether the game board is still valid within sudoku rules.
 * @returns true if the game is still valid, false otherwise
 */
const checkGame = () => {
    let valid = true;
    for (let i = 0; i < 9; i++) {
        if (!valid) { return false; }
        valid = checkRow(i) && checkCol(i) && checkGrid(gridCenters[i][0], gridCenters[i][1]);
    }
    return valid;
}

/**
 * Checks whether a completed board is valid within sudoku rules.
 * @returns true if the completed board is valid, false otherwise
 */
const checkSolution = () => {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (sudokuGrid[i][j].textContent == '') {
                return false;
            }
        }
    }
    return checkGame();
}

/**
 * Returns the first empty space found on the sudoku board.
 * @param {Array} grid the grid to search an empty spot for
 * @returns position (Array [x, y]) of the first empty space, or [-1, -1] if none
 */
const findEmptySpace = (grid) => {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (grid[i][j].textContent == '') {
                return [i, j];
            }
        }
    }
    return [-1, -1];
}

/**
 * With reference from https://www.geeksforgeeks.org/sudoku-backtracking-7/
 * and https://brilliant.org/wiki/recursive-backtracking/
 * 
 * Performs backtracking on the sudoku grid to solve the puzzle or create random new ones. 
 * @param {Array} grid the grid to perform backtracking on
 * @returns true if successfully backtracks, false otherwise
 */
const backTrackMe = (grid) => {
    if (checkSolution()) {
        return true;
    }
    let location = findEmptySpace(grid);
    let gridCopy = grid.slice();
    let candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    while (candidates.length > 0) {
        let idx = Math.floor(Math.random() * candidates.length);
        gridCopy[location[0]][location[1]].textContent = candidates[idx];
        if (checkGame() && backTrackMe(gridCopy)) {
            return true;
        }
        gridCopy[location[0]][location[1]].textContent = '';
        candidates.splice(idx, 1);
    }
    return false;
}

/**
 * Clears the sudoku game board, resetting everything a clean board.
 * Restarts the game's timer and clear the notes on the board.
 */
const clearBoard = () => {
    previousActions = [];
    redoActions = [];
    clearInterval(timerInterval);
    secondsPassed = 0;
    restartTimer();
    clearNotes();
    clearHighlights();
    clearSelectedCell();
    showBoardView();
    showTimer();
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            sudokuGrid[i][j].textContent = '';
            sudokuGrid[i][j].textContent.unmodifiable = false;
            sudokuGrid[i][j].classList.remove('modifiable');
        }
    }
}

/**
 * Removes all notes on the sudoku board.
 */
const clearNotes = () => {
    const notes = document.querySelectorAll('.note-1, .note-2, .note-3, .note-4, .note-5, .note-6, .note-7, .note-8, .note-9');
    for (let note of notes) {
        note.remove();
    }
}

/**
 * Clears the notes of the selected "sudoku-cell".
 */
const clearSelectedCellNotes = () => {
    // TODO: Add implementation
}

/**
 * Clears the currently selected "sudoku-cell" (sets it an empty string).
 */
const clearSelectedCell = () => {
    selectedCell = '';
}

/**
 * Returns a string formatted in {minutes:seconds} based on the given number.
 * @param {int} seconds the number of seconds to convert to {minutes:seconds}
 * @returns the {minutes:seconds} string that corresponds to the given amount of seconds
 */
const secondsToTimeString = (seconds) => {
    return seconds % 60 < 10 ? `${Math.floor(seconds / 60)}:0${seconds % 60}` : `${Math.floor(seconds / 60)}:${seconds % 60}`;
}

/**
 * Restarts the game's timer.
 */
const restartTimer = () => {
    paused = false;
    document.querySelector('#timer').textContent = '0:00';
    clearInterval(timerInterval);
    timerInterval = setInterval(() =>{
        secondsPassed++;
        document.querySelector('#timer').textContent = secondsToTimeString(secondsPassed);
    }, 1000);
}

/**
 * Pauses the game's timer.
 */
const pauseTimer = () => {
    if (!paused) {
        clearInterval(timerInterval);
        paused = true;
    }
}

/**
 * Resumes the game's timer from a paused state.
 */
const resumeTimer = () => {
    if (paused) {
        timerInterval = setInterval(() =>{
            secondsPassed++;
            document.querySelector('#timer').textContent = secondsToTimeString(secondsPassed);
        }, 1000);
        paused = false;
    }
}

/**
 * Hides the game's timer.
 */
const hideTimer = () => {
    const cell = document.querySelector('#timer');
    cell.classList.remove('show-anim');
    cell.classList.add('hide');
}

/**
 * Shows the game's timer.
 */
const showTimer = () => {
    const cell = document.querySelector('#timer');
    cell.classList.remove('hide');
    cell.classList.add('show-anim');
}

/**
 * Hides the view of the sudoku board.
 */
const hideBoardView = () => {
    for (let cell of document.querySelectorAll('.sudoku-number')) {
        cell.classList.remove('show-anim');
        cell.classList.add('hide');
    }
    for (let cell of document.querySelectorAll('.note-container')) {
        cell.classList.remove('show-anim');
        cell.classList.add('hide');
    }
    // document.querySelector('#play-area').classList.add('hide');
}

/**
 * Shows the view of the sudoku board
 */
const showBoardView = () => {
    for (let cell of document.querySelectorAll('.sudoku-number')) {
        cell.classList.remove('hide');
        cell.classList.add('show-anim');
    }
    for (let cell of document.querySelectorAll('.note-container')) {
        cell.classList.remove('hide');
        cell.classList.add('show-anim');
    }
    // document.querySelector('#play-area').classList.remove('hide');
}

/**
 * Returns the notes currently in a given "sudoku-cell".
 * If there are no notes, return a single whitespace + comma.
 * @param {Element} cell the cell to return the notes for
 * @returns a string containing the notes the cell has
 */
const getNotes = (cell) => {
    let noteContainer = cell.querySelector('.note-container');
    if (!noteContainer.firstChild) {
        return ' ,';
    }
    let notes = noteContainer.querySelectorAll('div');
    let notesString = '';
    for (let note of notes) {
        let noteNum = note.classList[0].substring(note.classList[0].length - 1);
        notesString += noteNum;
    }
    return notesString + ',';
}

/**
 * Returns a map of positions and their notes on passed row # in format:
 *   [key: 'x,y' board location string, val: comma-separated string of notes]
 * @param {int} x row number
 * @returns map of positions and their notes on passed row #
 */
const getNotesRow = (x) => {
    let notes = new Map();
    for (let i = 0; i < 9; i++) {
        let cell = sudokuGrid[x][i];
        let note = getNotes(cell.parentElement);
        notes.set(`${x},${i}`, note);
        // console.log(`row: ${note}`);
    }
    return notes;
}

/**
 * Returns a map of positions and their notes on passed column # in format:
 *   [key: 'x,y' board location string, val: comma-separated string of notes]
 * @param {int} y column number
 * @returns map of positions and their notes on passed column #
 */
const getNotesColumn = (y) => {
    let notes = new Map();
    for (let i = 0; i < 9; i++) {
        let cell = sudokuGrid[i][y];
        let note = getNotes(cell.parentElement);
        notes.set(`${i},${y}`, note);
        // console.log(`column: ${note}`);
    }
    return notes;
}

/**
 * Returns a map of positions and their notes on passed row and column # in format:
 *   [key: 'x,y' board location string, val: comma-separated string of notes]
 * @param {int} x row number of position
 * @param {int} y column number of position
 * @returns map of positions and their notes on passed x and y #
 */
const getNotesGrid = (x, y) => {
    let centerPoint = closestGrid(x, y);
    let notes = new Map();
    for (let i = centerPoint[0] - 1; i < centerPoint[0] + 2; i++) {
        for (let j = centerPoint[1] - 1; j < centerPoint[1] + 2; j++) {
            if (i != x && j != y) {
                let cell = sudokuGrid[i][j];
                let note = getNotes(cell.parentElement);
                notes.set(`${i},${j}`, note);
                // console.log(`grid: ${note}`);
            }
        }
    }
    return notes;
}

/**
 * Deletes notes that intersect with the given position that have the same value.
 * @param {int} val value to look for and delete
 * @param {int} x row number of position
 * @param {int} y column number of position
 */
const deleteIntersections = (val, x, y) => {
    let notesMap = getNotesRow(x);
    notesMap.forEach((value, key, map) => {
        value.substring(0, value.length - 1);
        if (value != ' ') {
            let notes = value.split('');
            for (let noteVal of notes) {
                let className = `note-${val}`;
                let noteDiv = sudokuGrid[key[0]][key[2]].parentElement.querySelector(`.${className}`);
                if (noteDiv && noteVal == val) {
                    noteDiv.remove();
                }
                notesMap.delete(key);
            }
        }
    });
    
    notesMap = getNotesColumn(y);

    notesMap.forEach((value, key, map) => {
        console.log(key, value)
        value.substring(0, value.length - 1);
        if (value != ' ') {
            let notes = value.split('');
            for (let noteVal of notes) {
                let className = `note-${val}`;
                let noteDiv = sudokuGrid[key[0]][key[2]].parentElement.querySelector(`.${className}`);
                if (noteDiv && noteVal == val) {
                    noteDiv.remove();
                }
                notesMap.delete(key);
            }
        }
    });

    notesMap = getNotesGrid(x, y);

    notesMap.forEach((value, key, map) => {
        value.substring(0, value.length - 1);
        if (value != ' ') {
            let notes = value.split('');
            for (let noteVal of notes) {
                let className = `note-${val}`;
                let noteDiv = sudokuGrid[key[0]][key[2]].parentElement.querySelector(`.${className}`);
                if (noteDiv && noteVal == val) {
                    noteDiv.remove();
                }
                notesMap.delete(key);
            }
        }
    });
}

/**
 * Toggles a note for the value "key" at the position [x, y].
 * @param {int} key the value of the note (ex. 1, 2, 3)
 * @param {int} x the x value of the cell to modify
 * @param {int} y the y value of the cell to modify
 */
const setNote = (key, x, y) => {
    if (getCellValue(x, y) != '') {
        hideCellNotes(x, y);
    } else {
        showCellNotes(x, y);
    }
    selectCell(x, y);
    let className = `note-${key}`;
    let noteDiv = selectedCell.querySelector(`.${className}`);
    if (noteDiv) {
        noteDiv.remove();
    } else {
        const newNoteDiv = document.createElement("div");
        newNoteDiv.classList += className;
        newNoteDiv.textContent = key;
        selectedCell.querySelector('.note-container').append(newNoteDiv);
    }
}

/**
 * Sets a group of notes at the position [x, y].
 * @param {String} notesString the notes String (e.g. 1234, 239)
 * @param {int} x the x value of the cell to modify
 * @param {int} y the y value of the cell to modify
 */
const setNotes = (notesString, x, y) => {
    if (!validPosition(x, y)) {
        return;
    }
    if (notesString == ' ') {
        return;
    }
    let selectedCell = sudokuGrid[x][y].parentElement;
    for (let i = 0; i < notesString.length; i++) {
        let key = notesString[i];
        let className = `note-${key}`;
        let noteDiv = selectedCell.querySelector(`.${className}`);
        if (!noteDiv) {
            const newNoteDiv = document.createElement("div");
            newNoteDiv.classList += className;
            newNoteDiv.textContent = key;
            selectedCell.querySelector('.note-container').append(newNoteDiv);
        }
    }
}

/**
 * Toggles a note for the value "key" for the currently selected "sudoku-cell".
 * @param {int} key the value of the note (ex. 1, 2, 3)
 */
const setSelectedNote = (key) => {
    if (getSelectedCellValue() != '') {
        hideCurrentCellNotes();
    } else {
        showCurrentCellNotes();
    }
    let className = `note-${key}`;
    let noteDiv = selectedCell.querySelector(`.${className}`);
    if (noteDiv) {
        noteDiv.remove();
    } else {
        const newNoteDiv = document.createElement("div");
        newNoteDiv.classList += className;
        newNoteDiv.textContent = key;
        selectedCell.querySelector('.note-container').append(newNoteDiv);
    }
}

/**
 * Returns whether or not the current "sudoku-cell"'s "sudoku-number" can be modified.
 * @returns true if can be modified, false otherwise
 */
const canSelectedBeModified = () => {
    return !selectedCell.querySelector('.sudoku-number').unmodifiable;
}

/**
 * Returns the "sudoku-cell" element of the currently selected "sudoku-cell".
 * @returns the "sudoku-cell" element of the currently selected "sudoku-cell"
 */
const getSelectedSudokuCell = () => {
    // TODO: Add implementation
}

/**
 * Returns the "sudoku-number" element of the currently selected "sudoku-cell".
 * @returns the "sudoku-number" element of the currently selected "sudoku-cell"
 */
const getSelectedCell = () => {
    return selectedCell;
}

/**
 * Returns the "sudoku-number" value of the "sudoku-cell" located at [x, y].
 * @param {int} x location x of the cell
 * @param {int} y location y of the cell
 * @returns the "sudoku-number" value of the "sudoku-cell" located at [x, y]
 */
const getCellValue = (x, y) => {
    if (selectedCell === '') {
        return '';
    } else {
        let sudokuNumberCell = sudokuGrid[x][y].textContent;
        return sudokuNumberCell;
    }
}

/**
 * Returns the "sudoku-number" value of the currently selected "sudoku-cell".
 * @returns the "sudoku-number" value of the currently selected "sudoku-cell"
 */
const getSelectedCellValue = () => {
    if (selectedCell === '') {
        return '';
    } else {
        let sudokuNumberCell = selectedCell.querySelector('.sudoku-number');
        return sudokuNumberCell.textContent;
    }
}

/**
 * Sets the value of a "sudoku-number" to "val" at the location [x, y].
 * @param {int} val the value to set for the cell
 * @param {int} x the x location of the cell
 * @param {int} y the y location of the cell
 */
const setCellValue = (val, x, y) => {
    selectCell(x, y);
    let sudokuNumberCell = selectedCell.querySelector('.sudoku-number');
    sudokuNumberCell.textContent = val;
    hideCurrentCellNotes();
    // highlightSameNumbers(selectedCell.x, selectedCell.y);
    // checkWin();
}

/**
 * Sets the value of a "sudoku-number" to "val" of the currently selected "sudoku-cell".
 * @param {int} val the value to set for the cell
 */
const setSelectedCellValue = (val) => {
    highlightSameNumbers(selectedCell.x, selectedCell.y);

    let sudokuNumberCell = selectedCell.querySelector('.sudoku-number');
    sudokuNumberCell.textContent = val;
    

    hideCurrentCellNotes();
    highlightSameNumbers(selectedCell.x, selectedCell.y);
    checkWin();
}

/**
 * Removes the current "sudoku-number" value of the "sudoku-cell" located at [x, y].
 * @param {int} x the x location of the cell
 * @param {int} y the y location of the cell
 */
const removeCellValue = (x, y) => {
    selectCell(x, y);
    let sudokuNumberCell = selectedCell.querySelector('.sudoku-number');
    sudokuNumberCell.textContent = '';
    showCurrentCellNotes();
}

/**
 * Removes the current "sudoku-number" value of the currently selected "sudoku-cell".
 */
const removeSelectedCellValue = () => {
    highlightSameNumbers(selectedCell.x, selectedCell.y);

    let sudokuNumberCell = selectedCell.querySelector('.sudoku-number');
    
    sudokuNumberCell.textContent = '';

    showCurrentCellNotes();
    focusSelectedCell();
}

/**
 * Used during "undo" and "redo" operations.
 * Selects the "sudoku-cell" at the given x and y and then highlights it.
 * @param {int} x the x position of the cell
 * @param {int} y the y position of the cell
 */
const selectCell = (x, y) => {
    // console.log(selectedCell.x, x, selectedCell.y, y);
    if (selectedCell.x == x && selectedCell.y == y) {
        highlightUndo();
        setTimeout(() => {
            clearHighlights();
            clearSelectedCell();
        }, 200);
        return;
    }
    // console.log(selectedCell);
    // console.log('unfocused selected');
    selectedCell = sudokuGrid[x][y].parentElement;
    highlightUndo();
    // console.log(selectedCell);
    // console.log('focused selected');
    setTimeout(() => {
        clearHighlights();
        clearSelectedCell();
    }, 200);
}

/**
 * Shows the notes currently present on the current "sudoku-cell".
 */
const showCurrentCellNotes = () => {
    let noteContainer = selectedCell.querySelector('.note-container');
    noteContainer.classList.remove('hide');
}

/**
 * Shows the notes currently present on the "sudoku-cell" located at [x, y].
 * @param {int} x the x location of the cell
 * @param {int} y the y location of the cell
 */
const showCellNotes = (x, y) => {
    let noteContainer = sudokuGrid[x][y].parentElement.querySelector('.note-container');
    noteContainer.classList.remove('hide');
}

/**
 * Hides the notes currently present on the current "sudoku-cell".
 */
const hideCurrentCellNotes = () => {
    let noteContainer = selectedCell.querySelector('.note-container');
    noteContainer.classList.add('hide');
}

/**
 * Hides the notes currently present on the "sudoku-cell" located at [x, y].
 * @param {int} x the x location of the cell
 * @param {int} y the y location of the cell
 */
const hideCellNotes = (x, y) => {
    let noteContainer = sudokuGrid[x][y].parentElement.querySelector('.note-container');
    noteContainer.classList.add('hide');
}

/**
 * Focuses the currently selected "sudoku-cell" by highlighting it on the board.
 */
const focusSelectedCell = () => {
    sudokuGrid[selectedCell.x][selectedCell.y].parentElement.classList.toggle('selected-cell-dark');
}

/**
 * Focuses a "sudoku-cell" at the location [x, y] by highlighting it.
 * @param {int} x the x position of the cell
 * @param {int} y the y position of the cell
 */
const focusCell = (x, y) => {
    sudokuGrid[x][y].parentElement.classList.toggle('selected-cell-dark');
}

/**
 * Used in "undo" and "redo" operations; highlights a cell that has been "undo'd" or "redo'd" for the player.
 */
const highlightUndo = () => {
    sudokuGrid[selectedCell.x][selectedCell.y].parentElement.classList.toggle('selected-cell-undo');
}

/**
 * Handles how the game should react to keypresses.
 * @param {Event} e the event caused by pressing a button
 */
const handleKeydown = (e) => {
    if (paused) {
        return;
    }

    if (lastActionUndo) {
        redoActions = [];
        lastActionUndo = false;
    }
    
    if (noteMode && editKeys.includes(e.key) && e.key != 'Backspace') {
        previousActions.push(['toggle-note', null, e.key, selectedCell.x, selectedCell.y]);
        setSelectedNote(e.key);
    } else if (editKeys.includes(e.key)) {
        if (selectedCell.length == 0) {
            return;
        }
        if (e.key == 'Backspace' && canSelectedBeModified() && getSelectedCellValue() != '') {
            previousActions.push(['remove', getSelectedCellValue(), null, selectedCell.x, selectedCell.y]);
            removeSelectedCellValue();
        } else if (e.key != 'Backspace' && canSelectedBeModified()) {
            previousActions.push(['set', getSelectedCellValue(), e.key, selectedCell.x, selectedCell.y]);
            setSelectedCellValue(e.key);
            deleteIntersections(e.key, selectedCell.x, selectedCell.y);
        }
    } else if (movementKeys.includes(e.key)) {
        if (selectedCell.length == 0) {
            clickCell(sudokuGrid[0][0]);
        } else {
            moveInDirection(e.key);
        }
    }
    // console.log(previousActions);
    return;
}

/**
 * Handles "undo"-ing and "redo"-ing actions on the sudoku board.
 * @param {String} command the operation to undo, redo (ex. set, remove, toggle-note)
 * @param {int} prev the previous value before the change (if applicable)
 * @param {int} val the value to change to (if applicable)
 * @param {int} x the x value of the "sudoku-cell" to "undo" or "redo"
 * @param {int} y the y value of the "sudoku-cell" to "undo" or "redo"
 * @param {boolean} undo true if the action is an undo, false if the action is a redo
 */
const handleAction = (command, prev, val, x, y, undo) => {
    // console.log(command, prev, val, x, y, undo);
    clearHighlights();
    switch (command) {
        case 'remove':
            if (undo) {
                setCellValue(prev, x, y);
            } else {
                removeCellValue(x, y);
            }
            break;
        case 'set':
            if (undo) {
                setCellValue(prev, x, y);
                if (prev == '') {
                    showCellNotes(x, y);
                }
            } else {
                setCellValue(val, x, y);
            }
            break;
        case 'toggle-note':
            // console.log('hitting notes');
            setNote(val, x, y);
            break;
        default:
            console.log(`Unknown action: ${command}`);
            break;
    }
}

/**
 * Undoes an action on the sudoku board.
 */
const undoAction = () => {
    if (previousActions.length == 0) {
        return;
    }
    let actionToPerform = previousActions.pop();
    handleAction(actionToPerform[0], actionToPerform[1], actionToPerform[2], actionToPerform[3], actionToPerform[4], true);
    redoActions.push(actionToPerform);
    lastActionUndo = true;
}

/**
 * Redos an action on the sudoku board.
 */
const redoAction = () => {
    if (redoActions.length == 0) {
        return;
    }
    let actionToPerform = redoActions.pop();
    handleAction(actionToPerform[0], actionToPerform[1], actionToPerform[2], actionToPerform[3], actionToPerform[4], false);
    previousActions.push(actionToPerform);
}

// TODO: Rewrite highlights to be more intuitive/less hardcoded
// e.g. use getCells
/**
 * Highlights the "sudoku-cell" at the position [x, y].
 * @param {int} x the position x of a cell
 * @param {int} y the position y of a cell
 * @returns 
 */
const highlightSelection = (x, y) => {
    if (!validPosition(x, y)) {
        return;
    }
    const highlightAreas = new Set();
    for (let i = 0; i < 9; i++) {
        if (!highlightAreas.has(`${x} ${i}`)) {
            highlightAreas.add(`${x} ${i}`);
            sudokuGrid[x][i].parentElement.classList.toggle('selected-cell');
        }

        if (!highlightAreas.has(`${i} ${y}`)) {
            highlightAreas.add(`${i} ${y}`);
            sudokuGrid[i][y].parentElement.classList.toggle('selected-cell');
        }
    }

    let centerPoint = closestGrid(x, y);
    for (let i = centerPoint[0] - 1; i < centerPoint[0] + 2; i++) {
        for (let j = centerPoint[1] - 1; j < centerPoint[1] + 2; j++) {
            if (!highlightAreas.has(`${i} ${j}`)) {
                highlightAreas.add(`${i} ${j}`);
                sudokuGrid[i][j].parentElement.classList.toggle('selected-cell');
            }
        }
    }
}

/**
 * Highlights locations on the board the contain the same value as the "sudoku-cell" at [x, y].
 * @param {int} x the position x of the cell
 * @param {int} y the position y of the cell
 * @returns 
 */
const highlightSameNumbers = (x, y) => {
    if (sudokuGrid[x][y].textContent == '') {
        sudokuGrid[x][y].parentElement.classList.toggle('selected-cell-dark');
        return;
    }
    let num = sudokuGrid[x][y].textContent;

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            let check = sudokuGrid[i][j];
            if (num == check.textContent) {
                check.parentElement.classList.toggle('selected-cell-dark');
            }
        }
    }
}

/**
 * Clears all currently highlighted "sudoku-cell"s on the board.
 */
const clearHighlights = () => {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            let check = sudokuGrid[i][j];
            check.parentElement.classList.remove('selected-cell-dark');
            check.parentElement.classList.remove('selected-cell');
            check.parentElement.classList.remove('selected-cell-undo');
        }
    }
}

/**
 * Checks whether the sudoku game is in a winning position.
 */
const checkWin = () => {
    if (checkSolution()) {
        jsConfetti.addConfetti();
        document.querySelector('#game-won-text').textContent = `Congratuations! You won! Your time was: ${secondsToTimeString(secondsPassed)}.`;
        setTimeout(() => {
            let modal = document.querySelector('#game-won-modal');
            modal.style.display = 'block';
        }, 750);
        pauseTimer();
    }
}

/**
 * Toggles dark mode.
 */
const toggleDarkMode = () => {
    if (darkMode) {
        document.body.classList.remove('dark-mode-anim');
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode-anim');
        localStorage.setItem('darkmode', 'false');
    } else {
        document.body.classList.add('dark-mode-anim');
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode-anim');
        localStorage.setItem('darkmode', 'true');
    }
    darkMode = !darkMode;
}

/**
 * Loads a previously saved board, timer, and notes.
 */
const loadSavedGame = () => {
    const savedBoard = localStorage.getItem('saved-board');
    loadBoard(savedBoard);

    loadTime();

    const notesString = localStorage.getItem('saved-notes');
    loadNotes(notesString);

}

/**
 * Saves the current board to a string in localStorage.
 */
const saveBoard = () => {
    let board1D = '';
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            let cellModifiable = !sudokuGrid[i][j].unmodifiable;
            let cellVal = sudokuGrid[i][j].textContent;
            if (cellModifiable) {
                board1D += numberToSymbol(cellVal);
            } else {
                board1D += cellVal;
            }
        }
    }
    localStorage.setItem('saved-board', board1D);
}

/**
 * Loads the given boardString onto the sudoku board.
 * @param {String} boardString string of numbers containing board information
 */
const loadBoard = (boardString) => {
    if (!boardString) return;

    clearBoard();

    for (let i = 0; i < boardString.length; i++) {
        let loadedVal = boardString[i];
        let convertedPos = positionConversion(i, 9);

        if (loadedVal == '0') {
            sudokuGrid[convertedPos[0]][convertedPos[1]].textContent = '';
            sudokuGrid[convertedPos[0]][convertedPos[1]].unmodifiable = false;
            sudokuGrid[convertedPos[0]][convertedPos[1]].classList.add('modifiable');
        } else if (symbols.includes(loadedVal)) {
            sudokuGrid[convertedPos[0]][convertedPos[1]].textContent = symbolToNum(loadedVal);
            sudokuGrid[convertedPos[0]][convertedPos[1]].unmodifiable = false;
            sudokuGrid[convertedPos[0]][convertedPos[1]].classList.add('modifiable');
        } else {
            sudokuGrid[convertedPos[0]][convertedPos[1]].textContent = loadedVal;
            sudokuGrid[convertedPos[0]][convertedPos[1]].unmodifiable = true;
        }
    }
}

/**
 * Saves the notes currently on the board.
 */
const saveNotes = () => {
    let notesString = '';
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            let str = getNotes(sudokuGrid[i][j].parentElement);
            notesString += str;
        }
    }
    localStorage.setItem('saved-notes', notesString);
}

/**
 * Loads the notes onto the board with the given string.
 * @param {String} notesString 
 */
const loadNotes = (notesString) => {
    if (!notesString) { return; }
    notesString = notesString.split(',');
    for (let i = 0; i < 81; i++) {
        let convertedPos = positionConversion(i, 9);
        setNotes(notesString[i], convertedPos[0], convertedPos[1]);
    }
}

/**
 * Saves the current timer's current time.
 */
const saveTime = () => {
    localStorage.setItem('saved-time', secondsPassed);
}

/**
 * Loads a saved game's timer.
 */
const loadTime = () => {
    const time = localStorage.getItem('saved-time');
    if (time) {
        secondsPassed = time;
        document.querySelector('#timer').textContent = secondsToTimeString(secondsPassed);
    }
}

/**
 * Converts the given number to it's "Shift + Number" equivalent.
 * @param {String} num 
 * @returns the given number's "Shift + Number" equivalent
 */
const numberToSymbol = (num) => {
    switch (num) {
        case '1':
            return '!';
        case '2':
            return '@';
        case '3':
            return '#';
        case '4':
            return '$';
        case '5':
            return '%';
        case '6':
            return '^';
        case '7':
            return '&';
        case '8':
            return '*';
        case '9':
            return '(';
        default:
            return '0';
    }
}

/**
 * Converts the given "Shift + Number" to it's number equivalent.
 * @param {String} sym 
 * @returns the given "Shift + Number"'s number equivalent
 */
const symbolToNum = (sym) => {
    switch (sym) {
        case '!':
            return '1';
        case '@':
            return '2';
        case '#':
            return '3';
        case '$':
            return '4';
        case '%':
            return '5';
        case '^':
            return '6';
        case '&':
            return '7';
        case '*':
            return '8';
        case '(':
            return '9';
        default:
            return '0';
    }
}

/**
 * Checks whether or not an conflict exists on the board.
 * @returns true if conflict exists, false otherwise
 */
const doesConflictExist = () => {
    numberOfErrors = 0;
    for (let x = 0; x < 9; x++) {
        for (let y = 0; y < 9; y++) {
            if (!sudokuGrid[x][y].unmodifiable) {
                if (!checkCoordinate(x, y)) {
                    // console.log(`${x}, ${y}, ${sudokuGrid[x][y].textContent}`);
                    numberOfErrors++;
                }
            }
        }
    }
    return numberOfErrors > 0 ? true: false;
}

/**
 * Shows the error message when clicking the "Check for Conflicts" button.
 */
const showErrorCheckMessage = () => {
    let conflictMsg = document.querySelector('#conflict-message');
    let noConflictMsg = document.querySelector('#no-conflict-message');
    if (doesConflictExist()) {
        conflictMsg.textContent = errorNumberToString();
        conflictMsg.classList.remove('hide');
        noConflictMsg.classList.add('hide');
    } else {
        conflictMsg.classList.add('hide');
        noConflictMsg.classList.remove('hide');
    }
}

/**
 * Returns a string with conflict details for the given amount of errors.
 * @param {String} errors the amount of errors
 * @returns a string with conflict details for the given amount of errors
 */
const errorNumberToString = (errors) => {
    switch (errors) {
        case 1:
            return '1 conflict exists on the board.';
        default:
            return `${errors} conflicts exist on the board.`;
    }
}

/**
 * Starts the game and hooks up button once the DOM loads.
 */
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem('darkmode') === 'true') {
        toggleDarkMode();
        document.body.classList.add('dark-mode');
    }

    restartTimer();

    // Gets all the cells in order of rows
    let gameCells = document.querySelectorAll('.sudoku-cell');

    // Allow each cell to be selected if they are clicked
    gameCells.forEach((gameCell, i) => {
        gameCell.x = Math.floor(i / 9);
        gameCell.y = i % 9;
        sudokuGrid.push(gameCell.querySelector('.sudoku-number'));
        gameCell.addEventListener("click", clickCellEvent);
    });

    // Change the grid to 2d
    sudokuGrid = flatTo2d(sudokuGrid, 9);

    // Generate a random grid or load the last one
    initializeGrid(30);
    loadSavedGame();

    // Detects valid keypresses
    document.addEventListener("keydown", handleKeydown);

    // Debug buttons
    // document.querySelector('#check-row-button').addEventListener("click", (e) => {
    //     if (selectedCell.length == 0) {
    //         return;
    //     }
    //     console.log(checkRow(selectedCell.x));
    // });

    // document.querySelector('#check-column-button').addEventListener("click", (e) => {
    //     if (selectedCell.length == 0) {
    //         return;
    //     }
    //     console.log(checkCol(selectedCell.y));
    // });

    // document.querySelector('#check-grid-button').addEventListener("click", (e) => {
    //     if (selectedCell.length == 0) {
    //         return;
    //     }
    //     console.log(checkGrid(selectedCell.x, selectedCell.y));
    // });

    // document.querySelector('#check-game-button').addEventListener("click", (e) => {
    //     console.log(checkGame());
    // });

    // document.querySelector('#check-solution-button').addEventListener("click", (e) => {
    //     console.log(checkSolution());
    // });

    document.querySelector('#solve-for-me-button').addEventListener("click", (e) => {
        if (paused) return;
        let start = Date.now();
        clearNotes();
        clearHighlights();
        clearSelectedCell();
        backTrackMe(sudokuGrid);
        let end = Date.now();
        console.log(`Solved in ${(end - start) / 1000}s.`);
        checkWin();
    });

    document.querySelector('#clear-board-button').addEventListener("click", (e) => {
        clearBoard();
    });

    document.querySelector('#new-game-button').addEventListener("click", (e) => {
        let modal = document.querySelector('#new-game-modal');
        modal.style.display = 'block';
    });

    document.querySelectorAll('.close').forEach((button) => {
        button.addEventListener("click", (e) => {
            let modal = button.parentElement.parentElement;
            modal.style.display = 'none';
        });
    });

    document.querySelector('#start-game-button').addEventListener("click", (e) => {
        let numOfHints = document.querySelector('#hint-number-input');
        if (numOfHints.value > 80 || numOfHints.value < 0) {
            document.querySelector('#number-error').classList.remove('hide');
        } else {
            document.querySelector('#number-error').classList.add('hide');
            let modal = document.querySelector('#new-game-modal');
            modal.style.display = 'none';
            initializeGrid(numOfHints.value);
        }
    });

    document.querySelector('#pause-game-button').addEventListener("click", (e) => {
        if (!paused) {
            pauseTimer();
            hideBoardView();
        } else {
            resumeTimer();
            showBoardView();
        }
    });

    document.querySelector('#note-toggle-checkbox').addEventListener("click", (e) => {
        noteMode = !noteMode;
    });

    document.querySelector('#undo-button').addEventListener("click", (e) => {
        if (!paused) undoAction();
    });

    document.querySelector('#redo-button').addEventListener("click", (e) => {
        if (!paused) redoAction();
    });

    document.querySelector('#erase-button').addEventListener("click", (e) => {
        if (!paused) {
            e.key = 'Backspace';
            handleKeydown(e);
        }
    });

    document.querySelectorAll('.keypad-key').forEach((key) => {
        key.addEventListener("click", (e) => {
            if (!paused) {
                e.key = key.textContent;
                handleKeydown(e);
            }
        })
    });

    document.querySelector('#dark-mode-button').addEventListener("click", (e) => {
        toggleDarkMode();
        
    });

    document.querySelector('#check-conflicts-button').addEventListener("click", (e) => {
        showErrorCheckMessage();
    });

    // Check whether the loaded board was in a winning position
    checkWin();

    // Autosaving set to 5 seconds
    setInterval(() => {
        saveBoard();
        saveTime();
        saveNotes();
    }, 5000);
});