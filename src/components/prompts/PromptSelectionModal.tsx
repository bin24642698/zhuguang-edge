/**
 * 通用提示词选择模态窗口组件
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/components/common/modals';
import { Prompt } from '@/data';
import { getAIInterfacePromptsByType, getPromptsByType, getPublicPrompts, getUserCreatedPrompts } from '@/data';
import { PROMPT_TYPE_LABELS } from '@/data/database/types/prompt';

interface PromptSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prompt: Prompt) => void;
  promptType: 'ai_writing' | 'ai_polishing' | 'ai_analysis';
  initialSelectedId?: string;
}

// 吉卜力风格棕色系颜色
const GHIBLI_COLORS = {
  brown: {
    primary: '#6d5c4d',      // 主色调
    light: '#8a7c70',        // 浅色
    dark: '#4b3b2a',         // 深色
    bg: '#f7f2ea',           // 背景色
    selected: '#e6dfd0',     // 选中背景色
    hover: '#f0e9df',        // 悬停背景色
    border: '#6d5c4d'        // 边框色
  }
};

// 提示词类型颜色映射
const promptTypeColors = {
  'ai_writing': 'bg-[#5a9d6b] text-[#5a9d6b]',
  'ai_polishing': 'bg-[#7D85CC] text-[#7D85CC]',
  'ai_analysis': 'bg-[#9C6FE0] text-[#9C6FE0]',
  'worldbuilding': 'bg-[#E0976F] text-[#E0976F]',
  'character': 'bg-[#E07F7F] text-[#E07F7F]',
  'plot': 'bg-[#8BAD97] text-[#8BAD97]',
  'introduction': 'bg-[#71A6D2] text-[#71A6D2]',
  'outline': 'bg-[#7D85CC] text-[#7D85CC]',
  'detailed_outline': 'bg-[#9C6FE0] text-[#9C6FE0]',
  'book_tool': 'bg-[#E0C56F] text-[#E0C56F]'
};

// 提示词类型图标映射
const promptTypeIcons = {
  'ai_writing': 'edit_note',
  'ai_polishing': 'auto_fix_high',
  'ai_analysis': 'analytics',
  'worldbuilding': 'public',
  'character': 'person',
  'plot': 'timeline',
  'introduction': 'description',
  'outline': 'format_list_bulleted',
  'detailed_outline': 'format_list_numbered',
  'book_tool': 'book'
};

/**
 * 通用提示词选择模态窗口组件
 */
export const PromptSelectionModal: React.FC<PromptSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  promptType,
  initialSelectedId
}) => {
  // 状态
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 20;

  const loadPrompts = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    setError('');
    try {
      const loadedPrompts = await getAIInterfacePromptsByType(promptType, false);
      setPrompts(loadedPrompts);

      if (initialSelectedId) {
        const selected = loadedPrompts.find(p => p.id === initialSelectedId);
        if (selected) {
          setSelectedPrompt(selected);
        }
      }
    } catch (error) {
      console.error('加载提示词失败:', error);
      setError('加载提示词失败');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, promptType, initialSelectedId]);

  useEffect(() => {
    let filtered = prompts;
    if (searchTerm) {
      filtered = prompts.filter(prompt =>
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prompt.description && prompt.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredPrompts(filtered.slice(0, page * PAGE_SIZE));
    setHasMore(filtered.length > page * PAGE_SIZE);
  }, [prompts, searchTerm, page, PAGE_SIZE]);

  useEffect(() => {
    if (isOpen) {
      loadPrompts();
      setPage(1);
    }
  }, [isOpen, loadPrompts]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || !hasMore || isLoading) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, isLoading]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handlePromptClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
  };

  const handlePromptSelect = () => {
    if (selectedPrompt) {
      onSelect(selectedPrompt);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6d5c4d] to-[#4b3b2a] flex items-center justify-center mr-3 text-white shadow-md">
            <span className="material-icons text-lg">{promptTypeIcons[promptType]}</span>
          </div>
          <span style={{fontFamily: "'Ma Shan Zheng', cursive"}} className="text-xl text-text-dark relative">
            选择{PROMPT_TYPE_LABELS[promptType]}提示词
            <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#6d5c4d]/30 via-[#6d5c4d]/60 to-[#6d5c4d]/30 rounded-full"></span>
          </span>
        </div>
      }
      footer={
        <div className="flex justify-end space-x-3">
          <button
            onClick={handlePromptSelect}
            disabled={!selectedPrompt}
            className={`px-4 py-2 rounded-lg text-white transition-all duration-200 ${
              selectedPrompt
                ? 'bg-gradient-to-br from-[#6d5c4d] to-[#4b3b2a] hover:shadow-md'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center">
              <span className="material-icons text-sm mr-1">check</span>
              选择提示词
            </span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#8a7c70] text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
          >
            取消
          </button>
        </div>
      }
      maxWidth="max-w-2xl"
    >
      <div className="h-[500px] flex flex-col bg-[#fcfcfa] rounded-lg shadow-inner">
        <div className="p-3 bg-[#f7f6f1] rounded-t-lg border-b border-[#8a7c70]/30 shadow-sm">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-icons text-gray-400">search</span>
            </div>
            <input
              type="text"
              placeholder="搜索提示词..."
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-[#8a7c70]/50 focus:ring-2 focus:ring-[#6d5c4d]/50 focus:border-[#6d5c4d] outline-none transition-colors bg-white shadow-sm text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-grow overflow-y-auto p-3 space-y-2"
          onScroll={handleScroll}
        >
          {isLoading && prompts.length === 0 && (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6d5c4d]"></div>
            </div>
          )}
          {!isLoading && filteredPrompts.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <span className="material-icons text-4xl mb-2">search_off</span>
              <p>没有找到匹配的提示词</p>
            </div>
          )}
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              onClick={() => handlePromptClick(prompt)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between border
                ${selectedPrompt?.id === prompt.id
                  ? 'bg-[#e6dfd0] border-[#6d5c4d] shadow-md'
                  : 'bg-white hover:bg-[#f0e9df] border-transparent hover:border-[#8a7c70]/50'
                }`}
            >
              <div>
                <h3 className={`font-medium ${selectedPrompt?.id === prompt.id ? 'text-[#4b3b2a]' : 'text-gray-700'}`}>{prompt.title}</h3>
                {prompt.description && (
                  <p className={`text-xs mt-1 ${selectedPrompt?.id === prompt.id ? 'text-[#6d5c4d]' : 'text-gray-500'}`}>{prompt.description}</p>
                )}
              </div>
              {selectedPrompt?.id === prompt.id && (
                <span className="material-icons text-[#4b3b2a]">check_circle</span>
              )}
            </div>
          ))}
          {isLoading && prompts.length > 0 && (
             <div className="flex justify-center py-2">
               <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#6d5c4d]"></div>
             </div>
           )}
        </div>
      </div>
    </Modal>
  );
};

export default PromptSelectionModal;
