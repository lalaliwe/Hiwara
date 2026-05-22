/**
 * 评论发送功能模拟测试
 * 
 * 本脚本基于 HAR 文件中的真实 API 请求/响应数据，
 * 在本地模拟视频和插画的评论发送流程，不发送任何真实网络请求。
 * 
 * 数据来源:
 *   - tmp/har/www.iwara.tv_video_hKADg12s0D8PBu_comments_Archive [26-05-22 14-25-33].har
 *   - tmp/har/www.iwara.tv_image_SW1HbPtWOmtwj8_comments_Archive [26-05-22 16-26-08].har
 * 
 * 测试覆盖:
 *   1. 请求体结构验证 - body / rulesAgreement / parent 字段
 *   2. 响应体结构验证 - 评论对象的完整字段
 *   3. 视频评论发送流程
 *   4. 插画评论发送流程
 *   5. 回复评论功能 (parentId)
 *   6. CommentInput.handleSend 逻辑模拟
 *   7. 错误处理 (401 / 500 / 网络异常)
 *   8. HAR 数据完整性
 */

// ============================================================
// 1. 加载 Mock 数据（从 HAR 文件中提取）
// ============================================================
const fs = require('fs');
const path = require('path');

// 视频评论 HAR 中的请求和响应数据
const videoCommentHar = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', 'tmp', 'har', 'www.iwara.tv_video_hKADg12s0D8PBu_comments_Archive [26-05-22 14-25-33].har'),
    'utf-8'
  )
);

// 插画评论 HAR 中的请求和响应数据
const imageCommentHar = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '..', 'tmp', 'har', 'www.iwara.tv_image_SW1HbPtWOmtwj8_comments_Archive [26-05-22 16-26-08].har'),
    'utf-8'
  )
);

// 提取视频评论的请求/响应数据
const videoEntry = videoCommentHar.log.entries[0];
const videoRequest = {
  method: videoEntry.request.method,
  url: videoEntry.request.url,
  body: JSON.parse(videoEntry.request.postData.text),
  headers: videoEntry.request.headers.reduce((acc, h) => { acc[h.name] = h.value; return acc; }, {})
};
const videoResponse = {
  status: videoEntry.response.status,
  body: JSON.parse(videoEntry.response.content.text)
};

// 提取插画评论的请求/响应数据
const imageEntry = imageCommentHar.log.entries[0];
const imageRequest = {
  method: imageEntry.request.method,
  url: imageEntry.request.url,
  body: JSON.parse(imageEntry.request.postData.text),
  headers: imageEntry.request.headers.reduce((acc, h) => { acc[h.name] = h.value; return acc; }, {})
};
const imageResponse = {
  status: imageEntry.response.status,
  body: JSON.parse(imageEntry.response.content.text)
};

// ============================================================
// 2. 模拟 postSendRequestIwara 返回结构
// ============================================================

/**
 * postSendRequestIwara 实际返回格式:
 * {
 *   ok: boolean,     // status >= 200 && status < 300
 *   status: number,  // HTTP 状态码
 *   data: any        // 解析后的 JSON 数据
 * }
 */

// 2.1 模拟 postVideoComment（基于 HAR 数据，不发送真实请求）
async function mockPostVideoComment(vid, body, parentId) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 100));

  // 验证请求体结构
  const actualBody = { body, rulesAgreement: true };
  if (parentId) {
    actualBody.parent = parentId;
  }

  // 构建模拟的成功响应（基于 HAR 的 201 响应）
  const responseData = {
    ...videoResponse.body,
    id: generateMockId(),
    body: body,
    videoId: vid,
    parent: parentId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return {
    ok: true,
    status: 201,
    data: responseData,
    _validation: {
      bodyStructureValid: validateCommentRequestBody(actualBody)
    }
  };
}

// 2.2 模拟 postImageComment（基于 HAR 数据，不发送真实请求）
async function mockPostImageComment(pid, body, parentId) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 100));

  // 验证请求体结构
  const actualBody = { body, rulesAgreement: true };
  if (parentId) {
    actualBody.parent = parentId;
  }

  // 构建模拟的成功响应（基于 HAR 的 201 响应）
  const responseData = {
    ...imageResponse.body,
    id: generateMockId(),
    body: body,
    imageId: pid,
    parent: parentId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return {
    ok: true,
    status: 201,
    data: responseData,
    _validation: {
      bodyStructureValid: validateCommentRequestBody(actualBody)
    }
  };
}

// 2.3 模拟 CommentInput.handleSend 逻辑
async function simulateCommentInputHandleSend(postCommentFn, contentId, body, parentId) {
  if (!body || !body.trim()) {
    return { success: false, error: '评论内容不能为空' };
  }

  try {
    const res = await postCommentFn(contentId, body, parentId);
    if (res.ok) {
      return { success: true, comment: res.data };
    } else {
      return { success: false, error: '评论失败', status: res.status };
    }
  } catch (error) {
    return { success: false, error: error.message || '评论失败' };
  }
}

// 2.4 模拟失败响应
async function mockPostCommentError(contentType, errorType) {
  await new Promise(resolve => setTimeout(resolve, 100));

  switch (errorType) {
    case 'unauthorized':
      return { ok: false, status: 401, data: { error: 'Unauthorized' } };
    case 'validation':
      return { ok: false, status: 422, data: { error: 'Validation failed', details: 'Body is required' } };
    case 'server':
      return { ok: false, status: 500, data: { error: 'Internal server error' } };
    case 'network':
      throw new Error('Network error: Failed to fetch');
    default:
      return { ok: false, status: 400, data: { error: 'Bad request' } };
  }
}

// ============================================================
// 3. 辅助函数
// ============================================================

function generateMockId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function validateCommentRequestBody(body) {
  return {
    hasBody: typeof body.body === 'string' && body.body.length > 0,
    hasRulesAgreement: body.rulesAgreement === true,
    bodyType: typeof body.body === 'string',
    rulesAgreementType: typeof body.rulesAgreement === 'boolean',
    parentType: body.parent !== undefined ? typeof body.parent === 'string' || body.parent === null : true
  };
}

function validateCommentResponseBody(body) {
  return {
    hasId: typeof body.id === 'string' && body.id.length > 0,
    hasApproved: typeof body.approved === 'boolean',
    hasBody: typeof body.body === 'string' && body.body.length > 0,
    hasNumReplies: typeof body.numReplies === 'number',
    hasUser: body.user && typeof body.user === 'object',
    hasUserId: body.user && typeof body.user.id === 'string',
    hasUserName: body.user && typeof body.user.name === 'string',
    hasCreatedAt: typeof body.createdAt === 'string',
    hasUpdatedAt: typeof body.updatedAt === 'string',
    hasContentId: !!(body.videoId || body.imageId)
  };
}

function validateCommentResponseUser(user) {
  return {
    hasId: typeof user.id === 'string',
    hasName: typeof user.name === 'string',
    hasUsername: typeof user.username === 'string',
    hasRole: typeof user.role === 'string',
    hasStatus: typeof user.status === 'string'
  };
}

// ============================================================
// 4. 测试框架
// ============================================================

let passedTests = 0;
let failedTests = 0;
const testResults = [];

function test(name, fn) {
  testResults.push({ name, fn });
}

function runTest(name, fn) {
  process.stdout.write(`  [测试] ${name}... `);
  try {
    fn();
    console.log('✓ 通过');
    passedTests++;
  } catch (error) {
    console.log('✗ 失败');
    console.error(`    错误: ${error.message}`);
    failedTests++;
  }
}

async function runAsyncTest(name, fn) {
  process.stdout.write(`  [测试] ${name}... `);
  try {
    await fn();
    console.log('✓ 通过');
    passedTests++;
  } catch (error) {
    console.log('✗ 失败');
    console.error(`    错误: ${error.message}`);
    failedTests++;
  }
}

// ============================================================
// 5. 测试用例
// ============================================================

// ----------------------------------------------------------
// 5.1 请求体结构验证测试
// ----------------------------------------------------------

test('评论请求体应包含 body 字段', () => {
  const result = validateCommentRequestBody({ body: '测试评论', rulesAgreement: true });
  if (!result.hasBody) throw new Error('缺少 body 字段');
  if (!result.bodyType) throw new Error('body 类型不是 string');
});

test('评论请求体应包含 rulesAgreement 且为 true', () => {
  const result = validateCommentRequestBody({ body: '测试评论', rulesAgreement: true });
  if (!result.hasRulesAgreement) throw new Error('缺少 rulesAgreement 或不为 true');
  if (!result.rulesAgreementType) throw new Error('rulesAgreement 类型不是 boolean');
});

test('评论请求体 rulesAgreement 不为 true 时验证失败', () => {
  const result = validateCommentRequestBody({ body: '测试评论', rulesAgreement: false });
  if (result.hasRulesAgreement) throw new Error('rulesAgreement 为 false 时应检测到不符合要求');
});

test('视频评论请求体结构与 HAR 一致', () => {
  const harBody = videoRequest.body;
  if (harBody.body !== '可爱，香草') throw new Error(`HAR 中 body 应为"可爱，香草"，实际为"${harBody.body}"`);
  if (harBody.rulesAgreement !== true) throw new Error('HAR 中 rulesAgreement 应为 true');
  if (harBody.parent !== undefined) throw new Error('HAR 中非回复评论不应有 parent 字段');
});

test('插画评论请求体结构与 HAR 一致', () => {
  const harBody = imageRequest.body;
  if (harBody.body !== '好好好') throw new Error(`HAR 中 body 应为"好好好"，实际为"${harBody.body}"`);
  if (harBody.rulesAgreement !== true) throw new Error('HAR 中 rulesAgreement 应为 true');
  if (harBody.parent !== undefined) throw new Error('HAR 中非回复评论不应有 parent 字段');
});

test('回复评论时请求体应包含 parent 字段', () => {
  const body = { body: '回复评论', rulesAgreement: true, parent: 'abc-123' };
  const result = validateCommentRequestBody(body);
  if (!result.parentType) throw new Error('parent 字段类型验证失败');
  if (body.parent !== 'abc-123') throw new Error('parent 值不匹配');
});

// ----------------------------------------------------------
// 5.2 响应体结构验证测试（视频评论）
// ----------------------------------------------------------

test('视频评论响应体应包含 id 字段', () => {
  if (!videoResponse.body.id) throw new Error('缺少 id 字段');
  if (typeof videoResponse.body.id !== 'string') throw new Error('id 类型不是 string');
});

test('视频评论响应体应包含 approved 布尔字段', () => {
  if (typeof videoResponse.body.approved !== 'boolean') throw new Error('approved 不是 boolean');
  if (videoResponse.body.approved !== true) throw new Error('新评论 approved 应为 true');
});

test('视频评论响应体应包含 body 字段', () => {
  if (!videoResponse.body.body) throw new Error('缺少 body 字段');
  if (videoResponse.body.body !== '可爱，香草') throw new Error('body 内容不匹配 HAR');
});

test('视频评论响应体应包含 numReplies 字段（初始为 0）', () => {
  if (typeof videoResponse.body.numReplies !== 'number') throw new Error('numReplies 不是 number');
  if (videoResponse.body.numReplies !== 0) throw new Error('新评论 numReplies 应为 0');
});

test('视频评论响应体 parent 应为 null（非回复）', () => {
  if (videoResponse.body.parent !== null) throw new Error('非回复评论 parent 应为 null');
});

test('视频评论响应体应包含 user 对象', () => {
  if (!videoResponse.body.user) throw new Error('缺少 user 对象');
  const result = validateCommentResponseUser(videoResponse.body.user);
  if (!result.hasId) throw new Error('user 缺少 id');
  if (!result.hasName) throw new Error('user 缺少 name');
  if (!result.hasUsername) throw new Error('user 缺少 username');
});

test('视频评论响应体应包含 videoId 字段', () => {
  if (!videoResponse.body.videoId) throw new Error('缺少 videoId 字段');
  if (videoResponse.body.videoId !== 'hKADg12s0D8PBu') throw new Error('videoId 不匹配');
});

test('视频评论响应体应包含时间戳字段', () => {
  if (!videoResponse.body.createdAt) throw new Error('缺少 createdAt');
  if (!videoResponse.body.updatedAt) throw new Error('缺少 updatedAt');
});

// ----------------------------------------------------------
// 5.3 响应体结构验证测试（插画评论）
// ----------------------------------------------------------

test('插画评论响应体应包含 id 字段', () => {
  if (!imageResponse.body.id) throw new Error('缺少 id 字段');
  if (typeof imageResponse.body.id !== 'string') throw new Error('id 类型不是 string');
});

test('插画评论响应体应包含 approved 布尔字段', () => {
  if (typeof imageResponse.body.approved !== 'boolean') throw new Error('approved 不是 boolean');
  if (imageResponse.body.approved !== true) throw new Error('新评论 approved 应为 true');
});

test('插画评论响应体应包含 body 字段', () => {
  if (!imageResponse.body.body) throw new Error('缺少 body 字段');
  if (imageResponse.body.body !== '好好好') throw new Error('body 内容不匹配 HAR');
});

test('插画评论响应体应包含 imageId 字段', () => {
  if (!imageResponse.body.imageId) throw new Error('缺少 imageId 字段');
  if (imageResponse.body.imageId !== 'SW1HbPtWOmtwj8') throw new Error('imageId 不匹配');
});

test('插画评论响应体应包含 user 对象', () => {
  if (!imageResponse.body.user) throw new Error('缺少 user 对象');
  const result = validateCommentResponseUser(imageResponse.body.user);
  if (!result.hasId) throw new Error('user 缺少 id');
  if (!result.hasName) throw new Error('user 缺少 name');
});

// ----------------------------------------------------------
// 5.4 视频评论发送流程测试
// ----------------------------------------------------------

test('视频评论发送 - 成功发布评论', async () => {
  const vid = 'hKADg12s0D8PBu';
  const body = '这是一条测试评论';

  // 模拟 CommentInput.handleSend 调用
  const result = await simulateCommentInputHandleSend(
    mockPostVideoComment, vid, body
  );

  if (!result.success) throw new Error(`评论发送失败: ${result.error}`);
  if (!result.comment.id) throw new Error('返回的评论缺少 id');
  if (result.comment.body !== body) throw new Error('返回的 body 不匹配');
  if (result.comment.videoId !== vid) throw new Error('返回的 videoId 不匹配');
  if (result.comment.parent !== null) throw new Error('非回复评论 parent 应为 null');
  if (result.comment.approved !== true) throw new Error('新评论 approved 应为 true');
  if (result.comment.numReplies !== 0) throw new Error('新评论 numReplies 应为 0');
});

test('视频评论发送 - 空内容应被拦截', async () => {
  const result = await simulateCommentInputHandleSend(
    mockPostVideoComment, 'hKADg12s0D8PBu', ''
  );

  if (result.success) throw new Error('空评论应发送失败');
  if (!result.error) throw new Error('应返回错误信息');
});

test('视频评论发送 - 仅空白内容应被拦截', async () => {
  const result = await simulateCommentInputHandleSend(
    mockPostVideoComment, 'hKADg12s0D8PBu', '   '
  );

  if (result.success) throw new Error('空白评论应发送失败');
});

test('视频评论发送 - 不同视频 ID 可正常发送', async () => {
  const testCases = [
    { vid: 'hKADg12s0D8PBu', body: '评论A' },
    { vid: 'abc123def456', body: '评论B' },
    { vid: 'xyz789', body: '测试长评论内容 '.repeat(10) }
  ];

  for (const tc of testCases) {
    const result = await simulateCommentInputHandleSend(
      mockPostVideoComment, tc.vid, tc.body
    );
    if (!result.success) throw new Error(`视频 ${tc.vid} 评论发送失败`);
    if (result.comment.videoId !== tc.vid) throw new Error(`视频 ${tc.vid} 返回的 videoId 不匹配`);
    if (result.comment.body !== tc.body) throw new Error(`视频 ${tc.vid} 返回的 body 不匹配`);
  }
});

// ----------------------------------------------------------
// 5.5 插画评论发送流程测试
// ----------------------------------------------------------

test('插画评论发送 - 成功发布评论', async () => {
  const pid = 'SW1HbPtWOmtwj8';
  const body = '这是一条插画评论';

  const result = await simulateCommentInputHandleSend(
    mockPostImageComment, pid, body
  );

  if (!result.success) throw new Error(`评论发送失败: ${result.error}`);
  if (!result.comment.id) throw new Error('返回的评论缺少 id');
  if (result.comment.body !== body) throw new Error('返回的 body 不匹配');
  if (result.comment.imageId !== pid) throw new Error('返回的 imageId 不匹配');
  if (result.comment.parent !== null) throw new Error('非回复评论 parent 应为 null');
  if (result.comment.approved !== true) throw new Error('新评论 approved 应为 true');
});

test('插画评论发送 - 不同插画 ID 可正常发送', async () => {
  const testCases = [
    { pid: 'SW1HbPtWOmtwj8', body: '好图！' },
    { pid: 'img456', body: '太棒了' },
    { pid: 'img789', body: '收藏了' }
  ];

  for (const tc of testCases) {
    const result = await simulateCommentInputHandleSend(
      mockPostImageComment, tc.pid, tc.body
    );
    if (!result.success) throw new Error(`插画 ${tc.pid} 评论发送失败`);
    if (result.comment.imageId !== tc.pid) throw new Error(`插画 ${tc.pid} 返回的 imageId 不匹配`);
    if (result.comment.body !== tc.body) throw new Error(`插画 ${tc.pid} 返回的 body 不匹配`);
  }
});

// ----------------------------------------------------------
// 5.6 回复评论功能测试
// ----------------------------------------------------------

test('回复评论 - 视频回复应包含 parentId', async () => {
  const vid = 'hKADg12s0D8PBu';
  const parentId = '9b028e1f-1266-4ef2-8995-9864686a3893';
  const body = '回复评论内容';

  const result = await simulateCommentInputHandleSend(
    mockPostVideoComment, vid, body, parentId
  );

  if (!result.success) throw new Error('回复评论发送失败');
  if (result.comment.parent !== parentId) throw new Error(`parent 应为 ${parentId}，实际为 ${result.comment.parent}`);
});

test('回复评论 - 插画回复应包含 parentId', async () => {
  const pid = 'SW1HbPtWOmtwj8';
  const parentId = '4626f882-b3ba-455f-84ad-dc521664c702';
  const body = '插画回复评论';

  const result = await simulateCommentInputHandleSend(
    mockPostImageComment, pid, body, parentId
  );

  if (!result.success) throw new Error('插画回复评论发送失败');
  if (result.comment.parent !== parentId) throw new Error(`parent 应为 ${parentId}，实际为 ${result.comment.parent}`);
});

test('回复评论 - 多次回复同一评论', async () => {
  const vid = 'hKADg12s0D8PBu';
  const parentId = '9b028e1f-1266-4ef2-8995-9864686a3893';
  const replies = ['回复1', '回复2', '回复3'];

  for (const replyBody of replies) {
    const result = await simulateCommentInputHandleSend(
      mockPostVideoComment, vid, replyBody, parentId
    );
    if (!result.success) throw new Error(`回复 "${replyBody}" 发送失败`);
    if (result.comment.parent !== parentId) throw new Error(`回复 "${replyBody}" 的 parent 不匹配`);
  }
});

// ----------------------------------------------------------
// 5.7 CommentInput.handleSend 逻辑模拟测试
// ----------------------------------------------------------

test('CommentInput.handleSend - 成功时不清空输入和 emit posted', async () => {
  // 模拟 CommentInput.vue 中的 handleSend 方法
  let emittedData = null;
  let inputCleared = false;
  let toastMessage = '';

  function simulateHandleSend(postCommentFn, contentId, body, parentId) {
    return (async () => {
      if (!body.trim()) return { error: '内容为空' };

      try {
        const res = await postCommentFn(contentId, body, parentId);
        if (res.ok) {
          emittedData = res.data;
          inputCleared = true; // commentContent.value = ''
          toastMessage = '评论成功';
          return { success: true };
        } else {
          toastMessage = '评论失败';
          return { success: false };
        }
      } catch (error) {
        toastMessage = '评论失败';
        return { success: false, error };
      }
    })();
  }

  const result = await simulateHandleSend(mockPostVideoComment, 'hKADg12s0D8PBu', '测试评论');

  if (!result.success) throw new Error('handleSend 返回失败');
  if (!emittedData) throw new Error('未 emit posted 事件');
  if (!inputCleared) throw new Error('未清空输入框');
  if (toastMessage !== '评论成功') throw new Error('提示消息错误');
});

test('CommentInput.handleSend - 失败时不 emit posted', async () => {
  let emittedData = null;
  let toastMessage = '';

  function simulateHandleSend(postCommentFn, contentId, body) {
    return (async () => {
      if (!body.trim()) return { error: '内容为空' };

      try {
        const res = await postCommentFn(contentId, body);
        if (res.ok) {
          emittedData = res.data;
          toastMessage = '评论成功';
          return { success: true };
        } else {
          toastMessage = '评论失败';
          return { success: false };
        }
      } catch (error) {
        toastMessage = '评论失败';
        return { success: false, error };
      }
    })();
  }

  const result = await simulateHandleSend(async () => ({ ok: false, status: 500, data: null }), 'hKADg12s0D8PBu', '测试评论');

  if (result.success) throw new Error('应返回失败');
  if (emittedData) throw new Error('失败时不应 emit posted');
  if (toastMessage !== '评论失败') throw new Error('应提示评论失败');
});

// ----------------------------------------------------------
// 5.8 错误处理测试
// ----------------------------------------------------------

test('错误处理 - 未授权 (401)', async () => {
  const result = await simulateCommentInputHandleSend(
    async () => await mockPostCommentError('video', 'unauthorized'),
    'hKADg12s0D8PBu', '测试评论'
  );
  if (result.success) throw new Error('期望失败，但成功了');
  if (result.status !== 401) throw new Error(`期望状态码 401，实际 ${result.status}`);
});

test('错误处理 - 服务器错误 (500)', async () => {
  const result = await simulateCommentInputHandleSend(
    async () => await mockPostCommentError('video', 'server'),
    'hKADg12s0D8PBu', '测试评论'
  );
  if (result.success) throw new Error('期望失败，但成功了');
  if (result.status !== 500) throw new Error(`期望状态码 500，实际 ${result.status}`);
});

test('错误处理 - 网络异常', async () => {
  try {
    await mockPostCommentError('video', 'network');
    throw new Error('期望抛出网络错误');
  } catch (error) {
    if (!error.message.includes('Network error')) {
      throw new Error(`期望网络错误，实际: ${error.message}`);
    }
  }
});

// ----------------------------------------------------------
// 5.9 HAR 数据完整性验证
// ----------------------------------------------------------

test('HAR 视频 - 请求方法为 POST', () => {
  if (videoRequest.method !== 'POST') {
    throw new Error(`期望 POST，实际 ${videoRequest.method}`);
  }
});

test('HAR 视频 - 请求 URL 路径正确', () => {
  const expectedPath = '/video/hKADg12s0D8PBu/comments';
  if (!videoRequest.url.includes(expectedPath)) {
    throw new Error(`URL 应包含 ${expectedPath}，实际 ${videoRequest.url}`);
  }
});

test('HAR 视频 - Content-Type 为 application/json', () => {
  if (videoRequest.headers['Content-Type'] !== 'application/json') {
    throw new Error(`期望 application/json，实际 ${videoRequest.headers['Content-Type']}`);
  }
});

test('HAR 视频 - 包含 Authorization 头', () => {
  if (!videoRequest.headers['Authorization']) {
    throw new Error('缺少 Authorization 头');
  }
  if (!videoRequest.headers['Authorization'].startsWith('Bearer ')) {
    throw new Error('Authorization 格式错误，应为 Bearer token');
  }
});

test('HAR 视频 - 包含 X-Site 头', () => {
  if (videoRequest.headers['X-Site'] !== 'www.iwara.tv') {
    throw new Error('缺少或错误的 X-Site 头');
  }
});

test('HAR 视频 - 响应状态为 201 Created', () => {
  if (videoResponse.status !== 201) {
    throw new Error(`期望 201，实际 ${videoResponse.status}`);
  }
});

test('HAR 插画 - 请求方法为 POST', () => {
  if (imageRequest.method !== 'POST') {
    throw new Error(`期望 POST，实际 ${imageRequest.method}`);
  }
});

test('HAR 插画 - 请求 URL 路径正确', () => {
  const expectedPath = '/image/SW1HbPtWOmtwj8/comments';
  if (!imageRequest.url.includes(expectedPath)) {
    throw new Error(`URL 应包含 ${expectedPath}，实际 ${imageRequest.url}`);
  }
});

test('HAR 插画 - 响应状态为 201 Created', () => {
  if (imageResponse.status !== 201) {
    throw new Error(`期望 201，实际 ${imageResponse.status}`);
  }
});

test('HAR 插画 - 响应包含 imageId（非 videoId）', () => {
  if (!imageResponse.body.imageId) throw new Error('缺少 imageId');
  if (imageResponse.body.videoId) throw new Error('插画评论不应包含 videoId');
});

test('HAR 视频 - 响应包含 videoId（非 imageId）', () => {
  if (!videoResponse.body.videoId) throw new Error('缺少 videoId');
  if (videoResponse.body.imageId) throw new Error('视频评论不应包含 imageId');
});

// ----------------------------------------------------------
// 5.10 API 接口一致性测试
// ----------------------------------------------------------

test('postVideoComment 与 postImageComment 返回结构一致', () => {
  const videoValid = validateCommentResponseBody(videoResponse.body);
  const imageValid = validateCommentResponseBody(imageResponse.body);

  const videoKeys = Object.keys(videoValid).sort();
  const imageKeys = Object.keys(imageValid).sort();

  if (JSON.stringify(videoKeys) !== JSON.stringify(imageKeys)) {
    throw new Error(`返回结构不一致\n视频: ${JSON.stringify(videoKeys)}\n插画: ${JSON.stringify(imageKeys)}`);
  }
});

test('postVideoComment 和 postImageComment 的请求体结构一致', () => {
  const videoBodyKeys = Object.keys(videoRequest.body).sort();
  const imageBodyKeys = Object.keys(imageRequest.body).sort();

  // 两者都应有 body 和 rulesAgreement
  if (!videoBodyKeys.includes('body') || !videoBodyKeys.includes('rulesAgreement')) {
    throw new Error('视频评论请求体缺少必要字段');
  }
  if (!imageBodyKeys.includes('body') || !imageBodyKeys.includes('rulesAgreement')) {
    throw new Error('插画评论请求体缺少必要字段');
  }
});

test('API 路径符合 RESTful 规范', () => {
  // /video/{vid}/comments 和 /image/{pid}/comments
  const videoUrl = videoRequest.url;
  const imageUrl = imageRequest.url;

  const videoMatch = videoUrl.match(/\/video\/([^/]+)\/comments$/);
  const imageMatch = imageUrl.match(/\/image\/([^/]+)\/comments$/);

  if (!videoMatch) throw new Error(`视频评论 URL 格式不符合规范: ${videoUrl}`);
  if (!imageMatch) throw new Error(`插画评论 URL 格式不符合规范: ${imageUrl}`);

  if (videoMatch[1] !== 'hKADg12s0D8PBu') throw new Error('视频 ID 提取不正确');
  if (imageMatch[1] !== 'SW1HbPtWOmtwj8') throw new Error('插画 ID 提取不正确');
});

// ============================================================
// 6. 运行所有测试
// ============================================================

async function main() {
  console.log('');
  console.log('============================================');
  console.log('  评论发送功能模拟测试');
  console.log('  基于 HAR 文件: 视频评论 + 插画评论');
  console.log('============================================');
  console.log('');

  // [1] 请求体结构验证测试
  console.log('[1/10] 请求体结构验证测试');
  const section1 = testResults.filter(t =>
    t.name.startsWith('评论请求体') || t.name.startsWith('视频评论请求体') ||
    t.name.startsWith('插画评论请求体') || t.name.startsWith('回复评论时请求体')
  );
  section1.forEach(t => runTest(t.name, t.fn));

  console.log('');
  console.log('[2/10] 视频评论响应体结构验证测试');
  const section2 = testResults.filter(t => t.name.startsWith('视频评论响应体'));
  section2.forEach(t => runTest(t.name, t.fn));

  console.log('');
  console.log('[3/10] 插画评论响应体结构验证测试');
  const section3 = testResults.filter(t => t.name.startsWith('插画评论响应体'));
  section3.forEach(t => runTest(t.name, t.fn));

  console.log('');
  console.log('[4/10] 视频评论发送流程测试');
  const section4 = testResults.filter(t => t.name.startsWith('视频评论发送') && !t.name.startsWith('视频评论发送 - 空'));

  // 空内容测试也包含
  const section4All = testResults.filter(t => t.name.startsWith('视频评论发送'));
  for (const t of section4All) {
    await runAsyncTest(t.name, t.fn);
  }

  console.log('');
  console.log('[5/10] 插画评论发送流程测试');
  const section5 = testResults.filter(t => t.name.startsWith('插画评论发送'));
  for (const t of section5) {
    await runAsyncTest(t.name, t.fn);
  }

  console.log('');
  console.log('[6/10] 回复评论功能测试');
  const section6 = testResults.filter(t => t.name.startsWith('回复评论'));
  for (const t of section6) {
    await runAsyncTest(t.name, t.fn);
  }

  console.log('');
  console.log('[7/10] CommentInput.handleSend 逻辑测试');
  const section7 = testResults.filter(t => t.name.startsWith('CommentInput.handleSend'));
  for (const t of section7) {
    await runAsyncTest(t.name, t.fn);
  }

  console.log('');
  console.log('[8/10] 错误处理测试');
  const section8 = testResults.filter(t => t.name.startsWith('错误处理'));
  for (const t of section8) {
    await runAsyncTest(t.name, t.fn);
  }

  console.log('');
  console.log('[9/10] HAR 数据完整性验证');
  const section9 = testResults.filter(t => t.name.startsWith('HAR'));
  section9.forEach(t => runTest(t.name, t.fn));

  console.log('');
  console.log('[10/10] API 接口一致性测试');
  const section10 = testResults.filter(t => t.name.startsWith('postVideoComment') || t.name.startsWith('API 路径'));
  section10.forEach(t => runTest(t.name, t.fn));

  // 输出结果
  console.log('');
  console.log('============================================');
  console.log('  测试结果汇总');
  console.log('============================================');
  console.log(`  总用例: ${passedTests + failedTests}`);
  console.log(`  通过:   ${passedTests}`);
  console.log(`  失败:   ${failedTests}`);
  console.log('============================================');
  console.log('');

  if (failedTests > 0) {
    console.log('⚠️  部分测试未通过，请检查上述错误信息。');
    process.exit(1);
  } else {
    console.log('✅ 所有测试通过！评论发送功能逻辑验证完毕。');
    console.log('');
    console.log('📋 测试覆盖说明:');
    console.log('  - 请求体结构: body / rulesAgreement / parent 字段验证');
    console.log('  - 响应体结构: 视频+插画完整评论对象字段验证');
    console.log('  - 视频评论发送: 多视频 ID、空内容拦截');
    console.log('  - 插画评论发送: 多插画 ID');
    console.log('  - 回复评论: parentId 传递验证');
    console.log('  - CommentInput.handleSend: emit posted / toast / 清空输入');
    console.log('  - 错误处理: 401 / 500 / 网络异常');
    console.log('  - HAR 数据完整性: 请求方法、头信息、状态码');
    console.log('  - API 一致性: 视频与插画接口结构对比');
    console.log('');
    console.log('⚠️  注意: 所有测试均在本地模拟进行，未发送任何真实网络请求。');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('测试运行异常:', error);
  process.exit(1);
});
