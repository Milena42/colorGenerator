attribute float scale;

attribute vec3 pointColor; 
varying vec3 vColor;

void main() {
    vColor = pointColor;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    gl_PointSize = scale * (300.0 );

    gl_Position = projectionMatrix * mvPosition;

}