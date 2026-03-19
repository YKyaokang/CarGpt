import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL,
});

export interface QuizAnswers {
  // 12项性格测试
  adventure: number;        // 冒险倾向 1-5
  spending: number;         // 消费观念 1-5
  family: number;           // 家庭结构 1-5
  techLove: number;         // 科技热爱度 1-5
  statusCare: number;       // 面子/地位感 1-5
  environmentCare: number;  // 环保意识 1-5
  drivingFun: number;       // 驾驶乐趣 1-5
  safety: number;           // 安全优先 1-5
  practicality: number;     // 实用主义 1-5
  style: number;            // 外观颜值 1-5
  independence: number;     // 个性独立 1-5
  brandLoyalty: number;     // 品牌忠诚度 1-5
  // 8项生活习惯
  commuteDistance: number;  // 日常通勤距离 km
  annualMileage: number;    // 年均里程 km
  passengerFreq: number;    // 载人需求频率 1-5
  parkingCondition: number; // 停车条件 1-3 (1路边/2小区/3私家)
  budget: number;           // 预算范围 万元
  fuelPreference: number;   // 燃料偏好 1-3 (1燃油/2混动/3纯电)
  cargoNeed: number;        // 货物运载需求 1-5
  weatherCondition: number; // 常驾天气/路况 1-3 (1城市/2山路/3高速)
}

const buildPrompt = (answers: QuizAnswers): string => {
  return `
你是一位资深汽车顾问，请根据用户的性格测试和生活习惯数据，为其推荐最适合的TOP3车型方案。

## 用户画像数据

### 性格测试结果（1=非常低，5=非常高）
- 冒险倾向：${answers.adventure}/5
- 消费观念（越高越愿花钱）：${answers.spending}/5
- 家庭结构（越高家庭成员越多）：${answers.family}/5
- 科技热爱度：${answers.techLove}/5
- 面子/地位感：${answers.statusCare}/5
- 环保意识：${answers.environmentCare}/5
- 驾驶乐趣追求：${answers.drivingFun}/5
- 安全优先：${answers.safety}/5
- 实用主义：${answers.practicality}/5
- 外观颜值重视度：${answers.style}/5
- 个性独立：${answers.independence}/5
- 品牌忠诚度：${answers.brandLoyalty}/5

### 生活习惯数据
- 日常通勤距离：${answers.commuteDistance} km
- 年均里程：${answers.annualMileage} km
- 载人需求频率：${answers.passengerFreq}/5
- 停车条件：${['路边停车', '小区停车场', '私家车库'][answers.parkingCondition - 1]}
- 预算范围：${answers.budget} 万元
- 燃料偏好：${['燃油车', '混动/插混', '纯电动'][answers.fuelPreference - 1]}
- 货物运载需求：${answers.cargoNeed}/5
- 常驾路况：${['城市道路', '山路/复杂路况', '高速/长途'][answers.weatherCondition - 1]}

## 输出要求

请严格按照以下JSON格式输出，不要包含任何其他文字：

{
  "summary": "一句话概括用户的用车需求特征（30字以内）",
  "top3": [
    {
      "rank": 1,
      "name": "品牌+具体车型名称",
      "price": "参考价格范围（万元）",
      "type": "车型类别（如：紧凑型SUV、轿车等）",
      "fuel": "动力类型（纯电/插混/燃油）",
      "totalScore": 92,
      "reason": "推荐理由（60字以内，突出与用户需求的契合点）",
      "highlight": "核心亮点标签（8字以内）",
      "dimensions": {
        "性能驾控": 88,
        "科技配置": 92,
        "空间实用": 75,
        "经济省油": 80,
        "安全舒适": 90,
        "外观颜值": 85
      }
    },
    {
      "rank": 2,
      "name": "品牌+具体车型名称",
      "price": "参考价格范围（万元）",
      "type": "车型类别",
      "fuel": "动力类型",
      "totalScore": 88,
      "reason": "推荐理由（60字以内）",
      "highlight": "核心亮点标签（8字以内）",
      "dimensions": {
        "性能驾控": 80,
        "科技配置": 88,
        "空间实用": 90,
        "经济省油": 85,
        "安全舒适": 86,
        "外观颜值": 80
      }
    },
    {
      "rank": 3,
      "name": "品牌+具体车型名称",
      "price": "参考价格范围（万元）",
      "type": "车型类别",
      "fuel": "动力类型",
      "totalScore": 84,
      "reason": "推荐理由（60字以内）",
      "highlight": "核心亮点标签（8字以内）",
      "dimensions": {
        "性能驾控": 75,
        "科技配置": 80,
        "空间实用": 88,
        "经济省油": 90,
        "安全舒适": 82,
        "外观颜值": 78
      }
    }
  ]
}

注意：
1. totalScore 是该车型与用户需求的综合匹配度，满分100分
2. dimensions 中的6个维度分值也是匹配度分值（满分100），不是车型绝对评分，而是该维度对该用户的契合程度
3. 推荐的车型必须是2024-2026年在售的真实车型
4. 价格必须符合用户预算范围
  `;
};

export async function POST(req: Request) {
  try {
    const { answers }: { answers: QuizAnswers } = await req.json();

    const prompt = buildPrompt(answers);

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: '你是专业的汽车推荐顾问，只输出JSON格式数据，不输出任何其他文字、解释或markdown标记。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    // 提取JSON（防止模型输出多余内容）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const result = JSON.parse(jsonMatch[0]);
    return Response.json({ success: true, data: result });
  } catch (err) {
    console.error('car-match error:', err);
    return Response.json(
      { success: false, error: 'Failed to generate recommendation' },
      { status: 500 }
    );
  }
}
