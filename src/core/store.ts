import { defineStore } from 'pinia';
import { getSetupData, updateSetupData, checkUserIsLogin } from './database';

export const isLogin = defineStore('isLogin', {
  state: () => ({
    value: false, // 登录状态，默认为false
  }),
  getters: {
    // 如果需要，可以在这里添加getter
  },
  actions: {
    // 设置登录状态的方法
    set(status: boolean) {
      this.value = status;
    },
    // 从数据库初始化登录状态
    async initFromDatabase() {
      try {
        const isLoggedIn = await checkUserIsLogin();
        this.set(isLoggedIn);
      } catch (error) {
        console.error('Failed to initialize login status:', error);
        this.set(false);
      }
    }
  },
});

export const token = defineStore('token', {
  state: () => ({ value: null as string | null }),
  actions: {
    set(token: string) {
      this.value = token;
    }
  }
})

export const muid = defineStore('muid', {
  state: () => ({ value: null as string | null }),
  actions: {
    set(muid: string) {
      this.value = muid;
    }
  }
})

export const muname = defineStore('muname', {
  state: () => ({ value: null as string | null }),
  actions: {
    set(muname: string) {
      this.value = muname;
    }
  }
})

// 定义设置状态的接口
interface SetupState {
  autoPlay: boolean;
  reconnect: number;
  definition: string;
  searchMode: number;
  language: string;
  videoSavePath: string;
  imageSavePath: string;
  aria2Rpc: string;
  aria2Token: string;
  aria2Download: string;
  aria2Switch: boolean;
}

// 设置相关的 store
export const setupStore = defineStore('setup', {
  state: (): SetupState => ({
    autoPlay: true,
    reconnect: 1,
    definition: 'Source',
    searchMode: 0,
    language: 'auto',
    videoSavePath: '',
    imageSavePath: '',
    aria2Rpc: '',
    aria2Token: '',
    aria2Download: '~/Downloads/Iwara',
    aria2Switch: false,
  }),
  actions: {
    // 从数据库加载设置
    async loadSetupFromDatabase() {
      try {
        const dbData = await getSetupData();
        // 映射数据库字段名到 store 状态属性
        this.autoPlay = Boolean(dbData.auto_play) ?? this.autoPlay;
        this.reconnect = dbData.reconnect ?? this.reconnect;
        this.definition = dbData.definition ?? this.definition;
        this.searchMode = dbData.search_mode ?? this.searchMode;
        this.language = dbData.language ?? this.language;
        this.videoSavePath = dbData.video_save_path ?? this.videoSavePath;
        this.imageSavePath = dbData.image_save_path ?? this.imageSavePath;
        this.aria2Rpc = dbData.aria2_rpc ?? this.aria2Rpc;
        this.aria2Token = dbData.aria2_token ?? this.aria2Token;
        this.aria2Download = dbData.aria2_download ?? this.aria2Download;
        this.aria2Switch = Boolean(dbData.aria2_switch) ?? this.aria2Switch;
      } catch (error) {
        console.error('Failed to load setup from database:', error);
      }
    },
    // 更新整个设置对象并同步到数据库
    async updateSetup(setupData: Partial<SetupState>) {
      Object.assign(this.$state, setupData);
      await this.saveToDatabase();
    },
    // 更新单个设置项并同步到数据库
    async updateSetting<K extends keyof SetupState>(key: K, value: SetupState[K]): Promise<void> {
      this.$state[key] = value;
      await this.saveToDatabase();
    },
    // 重置为默认值并同步到数据库
    async resetToDefault() {
      this.$reset();
      await this.saveToDatabase();
    },
    // 将当前状态保存到数据库
    async saveToDatabase() {
      try {
        const dbFormatData = {
          auto_play: this.autoPlay ? 1 : 0,
          reconnect: this.reconnect,
          definition: this.definition,
          search_mode: this.searchMode,
          language: this.language,
          video_save_path: this.videoSavePath,
          image_save_path: this.imageSavePath,
          aria2_rpc: this.aria2Rpc,
          aria2_token: this.aria2Token,
          aria2_download: this.aria2Download,
          aria2_switch: this.aria2Switch ? 1 : 0
        };

        await updateSetupData(dbFormatData);
      } catch (error) {
        console.error('Failed to save setup to database:', error);
      }
    }
  },
})

/**
 * 统一初始化所有 Store
 * 在应用启动时调用一次，从数据库加载所有持久化状态
 */
export async function initializeAllStores(): Promise<void> {
  try {
    // 并行初始化所有 Store
    await Promise.all([
      isLogin().initFromDatabase(),
      setupStore().loadSetupFromDatabase()
    ]);
  } catch (error) {
    console.error('Failed to initialize stores:', error);
  }
}
