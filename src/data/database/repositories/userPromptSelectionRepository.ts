/**
 * 用户提示词选择仓库 (纯本地存储逻辑)
 */
import { UserPromptSelection } from '../types/userPromptSelection';
import { dbOperations } from '../core/operations';
import { DB_CONFIG } from '../config';

const { MAIN } = DB_CONFIG.NAMES;
const { USER_PROMPT_SELECTIONS } = DB_CONFIG.STORES.MAIN;

/**
 * 获取当前用户所有选择的提示词ID列表 (本地)
 * @returns 提示词ID字符串数组
 */
export const getUserPromptSelections = async (userId?: string): Promise<string[]> => {
  const selections = await dbOperations.getAll<UserPromptSelection>(MAIN, USER_PROMPT_SELECTIONS);
  // 如果传入 userId，则按 userId 过滤，否则返回所有本地选择 (单用户场景)
  const userSelections = userId 
    ? selections.filter(selection => selection.userId === userId)
    : selections;
  return userSelections.map(selection => String(selection.promptId));
};

/**
 * 添加提示词到用户选择 (本地)
 * @param promptId 提示词ID
 * @param userId 可选的用户ID (用于未来多用户本地存储)
 * @returns 添加的用户提示词选择对象
 */
export const addUserPromptSelection = async (promptId: string, userId: string = 'local_user'): Promise<UserPromptSelection> => {
  const newSelection: UserPromptSelection = {
    userId: userId, // 使用传入的userId或默认值
    promptId: promptId,
    createdAt: new Date(),
  };
  // 本地存储通常不需要 idb 生成的自增 ID，但如果 UserPromptSelection 类型需要 id，则需要处理
  // 假设 UserPromptSelection 的 id 是可选的，或者由 promptId 和 userId 构成复合主键
  
  // 检查是否已存在 (基于 promptId 和 userId)
  const existingSelections = await dbOperations.getAll<UserPromptSelection>(MAIN, USER_PROMPT_SELECTIONS);
  const alreadyExists = existingSelections.some(sel => sel.promptId === promptId && sel.userId === userId);

  if (alreadyExists) {
    // 如果已存在，可以返回已存在的选择或抛出错误/警告
    console.warn(`Prompt ID ${promptId} is already selected by user ${userId}.`);
    return existingSelections.find(sel => sel.promptId === promptId && sel.userId === userId)!;
  }

  // 添加到本地数据库
  // dbOperations.add 可能返回带自增id的对象，需要适配UserPromptSelection类型
  const addedSelection = await dbOperations.add<UserPromptSelection>(MAIN, USER_PROMPT_SELECTIONS, newSelection);
  return addedSelection; // 或者 return newSelection 如果不关心db自增id
};

/**
 * 从用户选择中移除提示词 (本地)
 * @param promptId 提示词ID
 * @param userId 可选的用户ID
 */
export const removeUserPromptSelection = async (promptId: string, userId: string = 'local_user'): Promise<void> => {
  // 从本地数据库移除，需要一种方式来唯一标识要删除的记录
  // 如果 UserPromptSelection 存储时没有唯一的 id (非 promptId)，可能需要先查询再删除
  // 或者 dbOperations.remove 支持按条件删除 (例如，删除所有 userId 和 promptId 匹配的记录)
  
  // 简单实现：获取所有，过滤，然后用特定 id 删除 (如果 UserPromptSelection 有 id 字段)
  // 这是一个低效的方法，理想情况下 dbOperations.remove 应支持更精确的删除
  const selections = await dbOperations.getAll<UserPromptSelection>(MAIN, USER_PROMPT_SELECTIONS);
  const selectionToRemove = selections.find(sel => sel.promptId === promptId && sel.userId === userId);

  if (selectionToRemove && selectionToRemove.id) { // 假设 UserPromptSelection 有一个唯一的自增 id
    return dbOperations.remove(MAIN, USER_PROMPT_SELECTIONS, selectionToRemove.id);
  } else if (selectionToRemove) {
    // 如果没有自增 id，dbOperations.remove 可能需要支持传递整个对象或复合键进行删除
    console.warn('Cannot remove selection without a unique ID or proper remove criteria.');
    // 或者，如果 dbOperations.remove 可以通过 promptId (如果它在表中是唯一的key) 删除
    // return dbOperations.remove(MAIN, USER_PROMPT_SELECTIONS, promptId); // 这取决于 dbOperations 实现
  } else {
    console.warn(`No selection found for prompt ID ${promptId} and user ${userId} to remove.`);
  }
  // 如果没有找到或者无法删除，静默处理或抛出错误
};

/**
 * 检查提示词是否已被用户选择 (本地)
 * @param promptId 提示词ID
 * @param userId 可选的用户ID
 * @returns 是否已被选择
 */
export const isPromptSelectedByUser = async (promptId: string, userId: string = 'local_user'): Promise<boolean> => {
  const selections = await getUserPromptSelections(userId);
  return selections.includes(String(promptId));
};

// 确保所有导出的函数仅依赖本地 dbOperations
// 移除了所有 Supabase 相关函数及 useSupabase 工具函数
