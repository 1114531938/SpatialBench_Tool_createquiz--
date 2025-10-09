// 答题模式应用
class QuizApp {
    constructor() {
        this.qaList = [];
        this.currentQA = null;
        this.currentIndex = -1;
        this.videoPlayer = null;
        this.showingGT = false;
        this.init();
    }
    
    init() {
        this.videoPlayer = document.getElementById('videoPlayer');
        // 不自动加载，等待用户选择文件
    }
    
    // ==================== 文件加载 ====================
    
    async showFileSelector() {
        const modal = document.getElementById('fileModal');
        modal.classList.add('show');
        await this.loadFileList();
    }
    
    hideFileSelector() {
        const modal = document.getElementById('fileModal');
        modal.classList.remove('show');
    }
    
    async loadFileList() {
        try {
            const response = await fetch('/api/qa/list-data-files');
            const data = await response.json();
            
            const fileListEl = document.getElementById('fileList');
            if (!data.files || data.files.length === 0) {
                fileListEl.innerHTML = '<div style="text-align: center; color: #999;">data文件夹中没有JSON文件</div>';
                return;
            }
            
            let html = '';
            data.files.forEach(file => {
                html += `
                    <div class="file-item" onclick="quizApp.loadFile('${file.name}')">
                        <div style="font-weight: 600;">${file.name}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">
                            ${(file.size / 1024).toFixed(1)} KB · ${new Date(file.modified * 1000).toLocaleDateString()}
                        </div>
                    </div>
                `;
            });
            
            fileListEl.innerHTML = html;
        } catch (error) {
            console.error('加载文件列表失败:', error);
            document.getElementById('fileList').innerHTML = '<div style="text-align: center; color: red;">加载失败</div>';
        }
    }
    
    async loadFile(fileName) {
        try {
            const response = await fetch('/api/quiz/load-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_name: fileName })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.hideFileSelector();
                await this.loadQAList();
                alert(`成功加载: ${fileName}`);
            } else {
                alert('加载失败: ' + result.error);
            }
        } catch (error) {
            console.error('加载文件失败:', error);
            alert('加载文件失败');
        }
    }
    
    // ==================== QA列表加载 ====================
    
    async loadQAList() {
        try {
            const response = await fetch('/api/quiz/qas');
            const data = await response.json();
            
            if (data.qas) {
                this.qaList = data.qas;
                this.renderQAList();
                this.updateStatistics();
                
                // 自动选择第一题
                if (this.qaList.length > 0) {
                    this.selectQA(0);
                }
            }
        } catch (error) {
            console.error('加载QA列表失败:', error);
        }
    }
    
    renderQAList() {
        const listEl = document.getElementById('qaList');
        if (!listEl) return;
        
        if (this.qaList.length === 0) {
            listEl.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无题目</div>';
            return;
        }
        
        let html = '';
        this.qaList.forEach((qa, index) => {
            const hasAnswer = qa.human_answer !== null && qa.human_answer !== undefined;
            const isUsable = qa.usable !== false;
            
            let className = 'qa-item';
            if (index === this.currentIndex) className += ' active';
            if (hasAnswer) className += ' answered';
            if (!isUsable) className += ' unusable';
            
            const statusText = !isUsable ? '无效' : (hasAnswer ? '已答' : '未答');
            
            html += `
                <div class="${className}" onclick="quizApp.selectQA(${index})">
                    <div class="qa-number">题目 ${index + 1}</div>
                    <div class="qa-status">
                        <i class="fas fa-${!isUsable ? 'ban' : (hasAnswer ? 'check-circle' : 'circle')}"></i>
                        ${statusText}
                    </div>
                </div>
            `;
        });
        
        listEl.innerHTML = html;
    }
    
    updateStatistics() {
        const total = this.qaList.length;
        const answered = this.qaList.filter(qa => qa.human_answer !== null && qa.human_answer !== undefined).length;
        const unanswered = total - answered;
        const usable = this.qaList.filter(qa => qa.usable !== false).length;
        const unusable = total - usable;
        const progressPercent = total > 0 ? ((answered / total) * 100).toFixed(1) : 0;
        
        // 更新左侧面板统计数字
        const totalCountEl = document.getElementById('totalCount');
        const answeredCountEl = document.getElementById('answeredCount');
        const unansweredCountEl = document.getElementById('unansweredCount');
        const usableCountEl = document.getElementById('usableCount');
        const unusableCountEl = document.getElementById('unusableCount');
        const progressPercentEl = document.getElementById('progressPercent');
        
        if (totalCountEl) totalCountEl.textContent = total;
        if (answeredCountEl) answeredCountEl.textContent = answered;
        if (unansweredCountEl) unansweredCountEl.textContent = unanswered;
        if (usableCountEl) usableCountEl.textContent = usable;
        if (unusableCountEl) unusableCountEl.textContent = unusable;
        if (progressPercentEl) progressPercentEl.textContent = progressPercent + '%';
        
        // 更新顶部进度显示
        const progressPercentTopEl = document.getElementById('progressPercentTop');
        if (progressPercentTopEl) {
            progressPercentTopEl.textContent = progressPercent + '%';
        }
    }
    
    // ==================== 选择QA ====================
    
    async selectQA(index) {
        if (index < 0 || index >= this.qaList.length) return;
        
        this.currentIndex = index;
        this.currentQA = this.qaList[index];
        this.showingGT = false;
        
        // 更新列表选中状态
        this.renderQAList();
        
        // 更新导航按钮状态
        document.getElementById('prevBtn').disabled = (index === 0);
        document.getElementById('nextBtn').disabled = (index === this.qaList.length - 1);
        
        // 更新当前题号显示
        const currentQANumberEl = document.getElementById('currentQANumber');
        if (currentQANumberEl) {
            currentQANumberEl.textContent = `${index + 1} / ${this.qaList.length}`;
        }
        
        // 更新顶部进度
        const total = this.qaList.length;
        const answered = this.qaList.filter(qa => qa.human_answer !== null && qa.human_answer !== undefined).length;
        const progressPercent = total > 0 ? ((answered / total) * 100).toFixed(1) : 0;
        const progressPercentTopEl = document.getElementById('progressPercentTop');
        if (progressPercentTopEl) {
            progressPercentTopEl.textContent = progressPercent + '%';
        }
        
        // 加载视频
        await this.loadVideo();
        
        // 渲染答题界面
        this.renderQuestionArea();
    }
    
    async loadVideo() {
        if (!this.currentQA) return;
        
        try {
            const response = await fetch(`/api/quiz/qa/${this.currentQA.qa_id}/video`);
            const data = await response.json();
            
            if (data.video_path && this.videoPlayer) {
                this.videoPlayer.src = data.video_path;
            }
        } catch (error) {
            console.error('加载视频失败:', error);
        }
    }
    
    renderQuestionArea() {
        if (!this.currentQA) {
            document.getElementById('contentArea').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-hand-pointer"></i>
                    <h3>请从左侧列表选择一个题目开始答题</h3>
                </div>
            `;
            return;
        }
        
        const qa = this.currentQA;
        const direction = qa.temporal_direction || 'Forward';
        const directionText = direction === 'Forward' ? '前半段' : '后半段';
        
        let html = `
            <!-- 视频部分 -->
            <div class="video-section">
                <video id="videoPlayer" class="video-player" controls>
                    <source src="" type="video/mp4">
                </video>
                <div class="video-time-display">
                    <div class="time-info">
                        <span class="time-label">
                            <i class="fas fa-play-circle"></i>
                            当前播放时间:
                        </span>
                        <span class="time-value" id="currentTimeDisplay">00:00.00</span>
                    </div>
                    <div class="time-info">
                        <span class="time-label">
                            <i class="fas fa-film"></i>
                            视频总时长:
                        </span>
                        <span class="time-value" id="totalTimeDisplay">00:00.00</span>
                    </div>
                    <div class="time-info segment-info">
                        <span class="time-label">
                            <i class="fas fa-cut"></i>
                            片段范围:
                        </span>
                        <span class="time-value">${qa.start_time} - ${qa.end_time}</span>
                        ${qa.cut_point ? `
                        <span class="time-label" style="margin-left: 15px;">
                            <i class="fas fa-scissors"></i>
                            切分点:
                        </span>
                        <span class="time-value">${qa.cut_point}</span>
                        ` : ''}
                    </div>
                </div>
                <div class="perspective-selection">
                    <div class="perspective-header">
                        <span class="perspective-label">
                            <i class="fas fa-video"></i>
                            视角选择:
                        </span>
                        <span class="current-perspective" id="currentPerspective">加载中...</span>
                    </div>
                    <div class="perspective-buttons" id="perspectiveButtons">
                        <!-- 视角按钮将动态生成 -->
                    </div>
                </div>
                <div class="video-controls">
                    <button class="play-btn" onclick="quizApp.playVideo()">
                        <i class="fas fa-play"></i> 播放${directionText}
                    </button>
                </div>
            </div>
            
            <!-- 问题部分 -->
            <div class="question-section">
                <div class="question-text">${qa.question}</div>
                <div class="question-meta">
                    <span class="meta-tag">
                        <i class="fas fa-tag"></i> ${qa.question_type || '未知类型'}
                    </span>
                    <span class="meta-tag">
                        <i class="fas fa-clock"></i> ${direction}
                    </span>
                    <span class="meta-tag">
                        <i class="fas fa-video"></i> ${qa.start_time} - ${qa.end_time}
                    </span>
                </div>
            </div>
            
            <!-- 选项部分 -->
            <div class="options-section">
                ${this.renderOptions()}
            </div>
            
            <!-- 操作按钮 -->
            <div class="action-buttons">
                <button class="action-btn btn-show-gt" onclick="quizApp.toggleGT()">
                    <i class="fas fa-eye"></i> ${this.showingGT ? '隐藏' : '显示'}答案
                </button>
                <button class="action-btn btn-toggle-usable ${qa.usable === false ? 'unusable' : ''}" 
                        onclick="quizApp.toggleUsable()">
                    <i class="fas fa-${qa.usable === false ? 'check' : 'ban'}"></i>
                    ${qa.usable === false ? '标记为有效' : '标记为无效'}
                </button>
            </div>
            
            <!-- GT显示 -->
            <div id="gtDisplay"></div>
        `;
        
        document.getElementById('contentArea').innerHTML = html;
        
        // 重新获取video元素引用
        this.videoPlayer = document.getElementById('videoPlayer');
        
        // 加载视频
        this.loadVideo();
        
        // 添加时间更新监听器
        this.setupTimeDisplay();
        
        // 加载视角选择
        this.loadPerspectiveSelection();
        
        // 如果之前在显示GT，重新显示
        if (this.showingGT) {
            this.renderGT();
        }
    }
    
    setupTimeDisplay() {
        if (!this.videoPlayer) return;
        
        // 更新当前播放时间
        this.videoPlayer.addEventListener('timeupdate', () => {
            const currentTime = this.videoPlayer.currentTime;
            const currentTimeEl = document.getElementById('currentTimeDisplay');
            if (currentTimeEl) {
                currentTimeEl.textContent = this.formatTimeWithDecimals(currentTime);
            }
        });
        
        // 更新视频总时长
        this.videoPlayer.addEventListener('loadedmetadata', () => {
            const duration = this.videoPlayer.duration;
            const totalTimeEl = document.getElementById('totalTimeDisplay');
            if (totalTimeEl) {
                totalTimeEl.textContent = this.formatTimeWithDecimals(duration);
            }
        });
    }
    
    formatTimeWithDecimals(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00.00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        
        const minutesStr = String(minutes).padStart(2, '0');
        const secsStr = secs.toFixed(2).padStart(5, '0');
        
        return `${minutesStr}:${secsStr}`;
    }
    
    async loadPerspectiveSelection() {
        if (!this.currentQA) return;
        
        try {
            const videoName = this.currentQA.video_name;
            if (!videoName) {
                document.getElementById('perspectiveButtons').innerHTML = '<div style="text-align: center; color: #999;">无视频信息</div>';
                return;
            }
            
            const response = await fetch(`/api/video/${videoName}/perspectives`);
            const data = await response.json();
            
            if (data.perspectives && data.perspectives.length > 0) {
                this.renderPerspectiveButtons(data.perspectives);
            } else {
                document.getElementById('perspectiveButtons').innerHTML = '<div style="text-align: center; color: #999;">无可用视角</div>';
            }
        } catch (error) {
            console.error('加载视角信息失败:', error);
            document.getElementById('perspectiveButtons').innerHTML = '<div style="text-align: center; color: red;">加载失败</div>';
        }
    }
    
    renderPerspectiveButtons(perspectives) {
        const currentPerspective = this.currentQA.视角 && this.currentQA.视角[0] ? this.currentQA.视角[0] : null;
        
        // 更新当前视角显示
        const currentPerspectiveEl = document.getElementById('currentPerspective');
        if (currentPerspectiveEl) {
            currentPerspectiveEl.textContent = currentPerspective || '未选择';
        }
        
        // 生成视角按钮
        const buttonsEl = document.getElementById('perspectiveButtons');
        if (!buttonsEl) return;
        
        let html = '';
        perspectives.forEach(perspective => {
            const isActive = perspective === currentPerspective;
            const className = isActive ? 'perspective-btn active' : 'perspective-btn';
            
            html += `
                <button class="${className}" 
                        onclick="quizApp.selectPerspective('${perspective}')"
                        title="切换到 ${perspective}">
                    ${perspective}
                </button>
            `;
        });
        
        buttonsEl.innerHTML = html;
    }
    
    async selectPerspective(perspective) {
        if (!this.currentQA) return;
        
        try {
            // 更新当前QA的视角信息
            this.currentQA.视角 = [perspective];
            this.qaList[this.currentIndex].视角 = [perspective];
            
            // 重新加载视频
            await this.loadVideo();
            
            // 更新视角按钮状态
            this.renderPerspectiveButtons(
                document.querySelectorAll('.perspective-btn').length > 0 ? 
                Array.from(document.querySelectorAll('.perspective-btn')).map(btn => btn.textContent.trim()) : 
                []
            );
            
            // 更新当前视角显示
            const currentPerspectiveEl = document.getElementById('currentPerspective');
            if (currentPerspectiveEl) {
                currentPerspectiveEl.textContent = perspective;
            }
            
        } catch (error) {
            console.error('切换视角失败:', error);
            alert('❌ 切换视角失败');
        }
    }
    
    renderOptions() {
        if (!this.currentQA) return '';
        
        const options = this.currentQA.options || [];
        const humanAnswer = this.currentQA.human_answer;
        const hasAnswered = humanAnswer !== null && humanAnswer !== undefined;
        
        if (options.length === 0) {
            return '<div style="text-align: center; color: #999;">暂无选项</div>';
        }
        
        let html = '';
        options.forEach((option, index) => {
            const isSelected = (humanAnswer === option);
            
            let className = 'option-btn';
            let additionalStyle = '';
            
            if (isSelected) {
                // 已选中：显示选中状态（淡蓝色）
                className += ' selected';
                additionalStyle = 'background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-color: #2196f3; font-weight: 600; color: #0d47a1;';
            } else {
                // 未选中：白色背景，可点击
                additionalStyle = 'background: white; border-color: #e1e8ed; color: #333; cursor: pointer;';
            }
            
            html += `
                <button class="${className}" 
                        style="${additionalStyle}"
                        onclick="quizApp.selectOption('${this.escapeHtml(option)}')">
                    ${option}
                </button>
            `;
        });
        
        return html;
    }
    
    // ==================== 答题操作 ====================
    
    async selectOption(option) {
        if (!this.currentQA) return;
        
        try {
            const response = await fetch(`/api/quiz/qa/${this.currentQA.qa_id}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer: option })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 更新本地数据
                this.currentQA.human_answer = option;
                this.qaList[this.currentIndex].human_answer = option;
                
                // 重新渲染
                this.renderQAList();
                this.renderQuestionArea();
                this.updateStatistics();  // 更新统计
            }
        } catch (error) {
            console.error('保存答案失败:', error);
            alert('❌ 保存失败');
        }
    }
    
    async toggleUsable() {
        if (!this.currentQA) return;
        
        try {
            const response = await fetch(`/api/quiz/qa/${this.currentQA.qa_id}/toggle-usable`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 更新本地数据
                this.currentQA.usable = result.usable;
                this.qaList[this.currentIndex].usable = result.usable;
                
                // 重新渲染
                this.renderQAList();
                this.renderQuestionArea();
                this.updateStatistics();  // 更新统计
                
                // 显示提示
                const statusText = result.usable ? '有效' : '无效';
                alert(`✓ 已标记为${statusText}`);
            }
        } catch (error) {
            console.error('切换有效性失败:', error);
            alert('❌ 操作失败');
        }
    }
    
    async resetAnswer() {
        if (!this.currentQA) return;
        
        if (!confirm('确定要重置答案吗？')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/quiz/qa/${this.currentQA.qa_id}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer: null })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 更新本地数据
                this.currentQA.human_answer = null;
                this.qaList[this.currentIndex].human_answer = null;
                
                // 重新渲染
                this.renderQAList();
                this.renderQuestionArea();
                this.updateStatistics();
                
                alert('✓ 答案已重置，可以重新作答');
            }
        } catch (error) {
            console.error('重置答案失败:', error);
            alert('❌ 重置失败');
        }
    }
    
    toggleGT() {
        this.showingGT = !this.showingGT;
        if (this.showingGT) {
            this.renderGT();
        } else {
            document.getElementById('gtDisplay').innerHTML = '';
        }
        
        // 更新按钮文本
        const btn = document.querySelector('.btn-show-gt');
        if (btn) {
            btn.innerHTML = `<i class="fas fa-eye"></i> ${this.showingGT ? '隐藏' : '显示'}答案`;
        }
    }
    
    renderGT() {
        if (!this.currentQA) return;
        
        const gt = this.currentQA.ground_truth || '未设置';
        document.getElementById('gtDisplay').innerHTML = `
            <div class="gt-display">
                <strong>正确答案:</strong> ${gt}
            </div>
        `;
    }
    
    // ==================== 视频播放 ====================
    
    playVideo() {
        if (!this.currentQA || !this.videoPlayer) return;
        
        const direction = this.currentQA.temporal_direction || 'Forward';
        const startTime = this.timeToSeconds(this.currentQA.start_time);
        const endTime = this.timeToSeconds(this.currentQA.end_time);
        const cutPoint = this.timeToSeconds(this.currentQA.cut_point || '00:00.00');
        
        let playStart, playEnd;
        
        if (direction === 'Forward') {
            // Forward: 播放前半段 [start_time, cut_point]
            playStart = startTime;
            playEnd = cutPoint || endTime;
        } else {
            // Backward: 播放后半段 [cut_point, end_time]
            playStart = cutPoint || startTime;
            playEnd = endTime;
        }
        
        this.videoPlayer.currentTime = playStart;
        this.videoPlayer.play();
        
        // 监听播放进度，到达结束时间时停止
        const checkTime = () => {
            if (this.videoPlayer.currentTime >= playEnd) {
                this.videoPlayer.pause();
                this.videoPlayer.removeEventListener('timeupdate', checkTime);
            }
        };
        
        this.videoPlayer.addEventListener('timeupdate', checkTime);
    }
    
    timeToSeconds(timeStr) {
        if (!timeStr) return 0;
        
        const parts = timeStr.split(':');
        if (parts.length !== 2) return 0;
        
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseFloat(parts[1]) || 0;
        
        return minutes * 60 + seconds;
    }
    
    // ==================== 导航 ====================
    
    gotoPrevious() {
        if (this.currentIndex > 0) {
            this.selectQA(this.currentIndex - 1);
        }
    }
    
    gotoNext() {
        if (this.currentIndex < this.qaList.length - 1) {
            this.selectQA(this.currentIndex + 1);
        }
    }
    
    // ==================== 工具方法 ====================
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化应用
const quizApp = new QuizApp();

