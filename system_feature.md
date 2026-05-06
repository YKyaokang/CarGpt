# 系统功能实现

## 5.1 首页

首页采用全屏滚动的单页布局，顶部导航栏固定展示平台 Logo、功能入口（智能对话、智能选车、车友社区）以及登录/注册按钮，已登录用户则显示欢迎信息与头像入口。页面主体由 Hero 区、功能特性卡片区、平台数据统计区、使用流程区和底部 CTA 区依次构成。

Hero 区内嵌了一个对话预览卡片，模拟真实的 AI 问答场景，直观传达平台核心能力。统计区通过自定义 `useCountUp` Hook 实现数字滚动动画，在元素进入视口时触发计数，配合 `useScrollReveal` 实现各区块的渐入效果，提升视觉层次感。

平台整体采用 CSS 变量驱动的渐变主题系统（`--theme-gradient-from` / `--theme-gradient-to`），支持深色模式切换，所有页面共享同一套主题配置。

（效果如图 5-1 所示）

---

## 5.2 用户登录注册

登录与注册共用同一页面，通过 Tab 切换状态，避免页面跳转带来的割裂感。注册时需填写邮箱、密码（至少 6 位）和昵称，登录仅需邮箱与密码，表单提交前进行前端格式校验，错误信息以字段级红色提示展示。

认证采用双 Token 机制：登录成功后服务端签发短效 `access_token` 与长效 `refresh_token`，均以 HttpOnly Cookie 写入客户端，防止 XSS 窃取。前端通过 Zustand 维护全局认证状态，页面刷新时自动调用 `/api/auth/me` 恢复登录态；`access_token` 过期后由 `/api/auth/refresh` 静默续签，对用户无感知。

登录接口核心代码如下：

```typescript
// app/api/auth/login/route.ts
export async function POST(req: Request) {
  const { email, password } = await req.json();
  const { user, accessToken, refreshToken, refreshTokenExpiresAt } =
    await loginUser({ email, password });

  const res = NextResponse.json({ user, success: true });
  res.cookies.set('access_token', accessToken, getAccessTokenCookieOptions());
  res.cookies.set(
    'refresh_token',
    refreshToken,
    getRefreshTokenCookieOptions(
      Math.floor((refreshTokenExpiresAt.getTime() - Date.now()) / 1000)
    )
  );
  return res;
}
```

（效果如图 5-2 所示）

---

## 5.3 智能对话

智能对话模块基于 RAG（检索增强生成）架构实现，将汽车领域知识库与大语言模型结合，使回答更具时效性与专业性。

用户发送消息后，后端首先调用 `text-embedding-ada-002` 模型将问题向量化，再通过 Supabase 的 `pgvector` 扩展执行相似度检索（余弦相似度阈值 0.3），取最相关的 3 条知识片段作为上下文，最终拼入 System Prompt 后调用 `gpt-4o-mini` 流式生成回答，通过 `streamText` 以 SSE 方式实时推送至前端。

前端使用 `@ai-sdk/react` 的 `useChat` Hook 管理消息状态与流式渲染，页面初始展示若干引导提示词（如"20万预算推荐哪些新能源SUV？"），降低用户使用门槛。

对话接口核心代码如下：

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json();
  const latestMessage = messages.at(-1).content;

  // 向量化用户问题
  const { embedding } = await generateEmbedding(latestMessage);
  // 检索相关知识片段
  const context = await fetchRelevantContext(embedding);
  // 构建带上下文的 System Prompt
  const prompt = createPrompt(context, latestMessage);

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: [prompt, ...messages],
  });
  return result.toDataStreamResponse();
}
```

（效果如图 5-3 所示）

---

## 5.4 智能选车

智能选车通过一套 20 维度的问卷收集用户画像，再由 AI 生成个性化的 TOP3 推荐方案。问卷分为两部分：12 项性格测试（冒险倾向、科技热爱度、安全优先等，均为 1-5 分制滑块）和 8 项生活习惯（通勤距离、年均里程、预算、燃料偏好等）。

提交后，后端将所有答案组装成结构化 Prompt，调用 `gpt-4o-mini` 生成严格 JSON 格式的推荐结果，每条推荐包含车型名称、价格区间、综合匹配分（0-100）以及性能驾控、科技配置、空间实用、经济省油、安全舒适、外观颜值六个维度的匹配度分值。对于已登录用户，结果会静默写入 `CarMatchRecord` 表，支持历史记录查询。

AI 推荐接口核心代码如下：

```typescript
// app/api/car-match/route.ts
export async function POST(req: Request) {
  const { answers }: { answers: QuizAnswers } = await req.json();
  const prompt = buildPrompt(answers);

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    messages: [
      { role: 'system', content: '你是专业的汽车推荐顾问，只输出JSON格式数据。' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    maxTokens: 2000,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const result = JSON.parse(jsonMatch![0]);

  // 登录态下静默保存分析记录
  try {
    const token = parseToken(req);
    if (token) {
      const payload = await verifyAccessToken(token);
      await prisma.carMatchRecord.create({
        data: { userId: payload.sub, summary: result.summary ?? '', answers, result },
      });
    }
  } catch { /* 未登录不影响正常返回 */ }

  return Response.json({ success: true, data: result });
}
```

（效果如图 5-4 所示）

---

## 5.5 车友发帖

车友社区提供帖子发布、浏览、点赞、收藏与评论功能，支持 Markdown 格式内容与多图上传。

社区页面分为"广场"和"我收藏的"两个 Tab。广场 Tab 展示全部已发布帖子，支持按最新、最热（点赞数）、最多评论排序，以及按标签、关键词、发布时间范围筛选；收藏 Tab 仅对登录用户开放，展示其收藏的帖子列表。列表采用分页加载，点击"加载更多"追加下一页数据。

PostCard 组件对点赞与收藏操作实现了乐观更新：点击后立即更新本地状态，请求失败时自动回滚，保证交互流畅。帖子内容预览会自动剥离 Markdown 语法，图片占位显示为"[图片]"，最多展示 3 行。

点赞与收藏的乐观更新核心代码如下：

```typescript
// components/community/PostCard.tsx
const handleLike = async () => {
  const prevLiked = liked;
  const prevCount = likeCount;
  // 乐观更新：立即反映到 UI
  setLiked(!liked);
  setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  try {
    await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
  } catch {
    // 请求失败时回滚
    setLiked(prevLiked);
    setLikeCount(prevCount);
  }
};
```

帖子列表接口支持多条件组合查询，核心过滤逻辑如下：

```typescript
// app/api/posts/route.ts（GET 请求）
const where = { status: 'published' };
if (tag)     where.tags    = { some: { tag } };
if (keyword) where.OR      = [{ title: { contains: keyword } }, { content: { contains: keyword } }];
if (startDate || endDate) where.createdAt = { gte: new Date(startDate), lte: endDate };

const orderBy =
  sort === 'popular'   ? { likeCount: 'desc' } :
  sort === 'commented' ? { commentCount: 'desc' } :
                         { createdAt: 'desc' };
```

（效果如图 5-5 所示）
