import { mat4, vec3 } from "gl-matrix";

function main()
{
    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    const gl = canvas.getContext("webgl");

    gl.enable(gl.DEPTH_TEST);

    const vertShaderSource =
        `attribute vec4 aPosition;
        attribute vec4 aNormal;
        uniform mat4 uMvpMatrix;
        uniform mat4 uModelMatrix;
        uniform mat4 uNormalMatrix;
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main()
        {
            gl_Position = uMvpMatrix * aPosition;
            vPosition = vec3(uModelMatrix * aPosition);
            vNormal = normalize(vec3(uNormalMatrix * aNormal));
        }`;

    const fragShaderSource =
        `precision mediump float;
        const vec3 lightColor = vec3(1.0, 1.0, 1.0);
        const vec3 ambientLight = vec3(0.2, 0.2, 0.2);
        uniform vec3 uLightPosition;
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main()
        {
            vec4 color = vec4(0.5, 1.0, 0.5, 1.0);
            vec3 normal = normalize(vNormal);
            vec3 lightDirection = normalize(uLightPosition - vPosition);
            float nDotL = max(dot(lightDirection, normal), 0.0);
            vec3 diffuse = lightColor * color.rgb * nDotL;
            vec3 ambient = ambientLight * color.rgb;
            gl_FragColor = vec4(diffuse + ambient, color.a);
        }`;

    const vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader, vertShaderSource);
    gl.compileShader(vShader);
    let ok = gl.getShaderParameter(vShader, gl.COMPILE_STATUS);
    if (!ok) { console.log("vert: " + gl.getShaderInfoLog(vShader)); return; };

    const fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader, fragShaderSource);
    gl.compileShader(fShader);
    ok = gl.getShaderParameter(vShader, gl.COMPILE_STATUS);
    if (!ok) { console.log("frag: " + gl.getShaderInfoLog(fShader)); return; };

    const program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    ok = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!ok) { console.log("link: " + gl.getProgramInfoLog(program)); return; };
    gl.useProgram(program);

    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

    const vertPositions = [
        0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front
        0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right
        0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
        -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left
        -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down
        0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5 // v4-v7-v6-v5 back
    ];
    const vertPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPositions), gl.STATIC_DRAW);
    gl.bindAttribLocation(program, 0, "aPosition");
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    const normals = [
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // v7-v4-v3-v2 down
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // v4-v7-v6-v5 back  
    ];
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    gl.bindAttribLocation(program, 1, "aNormal");
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);

    const indices = [
        0, 1, 2, 0, 2, 3,       // front
        4, 5, 6, 4, 6, 7,       // right
        8, 9, 10, 8, 10, 11,    // up
        12, 13, 14, 12, 14, 15, // left
        16, 17, 18, 16, 18, 19, // down
        20, 21, 22, 20, 22, 23  // back 
    ];
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    const projMatrix = mat4.create();
    mat4.perspective(projMatrix, 55 * Math.PI / 180, 1, 0.1, 500);
    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, [4, 5, 10], [0, 0, 0], [0, 1, 0]);
    const projViewMatrix = mat4.create();
    mat4.mul(projViewMatrix, projMatrix, viewMatrix);

    const modelMatrix = mat4.create();
    mat4.fromTranslation(modelMatrix, [0, 0, 0]);
    mat4.rotate(modelMatrix, modelMatrix, 0 * Math.PI / 180, [1, 0, 0]);
    mat4.scale(modelMatrix, modelMatrix, [5, 5, 5]);
    const mvpMatrix = mat4.create();
    mat4.mul(mvpMatrix, projViewMatrix, modelMatrix);
    const uMvpMatrixLocation = gl.getUniformLocation(program, "uMvpMatrix");
    gl.uniformMatrix4fv(uMvpMatrixLocation, false, mvpMatrix);
    const uModelMatrix = gl.getUniformLocation(program, "uModelMatrix");
    gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix);

    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    const uNormalMatrixLocation = gl.getUniformLocation(program, "uNormalMatrix");
    gl.uniformMatrix4fv(uNormalMatrixLocation, false, normalMatrix);

    const lightPosition = vec3.fromValues(4, 7, 5);
    const uLightPositionLocation = gl.getUniformLocation(program, "uLightPosition");
    gl.uniform3fv(uLightPositionLocation, lightPosition);

    gl.clearColor(0.2, 0.2, 0.2, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
}

// Debug
main();

// Release
// window.onload = () => main();
