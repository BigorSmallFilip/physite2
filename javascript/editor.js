


var mouseX = 0;
var mouseY = 0;
var prevMouseX = 0;
var prevMouseY = 0;
var mouseLClick = false;
var mouseLDown = false;
var mouseLRelease = false;
var mouseRClick = false;
var mouseRDown = false;
var mouseRRelease = false;

function initInputEvents() {
	simCanvasElement.addEventListener('contextmenu', function (evt) {
		evt.preventDefault();
	});

	window.addEventListener('mousemove', (evt) => {
		evt.preventDefault();
		let rect = simCanvasElement.getBoundingClientRect();
		mouseX = (evt.clientX - rect.left) / (rect.right - rect.left) * simCanvasWidth;
		mouseY = (evt.clientY - rect.top) / (rect.bottom - rect.top) * simCanvasHeight;
	}, false);

	simCanvasElement.addEventListener("mousedown", (evt) => {
		evt.preventDefault();
		if (evt.button == 0) {
			mouseLClick = true;
			mouseLDown = true;
		} else {
			mouseRClick = true;
			mouseRDown = true;
		}
	});
	window.addEventListener("mouseup", (evt) => {
		evt.preventDefault();
		if (evt.button == 0) {
			mouseLDown = false;
			mouseLRelease = true;
		} else {
			mouseRDown = false;
			mouseRRelease = true;
		}
	});
}



let moveLineId = -1;
let moveLineX1 = 0;
let moveLineY1 = 0;
let moveLineX2 = 0;
let moveLineY2 = 0;

function updateSceneEditor() {

	if (false) {
		if (mouseLDown) {
			sceneBalls[0].x = mouseX;
			sceneBalls[0].y = mouseY;
			sceneBalls[0].ox = mouseX;
			sceneBalls[0].oy = mouseY;
			sceneBalls[0].vx = 0;
			sceneBalls[0].vy = 0;
		}
	} else {
		if (mouseLClick) {
			// Start drawing new line
			sceneLines.unshift(new Line(
				mouseX,
				mouseY,
				mouseX,
				mouseY,
				10
			));
			moveLineId = 0;
		} else if (mouseLRelease) {
			moveLineId = -1;
		} else if (mouseRDown && moveLineId == -1) {
			removeLinesAtPosition(mouseX, mouseY);
		}

		let line = sceneLines[moveLineId];
		if (line) {
			moveLine(moveLineId, line.x1, line.y1, mouseX, mouseY);
		}
	}

	mouseLClick = false;
	mouseLRelease = false;
	mouseRClick = false;
	mouseRRelease = false;
	prevMouseX = mouseX;
	prevMouseY = mouseY;
}



function moveLine(lineId, x1, y1, x2, y2) {
	moveLineId = lineId;
	let line = sceneLines[moveLineId];
	if (!line) {
		moveLIneId = -1;
		return;
	}
	let dif1 = { x: x1 - line.x1, y: y1 - line.y1 };
	constrainVectorMagnitude(dif1, 0, physicsSubsteps * line.w);
	let dif2 = { x: x2 - line.x2, y: y2 - line.y2 };
	constrainVectorMagnitude(dif2, 0, physicsSubsteps * line.w);

	moveLineX1 = line.x1 + dif1.x;
	moveLineY1 = line.y1 + dif1.y;
	moveLineX2 = line.x2 + dif2.x;
	moveLineY2 = line.y2 + dif2.y;
}



function removeLinesAtPosition(x, y) {
	const l = sceneLines.length;
	for (let i = 0; i < l; i++) {
		let del = getLineIdAtPosition(x, y);
		if (del >= 0)
			sceneLines.splice(del, 1);
		else
			break;
	}
}