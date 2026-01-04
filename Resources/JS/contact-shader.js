
class ContactShader {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.program = null;
        this.startTime = Date.now();
        this.animationId = null;
        this.isInitialized = false;
        
        this.initAsync();
    }
    
    async initAsync() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.initWebGL(), { timeout: 1000 });
        } else {
            setTimeout(() => this.initWebGL(), 100);
        }
    }
    
    initWebGL() {
        this.gl = this.canvas.getContext('webgl', { 
            alpha: true, 
            antialias: true,
            powerPreference: 'high-performance'
        }) || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.warn('WebGL not supported');
            return;
        }
        
        this.init();
    }
    
    init() {
        const gl = this.gl;
        
        const vertexShaderSource = `
            attribute vec2 a_position;
            varying vec2 v_uv;
            
            void main() {
                v_uv = (a_position + 1.0) * 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        const fragmentShaderSource = `
            precision highp float;
            
            varying vec2 v_uv;
            uniform float iTime;
            uniform vec2 iResolution;
            
            // Simplex 2D noise
            vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

            float snoise(vec2 v){
                const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy) );
                vec2 x0 = v -   i + dot(i, C.xx);
                vec2 i1;
                i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod(i, 289.0);
                vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                + i.x + vec3(0.0, i1.x, 1.0 ));
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                    dot(x12.zw,x12.zw)), 0.0);
                m = m*m ;
                m = m*m ;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            void main() {
                vec2 uv = v_uv;
                float time = iTime * 0.1;
                
                // Background - Deep Space Black/Gray
                vec3 color = vec3(0.02, 0.02, 0.03);
                
                // Nebula / Fog (Grayscale)
                float n1 = snoise(uv * 2.0 + vec2(time * 0.2, time * 0.1));
                float n2 = snoise(uv * 3.0 - vec2(time * 0.1, time * 0.3));
                
                float fog = n1 * 0.5 + n2 * 0.25;
                color += vec3(fog * 0.1); // Subtle gray fog
                
                // Vignette
                float dist = distance(uv, vec2(0.5));
                color *= 1.0 - dist * 0.6;

                gl_FragColor = vec4(color, 1.0);
            }
        `;
        
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        if (!vertexShader || !fragmentShader) return;
        
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(this.program));
            return;
        }
        
        const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        
        this.positionLocation = gl.getAttribLocation(this.program, 'a_position');
        this.timeLocation = gl.getUniformLocation(this.program, 'iTime');
        this.resolutionLocation = gl.getUniformLocation(this.program, 'iResolution');
        
        this.isInitialized = true;
        
        this.resize();
        this.render();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
    
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    render() {
        if (!this.isInitialized) return;
        
        const gl = this.gl;
        const time = (Date.now() - this.startTime) / 1000;
        
        gl.useProgram(this.program);
        gl.uniform1f(this.timeLocation, time);
        gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
        
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        this.animationId = requestAnimationFrame(() => this.render());
    }
    
    destroy() {
        this.isInitialized = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.gl) {
            this.gl.getExtension('WEBGL_lose_context')?.loseContext();
            this.gl = null;
        }
    }
}

function initContactShader() {
    if (window.contactShader) {
        window.contactShader.destroy();
        window.contactShader = null;
    }
    
    const tryInit = () => {
        const canvas = document.getElementById('contact-canvas');
        if (canvas) {
            window.contactShader = new ContactShader(canvas);
            return true;
        }
        return false;
    };

    if (tryInit()) return;

    const checkCanvas = setInterval(() => {
        if (tryInit()) clearInterval(checkCanvas);
    }, 100);
    
    // Stop checking after 5 seconds
    setTimeout(() => clearInterval(checkCanvas), 5000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactShader);
} else {
    setTimeout(initContactShader, 0);
}

document.addEventListener('routeChange', initContactShader);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactShader);
} else {
    setTimeout(initContactShader, 0);
}

document.addEventListener('routeChange', initContactShader);
