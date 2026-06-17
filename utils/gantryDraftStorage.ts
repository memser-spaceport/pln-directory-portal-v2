import { openDB } from 'idb';
import type { SubmitIdeaModalVariant } from '@/services/gantry/submitIdeaModal';
import type { SubmitIdeaDraft } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';

const DB_NAME = 'gantry-drafts';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';
const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type GantryDraftEnvelope = {
  v: 1;
  savedAt: number;
  data: SubmitIdeaDraft;
};

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function readGantryDraft(variant: SubmitIdeaModalVariant): Promise<SubmitIdeaDraft | null> {
  try {
    const db = await getDB();
    const envelope = await db.get(STORE_NAME, variant) as GantryDraftEnvelope | undefined;
    if (!envelope || envelope.v !== 1 || typeof envelope.savedAt !== 'number' || !envelope.data) {
      return null;
    }
    if (Date.now() - envelope.savedAt > DRAFT_TTL_MS) {
      await db.delete(STORE_NAME, variant);
      return null;
    }
    return envelope.data;
  } catch {
    return null;
  }
}

export async function writeGantryDraft(variant: SubmitIdeaModalVariant, data: SubmitIdeaDraft): Promise<void> {
  try {
    const db = await getDB();
    const envelope: GantryDraftEnvelope = { v: 1, savedAt: Date.now(), data };
    await db.put(STORE_NAME, envelope, variant);
  } catch {
    // IDB unavailable or quota exceeded — fail silently
  }
}

export async function deleteGantryDraft(variant: SubmitIdeaModalVariant): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, variant);
  } catch {
    // ignore
  }
}

export async function readGantryDraftSavedAt(variant: SubmitIdeaModalVariant): Promise<number | null> {
  try {
    const db = await getDB();
    const envelope = await db.get(STORE_NAME, variant) as GantryDraftEnvelope | undefined;
    if (!envelope || envelope.v !== 1) return null;
    return envelope.savedAt;
  } catch {
    return null;
  }
}
