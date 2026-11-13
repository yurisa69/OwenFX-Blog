'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatChineseDateTime } from '@/lib/date';

type SyncState = 'pending' | 'github_written' | 'failed' | 'conflict' | 'completed';

type SyncJob = {
  id: string;
  operation: 'create' | 'update' | 'restore' | 'import';
  article_id: string | null;
  target_path: string;
  state: SyncState;
  last_error: string | null;
  attempt_count: number;
  created_at: string;
  updated_at: string;
  lease_expires_at: string | null;
  article_title: string | null;
  retryable: boolean;
};

type Filter = 'all' | 'attention' | 'conflict' | 'completed';

const stateLabels: Record<SyncState, string> = {
  pending: '待处理',
  github_written: 'GitHub 已写入',
  failed: '失败',
  conflict: '版本冲突',
  completed: '已完成',
};

const operationLabels: Record<SyncJob['operation'], string> = {
  create: '创建文章',
  update: '更新文章',
  restore: '恢复版本',
  import: 'AI 导入',
};

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : formatChineseDateTime(date, 'Asia/Shanghai');
}

export default function ArticleSyncManager() {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/articles/sync', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '同步任务读取失败');
      setJobs(Array.isArray(result.jobs) ? result.jobs as SyncJob[] : []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '同步任务读取失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const counts = useMemo(() => ({
    attention: jobs.filter(job => ['pending', 'github_written', 'failed'].includes(job.state)).length,
    failed: jobs.filter(job => job.state === 'failed').length,
    conflict: jobs.filter(job => job.state === 'conflict').length,
  }), [jobs]);

  const visibleJobs = useMemo(() => jobs.filter(job => {
    if (filter === 'attention') return ['pending', 'github_written', 'failed'].includes(job.state);
    if (filter === 'conflict') return job.state === 'conflict';
    if (filter === 'completed') return job.state === 'completed';
    return true;
  }), [filter, jobs]);

  async function retryJob(job: SyncJob) {
    if (!job.retryable || busyId) return;
    setBusyId(job.id);
    setNotice('');
    try {
      const response = await fetch(
        `/api/admin/articles/sync/${encodeURIComponent(job.id)}/retry`,
        { method: 'POST' },
      );
      const result = await response.json();
      if (!response.ok) {
        if (result.requires_original_request === true) {
          throw new Error('任务尚未保存可恢复的 GitHub 正文，请返回原文章编辑器重新提交保存。');
        }
        throw new Error(result.error || '同步补偿未完成');
      }
      setNotice('文章同步补偿成功。');
      await loadJobs();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '同步补偿失败');
      await loadJobs();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '任务总数', value: jobs.length },
          { label: '待处理任务', value: counts.attention },
          { label: '失败任务', value: counts.failed },
          { label: '冲突任务', value: counts.conflict },
        ].map(item => (
          <div className="admin-panel" key={item.label}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{loading ? '—' : item.value}</p>
          </div>
        ))}
      </section>

      <section className="admin-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">文章同步任务</h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              最近 100 条任务记录。冲突任务不会提供自动重试，以免旧版本覆盖新内容。
            </p>
          </div>
          <button type="button" onClick={() => void loadJobs()} disabled={loading}
            className="admin-nav-link disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? '刷新中…' : '刷新列表'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="任务状态筛选">
          {([
            ['all', '全部'],
            ['attention', '待处理 / 失败'],
            ['conflict', '版本冲突'],
            ['completed', '已完成'],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className="rounded-lg border px-3 py-2 text-xs transition-colors"
              style={{
                borderColor: filter === value ? 'var(--accent)' : 'var(--border-color)',
                background: filter === value ? 'var(--accent-bg)' : 'transparent',
                color: filter === value ? 'var(--accent)' : 'var(--text-secondary)',
              }}>
              {label}
            </button>
          ))}
        </div>

        {notice && <p className="mt-4 rounded-lg border px-3 py-2 text-sm" role="status"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>{notice}</p>}

        {loading ? (
          <p className="py-10 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>正在读取任务…</p>
        ) : visibleJobs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-medium">当前筛选下没有任务</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {filter === 'attention' ? '目前没有待处理或失败的同步任务。' : '暂无符合条件的同步记录。'}
            </p>
          </div>
        ) : (
          <div className="mt-3 divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {visibleJobs.map(job => (
              <article key={job.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm">{job.article_title || job.target_path}</strong>
                      <span className="rounded-md border px-2 py-1 text-[11px]"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                        {stateLabels[job.state] || job.state}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        {operationLabels[job.operation] || job.operation}
                      </span>
                    </div>
                    <p className="mt-2 break-all text-xs" style={{ color: 'var(--text-tertiary)' }}>{job.target_path}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span>尝试次数：{job.attempt_count}</span>
                      <span>创建：{formatDate(job.created_at)}</span>
                      <span>更新：{formatDate(job.updated_at)}</span>
                    </div>
                    {job.last_error && (
                      <p className="mt-3 whitespace-pre-wrap break-words rounded-lg border p-3 text-xs"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--danger)' }}>
                        {job.last_error}
                      </p>
                    )}
                    {job.state === 'conflict' && (
                      <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        已触发版本保护。请先核对 GitHub 正文与文章版本，不要直接重试旧任务。
                      </p>
                    )}
                  </div>
                  {job.retryable && (
                    <button type="button" disabled={busyId !== null}
                      onClick={() => void retryJob(job)}
                      className="uiverse-btn uiverse-btn-ghost shrink-0 disabled:cursor-not-allowed disabled:opacity-50">
                      {busyId === job.id ? '处理中…' : '安全重试'}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
