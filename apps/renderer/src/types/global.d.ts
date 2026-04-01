import type { TurnerApi } from '@turner/contracts';

declare global {
  interface Window {
    turner?: TurnerApi;
  }
}

export {};
