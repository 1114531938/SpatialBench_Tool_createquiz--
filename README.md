# SpatialBench 视频标注工具

专业的视频标注工具，支持多视角视频播放、片段标注、质量检查等功能。

## 🚀 快速开始

### 测试模式（使用aria01_214-1数据）

```bash
# 1. 创建conda环境
mamba create -n benchannot python=3.12
mamba activate benchannot

# 2. 安装依赖
pip install -r requirements.txt

# 3. 启动应用
python app.py
```

- **访问地址**: http://localhost:5001


## 📁 项目结构

```
SpatialBench_Annotate/
├── app.py                    # 主应用
├── start.py                  # 生产环境启动脚本
├── config.py                 # 配置文件
├── models/                   # 数据模型
├── static/                   # 静态资源
├── templates/                # HTML模板
├── data/                     # JSON数据文件
└── requirements.txt          # 依赖包
```

## 🔧 环境要求

- Python 3.12+
- Conda/Mamba (推荐)
- FFmpeg (视频处理)
- 足够的存储空间用于视频文件

