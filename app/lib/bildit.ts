import {
  getBannersForRequest,
  type BannerType,
  type BilditEnv,
} from '@bildit-platform/hydrogen/server';

const BILDIT_REQUEST_TIMEOUT_MS = 3000;

export async function getHomepageBanners(
  request: Request,
  env: BilditEnv,
): Promise<BannerType[]> {
  if (new URL(request.url).pathname !== '/') return [];

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<BannerType[]>((resolve) => {
    timeoutId = setTimeout(() => {
      console.error('[BILDIT] Homepage banner request timed out');
      resolve([]);
    }, BILDIT_REQUEST_TIMEOUT_MS);
  });

  try {
    return await Promise.race([getBannersForRequest(request, env), timeout]);
  } catch (error) {
    console.error('[BILDIT] Homepage banner request failed:', error);
    return [];
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
