CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type = 'comment_reply'),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  CONSTRAINT notifications_recipient_type_comment_key
    UNIQUE (recipient_id, type, comment_id)
);

CREATE INDEX notifications_recipient_created_idx
  ON public.notifications (recipient_id, created_at DESC);

CREATE INDEX notifications_unread_recipient_created_idx
  ON public.notifications (recipient_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Only signed-in users can read their own notifications and update the read state.
-- Column-level UPDATE prevents changing ownership, actor, type, or linked content.
REVOKE ALL ON TABLE public.notifications FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.notifications TO authenticated;
GRANT UPDATE (read_at) ON TABLE public.notifications TO authenticated;

CREATE POLICY "Users read own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = recipient_id);

CREATE POLICY "Users update own notification read state"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = recipient_id)
  WITH CHECK ((SELECT auth.uid()) = recipient_id);

CREATE OR REPLACE FUNCTION public.create_comment_reply_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_recipient_id uuid;
BEGIN
  IF NEW.parent_comment_id IS NULL
     OR NEW.status <> 'approved'
     OR NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT parent.author_id
    INTO v_recipient_id
  FROM public.comments AS parent
  WHERE parent.id = NEW.parent_comment_id
    AND parent.parent_comment_id IS NULL
    AND parent.status = 'approved'
    AND parent.deleted_at IS NULL;

  IF v_recipient_id IS NULL OR v_recipient_id = NEW.author_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    comment_id,
    article_id,
    created_at
  )
  VALUES (
    v_recipient_id,
    NEW.author_id,
    'comment_reply',
    NEW.id,
    NEW.article_id,
    NEW.created_at
  )
  ON CONFLICT ON CONSTRAINT notifications_recipient_type_comment_key
  DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_comment_reply_notification() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER comments_create_reply_notification
  AFTER INSERT OR UPDATE OF status, parent_comment_id, author_id, article_id, deleted_at
  ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_comment_reply_notification();

-- Preserve the existing reply notifications when moving from the derived query
-- to persisted read/unread records. This inserts only currently visible replies.
INSERT INTO public.notifications (
  recipient_id,
  actor_id,
  type,
  comment_id,
  article_id,
  created_at
)
SELECT
  parent.author_id,
  reply.author_id,
  'comment_reply',
  reply.id,
  reply.article_id,
  reply.created_at
FROM public.comments AS reply
JOIN public.comments AS parent
  ON parent.id = reply.parent_comment_id
WHERE reply.parent_comment_id IS NOT NULL
  AND reply.status = 'approved'
  AND reply.deleted_at IS NULL
  AND parent.parent_comment_id IS NULL
  AND parent.status = 'approved'
  AND parent.deleted_at IS NULL
  AND parent.author_id <> reply.author_id
ON CONFLICT ON CONSTRAINT notifications_recipient_type_comment_key
DO NOTHING;
