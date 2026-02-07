import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['description', 'description'],
      ['media:content', 'mediaContent'],
      ['enclosure', 'enclosure'],
      ['media:thumbnail', 'mediaThumbnail']
    ],
  }
});

const extractImageUrl = (item: any): string | null => {
  if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) return item.mediaContent.$.url;
  if (item.enclosure && item.enclosure.url && (item.enclosure.type?.startsWith('image/') || item.enclosure.url.match(/\.(jpg|jpeg|png|webp|gif|svg)/i))) return item.enclosure.url;
  if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) return item.mediaThumbnail.$.url;

  const content = item.contentEncoded || item.content || item.description || '';
  const imgRegex = /<img[^>]+(?:src|data-src|data-full-url|data-original-src)="([^">]+)"/i;
  const match = content.match(imgRegex);
  return match && match[1] ? match[1] : null;
};

export async function POST(req: Request) {
  try {
    const { feedUrl } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const response = await fetch(feedUrl);
    const xml = await response.text();
    const feed = await parser.parseString(xml);

    const { error: feedError } = await supabase
      .from('feeds')
      .upsert({
        url: feedUrl,
        title: feed.title || 'Untitled',
        user_id: user.id
      }, { onConflict: 'url,user_id' });

    if (feedError) throw feedError;

    const articles = feed.items.map((item: any) => {
      const content = item.contentEncoded || item.content || item.description || '';
      const wordCount = content.split(/\s+/).length;
      return {
        feed_url: feedUrl,
        title: item.title || 'Untitled',
        author: item.creator || item.author || feed.title || 'Unknown',
        source: feed.title || 'Source',
        url: item.link,
        content,
        excerpt: (item.contentSnippet || item.description || '').substring(0, 300).replace(/<[^>]*>?/gm, '') + '...',
        published_at: item.isoDate || new Date().toISOString(),
        reading_time: `${Math.ceil(wordCount / 225)} min read`,
        image_url: extractImageUrl(item),
        x: Math.floor(Math.random() * 4000) - 2000,
        y: Math.floor(Math.random() * 4000) - 2000
      };
    }).slice(0, 40);

    if (articles.length > 0) {
      const { error: insertError } = await supabase.from('articles').upsert(articles, { onConflict: 'url' });
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true, count: articles.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}