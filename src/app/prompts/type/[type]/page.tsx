'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { Prompt, getPromptsByType, deletePrompt, addPrompt, updatePrompt, copyPrompt } from '@/data';
import { PromptDetailView } from '@/components/prompts';

// 提示词类型映射
const promptTypeMap = {
  'ai_writing': { label: 'AI写作', color: 'bg-[#5a9d6b] text-white', icon: 'create', group: 'novel', gradient: 'from-[#5a9d6b] to-[#4a8d5b]' },
  'ai_polishing': { label: 'AI润色', color: 'bg-[#7D85CC] text-white', icon: 'auto_fix_high', group: 'novel', gradient: 'from-[#7D85CC] to-[#6F9CE0]' },
  'ai_analysis': { label: 'AI分析', color: 'bg-[#9C6FE0] text-white', icon: 'analytics', group: 'novel', gradient: 'from-[#9C6FE0] to-[#7D85CC]' },
  'worldbuilding': { label: '世界观', color: 'bg-[#E06F9C] text-white', icon: 'public', group: 'creative', gradient: 'from-[#E06F9C] to-[#E0976F]' },
  'character': { label: '角色', color: 'bg-[#9C6FE0] text-white', icon: 'person', group: 'creative', gradient: 'from-[#9C6FE0] to-[#7D85CC]' },
  'plot': { label: '情节', color: 'bg-[#6F9CE0] text-white', icon: 'timeline', group: 'creative', gradient: 'from-[#6F9CE0] to-[#9C6FE0]' },
  'introduction': { label: '导语', color: 'bg-[#7D85CC] text-white', icon: 'format_quote', group: 'creative', gradient: 'from-[#7D85CC] to-[#6F9CE0]' },
  'outline': { label: '大纲', color: 'bg-[#E0976F] text-white', icon: 'format_list_bulleted', group: 'creative', gradient: 'from-[#E0976F] to-[#E0C56F]' },
  'detailed_outline': { label: '细纲', color: 'bg-[#E0C56F] text-white', icon: 'subject', group: 'creative', gradient: 'from-[#E0C56F] to-[#E0976F]' },
  'book_tool': { label: '一键拆书', color: 'bg-[#E0976F] text-white', icon: 'auto_stories', group: 'tools', gradient: 'from-[#E0976F] to-[#E0C56F]' }
} as const;

// 提示词类型
type PromptType = keyof typeof promptTypeMap;

// 验证提示词类型是否有效
const isValidPromptType = (type: any): type is PromptType => {
  return Object.keys(promptTypeMap).includes(type as string);
};

// 将类型颜色转换为胶带颜色
const getTypeColor = (type: string): string => {
  const colorText = promptTypeMap[type as keyof typeof promptTypeMap]?.color.split(' ')[1] || 'text-white';
  // 从 text-white 提取颜色代码
  return colorText.replace('text-', 'rgba(').replace(/\]/, ', 0.7)');
};

// 格式化日期显示
const formatDate = (date: Date | string | number) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// 提示词模板
const promptTemplates = {
  'ai_writing': '',
  'ai_polishing': '',
  'ai_analysis': '',
  'worldbuilding': '',
  'character': '',
  'plot': '',
  'introduction': '',
  'outline': '',
  'detailed_outline': '',
  'book_tool': `你是一位专业的文学分析师，擅长分析和拆解文学作品。现在，你需要对用户提供的小说章节进行深度分析和拆解。

请按照以下结构进行分析：

1. 内容概述：
   - 简要总结所提供章节的主要内容
   - 识别核心情节和关键场景

2. 人物分析：
   - 列出章节中出现的主要和次要人物
   - 分析人物性格、动机和行为模式
   - 探讨人物关系和互动

3. 情节结构：
   - 分析章节的情节架构和节奏
   - 指出高潮和转折点
   - 评估情节的合理性和吸引力

4. 主题探讨：
   - 识别章节中的主要主题和潜在寓意
   - 分析作者如何通过情节和人物表达这些主题

5. 写作技巧：
   - 评价作者的叙事手法和语言风格
   - 分析对话、描写和意象的使用
   - 指出特别有效或需要改进的写作元素

6. 改进建议：
   - 提供具体的改进建议，包括情节发展、人物塑造和写作技巧
   - 指出可能的情节漏洞或不一致之处
   - 建议如何增强读者体验

注意：你的分析应该尊重原文的创作意图，在提供改进建议时保持建设性和支持性的态度。`
};

// 定义Modal组件的参数类型
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

// 弹窗组件
const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-4xl" }: ModalProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // 当模态窗口打开时，禁止body滚动
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    // 清理函数：当组件卸载或模态窗口关闭时，恢复body滚动
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 如果模态窗口未打开或组件未挂载，不渲染任何内容
  if (!isOpen || !isMounted) return null;

  // 使用createPortal将模态窗口渲染到body
  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] animate-fadeIn">
      <div className={`bg-card-color rounded-2xl p-6 w-full ${maxWidth} shadow-xl relative flex flex-col`}>
        <div className="flex justify-between items-center mb-6">
          <div className="w-6">
            {/* 左侧占位，保持布局平衡 */}
          </div>
          <h2 className="text-2xl font-bold text-text-dark font-ma-shan text-center">
            {typeof title === 'string' ? title : <>{title}</>}
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700 w-6 flex justify-center"
            onClick={onClose}
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body
  );
};

// 截断内容 - 当前未使用，但保留以备将来使用
const truncateContent = (content: string, length: number = 120) => {
  if (!content) return '';
  if (content.length <= length) return content;
  return content.slice(0, length) + '...';
};

export default function PromptTypePage() {
  const router = useRouter();
  const params = useParams();
  const promptTypeFromParams = params?.type as string;

  const [promptType, setPromptType] = useState<PromptType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<{
    title: string;
    type: PromptType | null;
    content: string;
    description: string;
  }>({
    title: '',
    type: null,
    content: '',
    description: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState<Prompt | null>(null);

  const descriptions: Record<PromptType, string> = {
    'introduction': '创建引人入胜的开篇导语，为你的故事设定基调和氛围',
    'outline': '快速生成故事的主要框架和结构，帮助你规划创作方向',
    'detailed_outline': '基于大纲深入展开，为每个章节创建详细的内容规划',
    'character': '创建丰富多彩的角色，赋予他们独特的个性和背景故事',
    'worldbuilding': '构建完整的世界观，包括历史、地理、文化和社会结构',
    'plot': '设计引人入胜的情节，包括冲突、转折和高潮',
    'ai_analysis': '使用AI分析小说的结构、人物、情节和主题，提供深入见解',
    'ai_writing': '使用AI创作高质量的小说内容，生成各类风格的文学作品',
    'ai_polishing': '使用AI润色和优化已有文本，提升其文学性、可读性和吸引力',
    'book_tool': '一键上传TXT文件，AI智能分析文本内容，快速提取关键信息和创作灵感'
  };

  useEffect(() => {
    if (promptTypeFromParams && isValidPromptType(promptTypeFromParams)) {
      setPromptType(promptTypeFromParams);
      setFormData(prev => ({
        ...prev,
        type: promptTypeFromParams,
        content: promptTemplates[promptTypeFromParams as keyof typeof promptTemplates] || ''
      }));
    } else {
      router.push('/prompts');
    }
  }, [promptTypeFromParams, router]);

  useEffect(() => {
    const loadPrompts = async () => {
      if (!promptType) return;
      try {
        setIsLoading(true);
        const loadedPrompts = await getPromptsByType(promptType);
        setPrompts(loadedPrompts);
      } catch (error) {
        console.error('加载提示词失败:', error);
        setPrompts([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadPrompts();
  }, [promptType]);

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch =
      prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prompt.description && prompt.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetFormData = () => {
    if (promptType) {
    setFormData({
      title: '',
      type: promptType,
      content: promptTemplates[promptType as keyof typeof promptTemplates] || '',
      description: '',
    });
    }
  };

  const openCreateModal = () => {
    resetFormData();
    setShowCreateModal(true);
  };

  const openDeleteModal = (prompt: Prompt, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedPrompt(prompt);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.type) {
        alert('提示词类型不能为空');
        return;
    }
    try {
      const now = new Date();
      const promptData = {
        ...formData,
        type: formData.type,
        createdAt: now,
        updatedAt: now,
        examples: [], 
      };

      const newPrompt = await addPrompt(promptData as Omit<Prompt, 'id'>);
      setPrompts(prev => [newPrompt, ...prev].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      setShowCreateModal(false);
    } catch (error) {
      console.error('创建提示词失败:', error);
      alert('创建提示词失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!selectedPrompt || !selectedPrompt.id) return;
    try {
      await deletePrompt(selectedPrompt.id);
      setPrompts(prev => prev.filter(p => p.id !== selectedPrompt.id));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('删除提示词失败:', error);
      alert('删除提示词失败，请重试');
    }
  };

  const openDetailModal = (prompt: Prompt, editMode: boolean = false) => {
    setSelectedPrompt(prompt);
    setShowDetailModal(true);
    setIsEditing(editMode);
    setEditedPrompt(editMode ? { ...prompt } : null);
  };
  
  const handleCopyPrompt = async (promptId: string) => {
    try {
      const newPrompt = await copyPrompt(promptId);
      setPrompts(prev => [newPrompt, ...prev].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      setShowDetailModal(false); 
      alert('提示词已复制！');
    } catch (error) {
      console.error('复制提示词失败:', error);
      alert('复制提示词失败，请重试');
    }
  };

  const highlightMatch = (text: string, term: string) => {
    if (!term || !text) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) && part.toLowerCase() === term.toLowerCase() ? <mark key={i} className="bg-yellow-100 px-1 rounded">{part}</mark> : part
    );
  };

  if (!promptType) {
    return (
        <div className="flex h-screen bg-bg-color items-center justify-center">
            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-primary-green"></div>
            <p className="ml-4 text-text-medium">加载中...</p>
        </div>
    ); 
  }

  return (
    <div className="flex h-screen bg-bg-color animate-fadeIn overflow-hidden">
      {/* 背景网格 */}
      <div className="grid-background"></div>

      {/* 装饰元素，在小屏幕上减少数量 */}
      <div className="dot hidden md:block" style={{ top: "120px", left: "15%" }}></div>
      <div className="dot" style={{ bottom: "80px", right: "20%" }}></div>
      <div className="dot hidden md:block" style={{ top: "30%", right: "25%" }}></div>
      <div className="dot hidden md:block" style={{ bottom: "40%", left: "30%" }}></div>

      <svg className="wave hidden md:block" style={{ bottom: "20px", left: "10%" }} width="100" height="20" viewBox="0 0 100 20">
        <path d="M0,10 Q25,0 50,10 T100,10" fill="none" stroke="var(--accent-brown)" strokeWidth="2" />
      </svg>

      <Sidebar activeMenu="prompts" />
      <div className="flex-1 flex flex-col overflow-hidden main-content-area">
        <TopBar
          title={promptType === 'book_tool' ? '一键拆书' : promptTypeMap[promptType]?.label || '提示词仓库'}
          showBackButton={true}
          actions={
            <button
              className="ghibli-button outline text-sm"
              onClick={openCreateModal}
            >
              <span className="material-icons mr-1 text-sm">add</span>
              创建提示词
            </button>
          }
        />

      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        <div className="max-w-full mx-auto px-0 sm:px-4 lg:container lg:mx-auto flex flex-col flex-1">
          {/* 提示词列表 */}
          <div className="flex-shrink-0 mb-6">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md mr-4 ${promptTypeMap[promptType]?.color.split(' ')[0]}`}>
                    <span className={`material-icons text-xl ${promptTypeMap[promptType]?.color.split(' ')[1]}`}>{promptTypeMap[promptType]?.icon}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-text-dark font-ma-shan">
                      {promptTypeMap[promptType]?.label}
                    <span className="ml-2 text-sm font-normal text-text-medium">({filteredPrompts.length})</span>
                  </h3>
                  <p className="text-sm text-text-medium mt-1">
                      {descriptions[promptType]}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mb-6 flex flex-wrap items-center gap-4">
              <div className="flex-shrink-0 w-64">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-text-light">search</span>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-[rgba(120,180,140,0.3)] rounded-xl bg-card-color focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] shadow-sm text-text-dark"
                    placeholder="搜索提示词..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* 提示词内容区域 */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full">
              {isLoading ? (
                // 加载状态
                <div className="col-span-full flex justify-center p-12">
                  <div className="w-3 h-3 bg-[#7D85CC] rounded-full animate-pulse mr-1"></div>
                  <div className="w-3 h-3 bg-[#E0976F] rounded-full animate-pulse delay-150 mr-1"></div>
                  <div className="w-3 h-3 bg-[#9C6FE0] rounded-full animate-pulse delay-300"></div>
                </div>
                ) : filteredPrompts.length > 0 ? (
                    <>
                      {filteredPrompts.map(prompt => {
                  const updatedAt = new Date(prompt.updatedAt);
                  const now = new Date();
                  const diffDays = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
                  let timeDisplay;
                        if (diffDays === 0) timeDisplay = '今天';
                        else if (diffDays === 1) timeDisplay = '昨天';
                        else if (diffDays < 7) timeDisplay = `${diffDays}天前`;
                        else timeDisplay = updatedAt.toLocaleDateString();

                  const typeConfig = promptTypeMap[prompt.type as keyof typeof promptTypeMap] || {
                          label: '未知', icon: 'help_outline', color: 'text-gray-500'
                  };
                  const colorText = typeConfig.color.split(' ')[1];
                  const bgColor = typeConfig.color.split(' ')[0];

                  return (
                    <div
                      key={prompt.id}
                      className="ghibli-card h-80 cursor-pointer animate-fadeIn"
                      onClick={() => openDetailModal(prompt, false)}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-center mb-4">
                          <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center mr-3`}>
                            <span className={`material-icons text-xl ${colorText}`}>{typeConfig.icon}</span>
                          </div>
                          <h3 className="font-medium text-text-dark text-xl font-ma-shan">
                            {highlightMatch(prompt.title, searchTerm)}
                          </h3>
                        </div>
                        <p className="text-text-medium text-sm mb-6 line-clamp-3">
                          {prompt.description ? highlightMatch(prompt.description, searchTerm) : '无描述'}
                        </p>
                        <div className="mt-auto border-t border-[rgba(120,180,140,0.2)] w-full pt-3 px-4 flex justify-between items-center">
                          <div className="flex items-center text-xs text-text-light">
                            <span className="material-icons text-text-light text-sm mr-1">schedule</span>
                            <span>{timeDisplay}</span>
                          </div>
                        </div>
                      </div>
                      <div className="page-curl"></div>
                    </div>
                  );
                })}
                  </>
                ) : (
                  <div className="col-span-full ghibli-card p-12 flex flex-col items-center justify-center h-full">
                    <div className="w-24 h-24 bg-[rgba(120,180,140,0.1)] rounded-full flex items-center justify-center mb-4 text-text-light">
                      <span className="material-icons text-4xl">search_off</span>
                    </div>
                    <h3 className="text-xl font-semibold text-text-dark mb-2 font-ma-shan">暂无提示词</h3>
                    <p className="text-text-medium text-center max-w-md mb-6">
                      {searchTerm
                          ? `没有找到包含"${searchTerm}"的提示词。`
                          : `您还没有创建任何${promptTypeMap[promptType]?.label}类型的提示词。`}
                    </p>
                    <button
                      className="ghibli-button"
                      onClick={() => searchTerm ? setSearchTerm('') : openCreateModal()}
                    >
                      <span className="material-icons text-sm mr-2">{searchTerm ? 'clear' : 'add'}</span>
                        {searchTerm ? '清除搜索' : '创建第一个提示词'}
                    </button>
                  </div>
                )
                }
              </div>
          </div>
        </div>
      </main>
      {/* 创建提示词弹窗 */}
        {showCreateModal && (
          <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="创建新提示词">
            <form onSubmit={handleSubmit} className="space-y-6 flex flex-col flex-grow min-h-[400px]">
              <div>
                <label className="block text-text-dark font-medium mb-2">标题</label>
                  <input
                  type="text"
                    name="title"
                  className="w-full px-4 py-2 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark"
                    placeholder="输入提示词标题..."
                    value={formData.title}
                    onChange={handleInputChange}
                  required
                  />
                </div>
              <div className="flex-grow flex flex-col">
                  <label className="block text-text-dark font-medium mb-2">内容</label>
                  <textarea
                    name="content"
                      className="w-full px-4 py-3 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark flex-grow min-h-[120px]"
                    placeholder="输入提示词内容..."
                    value={formData.content}
                    onChange={handleInputChange}
                      required
                  ></textarea>
                </div>
              <div>
                  <label className="block text-text-dark font-medium mb-2">描述 <span className="text-text-light text-sm">(可选)</span></label>
                  <textarea
                    name="description"
                      className="w-full px-4 py-3 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark min-h-[80px]"
                      placeholder="简短描述提示词的用途..."
                    value={formData.description}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              <div className="flex justify-end space-x-3 mt-auto pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-outline text-sm">取消</button>
                <button type="submit" className="btn-primary text-sm">创建</button>
                </div>
              </form>
      </Modal>
        )}

        {/* 删除提示词弹窗 */}
        {showDeleteModal && selectedPrompt && (
          <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={`删除提示词 "${selectedPrompt.title}"`}>
            <p className="text-text-medium mb-6">确定要删除提示词 "{selectedPrompt.title}"吗？此操作无法撤销。</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn-outline text-sm">取消</button>
              <button onClick={handleDelete} className="btn-danger text-sm">删除</button>
        </div>
      </Modal>
        )}

        {/* 提示词详情/编辑弹窗 (PromptDetailView) */}
        {showDetailModal && selectedPrompt && (
      <Modal
        isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setIsEditing(false);
            }} 
            title={isEditing ? "编辑提示词" : selectedPrompt.title} 
            maxWidth="max-w-5xl"
          >
                    <PromptDetailView
                      prompt={selectedPrompt}
                      isEditing={isEditing}
                      editedPrompt={editedPrompt || undefined}
              handleInputChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                        const { name, value } = e.target;
                setEditedPrompt(prev => prev ? { 
                  ...prev, 
                  [name]: value,
                } : null);
                      }}
              onSave={async () => {
                if (editedPrompt && editedPrompt.id) {
                  try {
                    const now = new Date();
                    const { isPublic, ...restOfEditedPrompt } = editedPrompt as Prompt & { isPublic?: boolean };
                    const updatedData = { 
                      ...restOfEditedPrompt, 
                      updatedAt: now,
                    };
                    const updated = await updatePrompt(updatedData);
                    setPrompts(prev => prev.map(p => p.id === updated.id ? updated : p).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
                    setShowDetailModal(false);
                      setIsEditing(false);
                    } catch (error) {
                      console.error('更新提示词失败:', error);
                      alert('更新提示词失败，请重试');
                    }
                }
                  }}
              onCancel={() => {
                setShowDetailModal(false);
                    setIsEditing(false);
              }}
              onDelete={() => {
                if (selectedPrompt) {
                  openDeleteModal(selectedPrompt);
                }
              }}
              onEdit={() => {
                setIsEditing(true);
                setEditedPrompt({ ...selectedPrompt });
              }}
              onCopy={() => selectedPrompt.id && handleCopyPrompt(selectedPrompt.id)}
            />
      </Modal>
        )}
      </div>
    </div>
  );
}







