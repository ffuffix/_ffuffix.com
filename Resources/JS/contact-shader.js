
class ContactShader {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.program = null;
        this.startTime = Date.now();
        this.animationId = null;
        this.isInitialized = false;
        this.frameCount = 0;
        this.loadingDismissed = false;

        // Random color per load — full range including black, white, and everything between
        this.randomColor = [Math.random(), Math.random(), Math.random()];
        // Random noise offset so each load produces a different pattern
        this.randomOffset = [Math.random() * 100.0, Math.random() * 100.0];
        
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
            uniform vec3 uColor;      // random color per load
            uniform vec2 uOffset;     // random noise offset per load
            
            // Simplex 2D noise
            vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

            float snoise(vec2 v){
                const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy));
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
                m = m*m;
                m = m*m;
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

            // Fractional Brownian Motion
            float fbm(vec2 p) {
                float value = 0.0;
                float amplitude = 0.5;
                float frequency = 1.0;
                for (int i = 0; i < 5; i++) {
                    value += amplitude * snoise(p * frequency);
                    frequency *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }

            // Domain-warped fBm for thick fluid motion
            float warpedFbm(vec2 p, float t) {
                vec2 q = vec2(
                    fbm(p + vec2(0.0, 0.0) + t * 0.04),
                    fbm(p + vec2(5.2, 1.3) + t * 0.03)
                );
                vec2 r = vec2(
                    fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 0.02),
                    fbm(p + 3.0 * q + vec2(8.3, 2.8) + t * 0.03)
                );
                return fbm(p + 3.0 * r);
            }

            // Curtain tendril function — vertical hanging shapes
            float curtain(vec2 p, float t) {
                float n = snoise(vec2(p.x * 3.0, p.y * 0.4 + t * 0.05));
                float wave = sin(p.x * 8.0 + n * 2.5 + t * 0.15) * 0.5 + 0.5;
                wave = pow(wave, 4.0);
                // Fade curtains toward bottom — they hang from above
                float fade = smoothstep(1.0, 0.2, p.y);
                return wave * fade;
            }

            void main() {
                vec2 uv = v_uv;
                float aspect = iResolution.x / iResolution.y;
                vec2 st = vec2(uv.x * aspect, uv.y);
                float t = iTime * 0.06;

                // Build palette from random color
                float lum = dot(uColor, vec3(0.299, 0.587, 0.114));
                vec3 voidBlack   = uColor * 0.015;                          // tinted black
                vec3 voidDeep    = uColor * 0.06 + vec3(0.005);             // near-black hint
                vec3 voidGold    = uColor * 0.55 + vec3(0.02);              // core fluid color
                vec3 voidBright  = uColor * 0.8 + vec3(0.04);               // bright glow
                vec3 voidHot     = min(uColor * 1.1 + vec3(0.06), vec3(1.0)); // hot highlights

                // Start from tinted black
                vec3 color = voidBlack;

                // Thick fluid body
                // Slow upward drift + random offset so each load looks different
                vec2 fluidUV = st + vec2(0.0, -t * 0.08) + uOffset;
                float w1 = warpedFbm(fluidUV * 0.7, t);
                float fluid = w1 * 0.5 + 0.5;

                // Map fluid density to golden color
                vec3 fluidColor = mix(voidDeep, voidGold, smoothstep(0.3, 0.7, fluid));
                // Brighten the densest regions
                fluidColor = mix(fluidColor, voidBright, smoothstep(0.6, 0.85, fluid) * 0.5);
                color += fluidColor * fluid * 0.8;

                // Tidal Surge Layer
                // Second warp layer with a slow tide-like rise/fall
                float tide = sin(t * 0.3) * 0.15;
                vec2 tidalUV = st + vec2(t * 0.02, tide) + uOffset * 1.7;
                float w2 = warpedFbm(tidalUV * 0.5 + vec2(3.1, 7.4), t * 0.8);
                float tidal = w2 * 0.5 + 0.5;

                // Where both fluid layers are bright, create hot golden glow
                float hotSpot = smoothstep(0.45, 0.7, fluid) * smoothstep(0.45, 0.7, tidal);
                color += voidBright * hotSpot * 0.35;

                // Curtain Tendrils Layer
                // Vertical hanging shapes that break apart the background
                // (as described: "background breaks apart into curtain-like shapes")
                float c1 = curtain(st, t);
                float c2 = curtain(st * 0.7 + vec2(1.5, 0.3), t * 1.2 + 3.0);
                float c3 = curtain(st * 1.3 + vec2(0.8, -0.5), t * 0.8 + 7.0);
                float curtains = c1 * 0.5 + c2 * 0.3 + c3 * 0.2;

                // Curtains glow golden, brighter at their edges
                color += voidGold * curtains * 0.25;
                // Hot edge glow on the brightest curtain lines
                float curtainEdge = smoothstep(0.3, 0.6, curtains);
                color += voidHot * curtainEdge * 0.12;

                // Surface Caustics Layer
                // Overlapping noise creates liquid light refraction patterns
                vec2 causticUV = st * 2.5 + vec2(t * 0.08, -t * 0.12) + uOffset * 2.3;
                float ca = snoise(causticUV);
                float cb = snoise(causticUV * 1.3 + vec2(2.3, -1.7) + t * 0.04);
                float caustic = abs(ca + cb);
                caustic = pow(max(1.0 - caustic, 0.0), 6.0);
                // Caustics only visible where fluid is present
                color += voidBright * caustic * fluid * 0.15;

                // Glowing Pools Layer
                // Slow-moving pools of light deep within the fluid
                for (int i = 0; i < 4; i++) {
                    float fi = float(i);
                    vec2 glowPos = vec2(
                        0.5 * aspect + sin(t * 0.1 + fi * 1.9) * 0.4 * aspect,
                        0.5 + cos(t * 0.08 + fi * 2.3) * 0.35
                    );
                    float glowDist = length(st - glowPos);
                    // Large soft glow
                    float glow = exp(-glowDist * glowDist * 1.8);
                    // Color shifts slightly between gold and hot gold
                    vec3 glowColor = mix(voidGold, voidHot, sin(fi * 1.5 + t * 0.2) * 0.5 + 0.5);
                    color += glowColor * glow * 0.08;
                }

                // Fine Particle Shimmer Layer
                // Tiny bright specks like particles dissolving in the fluid
                float sparkle = snoise(st * 12.0 + vec2(t * 0.5, -t * 0.3));
                float sparkle2 = snoise(st * 15.0 + vec2(-t * 0.4, t * 0.6));
                float sparks = sparkle * sparkle2;
                sparks = smoothstep(0.25, 0.45, sparks);
                // Only show sparks where fluid is visible
                color += voidHot * sparks * fluid * 0.06;

                // Vignette Layer
                float dist = length(uv - 0.5);
                float vignette = 1.0 - smoothstep(0.15, 0.85, dist);
                color *= mix(0.25, 1.0, vignette);

                // Overall vertical gradient to enhance depth perception
                // Brighter at bottom (void sea surface), darker above (the abyss)
                float vertGrad = smoothstep(0.0, 0.9, uv.y);
                color *= mix(0.55, 1.0, vertGrad);
                // Extra glow near the bottom edge
                float bottomGlow = smoothstep(0.3, 0.0, uv.y);
                color += voidGold * bottomGlow * 0.06;


                color = clamp(color, 0.0, 1.0);
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
        this.colorLocation = gl.getUniformLocation(this.program, 'uColor');
        this.offsetLocation = gl.getUniformLocation(this.program, 'uOffset');
        
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
        // Render at lower resolution for subtle Rain World pixel feel
        const pixelScale = 3;
        this.canvas.width = Math.floor(rect.width / pixelScale);
        this.canvas.height = Math.floor(rect.height / pixelScale);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    render() {
        if (!this.isInitialized) return;
        
        const gl = this.gl;
        const time = (Date.now() - this.startTime) / 1000;
        
        gl.useProgram(this.program);
        gl.uniform1f(this.timeLocation, time);
        gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
        gl.uniform3f(this.colorLocation, this.randomColor[0], this.randomColor[1], this.randomColor[2]);
        gl.uniform2f(this.offsetLocation, this.randomOffset[0], this.randomOffset[1]);
        
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Dismiss loading screen after shader has rendered enough frames to stabilize
        this.frameCount++;
        if (!this.loadingDismissed && this.frameCount > 15) {
            this.loadingDismissed = true;
            const loader = document.getElementById('contact-loading');
            if (loader) {
                loader.classList.add('fade-out');
                loader.addEventListener('transitionend', () => {
                    loader.classList.add('hidden');
                }, { once: true });
            }
        }
        
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
