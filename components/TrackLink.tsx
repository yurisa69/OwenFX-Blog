'use client';

export default function TrackLink({ href, eventType, targetKey, resourceId, softwareId, children, className }: {
  href: string; eventType: 'resource_click' | 'software_click' | 'wechat_click' | 'ad_click';
  targetKey: string; resourceId?: string; softwareId?: string; children: React.ReactNode; className?: string;
}) {
  function track() {
    try {
      void fetch('/api/analytics', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event_type: eventType, target_key: targetKey, resource_id: resourceId, software_id: softwareId }), keepalive: true });
    } catch {}
  }
  return <a href={href} target="_blank" rel="noopener noreferrer" onClick={track} className={className}>{children}</a>;
}
