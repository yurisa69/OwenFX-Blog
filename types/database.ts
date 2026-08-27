export type Database = {
  public: {
    Tables: {
      profiles: { Row: { id: string; display_name: string | null; avatar_url: string | null; bio: string | null } }
      posts: { Row: { id: string; slug: string; title: string; excerpt: string | null; content: string; cover_url: string | null; published_at: string | null } }
      comments: { Row: { id: string; post_id: string; user_id: string; content: string; created_at: string } }
      bookmarks: { Row: { user_id: string; post_id: string; created_at: string } }
      subscribers: { Row: { id: string; email: string; created_at: string } }
    }
  }
}
