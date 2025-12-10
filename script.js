// ==================== AUTHENTICATION SYSTEM ====================
class AuthManager {
    constructor() {
        // Storage keys
        this.STORAGE_KEY = 'audio_visualizer_keys';
        this.GENERATED_KEYS_KEY = 'audio_visualizer_generated_keys';
        this.SESSION_KEY = 'audio_visualizer_session';
        
        // Special admin key (case-insensitive check)
        this.ADMIN_KEY = 'AVPRO-ADMIN-2024-MASTER';
        
        // Initialize
        this.validKeys = this.initializeKeys();
        this.displayKeys();
    }
    
    initializeKeys() {
        // Check if we already generated keys
        let storedKeys = localStorage.getItem(this.GENERATED_KEYS_KEY);
        
        if (!storedKeys) {
            // Generate 20 unique keys for the first time
            const newKeys = this.generateNewKeys(20);
            // Add admin key to the list
            newKeys.push(this.ADMIN_KEY);
            localStorage.setItem(this.GENERATED_KEYS_KEY, JSON.stringify(newKeys));
            storedKeys = JSON.stringify(newKeys);
            
            // Initialize key usage data
            const keyData = {};
            newKeys.forEach(key => {
                keyData[key] = {
                    created: new Date().toISOString(),
                    lastUsed: null,
                    activeSession: null,
                    usageCount: 0,
                    isActive: true,
                    isAdmin: key === this.ADMIN_KEY
                };
            });
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keyData));
        }
        
        const keys = JSON.parse(storedKeys);
        
        // Ensure we have key data for each key
        let keyData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        let needsUpdate = false;
        
        keys.forEach(key => {
            if (!keyData[key]) {
                keyData[key] = {
                    created: new Date().toISOString(),
                    lastUsed: null,
                    activeSession: null,
                    usageCount: 0,
                    isActive: true,
                    isAdmin: key === this.ADMIN_KEY
                };
                needsUpdate = true;
            }
        });
        
        if (needsUpdate) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keyData));
        }
        
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
        
        const keyData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        const keys = JSON.parse(localStorage.getItem(this.GENERATED_KEYS_KEY) || '[]');
        
        keyList.innerHTML = '';
        
        if (keys.length === 0) {
            keyList.innerHTML = '<div style="color: #999; text-align: center;">No keys generated yet. Refresh the page.</div>';
            return;
        }
        
        keys.forEach(key => {
            if (key === this.ADMIN_KEY) return; // Don't show admin key in list
            
            const keyInfo = keyData[key] || {};
            const div = document.createElement('div');
            div.className = 'key-item';
            div.innerHTML = `
                <div style="margin-bottom: 3px;">
                    <strong style="color: #fff;">${key}</strong>
                </div>
                <div style="font-size: 11px; color: #aaa;">
                    Created: ${new Date(keyInfo.created).toLocaleDateString()} |
                    Used: ${keyInfo.usageCount || 0} times
                    ${keyInfo.activeSession ? '<span style="color: #ffcc00;"> | IN USE</span>' : ''}
                </div>
            `;
            
            // Add click to copy functionality
            div.style.cursor = 'pointer';
            div.style.padding = '8px';
            div.style.borderRadius = '4px';
            div.style.marginBottom = '5px';
            div.style.transition = 'background 0.2s';
            
            div.addEventListener('mouseenter', () => {
                div.style.background = 'rgba(255, 255, 255, 0.1)';
            });
            div.addEventListener('mouseleave', () => {
                div.style.background = 'transparent';
            });
            
            div.addEventListener('click', () => {
                navigator.clipboard.writeText(key).then(() => {
                    const originalHTML = div.innerHTML;
                    div.innerHTML = '<span style="color: #33cc33;">✓ Copied to clipboard!</span>';
                    setTimeout(() => {
                        div.innerHTML = originalHTML;
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy key:', err);
                    // Fallback for browsers that don't support clipboard API
                    const textArea = document.createElement('textarea');
                    textArea.value = key;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    const originalHTML = div.innerHTML;
                    div.innerHTML = '<span style="color: #33cc33;">✓ Copied!</span>';
                    setTimeout(() => {
                        div.innerHTML = originalHTML;
                    }, 2000);
                });
            });
            
            keyList.appendChild(div);
        });
        
        // Add copy all button at the bottom (only for admin)
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
        // Create a simple browser fingerprint
        const components = [
            navigator.userAgent,
            navigator.language,
            navigator.hardwareConcurrency,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset()
        ];
        
        // Create hash from components
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
        
        // Check if key is valid
        if (!this.validKeys.includes(key)) {
            return { valid: false, message: "Invalid access key" };
        }
        
        const keyData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        const keyInfo = keyData[key] || {};
        
        // For GitHub Pages, we'll allow multiple sessions with same key
        // But we can still track which browser is using it
        const fingerprint = this.generateBrowserFingerprint();
        
        // Check if key is disabled
        if (keyInfo.isActive === false) {
            return { 
                valid: false, 
                message: "This key has been deactivated" 
            };
        }
        
        // Check if this is an admin key
        const isAdmin = key === this.ADMIN_KEY || keyInfo.isAdmin === true;
        
        return { valid: true, fingerprint, keyInfo, isAdmin };
    }
    
    login(key) {
        const validation = this.validateKey(key);
        
        if (!validation.valid) {
            return validation;
        }
        
        // Update key data
        const keyData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        keyData[key] = {
            created: keyData[key]?.created || new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            activeSession: validation.fingerprint,
            usageCount: (keyData[key]?.usageCount || 0) + 1,
            isActive: true,
            isAdmin: validation.isAdmin
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keyData));
        
        // Create session
        const session = {
            key: key,
            fingerprint: validation.fingerprint,
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            isAdmin: validation.isAdmin
        };
        
        // Store in both localStorage and sessionStorage for cross-checking
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        
        // Set cookie (additional verification)
        this.setCookie('visualizer_session', JSON.stringify(session), 7);
        
        this.displayKeys();
        return { valid: true, session };
    }
    
    logout() {
        const session = this.getSession();
        if (session && session.key) {
            // Free up the key for other users (optional for GitHub Pages)
            const keyData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
            if (keyData[session.key]) {
                keyData[session.key].activeSession = null;
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keyData));
            }
        }
        
        // Clear all session data
        localStorage.removeItem(this.SESSION_KEY);
        sessionStorage.removeItem(this.SESSION_KEY);
        this.deleteCookie('visualizer_session');
        
        // Reload to show login screen
        window.location.reload();
    }
    
    getSession() {
        // Check all three storage locations
        const localSession = localStorage.getItem(this.SESSION_KEY);
        const sessionSession = sessionStorage.getItem(this.SESSION_KEY);
        const cookieSession = this.getCookie('visualizer_session');
        
        // Parse sessions
        let local = null, session = null, cookie = null;
        try {
            local = localSession ? JSON.parse(localSession) : null;
            session = sessionSession ? JSON.parse(sessionSession) : null;
            cookie = cookieSession ? JSON.parse(cookieSession) : null;
        } catch (e) {
            return null;
        }
        
        // Check if sessions match
        if (local && session && cookie) {
            const localStr = JSON.stringify(local);
            const sessionStr = JSON.stringify(session);
            const cookieStr = JSON.stringify(cookie);
            
            if (localStr === sessionStr && sessionStr === cookieStr) {
                return local;
            }
        }
        
        return null;
    }
    
    verifySession() {
        const session = this.getSession();
        if (!session) return false;
        
        // Verify key is still valid
        const validation = this.validateKey(session.key);
        if (!validation.valid) return false;
        
        // Update last activity
        session.lastActivity = new Date().toISOString();
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        
        return true;
    }
    
    // ADMIN FUNCTIONS for key management
    generateMoreKeys(count = 10) {
        const existingKeys = JSON.parse(localStorage.getItem(this.GENERATED_KEYS_KEY) || '[]');
        const newKeys = this.generateNewKeys(count);
        const allKeys = [...existingKeys, ...newKeys];
        
        localStorage.setItem(this.GENERATED_KEYS_KEY, JSON.stringify(allKeys));
        
        // Update key data
        const keyData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        newKeys.forEach(key => {
            if (!keyData[key]) {
                keyData[key] = {
                    created: new Date().toISOString(),
                    lastUsed: null,
                    activeSession: null,
                    usageCount: 0,
                    isActive: true,
                    isAdmin: false
                };
            }
        });
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keyData));
        
        this.validKeys = allKeys;
        this.displayKeys();
        
        return newKeys;
    }
    
    deactivateKey(key) {
        const keyData = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        if (keyData[key]) {
            keyData[key].isActive = false;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keyData));
            this.displayKeys();
            return true;
        }
        return false;
    }
    
    setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
    }
    
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
        }
        return null;
    }
    
    deleteCookie(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
}

// ==================== MAIN APPLICATION ====================
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
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }, 
                video: false 
            });
            this.sourceNode = this.audioContext.createMediaStreamSource(stream);
            this.isMic = true;
            this.connectSource();
        } catch (err) {
            console.error("Microphone access denied:", err);
            alert("Microphone access denied. Please allow microphone access to use this feature.");
        }
    }

    connectSource() {
        if (this.sourceNode) {
            this.sourceNode.connect(this.analyser);
            if (!this.isMic) {
                this.analyser.connect(this.audioContext.destination);
            }
        }
    }

    disconnectSource() {
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            if (this.sourceNode.mediaStream) {
                this.sourceNode.mediaStream.getTracks().forEach(track => track.stop());
            }
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

        // Beat detection
        const bass = this.frequencyData.slice(0, 32).reduce((a, b) => a + b, 0);
        if (bass - this.oldIntensity > this.beatThreshold) {
            this.beatEffect = 1;
        }
        this.oldIntensity = bass;
        this.beatEffect = Math.max(0, this.beatEffect * this.beatDecayRate);
    }
}

class UIManager {
    constructor(app) {
        this.app = app;
        this.dom = {
            playButton: document.getElementById('play-button'),
            overlay: document.getElementById('overlay'),
            addFileButton: document.getElementById('addFileButton'),
            micButton: document.getElementById('micButton'),
            recordButton: document.getElementById('recordButton'),
            downloadLink: document.getElementById('downloadLink'),
            fullscreenButton: document.getElementById('fullscreenButton'),
            logoutButton: document.getElementById('logoutButton'),
            audioFileInput: document.getElementById('audioFileInput'),
            imageFileInput: document.getElementById('imageFileInput'),
            modeSelector: document.getElementById('mode-selector'),
            modeSettings: document.getElementById('mode-settings'),
            beatThresholdSlider: document.getElementById('beatThresholdSlider'),
            beatThresholdValue: document.getElementById('beatThresholdValue'),
            beatColorPicker: document.getElementById('beatColorPicker'),
        };
        this.modeSettingsHTML = {
            circular: `<details open><summary>Circular Settings</summary><div class="control-group-grid">
                <div class="control-group"><label for="barCountSlider">Bar Count: <span id="barCountValue">256</span></label><input type="range" id="barCountSlider" min="64" max="512" value="256" step="2"></div>
                <div class="control-group"><label for="radiusSlider">Base Radius: <span id="radiusValue">100</span></label><input type="range" id="radiusSlider" min="50" max="300" value="100"></div>
                <div class="control-group"><label for="lineWidthSlider">Line Width: <span id="lineWidthValue">3</span></label><input type="range" id="lineWidthSlider" min="1" max="10" value="3"></div>
                <div class="control-group"><label for="lineColorPicker">Line Color:</label><input type="color" id="lineColorPicker" value="#00ffff"></div>
            </div></details>`,
            linear: `<details open><summary>Linear Settings</summary><div class="control-group-grid">
                <div class="control-group"><label for="barCountSlider">Bar Count: <span id="barCountValue">256</span></label><input type="range" id="barCountSlider" min="64" max="512" value="256" step="2"></div>
                <div class="control-group"><label for="barHeightSlider">Min Bar Height: <span id="barHeightValue">2</span></label><input type="range" id="barHeightSlider" min="1" max="20" value="2"></div>
                <div class="control-group"><label for="barSpacingSlider">Bar Spacing: <span id="barSpacingValue">1</span></label><input type="range" id="barSpacingSlider" min="0" max="10" value="1"></div>
                <div class="control-group"><label for="barColorPicker">Bar Color:</label><input type="color" id="barColorPicker" value="#00ff88"></div>
            </div></details>`,
            particle: `<details open><summary>Particle Settings</summary><div class="control-group-grid">
                <div class="control-group"><label for="particleCountSlider">Particle Count: <span id="particleCountValue">400</span></label><input type="range" id="particleCountSlider" min="50" max="1000" value="400"></div>
                <div class="control-group"><label for="particleSizeSlider">Particle Size: <span id="particleSizeValue">3</span></label><input type="range" id="particleSizeSlider" min="1" max="10" value="3"></div>
                <div class="control-group"><label for="particleColorPicker">Particle Color:</label><input type="color" id="particleColorPicker" value="#00ffff"></div>
            </div></details>`,
            waveform: `<details open><summary>Waveform Settings</summary><div class="control-group-grid">
                <div class="control-group"><label for="waveformThicknessSlider">Line Thickness: <span id="waveformThicknessValue">3</span></label><input type="range" id="waveformThicknessSlider" min="1" max="10" value="3"></div>
                <div class="control-group"><label for="waveformColorPicker">Waveform Color:</label><input type="color" id="waveformColorPicker" value="#00ff00"></div>
            </div></details>`,
            galaxy: `<details open><summary>Galaxy Settings</summary><div class="control-group-grid">
                <div class="control-group"><label for="particleCountSlider">Star Count: <span id="particleCountValue">600</span></label><input type="range" id="particleCountSlider" min="100" max="2000" value="600"></div>
                <div class="control-group"><label for="particleSizeSlider">Star Size: <span id="particleSizeValue">2</span></label><input type="range" id="particleSizeSlider" min="0.5" max="5" value="2" step="0.1"></div>
                <div class="control-group"><label for="rotationSpeedSlider">Rotation Speed: <span id="rotationSpeedValue">0.15</span></label><input type="range" id="rotationSpeedSlider" min="0" max="1" value="0.15" step="0.01"></div>
            </div></details>`,
            threeD: `<details open><summary>3D Settings</summary><div class="control-group-grid">
                <div class="control-group"><label for="barCountSlider">Bar Count: <span id="barCountValue">128</span></label><input type="range" id="barCountSlider" min="32" max="256" value="128" step="2"></div>
                <div class="control-group"><label for="threeDCameraZSlider">Camera Distance: <span id="threeDCameraZValue">500</span></label><input type="range" id="threeDCameraZSlider" min="100" max="1000" value="500"></div>
                <div class="control-group"><label for="threeDBarDepthSlider">Bar Depth: <span id="threeDBarDepthValue">50</span></label><input type="range" id="threeDBarDepthSlider" min="10" max="100" value="50"></div>
                <div class="control-group"><label for="threeDRotationSpeedSlider">Auto-Rotate: <span id="threeDRotationSpeedValue">1</span></label><input type="range" id="threeDRotationSpeedSlider" min="0" max="10" value="1" step="0.1"></div>
                <div class="control-group"><label for="threeDBarColorPicker">Bar Color:</label><input type="color" id="threeDBarColorPicker" value="#ff00ff"></div>
            </div></details>`,
            reflected: `<details open><summary>Reflected Settings</summary><div class="control-group-grid">
                <div class="control-group"><label for="barCountSlider">Bar Count: <span id="barCountValue">256</span></label><input type="range" id="barCountSlider" min="64" max="512" value="256" step="2"></div>
                <div class="control-group"><label for="barHeightSlider">Min Bar Height: <span id="barHeightValue">2</span></label><input type="range" id="barHeightSlider" min="1" max="20" value="2"></div>
                <div class="control-group"><label for="barSpacingSlider">Bar Spacing: <span id="barSpacingValue">1</span></label><input type="range" id="barSpacingSlider" min="0" max="10" value="1"></div>
                <div class="control-group"><label for="barColorPicker">Bar Color:</label><input type="color" id="barColorPicker" value="#ff6600"></div>
            </div></details>`,
            flower: `<details open><summary>Flower Settings</summary><div class="control-group-grid">
                <div class="control-group"><label for="petalCountSlider">Petal Count: <span id="petalCountValue">16</span></label><input type="range" id="petalCountSlider" min="4" max="48" value="16" step="2"></div>
                <div class="control-group"><label for="radiusSlider">Base Radius: <span id="radiusValue">80</span></label><input type="range" id="radiusSlider" min="20" max="200" value="80"></div>
                <div class="control-group"><label for="lineWidthSlider">Line Width: <span id="lineWidthValue">2</span></label><input type="range" id="lineWidthSlider" min="1" max="10" value="2"></div>
                <div class="control-group"><label for="petalColorPicker">Petal Color:</label><input type="color" id="petalColorPicker" value="#ff80ff"></div>
            </div></details>`,
            radial: `<details open><summary>Radial Burst Settings</summary><div class="control-group-grid">
                <div class="control-group"><label for="rayCountSlider">Ray Count: <span id="rayCountValue">360</span></label><input type="range" id="rayCountSlider" min="180" max="720" value="360" step="10"></div>
                <div class="control-group"><label for="innerRadiusSlider">Inner Radius: <span id="innerRadiusValue">30</span></label><input type="range" id="innerRadiusSlider" min="10" max="100" value="30"></div>
                <div class="control-group"><label for="radialColorPicker">Ray Color:</label><input type="color" id="radialColorPicker" value="#ffff00"></div>
            </div></details>`,
            dna: `<details open><summary>DNA Helix Settings</summary><div class="control-group-grid">
                <div class="control-group"><label for="segmentCountSlider">Segments: <span id="segmentCountValue">100</span></label><input type="range" id="segmentCountSlider" min="50" max="200" value="100"></div>
                <div class="control-group"><label for="helixRadiusSlider">Helix Radius: <span id="helixRadiusValue">80</span></label><input type="range" id="helixRadiusSlider" min="30" max="150" value="80"></div>
                <div class="control-group"><label for="dnaColorPicker">Strand Color:</label><input type="color" id="dnaColorPicker" value="#00ffaa"></div>
            </div></details>`,
            imageJumper: `<details open><summary>Image Jumper Settings</summary><div class="control-group-grid">
                <div class="control-group"><label for="imageUploadButton">Upload Image:</label><button id="imageUploadButton" class="button">Select Image</button></div>
                <div class="control-group"><label for="imageSizeSlider">Image Size: <span id="imageSizeValue">150</span></label><input type="range" id="imageSizeSlider" min="50" max="400" value="150"></div>
                <div class="control-group"><label for="jumpIntensitySlider">Jump Intensity: <span id="jumpIntensityValue">80</span></label><input type="range" id="jumpIntensitySlider" min="10" max="200" value="80"></div>
                <div class="control-group"><label for="rotationSpeedSlider">Rotation Speed: <span id="rotationSpeedValue">0.5</span></label><input type="range" id="rotationSpeedSlider" min="0" max="2" value="0.5" step="0.1"></div>
            </div></details>`,
            imageScreensaver: `<details open><summary>Image Screensaver Settings</summary><div class="control-group-grid">
                <div class="control-group"><label for="imageUploadButton2">Upload Image:</label><button id="imageUploadButton2" class="button">Select Image</button></div>
                <div class="control-group"><label for="imageSizeSlider2">Image Size: <span id="imageSizeValue2">100</span></label><input type="range" id="imageSizeSlider2" min="30" max="300" value="100"></div>
                <div class="control-group"><label for="moveSpeedSlider">Move Speed: <span id="moveSpeedValue">3</span></label><input type="range" id="moveSpeedSlider" min="1" max="10" value="3" step="0.5"></div>
                <div class="control-group"><label for="rotationOnBeatSlider">Rotation On Beat: <span id="rotationOnBeatValue">45</span></label><input type="range" id="rotationOnBeatSlider" min="0" max="180" value="45"></div>
                <div class="control-group"><label for="trailEffectCheckbox">Trail Effect:</label><input type="checkbox" id="trailEffectCheckbox" checked></div>
            </div></details>`,
            imageDancer: `<details open><summary>Image Dancer Settings</summary><div class="control-group-grid">
                <div class="control-group"><label for="imageUploadButton3">Upload Image:</label><button id="imageUploadButton3" class="button">Select Image</button></div>
                <div class="control-group"><label for="dancerImageSizeSlider">Image Size: <span id="dancerImageSizeValue">120</span></label><input type="range" id="dancerImageSizeSlider" min="40" max="300" value="120"></div>
                <div class="control-group"><label for="dancerCountSlider">Dancer Count: <span id="dancerCountValue">8</span></label><input type="range" id="dancerCountSlider" min="1" max="20" value="8"></div>
                <div class="control-group"><label for="dancerSpreadSlider">Spread Amount: <span id="dancerSpreadValue">200</span></label><input type="range" id="dancerSpreadSlider" min="50" max="500" value="200"></div>
                <div class="control-group"><label for="dancerWaveSlider">Wave Intensity: <span id="dancerWaveValue">0.5</span></label><input type="range" id="dancerWaveSlider" min="0.1" max="2" value="0.5" step="0.1"></div>
            </div></details>`
        };
        this.bindEvents();
        this.updateModeSettings('circular');
    }

    bindEvents() {
        this.dom.playButton.addEventListener('click', () => this.app.start());
        this.dom.addFileButton.addEventListener('click', () => this.dom.audioFileInput.click());
        this.dom.audioFileInput.addEventListener('change', e => this.app.loadFile(e.target.files[0]));
        this.dom.micButton.addEventListener('click', () => this.app.useMicrophone());
        this.dom.recordButton.addEventListener('click', () => this.app.toggleRecording());
        this.dom.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
        this.dom.logoutButton.addEventListener('click', () => this.app.authManager.logout());
        this.dom.modeSelector.addEventListener('change', e => this.app.setMode(e.target.value));
        this.dom.beatThresholdSlider.addEventListener('input', e => {
            this.app.audioManager.beatThreshold = parseInt(e.target.value);
            this.dom.beatThresholdValue.textContent = e.target.value;
        });
        this.dom.beatColorPicker.addEventListener('input', e => {
            this.app.renderer.beatColor = e.target.value;
        });
    }

    updateModeSettings(mode) {
        this.dom.modeSettings.innerHTML = this.modeSettingsHTML[mode] || '';
        this.bindModeSpecificEvents(mode);
    }
    
    bindModeSpecificEvents(mode) {
        const modeInstance = this.app.renderer.modes[mode];
        if (!modeInstance) return;
    
        const settings = modeInstance.settings;
        for (const key in settings) {
            const elementId = this.getControlId(key, settings[key]);
            const element = document.getElementById(elementId);
            
            if (element) {
                const valueSpan = document.getElementById(`${key}Value`);
                element.addEventListener('input', (e) => {
                    const value = e.target.type === 'color' ? e.target.value : 
                                 e.target.type === 'checkbox' ? e.target.checked :
                                 parseFloat(e.target.value);
                    modeInstance.updateSetting(key, value);
                    if (valueSpan) valueSpan.textContent = value;
                });
            }
        }

        if (mode === 'imageJumper') {
            const uploadBtn = document.getElementById('imageUploadButton');
            if (uploadBtn) {
                uploadBtn.addEventListener('click', () => this.dom.imageFileInput.click());
                this.dom.imageFileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            modeInstance.setImage(event.target.result);
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }
        }
        if (mode === 'imageScreensaver') {
            const uploadBtn = document.getElementById('imageUploadButton2');
            if (uploadBtn) {
                uploadBtn.addEventListener('click', () => this.dom.imageFileInput.click());
            }
        }
        if (mode === 'imageDancer') {
            const uploadBtn = document.getElementById('imageUploadButton3');
            if (uploadBtn) {
                uploadBtn.addEventListener('click', () => this.dom.imageFileInput.click());
            }
        }
    }

    getControlId(key, value) {
        if (typeof value === 'boolean') return `${key}Checkbox`;
        return typeof value === 'string' && value.startsWith('#') ? `${key}Picker` : `${key}Slider`;
    }

    toggleFullscreen() {
        const elem = document.querySelector("#visualizer-container");
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                alert(`Error enabling fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    updateRecordButton(isRecording) {
        if (isRecording) {
            this.dom.recordButton.textContent = '⏹ Stop Recording';
            this.dom.recordButton.classList.add('stop-recording');
        } else {
            this.dom.recordButton.textContent = '⏺ Record';
            this.dom.recordButton.classList.remove('stop-recording');
        }
    }
    
    showVisualizer() {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('main-content').style.display = 'flex';
        document.getElementById('footer').style.display = 'block';
        
        // Display current key in footer
        const session = this.app.authManager.getSession();
        if (session && session.key) {
            document.getElementById('currentKeyDisplay').textContent = session.key;
        }
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
            imageScreensaver: new ImageScreensaverMode(this),
            imageDancer: new ImageDancerMode(this)
        };
        this.currentMode = this.modes.circular;
        this.beatColor = '#ff0000';
        
        this.isCapturing = false;
        this.captureCanvas = null;
        this.offscreenThreeRenderer = null;

        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
    }
    
    setMode(modeName) {
        if (this.modes[modeName] && this.currentMode.id !== modeName) {
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
            
            this.currentMode.init();
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

        if (this.currentMode.onResize) {
            this.currentMode.onResize(width, height);
        }
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
    
    updateSetting(key, value) { if (this.settings.hasOwnProperty(key)) { this.settings[key] = value; } }
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
        const tipX = cx + (radius + length) * Math.cos(angle);
        const tipY = cy + (radius + length) * Math.sin(angle);
        const anchorX = cx + radius * Math.cos(angle);
        const anchorY = cy + radius * Math.sin(angle);
        const controlAngleOffset = 0.3 / (length / 250);
        const controlDist = radius + length / 1.5;
        const cp1x = cx + controlDist * Math.cos(angle - controlAngleOffset);
        const cp1y = cy + controlDist * Math.sin(angle - controlAngleOffset);
        const cp2x = cx + controlDist * Math.cos(angle + controlAngleOffset);
        const cp2y = cy + controlDist * Math.sin(angle + controlAngleOffset);
        
        ctx.beginPath();
        ctx.moveTo(anchorX, anchorY);
        ctx.quadraticCurveTo(cp1x, cp1y, tipX, tipY);
        ctx.quadraticCurveTo(cp2x, cp2y, anchorX, anchorY);
        ctx.fill();
        ctx.stroke();
    }
}

class ParticleMode extends Mode {
    constructor(renderer) {
        super(renderer, 'particle');
        this.settings = { particleCount: 400, particleSize: 3, particleColor: '#00ffff' };
        this.particles = [];
    }
    
    init() {
        super.init();
        this.particles = [];
    }
    
    updateSetting(key, value) {
        super.updateSetting(key, value);
        if (key === 'particleCount') this.init();
    }
    
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        if (!this.initialized || this.particles.length !== this.settings.particleCount) {
            this.particles = [];
            const { width, height } = canvas;
            for (let i = 0; i < this.settings.particleCount; i++) {
                this.particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    energy: Math.random()
                });
            }
            if (canvas === this.renderer.canvas) this.initialized = true;
        }
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const { width, height } = canvas;
        const usableFreqData = frequencyData.slice(0, Math.min(frequencyData.length, 256));
        const bass = usableFreqData.slice(0, 64).reduce((a, b) => a + b, 0) / 64 / 255;
        const mids = usableFreqData.slice(64, 192).reduce((a, b) => a + b, 0) / 128 / 255;
        const blendedColor = this.renderer.blendColors(this.settings.particleColor, this.renderer.beatColor, beatEffect);
        
        ctx.shadowBlur = 15 + beatEffect * 20;
        ctx.shadowColor = blendedColor;
        
        this.particles.forEach(p => {
            const force = bass * 2;
            p.vx += (Math.random() - 0.5) * force * 0.5;
            p.vy += (Math.random() - 0.5) * force * 0.5;
            p.vx *= 0.97;
            p.vy *= 0.97;
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0 || p.x > width) { p.vx *= -0.8; p.x = Math.max(0, Math.min(width, p.x)); }
            if (p.y < 0 || p.y > height) { p.vy *= -0.8; p.y = Math.max(0, Math.min(height, p.y)); }
            
            ctx.beginPath();
            const size = this.settings.particleSize * (1 + beatEffect * 1.5 + mids * 0.5) * (0.5 + p.energy * 0.5);
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fillStyle = blendedColor;
            ctx.fill();
        });
        
        ctx.shadowBlur = 0;
    }
}

class WaveformMode extends Mode {
    constructor(renderer) {
        super(renderer, 'waveform');
        this.settings = { waveformThickness: 3, waveformColor: '#00ff00' };
    }
    
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const { width, height } = canvas;
        const usableTimeData = timeDomainData;
        const sliceWidth = width / usableTimeData.length;
        const blendedColor = this.renderer.blendColors(this.settings.waveformColor, this.renderer.beatColor, beatEffect);
        
        const usableFreqData = frequencyData.slice(0, Math.min(frequencyData.length, 256));
        const avgAmplitude = usableFreqData.reduce((a, b) => a + b, 0) / usableFreqData.length / 255;
        
        ctx.lineWidth = this.settings.waveformThickness * (1 + beatEffect * 2);
        ctx.strokeStyle = blendedColor;
        ctx.shadowBlur = 15 + beatEffect * 25 + avgAmplitude * 10;
        ctx.shadowColor = blendedColor;
        ctx.beginPath();
        
        let x = 0;
        for (let i = 0; i < usableTimeData.length; i++) {
            const v = usableTimeData[i] / 128.0;
            const y = v * height / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
        }
        
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

class GalaxyMode extends Mode {
    constructor(renderer) {
        super(renderer, 'galaxy');
        this.settings = { particleCount: 600, particleSize: 2, rotationSpeed: 0.15 };
        this.particles = [];
    }
    
    init() {
        super.init();
        this.particles = [];
    }
    
    updateSetting(key, value) {
        super.updateSetting(key, value);
        if (key === 'particleCount') this.init();
    }
    
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        if (!this.initialized || this.particles.length !== this.settings.particleCount) {
            this.particles = [];
            const { width, height } = canvas;
            const arms = 4;
            const armSpread = 0.6;
            
            for (let i = 0; i < this.settings.particleCount; i++) {
                const armIndex = Math.floor(i / (this.settings.particleCount / arms));
                const angle = (i % (this.settings.particleCount / arms)) * 2 * Math.PI / (this.settings.particleCount / arms) + armIndex * 2 * Math.PI / arms;
                const distance = Math.pow(Math.random(), 0.7) * Math.min(width, height) * 0.45;
                const spread = (Math.random() - 0.5) * armSpread;
                
                this.particles.push({
                    angle: angle + spread,
                    distance,
                    size: Math.random() * this.settings.particleSize + 0.3,
                    speed: (1 / (distance + 50)) * this.settings.rotationSpeed * 0.08 + (Math.random() - 0.5) * 0.0001,
                    brightness: 0.3 + Math.random() * 0.7
                });
            }
            if (canvas === this.renderer.canvas) this.initialized = true;
        }
        
        const { width, height } = canvas;
        const middleX = width / 2;
        const middleY = height / 2;
        
        ctx.fillStyle = `rgba(0, 0, 0, 0.06)`;
        ctx.fillRect(0, 0, width, height);
        
        const usableFreqData = frequencyData.slice(0, Math.min(frequencyData.length, 512));
        const bass = usableFreqData.slice(0, 64).reduce((a, b) => a + b, 0) / 64 / 255;
        const mids = usableFreqData.slice(64, 256).reduce((a, b) => a + b, 0) / 192 / 255;
        const treble = usableFreqData.slice(256).reduce((a, b) => a + b, 0) / (usableFreqData.length - 256) / 255;
        
        ctx.save();
        ctx.translate(middleX, middleY);
        
        this.particles.forEach(p => {
            p.angle += p.speed;
            const expansionFactor = 1 + bass * 0.15;
            const x = Math.cos(p.angle) * p.distance * expansionFactor;
            const y = Math.sin(p.angle) * p.distance * expansionFactor;
            
            const r = Math.floor(100 + treble * 155);
            const g = Math.floor(100 + mids * 155);
            const b = 255;
            const brightness = p.brightness * (0.7 + beatEffect * 0.3);
            const color = `rgba(${r * brightness}, ${g * brightness}, ${b * brightness}, ${brightness})`;
            
            const size = p.size * (1 + beatEffect * 1.2);
            
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
        });
        
        ctx.restore();
        ctx.shadowBlur = 0;
    }
}

class RadialMode extends Mode {
    constructor(renderer) {
        super(renderer, 'radial');
        this.settings = { rayCount: 360, innerRadius: 30, radialColor: '#ffff00' };
    }
    
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const middleX = canvas.width / 2;
        const middleY = canvas.height / 2;
        const blendedColor = this.renderer.blendColors(this.settings.radialColor, this.renderer.beatColor, beatEffect);
        const rayCount = this.settings.rayCount;
        const usableFreqData = frequencyData.slice(0, Math.min(frequencyData.length, 370));
        const freqStep = usableFreqData.length / rayCount;
        const scaledInnerRadius = this.settings.innerRadius * (Math.min(canvas.width, canvas.height) / 500);
        const maxRadius = Math.min(canvas.width, canvas.height) / 2;
        
        ctx.shadowBlur = 12 + beatEffect * 20;
        ctx.shadowColor = blendedColor;
        
        for (let i = 0; i < rayCount; i++) {
            const freqIndex = Math.floor(i * freqStep);
            const amplitude = usableFreqData[freqIndex] || 0;
            const rayLength = scaledInnerRadius + (amplitude / 255) * (maxRadius - scaledInnerRadius) * (1 + beatEffect * 0.6);
            const angle = (i / rayCount) * Math.PI * 2;
            
            const gradient = ctx.createLinearGradient(
                middleX, middleY,
                middleX + rayLength * Math.cos(angle),
                middleY + rayLength * Math.sin(angle)
            );
            gradient.addColorStop(0, blendedColor + 'AA');
            gradient.addColorStop(1, blendedColor + '00');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2 * (1 + beatEffect * 0.5);
            ctx.beginPath();
            ctx.moveTo(middleX, middleY);
            ctx.lineTo(
                middleX + rayLength * Math.cos(angle),
                middleY + rayLength * Math.sin(angle)
            );
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
    }
}

class DNAMode extends Mode {
    constructor(renderer) {
        super(renderer, 'dna');
        this.settings = { segmentCount: 100, helixRadius: 80, dnaColor: '#00ffaa' };
        this.offset = 0;
    }
    
    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const { width, height } = canvas;
        const blendedColor = this.renderer.blendColors(this.settings.dnaColor, this.renderer.beatColor, beatEffect);
        const segmentCount = this.settings.segmentCount;
        const scaledRadius = this.settings.helixRadius * (Math.min(width, height) / 500);
        const segmentHeight = height / segmentCount;
        
        const usableFreqData = frequencyData.slice(0, Math.min(frequencyData.length, 370));
        const bass = usableFreqData.slice(0, 64).reduce((a, b) => a + b, 0) / 64 / 255;
        const freqStep = usableFreqData.length / segmentCount;
        
        ctx.shadowBlur = 10 + beatEffect * 15;
        ctx.shadowColor = blendedColor;
        ctx.lineWidth = 2 + beatEffect * 2;
        
        this.offset += 0.05 + bass * 0.1;
        
        for (let strand = 0; strand < 2; strand++) {
            ctx.beginPath();
            for (let i = 0; i < segmentCount; i++) {
                const y = i * segmentHeight;
                const phase = (i / segmentCount) * Math.PI * 4 + this.offset + strand * Math.PI;
                const freqIndex = Math.floor(i * freqStep);
                const amplitude = usableFreqData[freqIndex] || 0;
                const x = width / 2 + Math.sin(phase) * scaledRadius * (1 + amplitude / 255 * 0.3);
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = blendedColor;
            ctx.stroke();
        }
        
        ctx.lineWidth = 1.5;
        for (let i = 0; i < segmentCount; i += 3) {
            const y = i * segmentHeight;
            const phase1 = (i / segmentCount) * Math.PI * 4 + this.offset;
            const phase2 = phase1 + Math.PI;
            const freqIndex = Math.floor(i * freqStep);
            const amplitude = usableFreqData[freqIndex] || 0;
            const expansionFactor = 1 + amplitude / 255 * 0.3;
            
            const x1 = width / 2 + Math.sin(phase1) * scaledRadius * expansionFactor;
            const x2 = width / 2 + Math.sin(phase2) * scaledRadius * expansionFactor;
            
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.strokeStyle = this.renderer.blendColors(blendedColor, '#ffffff', 0.3);
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
    }
}

class ThreeDMode extends Mode {
    constructor(renderer) {
        super(renderer, 'threeD');
        this.settings = { barCount: 128, threeDCameraZ: 500, threeDBarDepth: 50, threeDRotationSpeed: 1, threeDBarColor: '#ff00ff' };
        this.container = renderer.threeJsContainer;
        this.previewContainer = renderer.threeJsPreviewContainer;
        this.isDragging = false;
        this.previousMouseX = 0;
        this.previousMouseY = 0;
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
    }
    
    init() {
        super.init();
        this.cleanup(true);
        this.scene = new THREE.Scene();
        
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.z = this.settings.threeDCameraZ;
        this.threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.threeRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.threeRenderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.threeRenderer.domElement);
        
        this.previewCamera = new THREE.PerspectiveCamera(75, this.previewContainer.clientWidth / this.previewContainer.clientHeight, 0.1, 1000);
        this.previewCamera.position.z = this.settings.threeDCameraZ;
        this.previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.previewRenderer.setSize(this.previewContainer.clientWidth, this.previewContainer.clientHeight);
        this.previewRenderer.setClearColor(0x000000, 0);
        this.previewContainer.appendChild(this.previewRenderer.domElement);
        
        this.scene.add(new THREE.AmbientLight(0x404040, 2));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(0, 1, 1);
        this.scene.add(directionalLight);

        this.bars = [];
        const numBars = this.settings.barCount;
        const spacing = 6;
        const totalWidth = numBars * spacing;
        const startX = -totalWidth / 2;
        
        for (let i = 0; i < numBars; i++) {
            const geometry = new THREE.BoxGeometry(3, 5, this.settings.threeDBarDepth);
            const material = new THREE.MeshPhongMaterial({ 
                color: this.settings.threeDBarColor,
                shininess: 100,
                specular: 0x444444
            });
            const bar = new THREE.Mesh(geometry, material);
            bar.position.set(startX + i * spacing, 0, 0);
            this.scene.add(bar);
            this.bars.push(bar);
        }
        this.bindEvents();
    }
    
    updateSetting(key, value) {
        super.updateSetting(key, value);
        if (key === 'threeDCameraZ') {
            this.camera.position.z = value;
            this.previewCamera.position.z = value;
        }
        if (key === 'barCount' || key === 'threeDBarDepth') this.init();
    }
    
    bindEvents() {
        this.previewContainer.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('mousemove', this.onMouseMove);
    }
    
    cleanup(isReinit = false) {
        if (this.threeRenderer) {
            window.removeEventListener('mouseup', this.onMouseUp);
            window.removeEventListener('mousemove', this.onMouseMove);
            if (this.container.contains(this.threeRenderer.domElement)) {
                this.container.removeChild(this.threeRenderer.domElement);
            }
            this.threeRenderer.dispose();
        }
        if (this.previewRenderer) {
            if (this.previewContainer.contains(this.previewRenderer.domElement)) {
                this.previewContainer.removeChild(this.previewRenderer.domElement);
            }
            this.previewRenderer.dispose();
        }
        if (this.scene) {
            this.scene.traverse(object => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) object.material.forEach(m => m.dispose());
                    else object.material.dispose();
                }
            });
        }
        if (!isReinit) super.cleanup();
    }
    
    onMouseDown(event) {
        this.isDragging = true;
        this.previousMouseX = event.clientX;
        this.previousMouseY = event.clientY;
    }
    
    onMouseUp() {
        this.isDragging = false;
    }
    
    onMouseMove(event) {
        if (!this.isDragging) return;
        const deltaX = event.clientX - this.previousMouseX;
        const deltaY = event.clientY - this.previousMouseY;
        this.scene.rotation.y += deltaX * 0.005;
        this.scene.rotation.x += deltaY * 0.005;
        this.previousMouseX = event.clientX;
        this.previousMouseY = event.clientY;
    }
    
    draw(frequencyData, timeDomainData, beatEffect) {
        if (!this.initialized) return;
        const numBars = this.settings.barCount;
        const usableFreqData = frequencyData.slice(0, Math.min(frequencyData.length, 1024));
        const freqStep = usableFreqData.length / numBars;

        for (let i = 0; i < numBars; i++) {
            const freqIndex = Math.floor(i * freqStep);
            const amplitude = usableFreqData[freqIndex] || 0;
            const scaleY = Math.max(0.1, 1 + (amplitude / 255) * 6 * (1 + beatEffect * 0.8));
            const blendedColor = this.renderer.blendColors(this.settings.threeDBarColor, this.renderer.beatColor, beatEffect);
            
            const bar = this.bars[i];
            if (bar) {
                bar.scale.y = scaleY;
                bar.material.color.set(blendedColor);
                bar.material.emissive.set(blendedColor);
                bar.material.emissiveIntensity = beatEffect * 0.3;
            }
        }
        
        if (!this.isDragging) this.scene.rotation.y += (this.settings.threeDRotationSpeed / 1000);
        
        this.threeRenderer.render(this.scene, this.camera);
        this.previewRenderer.render(this.scene, this.previewCamera);
    }
    
    onResize(width, height) {
        if (!this.initialized || !this.camera || !this.threeRenderer) return;
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.threeRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
        
        this.previewCamera.aspect = this.previewContainer.clientWidth / this.previewContainer.clientHeight;
        this.previewCamera.updateProjectionMatrix();
        this.previewRenderer.setSize(this.previewContainer.clientWidth, this.previewContainer.clientHeight);
    }
}

class ImageJumperMode extends Mode {
    constructor(renderer) {
        super(renderer, 'imageJumper');
        this.settings = { imageSize: 150, jumpIntensity: 80, rotationSpeed: 0.5 };
        this.image = null;
        this.baseY = 0;
        this.jumpOffset = 0;
        this.rotation = 0;
    }

    setImage(src) {
        this.image = new Image();
        this.image.onload = () => this.initialized = true;
        this.image.src = src;
    }

    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        if (!this.image) return;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const middleX = canvas.width / 2;
        const middleY = canvas.height / 2;
        this.baseY = middleY;

        const jump = this.jumpOffset + beatEffect * this.settings.jumpIntensity;
        const yPos = this.baseY - jump;
        
        this.rotation += this.settings.rotationSpeed * 0.01;
        const scale = 1 + beatEffect * 0.3;
        const size = this.settings.imageSize * scale;

        ctx.save();
        ctx.translate(middleX, yPos);
        ctx.rotate(this.rotation);
        ctx.drawImage(this.image, -size/2, -size/2, size, size);
        ctx.restore();

        this.jumpOffset *= 0.9;
        if (beatEffect > 0.1) {
            this.jumpOffset = this.settings.jumpIntensity * 0.5;
        }
    }
}

class ImageScreensaverMode extends Mode {
    constructor(renderer) {
        super(renderer, 'imageScreensaver');
        this.settings = { imageSize: 100, moveSpeed: 3, rotationOnBeat: 45, trailEffect: true };
        this.image = null;
        this.x = 0;
        this.y = 0;
        this.dx = 2;
        this.dy = 2;
        this.rotation = 0;
        this.targetRotation = 0;
    }

    setImage(src) {
        this.image = new Image();
        this.image.onload = () => {
            this.x = Math.random() * (this.renderer.canvas.width - this.settings.imageSize);
            this.y = Math.random() * (this.renderer.canvas.height - this.settings.imageSize);
            this.initialized = true;
        };
        this.image.src = src;
    }

    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        if (!this.image) return;
        
        if (this.settings.trailEffect) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        this.x += this.dx;
        this.y += this.dy;

        if (this.x <= 0 || this.x + this.settings.imageSize >= canvas.width) {
            this.dx = -this.dx;
            this.targetRotation += this.settings.rotationOnBeat;
        }
        if (this.y <= 0 || this.y + this.settings.imageSize >= canvas.height) {
            this.dy = -this.dy;
            this.targetRotation += this.settings.rotationOnBeat;
        }

        if (beatEffect > 0.1) {
            this.dx = (Math.random() - 0.5) * this.settings.moveSpeed * 2;
            this.dy = (Math.random() - 0.5) * this.settings.moveSpeed * 2;
            this.targetRotation += this.settings.rotationOnBeat;
        }

        this.rotation += (this.targetRotation - this.rotation) * 0.05;

        ctx.save();
        ctx.translate(this.x + this.settings.imageSize/2, this.y + this.settings.imageSize/2);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.drawImage(this.image, -this.settings.imageSize/2, -this.settings.imageSize/2, this.settings.imageSize, this.settings.imageSize);
        ctx.restore();
    }
}

class ImageDancerMode extends Mode {
    constructor(renderer) {
        super(renderer, 'imageDancer');
        this.settings = { dancerImageSize: 120, dancerCount: 8, dancerSpread: 200, dancerWave: 0.5 };
        this.image = null;
        this.dancers = [];
        this.waveOffset = 0;
    }

    setImage(src) {
        this.image = new Image();
        this.image.onload = () => {
            this.initDancers();
            this.initialized = true;
        };
        this.image.src = src;
    }

    initDancers() {
        this.dancers = [];
        const centerX = this.renderer.canvas.width / 2;
        const centerY = this.renderer.canvas.height / 2;
        
        for (let i = 0; i < this.settings.dancerCount; i++) {
            const angle = (i / this.settings.dancerCount) * Math.PI * 2;
            const distance = this.settings.dancerSpread / 2;
            this.dancers.push({
                baseX: centerX + Math.cos(angle) * distance,
                baseY: centerY + Math.sin(angle) * distance,
                offset: Math.random() * Math.PI * 2,
                scale: 0.8 + Math.random() * 0.4
            });
        }
    }

    renderOn(canvas, ctx, frequencyData, timeDomainData, beatEffect) {
        if (!this.image) return;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const usableFreqData = frequencyData.slice(0, Math.min(frequencyData.length, 256));
        const avgAmplitude = usableFreqData.reduce((a, b) => a + b, 0) / usableFreqData.length / 255;
        
        this.waveOffset += 0.05 + avgAmplitude * 0.1;

        this.dancers.forEach(dancer => {
            const wave = Math.sin(this.waveOffset + dancer.offset) * this.settings.dancerWave * 50 * (1 + beatEffect);
            const pulse = 1 + beatEffect * 0.3 + avgAmplitude * 0.2;
            const size = this.settings.dancerImageSize * dancer.scale * pulse;
            
            const x = dancer.baseX + wave;
            const y = dancer.baseY + wave * 0.7;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(wave * 0.01);
            ctx.drawImage(this.image, -size/2, -size/2, size, size);
            ctx.restore();
        });
    }

    onResize(width, height) {
        if (this.image && this.initialized) {
            this.initDancers();
        }
    }
}

class App {
    constructor() {
        // Initialize auth manager first
        this.authManager = new AuthManager();
        
        // Check if user is already authenticated
        if (this.authManager.verifySession()) {
            this.initializeApp();
        } else {
            this.setupLogin();
        }
    }
    
    setupLogin() {
        // Setup login button event
        const loginButton = document.getElementById('loginButton');
        const accessKeyInput = document.getElementById('accessKey');
        const errorMessage = document.getElementById('errorMessage');
        
        loginButton.addEventListener('click', () => {
            const key = accessKeyInput.value.trim();
            if (!key) {
                this.showError("Please enter an access key");
                return;
            }
            
            const result = this.authManager.login(key);
            if (result.valid) {
                this.initializeApp();
            } else {
                this.showError(result.message);
            }
        });
        
        // Admin controls
        document.getElementById('generateMoreKeys')?.addEventListener('click', () => {
            const newKeys = this.authManager.generateMoreKeys(10);
            alert(`Generated 10 new keys! You now have ${this.authManager.validKeys.length} total keys.`);
        });
        
        document.getElementById('exportKeys')?.addEventListener('click', () => {
            const keys = this.authManager.validKeys;
            const keyData = JSON.parse(localStorage.getItem(this.authManager.STORAGE_KEY) || '{}');
            
            let exportText = "=== AUDIO VISUALIZER ACCESS KEYS ===\n\n";
            keys.forEach(key => {
                const info = keyData[key] || {};
                exportText += `Key: ${key}\n`;
                exportText += `Created: ${new Date(info.created).toLocaleString()}\n`;
                exportText += `Used: ${info.usageCount || 0} times\n`;
                exportText += `Status: ${info.isActive === false ? 'DEACTIVATED' : 'ACTIVE'}\n`;
                exportText += `Last Used: ${info.lastUsed ? new Date(info.lastUsed).toLocaleString() : 'Never'}\n`;
                exportText += "─".repeat(40) + "\n\n";
            });
            
            // Create download link
            const blob = new Blob([exportText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'audio-visualizer-keys.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
        
        document.getElementById('deactivateKey')?.addEventListener('click', () => {
            const keyInput = document.getElementById('keyToDeactivate');
            const key = keyInput.value.trim().toUpperCase();
            
            if (!key) {
                alert("Please enter a key to deactivate");
                return;
            }
            
            if (!this.authManager.validKeys.includes(key)) {
                alert("Key not found in the list");
                return;
            }
            
            if (confirm(`Are you sure you want to deactivate key:\n${key}\n\nThis will prevent this key from being used to login.`)) {
                const success = this.authManager.deactivateKey(key);
                if (success) {
                    alert(`Key ${key} has been deactivated.`);
                    keyInput.value = '';
                } else {
                    alert("Failed to deactivate key.");
                }
            }
        });
        
        // Allow Enter key to submit
        accessKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginButton.click();
            }
        });
    }
    
    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Clear error after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
    
    initializeApp() {
        // Hide login overlay, show main app
        this.uiManager = new UIManager(this);
        this.uiManager.showVisualizer();
        
        // Initialize audio and renderer
        this.audioManager = new AudioManager();
        this.renderer = new Renderer(this.audioManager);
        
        // Initialize app state
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.animationFrameId = null;
        this.started = false;
        this.audioStreamDestination = null;
        this.offscreenCanvas = null;
        
        // Add session monitoring
        this.startSessionMonitor();
    }
    
    startSessionMonitor() {
        // Check session every 30 seconds
        setInterval(() => {
            if (!this.authManager.verifySession()) {
                alert("Your session has expired or is being used from another browser. Please login again.");
                this.authManager.logout();
            }
        }, 30000);
    }

    async activateVisualizer(playOnStart = false) {
        if (this.started) return;
        this.started = true;
        this.uiManager.dom.overlay.classList.add('hidden');
        await this.audioManager.audioContext.resume();
        if (!this.audioManager.sourceNode) {
            await this.audioManager.loadUrl("https://cdn.pixabay.com/audio/2022/06/23/audio_2dee563a61.mp3");
            if (playOnStart && this.audioManager.audioElement) {
                this.audioManager.audioElement.play();
            }
        }
        this.loop();
    }

    async start() {
        if (!this.started) await this.activateVisualizer(true);
        if (this.audioManager.audioElement) {
            this.audioManager.audioElement.play();
        }
    }

    loop() {
        this.audioManager.update();
        this.renderer.draw();
        this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
    }

    async loadFile(file) {
        if (!file) return;
        await this.audioManager.loadFile(file);
        if (!this.started) {
            this.activateVisualizer(false);
        }
    }

    async useMicrophone() {
        await this.audioManager.loadMicrophone();
        if (!this.started) {
            this.activateVisualizer(false);
        }
    }

    setMode(mode) {
        this.renderer.setMode(mode);
        this.uiManager.updateModeSettings(mode);
    }
    
    toggleRecording() {
        if (this.isRecording) this.stopRecording();
        else this.startRecording();
    }

    startRecording() {
        if (!this.audioManager.sourceNode) {
            alert("Please load audio or use the microphone before recording.");
            return;
        }
        if (this.audioManager.audioElement && this.audioManager.audioElement.paused) {
            this.audioManager.audioElement.play();
        }
        
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = 1920;
        this.offscreenCanvas.height = 1080;

        this.renderer.beginFullscreenCapture(this.offscreenCanvas);

        const videoStream = this.offscreenCanvas.captureStream(30);
        
        this.audioStreamDestination = this.audioManager.audioContext.createMediaStreamDestination();
        this.audioManager.sourceNode.connect(this.audioStreamDestination);
        const combinedStream = new MediaStream([...videoStream.getTracks(), ...this.audioStreamDestination.stream.getTracks()]);
        
        this.mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
        this.recordedChunks = [];
        this.mediaRecorder.ondataavailable = e => this.recordedChunks.push(e.data);
        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            this.uiManager.dom.downloadLink.href = url;
            this.uiManager.dom.downloadLink.style.display = 'block';
        };
        this.mediaRecorder.start();
        this.isRecording = true;
        this.uiManager.updateRecordButton(true);
    }
    
    stopRecording() {
        if (this.mediaRecorder) this.mediaRecorder.stop();
        this.isRecording = false;
        this.uiManager.updateRecordButton(false);
        if (this.audioManager.sourceNode && this.audioStreamDestination) {
            this.audioManager.sourceNode.disconnect(this.audioStreamDestination);
            this.audioStreamDestination = null;
        }
        this.renderer.endFullscreenCapture();
        this.offscreenCanvas = null;
    }
}

// Initialize app on page load
window.addEventListener('load', () => new App());
