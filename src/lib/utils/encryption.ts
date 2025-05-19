/**
 * 加密工具模块
 * 使用 crypto-js 实现 AES 加密和解密
 */
import CryptoJS from 'crypto-js';

/**
 * 生成加密密钥 (旧的，依赖userId)
 * 使用用户ID和固定的盐值生成密钥
 * @param userId 用户ID
 * @returns 加密密钥
 */
export const generateEncryptionKey = (userId: string): string => {
  // 固定的盐值，可以存储在环境变量中
  const salt = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || 'zhuguang_encryption_salt';
  // 使用用户ID和盐值生成密钥
  return CryptoJS.PBKDF2(userId, salt, {
    keySize: 256 / 32,
    iterations: 1000
  }).toString();
};

/**
 * 生成本地加密密钥 (新的，不依赖userId)
 * 检查本地存储中是否已有密钥，如果没有则生成并存储。
 * @returns 本地加密密钥
 */
export const generateLocalEncryptionKey = (): string => {
  const storedKey = localStorage.getItem('zhuguang_local_encryption_key');
  if (storedKey) {
    return storedKey;
  }
  // 生成一个足够随机的密钥
  const newKey = CryptoJS.lib.WordArray.random(256 / 8).toString(CryptoJS.enc.Hex);
  localStorage.setItem('zhuguang_local_encryption_key', newKey);
  return newKey;
};

/**
 * 加密文本
 * @param text 要加密的文本
 * @param key 加密密钥
 * @returns 加密后的文本
 */
export const encryptText = (text: string, key: string): string => {
  try {
    return CryptoJS.AES.encrypt(text, key).toString();
  } catch (error) {
    console.error('加密失败:', error);
    throw new Error('加密失败');
  }
};

/**
 * 解密文本
 * @param encryptedText 加密的文本
 * @param key 解密密钥
 * @returns 解密后的文本
 */
export const decryptText = (encryptedText: string, key: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) { // 处理解密失败但未抛出错误的情况 (例如密钥错误)
      throw new Error('Decryption failed or resulted in empty string');
    }
    return decrypted;
  } catch (error) {
    console.error('解密失败:', error);
    // 不直接抛出 '解密失败'，而是更具体的错误或让调用者处理
    // return ''; // 或者返回一个明确的失败指示，而不是空字符串
    throw error; // 重新抛出原始错误，以便上层能捕获到具体问题
  }
};

/**
 * 检查文本是否已加密
 * 通过尝试解密来判断
 * @param text 要检查的文本
 * @param key 解密密钥
 * @returns 是否已加密
 */
export const isEncrypted = (text: string, key: string): boolean => {
  if (!text || !text.startsWith('U2F')) { // 基本的检查，加密字符串通常有特定格式或前缀
    return false;
  }
  try {
    const decrypted = decryptText(text, key);
    // 如果能成功解密并且解密后的内容不是原始的加密标记（针对某些简单加密场景）
    return decrypted !== text; // 确保解密后的内容有变化
  } catch (error) {
    // 解密失败，说明不是用这个key加密的，或者文本本身已损坏
    return false;
  }
};
