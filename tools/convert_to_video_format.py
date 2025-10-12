#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据格式转换脚本：从数组格式转换为按video_name分组的字典格式

旧格式（数组）:
[
  {"qa_id": "seg1_qa_0", "video_name": "video1", "segment_id": "seg1", ...},
  {"qa_id": "seg1_qa_1", "video_name": "video1", "segment_id": "seg1", ...},
  {"qa_id": "seg2_qa_0", "video_name": "video2", "segment_id": "seg2", ...}
]

新格式（字典，按video_name分组）:
{
  "video1": [
    {"qa_id": "video1_qa_0", "video_name": "video1", ...},
    {"qa_id": "video1_qa_1", "video_name": "video1", ...}
  ],
  "video2": [
    {"qa_id": "video2_qa_0", "video_name": "video2", ...}
  ]
}
"""

import json
import os
import sys
from collections import defaultdict

def convert_array_to_video_dict(input_file, output_file=None):
    """将数组格式转换为按video_name分组的字典格式"""
    
    print(f"正在读取文件: {input_file}")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"错误: 文件不存在 - {input_file}")
        return False
    except json.JSONDecodeError as e:
        print(f"错误: JSON格式错误 - {e}")
        return False
    
    # 检查是否已经是字典格式
    if isinstance(data, dict):
        print("文件已经是字典格式，无需转换")
        return True
    
    if not isinstance(data, list):
        print(f"错误: 不支持的数据格式 - {type(data)}")
        return False
    
    print(f"找到 {len(data)} 个QA条目")
    
    # 按video_name分组
    video_dict = defaultdict(list)
    
    for qa in data:
        video_name = qa.get('video_name', '')
        if not video_name:
            print(f"警告: QA {qa.get('qa_id', '未知')} 没有video_name字段")
            continue
        
        # 创建新的QA对象（移除segment_id字段）
        new_qa = {}
        for key, value in qa.items():
            if key != 'segment_id':  # 不复制segment_id
                new_qa[key] = value
        
        # 重新生成qa_id（如果需要）
        # 格式从 segment_id_qa_N 改为 video_name_qa_N
        old_qa_id = new_qa.get('qa_id', '')
        if '_qa_' in old_qa_id:
            # 提取编号
            try:
                qa_num = int(old_qa_id.split('_qa_')[-1])
                # 生成新的qa_id
                current_count = len(video_dict[video_name])
                new_qa['qa_id'] = f"{video_name}_qa_{current_count}"
            except ValueError:
                pass
        
        video_dict[video_name].append(new_qa)
    
    # 转换为普通字典
    result = dict(video_dict)
    
    # 统计信息
    total_videos = len(result)
    total_qas = sum(len(qas) for qas in result.values())
    
    print(f"\n转换完成:")
    print(f"  - 视频数量: {total_videos}")
    print(f"  - QA总数: {total_qas}")
    print(f"\n各视频的QA数量:")
    for video_name, qas in sorted(result.items()):
        print(f"  - {video_name}: {len(qas)} QA")
    
    # 确定输出文件
    if output_file is None:
        # 默认输出文件名
        base_name, ext = os.path.splitext(input_file)
        output_file = f"{base_name}_video_format{ext}"
    
    # 保存转换后的数据
    print(f"\n正在保存到: {output_file}")
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print("✓ 保存成功!")
        return True
    except Exception as e:
        print(f"错误: 保存失败 - {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("使用方法:")
        print(f"  python {sys.argv[0]} <input_file> [output_file]")
        print("\n示例:")
        print(f"  python {sys.argv[0]} data/quiz_forward_yangjie.json")
        print(f"  python {sys.argv[0]} data/quiz_forward_yangjie.json data/qa_video_format.json")
        print("\n说明:")
        print("  - input_file: 输入的JSON文件（数组格式）")
        print("  - output_file: 输出的JSON文件（字典格式）, 可选，默认为 <input>_video_format.json")
        return 1
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    success = convert_array_to_video_dict(input_file, output_file)
    
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())

