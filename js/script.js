const editKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Backspace'];
const movementKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const gridCenters = [
    [1, 1], [1, 4], [1, 7],
    [4, 1], [4, 4], [4, 7],
    [7, 1], [7, 4], [7, 7],
];
let sudokuGrid = [];
let selectedCell = '';
let secondsPassed = 0;
let timerInterval;
let paused = false;

const initializeGrid = (hintNum) => {
    clearBoard();
    backTrackMe(sudokuGrid);

    let randomArray = [];
    for (let i = 0; i < 81; i++) {
        randomArray.push(i);
        let to2d = positionConversion(i, 9);
        sudokuGrid[to2d[0]][to2d[1]].unmodifiable = true;
    }
    fisherYatesShuffe(randomArray);

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

const fisherYatesShuffe = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (arr.length - 1));
        let temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}

const positionConversion = (num, len) => {
    return [Math.floor(num / len), num % len];
}

const validPosition = (x, y) => {
    return !(x < 0 || x > 8 || y < 0 || y > 8);
}

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

const clickCell = (e) => {
    if (selectedCell.length != 0) {
        selectedCell.classList.toggle('selected-cell');
    }
    selectedCell = e.target || e;
    selectedCell.classList.toggle('selected-cell');
}

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

const dist = (x1, y1, x2, y2) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

const checkGame = () => {
    let valid = true;
    for (let i = 0; i < 9; i++) {
        if (!valid) { return false; }
        valid = checkRow(i) && checkCol(i) && checkGrid(gridCenters[i][0], gridCenters[i][1]);
    }
    return valid;
}

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
 * @param {*} grid 
 * @returns 
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

const clearBoard = () => {
    clearInterval(timerInterval);
    secondsPassed = 0;
    startTimer();

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            sudokuGrid[i][j].textContent = '';
            sudokuGrid[i][j].textContent.unmodifiable = false;
            sudokuGrid[i][j].classList.remove('modifiable');
        }
    }
}

const secondsToTimeString = (seconds) => {
    return seconds % 60 < 10 ? `${Math.floor(seconds / 60)}:0${seconds % 60}` : `${Math.floor(seconds / 60)}:${seconds % 60}`
}

const startTimer = () => {
    document.querySelector('#timer').textContent = '0:00';
    timerInterval = setInterval(() =>{
        secondsPassed++;
        document.querySelector('#timer').textContent = secondsToTimeString(secondsPassed);
    }, 1000);
}

const pauseTimer = () => {
    if (paused) {
        timerInterval = setInterval(() =>{
            secondsPassed++;
            document.querySelector('#timer').textContent = secondsToTimeString(secondsPassed);
        }, 1000);
        paused = false;
    } else {
        clearInterval(timerInterval);
        paused = true;
    }
    toggleBoardView();
}

const toggleBoardView = () => {
    document.querySelector('#play-area').querySelectorAll('.grid-container').forEach((grid) => {
        grid.classList.toggle('hide');
    })
}

document.addEventListener("DOMContentLoaded", () => {
    startTimer();

    // Gets all the cells in order of rows
    let gameCells = document.querySelectorAll('.sudoku-cell');

    // Allow each cell to be selected if they are clicked
    gameCells.forEach((gameCell, i) => {
        gameCell.x = Math.floor(i / 9);
        gameCell.y = i % 9;
        sudokuGrid.push(gameCell);
        gameCell.editable = true;
        gameCell.addEventListener("click", clickCell);
    });

    // Change the grid to 2d
    sudokuGrid = flatTo2d(sudokuGrid, 9);

    // Detects valid keypresses
    document.addEventListener("keydown", (e) => {
        if (editKeys.includes(e.key)) {
            if (selectedCell.length == 0) {
                return;
            } else if (e.key == 'Backspace' && !selectedCell.unmodifiable) {
                selectedCell.textContent = selectedCell.textContent.slice(0, selectedCell.textContent.length - 1);
            } else if (selectedCell.textContent.length < 5 && !selectedCell.textContent.includes(e.key) && !selectedCell.unmodifiable) {
                selectedCell.textContent += e.key;
            }
        } else if (movementKeys.includes(e.key)) {
            if (selectedCell.length == 0) {
                clickCell(sudokuGrid[0][0]);
            } else {
                moveInDirection(e.key);
            }
        }
        return;
    });

    // Configuring multiple buttons
    document.querySelector('#check-row-button').addEventListener("click", (e) => {
        if (selectedCell.length == 0) {
            return;
        }
        console.log(checkRow(selectedCell.x));
    });

    document.querySelector('#check-column-button').addEventListener("click", (e) => {
        if (selectedCell.length == 0) {
            return;
        }
        console.log(checkCol(selectedCell.y));
    });

    document.querySelector('#check-grid-button').addEventListener("click", (e) => {
        if (selectedCell.length == 0) {
            return;
        }
        console.log(checkGrid(selectedCell.x, selectedCell.y));
    });

    document.querySelector('#check-game-button').addEventListener("click", (e) => {
        console.log(checkGame());
    });

    document.querySelector('#check-solution-button').addEventListener("click", (e) => {
        console.log(checkSolution());
    });

    document.querySelector('#solve-for-me-button').addEventListener("click", (e) => {
        let start = Date.now();
        backTrackMe(sudokuGrid);
        let end = Date.now();
        console.log(`Solved in ${(end - start) / 1000}s.`);
    });

    document.querySelector('#clear-board-button').addEventListener("click", (e) => {
        clearBoard();
    });

    document.querySelector('#new-game-button').addEventListener("click", (e) => {
        initializeGrid(35);
    });

    document.querySelector('#pause-game-button').addEventListener("click", (e) => {
        pauseTimer();
    });
});