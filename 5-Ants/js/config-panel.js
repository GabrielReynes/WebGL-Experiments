export const ConfigPanel = {
    panel: null,
    isVisible: false,
    callbacks: {},

    init(initialParams, callbacks) {
        this.callbacks = callbacks;
        this.createPanel(initialParams);
        this.setupKeyboardListener();
    },

    createPanel(params) {
        // Create panel container
        this.panel = document.createElement('div');
        this.panel.id = 'config-panel';
        this.panel.className = 'config-panel';
        
        // Create panel content
        const content = document.createElement('div');
        content.className = 'config-content';
        
        // Create sections
        const antSection = this.createSection('Ant Parameters', [
            this.createSlider('speed', 'Speed', params.antParams.speed, 0, 200, 1),
            this.createSlider('rotationSpeed', 'Rotation Speed', params.antParams.rotationSpeed, 0, 720, 1),
            this.createSlider('senseSpread', 'Sense Spread', params.antParams.senseSpread, 0, 180, 1),
            this.createSlider('senseLength', 'Sense Length', params.antParams.senseLength, 0, 100, 1),
            this.createSlider('senseSize', 'Sense Size', params.antParams.senseSize, 1, 10, 1),
        ]);

        const displaySection = this.createSection('Display Parameters', [
            this.createSlider('decayFactor', 'Decay Factor', params.decayFactor, 0, 0.1, 0.001),
            this.createSlider('saturationThreshold', 'Saturation Threshold', params.saturationThreshold, 0, 2, 0.01),
            this.createSlider('bloomIntensity', 'Bloom Intensity', params.bloomIntensity, 0, 5, 0.1),
            this.createSlider('numBlurScales', 'Blur Scales', params.numBlurScales, 1, 15, 1),
            this.createSlider('floatTextureColorFactor', 'Float Color Factor', params.floatTextureColorFactor, 0, 1, 0.01),
            this.createSlider('rgb8TextureColorFactor', 'RGB8 Color Factor', params.rgb8TextureColorFactor, 0, 2, 0.1),
        ]);

        const simulationSection = this.createSection('Simulation Parameters', [
            this.createSlider('nbAgent', 'Number of Agents', params.nbAgent, 1000, 1000000, 1000),
            this.createSlider('initRadius', 'Initial Radius', params.initRadius, 100, 5000, 100),
            this.createColorPicker('backgroundColor', 'Background Color', params.backgroundColor),
        ]);

        // Create control buttons
        const controlsSection = this.createControlsSection();

        content.appendChild(antSection);
        content.appendChild(displaySection);
        content.appendChild(simulationSection);
        content.appendChild(controlsSection);

        this.panel.appendChild(content);
        document.body.appendChild(this.panel);
    },

    createSection(title, controls) {
        const section = document.createElement('div');
        section.className = 'config-section';
        
        const titleEl = document.createElement('h3');
        titleEl.textContent = title;
        section.appendChild(titleEl);
        
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'config-controls';
        controls.forEach(control => controlsContainer.appendChild(control));
        section.appendChild(controlsContainer);
        
        return section;
    },

    createSlider(id, label, value, min, max, step) {
        const container = document.createElement('div');
        container.className = 'config-control';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.htmlFor = id;
        container.appendChild(labelEl);
        
        const inputContainer = document.createElement('div');
        inputContainer.className = 'input-container';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = id;
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;
        slider.className = 'config-slider';
        
        const numberInput = document.createElement('input');
        numberInput.type = 'number';
        numberInput.min = min;
        numberInput.max = max;
        numberInput.step = step;
        numberInput.value = value;
        numberInput.className = 'config-number';
        
        // Sync slider and number input
        slider.addEventListener('input', (e) => {
            numberInput.value = e.target.value;
            this.updateParameter(id, parseFloat(e.target.value));
        });
        
        numberInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (val >= min && val <= max) {
                slider.value = val;
                this.updateParameter(id, val);
            }
        });
        
        inputContainer.appendChild(slider);
        inputContainer.appendChild(numberInput);
        container.appendChild(inputContainer);
        
        return container;
    },

    createColorPicker(id, label, color) {
        const container = document.createElement('div');
        container.className = 'config-control';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.htmlFor = id;
        container.appendChild(labelEl);
        
        const inputContainer = document.createElement('div');
        inputContainer.className = 'input-container';
        
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.id = id;
        colorInput.value = this.rgbToHex(color.r, color.g, color.b);
        colorInput.className = 'config-color';
        
        colorInput.addEventListener('input', (e) => {
            const hex = e.target.value;
            const rgb = this.hexToRgb(hex);
            this.updateParameter(id, rgb);
        });
        
        inputContainer.appendChild(colorInput);
        container.appendChild(inputContainer);
        
        return container;
    },

    createControlsSection() {
        const section = document.createElement('div');
        section.className = 'config-section config-controls-section';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'control-buttons';
        
        const pauseBtn = document.createElement('button');
        pauseBtn.id = 'pause-btn';
        pauseBtn.className = 'control-btn';
        pauseBtn.textContent = 'Pause';
        pauseBtn.addEventListener('click', () => {
            if (this.callbacks.onPause) {
                const isPaused = this.callbacks.onPause();
                pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
            }
        });
        
        const resetBtn = document.createElement('button');
        resetBtn.className = 'control-btn';
        resetBtn.textContent = 'Reset';
        resetBtn.addEventListener('click', () => {
            if (this.callbacks.onReset) {
                this.callbacks.onReset();
            }
        });
        
        const reloadBtn = document.createElement('button');
        reloadBtn.className = 'control-btn';
        reloadBtn.textContent = 'Reload';
        reloadBtn.addEventListener('click', () => {
            window.location.reload();
        });
        
        buttonContainer.appendChild(pauseBtn);
        buttonContainer.appendChild(resetBtn);
        buttonContainer.appendChild(reloadBtn);
        section.appendChild(buttonContainer);
        
        return section;
    },

    updateParameter(id, value) {
        if (this.callbacks.onParameterChange) {
            this.callbacks.onParameterChange(id, value);
        }
    },

    setupKeyboardListener() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'c' || e.key === 'C') {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    this.toggle();
                }
            }
        });
    },

    toggle() {
        this.isVisible = !this.isVisible;
        if (this.isVisible) {
            this.panel.classList.add('visible');
        } else {
            this.panel.classList.remove('visible');
        }
    },

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    },

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
            a: 1
        };
    }
};

