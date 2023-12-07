const editKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Backspace'];
const movementKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const gridCenters = [
    [1, 1], [1, 4], [1, 7],
    [4, 1], [4, 4], [4, 7],
    [7, 1], [7, 4], [7, 7],
];
let sudokuGrid = [];
let selectedCell = '';

const initializeGrid = () => {

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
        let check = sudokuGrid[x][i].innerHTML;
        if (current.includes(check)) {
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
        let check = sudokuGrid[i][y].innerHTML;
        if (current.includes(check)) {
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

    for (let i = centerPoint[0] - 1; i < centerPoint[0] + 1; i++) {
        for (let j = centerPoint[1] - 1; j < centerPoint[1] + 1; j++) {
            let check = sudokuGrid[i][j].innerHTML;
            if (current.includes(check)) {
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
    let least;
    let centerPoint;
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
            if (sudokuGrid[i][j].innerHTML == '') {
                return false;
            }
        }
    }
    return checkGame();
}

const findEmptySpace = (grid) => {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (grid[i][j].innerHTML == '') {
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
        gridCopy[location[0]][location[1]].innerHTML = candidates[idx];
        if (checkGame() && backTrackMe(gridCopy)) {
            return true;
        }
        gridCopy[location[0]][location[1]].innerHTML = '';
        candidates.splice(idx, 1);
    }
    return false;
}

const clearBoard = () => {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            sudokuGrid[i][j].innerHTML = '';
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
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
            } else if (e.key == 'Backspace') {
                selectedCell.innerHTML = '';
            } else {
                selectedCell.innerHTML = e.key;
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
});