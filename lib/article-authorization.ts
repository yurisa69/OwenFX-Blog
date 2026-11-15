export function contentEditorAccessError(
  user: unknown,
  rpcData: unknown,
  rpcError: unknown,
): { status: 401 | 403; error: string } | null {
  if (!user) return { status: 401, error: '请先登录' };
  if (rpcError || rpcData !== true) return { status: 403, error: '没有内容管理权限' };
  return null;
}
