/**
 * 提示词加密管理器
 * 用于管理提示词的加密和解密
 */
import { Prompt } from '@/data/database/types/prompt';
import { encryptText, decryptText, generateLocalEncryptionKey, isEncrypted } from './utils/encryption';

/**
 * 加密提示词内容
 * @param prompt 提示词
 * @returns 加密后的提示词
 */
export const encryptPrompt = async (prompt: Prompt | Omit<Prompt, 'id'>): Promise<Prompt | Omit<Prompt, 'id'>> => {
  try {
    // 使用本地存储的密钥或生成一个固定的密钥
    const key = generateLocalEncryptionKey();
    
    // 检查内容是否已加密
    if (isEncrypted(prompt.content, key)) {
      return prompt;
    }
    
    // 加密内容
    const encryptedContent = encryptText(prompt.content, key);
    
    return {
      ...prompt,
      content: encryptedContent
    };
  } catch (error) {
    console.error('加密提示词失败:', error);
    return prompt;
  }
};

/**
 * 解密提示词内容
 * @param prompt 提示词
 * @returns 解密后的提示词
 */
export const decryptPrompt = async (prompt: Prompt): Promise<Prompt> => {
  try {
    // 使用本地存储的密钥或生成一个固定的密钥
    const key = generateLocalEncryptionKey();
    
    // 检查内容是否已加密
    if (!isEncrypted(prompt.content, key)) {
      return prompt;
    }
    
    // 解密内容
    const decryptedContent = decryptText(prompt.content, key);
    
    return {
      ...prompt,
      content: decryptedContent
    };
  } catch (error) {
    console.error('解密提示词失败:', error);
    return prompt;
  }
};

/**
 * 解密提示词列表
 * @param prompts 提示词列表
 * @returns 解密后的提示词列表
 */
export const decryptPrompts = async (prompts: Prompt[]): Promise<Prompt[]> => {
  const decryptedPrompts = [];
  
  for (const prompt of prompts) {
    const decryptedPrompt = await decryptPrompt(prompt);
    decryptedPrompts.push(decryptedPrompt);
  }
  
  return decryptedPrompts;
};

/**
 * 按需解密提示词
 * 只有在需要使用提示词内容时才解密
 * @param prompt 提示词
 * @returns 解密后的提示词内容
 */
export const decryptPromptOnDemand = async (prompt: Prompt): Promise<string> => {
  try {
    // 使用本地存储的密钥或生成一个固定的密钥
    const key = generateLocalEncryptionKey();
    
    // 检查内容是否已加密
    if (!isEncrypted(prompt.content, key)) {
      return prompt.content;
    }
    
    // 解密内容
    return decryptText(prompt.content, key);
  } catch (error) {
    console.error('解密提示词失败:', error);
    return prompt.content;
  }
};
