CREATE POLICY "Service role manages comment moderation context"
  ON public.comment_moderation_context
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role manages comment rate limits"
  ON private.comment_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
