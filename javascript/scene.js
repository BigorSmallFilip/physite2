
class Ball {
	constructor(x, y, vx, vy, r, col) {
		this.x = x;
		this.y = y;
		this.vx = vx;
		this.vy = vy;
		this.r = r;
		this.colr = col[0];
		this.colg = col[1];
		this.colb = col[2];
		this.nx = x;
		this.ny = y;
		this.c = 1;
		this.ox = x; // Old x position
		this.oy = y; // Old y position
		this.ss = 0; // Smooth speed
		this.part = undefined; // Partition this ball is in
	}
};
var sceneBalls = [];



class Line {
	constructor(x1, y1, x2, y2, w) {
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		this.w = w;

		this.dx = 0;
		this.dy = 0;
		this.lsq = 0;
		this.ra = 0;
		this.rd = 0;

		this.minpx = 0;
		this.maxpx = 0;
		this.minpy = 0;
		this.maxpy = 0;

		this.partIds = [];
	}
}

function shiftSceneBalls(x, y) {
	const l = sceneBalls.length;
	for (let i = 0; i < l; i++) {
		let ball = sceneBalls[i];
		ball.x += x;
		ball.y += y;
	}
}

function updateLine(line) {
	line.dx = line.x2 - line.x1;
	line.dy = line.y2 - line.y1;
	line.ra = ((line.x2 * line.x2) + (line.y2 * line.y2)) - ((line.x2 * line.x1) + (line.y2 * line.y1));
	line.lsq = line.dx * line.dx + line.dy * line.dy;
	if (line.lsq == 0) line.lsq = 0.001;
	line.rd = 1 / line.lsq;

	// Looks messy but is fast since min and max do this anyway
	// Gets a bounding rect of partitions
	let minpx = 0;
	let maxpx = 0;
	let minpy = 0;
	let maxpy = 0; 
	if (line.x1 < line.x2) {
		minpx = line.x1;
		maxpx = line.x2;
	} else {
		minpx = line.x2;
		maxpx = line.x1;
	}
	if (line.y1 < line.y2) {
		minpy = line.y1;
		maxpy = line.y2;
	} else {
		minpy = line.y2;
		maxpy = line.y1;
	}
	minpx = clamp(Math.floor((minpx - line.w) / sp_partitionWidth) - 1, 0, sp_partitionCountX);
	maxpx = clamp(Math.ceil((maxpx + line.w) / sp_partitionWidth) + 1, 0, sp_partitionCountX);
	minpy = clamp(Math.floor((minpy - line.w) / sp_partitionHeight) - 1, 0, sp_partitionCountY);
	maxpy = clamp(Math.ceil((maxpy + line.w) / sp_partitionHeight) + 1, 0, sp_partitionCountY);
	
	line.partIds = [];
	const widthSq = line.w + Math.max(sp_partitionWidth, sp_partitionHeight) * 1.25; // 1.25 seems to work for some reason
	for (let y = minpy; y < maxpy; y++) {
		for (let x = minpx; x < maxpx; x++) {
			// Go through the bounding rect and find all partitions that are close enough to the line
			if (distToLineSq(line,
				x * sp_partitionWidth + sp_partitionWidth / 2,
				y * sp_partitionHeight + sp_partitionHeight / 2) < widthSq * widthSq)
			{
				line.partIds[line.partIds.length] = x + y * sp_partitionCountX;
			}
		}
	}
}

function updateAllLines() {
	for (let i = 0; i < sceneLines.length; i++) {
		updateLine(sceneLines[i]);
	}
}

var sceneLines = [];

function distToLineSq(line, x, y) {
	let a = line.rd * (line.ra - x * line.dx - y * line.dy);
	if (a > 1) a = 1.0;
	if (a < 0) a = 0.0;
	let dx = -a * line.dx + line.x2 - x;
	let dy = -a * line.dy + line.y2 - y;
	return dx * dx + dy * dy;
}

function getLineIdAtPosition(x, y) {
	let l = sceneLines.length;
	for (let i = 0; i < l; i++) {
		let l = sceneLines[i];
		if (distToLineSq(l, x, y) < Math.max(l.w * l.w, 25)) return i;
	}
	return -1;
}



// === Space partitioning variables ===

/**Space partitioning, the unit width of a partition*/
var sp_partitionWidth = 0;
/**Space partitioning, the unit height of a partition*/
var sp_partitionHeight = 0;
/**Space partitioning, the number of partitions in the x direction*/
var sp_partitionCountX = 0;
/**Space partitioning, the number of partitions in the y direction*/
var sp_partitionCountY = 0;
/**Space partitioning, the array of all partitions
 * Every part is a simple array of every ball within the partition*/
var sp_partitions = [];

function initSpacePartitioning(partitionWidth, partitionHeight) {
	sp_partitions = [];
	// If width or height are fractional, the safest choise is to round sizes up
	// This is to make sure partitions can't be too small, which causes glitchy collisions
	sp_partitionWidth = Math.ceil(partitionWidth);
	sp_partitionHeight = Math.ceil(partitionHeight);
	// Round up to make sure there are enough blocks to completely cover the scene
	sp_partitionCountX = Math.ceil(simCanvasWidth / sp_partitionWidth);
	sp_partitionCountY = Math.ceil(simCanvasHeight / sp_partitionHeight);

	const partitionCount = sp_partitionCountX * sp_partitionCountY;
	for (let i = 0; i < partitionCount; i++)
		sp_partitions[i] = [];
}

function getPartitionAtPosition(x, y) {
	const px = Math.floor(x / sp_partitionWidth);
	const py = Math.floor(y / sp_partitionHeight);
	return sp_partitions[px + (py * sp_partitionCountX)];
}

function resetBallPartition(ball) {
	let p = getPartitionAtPosition(ball.x, ball.y);
	if (ball.part)
		ball.part.splice(ball.part.indexOf(ball), 1);
	ball.part = p;
	if (p)
		p[p.length] = ball;
}

function resetAllBallPartitions() {
	const pl = sp_partitions.length;
	for (let i = 0; i < pl; i++)
		sp_partitions[i] = [];

	const bl = sceneBalls.length;
	for (let i = 0; i < bl; i++) {
		let ball = sceneBalls[i];
		let p = getPartitionAtPosition(ball.x, ball.y);
		ball.part = p;
		if (p) {
			p[p.length] = ball;
		}
	}
}



/**
 * @desc Updates space partitioning, lines and other data according to new scene dimensions
 */
function updateSceneDimensions() {
	let minBallSize = 9999999;
	let maxBallSize = 0;
	for (let i = 0; i < sceneBalls.length; i++) {
		const r = sceneBalls[i].r;
		if (r < minBallSize) minBallSize = r;
		if (r > maxBallSize) maxBallSize = r;
	}
	initSpacePartitioning(maxBallSize * 2, maxBallSize * 2);
	updateAllLines();
}