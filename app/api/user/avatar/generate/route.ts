import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";

type AvatarStyle = "cartoon" | "realistic" | "pixel" | "minimal" | "oil";

const STYLE_PROMPTS: Record<AvatarStyle, string> = {
  cartoon: "Cartoon profile avatar, clean outlines, vivid colors, friendly face, centered portrait, no text, no watermark",
  realistic: "Realistic portrait avatar, cinematic lighting, high detail, natural skin tones, centered portrait, no text, no watermark",
  pixel: "Pixel art avatar, retro 8-bit style, clear facial silhouette, centered portrait, no text, no watermark",
  minimal: "Minimalist flat-design avatar, geometric shapes, soft gradient, centered portrait, no text, no watermark",
  oil: "Oil painting style portrait avatar, rich brush strokes, artistic texture, centered portrait, no text, no watermark",
};

function parseToken(req: Request): string | null {
  const cookieToken = req.headers
    .get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith("access_token="))
    ?.split("=")[1];
  const authHeader = req.headers.get("authorization") || "";
  const headerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  return cookieToken || headerToken || null;
}

function normalizeResponse(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const payload = data as {
    data?: Array<{ url?: string; b64_json?: string }>;
    output?: Array<{ url?: string; image_url?: string; b64_json?: string }>;
  };

  const fromData = payload.data?.[0];
  if (fromData?.url) return fromData.url;
  if (fromData?.b64_json) return `data:image/png;base64,${fromData.b64_json}`;

  const fromOutput = payload.output?.[0];
  if (fromOutput?.url) return fromOutput.url;
  if (fromOutput?.image_url) return fromOutput.image_url;
  if (fromOutput?.b64_json) return `data:image/png;base64,${fromOutput.b64_json}`;

  return null;
}

export async function POST(req: Request) {
  try {
    const token = parseToken(req);
    if (!token) return NextResponse.json({ message: "未登录" }, { status: 401 });
    await verifyAccessToken(token);

    const { style, prompt } = (await req.json()) as {
      style?: AvatarStyle;
      prompt?: string;
    };

    if (!style || !STYLE_PROMPTS[style]) {
      return NextResponse.json({ message: "不支持的头像风格" }, { status: 400 });
    }

    const apiKey = process.env.MOONSHOT_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: "MOONSHOT_API_KEY 未配置" }, { status: 500 });
    }

    const extraPrompt = typeof prompt === "string" ? prompt.trim() : "";
    const finalPrompt = extraPrompt
      ? `${STYLE_PROMPTS[style]}. Additional requirements: ${extraPrompt}`
      : STYLE_PROMPTS[style];

    const moonshotRes = await fetch("https://api.moonshot.cn/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k-vision-preview",
        prompt: finalPrompt,
        size: "1024x1024",
      }),
    });

    const moonshotJson = (await moonshotRes.json()) as unknown;

    if (!moonshotRes.ok) {
      console.error("[avatar/generate] Moonshot error:", JSON.stringify(moonshotJson, null, 2));
      return NextResponse.json(
        {
          message: "头像生成失败",
          detail: moonshotJson,
        },
        { status: 502 }
      );
    }

    const imageUrl = normalizeResponse(moonshotJson);
    if (!imageUrl) {
      return NextResponse.json({ message: "未获取到头像结果" }, { status: 502 });
    }

    return NextResponse.json({ success: true, imageUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "头像生成失败";
    return NextResponse.json({ message }, { status: 400 });
  }
}
