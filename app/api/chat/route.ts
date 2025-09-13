import {
    embed,
    streamText
  } from 'ai';
  import {
    createOpenAI
  } from '@ai-sdk/openai';
  import {
    createClient
  } from '@supabase/supabase-js';
  
  const supabase = createClient(
    process.env.SUPABASE_URL??"",
    process.env.SUPABASE_KEY??""
  );
  
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL,
  })
  
  async function generateEmbedding(message: string) {
    return embed({
      model: openai.embedding('text-embedding-3-small'),
      value: message
    })
  }
  
  async function fetchRelevantContext(embedding: number[]) {
    const {
      data, 
      error
    } = await supabase.rpc("get_relevant_carchunks", {
      query_vector: embedding,
      match_threshold: 0.3,
      match_count: 3
    })
  
    if (error) throw error;
    console.log(data, '////////////////')
    return JSON.stringify(
      data.map((item:any) => `
        Source: ${item.url},
        Date Updated: ${item.date_updated}
        Content: ${item.content}  
      `)
    ) 
  }
  
  const createPrompt = (context:string,userQuestion:string) => {
    return {
      role: "system",
      content: `
你是CarGPT，一个专业的汽车智能助手。你的专长是回答所有与汽车相关的问题，包括但不限于：

**汽车相关领域：**
- 汽车品牌、型号、规格参数
- 汽车购买建议、价格信息、市场分析
- 汽车保养维修、故障诊断
- 汽车技术、新能源汽车、自动驾驶
- 汽车历史、汽车文化、赛车运动
- 汽车法规、驾驶技巧、交通安全
- 汽车配件、改装、美容
- 汽车保险、金融、二手车

**回答规则：**
1. 优先使用提供的上下文信息回答问题
2. 如果上下文信息不足，基于你的知识补充回答，并注明可能不是最新信息
3. 对于汽车相关的模糊问题（如"2024汽车"、"BMW是什么"），要积极理解用户意图并提供有用信息
4. 对于明显与汽车无关的问题（如做饭、数学计算、编程等），礼貌地引导用户询问汽车相关问题
5. 回答必须使用中文
6. 使用markdown格式，包含相关链接和信息更新日期

**上下文信息：**
----------------
START CONTEXT
${context}
END CONTEXT
----------------

**用户问题：** ${userQuestion}

请基于以上信息和规则，为用户提供专业、准确、有用的汽车相关回答。如果问题与汽车相关但表述不够清晰，请主动询问更多细节以提供更好的帮助。
      `
    }
  }
  
  export async function POST(req: Request) {
    try {
      const { messages } = await req.json();
      const latestMessage = messages.at(-1).content;
      // 创建embedding
      const { embedding } = await generateEmbedding(latestMessage);
      // 相似度计算
      const context = await fetchRelevantContext(embedding);
      console.log(context, '////////////****////')
      // 生成prompt
      const prompt = createPrompt(context,latestMessage);
  
      const result = streamText({
        model: openai("gpt-4o-mini"),
        messages: [prompt,...messages]
      });
      return result.toDataStreamResponse();
    } catch(err) {
      throw err;
    }
  }
  
  // 解析请求 -> 拿到用户的提问 -> generateEmbedding -> fetchRelevantContext -> createPrompt -> 利用gpt4-o拿到调用的结果