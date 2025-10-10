#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
答题模式QA数据管理器
处理扁平化的QA数组格式，支持做题功能
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from .video_path_manager import video_path_manager

class QuizManager:
    """答题模式QA数据管理器"""
    
    def __init__(self, input_file_path: str = 'quiz_data.json'):
        self.input_file_path = input_file_path
        self.output_file_path = input_file_path
        self.qa_list = self.load_qa_data()
        self.auto_save_enabled = True
    
    def load_qa_data(self) -> List[Dict]:
        """从文件加载QA数据（数组格式）"""
        try:
            if os.path.exists(self.input_file_path):
                with open(self.input_file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # 确保是列表格式
                if not isinstance(data, list):
                    print(f"错误: JSON格式应为数组，当前为: {type(data)}")
                    return []
                
                print(f"成功加载答题数据: {len(data)} 个QA")
                print(f"文件路径: {self.input_file_path}")
                return data
            return []
        except Exception as e:
            print(f"加载QA数据失败: {e}")
            return []
    
    def save_qa_data(self) -> bool:
        """保存QA数据到文件"""
        try:
            # 确保目录存在
            dir_path = os.path.dirname(self.output_file_path)
            if dir_path:
                os.makedirs(dir_path, exist_ok=True)
            
            with open(self.output_file_path, 'w', encoding='utf-8') as f:
                json.dump(self.qa_list, f, ensure_ascii=False, indent=2)
            print(f"QA数据已保存到: {self.output_file_path}")
            return True
        except Exception as e:
            print(f"保存QA数据失败: {e}")
            return False
    
    def get_current_file(self) -> str:
        """获取当前文件路径"""
        return self.input_file_path
    
    def get_all_qas(self) -> List[Dict]:
        """获取所有QA数据"""
        # 为每个QA添加视频路径信息
        enhanced_qas = []
        for qa in self.qa_list:
            enhanced_qa = qa.copy()
            
            # 添加视频路径
            video_name = qa.get('video_name', '')
            perspectives = qa.get('视角', [])
            perspective = perspectives[0] if perspectives else None
            
            enhanced_qa['video_path'] = video_path_manager.get_web_video_path(video_name, perspective)
            enhanced_qas.append(enhanced_qa)
        
        return enhanced_qas
    
    def get_qa_by_id(self, qa_id: str) -> Optional[Dict]:
        """根据qa_id获取QA"""
        for qa in self.qa_list:
            if qa.get('qa_id') == qa_id:
                return qa
        return None
    
    def get_qa_by_index(self, index: int) -> Optional[Dict]:
        """根据索引获取QA"""
        if 0 <= index < len(self.qa_list):
            return self.qa_list[index]
        return None
    
    def get_qa_index(self, qa_id: str) -> int:
        """获取QA的索引位置"""
        for i, qa in enumerate(self.qa_list):
            if qa.get('qa_id') == qa_id:
                return i
        return -1
    
    def update_qa(self, qa_id: str, updated_data: Dict) -> bool:
        """更新QA信息"""
        try:
            for i, qa in enumerate(self.qa_list):
                if qa.get('qa_id') == qa_id:
                    # 过滤掉不应该保存的字段
                    excluded_fields = {'video_path'}
                    for key, value in updated_data.items():
                        if key not in excluded_fields:
                            self.qa_list[i][key] = value
                    
                    # 自动保存
                    if self.auto_save_enabled:
                        self.save_qa_data()
                    
                    return True
            
            print(f"未找到QA: {qa_id}")
            return False
        except Exception as e:
            print(f"更新QA失败: {e}")
            return False
    
    def set_human_answer(self, qa_id: str, answer: str) -> bool:
        """设置用户答案"""
        return self.update_qa(qa_id, {'human_answer': answer})
    
    def toggle_usable(self, qa_id: str, useless_reason: str = None) -> bool:
        """切换QA的有效性"""
        qa = self.get_qa_by_id(qa_id)
        if qa:
            new_usable = not qa.get('usable', True)
            update_data = {'usable': new_usable}
            
            # 如果标记为无效且提供了原因，保存原因
            if not new_usable and useless_reason:
                update_data['useless_reason'] = useless_reason
            # 如果恢复为有效，清除原因
            elif new_usable:
                update_data['useless_reason'] = None
            
            return self.update_qa(qa_id, update_data)
        return False
    
    def set_difficulty(self, qa_id: str, difficulty: str) -> bool:
        """设置QA的难度等级"""
        if difficulty not in ['Simple', 'Medium', 'Difficulty']:
            return False
        return self.update_qa(qa_id, {'difficulty': difficulty})
    
    def get_video_info(self, qa_id: str) -> Dict:
        """获取QA的视频信息"""
        qa = self.get_qa_by_id(qa_id)
        if not qa:
            return {}
        
        video_name = qa.get('video_name', '')
        perspectives = qa.get('视角', [])
        
        # 获取视频详细信息
        video_info = video_path_manager.get_video_info(video_name)
        if not video_info:
            return {}
        
        return {
            'video_name': video_name,
            'video_type': video_info.get('type', 'unknown'),
            'available_perspectives': video_info.get('files', []),
            'current_perspective': perspectives[0] if perspectives else None,
            'video_path': video_path_manager.get_web_video_path(video_name, perspectives[0] if perspectives else None)
        }
    
    def get_statistics(self) -> Dict:
        """获取统计信息"""
        total = len(self.qa_list)
        answered = sum(1 for qa in self.qa_list if qa.get('human_answer') is not None)
        usable = sum(1 for qa in self.qa_list if qa.get('usable', True))
        
        return {
            'total': total,
            'answered': answered,
            'unanswered': total - answered,
            'usable': usable,
            'unusable': total - usable
        }
    
    def enable_auto_save(self, enabled: bool = True):
        """启用或禁用自动保存"""
        self.auto_save_enabled = enabled
        print(f"自动保存已{'启用' if enabled else '禁用'}")

# 全局实例
quiz_manager = QuizManager()

