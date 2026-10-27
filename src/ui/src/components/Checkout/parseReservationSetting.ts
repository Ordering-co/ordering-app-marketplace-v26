function asSettingObject (value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

export function parseReservationSetting (value: unknown) {
  if (typeof value !== 'string') {
    return asSettingObject(value)
  }

  try {
    return asSettingObject(JSON.parse(value))
  } catch {
    return {}
  }
}
