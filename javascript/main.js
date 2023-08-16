
function distsq(x1, y1, x2, y2) {
	let dx = x2 - x1;
	let dy = y2 - y1;
	return dx * dx + dy * dy;
}

function clamp(val, min, max) {
	if (val < min) return min;
	if (val > max) return max;
	return val;
}

function vectorMagnitude(vec) {
	return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
}

function constrainVectorMagnitude(vec, min, max) {
	let l = vectorMagnitude(vec);
	if (l == 0) return;
	vec.x /= l;
	vec.y /= l;
	l = clamp(l, min, max);
	vec.x *= l;
	vec.y *= l;
}



var simSectionElement;
var simSectionWidth;
var simSectionHeight;

var simCanvasElement;
var simCanvasWidth;
var simCanvasHeight;
var simCanvasCtx;
var simCanvasWebGL;

function initSimulationCanvas() {
	simSectionElement = document.getElementById('sim-section');
	simCanvasElement = document.getElementById('sim-canvas');
	//simCanvasWebGL = simCanvasElement.getContext('webgl2', { alpha: false, willReadFrequently: true });
	if (simCanvasWebGL) {
		console.log("Browser supports WebGL");
		initWebGL();
	} else {
		console.log("Browser doesn't supports WebGL");
		simCanvasCtx = simCanvasElement.getContext('2d', { alpha: false, willReadFrequently: true });
	}
	resetSimulationCanvasDimensions();
}

function resetSimulationCanvasDimensions() {
	simSectionWidth = simSectionElement.clientWidth;
	simSectionHeight = simSectionElement.clientHeight;
	simCanvasWidth = simSectionWidth - 16;
	simCanvasHeight = simSectionHeight - 16;
	if (simCanvasWebGL) {
		simCanvasWebGL.canvas.width = simCanvasWidth;
		simCanvasWebGL.canvas.height = simCanvasHeight;
		simCanvasWebGL.drawingBufferWidth = simCanvasWidth;
		simCanvasWebGL.drawingBufferHeight = simCanvasHeight;
		simCanvasWebGL.viewport(0, 0, simCanvasWidth, simCanvasHeight);
	} else {
		simCanvasCtx.canvas.width = simCanvasWidth;
		simCanvasCtx.canvas.height = simCanvasHeight;
	}
}



var physicsTime = 0.0;
var renderTime = 0.0;
var totalTime = 0.0;

function mainLoop() {
	requestAnimationFrame(mainLoop);

	if (simSectionElement.clientWidth != simSectionWidth ||
		simSectionElement.clientHeight != simSectionHeight)
	{
		// Reset scene dimensions
		// let diffw = simSectionElement.clientWidth - simSectionWidth;
		// let diffh = simSectionElement.clientHeight - simSectionHeight;
		// console.log(diffw);
		// shiftSceneBalls(diffw / 1, diffh / 1);
		resetSimulationCanvasDimensions();
		updateSceneDimensions();
		resetStatsGraphCanvasDimensions();
	}

	updateSceneEditor();

	const total_timerStart = performance.now();

	const phys_timerStart = performance.now();
	updatePhysics();
	const phys_timerEnd = performance.now();
	physicsTime = phys_timerEnd - phys_timerStart;
	document.getElementById('physicstime-debug').innerHTML = physicsTime + "ms";
	
	const render_timerStart = performance.now();
	if (simCanvasWebGL)
		renderSceneGL();
	else
		renderScene();
	const render_timerEnd = performance.now();
	renderTime = render_timerEnd - render_timerStart;
	document.getElementById('rendertime-debug').innerHTML = renderTime + "ms";

	const total_timerEnd = performance.now();
	totalTime = total_timerEnd - total_timerStart;
	document.getElementById('totaltime-debug').innerHTML = totalTime + "ms";

	updateStatsGraph();
}