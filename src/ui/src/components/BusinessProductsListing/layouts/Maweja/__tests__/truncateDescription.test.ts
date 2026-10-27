import { PRODUCT_DESCRIPTION_LIMIT, truncateDescription } from '../truncateDescription'

describe('truncateDescription', () => {
  it('returns an empty string when there is no description', () => {
    expect(truncateDescription(null)).toBe('')
    expect(truncateDescription(undefined)).toBe('')
    expect(truncateDescription('')).toBe('')
  })

  it('keeps a description at or under 150 characters', () => {
    const under = 'a'.repeat(PRODUCT_DESCRIPTION_LIMIT - 1)
    const exact = ` ${'!'.repeat(PRODUCT_DESCRIPTION_LIMIT - 1)}`
    expect(truncateDescription(under)).toBe(under)
    expect(exact).toHaveLength(PRODUCT_DESCRIPTION_LIMIT)
    expect(truncateDescription(exact)).toBe(exact)
  })

  it('cuts after 150 characters and adds an ellipsis', () => {
    const source = `${'a'.repeat(PRODUCT_DESCRIPTION_LIMIT)}!`
    expect(source).toHaveLength(PRODUCT_DESCRIPTION_LIMIT + 1)
    expect(truncateDescription(source)).toBe(`${'a'.repeat(PRODUCT_DESCRIPTION_LIMIT)}…`)
  })
})
