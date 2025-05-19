/**
 * 提示词仓库 (纯本地存储逻辑)
 */
import { Prompt } from '../types/prompt';
import { dbOperations } from '../core/operations';
import { DB_CONFIG } from '../config';
import { encryptPrompt, decryptPrompt, decryptPrompts } from '@/lib/promptEncryptionManager';

const { MAIN } = DB_CONFIG.NAMES;
const { PROMPTS } = DB_CONFIG.STORES.MAIN;

/**
 * 添加提示词到本地存储
 * @param prompt 提示词数据 (无ID)
 * @returns 添加后的提示词 (包含ID)
 */
export const addPrompt = async (prompt: Omit<Prompt, 'id'>): Promise<Prompt> => {
  const encryptedPrompt = await encryptPrompt(prompt) as Omit<Prompt, 'id'>;
  return dbOperations.add<Prompt>(MAIN, PROMPTS, encryptedPrompt);
};

/**
 * 获取所有本地存储的提示词
 * @param decryptContents 是否解密内容
 * @returns 所有提示词数组
 */
export const getAllPrompts = async (decryptContents: boolean = false): Promise<Prompt[]> => {
  const prompts = await dbOperations.getAll<Prompt>(MAIN, PROMPTS);
  const sortedPrompts = prompts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  if (decryptContents) {
    return await decryptPrompts(sortedPrompts);
  }
  return sortedPrompts;
};

/**
 * 根据类型获取本地存储的提示词
 * @param type 提示词类型
 * @param decryptContents 是否解密内容
 * @returns 指定类型的提示词数组
 */
export const getPromptsByType = async (type: Prompt['type'], decryptContents: boolean = false): Promise<Prompt[]> => {
  const prompts = await dbOperations.getAll<Prompt>(MAIN, PROMPTS);
  const filteredPrompts = prompts.filter(prompt => prompt.type === type);
  const sortedPrompts = filteredPrompts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  if (decryptContents) {
    return await decryptPrompts(sortedPrompts);
  }
  return sortedPrompts;
};

/**
 * 根据ID获取本地存储的提示词
 * @param id 提示词ID
 * @param decryptContent 是否解密内容
 * @returns 提示词对象或null
 */
export const getPromptById = async (id: string, decryptContent: boolean = false): Promise<Prompt | null> => {
  const prompt = await dbOperations.getById<Prompt>(MAIN, PROMPTS, id);
  if (!prompt) return null;
  if (decryptContent) {
    return await decryptPrompt(prompt);
  }
  return prompt;
};

/**
 * 更新本地存储的提示词
 * @param prompt 提示词对象 (包含ID)
 * @returns 更新后的提示词对象
 */
export const updatePrompt = async (prompt: Prompt): Promise<Prompt> => {
  if (!prompt.id) throw new Error('Prompt ID is required for update');
  const encryptedPrompt = await encryptPrompt(prompt) as Prompt;
  return dbOperations.update<Prompt & { id: string }>(MAIN, PROMPTS, { ...encryptedPrompt, id: String(prompt.id) });
};

/**
 * 删除本地存储的提示词
 * @param id 提示词ID
 */
export const deletePrompt = async (id: string): Promise<void> => {
  return dbOperations.remove(MAIN, PROMPTS, id);
};

/**
 * 检查提示词是否属于当前用户 (本地逻辑调整)
 * 由于是纯本地存储，此函数主要用于保持接口一致性，或在未来扩展多用户本地存储时使用。
 * @param prompt 提示词对象
 * @param userId 可选的用户ID
 * @returns 布尔值
 */
export const isUserPrompt = async (prompt: Prompt, userId?: string): Promise<boolean> => {
  // 在纯本地单用户场景下，可以简单返回 true
  // 如果 Prompt 类型包含 userId 并且传入了 userId，可以进行校验
  if (userId && prompt.userId) {
    return prompt.userId === userId;
  }
  // 默认情况下，或 prompt.userId 未定义时，认为是当前用户的
  return true;
};

/**
 * 复制提示词 (纯本地逻辑)
 * @param promptId 要复制的提示词ID
 * @returns 复制成功后的新提示词对象
 */
export const copyPrompt = async (promptId: string): Promise<Prompt> => {
  const originalPrompt = await getPromptById(promptId, true); // 获取解密后的原提示词
  if (!originalPrompt) {
    throw new Error('要复制的提示词不存在。');
  }

  // 创建新提示词数据，ID会在addPrompt时自动生成
  const newPromptData: Omit<Prompt, 'id'> = {
    title: `${originalPrompt.title} (复制)`,
    type: originalPrompt.type,
    content: originalPrompt.content, // 内容已解密
    description: originalPrompt.description,
    examples: originalPrompt.examples,
    isPublic: false, // 复制的提示词默认为私有
    userId: originalPrompt.userId, // 可以选择保留或清除userId
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // 如果原始提示词有 publicChangedAt, 可以选择不复制或设为undefined
  if ('publicChangedAt' in newPromptData) {
    delete (newPromptData as Partial<Prompt>).publicChangedAt;
  }

  return addPrompt(newPromptData);
};

/**
 * 获取适用于 AI 接口的提示词 (本地实现)
 * @param type 提示词类型
 * @param decryptContents 是否解密内容
 * @returns 提示词数组
 */
export const getAIInterfacePromptsByType = async (
  type: Prompt['type'], 
  decryptContents: boolean = false
): Promise<Prompt[]> => {
  // 直接复用 getPromptsByType 函数，因为在本地环境中不需要区分
  return getPromptsByType(type, decryptContents);
};

/**
 * 获取公共提示词（本地实现）
 * 在纯本地环境中，所有提示词都视为"公共"（或对当前用户可见）
 * @param type 提示词类型
 * @param decryptContents 是否解密内容
 * @returns 提示词数组
 */
export const getPublicPrompts = async (
  type: Prompt['type'], 
  decryptContents: boolean = false
): Promise<Prompt[]> => {
  // 在本地环境中，直接返回所有指定类型的提示词
  return getPromptsByType(type, decryptContents);
};

/**
 * 获取用户创建的提示词（本地实现）
 * 在纯本地环境中，所有提示词都是当前用户创建的
 * @param type 提示词类型
 * @param decryptContents 是否解密内容
 * @returns 提示词数组
 */
export const getUserCreatedPrompts = async (
  type: Prompt['type'], 
  decryptContents: boolean = false
): Promise<Prompt[]> => {
  // 在本地环境中，直接返回所有指定类型的提示词
  return getPromptsByType(type, decryptContents);
};

// 确保所有导出的函数仅依赖本地 dbOperations
// 移除了所有 Supabase 相关函数及 useSupabase 工具函数
// 移除了与多用户共享、公共提示词、用户选择等相关的函数，因为这些功能依赖云端服务
