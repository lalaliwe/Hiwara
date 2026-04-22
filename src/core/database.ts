import Database from '@tauri-apps/plugin-sql';
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
      // 检查表是否存在
      const result: Array<{ name: string }> = await sqlDB.select(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='users'`
      );
      if (result.length === 0) {
        // 表不存在，创建表
        await sqlDB.execute(`CREATE TABLE IF NOT EXISTS users (
          uuid TEXT PRIMARY KEY,
          uid TEXT,
          name TEXT,
          username TEXT,
          email TEXT,
          password TEXT,
          token TEXT
        );`);
        // console.log('Users table created.');
      } else {
        // console.log('Users table already exists.');
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
export function login(email: string = '', password: string = '', token: string = ''): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // 删除现有所有用户数据，确保表中只有一行
      await sqlDB.execute(`DELETE FROM users`);

      const uuid = generateUUID();
      await sqlDB.execute(`INSERT INTO users (uuid, uid, name, username, email, password, token) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuid, null, null, null, email, password, token]
      );
      console.log('User logged in and saved with uuid:', uuid);
      resolve();
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