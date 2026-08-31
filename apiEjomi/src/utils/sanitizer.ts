/**
 * Supprime les caractères nuls (\0) d'une chaîne de caractères.
 * @param value La valeur à nettoyer.
 * @returns La valeur nettoyée si c'est une chaîne, sinon la valeur originale.
 */
const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value.replace(/\0/g, '');
  }
  return value;
};

/**
 * Nettoie un objet en supprimant les caractères nuls de toutes ses propriétés de type chaîne.
 * @param obj L'objet à nettoyer.
 * @returns Un nouvel objet avec les valeurs nettoyées.
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitizedEntries = Object.entries(obj).map(([key, value]) => [key, sanitizeValue(value)]);
  return Object.fromEntries(sanitizedEntries) as T;
};