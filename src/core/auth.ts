import router from '../router';
import { logout as dbLogout } from './database';
import { isLogin, token } from './store';
import { resetNavigationHistory } from '../router';

/**
 * 退出登录：清除数据库token、Store登录状态、内存中的token、导航历史，并跳转到登录页
 */
export async function logout(): Promise<void> {
  await dbLogout();
  const loginStore = isLogin();
  loginStore.value = false;
  loginStore.loginVersion++;
  token().value = null;
  resetNavigationHistory();
  router.replace('/login');
}
