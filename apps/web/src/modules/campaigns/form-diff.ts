import type { CampaignCreate } from '@proyectodm/shared'

// Working copy of a campaign while the user edits the form: both fields are
// always present, and an empty textarea is already collapsed to `null` by the
// caller.
export interface CampaignFormValues {
  name: string
  description: string | null
}

// PATCH body built from the fields the user actually changed. It is exactly
// `Partial<CampaignCreate>` (the shared package names the same shape plus
// `status` `CampaignUpdate`, which the API validates with
// `CampaignUpdateSchema`).
export type CampaignPatch = Partial<CampaignCreate>

// A blank description is stored as `null`, never as `''`; the stored side is
// normalised too so a whitespace-only value already in the campaign compares
// equal to a cleared field.
function normalizeDescription(description: string | null): string | null {
  return description === null || description.trim() === '' ? null : description
}

// Pure value diff (never reference diff) between the campaign as loaded and
// the values currently in the form:
//
// - unchanged fields are omitted, so an untouched form produces `{}` and the
//   caller can close the edit instead of sending the empty body that
//   `CampaignUpdateSchema` rejects;
// - a blank description normalises to `null`, so clearing the field sends an
//   explicit `null` rather than `''`;
// - `name` is compared verbatim (no trimming): the form only drops it when the
//   text is byte-for-byte the one that was loaded.
export function diffCampaignInput(
  initial: CampaignFormValues,
  values: CampaignFormValues,
): CampaignPatch {
  const patch: CampaignPatch = {}

  if (values.name !== initial.name) {
    patch.name = values.name
  }

  const nextDescription = normalizeDescription(values.description)
  if (nextDescription !== normalizeDescription(initial.description)) {
    patch.description = nextDescription
  }

  return patch
}
