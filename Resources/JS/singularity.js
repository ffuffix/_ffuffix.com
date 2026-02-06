// Singularity Shader

class SingularityShader {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.program = null;
        this.startTime = Date.now();
        this.animationId = null;
        this.isInitialized = false;
        
        this.speed = 0.8;
        this.intensity = 2.0;
        this.size = 0.7;
        this.waveStrength = 1.0;
        this.colorShift = 1.0;
        
        this.mouseX = 0.5;
        this.mouseY = 0.5;
        this.targetMouseX = 0.5;
        this.targetMouseY = 0.5;
        this.mouseInfluence = 0.0;
        this.targetMouseInfluence = 0.0;
        this.isHovering = false;

        this.initAsync();
    }
    
    async initAsync() {
        // Wait for idle time before initializing WebGL
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
        
        // Vertex shader
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
            uniform float u_speed;
            uniform float u_intensity;
            uniform float u_size;
            uniform float u_waveStrength;
            uniform float u_colorShift;
            uniform vec2 u_mouse;
            uniform float u_mouseInfluence;
            
            void main() {
                vec2 F = v_uv * iResolution;
                float i = .2 * u_speed, a;
                vec2 r = iResolution.xy;
                
                // Base position
                vec2 p = (F + F - r) / r.y / (.7 * u_size);
                
                // Mouse suction effect - very subtle
                // Transform mouse to same coordinate space as p
                vec2 mouseNorm = u_mouse * 2.0 - 1.0;
                vec2 mousePos = vec2(mouseNorm.x * (r.x / r.y), mouseNorm.y) / (.7 * u_size);
                float distToMouse = length(p - mousePos);
                float suctionRadius = 2.0;
                float suctionStrength = u_mouseInfluence * 0.08;
                
                // Gentle pull towards mouse position
                if (distToMouse < suctionRadius && u_mouseInfluence > 0.0) {
                    float pullFactor = (1.0 - distToMouse / suctionRadius);
                    pullFactor = pullFactor * pullFactor * pullFactor * suctionStrength;
                    vec2 pullDir = normalize(mousePos - p);
                    p += pullDir * pullFactor * 0.5;
                }
                
                vec2 d = vec2(-1.0, 1.0),
                     b = p - i * d,
                     c = p * mat2(1.0, 1.0, d / (.1 + i / dot(b, b))),
                     v = c * mat2(cos(.5 * log(a = dot(c, c)) + iTime * i * u_speed + vec4(0.0, 33.0, 11.0, 0.0))) / i,
                     w = vec2(0.0);
                
                // Minimal extra turbulence when mouse is active
                float turbulence = 1.0 + u_mouseInfluence * 0.1;
                
                for(float j = 0.0; j < 9.0; j++) {
                    i++;
                    w += 1.0 + sin(v * u_waveStrength * turbulence);
                    v += .7 * sin(v.yx * i + iTime * u_speed * turbulence) / i + .5;
                }
                
                i = length(sin(v / .3) * .4 + c * (3.0 + d));
                
                vec4 colorGrad = vec4(.6, -.4, -1.0, 0.0) * u_colorShift;
                
                // Subtle brightness near mouse
                float mouseBoost = 1.0 + u_mouseInfluence * 0.15 * (1.0 - smoothstep(0.0, suctionRadius, distToMouse));
                
                vec4 O = 1.0 - exp(-exp(c.x * colorGrad)
                               / w.xyyx
                               / (2.0 + i * i / 4.0 - i)
                               / (.5 + 1.0 / a)
                               / (.03 + abs(length(p) - .7))
                               * u_intensity * mouseBoost
                         );
                
                // Convert to grayscale
                float gray = dot(O.rgb, vec3(0.299, 0.587, 0.114));
                gl_FragColor = vec4(vec3(gray), O.a);
            }
        `;
        
        // Compile shaders
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        if (!vertexShader || !fragmentShader) return;
        
        // Create program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(this.program));
            return;
        }
        
        // Create geometry (fullscreen quad)
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);
        
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        
        // Get attribute/uniform locations
        this.positionLocation = gl.getAttribLocation(this.program, 'a_position');
        this.timeLocation = gl.getUniformLocation(this.program, 'iTime');
        this.resolutionLocation = gl.getUniformLocation(this.program, 'iResolution');
        this.speedLocation = gl.getUniformLocation(this.program, 'u_speed');
        this.intensityLocation = gl.getUniformLocation(this.program, 'u_intensity');
        this.sizeLocation = gl.getUniformLocation(this.program, 'u_size');
        this.waveStrengthLocation = gl.getUniformLocation(this.program, 'u_waveStrength');
        this.colorShiftLocation = gl.getUniformLocation(this.program, 'u_colorShift');
        this.mouseLocation = gl.getUniformLocation(this.program, 'u_mouse');
        this.mouseInfluenceLocation = gl.getUniformLocation(this.program, 'u_mouseInfluence');
        
        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        this.setupMouseEvents();
        this.isInitialized = true;
        
        this.resize();
        this.render();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    setupMouseEvents() {
        this.canvas.style.pointerEvents = 'auto';
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.targetMouseX = (e.clientX - rect.left) / rect.width;
            this.targetMouseY = 1.0 - (e.clientY - rect.top) / rect.height; // Flip Y
        });
        
        this.canvas.addEventListener('mouseenter', () => {
            this.isHovering = true;
            this.targetMouseInfluence = 1.0;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isHovering = false;
            this.targetMouseInfluence = 0.0;
        });
        
        // Touch support
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.targetMouseX = (touch.clientX - rect.left) / rect.width;
            this.targetMouseY = 1.0 - (touch.clientY - rect.top) / rect.height;
            this.targetMouseInfluence = 1.0;
        }, { passive: false });
        
        this.canvas.addEventListener('touchstart', () => {
            this.targetMouseInfluence = 1.0;
        });
        
        this.canvas.addEventListener('touchend', () => {
            this.targetMouseInfluence = 0.0;
        });
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
        
        // Signal ready on first render frame
        if (!document.body.classList.contains('shader-ready')) {
            requestAnimationFrame(() => {
                document.body.classList.add('shader-ready');
            });
        }

        const gl = this.gl;
        
        // Smoothing for mouse
        const smoothing = 0.2;
        this.mouseX += (this.targetMouseX - this.mouseX) * smoothing;
        this.mouseY += (this.targetMouseY - this.mouseY) * smoothing;
        this.mouseInfluence += (this.targetMouseInfluence - this.mouseInfluence) * 0.015;
        
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(this.program);
        
        // Update uniforms
        const time = (Date.now() - this.startTime) / 1000;
        gl.uniform1f(this.timeLocation, time);
        gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.speedLocation, this.speed);
        gl.uniform1f(this.intensityLocation, this.intensity);
        gl.uniform1f(this.sizeLocation, this.size);
        gl.uniform1f(this.waveStrengthLocation, this.waveStrength);
        gl.uniform1f(this.colorShiftLocation, this.colorShift);
        gl.uniform2f(this.mouseLocation, this.mouseX, this.mouseY);
        gl.uniform1f(this.mouseInfluenceLocation, this.mouseInfluence);
        
        // Draw
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

// Initialize shader separately from page content
function initSingularity() {
    // Clean up existing instance
    if (window.singularityShader) {
        window.singularityShader.destroy();
        window.singularityShader = null;
    }
    
    const canvas = document.getElementById('singularity-canvas');
    if (canvas) {
        // Load shader after page content is ready
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                window.singularityShader = new SingularityShader(canvas);
            }, { timeout: 500 });
        } else {
            setTimeout(() => {
                window.singularityShader = new SingularityShader(canvas);
            }, 50);
        }
    }
}

// Check if already loaded or wait for load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSingularity);
} else {
    // Defer to allow page content to render first
    setTimeout(initSingularity, 0);
}

// Re-initialize on route changes (for SPA)
document.addEventListener('routeChange', initSingularity);
