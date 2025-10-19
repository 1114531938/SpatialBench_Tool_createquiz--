#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
人工构造QA数据管理器
支持segment分组、QA增删改、多视角管理
"""

import json
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from collections import defaultdict
from .video_path_manager import video_path_manager

class QAConstructorManager:
    """人工构造QA数据管理器 - 按video_name分组"""
    
    def __init__(self, input_file_path: str = 'data/qa_constructor.json'):
        self.input_file_path = input_file_path
        self.output_file_path = input_file_path
        self.qa_data = self.load_qa_data()  # 改为字典格式 {video_name: [qa_list]}
        self.auto_save_enabled = True
    
    def load_qa_data(self) -> Dict[str, List[Dict]]:
        """从文件加载QA数据（按video_name分组的字典格式）"""
        try:
            if os.path.exists(self.input_file_path):
                with open(self.input_file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # 确保是字典格式
                if not isinstance(data, dict):
                    print(f"错误: JSON格式应为对象(字典)，当前为: {type(data)}")
                    return {}
                
                total_qas = sum(len(qas) for qas in data.values())
                print(f"成功加载QA构造数据: {len(data)} 个视频, {total_qas} 个QA")
                print(f"文件路径: {self.input_file_path}")
                return data
            return {}
        except Exception as e:
            print(f"加载QA数据失败: {e}")
            return {}
    
    def save_qa_data(self) -> bool:
        """保存QA数据到文件（字典格式）"""
        try:
            # 确保目录存在
            dir_path = os.path.dirname(self.output_file_path)
            if dir_path:
                os.makedirs(dir_path, exist_ok=True)
            
            print(f"\n[save_qa_data] 准备保存到: {self.output_file_path}")
            print(f"[save_qa_data] 视频数量: {len(self.qa_data)}")
            total_qas = sum(len(qas) for qas in self.qa_data.values())
            print(f"[save_qa_data] QA总数: {total_qas}")
            
            with open(self.output_file_path, 'w', encoding='utf-8') as f:
                json.dump(self.qa_data, f, ensure_ascii=False, indent=2)
            
            print(f"[save_qa_data] ✓ 保存成功!")
            return True
        except Exception as e:
            print(f"[save_qa_data] ✗ 保存失败: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_current_file(self) -> str:
        """获取当前文件路径"""
        return self.input_file_path
    
    def get_all_videos(self) -> List[Dict]:
        """获取所有video信息"""
        videos = []
        for video_name, qas in self.qa_data.items():
            videos.append({
                'video_name': video_name,
                'qa_count': len(qas)
            })
        
        # 按video_name排序
        videos.sort(key=lambda x: x['video_name'])
        return videos
    
    def get_video_qas(self, video_name: str) -> List[Dict]:
        """获取指定video的所有QA"""
        qas = self.qa_data.get(video_name, [])
        # 按qa_id排序
        qas.sort(key=lambda x: x.get('qa_id', ''))
        return qas
    
    def get_qa_by_id(self, qa_id: str) -> Optional[Dict]:
        """根据qa_id获取QA"""
        for video_name, qas in self.qa_data.items():
            for qa in qas:
                if qa.get('qa_id') == qa_id:
                    return qa
        return None
    
    def create_qa(self, video_name: str, qa_data: Dict) -> bool:
        """在指定video中创建新的QA"""
        try:
            print(f"\n[create_qa] 准备在video [{video_name}] 中创建新QA")
            
            # 确保video_name存在于qa_data中
            if video_name not in self.qa_data:
                print(f"[create_qa] 创建新video key: {video_name}")
                self.qa_data[video_name] = []
            
            # 获取该video的现有QA，确定新QA的编号
            existing_qas = self.qa_data[video_name]
            print(f"[create_qa] 当前QA数量: {len(existing_qas)}")
            
            # 提取最大的qa编号
            max_qa_num = -1
            for qa in existing_qas:
                qa_id = qa.get('qa_id', '')
                # 格式: video_name_qa_N
                if '_qa_' in qa_id:
                    try:
                        num = int(qa_id.split('_qa_')[-1])
                        max_qa_num = max(max_qa_num, num)
                    except ValueError:
                        pass
            
            # 生成新的qa_id
            new_qa_num = max_qa_num + 1
            new_qa_id = f"{video_name}_qa_{new_qa_num}"
            print(f"[create_qa] 新QA ID: {new_qa_id}")
            
            # 获取默认信息（从第一个QA）
            default_info = {}
            if existing_qas:
                first_qa = existing_qas[0]
                default_info = {
                    'start_time': first_qa.get('start_time', '00:00.00'),
                    'end_time': first_qa.get('end_time', '00:00.00')
                }
            
            # 构建新QA（只使用"主视角"和"提问视角"，不再使用"视角"）
            new_qa = {
                'qa_id': new_qa_id,
                'video_name': video_name,
                '主视角': qa_data.get('主视角', []),
                '提问视角': qa_data.get('提问视角', []),
                '提问视角_time': qa_data.get('提问视角_time', None),
                'question': qa_data.get('question', ''),
                'options': qa_data.get('options', []),
                'ground_truth': qa_data.get('ground_truth', ''),
                'question_type': qa_data.get('question_type', ''),
                'temporal_direction': qa_data.get('temporal_direction', ''),
                'start_time': qa_data.get('start_time', default_info.get('start_time', '00:00.00')),
                'end_time': qa_data.get('end_time', default_info.get('end_time', '00:00.00')),
                'cut_point': qa_data.get('cut_point', ''),
                'usable': qa_data.get('usable', False),  # 默认无效，需要标注完成后改为有效
                'useless_reason': qa_data.get('useless_reason', ''),  # 默认为空
                'version': 'v2'  # 新增QA默认为v2
            }
            
            print(f"[create_qa] 新QA数据: {new_qa}")
            
            # 添加到对应video的列表
            self.qa_data[video_name].append(new_qa)
            print(f"[create_qa] 已添加到内存，当前数量: {len(self.qa_data[video_name])}")
            
            # 自动保存
            if self.auto_save_enabled:
                print(f"[create_qa] 开始自动保存...")
                save_success = self.save_qa_data()
                if save_success:
                    print(f"[create_qa] ✓ 成功创建并保存QA: {new_qa_id}")
                else:
                    print(f"[create_qa] ✗ QA已创建但保存失败: {new_qa_id}")
                    return False
            else:
                print(f"[create_qa] 自动保存已禁用")
            
            return True
            
        except Exception as e:
            print(f"[create_qa] ✗ 创建QA失败: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def update_qa(self, qa_id: str, updated_data: Dict) -> bool:
        """更新QA信息（不包括video_name、qa_id等）"""
        try:
            print(f"\n[update_qa] 尝试更新QA: {qa_id}")
            print(f"[update_qa] 更新数据: {updated_data}")
            
            for video_name, qas in self.qa_data.items():
                for i, qa in enumerate(qas):
                    if qa.get('qa_id') == qa_id:
                        print(f"[update_qa] 找到QA在video: {video_name}, index: {i}")
                        
                        # 不允许修改的字段
                        excluded_fields = {'video_name', 'qa_id', 'version'}
                        
                        # 更新允许修改的字段
                        for key, value in updated_data.items():
                            if key not in excluded_fields:
                                old_value = self.qa_data[video_name][i].get(key, 'N/A')
                                self.qa_data[video_name][i][key] = value
                                print(f"[update_qa] 更新字段 {key}: {old_value} → {value}")
                        
                        # 自动保存
                        if self.auto_save_enabled:
                            save_success = self.save_qa_data()
                            print(f"[update_qa] 自动保存: {'成功' if save_success else '失败'}")
                        
                        return True
            
            print(f"[update_qa] 错误: 未找到QA: {qa_id}")
            return False
        except Exception as e:
            print(f"[update_qa] 异常: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def delete_qa(self, qa_id: str) -> bool:
        """删除指定QA"""
        try:
            for video_name, qas in self.qa_data.items():
                for i, qa in enumerate(qas):
                    if qa.get('qa_id') == qa_id:
                        del self.qa_data[video_name][i]
                        
                        # 如果该video下没有QA了，可以选择保留空列表或删除该key
                        # 这里选择保留空列表
                        
                        # 自动保存
                        if self.auto_save_enabled:
                            self.save_qa_data()
                        
                        print(f"成功删除QA: {qa_id}")
                        return True
            
            print(f"未找到QA: {qa_id}")
            return False
        except Exception as e:
            print(f"删除QA失败: {e}")
            return False
    
    def duplicate_qa(self, qa_id: str) -> bool:
        """复制指定QA，创建新ID和v2版本"""
        try:
            # 找到要复制的QA
            original_qa = None
            video_name = None
            
            for vn, qas in self.qa_data.items():
                for qa in qas:
                    if qa.get('qa_id') == qa_id:
                        original_qa = qa
                        video_name = vn
                        break
                if original_qa:
                    break
            
            if not original_qa or not video_name:
                print(f"未找到要复制的QA: {qa_id}")
                return False
            
            # 生成新的QA ID
            existing_qas = self.qa_data[video_name]
            max_index = 0
            for qa in existing_qas:
                qa_id_parts = qa.get('qa_id', '').split('_qa_')
                if len(qa_id_parts) == 2:
                    try:
                        index = int(qa_id_parts[1])
                        max_index = max(max_index, index)
                    except ValueError:
                        pass
            
            new_qa_id = f"{video_name}_qa_{max_index + 1}"
            
            # 创建副本，修改ID和版本
            duplicated_qa = original_qa.copy()
            duplicated_qa['qa_id'] = new_qa_id
            duplicated_qa['version'] = 'v2'
            
            # 添加到对应video的列表
            self.qa_data[video_name].append(duplicated_qa)
            
            print(f"成功复制QA: {qa_id} → {new_qa_id}")
            
            # 自动保存
            if self.auto_save_enabled:
                save_success = self.save_qa_data()
                if save_success:
                    print(f"✓ 复制并保存成功: {new_qa_id}")
                else:
                    print(f"✗ QA已复制但保存失败: {new_qa_id}")
                    return False
            else:
                print(f"自动保存已禁用")
            
            return True
            
        except Exception as e:
            print(f"复制QA失败: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_available_perspectives(self, video_name: str) -> List[str]:
        """获取视频的所有可用视角"""
        try:
            # 使用video_path_manager获取视角列表
            perspectives = video_path_manager.get_available_perspectives(video_name)
            
            # 过滤掉null、空字符串等无效值
            valid_perspectives = [p for p in perspectives if p and str(p).strip() and p != 'null']
            
            print(f"[get_available_perspectives] video: {video_name}")
            print(f"[get_available_perspectives] 原始视角: {perspectives}")
            print(f"[get_available_perspectives] 有效视角: {valid_perspectives}")
            
            return valid_perspectives
        except Exception as e:
            print(f"获取视角列表失败: {e}")
            return []
    
    def get_video_info(self, video_name: str) -> Dict:
        """获取video的信息"""
        qas = self.get_video_qas(video_name)
        
        # 获取可用视角
        available_perspectives = self.get_available_perspectives(video_name)
        
        return {
            'video_name': video_name,
            'available_perspectives': available_perspectives,
            'qa_count': len(qas)
        }
    
    def get_statistics(self) -> Dict:
        """获取统计信息"""
        videos = self.get_all_videos()
        total_videos = len(videos)
        total_qas = sum(len(qas) for qas in self.qa_data.values())
        
        # 统计v2版本的QA数量
        v2_qas = 0
        for qas in self.qa_data.values():
            v2_qas += sum(1 for qa in qas if qa.get('version') == 'v2')
        
        return {
            'total_videos': total_videos,
            'total_qas': total_qas,
            'v2_qas': v2_qas,
            'v1_qas': total_qas - v2_qas
        }
    
    def enable_auto_save(self, enabled: bool = True):
        """启用或禁用自动保存"""
        self.auto_save_enabled = enabled
        print(f"自动保存已{'启用' if enabled else '禁用'}")

# 全局实例
qa_constructor_manager = QAConstructorManager()

