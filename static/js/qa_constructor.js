// QA构造模式应用
class QAConstructorApp {
    constructor() {
        this.videos = [];
        this.currentVideo = null;
        this.currentQA = null;
        this.videoPlayer = null;
        this.allPerspectives = []; // 所有可用视角
        this.selectedMainPerspectives = []; // 主视角列表
        this.selectedQuestionPerspective = null; // 提问视角
        this.currentPlayingPerspective = null; // 当前播放的视角
        this.pendingPerspective = null; // 待添加的视角（用于对话框）
        this.init();
    }
    
    init() {
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
                    <div class="file-item" onclick="constructorApp.loadFile('${file.name}')">
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
            const response = await fetch('/api/constructor/load-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_name: fileName })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.hideFileSelector();
                await this.loadVideos();
                document.getElementById('currentFileName').textContent = fileName;
                alert(`成功加载: ${fileName}`);
            } else {
                alert('加载失败: ' + result.error);
            }
        } catch (error) {
            console.error('加载文件失败:', error);
            alert('加载文件失败');
        }
    }
    
    async saveFile() {
        try {
            const response = await fetch('/api/constructor/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('✓ 保存成功');
            } else {
                alert('❌ 保存失败');
            }
        } catch (error) {
            console.error('保存失败:', error);
            alert('❌ 保存失败');
        }
    }
    
    // ==================== Video列表加载 ====================
    
    async loadVideos() {
        try {
            const response = await fetch('/api/constructor/videos');
            const data = await response.json();
            
            if (data.videos) {
                this.videos = data.videos;
                this.renderVideoList();
                this.updateStatistics();
            }
        } catch (error) {
            console.error('加载Video列表失败:', error);
        }
    }
    
    renderVideoList() {
        const listEl = document.getElementById('videoList');
        if (!listEl) return;
        
        if (this.videos.length === 0) {
            listEl.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无Video</div>';
            return;
        }
        
        let html = '';
        this.videos.forEach((video, index) => {
            const isActive = this.currentVideo && this.currentVideo.video_name === video.video_name;
            const className = isActive ? 'segment-item active expanded' : 'segment-item';
            
            html += `
                <div class="${className}" id="video-${video.video_name}">
                    <div class="segment-header" onclick="constructorApp.toggleVideo('${video.video_name}')">
                        <span class="segment-title">${video.video_name}</span>
                        <span class="segment-qa-count">${video.qa_count} QA</span>
                    </div>
                    <div class="qa-sublist" id="qa-list-${video.video_name}">
                        <!-- QA子列表将动态加载 -->
                    </div>
                    <button class="add-qa-btn" onclick="constructorApp.addNewQA('${video.video_name}')">
                        <i class="fas fa-plus"></i> 添加新QA
                    </button>
                </div>
            `;
        });
        
        listEl.innerHTML = html;
        
        // 如果当前有选中的video，加载其QA列表
        if (this.currentVideo) {
            this.loadVideoQAs(this.currentVideo.video_name);
        }
    }
    
    async toggleVideo(videoName) {
        const videoEl = document.getElementById(`video-${videoName}`);
        if (!videoEl) return;
        
        const isExpanded = videoEl.classList.contains('expanded');
        
        // 收起所有其他video
        document.querySelectorAll('.segment-item').forEach(el => {
            el.classList.remove('expanded', 'active');
        });
        
        if (!isExpanded) {
            // 展开当前video
            videoEl.classList.add('expanded', 'active');
            this.currentVideo = this.videos.find(v => v.video_name === videoName);
            await this.loadVideoQAs(videoName);
        } else {
            this.currentVideo = null;
        }
    }
    
    async loadVideoQAs(videoName) {
        try {
            const response = await fetch(`/api/constructor/video/${videoName}/qas`);
            const data = await response.json();
            
            if (data.qas) {
                const listEl = document.getElementById(`qa-list-${videoName}`);
                if (!listEl) return;
                
                if (data.qas.length === 0) {
                    listEl.innerHTML = '<div style="text-align: center; color: #999; padding: 10px; font-size: 12px;">暂无QA</div>';
                    return;
                }
                
                let html = '';
                data.qas.forEach((qa, index) => {
                    const isActive = this.currentQA && this.currentQA.qa_id === qa.qa_id;
                    const className = isActive ? 'qa-subitem active' : 'qa-subitem';
                    const version = qa.version ? `<span class="version-badge">${qa.version}</span>` : '';
                    
                    html += `
                        <div class="${className}" onclick="constructorApp.selectQA('${qa.qa_id}')">
                            QA ${index + 1}${version}
                        </div>
                    `;
                });
                
                listEl.innerHTML = html;
            }
        } catch (error) {
            console.error('加载QA列表失败:', error);
        }
    }
    
    async updateStatistics() {
        try {
            const response = await fetch('/api/constructor/statistics');
            const data = await response.json();
            
            document.getElementById('videoCount').textContent = data.total_videos || 0;
            document.getElementById('totalQAs').textContent = data.total_qas || 0;
            document.getElementById('v2QAs').textContent = data.v2_qas || 0;
        } catch (error) {
            console.error('更新统计失败:', error);
        }
    }
    
    // ==================== QA选择与编辑 ====================
    
    async selectQA(qaId) {
        try {
            console.log('=== selectQA ===');
            console.log('选择QA:', qaId);
            
            const response = await fetch(`/api/constructor/qa/${qaId}`);
            const data = await response.json();
            
            if (data.qa) {
                this.currentQA = data.qa;
                console.log('QA数据已加载:', this.currentQA);
                
                // ⭐ 先加载视角信息（但不渲染，因为DOM元素还不存在）
                await this.loadPerspectivesData();
                
                // 然后渲染编辑器（创建DOM元素）
                this.renderQAEditor();
                
                // ⭐ 最后渲染视角到界面（DOM元素已存在）
                this.renderPerspectives();
                
                // 更新QA列表的选中状态
                document.querySelectorAll('.qa-subitem').forEach(el => {
                    el.classList.remove('active');
                });
                const activeEl = document.querySelector(`.qa-subitem[onclick*="${qaId}"]`);
                if (activeEl) {
                    activeEl.classList.add('active');
                }
            }
        } catch (error) {
            console.error('加载QA失败:', error);
        }
    }
    
    async addNewQA(videoName) {
        if (!confirm('确定要添加新的QA吗？')) {
            return;
        }
        
        try {
            // 创建空QA (默认无效，标注完成后改为有效)
            const newQAData = {
                '主视角': [],
                '提问视角': [],
                '提问视角_time': null,
                'question': '',
                'options': [],
                'ground_truth': '',
                'question_type': '',
                'temporal_direction': '',
                'cut_point': '',
                'usable': false,
                'useless_reason': ''
            };
            
            const response = await fetch(`/api/constructor/video/${videoName}/qa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newQAData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 重新加载video的QA列表
                await this.loadVideoQAs(videoName);
                
                // 更新统计
                await this.updateStatistics();
                await this.loadVideos();
                
                alert('✓ 新QA已创建');
                
                // 自动选中新创建的QA（列表中的最后一个）
                if (result.qas && result.qas.length > 0) {
                    const newQA = result.qas[result.qas.length - 1];
                    await this.selectQA(newQA.qa_id);
                }
            } else {
                alert('❌ 创建失败');
            }
        } catch (error) {
            console.error('创建新QA失败:', error);
            alert('❌ 创建失败');
        }
    }
    
    renderQAEditor() {
        if (!this.currentQA) {
            document.getElementById('contentArea').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-hand-pointer"></i>
                    <h3>请从左侧列表选择一个QA开始编辑</h3>
                </div>
            `;
            return;
        }
        
        const qa = this.currentQA;
        const versionBadge = qa.version ? `<span class="version-badge">${qa.version}</span>` : '';
        
        // 左栏：视频播放器 + 视角管理
        const leftColumn = `
            <div class="content-left-column">
                <!-- 视频部分 -->
                <div class="video-section">
                <video id="videoPlayer" class="video-player" controls>
                    <source src="" type="video/mp4">
                </video>
                <div class="video-time-display">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                        <span class="time-info">
                            <span class="time-label">当前:</span>
                            <span class="time-value" id="currentTimeDisplay">00:00.00</span>
                        </span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <button class="set-cutpoint-btn" onclick="constructorApp.setCurrentTimeToCutPoint()">
                            <i class="fas fa-scissors"></i> 设为cut_point
                        </button>
                        <button class="set-question-time-btn" onclick="constructorApp.setCurrentTimeToQuestionTime()">
                            <i class="fas fa-clock"></i> 设为提问时间
                        </button>
                    </div>
                </div>
                
                <!-- 视频播放控制 -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0;">
                    <button onclick="constructorApp.playForward()" 
                            style="padding: 10px 15px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 700; transition: all 0.3s; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);">
                        <i class="fas fa-play"></i> 播放前半段
                    </button>
                    <button onclick="constructorApp.playBackward()" 
                            style="padding: 10px 15px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 700; transition: all 0.3s; background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);">
                        <i class="fas fa-play"></i> 播放后半段
                    </button>
                </div>
            </div>
                
                <!-- 视角选择三栏 -->
                <div class="perspective-section">
                    <div class="perspective-columns">
                        <!-- 所有视角列表 -->
                        <div class="perspective-column">
                            <div class="perspective-column-title">
                                <i class="fas fa-video"></i> 所有视角
                            </div>
                            <div class="perspective-list" id="allPerspectivesList">
                                <div style="text-align: center; color: #999; font-size: 12px;">加载中...</div>
                            </div>
                        </div>
                        
                        <!-- 主视角（视角字段） -->
                        <div class="perspective-column">
                            <div class="perspective-column-title">
                                <i class="fas fa-eye"></i> 主视角
                            </div>
                            <div class="perspective-list" id="mainPerspectivesList">
                                <div style="text-align: center; color: #999; font-size: 12px;">暂无</div>
                            </div>
                        </div>
                        
                        <!-- 提问视角 -->
                        <div class="perspective-column">
                            <div class="perspective-column-title">
                                <i class="fas fa-question-circle"></i> 提问视角
                            </div>
                            <div class="perspective-list" id="questionPerspectiveDisplay">
                                <div style="text-align: center; color: #999; font-size: 12px;">暂无</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 右栏：编辑表单
        const rightColumn = `
            <div class="content-right-column">
                <!-- 基本信息编辑 -->
            <div class="edit-section">
                <h3><i class="fas fa-info-circle"></i> 基本信息${versionBadge}</h3>
                
                <div class="form-group">
                    <label class="form-label">QA ID</label>
                    <input type="text" class="form-input readonly-field" value="${qa.qa_id}" readonly>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Video Name</label>
                    <input type="text" class="form-input readonly-field" value="${qa.video_name}" readonly>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">问题</label>
                    <textarea class="form-input" id="questionInput" 
                              onchange="constructorApp.updateField('question', this.value)">${qa.question || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">问题类型</label>
                    <select class="form-select" id="questionTypeSelect" 
                            onchange="constructorApp.updateField('question_type', this.value)">
                        <option value="">请选择</option>
                        <option value="Planning" ${qa.question_type === 'Planning' ? 'selected' : ''}>Planning</option>
                        <option value="Relation" ${qa.question_type === 'Relation' ? 'selected' : ''}>Relation</option>
                        <option value="Relative Distance" ${qa.question_type === 'Relative Distance' ? 'selected' : ''}>Relative Distance</option>
                        <option value="Appearance Order" ${qa.question_type === 'Appearance Order' ? 'selected' : ''}>Appearance Order</option>
                        <option value="Relative Size" ${qa.question_type === 'Relative Size' ? 'selected' : ''}>Relative Size</option>
                        <option value="Spatial State" ${qa.question_type === 'Spatial State' ? 'selected' : ''}>Spatial State</option>
                        <option value="Relative Speed" ${qa.question_type === 'Relative Speed' ? 'selected' : ''}>Relative Speed</option>
                        <option value="Counting" ${qa.question_type === 'Counting' ? 'selected' : ''}>Counting</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label required">时间方向</label>
                    <select class="form-select" id="temporalDirectionSelect" 
                            onchange="constructorApp.updateField('temporal_direction', this.value)">
                        <option value="">请选择</option>
                        <option value="forward" ${qa.temporal_direction && qa.temporal_direction.toLowerCase() === 'forward' ? 'selected' : ''}>forward</option>
                        <option value="backward" ${qa.temporal_direction && qa.temporal_direction.toLowerCase() === 'backward' ? 'selected' : ''}>backward</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">开始时间 (MM:SS.XX)</label>
                    <input type="text" class="form-input" id="startTimeInput" 
                           value="${qa.start_time || ''}"
                           onchange="constructorApp.updateField('start_time', this.value)">
                </div>
                
                <div class="form-group">
                    <label class="form-label">结束时间 (MM:SS.XX)</label>
                    <input type="text" class="form-input" id="endTimeInput" 
                           value="${qa.end_time || ''}"
                           onchange="constructorApp.updateField('end_time', this.value)">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Cut Point (MM:SS.XX)</label>
                    <input type="text" class="form-input" id="cutPointInput" 
                           value="${qa.cut_point || ''}"
                           onchange="constructorApp.updateField('cut_point', this.value)">
                </div>
                
                <div class="form-group">
                    <label class="form-label">提问视角时间点 (HH:MM:SS)</label>
                    <input type="text" class="form-input" id="questionPerspectiveTimeInput" 
                           value="${qa.提问视角_time || ''}"
                           placeholder="例如：00:57:00"
                           onchange="constructorApp.updateField('提问视角_time', this.value)">
                </div>
            </div>
            
            <!-- 选项编辑 -->
            <div class="edit-section">
                <h3><i class="fas fa-list-ul"></i> 选项</h3>
                <div class="options-editor" id="optionsEditor">
                    <!-- 选项列表将动态生成 -->
                </div>
                <button class="option-add-btn" onclick="constructorApp.addOption()">
                    <i class="fas fa-plus"></i> 添加选项
                </button>
            </div>
            
            <!-- 答案 -->
            <div class="edit-section">
                <h3><i class="fas fa-check-circle"></i> 答案</h3>
                <div class="form-group">
                    <label class="form-label required">Ground Truth</label>
                    <input type="text" class="form-input" id="groundTruthInput" 
                           value="${qa.ground_truth || ''}"
                           onchange="constructorApp.updateField('ground_truth', this.value)">
                </div>
            </div>
            
            <!-- 问题有效性 -->
            <div class="edit-section">
                <h3><i class="fas fa-check-square"></i> 问题有效性</h3>
                <div class="form-group">
                    <label class="form-label">问题是否有效</label>
                    <select class="form-select" id="usableSelect" 
                            onchange="constructorApp.handleUsableChange(this.value)">
                        <option value="true" ${qa.usable === true || qa.usable === 'true' ? 'selected' : ''}>有效 (true)</option>
                        <option value="false" ${qa.usable === false || qa.usable === 'false' ? 'selected' : ''}>无效 (false)</option>
                    </select>
                </div>
                
                <div class="form-group" id="uselessReasonGroup" style="display: ${qa.usable === false || qa.usable === 'false' ? 'block' : 'none'};">
                    <label class="form-label required">无效原因</label>
                    <select class="form-select" id="uselessReasonSelect" 
                            onchange="constructorApp.updateField('useless_reason', this.value)">
                        <option value="">请选择无效原因</option>
                        <option value="问题类型错误" ${qa.useless_reason === '问题类型错误' ? 'selected' : ''}>问题类型错误</option>
                        <option value="问题视角不明晰" ${qa.useless_reason === '问题视角不明晰' ? 'selected' : ''}>问题视角不明晰</option>
                        <option value="问题本身有问题" ${qa.useless_reason === '问题本身有问题' ? 'selected' : ''}>问题本身有问题</option>
                        <option value="时间区间不恰当" ${qa.useless_reason === '时间区间不恰当' ? 'selected' : ''}>时间区间不恰当</option>
                        <option value="选项不恰当" ${qa.useless_reason === '选项不恰当' ? 'selected' : ''}>选项不恰当</option>
                        <option value="无法作答彻底舍弃" ${qa.useless_reason === '无法作答彻底舍弃' ? 'selected' : ''}>无法作答彻底舍弃</option>
                    </select>
                    <div style="font-size: 12px; color: #666; margin-top: 8px;">
                        <i class="fas fa-info-circle"></i> 请选择问题无效的具体原因
                    </div>
                </div>
            </div>
            
                <!-- 操作按钮 -->
                <div class="action-buttons">
                    <button class="action-btn btn-delete" onclick="constructorApp.deleteQA()">
                        <i class="fas fa-trash"></i> 删除此QA
                    </button>
                </div>
            </div>
        `;
        
        // 组合左右两栏
        const html = leftColumn + rightColumn;
        
        document.getElementById('contentArea').innerHTML = html;
        
        // 重新获取video元素引用
        this.videoPlayer = document.getElementById('videoPlayer');
        
        // 添加时间更新监听器
        this.setupTimeDisplay();
        
        // 渲染选项列表
        this.renderOptions();
        
        // ⭐ 最后加载视频（此时视角信息已经准备好）
        this.loadVideo();
    }
    
    async loadVideo(specificPerspective = null) {
        if (!this.currentQA) return;
        
        try {
            const videoName = this.currentQA.video_name;
            console.log('[loadVideo] 加载video:', videoName);
            
            // 确定要使用的视角
            let perspective = null;
            
            if (specificPerspective) {
                // 如果指定了视角，使用指定的视角
                perspective = specificPerspective;
                console.log('[loadVideo] 使用指定视角:', perspective);
            } else {
                // 自动选择视角
                const validMainPerspectives = this.selectedMainPerspectives.filter(p => p && p !== 'null');
                
                if (validMainPerspectives.length > 0) {
                    perspective = validMainPerspectives[0];
                    console.log('[loadVideo] 使用主视角:', perspective);
                } else if (this.selectedQuestionPerspective && this.selectedQuestionPerspective !== 'null') {
                    perspective = this.selectedQuestionPerspective;
                    console.log('[loadVideo] 使用提问视角:', perspective);
                } else if (this.allPerspectives && this.allPerspectives.length > 0) {
                    perspective = this.allPerspectives[0];
                    console.log('[loadVideo] 使用第一个可用视角:', perspective);
                }
            }
            
            // 构建视频路径
            let videoPath = '';
            if (perspective) {
                videoPath = `/static/videos/${videoName}/${perspective}`;
                this.currentPlayingPerspective = perspective;
            } else {
                // 单视角视频
                videoPath = `/static/videos/${videoName}/${videoName}.mp4`;
                this.currentPlayingPerspective = `${videoName}.mp4`;
                console.log('[loadVideo] 使用单视角模式');
            }
            
            if (this.videoPlayer) {
                const currentTime = this.videoPlayer.currentTime || 0;
                this.videoPlayer.src = videoPath;
                console.log('[loadVideo] 视频路径:', videoPath);
                console.log('[loadVideo] 当前播放视角:', this.currentPlayingPerspective);
                
                // 保持当前播放时间
                if (currentTime > 0) {
                    this.videoPlayer.currentTime = currentTime;
                }
                
                // 添加错误处理
                this.videoPlayer.onerror = (e) => {
                    console.error('[loadVideo] 视频加载错误:', e);
                    console.error('[loadVideo] 尝试的路径:', videoPath);
                    alert('⚠️ 视频加载失败，请检查视频文件是否存在：' + videoPath);
                };
                
                this.videoPlayer.onloadeddata = () => {
                    console.log('[loadVideo] ✓ 视频加载成功');
                    // 更新视角显示
                    this.renderPerspectives();
                };
            }
        } catch (error) {
            console.error('[loadVideo] 异常:', error);
        }
    }
    
    // 切换到指定的主视角播放
    switchToPerspective(index) {
        console.log('=== switchToPerspective ===');
        console.log('切换到主视角索引:', index);
        
        if (!this.selectedMainPerspectives || index < 0 || index >= this.selectedMainPerspectives.length) {
            console.error('无效的索引');
            return;
        }
        
        const perspective = this.selectedMainPerspectives[index];
        console.log('切换到视角:', perspective);
        
        this.loadVideo(perspective);
    }
    
    // 切换到提问视角播放
    switchToQuestionPerspective() {
        console.log('=== switchToQuestionPerspective ===');
        console.log('切换到提问视角:', this.selectedQuestionPerspective);
        
        if (!this.selectedQuestionPerspective) {
            console.error('没有提问视角');
            return;
        }
        
        this.loadVideo(this.selectedQuestionPerspective);
    }
    
    setupTimeDisplay() {
        if (!this.videoPlayer) return;
        
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
    
    setCurrentTimeToCutPoint() {
        if (!this.videoPlayer) return;
        
        const currentTime = this.videoPlayer.currentTime;
        const timeStr = this.formatTimeWithDecimals(currentTime);
        
        // 更新输入框
        const cutPointInput = document.getElementById('cutPointInput');
        if (cutPointInput) {
            cutPointInput.value = timeStr;
        }
        
        // 更新数据
        this.updateField('cut_point', timeStr);
        
        alert(`✓ Cut Point已设置为: ${timeStr}`);
    }
    
    setCurrentTimeToQuestionTime() {
        if (!this.videoPlayer) return;
        
        const currentTime = this.videoPlayer.currentTime;
        // 转换为HH:MM:SS格式
        const hours = Math.floor(currentTime / 3600);
        const minutes = Math.floor((currentTime % 3600) / 60);
        const seconds = Math.floor(currentTime % 60);
        
        const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // 更新输入框
        const questionTimeInput = document.getElementById('questionPerspectiveTimeInput');
        if (questionTimeInput) {
            questionTimeInput.value = timeStr;
        }
        
        // 更新数据
        this.updateField('提问视角_time', timeStr);
        
        alert(`✓ 提问视角时间已设置为: ${timeStr}`);
    }
    
    // 时间格式转换：MM:SS.XX → 秒数
    timeToSeconds(timeStr) {
        if (!timeStr) return 0;
        
        const parts = timeStr.split(':');
        if (parts.length !== 2) return 0;
        
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseFloat(parts[1]) || 0;
        
        return minutes * 60 + seconds;
    }
    
    // 播放前半段 (start_time → cut_point)
    playForward() {
        if (!this.currentQA || !this.videoPlayer) return;
        
        const startTime = this.timeToSeconds(this.currentQA.start_time);
        const cutPoint = this.timeToSeconds(this.currentQA.cut_point);
        
        if (!cutPoint || cutPoint === 0) {
            alert('⚠️ 请先设置cut_point');
            return;
        }
        
        // 设置播放区间
        this.videoPlayer.currentTime = startTime;
        this.videoPlayer.play();
        
        // 监听播放进度，到达cut_point时停止
        const checkTime = () => {
            if (this.videoPlayer.currentTime >= cutPoint) {
                this.videoPlayer.pause();
                this.videoPlayer.removeEventListener('timeupdate', checkTime);
            }
        };
        
        this.videoPlayer.addEventListener('timeupdate', checkTime);
    }
    
    // 播放后半段 (cut_point → end_time)
    playBackward() {
        if (!this.currentQA || !this.videoPlayer) return;
        
        const cutPoint = this.timeToSeconds(this.currentQA.cut_point);
        const endTime = this.timeToSeconds(this.currentQA.end_time);
        
        if (!cutPoint || cutPoint === 0) {
            alert('⚠️ 请先设置cut_point');
            return;
        }
        
        // 设置播放区间
        this.videoPlayer.currentTime = cutPoint;
        this.videoPlayer.play();
        
        // 监听播放进度，到达end_time时停止
        const checkTime = () => {
            if (this.videoPlayer.currentTime >= endTime) {
                this.videoPlayer.pause();
                this.videoPlayer.removeEventListener('timeupdate', checkTime);
            }
        };
        
        this.videoPlayer.addEventListener('timeupdate', checkTime);
    }
    
    // ==================== 视角管理 ====================
    
    // 加载视角数据（不渲染到界面）
    async loadPerspectivesData() {
        if (!this.currentQA) return;
        
        try {
            const videoName = this.currentQA.video_name;
            console.log(`[loadPerspectivesData] 加载video ${videoName} 的视角`);
            
            const response = await fetch(`/api/constructor/video/${videoName}/perspectives`);
            const data = await response.json();
            
            console.log('[loadPerspectivesData] API返回的视角:', data.perspectives);
            
            if (data.perspectives) {
                // 过滤掉null和无效值
                this.allPerspectives = data.perspectives.filter(p => 
                    p && p !== null && p !== 'null' && p !== undefined && p !== 'undefined' && String(p).trim() !== ''
                );
                
                console.log('[loadPerspectivesData] 过滤后的所有视角:', this.allPerspectives);
                
                // 只使用"主视角"字段
                const rawPerspectives = this.currentQA['主视角'] || [];
                console.log('[loadPerspectivesData] 原始主视角:', rawPerspectives);
                
                this.selectedMainPerspectives = rawPerspectives.filter(p => 
                    p && p !== null && p !== 'null' && p !== undefined && p !== 'undefined' && String(p).trim() !== ''
                );
                console.log('[loadPerspectivesData] 过滤后的主视角:', this.selectedMainPerspectives);
                
                // 加载提问视角
                const rawQuestionPerspectives = this.currentQA['提问视角'] || [];
                console.log('[loadPerspectivesData] 原始提问视角:', rawQuestionPerspectives);
                
                const validQuestionPerspectives = rawQuestionPerspectives.filter(p => 
                    p && p !== null && p !== 'null' && p !== undefined && p !== 'undefined' && String(p).trim() !== ''
                );
                this.selectedQuestionPerspective = validQuestionPerspectives.length > 0 ? validQuestionPerspectives[0] : null;
                console.log('[loadPerspectivesData] 最终提问视角:', this.selectedQuestionPerspective);
            }
        } catch (error) {
            console.error('加载视角失败:', error);
        }
    }
    
    renderPerspectives() {
        console.log('=== renderPerspectives ===');
        console.log('所有视角:', this.allPerspectives);
        console.log('主视角:', this.selectedMainPerspectives);
        console.log('提问视角:', this.selectedQuestionPerspective);
        console.log('当前播放视角:', this.currentPlayingPerspective);
        
        // 渲染所有视角列表 - 使用索引
        const allListEl = document.getElementById('allPerspectivesList');
        if (allListEl) {
            if (!this.allPerspectives || this.allPerspectives.length === 0) {
                allListEl.innerHTML = '<div style="text-align: center; color: #999; font-size: 12px;">无可用视角</div>';
            } else {
                let html = '';
                this.allPerspectives.forEach((perspective, index) => {
                    // 只渲染有效的视角
                    if (typeof perspective === 'string' && perspective.length > 0 && perspective !== 'null') {
                        const escapedPerspective = this.escapeHtml(perspective);
                        const isPlaying = perspective === this.currentPlayingPerspective;
                        const playingClass = isPlaying ? ' style="background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%); color: #333; font-weight: 700;"' : '';
                        html += `
                            <div class="perspective-item" onclick="constructorApp.clickPerspectiveByIndex(${index})"${playingClass}>
                                ${isPlaying ? '▶️ ' : ''}${escapedPerspective}
                            </div>
                        `;
                    }
                });
                allListEl.innerHTML = html || '<div style="text-align: center; color: #999; font-size: 12px;">无有效视角</div>';
            }
        }
        
        // 渲染主视角列表
        const mainListEl = document.getElementById('mainPerspectivesList');
        if (mainListEl) {
            if (!this.selectedMainPerspectives || this.selectedMainPerspectives.length === 0) {
                mainListEl.innerHTML = '<div style="text-align: center; color: #999; font-size: 12px;">暂无</div>';
            } else {
                let html = '';
                this.selectedMainPerspectives.forEach((perspective, index) => {
                    const escapedPerspective = this.escapeHtml(perspective);
                    const isPlaying = perspective === this.currentPlayingPerspective;
                    const playingClass = isPlaying ? ' style="background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%); color: #333; font-weight: 700;"' : '';
                    html += `
                        <div class="perspective-item selected"${playingClass}>
                            <div style="flex: 1; cursor: pointer;" onclick="constructorApp.switchToPerspective(${index})">
                                ${isPlaying ? '▶️ ' : ''}${escapedPerspective}
                            </div>
                            <button class="remove-btn" onclick="constructorApp.removeMainByIndex(${index})">移除</button>
                        </div>
                    `;
                });
                mainListEl.innerHTML = html;
            }
        }
        
        // 渲染提问视角
        const questionEl = document.getElementById('questionPerspectiveDisplay');
        if (questionEl) {
            console.log('[渲染提问视角] selectedQuestionPerspective:', this.selectedQuestionPerspective);
            if (!this.selectedQuestionPerspective) {
                questionEl.innerHTML = '<div style="text-align: center; color: #999; font-size: 12px;">暂无</div>';
                console.log('[渲染提问视角] 显示暂无');
            } else {
                const escapedPerspective = this.escapeHtml(this.selectedQuestionPerspective);
                const isPlaying = this.selectedQuestionPerspective === this.currentPlayingPerspective;
                const playingClass = isPlaying ? ' style="background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%); color: #333; font-weight: 700;"' : '';
                const questionHtml = `
                    <div class="perspective-item selected"${playingClass}>
                        <div style="flex: 1; cursor: pointer;" onclick="constructorApp.switchToQuestionPerspective()">
                            ${isPlaying ? '▶️ ' : ''}${escapedPerspective}
                        </div>
                        <button class="remove-btn" onclick="constructorApp.clearQuestionPerspective()">移除</button>
                    </div>
                `;
                questionEl.innerHTML = questionHtml;
                console.log('[渲染提问视角] 已显示:', escapedPerspective);
            }
        } else {
            console.error('[渲染提问视角] 找不到questionPerspectiveDisplay元素！');
        }
    }
    
    // 通过索引点击视角
    clickPerspectiveByIndex(index) {
        console.log('=== clickPerspectiveByIndex ===');
        console.log('索引:', index);
        console.log('allPerspectives:', this.allPerspectives);
        
        if (!this.allPerspectives || index < 0 || index >= this.allPerspectives.length) {
            console.error('无效的索引！');
            alert('⚠️ 无效的索引');
            return;
        }
        
        const perspective = this.allPerspectives[index];
        console.log('选中的视角:', perspective, '类型:', typeof perspective);
        
        if (typeof perspective !== 'string' || perspective.length === 0 || perspective === 'null') {
            console.error('无效的视角！');
            alert('⚠️ 无效的视角');
            return;
        }
        
        this.pendingPerspective = perspective;
        console.log('pendingPerspective已设置:', this.pendingPerspective);
        
        // 显示对话框
        const modal = document.getElementById('perspectiveModal');
        if (modal) {
            modal.classList.add('show');
            console.log('对话框已显示');
        } else {
            console.error('找不到对话框元素！');
        }
    }
    
    // 移除主视角（通过索引）
    async removeMainByIndex(index) {
        console.log('=== removeMainByIndex ===');
        console.log('移除索引:', index);
        
        if (!this.selectedMainPerspectives || index < 0 || index >= this.selectedMainPerspectives.length) {
            return;
        }
        
        const removed = this.selectedMainPerspectives[index];
        this.selectedMainPerspectives.splice(index, 1);
        
        console.log('移除的视角:', removed);
        console.log('剩余主视角:', this.selectedMainPerspectives);
        
        // 保存到"主视角"字段
        await this.updateField('主视角', this.selectedMainPerspectives);
        
        // ⭐ 主视角和提问视角独立，移除主视角不影响提问视角
        console.log('提问视角保持不变:', this.selectedQuestionPerspective);
        
        this.renderPerspectives();
        
        // 如果移除的视角正在播放，切换到第一个主视角或提问视角
        if (this.currentPlayingPerspective === removed) {
            if (this.selectedMainPerspectives.length > 0) {
                this.loadVideo(this.selectedMainPerspectives[0]);
            } else if (this.selectedQuestionPerspective) {
                this.loadVideo(this.selectedQuestionPerspective);
            }
        }
    }
    
    // 清除提问视角
    async clearQuestionPerspective() {
        console.log('=== clearQuestionPerspective ===');
        this.selectedQuestionPerspective = null;
        await this.updateField('提问视角', []);
        this.renderPerspectives();
    }
    
    // HTML转义工具方法
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    
    // 取消视角选择
    cancelPerspectiveSelection() {
        this.pendingPerspective = null;
        const modal = document.getElementById('perspectiveModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    // 确认添加到主视角
    async confirmAddToMain() {
        console.log('=== confirmAddToMain ===');
        console.log('pendingPerspective:', this.pendingPerspective);
        
        if (!this.pendingPerspective) {
            console.error('没有待添加的视角');
            return;
        }
        
        const perspectiveToAdd = this.pendingPerspective;
        
        // 先关闭对话框
        this.cancelPerspectiveSelection();
        this.pendingPerspective = null;
        
        // 检查是否已存在
        if (this.selectedMainPerspectives.includes(perspectiveToAdd)) {
            alert('该视角已在主视角列表中');
            return;
        }
        
        // 添加到数组
        this.selectedMainPerspectives.push(perspectiveToAdd);
        console.log('添加后的主视角列表:', this.selectedMainPerspectives);
        
        // 保存到"主视角"字段
        const success = await this.updateField('主视角', this.selectedMainPerspectives);
        
        if (success) {
            console.log('✓ 主视角保存成功');
            alert('✓ 主视角已添加: ' + perspectiveToAdd);
            this.renderPerspectives();
            this.loadVideo(perspectiveToAdd); // 自动播放新添加的视角
        } else {
            console.error('✗ 主视角保存失败');
            alert('❌ 主视角保存失败');
            this.selectedMainPerspectives.pop(); // 回滚
        }
    }
    
    // 确认立即播放此视角
    confirmPlayPerspective() {
        console.log('=== confirmPlayPerspective ===');
        console.log('待播放的视角:', this.pendingPerspective);
        
        if (!this.pendingPerspective) {
            console.error('没有待播放的视角');
            return;
        }
        
        const perspectiveToPlay = this.pendingPerspective;
        this.cancelPerspectiveSelection();
        this.pendingPerspective = null;
        
        // 直接播放，不保存到主视角或提问视角
        console.log('立即播放视角:', perspectiveToPlay);
        this.loadVideo(perspectiveToPlay);
    }
    
    // 确认设置为提问视角
    async confirmAddToQuestion() {
        console.log('=== confirmAddToQuestion 开始 ===');
        console.log('1. 当前currentQA:', this.currentQA);
        console.log('2. pendingPerspective:', this.pendingPerspective);
        
        if (!this.pendingPerspective) {
            console.error('❌ 没有待设置的视角');
            alert('❌ 错误: 没有待设置的视角');
            return;
        }
        
        if (!this.currentQA) {
            console.error('❌ 没有当前QA');
            alert('❌ 错误: 没有当前QA');
            return;
        }
        
        const perspectiveToSet = this.pendingPerspective;
        console.log('3. 准备设置的视角:', perspectiveToSet);
        
        // 先关闭对话框
        this.cancelPerspectiveSelection();
        console.log('4. 对话框已关闭');
        
        // 保存到JSON (updateField会自动更新currentQA)
        console.log('5. 准备调用updateField，参数:', '提问视角', [perspectiveToSet]);
        const success = await this.updateField('提问视角', [perspectiveToSet]);
        console.log('6. updateField返回结果:', success);
        console.log('7. currentQA更新后的提问视角:', this.currentQA['提问视角']);
        
        if (success) {
            // ⭐ 关键：从currentQA重新读取提问视角
            const rawQuestionPerspectives = this.currentQA['提问视角'] || [];
            const validQuestionPerspectives = rawQuestionPerspectives.filter(p => 
                p && p !== null && p !== 'null' && p !== undefined && p !== 'undefined' && String(p).trim() !== ''
            );
            this.selectedQuestionPerspective = validQuestionPerspectives.length > 0 ? validQuestionPerspectives[0] : null;
            console.log('8. selectedQuestionPerspective已设置为:', this.selectedQuestionPerspective);
            
            console.log('9. 调用renderPerspectives前的状态检查:');
            console.log('   - selectedQuestionPerspective:', this.selectedQuestionPerspective);
            console.log('   - currentQA提问视角:', this.currentQA['提问视角']);
            
            this.renderPerspectives();
            console.log('10. 界面已刷新');
            
            alert('✓ 提问视角已设置为: ' + perspectiveToSet);
        } else {
            console.error('✗ 提问视角保存失败');
            alert('❌ 提问视角保存失败，请查看控制台');
            this.selectedQuestionPerspective = null;
        }
        
        this.pendingPerspective = null;
        console.log('=== confirmAddToQuestion 结束 ===');
    }
    
    // 移除提问视角
    async removeQuestionPerspective() {
        console.log('=== removeQuestionPerspective ===');
        this.selectedQuestionPerspective = null;
        await this.updateField('提问视角', []);
        this.renderPerspectives();
    }
    
    // ==================== 选项管理 ====================
    
    renderOptions() {
        const editorEl = document.getElementById('optionsEditor');
        if (!editorEl) return;
        
        const options = this.currentQA.options || [];
        
        if (options.length === 0) {
            editorEl.innerHTML = '<div style="text-align: center; color: #999; padding: 10px;">暂无选项，请添加</div>';
            return;
        }
        
        let html = '';
        options.forEach((option, index) => {
            html += `
                <div class="option-item">
                    <input type="text" class="form-input option-input" 
                           value="${option}"
                           onchange="constructorApp.updateOption(${index}, this.value)">
                    <button class="option-remove-btn" onclick="constructorApp.removeOption(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        
        editorEl.innerHTML = html;
    }
    
    async addOption() {
        if (!this.currentQA) return;
        
        const options = this.currentQA.options || [];
        options.push('');
        
        await this.updateField('options', options);
        this.renderOptions();
    }
    
    async removeOption(index) {
        if (!this.currentQA) return;
        
        const options = this.currentQA.options || [];
        options.splice(index, 1);
        
        await this.updateField('options', options);
        this.renderOptions();
    }
    
    async updateOption(index, value) {
        if (!this.currentQA) return;
        
        const options = this.currentQA.options || [];
        options[index] = value;
        
        await this.updateField('options', options);
    }
    
    // ==================== 字段更新 ====================
    
    async updateField(fieldName, value) {
        console.log(`\n=== updateField 开始 ===`);
        console.log('1. 字段名:', fieldName);
        console.log('2. 值:', value);
        console.log('3. 当前QA:', this.currentQA);
        
        if (!this.currentQA) {
            console.error('❌ updateField: 没有当前QA');
            return false;
        }
        
        try {
            // 更新本地数据
            this.currentQA[fieldName] = value;
            console.log('4. 本地数据已更新');
            
            // 构建更新数据
            const updateData = {};
            updateData[fieldName] = value;
            
            console.log('5. 准备发送到服务器:', updateData);
            console.log('6. QA ID:', this.currentQA.qa_id);
            console.log('7. URL:', `/api/constructor/qa/${this.currentQA.qa_id}`);
            
            // 发送到服务器
            const response = await fetch(`/api/constructor/qa/${this.currentQA.qa_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            
            console.log('8. 服务器响应状态:', response.status);
            
            const result = await response.json();
            console.log('9. 服务器返回数据:', result);
            
            if (result.success) {
                console.log(`✓ 字段 ${fieldName} 更新成功`);
                console.log('=== updateField 结束 (成功) ===\n');
                return true;
            } else {
                console.error('更新失败:', result);
                alert(`❌ 更新失败: ${result.error || '未知错误'}`);
                return false;
            }
        } catch (error) {
            console.error('更新字段失败:', error);
            alert(`❌ 更新字段失败: ${error.message}`);
            return false;
        }
    }
    
    // ==================== 问题有效性管理 ====================
    
    handleUsableChange(value) {
        console.log('=== handleUsableChange ===');
        console.log('新的usable值:', value);
        
        // 转换为布尔值
        const usableBoolean = value === 'true';
        
        // 更新字段
        this.updateField('usable', usableBoolean);
        
        // 显示/隐藏无效原因输入框
        const reasonGroup = document.getElementById('uselessReasonGroup');
        if (reasonGroup) {
            if (usableBoolean) {
                // 如果有效，隐藏原因选择框并清空内容
                reasonGroup.style.display = 'none';
                this.updateField('useless_reason', '');
                const reasonSelect = document.getElementById('uselessReasonSelect');
                if (reasonSelect) {
                    reasonSelect.value = '';
                }
            } else {
                // 如果无效，显示原因选择框
                reasonGroup.style.display = 'block';
            }
        }
    }
    
    // ==================== 删除QA ====================
    
    async deleteQA() {
        if (!this.currentQA) return;
        
        if (!confirm('确定要删除此QA吗？此操作不可恢复！')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/constructor/qa/${this.currentQA.qa_id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('✓ QA已删除');
                
                // 清空编辑区
                this.currentQA = null;
                this.renderQAEditor();
                
                // 重新加载video列表和统计
                await this.loadVideos();
                await this.updateStatistics();
                
                // 如果当前video还在，重新加载其QA列表
                if (this.currentVideo) {
                    await this.loadVideoQAs(this.currentVideo.video_name);
                }
            } else {
                alert('❌ 删除失败');
            }
        } catch (error) {
            console.error('删除QA失败:', error);
            alert('❌ 删除失败');
        }
    }
}

// 初始化应用
const constructorApp = new QAConstructorApp();

