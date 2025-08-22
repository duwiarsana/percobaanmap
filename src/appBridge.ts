// Typed wrapper around window.appInstance to avoid direct global access

export type AppBridge = {
  setIsZooming?: (v: boolean) => void;
  setSelectedDistrict?: (name: string | null) => void;
  setSelectedDistrictId?: (id: string | number | null) => void;
  loadSubdistrictData?: (districtId: string | number) => Promise<void>;
};

export function getAppBridge(): AppBridge | undefined {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).appInstance as AppBridge | undefined;
  }
  return undefined;
}

export function setAppBridge(bridge: AppBridge): void {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).appInstance = bridge;
  }
}
