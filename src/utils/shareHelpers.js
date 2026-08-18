/** Build share URLs and helpers for result detail pages. */

export function getPageShareUrl() {
  if (typeof window === 'undefined') return '';
  return window.location.href;
}

export function buildShareMessage({ title, text, url }) {
  const parts = [];
  if (title) parts.push(title);
  if (text) {
    const snippet = text.length > 280 ? `${text.slice(0, 277)}…` : text;
    parts.push(snippet);
  }
  if (url) parts.push(url);
  return parts.join('\n\n');
}

export function openShareWindow(url) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer,width=640,height=480');
}

export function shareViaWhatsApp({ title, text, url }) {
  const message = buildShareMessage({ title, text, url: url || getPageShareUrl() });
  openShareWindow(`https://wa.me/?text=${encodeURIComponent(message)}`);
}

export function shareViaEmail({ title, text, url }) {
  const subject = title || 'AVoices result';
  const body = buildShareMessage({ title: '', text, url: url || getPageShareUrl() });
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function shareViaLinkedIn({ url }) {
  const shareUrl = url || getPageShareUrl();
  openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`);
}

export function shareViaTwitter({ title, text, url }) {
  const tweet = buildShareMessage({ title, text, url: url || getPageShareUrl() });
  openShareWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`);
}

export function shareViaFacebook({ url }) {
  const shareUrl = url || getPageShareUrl();
  openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
}

/** TikTok has no web text-share API — copy content and open TikTok. */
export async function shareViaTikTok({ title, text, url, onNotify }) {
  const message = buildShareMessage({ title, text, url: url || getPageShareUrl() });
  try {
    await navigator.clipboard.writeText(message);
    onNotify?.('Copied — paste into TikTok to share', 'success');
  } catch {
    onNotify?.('Copy the text manually to share on TikTok', 'info');
  }
  openShareWindow('https://www.tiktok.com/upload');
}

export async function copyShareLink({ url, onNotify }) {
  const link = url || getPageShareUrl();
  try {
    await navigator.clipboard.writeText(link);
    onNotify?.('Link copied to clipboard', 'success');
    return true;
  } catch {
    onNotify?.('Could not copy link', 'error');
    return false;
  }
}

export async function tryNativeShare({ title, text, url, onNotify }) {
  if (!navigator.share) return false;
  try {
    await navigator.share({
      title: title || 'AVoices',
      text: text || undefined,
      url: url || getPageShareUrl(),
    });
    return true;
  } catch (err) {
    if (err?.name !== 'AbortError') {
      onNotify?.('Share cancelled', 'info');
    }
    return false;
  }
}
