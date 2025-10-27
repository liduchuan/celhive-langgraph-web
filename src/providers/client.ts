import { Client } from "@langchain/langgraph-sdk";

export function createClient(apiUrl: string, apiKey: string | undefined, token?: string) {
  const headers: Record<string, string> = {};

  // 添加第三方Token认证
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return new Client({
    apiKey,
    apiUrl,
    defaultHeaders: headers,
  });
}
