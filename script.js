class AuthManager {
    constructor() {
        this.STORAGE_KEY = 'audio_visualizer_keys';
        this.GENERATED_KEYS_KEY = 'audio_visualizer_generated_keys';
        this.SESSION_KEY = 'audio_visualizer_session';
        this.ADMIN_KEY = 'AVPRO-ADMIN-2024-MASTER';
        this.validKeys = this.initializeKeys();
        this.displayKeys();
    }
    initializeKeys() {
        let storedKeys = sessionStorage.getItem(this.GENERATED_KEYS_KEY);
        if (!storedKeys) {
            const newKeys = this.generateNewKeys(20);
            newKeys.push(this.ADMIN_KEY);
            sessionStorage.setItem(this.GENERATED_KEYS_KEY, JSON.stringify(newKeys));
            storedKeys = JSON.stringify(newKeys);
            const keyData = {};
            newKeys.forEach(key => {
                keyData[key] = {created: new Date().toISOString(), lastUsed: null, activeSession: null, usageCount: 0, isActive: true, isAdmin: key === this.ADMIN_KEY};
            });
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(keyData));
        }
        const keys = JSON.parse(storedKeys);
        let keyData = JSON.parse(sessionStorage.getItem(this.STORAGE_KEY) || '{}');
        let needsUpdate = false;
        keys.forEach(key => {
            if (!keyData[key]) {
                keyData[key] = {created: new Date().toISOString(), lastUsed: null, activeSession: null, usageCount: 0, isActive: true, isAdmin: key === this.ADMIN_KEY};
                needsUpdate = true;
            }
        });
        if (needsUpdate) sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(keyData));
        return keys;
    }
    generateNewKeys(count) {
        const keys = [];
        for (let i = 0; i < count; i++) {
            const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
            const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
            const part3 = Math.random().toString(36).substring(2, 6).toUpperCase();
            keys.push(`AVPRO-${part1}-${part2}-${part3}`);
        }
        return keys;
    }
    displayKeys() {
        const keyList = document.getElementById('keyList');
        if (!keyList) return;
        const keyData = JSON.parse(sessionStorage.getItem(this.STORAGE_KEY) || '{}');
        const keys = JSON.parse(sessionStorage.getItem(this.GENERATED_KEYS_KEY) || '[]');
        keyList.innerHTML = '';
        if (keys.length === 0) {
            keyList.innerHTML = '<div style="color: #999; text-align: center;">No keys generated yet. Refresh the page.</div>';
            return;
        }
        keys.forEach(key => {
            if (key === this.ADMIN_KEY) return;
            const keyInfo = keyData[key] || {};
            const div = document.createElement('div');
            div.className = 'key-item';
            div.innerHTML = `<div style="margin-bottom: 3px;"><strong style="color: #fff;">${key}</strong></div><div style="font-size: 11px; color: #aaa;">Created: ${new Date(keyInfo.created).toLocaleDateString()} | Used: ${keyInfo.usageCount || 0} times${keyInfo.activeSession ? '<span style="color: #ffcc00;"> | IN USE</span>' : ''}</div>`;
            div.style.cursor = 'pointer';
            div.style.padding = '8px';
            div.style.borderRadius = '4px';
            div.style.marginBottom = '5px';
            div.style.transition = 'background 0.2s';
            div.addEventListener('mouseenter', () => div.style.background = 'rgba(255, 255, 255, 0.1)');
            div.addEventListener('mouseleave', () => div.style.background = 'transparent');
            div.addEventListener('click', () => {
                navigator.clipboard.writeText(key).then(() => {
                    const originalHTML = div.innerHTML;
                    div.innerHTML = '<span style="color: #33cc33;">✓ Copied to clipboard!</span>';
                    setTimeout(() => div.innerHTML = originalHTML, 2000);
                }).catch(() => {
                    const textArea = document.createElement('textarea');
                    textArea.value = key;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    const originalHTML = div.innerHTML;
                    div.innerHTML = '<span style="color: #33cc33;">✓ Copied!</span>';
                    setTimeout(() => div.innerHTML = originalHTML, 2000);
                });
            });
            keyList.appendChild(div);
        });
        const copyAllDiv = document.createElement('div');
        copyAllDiv.innerHTML = '<hr style="border-color: rgba(255,255,255,0.1); margin: 10px 0;"><button id="copyAllKeys" style="width: 100%; padding: 8px; background: #000080; color: white; border: none; border-radius: 4px; cursor: pointer;">Copy All Keys to Clipboard</button>';
        keyList.appendChild(copyAllDiv);
        document.getElementById('copyAllKeys')?.addEventListener('click', () => {
            const allKeys = keys.filter(k => k !== this.ADMIN_KEY).join('\n');
            navigator.clipboard.writeText(allKeys).then(() => {
                const btn = document.getElementById('copyAllKeys');
                btn.textContent = '✓ All Keys Copied!';
                btn.style.background = '#33cc33';
                setTimeout(() => {
                    btn.textContent = 'Copy All Keys to Clipboard';
                    btn.style.background = '#000080';
                }, 2000);
            });
        });
    }
    generateBrowserFingerprint() {
        const components = [navigator.userAgent, navigator.language, navigator.hardwareConcurrency, screen.width + 'x' + screen.height, new Date().getTimezoneOffset()];
        const combined = components.join('|');
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36) + Math.random().toString(36).substring(2, 9);
    }
    validateKey(key) {
        key = key.trim().toUpperCase();
        if (!this.validKeys.includes(key)) return { valid: false, message: "Invalid access key" };
        const keyData = JSON.parse(sessionStorage.getItem(this.STORAGE_KEY) || '{}');
        const keyInfo = keyData[key] || {};
        const fingerprint = this.generateBrowserFingerprint();
        if (keyInfo.isActive === false) return { valid: false, message: "This key has been deactivated" };
        const isAdmin = key === this.ADMIN_KEY || keyInfo.isAdmin === true;
        return { valid: true, fingerprint, keyInfo, isAdmin };
    }
    login(key) {
        const validation = this.validateKey(key);
        if (!validation.valid) return validation;
        const keyData = JSON.parse(sessionStorage.getItem(this.STORAGE_KEY) || '{}');
        keyData[key] = {created: keyData[key]?.created || new Date().toISOString(), lastUsed: new Date().toISOString(), activeSession: validation.fingerprint, usageCount: (keyData[key]?.usageCount || 0) + 1, isActive: true, isAdmin: validation.isAdmin};
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(keyData));
        const session = {key: key, fingerprint: validation.fingerprint, loginTime: new Date().toISOString(), lastActivity: new Date().toISOString(), isAdmin: validation.isAdmin};
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        this.displayKeys();
        return { valid: true, session };
    }
    logout() {
        const session = this.getSession();
        if (session && session.key) {
            const keyData = JSON.parse(sessionStorage.getItem(this.STORAGE_KEY) || '{}');
            if (keyData[session.key]) {
                keyData[session.key].activeSession = null;
                sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(keyData));
            }
        }
        sessionStorage.removeItem(this.SESSION_KEY);
        window.location.reload();
    }
    getSession() {
        const sessionSession = sessionStorage.getItem(this.SESSION_KEY);
        try {
            return sessionSession ? JSON.parse(sessionSession) : null;
        } catch (e) {
            return null;
        }
    }
    verifySession() {
        const session = this.getSession();
        if (!session) return false;
        const validation = this.validateKey(session.key);
        if (!validation.valid) return false;
        session.lastActivity = new Date().toISOString();
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        return true;
    }
    generateMoreKeys(count = 10) {
        const existingKeys = JSON.parse(sessionStorage.getItem(this.GENERATED_KEYS_KEY) || '[]');
        const newKeys = this.generateNewKeys(count);
        const allKeys = [...existingKeys, ...newKeys];
        sessionStorage.setItem(this.GENERATED_KEYS_KEY, JSON.stringify(allKeys));
        const keyData = JSON.parse(sessionStorage.getItem(this.STORAGE_KEY) || '{}');
        newKeys.forEach(key => {
            if (!keyData[key]) keyData[key] = {created: new Date().toISOString(), lastUsed: null, activeSession: null, usageCount: 0, isActive: true, isAdmin: false};
        });
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(keyData));
        this.validKeys = allKeys;
        this.displayKeys();
        return newKeys;
    }
    deactivateKey(key) {
        const keyData = JSON.parse(sessionStorage.getItem(this.STORAGE_KEY) || '{}');
        if (keyData[key]) {
            keyData[key].isActive = false;
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(keyData));
            this.displayKeys();
            return true;
        }
        return false;
    }
}

class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 4096;
        this.analyser.smoothingTimeConstant = 0.8;
        this.sourceNode = null;
        this.audioElement = null;
        this.isMic = false;
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        this.timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);
        this.oldIntensity = 0;
        this.beatEffect = 0;
        this.beatDecayRate = 0.92;
        this.beatThreshold = 3000;
    }
    async loadUrl(url) {
        if (this.sourceNode) this.disconnectSource();
        this.audioElement = new Audio(url);
        this.audioElement.crossOrigin = "anonymous";
        this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
        this.isMic = false;
        this.connectSource();
        return this.audioElement;
    }
    async loadFile(file) {
        const url = URL.createObjectURL(file);
        await this.loadUrl(url);
    }
    async loadMicrophone() {
        if (this.sourceNode) this.disconnectSource();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: {echoCancellation: false, noiseSuppression: false, autoGainControl: false}, video: false });
            this.sourceNode = this.audioContext.createMediaStreamSource(stream);
            this.isMic = true;
            this.connectSource();
        } catch (err) {
            alert("Microphone access denied.");
        }
    }
    connectSource() {
        if (this.sourceNode) {
            this.sourceNode.connect(this.analyser);
            if (!this.isMic) this.analyser.connect(this.audioContext.destination);
        }
    }
    disconnectSource() {
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            if (this.sourceNode.mediaStream) this.sourceNode.mediaStream.getTracks().forEach(track => track.stop());
            if (this.audioElement) {
                this.audioElement.pause();
                this.audioElement.src = '';
                this.audioElement = null;
            }
            this.sourceNode = null;
        }
    }
    update() {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(this.frequencyData);
        this.analyser.getByteTimeDomainData(this.timeDomainData);
        const bass = this.frequencyData.slice(0, 32).reduce((a, b) => a + b, 0);
        if (bass - this.oldIntensity > this.beatThreshold) this.beatEffect = 1;
        this.oldIntensity = bass;
        this.beatEffect = Math.max(0, this.beatEffect * this.beatDecayRate);
    }
}

class Renderer {
    constructor(audioManager) {
        this.audioManager = audioManager;
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.threeJsContainer = document.getElementById('threejs-container');
        this.previewCanvas = document.getElementById('preview-canvas');
        this.previewCtx = this.previewCanvas.getContext('2d');
        this.threeJsPreviewContainer = document.getElementById('threejs-preview-container');
        this.customImage = null;
        this.initializeModes();
        this.currentMode = this.modes.circular;
        this.beatColor = '#ff0000';
        this.isCapturing = false;
        this.captureCanvas = null;
        this.offscreenThreeRenderer = null;
        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
        if (this.currentMode && this.currentMode.init) this.currentMode.init();
    }
    initializeModes() {
        this.modes = {
            circular: new CircularMode(this),
            linear: new LinearMode(this),
            reflected: new ReflectedMode(this),
            flower: new FlowerMode(this),
            particle: new ParticleMode(this),
            waveform: new WaveformMode(this),
            galaxy: new GalaxyMode(this),
            threeD: new ThreeDMode(this),
            radial: new RadialMode(this),
            dna: new DNAMode(this),
            imageJumper: new ImageJumperMode(this),
            imageBounce: new ImageBounceMode(this),
            imageRain: new ImageRainMode(this),
            imageKaleidoscope: new ImageKaleidoscopeMode(this),
            imagePulse: new ImagePulseMode(this),
            imageOrbit: new ImageOrbitMode(this)
        };
    }
    setMode(modeName) {
        if (this.modes && this.modes[modeName] && this.currentMode.id !== modeName) {
            if (this.currentMode.cleanup) this.currentMode.cleanup();
            this.currentMode = this.modes[modeName];
            if (modeName === 'threeD') {
                this.canvas.style.display = 'none';
                this.threeJsContainer.style.display = 'block';
                this.previewCanvas.style.display = 'none';
                this.threeJsPreviewContainer.style.display = 'block';
            } else {
                this.canvas.style.display = 'block';
                this.threeJsContainer.style.display = 'none';
                this.previewCanvas.style.display = 'block';
                this.threeJsPreviewContainer.style.display = 'none';
            }
            if (this.currentMode.init) this.currentMode.init();
            this.resize();
        }
    }
    beginFullscreenCapture(canvas) {
        this.isCapturing = true;
        this.captureCanvas = canvas;
        if (this.currentMode.id === 'threeD') {
            this.offscreenThreeRenderer = new THREE.WebGLRenderer({ canvas: this.captureCanvas, antialias: true, alpha: true });
            this.offscreenThreeRenderer.setSize(canvas.width, canvas.height);
            this.offscreenThreeRenderer.setClearColor(0x000000, 0);
        }
    }
    endFullscreenCapture() {
        this.isCapturing = false;
        this.captureCanvas = null;
        if (this.offscreenThreeRenderer) {
            this.offscreenThreeRenderer.dispose();
            this.offscreenThreeRenderer = null;
        }
    }
    draw() {
        if (!this.audioManager || !this.currentMode) return;
        const { frequencyData, timeDomainData, beatEffect } = this.audioManager;
        this.currentMode.draw(frequencyData, timeDomainData, beatEffect);
        if (this.isCapturing) {
            if (this.currentMode.id === 'threeD') {
                const originalAspect = this.currentMode.camera.aspect;
                this.currentMode.camera.aspect = this.captureCanvas.width / this.captureCanvas.height;
                this.currentMode.camera.updateProjectionMatrix();
                this.offscreenThreeRenderer.render(this.currentMode.scene, this.currentMode.camera);
                this.currentMode.camera.aspect = originalAspect;
                this.currentMode.camera.updateProjectionMatrix();
            } else {
                this.currentMode.renderOn(this.captureCanvas, this.captureCanvas.getContext('2d'), frequencyData, timeDomainData, beatEffect);
            }
        }
    }
    resize() {
        const container = document.getElementById('visualizer-container');
        if (!container) return;
        const { width, height } = container.getBoundingClientRect();
        this.canvas.width = width;
        this.canvas.height = height;
        const previewContainer = document.getElementById('preview-container');
        if (previewContainer) {
            const { width: pWidth, height: pHeight } = previewContainer.getBoundingClientRect();
            this.previewCanvas.width = pWidth;
            this.previewCanvas.height = pHeight;
        }
        if (this.currentMode && this.currentMode.onResize) this.currentMode.onResize(width, height);
    }
    blendColors(color1, color2, factor) {
        const c1 = parseInt(color1.slice(1), 16);
        const r1 = (c1 >> 16) & 255, g1 = (c1 >> 8) & 255, b1 = c1 & 255;
        const c2 = parseInt(color2.slice(1), 16);
        const r2 = (c2 >> 16) & 255, g2 = (c2 >> 8) & 255, b2 = c2 & 255;
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);
        return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    }
}

class Mode {
    constructor(renderer, id) {
        this.renderer = renderer;
        this.id = id;
        this.settings = {};
        this.initialized = false;
    }
    init() { this.initialized = true; }
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {}
    draw(frequencyData, timeDomainData, beatEffect) {
        this.renderOn(this.renderer.canvas, this.renderer.ctx, frequencyData, timeDomainData, beatEffect);
        this.renderOn(this.renderer.previewCanvas, this.renderer.previewCtx, frequencyData, timeDomainData, beatEffect);
    }
    updateSetting(key, value) { if (this.settings.hasOwnProperty(key)) this.settings[key] = value; }
    onResize(width, height) { this.init(); }
    cleanup() { this.initialized = false; }
}

class CircularMode extends Mode {
    constructor(renderer) {
        super(renderer, 'circular');
        this.settings = { barCount: 256, radius: 100, lineWidth: 3, lineColor: '#00ffff' };
        this.shockWaveSize = 0;
    }
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const middleX = canvas.width / 2;
        const middleY = canvas.height / 2;
        const blendedLineColor = this.renderer.blendColors(this.settings.lineColor, this.renderer.beatColor, beatEffect);
        const barCount = this.settings.barCount;
        const usableFreqData = frequencyData.slice(0, Math.min(frequencyData.length, 375));
        const freqStep = usableFreqData.length / barCount;
        const scaledRadius = this.settings.radius * (Math.min(canvas.width, canvas.height) / 500);
        ctx.strokeStyle = blendedLineColor;
        ctx.lineWidth = this.settings.lineWidth * (1 + beatEffect * 0.3);
        ctx.shadowBlur = 10 + beatEffect * 20;
        ctx.shadowColor = blendedLineColor;
        for (let i = 0; i < barCount; i++) {
            const freqIndex = Math.floor(i * freqStep);
            const amplitude = usableFreqData[freqIndex] || 0;
            const barHeight = amplitude * (Math.min(canvas.width, canvas.height) / 2.3 / 255) * (1 + beatEffect * 0.6);
            const angle = (i / barCount) * Math.PI * 2;
            this.drawBar(ctx, middleX, middleY, angle, scaledRadius, barHeight);
        }
        if (beatEffect > 0.1 && canvas === this.renderer.canvas) {
            this.shockWaveSize = beatEffect * 80;
        } else if (canvas === this.renderer.canvas) {
            this.shockWaveSize *= 0.9;
        }
        if (this.shockWaveSize > 1) {
            ctx.lineWidth = 5;
            ctx.strokeStyle = this.renderer.blendColors(this.settings.lineColor, this.renderer.beatColor, beatEffect * 0.7);
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(middleX, middleY, scaledRadius + this.shockWaveSize, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }
    drawBar(ctx, cx, cy, angle, radius, height) {
        const startX = cx + radius * Math.cos(angle);
        const startY = cy + radius * Math.sin(angle);
        const endX = cx + (radius + height) * Math.cos(angle);
        const endY = cy + (radius + height) * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
}

class LinearMode extends Mode {
    constructor(renderer) {
        super(renderer, 'linear');
        this.settings = { barCount: 256, barHeight: 2, barSpacing: 1, barColor: '#00ff88' };
    }
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const { width, height } = canvas;
        const blendedColor = this.renderer.blendColors(this.settings.barColor, this.renderer.beatColor, beatEffect);
        const numBars = this.settings.barCount;
        const usableFreqData = frequencyData.slice(0, Math.min(frequencyData.length, 400));
        const freqStep = usableFreqData.length / numBars;
        const totalBarWidth = (width / numBars);
        const barWidth = Math.max(1, totalBarWidth - this.settings.barSpacing);
        ctx.shadowBlur = 10 + beatEffect * 15;
        ctx.shadowColor = blendedColor;
        for (let i = 0; i < numBars; i++) {
            const freqIndex = Math.floor(i * freqStep);
            const amplitude = usableFreqData[freqIndex] || 0;
            const barActualHeight = Math.max(this.settings.barHeight, amplitude * (height / 255) * 0.95 * (1 + beatEffect * 0.5));
            const y = height - barActualHeight;
            const gradient = ctx.createLinearGradient(0, y, 0, height);
            gradient.addColorStop(0, blendedColor);
            gradient.addColorStop(1, this.renderer.blendColors(blendedColor, '#000000', 0.5));
            ctx.fillStyle = gradient;
            const x = i * totalBarWidth;
            ctx.fillRect(x, y, barWidth, barActualHeight);
        }
        ctx.shadowBlur = 0;
    }
}

class ReflectedMode extends Mode {
    constructor(renderer) {
        super(renderer, 'reflected');
        this.settings = { barCount: 256, barHeight: 2, barSpacing: 1, barColor: '#ff6600' };
    }
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const { width, height } = canvas;
        const middleY = height / 2;
        const blendedColor = this.renderer.blendColors(this.settings.barColor, this.renderer.beatColor, beatEffect);
        const numBars = this.settings.barCount;
        const usableFreqData = frequencyData.slice(0, Math.min(frequencyData.length, 400));
        const freqStep = usableFreqData.length / numBars;
        const totalBarWidth = (width / numBars);
        const barWidth = Math.max(1, totalBarWidth - this.settings.barSpacing);
        ctx.shadowBlur = 8 + beatEffect * 12;
        ctx.shadowColor = blendedColor;
        for (let i = 0; i < numBars; i++) {
            const freqIndex = Math.floor(i * freqStep);
            const amplitude = usableFreqData[freqIndex] || 0;
            const barActualHeight = Math.max(this.settings.barHeight, amplitude * (height / 2 / 255) * 0.98 * (1 + beatEffect * 0.5));
            const gradient = ctx.createLinearGradient(0, middleY - barActualHeight, 0, middleY + barActualHeight);
            gradient.addColorStop(0, this.renderer.blendColors(blendedColor, '#000000', 0.3));
            gradient.addColorStop(0.5, blendedColor);
            gradient.addColorStop(1, this.renderer.blendColors(blendedColor, '#000000', 0.3));
            ctx.fillStyle = gradient;
            const x = i * totalBarWidth;
            ctx.fillRect(x, middleY - barActualHeight, barWidth, barActualHeight);
            ctx.fillRect(x, middleY, barWidth, barActualHeight);
        }
        ctx.shadowBlur = 0;
    }
}

class FlowerMode extends Mode {
    constructor(renderer) {
        super(renderer, 'flower');
        this.settings = { petalCount: 16, radius: 80, lineWidth: 2, petalColor: '#ff80ff' };
    }
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const middleX = canvas.width / 2;
        const middleY = canvas.height / 2;
        const blendedColor = this.renderer.blendColors(this.settings.petalColor, this.renderer.beatColor, beatEffect);
        const petalCount = this.settings.petalCount;
        const usableFreqData = frequencyData.slice(0, Math.min(frequencyData.length, 370));
        const freqStep = usableFreqData.length / petalCount;
        const scaledRadius = this.settings.radius * (Math.min(canvas.width, canvas.height) / 500);
        ctx.strokeStyle = blendedColor;
        ctx.fillStyle = blendedColor + '40';
        ctx.lineWidth = this.settings.lineWidth * (1 + beatEffect * 0.5);
        ctx.shadowBlur = 12 + beatEffect * 18;
        ctx.shadowColor = blendedColor;
        for (let i = 0; i < petalCount; i++) {
            const freqIndex = Math.floor(i * freqStep);
            const amplitude = usableFreqData[freqIndex] || 0;
            const petalLength = (20 + amplitude * 0.8) * (Math.min(canvas.width, canvas.height) / 500) * (1 + beatEffect * 0.6);
            const angle = (i / petalCount) * Math.PI * 2;
            this.drawPetal(ctx, middleX, middleY, angle, scaledRadius, petalLength);
        }
        ctx.shadowBlur = 0;
    }
    drawPetal(ctx, cx, cy, angle, radius, length) {
        const startX = cx + radius * Math.cos(angle);
        const startY = cy + radius * Math.sin(angle);
        const cp1X = cx + (radius + length * 0.5) * Math.cos(angle - 0.2);
        const cp1Y = cy + (radius + length * 0.5) * Math.sin(angle - 0.2);
        const cp2X = cx + (radius + length * 0.5) * Math.cos(angle + 0.2);
        const cp2Y = cy + (radius + length * 0.5) * Math.sin(angle + 0.2);
        const endX = cx + (radius + length) * Math.cos(angle);
        const endY = cy + (radius + length) * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cp1X, cp1Y, endX, endY);
        ctx.quadraticCurveTo(cp2X, cp2Y, startX, startY);
        ctx.fill();
        ctx.stroke();
    }
}

class ParticleMode extends Mode {
    constructor(renderer) {
        super(renderer, 'particle');
        this.particles = [];
        this.maxParticles = 200;
        this.settings = { speed: 2, color: '#ffffff' };
    }
    init() {
        this.particles = [];
        for(let i=0; i<this.maxParticles; i++) {
            this.particles.push(this.createParticle());
        }
    }
    createParticle() {
        return {
            x: Math.random() * this.renderer.canvas.width,
            y: Math.random() * this.renderer.canvas.height,
            size: Math.random() * 3 + 1,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: Math.random()
        };
    }
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const blendedColor = this.renderer.blendColors(this.settings.color, this.renderer.beatColor, beatEffect);
        ctx.fillStyle = blendedColor;
        
        const bass = frequencyData.slice(0, 10).reduce((a,b)=>a+b,0) / 10;
        const speedMult = 1 + (bass / 255) * 5 * beatEffect;

        this.particles.forEach(p => {
            p.x += p.vx * speedMult;
            p.y += p.vy * speedMult;
            p.life -= 0.01;

            if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height || p.life <= 0) {
                Object.assign(p, this.createParticle());
                p.x = canvas.width / 2;
                p.y = canvas.height / 2;
            }

            const size = p.size * (1 + beatEffect);
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI*2);
            ctx.fill();
        });
    }
}

class WaveformMode extends Mode {
    constructor(renderer) {
        super(renderer, 'waveform');
        this.settings = { color: '#00ff00', lineWidth: 2 };
    }
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = this.settings.lineWidth * (1 + beatEffect);
        ctx.strokeStyle = this.renderer.blendColors(this.settings.color, this.renderer.beatColor, beatEffect);
        ctx.shadowBlur = 4;
        ctx.shadowColor = ctx.strokeStyle;
        
        ctx.beginPath();
        const sliceWidth = canvas.width * 1.0 / timeDomainData.length;
        let x = 0;
        for(let i = 0; i < timeDomainData.length; i++) {
            const v = timeDomainData[i] / 128.0;
            const y = v * canvas.height / 2;
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
        }
        ctx.lineTo(canvas.width, canvas.height/2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

class GalaxyMode extends Mode {
    constructor(renderer) {
        super(renderer, 'galaxy');
        this.angle = 0;
    }
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0,0,canvas.width, canvas.height);
        const cx = canvas.width/2;
        const cy = canvas.height/2;
        this.angle += 0.01 + beatEffect * 0.05;
        
        const arms = 5;
        const particlesPerArm = 50;
        const maxRadius = Math.min(canvas.width, canvas.height) * 0.45;

        for(let i=0; i<arms; i++) {
            const armAngle = (i/arms) * Math.PI * 2;
            for(let j=0; j<particlesPerArm; j++) {
                const dist = (j/particlesPerArm) * maxRadius;
                const freqIdx = Math.floor((j/particlesPerArm) * frequencyData.length * 0.5);
                const amp = frequencyData[freqIdx];
                const theta = this.angle + armAngle + (dist * 0.02);
                
                const x = cx + Math.cos(theta) * dist;
                const y = cy + Math.sin(theta) * dist;
                
                const size = (amp/255) * 4 * (1+beatEffect) + 1;
                ctx.fillStyle = `hsl(${(i * 60) + amp}, 100%, 50%)`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }
}

class ThreeDMode extends Mode {
    constructor(renderer) {
        super(renderer, 'threeD');
        this.scene = null;
        this.camera = null;
        this.renderer3D = null;
        this.bars = [];
        this.group = null;
    }
    init() {
        const container = this.renderer.threeJsContainer;
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
        this.camera.position.z = 50;
        this.camera.position.y = 20;
        this.camera.lookAt(0,0,0);

        this.renderer3D = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer3D.setSize(width, height);
        this.renderer3D.setClearColor(0x000000, 0);
        
        container.innerHTML = '';
        container.appendChild(this.renderer3D.domElement);

        const previewContainer = this.renderer.threeJsPreviewContainer;
        if (previewContainer) {
            this.previewRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            this.previewRenderer.setSize(previewContainer.clientWidth, previewContainer.clientHeight);
            this.previewRenderer.setClearColor(0x000000, 0);
            previewContainer.innerHTML = '';
            previewContainer.appendChild(this.previewRenderer.domElement);
        }

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00, specular: 0xffffff });
        
        this.group = new THREE.Group();
        this.bars = [];
        const gridSize = 16;
        for(let x=0; x<gridSize; x++) {
            for(let z=0; z<gridSize; z++) {
                const bar = new THREE.Mesh(geometry, material.clone());
                bar.position.set(x - gridSize/2, 0, z - gridSize/2);
                this.group.add(bar);
                this.bars.push(bar);
            }
        }
        this.scene.add(this.group);

        const light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(10, 20, 10);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0x404040));
    }

    draw(frequencyData, timeDomainData, beatEffect) {
        if(!this.scene || !this.bars.length) return;
        
        this.group.rotation.y += 0.005 + beatEffect * 0.01;
        
        let fdIndex = 0;
        for(let i=0; i<this.bars.length; i++) {
            const val = frequencyData[fdIndex % 128];
            const scaleY = Math.max(0.1, (val / 10) * (1 + beatEffect));
            this.bars[i].scale.y = scaleY;
            this.bars[i].position.y = scaleY / 2;
            this.bars[i].material.color.setHSL(val/255, 1, 0.5);
            fdIndex++;
        }
        
        this.renderer3D.render(this.scene, this.camera);
        if (this.previewRenderer) {
             this.previewRenderer.render(this.scene, this.camera);
        }
    }
    onResize(width, height) {
        if(this.camera && this.renderer3D) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer3D.setSize(width, height);
            
            const pCont = this.renderer.threeJsPreviewContainer;
            if(pCont && this.previewRenderer) {
                this.previewRenderer.setSize(pCont.clientWidth, pCont.clientHeight);
            }
        }
    }
    cleanup() {
        const container = this.renderer.threeJsContainer;
        container.innerHTML = '';
        const pCont = this.renderer.threeJsPreviewContainer;
        if(pCont) pCont.innerHTML = '';
        this.renderer3D = null;
        this.previewRenderer = null;
    }
}

class RadialMode extends Mode {
    constructor(renderer) {
        super(renderer, 'radial');
    }
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width/2;
        const cy = canvas.height/2;
        const radius = Math.min(cx, cy) - 20;
        const bars = 180;
        const step = (Math.PI * 2) / bars;
        
        for(let i=0; i<bars; i++) {
            const val = frequencyData[i] || 0;
            const barLen = (val / 255) * radius * (0.5 + beatEffect * 0.5);
            const angle = i * step;
            
            ctx.strokeStyle = `hsl(${i * 2}, 100%, 50%)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * barLen, cy + Math.sin(angle) * barLen);
            ctx.stroke();
        }
    }
}

class DNAMode extends Mode {
    constructor(renderer) {
        super(renderer, 'dna');
        this.offset = 0;
    }
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0,0,canvas.width, canvas.height);
        this.offset += 0.05 + beatEffect * 0.1;
        
        const points = 50;
        const spacing = canvas.width / points;
        const amp = canvas.height / 4;
        const cy = canvas.height / 2;
        
        for(let i=0; i<points; i++) {
            const freq = frequencyData[i*2] / 255;
            const y1 = cy + Math.sin(i * 0.5 + this.offset) * amp * (0.5 + freq);
            const y2 = cy + Math.sin(i * 0.5 + this.offset + Math.PI) * amp * (0.5 + freq);
            const x = i * spacing;
            
            ctx.strokeStyle = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(x, y1);
            ctx.lineTo(x, y2);
            ctx.stroke();
            
            ctx.fillStyle = '#ff00ff';
            ctx.beginPath();
            ctx.arc(x, y1, 5 + freq * 10, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(x, y2, 5 + freq * 10, 0, Math.PI*2);
            ctx.fill();
        }
    }
}

class ImageJumperMode extends Mode {
    constructor(renderer) {
        super(renderer, 'imageJumper');
    }
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const img = this.renderer.customImage;
        if(!img) {
            ctx.fillStyle = 'white';
            ctx.fillText("No Image Loaded", canvas.width/2 - 40, canvas.height/2);
            return;
        }
        
        const bass = frequencyData[5]; 
        const jump = (bass / 255) * canvas.height * 0.5;
        const w = 200 * (1 + beatEffect * 0.2);
        const h = 200 * (1 + beatEffect * 0.2);
        const x = (canvas.width - w) / 2;
        const y = canvas.height - h - jump;
        
        ctx.drawImage(img, x, y, w, h);
    }
}

class ImageBounceMode extends Mode {
    constructor(renderer) {
        super(renderer, 'imageBounce');
        this.x = 0;
        this.y = 0;
        this.vx = 5;
        this.vy = 5;
    }
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0,0,canvas.width, canvas.height);
        const img = this.renderer.customImage;
        if(!img) return;

        const size = 100 * (1 + beatEffect * 0.5);
        this.x += this.vx * (1 + beatEffect);
        this.y += this.vy * (1 + beatEffect);

        if(this.x <= 0 || this.x + size >= canvas.width) this.vx *= -1;
        if(this.y <= 0 || this.y + size >= canvas.height) this.vy *= -1;

        ctx.drawImage(img, this.x, this.y, size, size);
    }
}

class ImageRainMode extends Mode {
    constructor(renderer) {
        super(renderer, 'imageRain');
        this.drops = [];
    }
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0,0,canvas.width, canvas.height);
        const img = this.renderer.customImage;
        if(!img) return;

        if(Math.random() < 0.2 + beatEffect) {
            this.drops.push({
                x: Math.random() * canvas.width,
                y: -50,
                speed: 5 + Math.random() * 10
            });
        }

        for(let i=this.drops.length-1; i>=0; i--) {
            const d = this.drops[i];
            d.y += d.speed;
            const size = 50;
            ctx.drawImage(img, d.x, d.y, size, size);
            if(d.y > canvas.height) this.drops.splice(i, 1);
        }
    }
}

class ImageKaleidoscopeMode extends Mode {
    constructor(renderer) {
        super(renderer, 'imageKaleidoscope');
        this.angle = 0;
    }
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        const img = this.renderer.customImage;
        if(!img) return;
        
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0,0,canvas.width, canvas.height);
        
        const cx = canvas.width/2;
        const cy = canvas.height/2;
        this.angle += 0.01 + beatEffect * 0.05;
        const slices = 8;
        const radius = Math.min(cx, cy);

        for(let i=0; i<slices; i++) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(this.angle + (i * Math.PI * 2 / slices));
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.arc(0, 0, radius, -0.2, 0.2);
            ctx.clip();
            ctx.drawImage(img, -100, -100, 200 + beatEffect*100, 200 + beatEffect*100);
            ctx.restore();
        }
    }
}

class ImagePulseMode extends Mode {
    constructor(renderer) {
        super(renderer, 'imagePulse');
    }
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        const img = this.renderer.customImage;
        if(!img) return;

        const cols = 5;
        const rows = 5;
        const w = canvas.width / cols;
        const h = canvas.height / rows;

        for(let i=0; i<cols; i++) {
            for(let j=0; j<rows; j++) {
                const idx = (i + j) % 32;
                const scale = (frequencyData[idx] / 255);
                const dw = w * scale;
                const dh = h * scale;
                const dx = i * w + (w - dw)/2;
                const dy = j * h + (h - dh)/2;
                ctx.drawImage(img, dx, dy, dw, dh);
            }
        }
    }
}

class ImageOrbitMode extends Mode {
    constructor(renderer) {
        super(renderer, 'imageOrbit');
        this.angle = 0;
    }
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0,0,canvas.width, canvas.height);
        const img = this.renderer.customImage;
        if(!img) return;

        this.angle += 0.02 + beatEffect * 0.05;
        const cx = canvas.width/2;
        const cy = canvas.height/2;
        const count = 8;
        const radius = 150 + beatEffect * 50;

        for(let i=0; i<count; i++) {
            const theta = this.angle + (i/count) * Math.PI * 2;
            const x = cx + Math.cos(theta) * radius;
            const y = cy + Math.sin(theta) * radius;
            const size = 40 + (frequencyData[i*4]/255) * 40;
            ctx.drawImage(img, x - size/2, y - size/2, size, size);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const authManager = new AuthManager();
    const audioManager = new AudioManager();
    const renderer = new Renderer(audioManager);
    
    let animationFrameId;
    let mediaRecorder;
    let recordedChunks = [];

    const overlay = document.getElementById('login-overlay');
    const accessKeyInput = document.getElementById('accessKey');
    const loginButton = document.getElementById('loginButton');
    const errorMsg = document.getElementById('errorMessage');
    const adminPanel = document.getElementById('adminPanel');
    const mainContent = document.getElementById('main-content');
    const currentKeyDisplay = document.getElementById('currentKeyDisplay');

    function checkLogin(key) {
        if(!key) {
             const savedSession = authManager.verifySession();
             if(savedSession) {
                 const sess = authManager.getSession();
                 proceedToApp(sess);
             }
             return;
        }
        const result = authManager.login(key);
        if(result.valid) {
            proceedToApp(result.session);
        } else {
            errorMsg.textContent = result.message;
            errorMsg.style.display = 'block';
        }
    }

    function proceedToApp(session) {
        overlay.style.display = 'none';
        mainContent.style.display = 'flex';
        currentKeyDisplay.textContent = session.key;
        renderer.resize();
        
        if(session.isAdmin) {
             adminPanel.style.display = 'block';
        }
        startLoop();
    }

    loginButton.addEventListener('click', () => checkLogin(accessKeyInput.value));
    accessKeyInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') checkLogin(accessKeyInput.value);
    });

    document.getElementById('logoutButton').addEventListener('click', () => {
        authManager.logout();
    });

    if(authManager.verifySession()) {
        proceedToApp(authManager.getSession());
    }

    document.getElementById('generateMoreKeys')?.addEventListener('click', () => {
        authManager.generateMoreKeys(10);
    });

    document.getElementById('deactivateKey')?.addEventListener('click', () => {
        const key = document.getElementById('keyToDeactivate').value;
        if(key && authManager.deactivateKey(key)) {
            alert('Key deactivated');
            document.getElementById('keyToDeactivate').value = '';
        } else {
            alert('Key not found');
        }
    });

    document.getElementById('exportKeys')?.addEventListener('click', () => {
        const keys = sessionStorage.getItem(authManager.STORAGE_KEY);
        const blob = new Blob([keys], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'avpro_keys_export.json';
        a.click();
    });

    document.getElementById('play-button').addEventListener('click', () => {
        if(audioManager.audioElement && audioManager.audioElement.paused) {
            audioManager.audioElement.play();
            document.getElementById('overlay').classList.add('hidden');
        } else if(audioManager.audioElement) {
            audioManager.audioElement.pause();
            document.getElementById('overlay').classList.remove('hidden');
        }
    });

    document.getElementById('addFileButton').addEventListener('click', () => document.getElementById('audioFileInput').click());
    document.getElementById('audioFileInput').addEventListener('change', (e) => {
        if(e.target.files.length > 0) {
            audioManager.loadFile(e.target.files[0]);
            document.getElementById('overlay').classList.add('hidden');
        }
    });

    document.getElementById('micButton').addEventListener('click', async () => {
        await audioManager.loadMicrophone();
        document.getElementById('overlay').classList.add('hidden');
    });

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    const imageModes = ['imageJumper', 'imageBounce', 'imageRain', 'imageKaleidoscope', 'imagePulse', 'imageOrbit'];
    document.getElementById('mode-selector').addEventListener('change', (e) => {
        if(imageModes.includes(e.target.value) && !renderer.customImage) {
            if(confirm("This mode requires an image. Load one now?")) {
                fileInput.click();
            }
        }
        renderer.setMode(e.target.value);
    });
    
    fileInput.addEventListener('change', (e) => {
        if(e.target.files.length) {
            const img = new Image();
            img.src = URL.createObjectURL(e.target.files[0]);
            img.onload = () => { renderer.customImage = img; };
        }
    });

    document.getElementById('fullscreenButton').addEventListener('click', () => {
        const elem = document.getElementById('visualizer-container');
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    document.getElementById('recordButton').addEventListener('click', function() {
        const btn = this;
        if(btn.textContent === 'Record') {
            const stream = renderer.canvas.captureStream(30);
            if(renderer.currentMode.id === 'threeD') {
               alert("Recording not fully supported in 3D mode via canvas stream.");
               return;
            }
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
            recordedChunks = [];
            mediaRecorder.ondataavailable = e => { if(e.data.size > 0) recordedChunks.push(e.data); };
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.getElementById('downloadLink');
                a.href = url;
                a.style.display = 'inline-block';
            };
            mediaRecorder.start();
            btn.textContent = 'Stop Recording';
            btn.classList.add('stop-recording');
        } else {
            mediaRecorder.stop();
            btn.textContent = 'Record';
            btn.classList.remove('stop-recording');
        }
    });

    document.getElementById('beatThresholdSlider').addEventListener('input', (e) => {
        audioManager.beatThreshold = parseInt(e.target.value);
        document.getElementById('beatThresholdValue').textContent = e.target.value;
    });

    document.getElementById('beatColorPicker').addEventListener('input', (e) => {
        renderer.beatColor = e.target.value;
    });

    function startLoop() {
        function loop() {
            audioManager.update();
            renderer.draw();
            animationFrameId = requestAnimationFrame(loop);
        }
        if(animationFrameId) cancelAnimationFrame(animationFrameId);
        loop();
    }
});
