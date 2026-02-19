"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  DEFAULT_VISIBLE_PAGE_IDS,
  HIDEABLE_NAV_PAGES,
  type HideableNavPageId,
  type NavPageId,
} from "@/lib/navigation"

const STORAGE_PREFIX = "crm:visible-pages:"
const HIDEABLE_PAGE_ID_SET = new Set(HIDEABLE_NAV_PAGES.map((page) => page.id))

function isHideablePageId(id: unknown): id is HideableNavPageId {
  return typeof id === "string" && HIDEABLE_PAGE_ID_SET.has(id as HideableNavPageId)
}

function sanitizePageIds(value: unknown): HideableNavPageId[] {
  if (!Array.isArray(value)) return DEFAULT_VISIBLE_PAGE_IDS

  const filtered = value.filter(isHideablePageId)

  const unique = [...new Set(filtered)]
  return unique.length > 0 ? unique : DEFAULT_VISIBLE_PAGE_IDS
}

export function usePageVisibility(userKey: string | null | undefined) {
  const [visiblePageIds, setVisiblePageIds] = useState<HideableNavPageId[]>(DEFAULT_VISIBLE_PAGE_IDS)

  const storageKey = useMemo(() => {
    if (!userKey) return null
    return `${STORAGE_PREFIX}${userKey}`
  }, [userKey])

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return

    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      setVisiblePageIds(DEFAULT_VISIBLE_PAGE_IDS)
      return
    }

    try {
      setVisiblePageIds(sanitizePageIds(JSON.parse(raw)))
    } catch {
      setVisiblePageIds(DEFAULT_VISIBLE_PAGE_IDS)
    }
  }, [storageKey])

  const setVisiblePages = useCallback(
    (nextIds: HideableNavPageId[]) => {
      const sanitized = sanitizePageIds(nextIds)
      setVisiblePageIds(sanitized)

      if (!storageKey || typeof window === "undefined") return
      window.localStorage.setItem(storageKey, JSON.stringify(sanitized))
    },
    [storageKey]
  )

  const resetVisiblePages = useCallback(() => {
    setVisiblePages(DEFAULT_VISIBLE_PAGE_IDS)
  }, [setVisiblePages])

  const isPageVisible = useCallback(
    (pageId: NavPageId) => {
      if (pageId === "settings") return true
      return visiblePageIds.includes(pageId)
    },
    [visiblePageIds]
  )

  return {
    hideablePages: HIDEABLE_NAV_PAGES,
    visiblePageIds,
    setVisiblePages,
    resetVisiblePages,
    isPageVisible,
  }
}
