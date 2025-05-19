'use client';

import React, { useState } from 'react';
import { Prompt } from '@/data';
import { PromptContentEditModal } from './PromptContentEditModal';

// 提示词类型映射
export const promptTypeMap = {
  'ai_writing': { label: 'AI写作', color: 'bg-[#E0976F20] text-[#E0976F]', icon: 'create', gradient: 'from-[#E0976F] to-[#E0C56F]' },
  'ai_polishing': { label: 'AI润色', color: 'bg-[#6F9CE020] text-[#6F9CE0]', icon: 'auto_fix_high', gradient: 'from-[#6F9CE0] to-[#9C6FE0]' },
  'ai_analysis': { label: 'AI分析', color: 'bg-[#7D85CC20] text-[#7D85CC]', icon: 'analytics', gradient: 'from-[#7D85CC] to-[#6F9CE0]' },
  'worldbuilding': { label: '世界观', color: 'bg-[#E06F9C20] text-[#E06F9C]', icon: 'public', gradient: 'from-[#E06F9C] to-[#E0976F]' },
  'character': { label: '角色', color: 'bg-[#9C6FE020] text-[#9C6FE0]', icon: 'person', gradient: 'from-[#9C6FE0] to-[#7D85CC]' },
  'plot': { label: '情节', color: 'bg-[#6F9CE020] text-[#6F9CE0]', icon: 'timeline', gradient: 'from-[#6F9CE0] to-[#9C6FE0]' },
  'introduction': { label: '导语', color: 'bg-[#7D85CC20] text-[#7D85CC]', icon: 'format_quote', gradient: 'from-[#7D85CC] to-[#6F9CE0]' },
  'outline': { label: '大纲', color: 'bg-[#E0976F20] text-[#E0976F]', icon: 'format_list_bulleted', gradient: 'from-[#E0976F] to-[#E0C56F]' },
  'detailed_outline': { label: '细纲', color: 'bg-[#E0C56F20] text-[#E0C56F]', icon: 'subject', gradient: 'from-[#E0C56F] to-[#E0976F]' },
  'book_tool': { label: '一键拆书', color: 'bg-[#E0976F20] text-[#E0976F]', icon: 'auto_stories', gradient: 'from-[#E0976F] to-[#E0C56F]' }
};

// 将类型颜色转换为胶带颜色
const getTypeColor = (type: string): string => {
  const colorClass = promptTypeMap[type as keyof typeof promptTypeMap]?.color.split(' ')[1] || 'text-[#7D85CC]';
  // 从 text-[#7D85CC] 提取 #7D85CC
  const colorHex = colorClass.match(/#[0-9A-Fa-f]{6}/)?.[0] || '#7D85CC';
  return colorHex.replace('#', 'rgba(') + ', 0.7)';
};

interface PromptDetailContentProps {
  prompt: Prompt;
  isEditing: boolean;
  editedPrompt?: Prompt;
  handleInputChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleExampleChange?: (index: number, value: string) => void;
  addExample?: () => void;
  removeExample?: (index: number) => void;
  showEditButtons?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
}

/**
 * 提示词详情/编辑组件 - 吉卜力风格版本
 */
export function PromptDetailContent({
  prompt,
  isEditing = false,
  editedPrompt,
  handleInputChange,
  handleExampleChange,
  addExample,
  removeExample,
  showEditButtons = true,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onCopy
}: PromptDetailContentProps) {
  // 状态
  const [isContentEditModalOpen, setIsContentEditModalOpen] = useState(false);

  // 提示词类型的信息
  const typeInfo = promptTypeMap[prompt.type as keyof typeof promptTypeMap];
  const typeColor = getTypeColor(prompt.type);

  // 格式化日期显示
  const formatDate = (date: Date | string | number) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 处理内容变更
  const handleContentChange = (newContent: string) => {
    if (handleInputChange) {
      handleInputChange({
        target: {
          name: 'content',
          value: newContent
        }
      } as React.ChangeEvent<HTMLTextAreaElement>);
    }
  };

  if (!isEditing) {
    // 查看模式
    return (
      <div className="ghibli-card p-6 animate-fadeIn relative min-h-[500px] flex flex-col">
        {/* 顶部胶带 */}
        <div className="tape" style={{ backgroundColor: typeColor }}>
          <div className="tape-texture"></div>
        </div>

        {/* 标题和类型栏 */}
        <div className="flex items-center justify-end mb-6 mt-4">
          <div className="flex items-center">
            <span className={`flex items-center px-3 py-1 rounded-full text-sm ${typeInfo.color}`}>
              <span className="material-icons mr-1 text-sm">{typeInfo.icon}</span>
              {typeInfo.label}
            </span>
          </div>
        </div>

        {/* 提示词内容区 */}
        <div className="mb-6 flex-grow">
          {prompt.description ? (
            <div className="h-full">
              <div className="p-5 bg-white bg-opacity-50 rounded-xl border border-[rgba(120,180,140,0.2)] min-h-[320px]">
                <p className="whitespace-pre-wrap text-text-medium">{prompt.description}</p>
              </div>
            </div>
          ) : (
            <div className="h-full">
              <div className="p-5 bg-white bg-opacity-50 rounded-xl border border-[rgba(120,180,140,0.2)] text-center min-h-[320px] flex items-center justify-center">
                <p className="text-text-light italic">暂无描述信息</p>
              </div>
            </div>
          )}
        </div>

        {/* 底部元信息 */}
        <div className="flex items-center justify-between text-text-light text-sm mt-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="material-icons text-xs mr-1">event</span>
              创建于: {formatDate(prompt.createdAt)}
            </div>
            {prompt.isPublic && (
              <div className="flex items-center text-green-600">
                <span className="material-icons text-xs mr-1">public</span>
                公开提示词
              </div>
            )}
          </div>
          <div className="flex items-center">
            <span className="material-icons text-xs mr-1">update</span>
            更新于: {formatDate(prompt.updatedAt)}
          </div>
        </div>

        {/* 翻页效果 */}
        <div className="page-curl"></div>

        {/* 操作按钮区 */}
        {showEditButtons && (
          <div className="flex justify-end mt-6 space-x-3">
            {onCopy && (
              <button
                onClick={onCopy}
                className="btn-outline flex items-center text-sm px-4 py-2 text-[#6F9CE0] border-[#6F9CE0]"
              >
                <span className="material-icons mr-1 text-sm">content_copy</span>
                复制
              </button>
            )}

            {onDelete && onEdit && (
              <>
                <button
                  onClick={onEdit}
                  className="btn-outline flex items-center text-sm px-4 py-2"
                >
                  <span className="material-icons mr-1 text-sm">edit</span>
                  编辑
                </button>

                <button
                  onClick={onDelete}
                  className="btn-outline flex items-center text-sm px-4 py-2 text-[#E06F6F] border-[#E06F6F]"
                >
                  <span className="material-icons mr-1 text-sm">delete</span>
                  删除
                </button>
              </>
            )}

            {onDelete && !onEdit && (
              <button
                onClick={onDelete}
                className="btn-outline flex items-center text-sm px-4 py-2 text-[#E06F6F] border-[#E06F6F]"
              >
                <span className="material-icons mr-1 text-sm">delete</span>
                删除
              </button>
            )}

            {onEdit && !onDelete && (
              <button
                onClick={onEdit}
                className="btn-outline flex items-center text-sm px-4 py-2"
              >
                <span className="material-icons mr-1 text-sm">edit</span>
                编辑
              </button>
            )}
          </div>
        )}
      </div>
    );
  } else {
    // 编辑模式
    return (
      <div className="ghibli-card p-6 animate-fadeIn relative min-h-[500px] flex flex-col">
        {/* 顶部胶带 */}
        <div className="tape" style={{ backgroundColor: typeColor }}>
          <div className="tape-texture"></div>
        </div>

        <div className="mt-6 flex-grow">
          <form className="space-y-6 h-full flex flex-col">
            {/* 提示词标题 */}
            <div>
              <label className="block text-text-dark font-medium mb-2">标题</label>
              <input
                type="text"
                name="title"
                className="w-full px-4 py-2 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark"
                placeholder="输入提示词标题..."
                value={editedPrompt?.title || ''}
                onChange={handleInputChange}
              />
            </div>

            {/* 提示词内容 */}
            <div>
              <label className="block text-text-dark font-medium mb-2">内容</label>
              <div
                className="w-full px-4 py-3 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark min-h-[120px] overflow-y-auto break-words whitespace-pre-wrap cursor-pointer hover:bg-white hover:bg-opacity-90 transition-colors"
                onClick={() => setIsContentEditModalOpen(true)}
              >
                {editedPrompt?.content ? '点击修改提示词' : '点击此处编辑提示词内容...'}
              </div>

              {/* 内容编辑弹窗 */}
              <PromptContentEditModal
                isOpen={isContentEditModalOpen}
                onClose={() => setIsContentEditModalOpen(false)}
                content={editedPrompt?.content || ''}
                onChange={handleContentChange}
                onSave={() => {}}
              />
            </div>

            {/* 提示词描述 */}
            <div className="flex-grow flex flex-col">
              <label className="block text-text-dark font-medium mb-2">描述 <span className="text-text-light text-sm">(可选)</span></label>
              <textarea
                name="description"
                className="w-full px-4 py-3 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark flex-grow min-h-[160px]"
                placeholder="简短描述提示词的用途..."
                value={editedPrompt?.description || ''}
                onChange={handleInputChange}
              ></textarea>
            </div>

            {/* 公开设置 */}
            <div>
              <label className="block text-text-dark font-medium mb-2">提示词权限</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={editedPrompt?.isPublic || false}
                    onChange={(e) => {
                      if (handleInputChange) {
                        const event = {
                          target: {
                            name: 'isPublic',
                            value: e.target.checked
                          }
                        } as unknown as React.ChangeEvent<HTMLInputElement>;
                        handleInputChange(event);
                      }
                    }}
                    className="form-checkbox h-5 w-5 text-[#5a9d6b] rounded border-[rgba(120,180,140,0.5)]"
                  />
                  <span className="text-text-medium">允许其他用户查看和使用此提示词</span>
                </label>
              </div>
              <p className="text-text-light text-sm mt-1">
                <span className="material-icons text-xs align-middle mr-1">info</span>
                公开的提示词可以被所有用户查看和使用，但内容仍然保持加密状态
              </p>
            </div>

            {/* 示例管理 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-text-dark font-medium">示例 <span className="text-text-light text-sm">(可选)</span></label>
                {addExample && (
                  <button
                    type="button"
                    onClick={addExample}
                    className="flex items-center text-sm text-[#5a9d6b] hover:underline"
                  >
                    <span className="material-icons mr-1 text-sm">add</span>
                    添加示例
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {editedPrompt?.examples && editedPrompt.examples.map((example, index) => (
                  <div key={index} className="flex items-start">
                    <textarea
                      className="flex-grow px-4 py-2 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark"
                      placeholder={`示例 ${index + 1}...`}
                      value={example}
                      onChange={(e) => handleExampleChange && handleExampleChange(index, e.target.value)}
                      rows={2}
                    ></textarea>
                    {removeExample && (
                      <button
                        type="button"
                        onClick={() => removeExample(index)}
                        className="ml-2 text-[#E06F6F] hover:text-[#d85050]"
                      >
                        <span className="material-icons">delete</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end mt-6 space-x-3">
          {onSave && (
            <button
              onClick={onSave}
              className="btn-fill flex items-center text-sm px-4 py-2"
            >
              <span className="material-icons mr-1 text-sm">save</span>
              保存
            </button>
          )}
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="btn-outline flex items-center text-sm px-4 py-2"
            >
              <span className="material-icons mr-1 text-sm">cancel</span>
              取消
            </button>
          )}
        </div>

        {/* 翻页效果 */}
        <div className="page-curl"></div>
      </div>
    );
  }
}





