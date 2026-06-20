// Label DTO

/**
 * @typedef {Object} Label
 * @property {string} id
 * @property {string} name
 * @property {string} color
 */

export function fromApiLabel(raw) {
  return {
    id:    raw.id,
    name:  raw.name,
    color: raw.color || '#00a884',
  };
}
