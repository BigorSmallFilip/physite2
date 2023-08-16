
var statsGraphCanvasElement;
var statsGraphCanvasWidth;
var statsGraphCanvasHeight;
var sg_ctx;

function initStatsGraphCanvas() {
	statsGraphCanvasElement = document.getElementById('statsgraph-canvas');
	
    sg_ctx = statsGraphCanvasElement.getContext('2d', { alpha: false, willReadFrequently: true });

	resetStatsGraphCanvasDimensions();
}

function resetStatsGraphCanvasDimensions() {
    let statsGraphContainer = document.getElementById('statsgraph');
	statsGraphCanvasWidth = statsGraphContainer.clientWidth - 16;
	statsGraphCanvasHeight = statsGraphContainer.clientHeight - 16;
	sg_ctx.canvas.width = statsGraphCanvasWidth;
	sg_ctx.canvas.height = statsGraphCanvasHeight;

    sg_graphSampleWidth = statsGraphCanvasWidth / (sg_graphSampleCount - 1);
}



const sg_gridColor = "#001f3fff";
var sg_gridCountX = 12;
var sg_gridCountY = 5;
var sg_gridSize = 40;
var sg_gridMovement = 0;
var sg_targetDeltaTime = (1 / 144) * 1000; // 144 fps

var sg_graphSampleCount = 200;
var sg_graphSampleWidth = 0;

var sg_scaleY_time = 20;
var sg_physicsTimeBuffer = [];
var sg_renderTimeBuffer = [];

function updateGridSize() {

}

function drawGrid() {
    sg_ctx.beginPath();
    // Horisontal lines
    for (let y = 1; y < sg_gridCountY; y++) {
        let ypos = y * sg_gridSize;
        sg_ctx.moveTo(0, ypos);
        sg_ctx.lineTo(statsGraphCanvasWidth, ypos);
    }

    // Vertical lines, which move
    let offset = sg_gridMovement % sg_gridSize;
    for (let x = 1; x < sg_gridCountX; x++) {
        let xpos = x * sg_gridSize - offset;
        sg_ctx.moveTo(xpos, 0);
        sg_ctx.lineTo(xpos, statsGraphCanvasHeight);
    }
    sg_ctx.strokeStyle = sg_gridColor;
    sg_ctx.stroke();
}

function drawGraph(data, scale) {
    sg_ctx.beginPath();
    sg_ctx.moveTo(statsGraphCanvasWidth, statsGraphCanvasHeight - data(0) * scale);
    for (let i = 1; i < sg_graphSampleCount; i++) {
        sg_ctx.lineTo(statsGraphCanvasWidth - i * sg_graphSampleWidth, statsGraphCanvasHeight - data(i) * scale);
        //sg_ctx.lineTo(statsGraphCanvasWidth - i * 4, statsGraphCanvasHeight - ((Math.sin(i / 6) + 2) / scale) * statsGraphCanvasHeight);
    }
    sg_ctx.stroke();
}

function drawTimeLines() {
    sg_ctx.beginPath();
    let ypos = statsGraphCanvasHeight - sg_targetDeltaTime * (statsGraphCanvasHeight / sg_scaleY_time);
    sg_ctx.moveTo(0, ypos);
    sg_ctx.lineTo(statsGraphCanvasWidth, ypos);
    sg_ctx.strokeStyle = "green";
    sg_ctx.stroke();

    sg_ctx.strokeStyle = "blue";
    drawGraph((i) => (sg_physicsTimeBuffer[i]), statsGraphCanvasHeight / sg_scaleY_time);
    sg_ctx.strokeStyle = "yellow";
    drawGraph((i) => (sg_renderTimeBuffer[i]), statsGraphCanvasHeight / sg_scaleY_time);

    // Total time
    sg_ctx.strokeStyle = "red";
    drawGraph((i) => (sg_physicsTimeBuffer[i] + sg_renderTimeBuffer[i]), statsGraphCanvasHeight / sg_scaleY_time);
}

function updateStatsGraphGraphs() {
    if (sg_physicsTimeBuffer.length >= sg_graphSampleCount)
        sg_physicsTimeBuffer.pop();
    sg_physicsTimeBuffer.unshift(physicsTime);

    if (sg_renderTimeBuffer.length >= sg_graphSampleCount)
        sg_renderTimeBuffer.pop();
    sg_renderTimeBuffer.unshift(renderTime);

    sg_gridMovement += sg_graphSampleWidth;
}

function updateStatsGraph() {
    updateStatsGraphGraphs();

    // Clear canvas
    sg_ctx.fillStyle = '#000307ff';
	sg_ctx.fillRect(0, 0, statsGraphCanvasWidth, statsGraphCanvasHeight);
    sg_ctx.lineWidth = 2;

    drawGrid();
    drawTimeLines();
}