"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SEED_BATONS } from "./seed";
import type { Baton, BatonStatus } from "./types";

type DeskState = {
  batons: Baton[];
  hydrated: boolean;
  toggleAction: (batonId: string, actionId: string) => void;
  setStatus: (batonId: string, status: BatonStatus) => void;
  addBaton: (baton: Baton) => void;
  resetDesk: () => void;
  markHydrated: () => void;
};

export const useDesk = create<DeskState>()(
  persist(
    (set) => ({
      batons: SEED_BATONS,
      hydrated: false,

      toggleAction: (batonId, actionId) =>
        set((state) => ({
          batons: state.batons.map((baton) =>
            baton.id !== batonId
              ? baton
              : {
                  ...baton,
                  actions: baton.actions.map((action) =>
                    action.id === actionId ? { ...action, done: !action.done } : action,
                  ),
                },
          ),
        })),

      setStatus: (batonId, status) =>
        set((state) => ({
          batons: state.batons.map((baton) =>
            baton.id === batonId ? { ...baton, status } : baton,
          ),
        })),

      addBaton: (baton) => set((state) => ({ batons: [baton, ...state.batons] })),

      resetDesk: () => set({ batons: SEED_BATONS }),

      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "baton-desk-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ batons: state.batons }),
      // The server renders the seed; the client rehydrates on mount. Doing it
      // manually keeps the first client render identical to the SSR output.
      skipHydration: true,
    },
  ),
);

/** Call once, on mount, from a client component. */
export function rehydrateDesk() {
  void useDesk.persist.rehydrate();
  useDesk.getState().markHydrated();
}
