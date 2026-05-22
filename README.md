# Hiwara

![GitHub](https://img.shields.io/github/license/shanmaomaoymmm/hiwara)
![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/shanmaomaoymmm/hiwara?include_prereleases)
![GitHub issues](https://img.shields.io/github/issues/shanmaomaoymmm/hiwara)
![GitHub repo size](https://img.shields.io/github/repo-size/shanmaomaoymmm/hiwara)
![GitHub Repo stars](https://img.shields.io/github/stars/shanmaomaoymmm/hiwara?style=social)

🕹️ 基于 Tauri v2 的跨平台Iwara客户端 | Iwara for Tauri v2

此应用兼容最新版Iwara网站，桌面端支持Windows、MacOS、Linux，移动端支持Android和iOS，使用Tauri、Vue和Typescript编写。后期计划支持鸿蒙系统。  
This app is compatible with the latest Iwara website. It supports Windows, macOS, and Linux on desktop, and Android and iOS on mobile. Built with Tauri, Vue, and TypeScript. Plans to support HarmonyOS in the future.

## 📱 支持平台 | Supported Platforms

* Windows
* MacOS
* Linux
* Android
* iOS

## 🛠️ 环境搭建 | Development environment setup

### Rust 环境搭建 | Rust Environment Setup

访问以下链接查看如何搭建Rust环境。  
You can refer to the following links to set up the Rust environment.

<https://rust-lang.org/>

### Nodejs 环境搭建 | Nodejs Environment Setup

访问以下链接查看如何搭建Nodejs环境。  
You can refer to the following links to set up the Nodejs environment.

<https://nodejs.org>


### Tauri 环境搭建 | Tauri Environment Setup

访问以下链接查看如何搭建Tauri环境。  
Visit the following links to set up the Tauri environment.

<https://tauri.app/zh-cn/start/prerequisites/>

### Android 环境搭建 | Android Environment Setup

安装Android Studio并安装以下SDK工具  
Install Android Studio and install the following SDK tools

* Android SDK Platform
* Android SDK Platform-Tools
* NDK (Side by side)
* Android SDK Build-Tools
* Android SDK Command-line Tools

设置 `JAVA_HOME` 环境变量  
Set the `JAVA_HOME` environment variable

```bash
# Linux
export JAVA_HOME=/opt/android-studio/jbr

# MacOS
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

# Windows
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Android\Android Studio\jbr", "User")
```

配置 `ANDROID_HOME` 和 `NDK_HOME` 环境变量  
Set `ANDROID_HOME` and `NDK_HOME` environment variables

```bash
#Linux
export ANDROID_HOME="$HOME/Android/Sdk"
export NDK_HOME="$ANDROID_HOME/ndk/$(ls -1 $ANDROID_HOME/ndk)"

#MacOS
export ANDROID_HOME="$HOME/Library/Android/sdk"
export NDK_HOME="$ANDROID_HOME/ndk/$(ls -1 $ANDROID_HOME/ndk)"

#Windows
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LocalAppData\Android\Sdk", "User")
$VERSION = Get-ChildItem -Name "$env:LocalAppData\Android\Sdk\ndk"
[System.Environment]::SetEnvironmentVariable("NDK_HOME", "$env:LocalAppData\Android\Sdk\ndk\$VERSION", "User")
```

使用 `rustup` 添加 Android 编译目标  
Add the Android targets with `rustup`

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

### iOS 环境搭建 | iOS environment setup

安装 Xcode 和 Homebrew  
Install Xcode and Homebrew

<https://developer.apple.com/xcode/>  
<https://brew.sh/>

使用 Homebrew 安装 Cocoapods  
Install Cocoapods using Homebrew

```bash
brew install cocoapods
```

在终端中使用 `rustup` 将 iOS 添加为编译目标  
Add the iOS targets with `rustup` in Terminal

```bash
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim
```

## 📲 运行 | Running

在项目的根目录下执行以下命令安装依赖  
Run the following command to install dependencies

```bash
npm install
```

运行程序  
Run the program

```bash
npx tauri dev
```

连接手机后，使用以下命令运行到移动端  
After connecting the phone, run the following command to run to the mobile phone

```bash
# Android
npx tauri android run
```

## 📦 打包App | Packaging App

略  
TBD

## 🗓️ 开发进度 | Development progress

* ✅ 登录 | Login
* ✅ 订阅列表 | Subscriptions
* ✅ 视频列表 | Video list
* ✅ 图片列表 | Image list
* ✅ 视频播放 | Video playback
* ✅ 图片查看 | Image viewer
* ✅ 个人主页 | User profile
* ✅ 空间查看 | Space view
* ✅ 搜索 | Search
* ✅ 关注、订阅、收藏、评论 | Follow, subscribe, favorite, comment
* ⬜ 分析及外链下载 | Analysis and external link downloads
* ⬜ 播放列表 | Playlist
* ✅ 历史记录 | History
* ✅ 关注列表 | Following list
* ✅ 粉丝列表 | Followers list
* ✅ 设置 | Settings
* ⬜ 桌面端适配 | Desktop adaptation
* ⬜ 平板电脑适配 | Tablet adaptation
* ⬜ 暗黑模式 | Dark mode
* ⬜ 离线缓存及下载 | Offline caching and downloading
* ✅ 论坛浏览 | Forum browsing
* ⬜ 论坛发布 | Forum posting
* ⬜ 多语言支持 | Multi-language support
* ⬜ Aria2支持 | Aria2 support
* ⬜ DLAN支持 | DLNA support
* ⬜ DoH 支持 | DoH support
* ⬜ 鸿蒙系统支持 | HarmonyOS support
* 🛑 视频上传 | Video upload
* 🛑 插画上传 | Illustration upload

\* 标⬜表示当前功能计划但未完成，标✅表示当前功能已实现，标🛑表示该功能暂不考虑。  
\* ⬜ indicates planned but incomplete features, ✅ indicates completed features, 🛑 indicates features not currently considered.

## 🌏 语言适配 | Multilingual support

* 简体中文 | 简体中文 | Chinese Simplified 🚩
* 繁体中文 | 繁體中文 | Chinese Traditional
* 英语 | English | English
* 日语 | 日本語 | Japanese
* 韩语 | 한국어 | Korean
* 法语 | Français | French
* 西班牙语 | Español | Spanish
* 葡萄牙语 | Português | Portuguese 
* 德语 | Deutsch | German
* 意大利语 | Italiano | Italian
* 俄语 | Русский | Russian
* 乌克兰语 | Українська | Ukrainian
* 泰语 | ภาษาไทย | Thai
* 越南语 | Tiếng Việt | Vietnamese 
* 高棉语 | ភាសាខ្មែរ | Khmer
* 印地语 | भाषा | Indian
* 阿拉伯语 | العربية | Arabic
* 希伯来语 | עברית | Hebrew
* 藏文 | བོད་ཡིག | Tibetan
* 维吾尔语 | ئۇيغۇر تىلى | Uyghur
* 哈萨克语 | қазақ тілі | Kazakh

\* 标🚩表示当前语言已适配  
\* 🚩 indicates languages that have been adapted

## 📕 旧版本 | Old version

以下为旧版 Hiwara 项目链接  
Links to old versions of the Hiwara project
 
v1: <https://github.com/shanmaomaoymmm/hiwara/tree/uniapp>  
v2: <https://github.com/shanmaomaoymmm/hiwara_v2>

⚠ 注意:旧版因性能和安全问题已停止维护。  
⚠ Note: The old version is no longer maintained due to performance and security issues.

## 📘 参考文档 | Reference document

<https://tauri.app/>  
<https://vuetifyjs.com/>  
<https://fontawesome.com/>
