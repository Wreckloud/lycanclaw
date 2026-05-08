function normalizePathCandidates(path) {
  const pathWithoutSlash = path.startsWith('/') ? path.slice(1) : path
  const pathWithSlash = path.startsWith('/') ? path : `/${path}`
  return [path, pathWithoutSlash, pathWithSlash]
}

export function parseWalineRecentCommentsResponse(data) {
  if (Array.isArray(data)) return data

  if (data && typeof data === 'object' && 'data' in data) {
    const envelope = data
    if (Array.isArray(envelope.data)) {
      return envelope.data
    }
  }

  return []
}

export function parseWalineCommentCountResponse(data, path) {
  if (typeof data === 'number') return data
  if (!data || typeof data !== 'object') return 0

  const record = data
  if ('data' in record && typeof record.data === 'number') {
    return record.data
  }

  const candidates = normalizePathCandidates(path)
  for (const candidate of candidates) {
    if (typeof record[candidate] === 'number') {
      return record[candidate]
    }
  }

  return 0
}

export function parseWalinePageViewResponse(data) {
  return typeof data === 'number' ? data : 0
}
