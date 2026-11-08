import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Config {
  supabaseUrl: string;
  supabaseAnonKey: string;
  email: string;
  password: string;
  familyId?: string;
  childId: string;
  /** HTTP 入口的固定 bearer token；stdio 模式不需要 */
  httpToken?: string;
  httpPort: number;
  httpHost: string;
}

export function loadConfig(): Config {
  // .env 只是本地兜底；MCP 客户端注入的环境变量优先（loadEnvFile 不覆盖已有值）
  try {
    process.loadEnvFile(resolve(dirname(fileURLToPath(import.meta.url)), '..', '.env'));
  } catch {
    // 没有 .env 时完全依赖进程环境变量
  }

  const required = (name: string): string => {
    const value = process.env[name]?.trim();
    if (!value) {
      throw new Error(`缺少环境变量 ${name}（请在 packages/mcp/.env 或 MCP 客户端 env 配置中填写）`);
    }
    return value;
  };

  const rawPort = parseInt(process.env.MCP_HTTP_PORT?.trim() || '8787', 10);
  const httpPort = Number.isInteger(rawPort) && rawPort > 0 && rawPort < 65536 ? rawPort : 8787;

  return {
    supabaseUrl: required('SUPABASE_URL'),
    supabaseAnonKey: required('SUPABASE_ANON_KEY'),
    email: required('SUPABASE_EMAIL'),
    password: required('SUPABASE_PASSWORD'),
    familyId: process.env.FAMILY_ID?.trim() || undefined,
    childId: process.env.CHILD_ID?.trim() || 'default-child',
    httpToken: process.env.MCP_HTTP_TOKEN?.trim() || undefined,
    httpPort,
    httpHost: process.env.MCP_HTTP_HOST?.trim() || '127.0.0.1',
  };
}