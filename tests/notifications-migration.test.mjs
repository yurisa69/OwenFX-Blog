import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20261121165453_notifications_read_states.sql', import.meta.url), 'utf8');

test('notifications persist comment replies and keep read state private to the recipient', () => {
  assert.ok(sql.includes('CREATE TABLE public.notifications'));
  assert.ok(sql.includes('recipient_id uuid NOT NULL REFERENCES auth.users'));
  assert.ok(sql.includes('read_at timestamptz'));
  assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY'));
  assert.ok(sql.includes('GRANT SELECT ON TABLE public.notifications TO authenticated'));
  assert.ok(sql.includes('GRANT UPDATE (read_at) ON TABLE public.notifications TO authenticated'));
  assert.ok(sql.includes('USING ((SELECT auth.uid()) = recipient_id)'));
  assert.ok(sql.includes('WITH CHECK ((SELECT auth.uid()) = recipient_id)'));
  assert.ok(sql.includes('ON CONFLICT ON CONSTRAINT notifications_recipient_type_comment_key'));
  assert.ok(sql.includes('AFTER INSERT OR UPDATE OF status'));
  assert.ok(sql.includes("reply.status = 'approved'"));
  assert.ok(sql.includes('parent.author_id <> reply.author_id'));
});
