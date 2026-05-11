import Database from '@tauri-apps/plugin-sql';
import { videoDir, pictureDir, join } from '@tauri-apps/api/path';
const sqlDB = await Database.load('sqlite:database.db');

// 生成UUID的辅助函数
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 初始化数据库
export function initDatabase(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // 独立检查并创建用户表
      const userResult: Array<{ name: string }> = await sqlDB.select(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='users'`
      );
      if (userResult.length === 0) {
        await sqlDB.execute(`CREATE TABLE IF NOT EXISTS users (
          uuid TEXT PRIMARY KEY,
          uid TEXT,
          username TEXT,
          email TEXT,
          password TEXT,
          token TEXT
        );`);
      }
      // 独立检查并创建设置表
      const setupResult: Array<{ name: string }> = await sqlDB.select(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='setup'`
      );

      if (setupResult.length === 0) {
        await sqlDB.execute(`CREATE TABLE IF NOT EXISTS setup (
          auto_play BOOLEAN,
          reconnect INTEGER,
          definition TEXT,
          search_mode INTEGER,
          language TEXT,
          video_save_path TEXT,
          image_save_path TEXT,
          aria2_rpc TEXT,
          aria2_token TEXT,
          aria2_download TEXT,
          aria2_switch BOOLEAN
        );`);

        // 获取系统默认路径并构建iwara目录
        const videoPath = await videoDir();
        const imagePath = await pictureDir();
        const videoSavePath = await join(videoPath, 'iwara');
        const imageSavePath = await join(imagePath, 'iwara');

        // 插入默认设置数据
        await sqlDB.execute(`INSERT INTO setup (auto_play, reconnect, definition, search_mode, language, video_save_path, image_save_path, aria2_rpc, aria2_token, aria2_download, aria2_switch) VALUES (TRUE, 1, 'Source', 0, 'auto', ?, ?, '', '', '', FALSE);`, [videoSavePath, imageSavePath]);
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// 检查用户是否已经登录
export function checkUserIsLogin(): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      const result: Array<{ count: number }> = await sqlDB.select(
        `SELECT COUNT(*) as count FROM users WHERE token IS NOT NULL AND token != ''`
      );
      resolve(result[0].count > 0);
    } catch (error) {
      reject(error);
    }
  });
}

// 登录：插入用户到数据库，确保表中最多只有一行数据
export function login(
  email: string,
  password: string,
  token: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // 删除现有所有用户数据，确保表中只有一行
      await sqlDB.execute(`DELETE FROM users`);
      const uuid = generateUUID();
      await sqlDB.execute(`INSERT INTO users (uuid, email, password, token) VALUES (?, ?, ?, ?)`,
        [uuid, email, password, token]
      );
      console.log('User logged in and saved with uuid:', uuid);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// 修改用户信息（uid，username）
export function updateUserInfo(uid: string, username: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      await sqlDB.execute(`UPDATE users SET uid = ?, username = ?`,
        [uid, username]
      );
      console.log('User info updated:', uid, username);
      resolve();
    } catch (error) {
      reject(error);
    }
  })
}

// 获取用户信息（uid 和 username）
export function getUserInfo(): Promise<{ uid: string | null, username: string | null }> {
  return new Promise(async (resolve, reject) => {
    try {
      const result: Array<any> = await sqlDB.select(`SELECT uid, username FROM users LIMIT 1`);
      if (result.length > 0) {
        resolve({
          uid: result[0].uid || null,
          username: result[0].username || null
        });
      } else {
        resolve({ uid: null, username: null });
      }
    } catch (error) {
      reject(error);
    }
  });
}

// 返回上次登录记住的用户email和password
export function getLastLoginAuth(): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      const result: Array<any> = await sqlDB.select(`SELECT email, password FROM users LIMIT 1`);
      if (result.length > 0) {
        resolve(result[0]);
      } else {
        resolve(null);
      }
    } catch (error) {
      reject(error);
    }
  });
}

// 获取用户token
export function getUserToken(): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const result: Array<{ token: string }> = await sqlDB.select(`SELECT token FROM users LIMIT 1`);
      if (result.length > 0) {
        resolve(result[0].token);
      } else {
        reject({
          message: '用户未登录'
        });
      }
    } catch (error) {
      reject(error);
    }
  })
}

// 获取设置数据
export async function getSetupData(): Promise<any> {
  try {
    const result: Array<any> = await sqlDB.select(`SELECT * FROM setup LIMIT 1`);
    if (result.length > 0) {
      return result[0];
    } else {
      // 如果没有找到设置数据，返回默认值
      return {
        auto_play: true,
        reconnect: 1,
        definition: 'Source',
        search_mode: 0,
        language: 'auto',
        video_save_path: '',
        image_save_path: '',
        aria2_rpc: '',
        aria2_token: '',
        aria2_download: '~/Downloads/Iwara',
        aria2_switch: false
      };
    }
  } catch (error) {
    console.error('Error fetching setup data:', error);
    // 发生错误时返回默认值
    return {
      auto_play: true,
      reconnect: 1,
      definition: 'Source',
      search_mode: 0,
      language: 'auto',
      video_save_path: '',
      image_save_path: '',
      aria2_rpc: '',
      aria2_token: '',
      aria2_download: '~/Downloads/Iwara',
      aria2_switch: false
    };
  }
}

// 更新设置数据
export async function updateSetupData(setupData: any): Promise<void> {
  try {
    // 由于setup表只应该有一条记录，我们使用UPDATE而不使用INSERT或DELETE
    let updateFields = [];
    let values = [];

    for (const [key, value] of Object.entries(setupData)) {
      updateFields.push(`${key} = ?`);
      values.push(value);
    }

    const updateQuery = `UPDATE setup SET ${updateFields.join(', ')}`;
    await sqlDB.execute(updateQuery, values);
  } catch (error) {
    console.error('Error updating setup data:', error);
    throw error;
  }
}
