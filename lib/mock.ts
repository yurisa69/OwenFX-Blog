import { Software, Category } from './types';
import { sortTagsByLength } from './tag-utils';

export const mockSoftware: Software[] = [
  { id: '1', title: 'NanaZip', description: '一款开源文件归档工具，经典 7-Zip 的现代化分支。', category: '工具', tags: ['压缩', '开源', '免费'], downloadUrl: 'https://github.com/M2Team/NanaZip', updatedAt: '2026-06-20', featured: true, version: '5.0', size: '8.2 MB', platform: 'Windows' },
  { id: '2', title: 'Everything', description: '瞬间按名称定位文件和文件夹。', category: '工具', tags: ['搜索', '文件管理', '高效'], downloadUrl: 'https://www.voidtools.com/', updatedAt: '2026-06-18', featured: true, version: '1.4.1', size: '1.5 MB', platform: 'Windows' },
  { id: '3', title: 'PowerToys', description: '微软为高级用户打造的一组系统增强工具集。', category: '系统增强', tags: ['微软', '开源', '生产力'], downloadUrl: 'https://github.com/microsoft/PowerToys', updatedAt: '2026-06-15', featured: true, version: '0.89.0', size: '120 MB', platform: 'Windows' },
  { id: '4', title: 'OBS Studio', description: '免费开源的视频录制与直播软件。', category: '多媒体', tags: ['录屏', '直播', '开源'], downloadUrl: 'https://obsproject.com/', updatedAt: '2026-06-12', featured: true, version: '30.2.3', size: '90 MB', platform: 'Windows/Mac/Linux' },
  { id: '5', title: 'VS Code', description: '轻量但功能强大的源代码编辑器。', category: '开发工具', tags: ['编辑器', '微软', '开源'], downloadUrl: 'https://code.visualstudio.com/', updatedAt: '2026-06-10', featured: true, version: '1.96.0', size: '85 MB', platform: 'Windows/Mac/Linux' },
  { id: '6', title: 'Ditto Clipboard', description: 'Windows 剪贴板的增强扩展工具。', category: '工具', tags: ['剪贴板', '效率', '免费'], downloadUrl: 'https://ditto-cp.sourceforge.io/', updatedAt: '2026-06-08', featured: true, version: '3.24', size: '3.5 MB', platform: 'Windows' },
];

export const mockCategories: Category[] = [
  { id: 'cat-1', name: '工具', slug: 'tools', count: 3 },
  { id: 'cat-2', name: '多媒体', slug: 'media', count: 1 },
  { id: 'cat-3', name: '开发工具', slug: 'dev', count: 1 },
  { id: 'cat-4', name: '系统增强', slug: 'system', count: 1 },
];

export const categoryOrder = ['工具', '多媒体', '开发工具', '系统增强'];
export const allTags = sortTagsByLength(Array.from(new Set(mockSoftware.flatMap(s => s.tags))));
export const categoryColors: Record<string, string> = {
  '工具': '#FF4444',
  '多媒体': '#FF8C00',
  '开发工具': '#FFD700',
  '系统增强': '#3FB950',
};
