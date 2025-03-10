import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// ファイルサイズのフォーマット
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 日付のフォーマット
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// URLの生成
export function generateRepoUrl(username: string, uuid: string): string {
  return `/${username}/${uuid}`;
}

// ファイル拡張子からアイコン名を取得
export function getFileIconByExtension(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  const iconMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'react',
    'tsx': 'react',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'go': 'go',
    'java': 'java',
    'php': 'php',
    'rb': 'ruby',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'sql': 'database',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'sh': 'terminal',
    'bash': 'terminal',
    'txt': 'file-text',
    'pdf': 'file-text',
    'doc': 'file-text',
    'docx': 'file-text',
    'xls': 'file-spreadsheet',
    'xlsx': 'file-spreadsheet',
    'ppt': 'file-presentation',
    'pptx': 'file-presentation',
    'zip': 'file-archive',
    'rar': 'file-archive',
    'tar': 'file-archive',
    'gz': 'file-archive',
    'png': 'image',
    'jpg': 'image',
    'jpeg': 'image',
    'gif': 'image',
    'svg': 'image',
  };
  
  return iconMap[extension] || 'file';
}