import { services, type Service } from '../data/services';

const CATALOG_KEY = 'yuzersef.catalog';

export function getCatalog(): Service[] {
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    if (!raw) return services.map((item) => ({ ...item, active: true, archived: false }));
    const saved = JSON.parse(raw) as Service[];
    return Array.isArray(saved) ? saved : services.map((item) => ({ ...item, active: true, archived: false }));
  } catch {
    return services.map((item) => ({ ...item, active: true, archived: false }));
  }
}

export function saveCatalog(items: Service[]) {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(items));
}

export function getStoreCatalog(): Service[] {
  return getCatalog().filter((item) => item.active !== false && item.archived !== true);
}
