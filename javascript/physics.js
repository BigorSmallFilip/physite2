
var gravity = 0.2;
var physicsSubsteps = 8;
var solidEdges = true;
var wallBounce = 0.5;
var useSoftCollisionResponse = true;
var useSpacePartitioning = true;
var maxCollisionsPerPartition = 40;



/**
 * Moves a point smoothly across multiple physics substeps
 */
function substepMovePoint(a, b, physIter) {
	const c1 = ((physIter + 1 - physicsSubsteps) / (physIter - physicsSubsteps));
	const c2 = 1 / (physicsSubsteps - physIter);
	a.x = a.x * c1 + b.x * c2;
	a.y = a.y * c1 + b.y * c2;
}

function substepMoveLine(line, x1, y1, x2, y2, physIter) {
	let p1 = { 'x': line.x1, 'y': line.y1 };
	let p2 = { 'x': line.x2, 'y': line.y2 };
	substepMovePoint(p1, { 'x': x1, 'y': y1 }, physIter);
	substepMovePoint(p2, { 'x': x2, 'y': y2 }, physIter);
	line.x1 = p1.x;
	line.y1 = p1.y;
	line.x2 = p2.x;
	line.y2 = p2.y;
	updateLine(line);
}



function updatePhysics() {
	//resetAllBallPartitions();
	
	for (let i = 0; i < physicsSubsteps; i++) {

		// The editor moving lines with the mouse
		// This has to be here since it is updated every physics substep
		if (moveLineId >= 0) {
			let line = sceneLines[moveLineId];
			substepMoveLine(line, moveLineX1, moveLineY1, moveLineX2, moveLineY2, i);
		}

		updateBallMovement();
		if (useSpacePartitioning) {
			updateCollision_spacePartitioned();
		} else {
			updateCollision_naïve();
		}

		if (useSoftCollisionResponse) updateSoftCollisionResponse();
	}
}



/**
 * @desc Updates the movement of all balls for one substep
 */
function updateBallMovement() {
	const pl = sp_partitions.length;
	for (let i = 0; i < pl; i++)
		sp_partitions[i] = [];
	
	let bl = sceneBalls.length;
	for (let i = 0; i < bl; i++) {
		let ball = sceneBalls[i];

		ball.vx = (ball.x - ball.ox) * physicsSubsteps;
		ball.vy = (ball.y - ball.oy) * physicsSubsteps;

		ball.vy += gravity / physicsSubsteps;

		// Clamp speed to make sure a ball can't move too far in one step
		// This is to make sure they can't clip through things
		const maxSpeed = ball.r * physicsSubsteps;
		if (ball.vx > maxSpeed) ball.vx = maxSpeed;
		else if (ball.vx < -maxSpeed) ball.vx = -maxSpeed;
		if (ball.vy > maxSpeed) ball.vy = maxSpeed;
		else if (ball.vy < -maxSpeed) ball.vy = -maxSpeed;

		ball.ox = ball.x; // Store old position before updating real position
		ball.oy = ball.y;
		ball.nx = 0;
		ball.ny = 0;
		ball.x += ball.vx / physicsSubsteps;
		ball.y += ball.vy / physicsSubsteps;
		ball.c = 1; // Reset collision count to 1. Since it will divide by this, don't set to 0!

		if (solidEdges) {
			// Collide with the edges of the screen
			if (ball.x - ball.r < 0) {
				ball.x = ball.r;
				ball.vx = Math.abs(ball.vx) * wallBounce;
			}
			if (ball.x + ball.r > simCanvasWidth) {
				ball.x = simCanvasWidth - ball.r;
				ball.vx = Math.abs(ball.vx) * -wallBounce;
			}
			if (ball.y - ball.r < 0) {
				ball.y = ball.r;
				ball.vy = Math.abs(ball.vy) * wallBounce;
			}
			if (ball.y + ball.r > simCanvasHeight) {
				ball.y = simCanvasHeight - ball.r;
				ball.vy = Math.abs(ball.vy) * -wallBounce;
			}
		} else {
			// Remove balls that move out of bounds
			if (ball.x + ball.r < 0 || ball.x - ball.r > simCanvasWidth ||
				ball.y + ball.r < 0 || ball.y - ball.r > simCanvasHeight) {
				sceneBalls.splice(i, 1);
				bl--;
			}
		}

		let p = getPartitionAtPosition(ball.x, ball.y);
		if (p)
			p[p.length] = ball;
	}
}



function collideBalls(balli, ballj) {
	let dx = balli.x - ballj.x;
	let dy = balli.y - ballj.y;
	const d = dx * dx + dy * dy
	const r = balli.r + ballj.r;
	if (d < r * r) {
		let ds = Math.sqrt(d);
		dx /= ds;
		dy /= ds;
		ds = r - ds;
		const pi = ds * (ballj.r / r);
		const pj = ds * (balli.r / r);
		balli.nx += dx * pi;
		balli.ny += dy * pi;
		balli.c++;
		ballj.nx -= dx * pj;
		ballj.ny -= dy * pj;
		ballj.c++;
	}
}

function collideBallsInstantResponse(balli, ballj) {
	let dx = balli.x - ballj.x;
	let dy = balli.y - ballj.y;
	const d = dx * dx + dy * dy
	const r = balli.r + ballj.r;
	if (d < r * r) {
		let ds = Math.sqrt(d);
		dx /= ds;
		dy /= ds;
		ds = r - ds;
		const pi = ds * (ballj.r / r);
		const pj = ds * (balli.r / r);
		balli.x += dx * pj;
		balli.y += dy * pj;
		ballj.x -= dx * pi;
		ballj.y -= dy * pi;
	}
}



function collideBallsSeparatePartitions(p1, p2) {
	const p1l = p1.length < maxCollisionsPerPartition ? p1.length : maxCollisionsPerPartition;
	const p2l = p2.length < maxCollisionsPerPartition ? p2.length : maxCollisionsPerPartition;
	if (p2l == 0) return;
	if (useSoftCollisionResponse) {
		for (let i = 0; i < p1l; i++) {
			let balli = p1[i];
			for (let j = 0; j < p2l; j++) {
				collideBalls(balli, p2[j]);
			}
		}
	} else {
		for (let i = 0; i < p1l; i++) {
			let balli = p1[i];
			for (let j = 0; j < p2l; j++) {
				collideBallsInstantResponse(balli, p2[j]);
			}
		}
	}
}

function collideBallsWithinPartition(p) {
	const pl = p.length < maxCollisionsPerPartition ? p.length : maxCollisionsPerPartition;
	if (useSoftCollisionResponse) {
		for (let i = 0; i < pl; i++) {
			let balli = p[i];
			for (let j = i + 1; j < pl; j++) {
				collideBalls(balli, p[j]);
			}
		}
	} else {
		for (let i = 0; i < pl; i++) {
			let balli = p[i];
			for (let j = i + 1; j < pl; j++) {
				collideBallsInstantResponse(balli, p[j]);
			}
		}
	}
}



function collideLineBall(line, ball) {
	ball.r += line.w;
	let d = 0;
	if (d < ball.r) {
		let a = line.rd * (line.ra - ball.x * line.dx - ball.y * line.dy);
		if (a > 1) a = 1.0;
		else if (a < 0) a = 0.0;
		let dx = -a * line.dx + line.x2 - ball.x;
		let dy = -a * line.dy + line.y2 - ball.y;
		d = dx * dx + dy * dy;
		if (d < ball.r * ball.r) {
			d = Math.sqrt(d);
			dx /= d;
			dy /= d;
			dx *= ball.r - d;
			dy *= ball.r - d;
			ball.x -= dx;
			ball.y -= dy;
		}
	}
	ball.r -= line.w;
}



function collideLinePartition(line, part) {
	const l = part.length;
	for (let i = 0; i < l; i++) {
		let ball = part[i];
		collideLineBall(line, ball);
	}
}



function collideLineBalls(line) {
	const l = line.partIds.length;
	for (let i = 0; i < l; i++) {
		collideLinePartition(line, sp_partitions[line.partIds[i]]);
	}
}



function updateSoftCollisionResponse() {
	const bl = sceneBalls.length;
	for (let i = 0; i < bl; i++) {
		let ball = sceneBalls[i];
		ball.x += ball.nx / ball.c;
		ball.y += ball.ny / ball.c;
	}
}



function updateCollision_naïve() {
	const bl = sceneBalls.length;
	for (let i = 0; i < bl; i++) {
		let balli = sceneBalls[i];
		for (let j = i + 1; j < bl; j++) {
			let ballj = sceneBalls[j];
			collideBalls(balli, ballj);
		}
	}

	for (let i = 0; i < sceneLines.length; i++) {
		let line = sceneLines[i];
		collideLineBalls(line);
	}
}

function updateCollision_spacePartitioned() {
	for (let y = 0; y < sp_partitionCountY; y++) {
		const onbottom = y == sp_partitionCountY - 1;
		for (let x = 0; x < sp_partitionCountX; x++) {
			const p1 = sp_partitions[x + (y * sp_partitionCountX)];
			if (p1.length == 0) continue;
			const onright = x == sp_partitionCountX - 1;

			collideBallsWithinPartition(p1);
			if (!onbottom) {
				if (x > 0) collideBallsSeparatePartitions(p1, sp_partitions[x - 1 + ((y + 1) * sp_partitionCountX)]);
				collideBallsSeparatePartitions(p1, sp_partitions[x + ((y + 1) * sp_partitionCountX)]);
				if (!onright) {
					collideBallsSeparatePartitions(p1, sp_partitions[x + 1 + (y * sp_partitionCountX)]);
					collideBallsSeparatePartitions(p1, sp_partitions[x + 1 + ((y + 1) * sp_partitionCountX)]);
				}
			} else {
				if (!onright) collideBallsSeparatePartitions(p1, sp_partitions[x + 1 + (y * sp_partitionCountX)]);
			}
		}
	}

	for (let i = 0; i < sceneLines.length; i++) {
		let line = sceneLines[i];
		collideLineBalls(line);
	}
}