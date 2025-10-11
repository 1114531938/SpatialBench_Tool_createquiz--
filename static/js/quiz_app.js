// 答题模式应用
class QuizApp {
    constructor() {
        this.qaList = [];
        this.currentQA = null;
        this.currentIndex = -1;
        this.videoPlayer = null;
        this.showingGT = false;
        this.availablePerspectives = [];
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
            const titleAttr = !isUsable && qa.useless_reason ? `title="无效原因：${qa.useless_reason}"` : '';
            
            html += `
                <div class="${className}" onclick="quizApp.selectQA(${index})" ${titleAttr}>
                    <div class="qa-number">题目 ${index + 1}</div>
                    <div class="qa-status">
                        <i class="fas fa-${!isUsable ? 'ban' : (hasAnswer ? 'check-circle' : 'circle')}"></i>
                        ${statusText}
                    </div>
                    ${!isUsable && qa.useless_reason ? `
                    <div class="qa-reason" style="font-size: 11px; color: #dc3545; margin-top: 4px;">
                        <i class="fas fa-info-circle"></i> ${qa.useless_reason}
                    </div>
                    ` : ''}
                </div>
            `;
        });
        
        listEl.innerHTML = html;
    }
    
    updateStatistics() {
        const total = this.qaList.length;
        const usable = this.qaList.filter(qa => qa.usable !== false).length;
        const unusable = total - usable;
        
        // 计算有效且已答、有效且未答
        const usableAndAnswered = this.qaList.filter(qa => 
            qa.usable !== false && qa.human_answer !== null && qa.human_answer !== undefined
        ).length;
        const usableAndUnanswered = usable - usableAndAnswered;
        
        // 进度百分比：有效且已答 / 有效数量
        const progressPercent = usable > 0 ? ((usableAndAnswered / usable) * 100).toFixed(1) : 0;
        
        // 更新左侧面板统计数字
        const totalCountEl = document.getElementById('totalCount');
        const answeredCountEl = document.getElementById('answeredCount');
        const unansweredCountEl = document.getElementById('unansweredCount');
        const usableCountEl = document.getElementById('usableCount');
        const unusableCountEl = document.getElementById('unusableCount');
        const progressPercentEl = document.getElementById('progressPercent');
        
        if (totalCountEl) totalCountEl.textContent = total;
        if (answeredCountEl) answeredCountEl.textContent = usableAndAnswered;
        if (unansweredCountEl) unansweredCountEl.textContent = usableAndUnanswered;
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
        
        // 更新顶部进度 - 调用统一的统计更新函数
        this.updateStatistics();
        
        // 加载视频
        await this.loadVideo();
        
        // 渲染答题界面
        this.renderQuestionArea();
    }
    
    async loadVideo() {
        if (!this.currentQA) return;
        
        try {
            // 获取当前QA的视频名称和视角
            const videoName = this.currentQA.video_name;
            // 优先使用用户选择的视角，否则使用JSON中视角数组的第一个
            const perspective = this.currentQA.currentPerspective || 
                               (this.currentQA.视角 && this.currentQA.视角[0]) || 
                               null;
            
            // 构造视频路径
            let videoPath = '';
            if (perspective) {
                // 多视角：/static/videos/{video_name}/{perspective}
                videoPath = `/static/videos/${videoName}/${perspective}`;
            } else {
                // 单视角：/static/videos/{video_name}/{video_name}.mp4
                videoPath = `/static/videos/${videoName}/${videoName}.mp4`;
            }
            
            if (this.videoPlayer) {
                this.videoPlayer.src = videoPath;
                console.log('加载视频:', videoPath);
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
                    <span class="time-info">
                        <span class="time-label">
                            <i class="fas fa-play-circle"></i>
                            当前:
                        </span>
                        <span class="time-value" id="currentTimeDisplay">00:00.00</span>
                    </span>
                    <span class="time-info segment-info">
                        <span class="time-label">
                            <i class="fas fa-cut"></i>
                            片段:
                        </span>
                        <span class="time-value">${qa.start_time} - ${qa.end_time}</span>
                        ${qa.cut_point ? `
                        <span class="time-label">
                            <i class="fas fa-scissors"></i>
                            切分:
                        </span>
                        <span class="time-value">${qa.cut_point}</span>
                        ` : ''}
                    </span>
                </div>
                <div class="perspective-selection">
                    <span class="perspective-header">
                        <span class="perspective-label">
                            <i class="fas fa-video"></i>
                            视角:
                        </span>
                        <span class="current-perspective" id="currentPerspective">加载中...</span>
                    </span>
                    <span class="perspective-buttons" id="perspectiveButtons">
                        <!-- 视角按钮将动态生成 -->
                    </span>
                </div>
                <div class="video-controls">
                    <button class="play-btn" onclick="quizApp.playVideo()">
                        <i class="fas fa-play"></i> 播放${directionText}
                    </button>
                </div>
            </div>
            
            <!-- 问题部分 -->
            <div class="question-section">
                <div class="question-container">
                    <div class="question-left">
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
                            ${qa.usable === false && qa.useless_reason ? `
                            <span class="meta-tag" style="background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%); border-color: #dc3545; color: #dc3545;">
                                <i class="fas fa-exclamation-circle"></i> 无效：${qa.useless_reason}
                            </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="question-right">
                        <!-- 难度选择部分 -->
                        <div class="difficulty-section">
                            <div class="difficulty-header">
                                <i class="fas fa-layer-group"></i>
                                难度判断
                                <span class="required-badge">必选</span>
                            </div>
                            <div class="difficulty-buttons">
                                ${this.renderDifficultyButtons()}
                            </div>
                            <div class="difficulty-guide">
                                <h5>
                                    <i class="fas fa-info-circle"></i>
                                    判断标准
                                </h5>
                                <ul class="guide-list">
                                    <li class="guide-simple">
                                        <span class="guide-label">
                                            <i class="fas fa-smile"></i>
                                            简单：
                                        </span>
                                        <span class="guide-text">仅需观察即可回答</span>
                                    </li>
                                    <li class="guide-medium">
                                        <span class="guide-label">
                                            <i class="fas fa-meh"></i>
                                            中等：
                                        </span>
                                        <span class="guide-text">需要简单推理、记忆</span>
                                    </li>
                                    <li class="guide-difficulty">
                                        <span class="guide-label">
                                            <i class="fas fa-frown"></i>
                                            困难：
                                        </span>
                                        <span class="guide-text">需要复杂推理、深度理解</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 选项部分 -->
            <div class="options-section">
                <div class="options-container">
                    <div class="options-left">
                        ${this.renderOptions()}
                    </div>
                    <div class="options-right">
                        <div class="invalid-reasons-guide">
                            <h5>
                                <i class="fas fa-exclamation-triangle"></i>
                                无效原因说明
                            </h5>
                            <ul class="reasons-guide-list">
                                <li class="reason-guide-item">
                                    <span class="reason-guide-label">
                                        <i class="fas fa-tag"></i>
                                        问题类型错误：
                                    </span>
                                    <span class="reason-guide-text">问题分类不正确，如将计数题标记为推理题</span>
                                </li>
                                <li class="reason-guide-item">
                                    <span class="reason-guide-label">
                                        <i class="fas fa-eye"></i>
                                        问题视角不明晰：
                                    </span>
                                    <span class="reason-guide-text">视角选择不清晰，无法确定从哪个角度观察</span>
                                </li>
                                <li class="reason-guide-item">
                                    <span class="reason-guide-label">
                                        <i class="fas fa-bug"></i>
                                        问题本身有问题：
                                    </span>
                                    <span class="reason-guide-text">时间点突兀、提问对象模糊不明晰</span>
                                </li>
                                <li class="reason-guide-item">
                                    <span class="reason-guide-label">
                                        <i class="fas fa-clock"></i>
                                        时间区间不恰当：
                                    </span>
                                    <span class="reason-guide-text">cut point需要微调等情况</span>
                                </li>
                                <li class="reason-guide-item">
                                    <span class="reason-guide-label">
                                        <i class="fas fa-list-ul"></i>
                                        选项不恰当：
                                    </span>
                                    <span class="reason-guide-text">干扰项质量差（一眼假、多正确答案重复）、原答案错误等</span>
                                </li>
                                <li class="reason-guide-item">
                                    <span class="reason-guide-label">
                                        <i class="fas fa-ban"></i>
                                        无法作答彻底舍弃：
                                    </span>
                                    <span class="reason-guide-text">由于各种原因完全无法回答此问题</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
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
            // 直接从JSON中的"视角"属性获取可用视角列表
            const perspectives = this.currentQA.视角 || [];
            
            if (perspectives.length === 0) {
                document.getElementById('perspectiveButtons').innerHTML = '<div style="text-align: center; color: #999;">无可用视角</div>';
                this.availablePerspectives = [];
                return;
            }
            
            // 保存可用视角列表
            this.availablePerspectives = perspectives;
            this.renderPerspectiveButtons(perspectives);
            
        } catch (error) {
            console.error('加载视角信息失败:', error);
            this.availablePerspectives = [];
            document.getElementById('perspectiveButtons').innerHTML = '<div style="text-align: center; color: red;">加载失败</div>';
        }
    }
    
    renderPerspectiveButtons(perspectives) {
        // 获取当前选择的视角（如果有 currentPerspective 属性则使用，否则使用第一个）
        const currentPerspective = this.currentQA.currentPerspective || (this.currentQA.视角 && this.currentQA.视角[0]) || null;
        
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
            // 使用临时属性记录当前选择的视角，不修改JSON中的"视角"数组
            this.currentQA.currentPerspective = perspective;
            this.qaList[this.currentIndex].currentPerspective = perspective;
            
            // 重新加载视频
            await this.loadVideo();
            
            // 更新视角按钮状态
            if (this.availablePerspectives && this.availablePerspectives.length > 0) {
                this.renderPerspectiveButtons(this.availablePerspectives);
            }
            
            console.log('视角已切换为:', perspective);
            
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
            
            // 使用data-index来避免特殊字符的问题
            html += `
                <button class="${className}" 
                        style="${additionalStyle}"
                        data-option-index="${index}"
                        onclick="quizApp.selectOptionByIndex(${index})">
                    ${option}
                </button>
            `;
        });
        
        return html;
    }
    
    renderDifficultyButtons() {
        if (!this.currentQA) return '';
        
        const currentDifficulty = this.currentQA.difficulty || null;
        
        const difficulties = [
            { value: 'Simple', label: '简单', icon: 'fa-smile', className: 'simple' },
            { value: 'Medium', label: '中等', icon: 'fa-meh', className: 'medium' },
            { value: 'Difficulty', label: '困难', icon: 'fa-frown', className: 'difficulty' }
        ];
        
        let html = '';
        difficulties.forEach(diff => {
            const isActive = currentDifficulty === diff.value;
            const activeClass = isActive ? 'active' : '';
            
            html += `
                <button class="difficulty-btn ${diff.className} ${activeClass}" 
                        onclick="quizApp.setDifficulty('${diff.value}')">
                    <i class="fas ${diff.icon}"></i>
                    <span class="difficulty-label">${diff.label}</span>
                </button>
            `;
        });
        
        return html;
    }
    
    // ==================== 答题操作 ====================
    
    async selectOptionByIndex(index) {
        if (!this.currentQA) return;
        
        const options = this.currentQA.options || [];
        if (index < 0 || index >= options.length) return;
        
        const option = options[index];
        await this.selectOption(option);
    }
    
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
                
                // 只更新选项按钮，不重新渲染整个页面
                this.updateOptionsDisplay();
                
                // 更新左侧列表和统计
                this.renderQAList();
                this.updateStatistics();
            }
        } catch (error) {
            console.error('保存答案失败:', error);
            alert('❌ 保存失败');
        }
    }
    
    updateOptionsDisplay() {
        // 只更新选项按钮的显示状态，不重新渲染整个区域
        const optionsSection = document.querySelector('.options-section');
        if (!optionsSection) return;
        
        const options = this.currentQA.options || [];
        const humanAnswer = this.currentQA.human_answer;
        
        // 获取所有选项按钮
        const optionButtons = optionsSection.querySelectorAll('.option-btn');
        
        optionButtons.forEach((button, index) => {
            const option = options[index];
            const isSelected = (humanAnswer === option);
            
            // 更新选中状态类
            if (isSelected) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
            
            // 更新inline样式（与renderOptions保持一致）
            if (isSelected) {
                button.setAttribute('style', 'background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-color: #2196f3; font-weight: 600; color: #0d47a1;');
            } else {
                button.setAttribute('style', 'background: white; border-color: #e1e8ed; color: #333; cursor: pointer;');
            }
        });
    }
    
    async toggleUsable() {
        if (!this.currentQA) return;
        
        const currentUsable = this.currentQA.usable !== false;
        
        // 如果要标记为无效，显示原因选择对话框
        if (currentUsable) {
            this.showReasonModal();
        } else {
            // 如果要恢复有效，直接切换，清除原因
            this.performToggleUsable(null);
        }
    }
    
    showReasonModal() {
        const modal = document.getElementById('reasonModal');
        if (modal) {
            modal.classList.add('show');
            
            // 清除之前的选择
            const radios = document.querySelectorAll('input[name="useless_reason"]');
            radios.forEach(radio => {
                radio.checked = false;
            });
            
            // 如果已有原因，预选中
            if (this.currentQA.useless_reason) {
                const targetRadio = document.querySelector(`input[name="useless_reason"][value="${this.currentQA.useless_reason}"]`);
                if (targetRadio) {
                    targetRadio.checked = true;
                }
            }
            
            // 添加选项点击事件
            const options = document.querySelectorAll('.reason-option');
            options.forEach(option => {
                option.addEventListener('click', function() {
                    const radio = this.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.checked = true;
                        // 更新选中样式
                        document.querySelectorAll('.reason-option').forEach(opt => opt.classList.remove('selected'));
                        this.classList.add('selected');
                    }
                });
            });
        }
    }
    
    cancelReasonSelection() {
        const modal = document.getElementById('reasonModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    async setDifficulty(difficulty) {
        if (!this.currentQA) return;
        
        try {
            const response = await fetch(`/api/quiz/qa/${this.currentQA.qa_id}/difficulty`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ difficulty: difficulty })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 更新本地数据
                this.currentQA.difficulty = difficulty;
                this.qaList[this.currentIndex].difficulty = difficulty;
                
                // 更新难度按钮显示
                this.updateDifficultyButtons(difficulty);
                
                console.log(`✓ 难度已设置为: ${difficulty}`);
            } else {
                alert('❌ 设置难度失败');
            }
        } catch (error) {
            console.error('设置难度失败:', error);
            alert('❌ 设置难度失败');
        }
    }
    
    updateDifficultyButtons(selectedDifficulty) {
        // 更新难度按钮的激活状态
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // 根据选中的难度激活对应按钮
        const difficultyMap = {
            'Simple': '.difficulty-btn.simple',
            'Medium': '.difficulty-btn.medium',
            'Difficulty': '.difficulty-btn.difficulty'
        };
        
        const selector = difficultyMap[selectedDifficulty];
        if (selector) {
            const activeButton = document.querySelector(selector);
            if (activeButton) {
                activeButton.classList.add('active');
            }
        }
    }
    
    confirmReasonSelection() {
        const selectedReason = document.querySelector('input[name="useless_reason"]:checked');
        
        if (!selectedReason) {
            alert('请选择无效原因');
            return;
        }
        
        // 关闭对话框
        this.cancelReasonSelection();
        
        // 执行标记为无效，带上原因
        this.performToggleUsable(selectedReason.value);
    }
    
    async performToggleUsable(reason) {
        if (!this.currentQA) return;
        
        try {
            const response = await fetch(`/api/quiz/qa/${this.currentQA.qa_id}/toggle-usable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ useless_reason: reason })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 更新本地数据
                this.currentQA.usable = result.usable;
                this.qaList[this.currentIndex].usable = result.usable;
                
                // 更新无效原因
                if (reason) {
                    this.currentQA.useless_reason = reason;
                    this.qaList[this.currentIndex].useless_reason = reason;
                } else {
                    delete this.currentQA.useless_reason;
                    delete this.qaList[this.currentIndex].useless_reason;
                }
                
                // 只更新按钮显示
                this.updateUsableButton(result.usable);
                
                // 更新左侧列表和统计
                this.renderQAList();
                this.updateStatistics();
                
                // 显示提示
                const statusText = result.usable ? '有效' : '无效';
                const reasonText = reason ? `\n原因：${reason}` : '';
                alert(`✓ 已标记为${statusText}${reasonText}`);
            }
        } catch (error) {
            console.error('切换有效性失败:', error);
            alert('❌ 操作失败');
        }
    }
    
    updateUsableButton(usable) {
        // 只更新"标记为有效/无效"按钮的状态
        const usableBtn = document.querySelector('.btn-toggle-usable');
        if (!usableBtn) return;
        
        const icon = usableBtn.querySelector('i');
        const btnText = usableBtn.childNodes[usableBtn.childNodes.length - 1];
        
        if (usable === false) {
            // 当前无效，显示"标记为有效"
            usableBtn.classList.add('unusable');
            if (icon) {
                icon.className = 'fas fa-check';
            }
            if (btnText) {
                btnText.textContent = ' 标记为有效';
            }
        } else {
            // 当前有效，显示"标记为无效"
            usableBtn.classList.remove('unusable');
            if (icon) {
                icon.className = 'fas fa-ban';
            }
            if (btnText) {
                btnText.textContent = ' 标记为无效';
            }
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

