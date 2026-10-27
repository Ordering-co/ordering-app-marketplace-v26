export const PRODUCT_DESCRIPTION_LIMIT = 150

export const truncateDescription = (description: string | null | undefined): string => {
  if (!description) return ''
  if (description.length <= PRODUCT_DESCRIPTION_LIMIT) return description
  return `${description.slice(0, PRODUCT_DESCRIPTION_LIMIT)}…`
}
