
export interface SearchableItem {
  name: string;
  sku?: string | string[] | Set<string> | null;
  internal_code?: string | string[] | Set<string> | null;
  [key: string]: any;
}

export function rankSearchItem(item: SearchableItem, term: string): number {
  if (!term || term.trim().length === 0) return 1; // Score base para quando não há busca
  
  const searchLower = term.toLowerCase().trim();
  const searchSuper = searchLower.replace(/[^a-z0-9]/g, '');
  
  const nameBase = `${item.name || ""} ${item.spec || ""}`.trim();
  const nameLower = nameBase.toLowerCase();
  const nameSuper = nameLower.replace(/[^a-z0-9]/g, '');
  
  const getArray = (val: any): string[] => {
    if (!val) return [];
    if (typeof val === 'string') return [val.toLowerCase()];
    if (Array.isArray(val)) return val.filter(v => v != null).map(v => String(v).trim().toLowerCase());
    if (val instanceof Set) return Array.from(val).filter(v => v != null).map((v: any) => String(v).trim().toLowerCase());
    return [];
  };

  const skus = getArray(item.sku);
  const codes = getArray(item.internal_code);
  const skusSuper = skus.map(s => s.replace(/[^a-z0-9]/g, ''));
  const codesSuper = codes.map(c => c.replace(/[^a-z0-9]/g, ''));

  let score = 0;

  // 1. Prioridade Máxima: SKU ou Código Interno Exato
  if (skus.includes(searchLower) || codes.includes(searchLower)) return 1000;
  
  // 2. Nome Exato
  if (nameLower === searchLower) return 900;

  // 3. Super Normalizado Exato (ex: "15C" match "15-C")
  if (skusSuper.includes(searchSuper) || codesSuper.includes(searchSuper)) score += 800;
  if (nameSuper === searchSuper) score += 700;

  // 4. Começa com o termo
  if (skus.some(s => s.startsWith(searchLower)) || codes.some(c => c.startsWith(searchLower))) score += 500;
  if (nameLower.startsWith(searchLower)) score += 400;

  // 5. Palavra Inteira
  const escapedTerm = searchLower.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const wordRegex = new RegExp(`\\b${escapedTerm}\\b`, 'i');
  if (wordRegex.test(nameLower) || skus.some(s => wordRegex.test(s))) score += 300;

  // 6. Contém o termo (Super Normalizado - Ignora espaços/traços)
  if (skusSuper.some(s => s.includes(searchSuper)) || codesSuper.some(c => c.includes(searchSuper))) score += 200;
  if (nameSuper.includes(searchSuper)) score += 150;

  // 7. Contém o termo (Substring simples)
  if (skus.some(s => s.includes(searchLower)) || codes.some(c => c.includes(searchLower))) score += 100;
  if (nameLower.includes(searchLower)) score += 80;

  // 8. Bônus por proximidade no nome
  const pos = nameLower.indexOf(searchLower);
  if (pos !== -1) {
    score += Math.max(0, 50 - pos);
  }

  return score;
}

export function sortSearchResults<T extends SearchableItem>(items: T[], term: string): T[] {
  if (!term || term.trim().length === 0) return items;

  return items
    .map(item => ({ item, score: rankSearchItem(item, term) }))
    .filter(res => res.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(res => res.item);
}

