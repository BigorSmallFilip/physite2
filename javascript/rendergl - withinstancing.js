
function loadShader(type, source) {
	let shader = simCanvasWebGL.createShader(type);
	// Send the source to the shader object
	simCanvasWebGL.shaderSource(shader, source);
	// Compile the shader program
	simCanvasWebGL.compileShader(shader);

	// See if it compiled successfully
	if (!simCanvasWebGL.getShaderParameter(shader, simCanvasWebGL.COMPILE_STATUS)) {
		alert(
			`An error occurred compiling the shaders: ${simCanvasWebGL.getShaderInfoLog(shader)}`
		);
		simCanvasWebGL.deleteShader(shader);
		return null;
	}

	return shader;
}





var circleRender = {

    circleVertecies: [],
    vertexBuffer: undefined,

    vertexShader: undefined,
    vertexSource: `#version 300 es
        in vec4 aVertex;
        
        uniform vec2 uPosition[10000];
		uniform float uScale[10000];
        uniform vec2 uWorldToScreenScale;
    	uniform vec2 uWorldToScreenOffset;
    	void main() {
            vec2 pos = (aVertex.xy * uScale[gl_InstanceID] + uPosition[gl_InstanceID]) * uWorldToScreenScale + uWorldToScreenOffset;
    	    gl_Position = vec4(pos.x, pos.y, 0, 1);
    	}
	`,

    fragmentShader: undefined,
    fragmentSource: `#version 300 es
		precision mediump float;
		uniform vec4 uColor;
        out vec4 fragColor;
    	void main() {
    		fragColor = uColor;
    	}
  	`,

    shaderProgram: undefined,
    state: {
        aVertex: undefined,
        uPosition: undefined,
        uScale: undefined,
        uWorldToScreenScale: undefined,
        uWorldToScreenOffset: undefined,
        uColor: undefined
    }
};

function initCircleRender() {
    circleRender.vertexShader = loadShader(simCanvasWebGL.VERTEX_SHADER, circleRender.vertexSource);
	circleRender.fragmentShader = loadShader(simCanvasWebGL.FRAGMENT_SHADER, circleRender.fragmentSource);
    circleRender.shaderProgram = simCanvasWebGL.createProgram();
    simCanvasWebGL.attachShader(circleRender.shaderProgram, circleRender.vertexShader);
	simCanvasWebGL.attachShader(circleRender.shaderProgram, circleRender.fragmentShader);
	simCanvasWebGL.linkProgram(circleRender.shaderProgram);

    // If creating the shader program failed, alert
	if (!simCanvasWebGL.getProgramParameter(circleRender.shaderProgram, simCanvasWebGL.LINK_STATUS)) {
		alert(
			`Unable to initialize the shader program: ${simCanvasWebGL.getProgramInfoLog(
				circleRender.shaderProgram
			)}`
		);
        return;
	}

    circleVertecies = [];
    const numVertecies = 40;
	for (let i = 0; i < numVertecies * 2; i += 2) {
		let a = Math.PI * (i / numVertecies);
		circleRender.circleVertecies[i] = Math.cos(a);
		circleRender.circleVertecies[i + 1] = Math.sin(a);
	}

    circleRender.vertexBuffer = simCanvasWebGL.createBuffer();

	simCanvasWebGL.bindBuffer(simCanvasWebGL.ARRAY_BUFFER, circleRender.vertexBuffer);
	simCanvasWebGL.bufferData(simCanvasWebGL.ARRAY_BUFFER, new Float32Array(circleRender.circleVertecies), simCanvasWebGL.STATIC_DRAW);

    circleRender.state.aVertex              = simCanvasWebGL.getAttribLocation(circleRender.shaderProgram, "aVertex");
    circleRender.state.uPosition            = simCanvasWebGL.getUniformLocation(circleRender.shaderProgram, "uPosition");
    circleRender.state.uScale               = simCanvasWebGL.getUniformLocation(circleRender.shaderProgram, "uScale");
    circleRender.state.uWorldToScreenScale  = simCanvasWebGL.getUniformLocation(circleRender.shaderProgram, "uWorldToScreenScale");
    circleRender.state.uWorldToScreenOffset = simCanvasWebGL.getUniformLocation(circleRender.shaderProgram, "uWorldToScreenOffset");
    circleRender.state.uColor               = simCanvasWebGL.getUniformLocation(circleRender.shaderProgram, "uColor");

	simCanvasWebGL.bindBuffer(simCanvasWebGL.ARRAY_BUFFER, circleRender.vertexBuffer);
	simCanvasWebGL.vertexAttribPointer(
		circleRender.state.aVertex,
		2, // pull out 2 values per iteration
		simCanvasWebGL.FLOAT, // the data in the buffer is 32bit floats
		false, // don't normalize
		0, // how many bytes to get from one set of values to the next
		0 // how many bytes inside the buffer to start from
	);
	simCanvasWebGL.enableVertexAttribArray(circleRender.state.aVertex);
}



function initWebGL() {
    initCircleRender();
}



function renderCircleGL(x, y, r, colr, colg, colb) {
	simCanvasWebGL.uniform4fv(circleRender.state.uPosition, [x, y, 0, 0], 0, 1);
	simCanvasWebGL.uniform4fv(circleRender.state.uScale, [r, r, 1, 1], 0, 1);
	simCanvasWebGL.uniform4fv(circleRender.state.uColor, [colr, colg, colb, 1.0], 0, 1);
	simCanvasWebGL.drawArrays(simCanvasWebGL.TRIANGLE_FAN, 0, circleRender.circleVertecies.length / 2);
}





function renderSceneGL() {
    simCanvasWebGL.clearColor(0.0, 0.0, 0.0, 1.0);
	simCanvasWebGL.clear(simCanvasWebGL.COLOR_BUFFER_BIT);

	// Tell WebGL to use our program when drawing
	simCanvasWebGL.useProgram(circleRender.shaderProgram);
    
    simCanvasWebGL.uniform2fv(circleRender.state.uWorldToScreenScale, [2 / simCanvasWidth, -2 / simCanvasHeight]);
	simCanvasWebGL.uniform2fv(circleRender.state.uWorldToScreenOffset, [-1, 1]);
	
    let positions = [];
    let scales = [];
    let colors = [];
    for (let i = 0; i < 1000; i++) {
        const ball = sceneBalls[i];
        positions[i * 2] = ball.x;
        positions[i * 2 + 1] = ball.y;
        scales[i] = ball.r;
        colors[i * 4] = ball.colr;
        colors[i * 4 + 1] = ball.colg;
        colors[i * 4 + 2] = ball.colb;
        colors[i * 4 + 3] = 1;
    }
    simCanvasWebGL.uniform2fv(circleRender.state.uPosition, positions);
    simCanvasWebGL.uniform1fv(circleRender.state.uScale, scales);
    simCanvasWebGL.uniform4fv(circleRender.state.uColor, [1, 0, 0, 1]);

	renderBallsGLInstanced();
}



function renderBallsGLInstanced() {
    simCanvasWebGL.drawArraysInstanced(simCanvasWebGL.TRIANGLE_FAN, 0, circleRender.circleVertecies.length / 2, 10000);
}



function renderBallsGL() {
	const bl = sceneBalls.length;
	for (let i = 0; i < bl; i++) {
        const ball = sceneBalls[i];
		renderCircleGL(ball.x, ball.y, ball.r, ball.colr, ball.colg, ball.colb);
	}
}