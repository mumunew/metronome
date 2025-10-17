// 节拍器核心功能实现
class Metronome {
    constructor() {
        // 获取DOM元素
        this.bpmSlider = document.getElementById('bpm');
        this.bpmValue = document.getElementById('bpm-value');
        this.volumeSlider = document.getElementById('volume');
        this.soundSelect = document.getElementById('sound-select');
        this.startStopButton = document.getElementById('start-stop');
        this.visualizer = document.getElementById('visualizer');
        this.currentBeatElement = document.getElementById('current-beat');
        this.presetButtons = document.querySelectorAll('.preset-button');
        this.savePresetButton = document.getElementById('save-preset');
        this.presetList = document.getElementById('preset-list');
        
        // 独立计时器元素
        this.timerMinutesSlider = document.getElementById('timer-minutes');
        this.timerDisplay = document.getElementById('timer-display');
        this.timerStartStopButton = document.getElementById('timer-start-stop');
        this.timerCompletedDisplay = document.getElementById('timer-completed');
        
        // 初始化变量
        this.isPlaying = false;
        this.bpm = parseInt(this.bpmSlider.value);
        this.volume = parseInt(this.volumeSlider.value) / 100;
        this.soundType = this.soundSelect.value;
        this.beatsPerMeasure = 4;
        this.currentBeat = 1;
        this.timerInterval = null;
        this.startTime = 0;
        this.metronomeInterval = null;
        
        // 独立计时器变量
        // 独立计时器默认值设为10分钟
        this.timerMinutes = 10;
        // 确保滑块值与JavaScript中的值同步
        if (this.timerMinutesSlider) {
            this.timerMinutesSlider.value = this.timerMinutes;
        }
        this.timerIsRunning = false;
        this.timerRemainingSeconds = this.timerMinutes * 60;
        this.timerDisplayInterval = null;
        // 初始化计时器显示
        this.updateTimerDisplay();
        
        // 初始化Web Audio API
        this.audioContext = null;
        this.oscillator = null;
        this.gainNode = null;
        
        // 绑定事件监听器
        this.bindEvents();
        
        // 加载预设
        this.loadPresets();
    }
    
    // 初始化音频上下文
    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    // 绑定事件监听器
    bindEvents() {
        // BPM滑块事件
        this.bpmSlider.addEventListener('input', () => {
            this.bpm = parseInt(this.bpmSlider.value);
            this.bpmValue.textContent = this.bpm;
            if (this.isPlaying) {
                this.restartMetronome();
            }
        });
        
        // 音量滑块事件
        this.volumeSlider.addEventListener('input', () => {
            this.volume = parseInt(this.volumeSlider.value) / 100;
        });
        
        // 声音选择事件
        this.soundSelect.addEventListener('change', () => {
            this.soundType = this.soundSelect.value;
        });
        
        // 独立计时器分钟滑块事件
        this.timerMinutesSlider.addEventListener('input', () => {
            this.timerMinutes = parseInt(this.timerMinutesSlider.value);
            if (!this.timerIsRunning) {
                this.timerRemainingSeconds = this.timerMinutes * 60;
                this.updateTimerDisplay();
            }
        });
        
        // 独立计时器开始/停止按钮事件
        this.timerStartStopButton.addEventListener('click', () => {
            this.toggleTimer();
        });
        
        // 开始/停止按钮事件
        this.startStopButton.addEventListener('click', () => {
            this.toggleMetronome();
        });
        
        // 节拍模式按钮事件
        this.presetButtons.forEach(button => {
            button.addEventListener('click', () => {
                const beats = parseInt(button.getAttribute('data-beats'));
                this.beatsPerMeasure = beats;
                this.currentBeat = 1;
                this.currentBeatElement.textContent = this.currentBeat;
                
                // 更新按钮样式
                this.presetButtons.forEach(btn => {
                    btn.classList.remove('bg-blue-100', 'text-blue-700');
                    btn.classList.add('bg-gray-100', 'text-gray-600');
                });
                button.classList.remove('bg-gray-100', 'text-gray-600');
                button.classList.add('bg-blue-100', 'text-blue-700');
                
                if (this.isPlaying) {
                    this.restartMetronome();
                }
            });
        });
        
        // 保存预设按钮事件
        this.savePresetButton.addEventListener('click', () => {
            this.saveCurrentPreset();
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            // 空格键开始/停止
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleMetronome();
            }
            // 上下箭头调整BPM
            else if (e.code === 'ArrowUp') {
                e.preventDefault();
                if (this.bpm < 200) {
                    this.bpmSlider.value = ++this.bpm;
                    this.bpmValue.textContent = this.bpm;
                    if (this.isPlaying) {
                        this.restartMetronome();
                    }
                }
            }
            else if (e.code === 'ArrowDown') {
                e.preventDefault();
                if (this.bpm > 130) {
                    this.bpmSlider.value = --this.bpm;
                    this.bpmValue.textContent = this.bpm;
                    if (this.isPlaying) {
                        this.restartMetronome();
                    }
                }
            }
        });
    }
    
    // 切换节拍器状态
    toggleMetronome() {
        if (this.isPlaying) {
            this.stopMetronome();
        } else {
            this.startMetronome();
        }
    }
    
    // 启动节拍器
    startMetronome() {
        this.initAudioContext();
        
        this.isPlaying = true;
        this.startStopButton.innerHTML = '<i class="fa fa-stop mr-2"></i>停止';
        this.startStopButton.classList.remove('bg-blue-600');
        this.startStopButton.classList.add('bg-red-600', 'hover:bg-red-700');
        

        
        // 播放第一个节拍
        this.playBeat();
        
        // 设置节拍间隔
        const interval = (60 / this.bpm) * 1000; // 毫秒
        this.metronomeInterval = setInterval(() => {
            this.playBeat();
        }, interval);
    }
    
    // 独立计时器相关方法
    toggleTimer() {
        if (this.timerIsRunning) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        this.timerIsRunning = true;
        // 确保按钮元素存在
        if (this.timerStartStopButton) {
            this.timerStartStopButton.innerHTML = '<i class="fa fa-pause mr-1"></i>暂停计时';
            this.timerStartStopButton.classList.remove('bg-green-600', 'hover:bg-green-700');
            this.timerStartStopButton.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
        }
        // 确保完成提示元素存在
        if (this.timerCompletedDisplay) {
            this.timerCompletedDisplay.classList.add('hidden');
        }
        
        // 启动计时器
        // 首先清除可能存在的旧计时器
        if (this.timerDisplayInterval) {
            clearInterval(this.timerDisplayInterval);
        }
        
        this.timerDisplayInterval = setInterval(() => {
            this.timerRemainingSeconds--;
            this.updateTimerDisplay();
            
            if (this.timerRemainingSeconds <= 0) {
                this.stopTimer();
                // 确保完成提示元素存在
                if (this.timerCompletedDisplay) {
                    this.timerCompletedDisplay.classList.remove('hidden');
                }
                this.playTimerCompletedSound();
            }
        }, 1000);
    }
    
    stopTimer() {
        this.timerIsRunning = false;
        this.timerStartStopButton.innerHTML = '<i class="fa fa-play mr-1"></i>开始计时';
        this.timerStartStopButton.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
        this.timerStartStopButton.classList.add('bg-green-600', 'hover:bg-green-700');
        
        clearInterval(this.timerDisplayInterval);
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.timerRemainingSeconds / 60);
        const seconds = this.timerRemainingSeconds % 60;
        // 确保timerDisplay元素存在
        if (this.timerDisplay) {
            this.timerDisplay.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    playTimerCompletedSound() {
        this.initAudioContext();
        
        // 播放完成提示音（上升音调）
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = 800 + (i * 200);
                oscillator.type = 'sine';
                
                const currentTime = this.audioContext.currentTime;
                gainNode.gain.setValueAtTime(0, currentTime);
                gainNode.gain.linearRampToValueAtTime(this.volume * 0.8, currentTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.3);
                
                oscillator.start(currentTime);
                oscillator.stop(currentTime + 0.3);
            }, i * 300);
        }
    }
    
    // 停止节拍器
    stopMetronome() {
        this.isPlaying = false;
        this.startStopButton.innerHTML = '<i class="fa fa-play mr-2"></i>开始';
        this.startStopButton.classList.remove('bg-red-600', 'hover:bg-red-700');
        this.startStopButton.classList.add('bg-blue-600');
        
        // 清除节拍器相关计时器（不影响独立计时器）
        clearInterval(this.metronomeInterval);
        
        // 重置视觉效果
        this.visualizer.classList.remove('active');
        this.currentBeat = 1;
        this.currentBeatElement.textContent = this.currentBeat;
    }
    
    // 重启节拍器（改变BPM或节拍模式时）
    restartMetronome() {
        clearInterval(this.metronomeInterval);
        const interval = (60 / this.bpm) * 1000;
        this.metronomeInterval = setInterval(() => {
            this.playBeat();
        }, interval);
    }
    
    // 播放节拍
    playBeat() {
        // 更新节拍计数
        this.currentBeatElement.textContent = this.currentBeat;
        
        // 播放声音
        this.playSound(this.currentBeat === 1); // 第一拍为强拍
        
        // 视觉反馈
        this.visualizer.classList.add('active');
        setTimeout(() => {
            this.visualizer.classList.remove('active');
        }, 100);
        
        // 更新节拍
        this.currentBeat++;
        if (this.currentBeat > this.beatsPerMeasure) {
            this.currentBeat = 1;
        }
    }
    
    // 播放声音
    playSound(isStrongBeat = false) {
        const currentTime = this.audioContext.currentTime;
        const volume = isStrongBeat ? this.volume * 1.5 : this.volume;
        
        if (this.soundType === 'clap') {
            // 拍手声特殊处理 - 使用噪声源
            const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.1, this.audioContext.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            
            // 生成白噪声
            for (let i = 0; i < noiseBuffer.length; i++) {
                noiseData[i] = Math.random() * 2 - 1;
            }
            
            // 创建噪声源
            const noiseSource = this.audioContext.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            
            // 创建增益节点
            this.gainNode = this.audioContext.createGain();
            
            // 创建滤波器使声音更像拍手
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 2000; // 高通滤波，增强高频
            
            // 连接节点
            noiseSource.connect(filter);
            filter.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            
            // 拍手声特有的音量包络
            this.gainNode.gain.setValueAtTime(0, currentTime);
            this.gainNode.gain.linearRampToValueAtTime(volume * 0.8, currentTime + 0.001);
            this.gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);
            
            // 播放噪声
            noiseSource.start(currentTime);
            noiseSource.stop(currentTime + 0.2);
        } else {
            // 其他声音使用振荡器
            let frequency, duration;
            
            switch (this.soundType) {
                case 'cowbell':
                    frequency = isStrongBeat ? 800 : 600;
                    duration = 0.08;
                    break;
                case 'woodblock':
                    frequency = isStrongBeat ? 1000 : 800;
                    duration = 0.07;
                    break;
                case 'metronome':
                default:
                    frequency = isStrongBeat ? 880 : 440;
                    duration = 0.06;
            }
            
            // 创建振荡器
            this.oscillator = this.audioContext.createOscillator();
            this.gainNode = this.audioContext.createGain();
            
            // 连接节点
            this.oscillator.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            
            // 设置参数
            this.oscillator.frequency.value = frequency;
            this.oscillator.type = 'sine';
            
            // 音量包络
            this.gainNode.gain.setValueAtTime(0, currentTime);
            this.gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.001);
            this.gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
            
            // 播放并停止
            this.oscillator.start(currentTime);
            this.oscillator.stop(currentTime + duration);
        }
    }
    
    // 保存当前设置为预设
    saveCurrentPreset() {
        const presetName = prompt('请输入预设名称:', `节拍器设置 ${new Date().toLocaleTimeString()}`);
        if (!presetName) return;
        
        const preset = {
            name: presetName,
            bpm: this.bpm,
            beatsPerMeasure: this.beatsPerMeasure,
            soundType: this.soundType,
            volume: this.volume
        };
        
        // 获取现有预设
        const presets = JSON.parse(localStorage.getItem('metronomePresets') || '[]');
        presets.push(preset);
        localStorage.setItem('metronomePresets', JSON.stringify(presets));
        
        // 更新预设列表
        this.loadPresets();
    }
    
    // 加载预设列表
    loadPresets() {
        const presets = JSON.parse(localStorage.getItem('metronomePresets') || '[]');
        this.presetList.innerHTML = '';
        
        presets.forEach((preset, index) => {
            const button = document.createElement('button');
            button.className = 'preset-button py-2 px-3 rounded-lg bg-gray-100 text-gray-600 font-medium text-sm flex justify-between items-center';
            button.innerHTML = `
                <span>${preset.name}</span>
                <span class="text-xs">${preset.bpm} BPM</span>
            `;
            
            // 应用预设
            button.addEventListener('click', () => {
                this.applyPreset(preset);
            });
            
            this.presetList.appendChild(button);
        });
    }
    
    // 应用预设
    applyPreset(preset) {
        this.bpm = preset.bpm;
        this.beatsPerMeasure = preset.beatsPerMeasure;
        this.soundType = preset.soundType;
        this.volume = preset.volume;
        
        // 更新UI
        this.bpmSlider.value = this.bpm;
        this.bpmValue.textContent = this.bpm;
        this.soundSelect.value = this.soundType;
        this.volumeSlider.value = Math.round(this.volume * 100);
        this.currentBeat = 1;
        this.currentBeatElement.textContent = this.currentBeat;
        
        // 更新节拍模式按钮样式
        this.presetButtons.forEach(btn => {
            if (parseInt(btn.getAttribute('data-beats')) === this.beatsPerMeasure) {
                btn.classList.remove('bg-gray-100', 'text-gray-600');
                btn.classList.add('bg-blue-100', 'text-blue-700');
            } else {
                btn.classList.remove('bg-blue-100', 'text-blue-700');
                btn.classList.add('bg-gray-100', 'text-gray-600');
            }
        });
        
        // 如果节拍器正在播放，重启它
        if (this.isPlaying) {
            this.restartMetronome();
        }
    }
}

// 当页面加载完成时初始化节拍器
document.addEventListener('DOMContentLoaded', () => {
    const metronome = new Metronome();
});