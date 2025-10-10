# SpatialBench 视频标注工具

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![Flask](https://img.shields.io/badge/Flask-2.0+-red.svg)
![License](https://img.shields.io/badge/license-MIT-yellow.svg)

一个专业的视频标注、QA检查和答题系统，支持多视角视频处理和智能化的标注工作流

</div>

---

## 📋 目录

- [功能特性](#-功能特性)
- [快速开始](#-快速开始)
- [系统架构](#-系统架构)
- [使用指南](#-使用指南)
- [配置说明](#-配置说明)
- [API文档](#-api文档)
- [开发指南](#-开发指南)
- [常见问题](#-常见问题)

---

## ✨ 功能特性

### 🎬 视频标注模式
- ✅ 多数据集管理和切换
- ✅ 支持多标注者协作
- ✅ 视频片段的精确时间标记
- ✅ 片段状态管理（待抉择、采纳、弃用）
- ✅ 实时标注统计和进度追踪
- ✅ 视频文件批量下载（YouTube & HuggingFace）

### 📝 QA检查模式
- ✅ 问答对的创建、编辑和审核
- ✅ 多选项支持（任意数量）
- ✅ 自动保存机制
- ✅ QA质量统计
- ✅ 视频路径自动匹配

### 🎯 答题模式
- ✅ 智能分段播放（Forward/Backward）
- ✅ 答题进度追踪
- ✅ 题目有效性标记
- ✅ 实时答题统计
- ✅ 答案对比和验证

### 🎥 视频管理
- ✅ 多视角视频支持
- ✅ YouTube视频下载
- ✅ HuggingFace数据集集成
- ✅ 视频路径自动管理
- ✅ 视频目录扫描

---

## 🚀 快速开始

### 环境要求

- Python 3.8 或更高版本
- 现代浏览器（Chrome、Firefox、Edge）

### 安装步骤

1. **克隆仓库**
```bash
git clone <repository-url>
cd SpatialBench_Tool_checkquiz
```

2. **安装依赖**
```bash
pip install -r requirements.txt
```

3. **启动应用**
```bash
python app.py
```

4. **访问应用**

打开浏览器访问：`http://localhost:5001`

### 快速使用（答题模式）

```bash
# 1. 启动应用
python app.py

# 2. 浏览器打开
http://localhost:5001

# 3. 加载示例文件
# 在界面上点击"加载文件"，选择：
# quiz_round1_multiview_example.json
```

---

## 🏗️ 系统架构

```
SpatialBench_Tool_checkquiz/
│
├── app.py                          # Flask主应用
├── config.py                       # 配置文件
├── requirements.txt                # 依赖列表
│
├── models/                         # 核心业务逻辑
│   ├── dataset_manager.py         # 数据集管理
│   ├── annotation_manager.py      # 标注管理
│   ├── qa_manager.py              # QA管理
│   ├── candidate_qa_manager.py    # 候选QA管理
│   ├── quiz_manager.py            # 答题管理
│   ├── video_download_manager.py  # 视频下载管理
│   └── video_path_manager.py      # 视频路径管理
│
├── templates/                      # HTML模板
│   ├── index.html                 # 标注模式
│   ├── qa_review.html             # QA检查模式
│   └── quiz.html                  # 答题模式
│
├── static/                         # 静态资源
│   ├── css/                       # 样式文件
│   ├── js/                        # JavaScript文件
│   └── videos/                    # 视频文件存储
│
├── data/                          # 数据文件
│   ├── example_quiz.json          # 示例答题数据
│   └── qacandidate_*.json         # QA候选数据
│
├── tools/                         # 辅助工具
│   ├── merge_reviewed.py          # 合并审核结果
│   └── merge_reviewed_full.py     # 完整合并工具
│
└── logs/                          # 日志目录
    └── spatialbench.log
```

---

## 📖 使用指南

### 答题模式

#### JSON 格式示例

```json
[
  {
    "qa_id": "unique-id-001",
    "video_name": "v_example",
    "视角": ["v_example.mp4"],
    "question": "在视频中，人物做了什么动作？",
    "options": ["走路", "跑步", "跳跃", "站立"],
    "ground_truth": "跑步",
    "human_answer": null,
    "temporal_direction": "Forward",
    "start_time": "00:05.00",
    "end_time": "00:10.00",
    "cut_point": "00:07.50",
    "usable": true
  }
]
```

#### 操作说明

| 操作 | 方法 |
|------|------|
| 选择题目 | 点击左侧题目列表 |
| 播放前半段 | 点击"播放前半段"按钮 |
| 播放后半段 | 点击"播放后半段"按钮 |
| 作答 | 点击任一选项 |
| 查看答案 | 点击"显示答案"按钮 |
| 标记无效 | 点击"标记为无效"按钮 |
| 导航 | 使用"上一题"/"下一题"按钮 |

#### 颜色状态说明

- 🟢 **绿色** - 已回答
- ⚪ **灰色** - 未回答
- 🔴 **红色** - 已标记为无效
- 🟣 **紫色** - 当前选中

#### 智能播放逻辑

```
Forward方向  → 播放 [start_time, cut_point]
Backward方向 → 播放 [cut_point, end_time]
```

### QA检查模式

1. **加载文件**: 点击"加载文件"选择JSON数据文件
2. **选择Segment**: 在左侧列表选择要检查的segment
3. **编辑QA**: 修改问题、选项或答案
4. **自动保存**: 所有修改自动保存到文件
5. **查看统计**: 右上角显示QA统计信息

### 视频标注模式

1. **选择标注者**: 在界面选择标注者身份
2. **选择数据集**: 从数据集列表中选择要标注的数据集
3. **标注片段**: 
   - 播放视频确定时间点
   - 创建或编辑片段
   - 设置状态（待抉择/采纳/弃用）
4. **保存进度**: 系统自动保存标注进度

---

## ⚙️ 配置说明

### 环境变量

```bash
# Flask配置
FLASK_DEBUG=False              # 调试模式
FLASK_HOST=0.0.0.0            # 监听地址
FLASK_PORT=5001               # 监听端口

# 目录配置
DATA_DIR=data                 # 数据目录
VIDEO_DIR=static/videos       # 视频目录

# 视频下载配置
MAX_VIDEO_SIZE=524288000      # 最大视频大小（字节）
DOWNLOAD_TIMEOUT=300          # 下载超时时间（秒）

# HuggingFace配置
HF_REPO=GuangsTrip/spatialpredictsource
HF_REPO_TYPE=dataset

# 日志配置
LOG_LEVEL=INFO                # 日志级别
LOG_FILE=logs/spatialbench.log
```

### 配置文件 (`config.py`)

应用支持多种配置环境：

- `development` - 开发环境
- `production` - 生产环境（默认）
- `testing` - 测试环境

通过环境变量 `FLASK_CONFIG` 切换配置：

```bash
export FLASK_CONFIG=development
python app.py
```

---

## 🔌 API文档

### 答题模式 API

#### 获取所有QA
```http
GET /api/quiz/qas
```

#### 获取单个QA详情
```http
GET /api/quiz/qa/<qa_id>
```

#### 提交答案
```http
POST /api/quiz/qa/<qa_id>/answer
Content-Type: application/json

{
  "answer": "选项内容"
}
```

#### 切换题目有效性
```http
POST /api/quiz/qa/<qa_id>/toggle-usable
```

#### 获取答题统计
```http
GET /api/quiz/statistics
```

### QA检查模式 API

#### 获取所有Segments
```http
GET /api/qa/segments
```

#### 获取Segment的QA列表
```http
GET /api/qa/segment/<segment_id>/qas
```

#### 更新QA
```http
PUT /api/qa/qa/<qa_id>
Content-Type: application/json

{
  "question": "新问题",
  "options": ["选项1", "选项2"],
  "answer": "选项1"
}
```

#### 删除QA
```http
DELETE /api/qa/qa/<qa_id>
```

### 视频管理 API

#### 设置视频目录
```http
POST /api/video/directory/set
Content-Type: application/json

{
  "video_dir": "/path/to/videos"
}
```

#### 获取视频列表
```http
GET /api/video/list
```

#### 下载视频
```http
POST /api/video/download
Content-Type: application/json

{
  "dataset": "dataset_name",
  "sample": "sample_name",
  "type": "youtube",
  "video_info": {
    "youtube_url": "https://youtube.com/..."
  }
}
```

---

## 🛠️ 开发指南

### 项目结构说明

#### 核心模块

- **DatasetManager**: 管理数据集、样本和片段的CRUD操作
- **AnnotationManager**: 处理标注者信息和权限
- **QAManager**: 管理问答对的生命周期
- **QuizManager**: 处理答题流程和统计
- **VideoDownloadManager**: 处理视频文件的下载和管理
- **VideoPathManager**: 管理视频文件路径映射

### 添加新功能

1. **添加新的API端点**：在 `app.py` 中添加路由
2. **添加新的管理器**：在 `models/` 目录创建新模块
3. **添加前端页面**：在 `templates/` 创建HTML模板
4. **添加静态资源**：在 `static/` 相应目录添加CSS/JS

### 数据格式规范

#### Quiz JSON 格式
```json
{
  "qa_id": "string",           // 必需，唯一标识
  "video_name": "string",      // 必需，视频名称
  "视角": ["string"],          // 必需，视频文件列表
  "question": "string",        // 必需，问题
  "options": ["string"],       // 必需，选项数组
  "ground_truth": "string",    // 必需，正确答案
  "human_answer": null,        // 可选，用户答案
  "temporal_direction": "string", // Forward或Backward
  "start_time": "HH:MM:SS.ss", // 必需，开始时间
  "end_time": "HH:MM:SS.ss",   // 必需，结束时间
  "cut_point": "HH:MM:SS.ss",  // 必需，切分点
  "usable": boolean            // 必需，是否有效
}
```

### 工具脚本

#### 转换JSON格式
```bash
python convert_json.py
```

#### 合并审核结果
```bash
# 合并单个文件
python tools/merge_reviewed.py

# 完整合并
python tools/merge_reviewed_full.py
```

---

## ❓ 常见问题

### Q1: 视频无法播放怎么办？

**A**: 请检查：
1. 视频文件是否存在于 `static/videos/` 目录
2. 视频文件命名是否与JSON中的 `video_name` 和 `视角` 匹配
3. 浏览器是否支持该视频格式（推荐使用MP4格式）

### Q2: 如何添加新的数据文件？

**A**: 
1. 将JSON文件放入 `data/` 目录
2. 在界面上点击"加载文件"
3. 从列表中选择新添加的文件

### Q3: 答题进度会自动保存吗？

**A**: 是的，所有答题操作都会实时保存到JSON文件中。

### Q4: 支持多人协作标注吗？

**A**: 支持。系统提供标注者身份选择功能，可以追踪每个标注者的工作进度。

### Q5: 如何导出标注结果？

**A**: 所有标注结果实时保存在对应的JSON文件中，可以直接使用这些文件。

### Q6: 视频下载失败怎么办？

**A**: 请检查：
1. 网络连接是否正常
2. YouTube URL是否有效
3. HuggingFace仓库访问权限
4. 磁盘空间是否充足

---

## 📝 版本历史

### v1.0.0 (当前版本)
- ✅ 视频标注模式
- ✅ QA检查模式
- ✅ 答题模式
- ✅ 多视角视频支持
- ✅ 视频下载功能
- ✅ 实时统计功能

---

## 📄 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。

---

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 GitHub Issue
- 发送邮件至项目维护者

---

<div align="center">

**🎉 感谢使用 SpatialBench 视频标注工具！**

Made with ❤️ by SpatialBench Team

</div>








