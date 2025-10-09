#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""转换JSON格式脚本"""

import json
import os

# 文件路径
input_file = 'data/qacandidate_round3_yangjie_part7.json'
output_file = 'data/quiz_round3_yangjie_part7.json'

print(f"正在读取文件: {input_file}")

# 读取原文件
with open(input_file, 'r', encoding='utf-8') as f:
    old_data = json.load(f)

print(f"找到 {len(old_data)} 个segments")

# 转换为新格式
new_data = []
total_qas = 0

for segment_id, segment in old_data.items():
    video_name = segment.get('video_name', '')
    qas = segment.get('qas', [])
    
    for qa in qas:
        # 提取answer作为ground_truth
        ground_truth = qa.get('answer', '')
        
        # 创建options数组
        # 目前只包含正确答案，用户需要手动添加其他选项
        if ground_truth:
            options = [ground_truth]
        else:
            options = []
        
        # 构建新的QA对象
        new_qa = {
            'qa_id': qa.get('qa_id', ''),
            'video_name': video_name,
            '视角': qa.get('视角', []),
            'question': qa.get('question', ''),
            'options': options,
            'ground_truth': ground_truth,
            'human_answer': None,
            'question_type': qa.get('question_type', ''),
            'temporal_direction': qa.get('temporal_direction', ''),
            'start_time': qa.get('start_time', '00:00.00'),
            'end_time': qa.get('end_time', '00:00.00'),
            'cut_point': qa.get('cut_point', '00:00.00'),
            'segment_id': segment_id,
            'usable': qa.get('usable', True)
        }
        
        new_data.append(new_qa)
        total_qas += 1

# 保存新文件
print(f"\n转换完成:")
print(f"  - 总QA数量: {total_qas}")
print(f"  - 保存到: {output_file}")

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(new_data, f, ensure_ascii=False, indent=2)

print("\n⚠️  重要提示:")
print("  - options数组目前只包含正确答案")
print("  - 您需要手动为每个QA添加3-4个干扰选项")
print("  - 建议options包含4个选项（包括正确答案）")
print("  - 确保ground_truth与某个option完全匹配")
print(f"\n✅ 成功转换 {total_qas} 个QA！")

