import type { SessionUpdate } from '@proyectodm/shared'

// Values the form works with: ISO datetimes (or null), exactly the shape the
// API accepts. The datetime-local input is converted at the edges.
export interface SessionFormValues {
  title: string
  summary: string | null
  playedAt: string | null
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

// ISO -> value for <input type="datetime-local">, in the browser's local time.
// An unparsable value degrades to '' instead of throwing inside render.
export function toDateTimeLocalValue(iso: string | null): string {
  if (iso === null) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

// <input type="datetime-local"> -> ISO. Empty input clears the field (null);
// an invalid value also maps to null, and the shared schema catches it if the
// caller ever passes one through.
export function fromDateTimeLocalValue(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

// Only the fields that actually changed, so the page never PATCHes an empty
// body (the shared update schema rejects it).
export function diffSessionInput(
  initial: SessionFormValues,
  next: SessionFormValues,
): SessionUpdate {
  const patch: SessionUpdate = {}
  if (next.title !== initial.title) patch.title = next.title
  if (next.summary !== initial.summary) patch.summary = next.summary
  if (next.playedAt !== initial.playedAt) patch.playedAt = next.playedAt
  return patch
}
