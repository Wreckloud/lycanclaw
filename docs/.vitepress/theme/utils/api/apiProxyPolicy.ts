/**
 * 音频 URL 兼容处理：统一修正协议，并保留网易云资源域名白名单。
 */
export function addCorsProxy(url: string): string {
  if (!url) return ''

  const normalizedUrl = url.startsWith('http:') ? url.replace('http:', 'https:') : url

  if (
    normalizedUrl.includes('music.163.com') ||
    normalizedUrl.includes('music.126.net') ||
    normalizedUrl.includes('m7.music.126.net') ||
    normalizedUrl.includes('m8.music.126.net') ||
    normalizedUrl.includes('m10.music.126.net')
  ) {
    return normalizedUrl
  }

  return normalizedUrl
}
