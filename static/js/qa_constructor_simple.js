// 简化版视角管理代码 - 替换qa_constructor.js中的相关方法

// 加载视角 - 简化版
async loadPerspectives() {
    if (!this.currentQA) return;
    
    try {
        const videoName = this.currentQA.video_name;
        console.log('=== 开始加载视角 ===');
        console.log('Video Name:', videoName);
        
        const response = await fetch(`/api/constructor/video/${videoName}/perspectives`);
        const data = await response.json();
        
        console.log('API原始返回:', data);
        
        if (data.perspectives) {
            // 简单过滤：只保留非空字符串
            this.allPerspectives = data.perspectives.filter(p => typeof p === 'string' && p.length > 0);
            console.log('可用视角列表:', this.allPerspectives);
            
            // 加载已保存的视角
            this.selectedMainPerspectives = (this.currentQA['主视角'] || this.currentQA['视角'] || []).filter(p => typeof p === 'string' && p.length > 0);
            this.selectedQuestionPerspective = ((this.currentQA['提问视角'] || [])[0]) || null;
            if (this.selectedQuestionPerspective === 'null') this.selectedQuestionPerspective = null;
            
            console.log('已选主视角:', this.selectedMainPerspectives);
            console.log('已选提问视角:', this.selectedQuestionPerspective);
            
            this.renderPerspectives();
        }
    } catch (error) {
        console.error('加载视角失败:', error);
        alert('加载视角失败：' + error.message);
    }
}

// 渲染视角 - 简化版
renderPerspectives() {
    console.log('=== 开始渲染视角 ===');
    
    // 渲染所有视角列表
    const allListEl = document.getElementById('allPerspectivesList');
    if (allListEl && this.allPerspectives) {
        if (this.allPerspectives.length === 0) {
            allListEl.innerHTML = '<div style="text-align: center; color: #999; font-size: 12px;">无可用视角</div>';
        } else {
            let html = '';
            this.allPerspectives.forEach((perspective, index) => {
                html += `
                    <div class="perspective-item" data-perspective="${perspective}" 
                         onclick="constructorApp.clickPerspective(${index})">
                        ${perspective}
                    </div>
                `;
            });
            allListEl.innerHTML = html;
            console.log('渲染了', this.allPerspectives.length, '个视角');
        }
    }
    
    // 渲染主视角
    const mainListEl = document.getElementById('mainPerspectivesList');
    if (mainListEl) {
        if (!this.selectedMainPerspectives || this.selectedMainPerspectives.length === 0) {
            mainListEl.innerHTML = '<div style="text-align: center; color: #999; font-size: 12px;">暂无</div>';
        } else {
            let html = '';
            this.selectedMainPerspectives.forEach((perspective, index) => {
                html += `
                    <div class="perspective-item selected">
                        ${perspective}
                        <button class="remove-btn" onclick="constructorApp.removeMainPerspective(${index})">移除</button>
                    </div>
                `;
            });
            mainListEl.innerHTML = html;
        }
    }
    
    // 渲染提问视角
    const questionEl = document.getElementById('questionPerspectiveDisplay');
    if (questionEl) {
        if (!this.selectedQuestionPerspective) {
            questionEl.innerHTML = '<div style="text-align: center; color: #999; font-size: 12px;">暂无</div>';
        } else {
            questionEl.innerHTML = `
                <div class="perspective-item selected">
                    ${this.selectedQuestionPerspective}
                    <button class="remove-btn" onclick="constructorApp.clearQuestionPerspective()">移除</button>
                </div>
            `;
        }
    }
}

// 点击视角 - 简化版（使用索引）
clickPerspective(index) {
    console.log('=== 点击视角 ===');
    console.log('索引:', index);
    
    if (!this.allPerspectives || index < 0 || index >= this.allPerspectives.length) {
        console.error('无效的索引');
        return;
    }
    
    const perspective = this.allPerspectives[index];
    console.log('选中的视角:', perspective);
    console.log('类型:', typeof perspective);
    
    if (typeof perspective !== 'string' || perspective.length === 0) {
        alert('⚠️ 无效的视角');
        return;
    }
    
    this.pendingPerspective = perspective;
    
    // 显示对话框
    const modal = document.getElementById('perspectiveModal');
    if (modal) {
        modal.classList.add('show');
    }
}

// 添加到主视角 - 简化版
async addToMain() {
    console.log('=== 添加到主视角 ===');
    console.log('待添加的视角:', this.pendingPerspective);
    
    if (!this.pendingPerspective) {
        alert('没有选择视角');
        return;
    }
    
    // 关闭对话框
    this.closeModal();
    
    // 检查是否已存在
    if (this.selectedMainPerspectives.includes(this.pendingPerspective)) {
        alert('该视角已在主视角列表中');
        this.pendingPerspective = null;
        return;
    }
    
    // 添加到数组
    this.selectedMainPerspectives.push(this.pendingPerspective);
    console.log('主视角列表:', this.selectedMainPerspectives);
    
    // 保存
    const success1 = await this.updateField('主视角', this.selectedMainPerspectives);
    const success2 = await this.updateField('视角', this.selectedMainPerspectives);
    
    if (success1) {
        console.log('✓ 主视角已保存');
        this.renderPerspectives();
        this.loadVideo();
    } else {
        console.error('✗ 保存失败');
        this.selectedMainPerspectives.pop(); // 回滚
    }
    
    this.pendingPerspective = null;
}

// 设置为提问视角 - 简化版
async setAsQuestion() {
    console.log('=== 设置为提问视角 ===');
    console.log('待设置的视角:', this.pendingPerspective);
    
    if (!this.pendingPerspective) {
        alert('没有选择视角');
        return;
    }
    
    // 关闭对话框
    this.closeModal();
    
    // 设置提问视角
    this.selectedQuestionPerspective = this.pendingPerspective;
    console.log('提问视角:', this.selectedQuestionPerspective);
    
    // 保存
    const success = await this.updateField('提问视角', [this.selectedQuestionPerspective]);
    
    if (success) {
        console.log('✓ 提问视角已保存');
        this.renderPerspectives();
    } else {
        console.error('✗ 保存失败');
        this.selectedQuestionPerspective = null;
    }
    
    this.pendingPerspective = null;
}

// 移除主视角
async removeMainPerspective(index) {
    console.log('=== 移除主视角 ===');
    console.log('索引:', index);
    
    if (index < 0 || index >= this.selectedMainPerspectives.length) return;
    
    const removed = this.selectedMainPerspectives[index];
    this.selectedMainPerspectives.splice(index, 1);
    
    console.log('移除的视角:', removed);
    console.log('剩余主视角:', this.selectedMainPerspectives);
    
    await this.updateField('主视角', this.selectedMainPerspectives);
    await this.updateField('视角', this.selectedMainPerspectives);
    
    this.renderPerspectives();
    this.loadVideo();
}

// 清除提问视角
async clearQuestionPerspective() {
    console.log('=== 清除提问视角 ===');
    
    this.selectedQuestionPerspective = null;
    await this.updateField('提问视角', []);
    
    this.renderPerspectives();
}

// 关闭对话框
closeModal() {
    const modal = document.getElementById('perspectiveModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

