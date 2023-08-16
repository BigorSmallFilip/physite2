
function drawLine(x1, y1, x2, y2) {
	simCanvasCtx.strokeStyle = '#ffffff30';
	simCanvasCtx.beginPath();
	simCanvasCtx.moveTo(x1, y1);
	simCanvasCtx.lineTo(x2, y2);
	simCanvasCtx.lineCap = 'round';
	simCanvasCtx.lineWidth = 1;
	simCanvasCtx.stroke();
}



var renderSettings_renderBalls = true;
var renderSettings_renderBallsNoColor = false;
var renderSettings_renderBallsSpeedFilter = false;
var renderSettings_renderLinesPartitions = false;
var renderSettings_renderLines = true;
var renderSettings_renderSpacePartitioningGrid = false;
var renderSettings_renderBallInterractionLines = false;

function renderScene() {
	// Clear screen
	simCanvasCtx.fillStyle = '#000000';
	simCanvasCtx.fillRect(0, 0, simCanvasWidth, simCanvasHeight);

	if (renderSettings_renderSpacePartitioningGrid) 	renderSpacePartitioningGrid();
	if (renderSettings_renderLinesPartitions) 			renderLinesPartitions();
	if (renderSettings_renderLines) 					renderLines();
	if (renderSettings_renderBalls) {
		if (renderSettings_renderBallsNoColor) 			renderBallsNoColor();
		else if (renderSettings_renderBallsSpeedFilter) renderBallsSpeedFilter();
		else											renderBalls();
	}
	if (renderSettings_renderBallInterractionLines) 	renderBallInterractionLines();
}



function renderBalls() {
	const bl = sceneBalls.length;
	for (let i = 0; i < bl; i++) {
		let ball = sceneBalls[i];
		simCanvasCtx.fillStyle = '#' + Math.floor(ball.colr * 256).toString(16) + Math.floor(ball.colg * 256).toString(16) + Math.floor(ball.colb * 256).toString(16);
		simCanvasCtx.beginPath();
		simCanvasCtx.arc(ball.x, ball.y, ball.r, 0, 6.28);
		simCanvasCtx.fill();
	}
}



function renderBallsNoColor() {
	const bl = sceneBalls.length;
	simCanvasCtx.fillStyle = "#ffffff";
	simCanvasCtx.beginPath();
	for (let i = 0; i < bl; i++) {
		const ball = sceneBalls[i];
		simCanvasCtx.moveTo(ball.x, ball.y);
		simCanvasCtx.arc(ball.x, ball.y, ball.r, 0, 6.28);
	}
	simCanvasCtx.closePath();
	simCanvasCtx.fill();
}



function renderBallsSpeedFilter() {
	const bl = sceneBalls.length;
	for (let i = 0; i < bl; i++) {
		let ball = sceneBalls[i];
		let speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) * 16;
		speed = clamp(speed, 0, 255);
		simCanvasCtx.fillStyle = '#' + 
			Math.floor(ball.colr * speed).toString(16).padStart(2, "0") +
			Math.floor(ball.colg * speed).toString(16).padStart(2, "0") +
			Math.floor(ball.colb * speed).toString(16).padStart(2, "0");
		simCanvasCtx.beginPath();
		simCanvasCtx.arc(ball.x, ball.y, ball.r, 0, 6.28);
		simCanvasCtx.fill();
	}
}



function renderLines() {
	const ll = sceneLines.length;
	simCanvasCtx.strokeStyle = 'white';
	simCanvasCtx.lineCap = 'round';
	for (let i = 0; i < ll; i++) {
		const line = sceneLines[i];
		simCanvasCtx.beginPath();
		simCanvasCtx.moveTo(line.x1, line.y1);
		simCanvasCtx.lineTo(line.x2, line.y2);
		simCanvasCtx.lineWidth = line.w * 2;
		simCanvasCtx.stroke();
	}
}

function renderLinesPartitions() {
	const l = sceneLines.length;
	for (let i = 0; i < l; i++) {
		const line = sceneLines[i];
		const pl = line.partIds.length;
		for (let p = 0; p < pl; p++) {
			const partid = line.partIds[p];
			const x = partid % sp_partitionCountX;
			const y = Math.floor(partid / sp_partitionCountX);
			simCanvasCtx.fillStyle = '#ff0000';
			simCanvasCtx.fillRect(x * sp_partitionWidth, y * sp_partitionHeight, sp_partitionWidth, sp_partitionHeight);
		}
	}
}



function renderSpacePartitioningGrid() {
	simCanvasCtx.strokeStyle = "blue";
	simCanvasCtx.lineWidth = 1;
	for (let y = 1; y < sp_partitionCountY; y++) {
		const ly = y * sp_partitionHeight;
		simCanvasCtx.beginPath();
		simCanvasCtx.moveTo(0, ly);
		simCanvasCtx.lineTo(simCanvasWidth, ly);
		simCanvasCtx.stroke();
	}
	for (let x = 1; x < sp_partitionCountX; x++) {
		const lx = x * sp_partitionWidth;
		simCanvasCtx.beginPath();
		simCanvasCtx.moveTo(lx, 0);
		simCanvasCtx.lineTo(lx, simCanvasHeight);
		simCanvasCtx.stroke();
	}
}



function renderInterractionsWithinPartition(p) {
	const pl = p.length < maxCollisionsPerPartition ? p.length : maxCollisionsPerPartition;
	for (let i = 0; i < pl; i++) {
		let balli = p[i];
		for (let j = i + 1; j < pl; j++) {
			simCanvasCtx.moveTo(balli.x, balli.y);
			simCanvasCtx.lineTo(p[j].x, p[j].y);
		}
	}
}

function renderInterractionsInSeparatePartitions(p1, p2) {
	const p1l = p1.length < maxCollisionsPerPartition ? p1.length : maxCollisionsPerPartition;
	const p2l = p2.length < maxCollisionsPerPartition ? p2.length : maxCollisionsPerPartition;
	if (p2l == 0) return;
	for (let i = 0; i < p1l; i++) {
		let balli = p1[i];
		for (let j = 0; j < p2l; j++) {
			simCanvasCtx.moveTo(balli.x, balli.y);
			simCanvasCtx.lineTo(p2[j].x, p2[j].y);
		}
	}
}

function renderInterractions_spacePartitioned() {
	for (let y = 0; y < sp_partitionCountY; y++) {
		const onbottom = y == sp_partitionCountY - 1;
		for (let x = 0; x < sp_partitionCountX; x++) {
			const p1 = sp_partitions[x + (y * sp_partitionCountX)];
			if (p1.length == 0) continue;
			const onright = x == sp_partitionCountX - 1;

			renderInterractionsWithinPartition(p1);
			if (!onbottom) {
				if (x > 0) renderInterractionsInSeparatePartitions(p1, sp_partitions[x - 1 + ((y + 1) * sp_partitionCountX)]);
				renderInterractionsInSeparatePartitions(p1, sp_partitions[x + ((y + 1) * sp_partitionCountX)]);
				if (!onright) {
					renderInterractionsInSeparatePartitions(p1, sp_partitions[x + 1 + (y * sp_partitionCountX)]);
					renderInterractionsInSeparatePartitions(p1, sp_partitions[x + 1 + ((y + 1) * sp_partitionCountX)]);
				}
			} else {
				if (!onright) renderInterractionsInSeparatePartitions(p1, sp_partitions[x + 1 + (y * sp_partitionCountX)]);
			}
		}
	}

	simCanvasCtx.stroke();
}

function renderInterractions_naïve() {
	for (let i = 0; i < sceneBalls.length; i++) {
		const balli = sceneBalls[i];
		for (let j = i + 1; j < sceneBalls.length; j++) {
			const ballj = sceneBalls[j];
			simCanvasCtx.moveTo(balli.x, balli.y);
			simCanvasCtx.lineTo(ballj.x, ballj.y);
		}
	}

	simCanvasCtx.stroke();
}

function renderBallInterractionLines() {
	simCanvasCtx.strokeStyle = '#ffffffff';
	simCanvasCtx.lineCap = 'round';
	simCanvasCtx.lineWidth = 1;
	simCanvasCtx.beginPath();

	if (useSpacePartitioning)
		renderInterractions_spacePartitioned();
	else
		renderInterractions_naïve();
}