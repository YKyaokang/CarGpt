// langchain loader 是RAG的基础功能 txt,pdf,excel,excel
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
//PuppeteerWebBaseLoader 是什么？
// 它是 LangChain Loader 家族中的一员，专门用于爬取网页内容的加载器。
const { createOpenAI } = require("@ai-sdk/openai");
// supabase 去做 向量化的知识库数据
console.log("开始向量化知识库数据");
import {
  embed // 向量嵌入
} from "ai";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_KEY ?? "",
)

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL
})

import {
  RecursiveCharacterTextSplitter
} from "langchain/text_splitter";


const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,  // 切割的长度 512 个字符 包含一个比较独立的语义
  chunkOverlap: 100, // 切割的 overlap 100 个字符 一句话切断容错 
})


const scrapePage = async (url: string): Promise<string> => {
    const loader = new PuppeteerWebBaseLoader(url, {
      launchOptions: {
        executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
      },
      gotoOptions: {
        waitUntil: 'networkidle0',
      },
      evaluate: async(page, browser) => {
        const result = await page.evaluate(() => document.body.innerHTML);
        await browser.close();
        return result;
      }
    });
    // gm 正则修饰符
    return (await loader.scrape()).replace(/<[^>]*>?/gm, '');
  }

const loadData = async (webpages: string[]) => {
    for (const url of webpages) {
        const content = await scrapePage(url);
        // 分块处理
        const chunks = await splitter.splitText(content)
        // console.log(chunks,'-----');
        // embedding 向量化 （对每一个块chunk进行先量化）
        for(let chunk of chunks){
          const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: chunk
        })
        console.log(embedding,'-----AAAAAAAAAAAAAAAAAAAAAAAAA');
        const {error} = await supabase.from('carchunks').insert({
          content: chunk,
          vector: embedding,
          url: url
        });
       }
       
    }

}
// 知识库的来源，可配置
loadData([
    "https://www.dongchedi.com/",
    // "https://en.wikipedia.org/wiki/Samsung_Galaxy_S24",
    // "https://en.wikipedia.org/wiki/IPhone_16",
    // "https://en.wikipedia.org/wiki/IPhone_16_Pro",
    // "https://en.wikipedia.org/wiki/IPhone_15",
    // "https://en.wikipedia.org/wiki/IPhone_15_Pro",
  ]);