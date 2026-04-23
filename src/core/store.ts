import { defineStore } from 'pinia';
import { getSetupData, updateSetupData } from './database';

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

// 设置相关的 store
export const setupStore = defineStore('setup', {
  state: () => ({
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
        this.autoPlay = dbData.auto_play ?? this.autoPlay;
        this.reconnect = dbData.reconnect ?? this.reconnect;
        this.definition = dbData.definition ?? this.definition;
        this.searchMode = dbData.search_mode ?? this.searchMode;
        this.language = dbData.language ?? this.language;
        this.videoSavePath = dbData.video_save_path ?? this.videoSavePath;
        this.imageSavePath = dbData.image_save_path ?? this.imageSavePath;
        this.aria2Rpc = dbData.aria2_rpc ?? this.aria2Rpc;
        this.aria2Token = dbData.aria2_token ?? this.aria2Token;
        this.aria2Download = dbData.aria2_download ?? this.aria2Download;
        this.aria2Switch = dbData.aria2_switch ?? this.aria2Switch;
      } catch (error) {
        console.error('Failed to load setup from database:', error);
      }
    },
    // 更新整个设置对象并同步到数据库
    async updateSetup(setupData: Partial<typeof this.$state>) {
      Object.assign(this.$state, setupData);
      await this.saveToDatabase();
    },
    // 更新单个设置项并同步到数据库
    async updateSetting<K extends keyof typeof this.$state>(key: K, value: typeof this.$state[K]) {
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
          auto_play: this.autoPlay,
          reconnect: this.reconnect,
          definition: this.definition,
          search_mode: this.searchMode,
          language: this.language,
          video_save_path: this.videoSavePath,
          image_save_path: this.imageSavePath,
          aria2_rpc: this.aria2Rpc,
          aria2_token: this.aria2Token,
          aria2_download: this.aria2Download,
          aria2_switch: this.aria2Switch
        };
        
        await updateSetupData(dbFormatData);
      } catch (error) {
        console.error('Failed to save setup to database:', error);
      }
    }
  },
})