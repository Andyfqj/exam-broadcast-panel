import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'name.txt');
    const fileContent = await fs.readFile(filePath, 'utf8');

    const lines = fileContent.split('\n').filter(line => line.trim() !== '');

    // 跳过第一行 'a'
    const audioConfigs = lines.slice(1).map(line => {
      const parts = line.split('；');
      if (parts.length >= 3) {
        // 格式: 默认音库名称；实际音频文件名称；用户界面显示的自定义名称
        const defaultName = parts[0].trim();
        const actualFileName = parts[1].trim();
        const displayName = parts[2].trim();
        return { defaultName, actualFileName, displayName };
      } else if (parts.length === 1 && parts[0].trim() === 'a') {
        // 忽略第一行 'a'
        return null;
      } else {
        console.warn(`Skipping malformed line in name.txt: ${line}`);
        return null;
      }
    }).filter(config => config !== null);

    return new Response(JSON.stringify(audioConfigs), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Failed to read or parse name.txt:', error);
    return new Response(JSON.stringify({ error: 'Failed to load audio configurations' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}