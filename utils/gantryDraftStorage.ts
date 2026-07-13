import {
  discardGantryDraftFromApi,
  fetchGantryDraftFromApi,
  saveGantryDraftToApi,
} from '@/services/gantry/gantry.service';
import type { ApiGantryDraft, ApiGantryDraftPayload } from '@/services/gantry/types';
import { GANTRY_STAGE_LABELS } from '@/services/gantry/constants';
import type { GantryStage } from '@/services/gantry/types';
import type { SubmitIdeaModalVariant } from '@/services/gantry/submitIdeaModal';
import type { SubmitIdeaDraft } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';

function draftToApiPayload(variant: SubmitIdeaModalVariant, draft: SubmitIdeaDraft): ApiGantryDraftPayload {
  return {
    variant,
    title: draft.form.title,
    description: draft.form.description ?? '',
    tags: draft.form.tags?.map((o) => o.value) ?? [],
    type: draft.form.type?.value ?? null,
    stage: draft.form.stage?.value ?? null,
    objectiveUids: draft.form.objectives?.map((o) => o.value) ?? [],
    newObjectiveTitle: draft.newObjectiveTitle || null,
    showCreateObjective: draft.showCreateObjective,
  };
}

function apiDraftToDraft(api: ApiGantryDraft): SubmitIdeaDraft {
  return {
    form: {
      title: api.title,
      description: api.description ?? '',
      tags: (api.tags ?? []).map((v) => ({ label: v, value: v })),
      type: api.type ? { label: api.type, value: api.type } : null,
      stage: api.stage
        ? { label: GANTRY_STAGE_LABELS[api.stage as GantryStage] ?? api.stage, value: api.stage }
        : null,
      objectives: (api.objectiveUids ?? []).map((uid) => ({ label: '', value: uid })),
    },
    showCreateObjective: api.showCreateObjective ?? false,
    newObjectiveTitle: api.newObjectiveTitle ?? '',
  };
}

export async function readGantryDraftResult(
  variant: SubmitIdeaModalVariant,
): Promise<{ data: SubmitIdeaDraft; savedAt: number } | null> {
  try {
    const api = await fetchGantryDraftFromApi();
    if (!api || api.variant !== variant) return null;
    return { data: apiDraftToDraft(api), savedAt: new Date(api.updatedAt).getTime() };
  } catch {
    return null;
  }
}

export async function readGantryDraft(variant: SubmitIdeaModalVariant): Promise<SubmitIdeaDraft | null> {
  return (await readGantryDraftResult(variant))?.data ?? null;
}

export async function writeGantryDraft(variant: SubmitIdeaModalVariant, data: SubmitIdeaDraft): Promise<void> {
  try {
    await saveGantryDraftToApi(draftToApiPayload(variant, data));
  } catch {
    // network or auth error — fail silently
  }
}

export async function deleteGantryDraft(_variant: SubmitIdeaModalVariant): Promise<void> {
  try {
    await discardGantryDraftFromApi();
  } catch {
    // ignore
  }
}

export async function readGantryDraftSavedAt(variant: SubmitIdeaModalVariant): Promise<number | null> {
  return (await readGantryDraftResult(variant))?.savedAt ?? null;
}
