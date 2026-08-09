export function generateSlug(name: string): string {
  const baseSlug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const uniqueId = Math.random().toString(36).substring(2, 8); 

  return `${baseSlug}-${uniqueId}`;
}
