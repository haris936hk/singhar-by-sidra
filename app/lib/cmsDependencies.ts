import {registerCmsDependencies} from '@bildit-platform/hydrogen/client';
import type {ExtraDependencyConfig} from '@bildit-platform/hydrogen';

// Keep this list limited to non-React modules explicitly used by authored banners.
export const extraDependenciesConfig: Record<string, ExtraDependencyConfig> = {};

export function registerHostCmsDependencies() {
  registerCmsDependencies(extraDependenciesConfig);
}
