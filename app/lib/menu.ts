export function normalizeMenuUrl(
  url: string,
  domains: ReadonlyArray<string | null | undefined>,
) {
  if (url.startsWith('/')) return {url, external: false};

  try {
    const parsed = new URL(url);
    const internalHosts = domains.flatMap((domain) => {
      if (!domain) return [];
      try {
        return [new URL(domain.includes('://') ? domain : `https://${domain}`).host];
      } catch {
        return [];
      }
    });

    if (parsed.hostname.endsWith('.myshopify.com') || internalHosts.includes(parsed.host)) {
      return {url: `${parsed.pathname}${parsed.search}${parsed.hash}`, external: false};
    }
    return {url: parsed.toString(), external: true};
  } catch {
    return {url: '/', external: false};
  }
}
