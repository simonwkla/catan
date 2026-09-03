import { createContext, type PropsWithChildren, useContext, useRef } from "react";
import { createJSONStorage, persist } from "zustand/middleware";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { createStore } from "zustand/vanilla";
import type { VectorAx } from "@/lib/2d";
import {
  type Brush,
  Field as FieldModel,
  type Field as FieldValue,
  Layout,
  type Rule,
  type RuleKind,
  Template as TemplateModel,
  type Template as TemplateValue,
  type TileTypeValue,
  type TokenValue,
  type ValidTileTypeValue,
} from "@/models";

export interface BoardStoreState {
  field: FieldValue;
  template: TemplateValue;
  brush: Brush;
  rules: readonly (Rule & { enabled: boolean })[];
  resetBoard: () => void;
  setTileTypeCount: (type: ValidTileTypeValue, next: number) => void;
  setTokenCount: (token: TokenValue, next: number) => void;
  addFieldSlot: (pos: VectorAx) => void;
  removeFieldSlot: (pos: VectorAx) => void;
  setBrush: (brush: Brush) => void;
  setTileType: (pos: VectorAx, type: TileTypeValue) => void;
  setTileToken: (pos: VectorAx, token: TokenValue | null) => void;
  toggleRule: (rule: RuleKind) => void;
}

export function selectFieldTypeCounts(state: BoardStoreState): Record<ValidTileTypeValue, number> {
  return FieldModel.getTypeCounts(state.field);
}

export function selectFieldTokenCounts(state: BoardStoreState): Record<TokenValue, number> {
  return FieldModel.getTokenCounts(state.field);
}

export function selectTemplateTileCount(state: BoardStoreState): number {
  return TemplateModel.getTileCount(state.template);
}

export function selectTemplateTokenResourceCounts(state: BoardStoreState): {
  tokenCount: number;
  resourceTilesCount: number;
} {
  return TemplateModel.getTokenResourceCounts(state.template);
}

export function selectSelectedRuleKinds(state: BoardStoreState): readonly RuleKind[] {
  return state.rules.filter((rule) => rule.enabled).map((rule) => rule.kind);
}

export function selectPreserveConnectivity(state: BoardStoreState): boolean {
  return state.rules.some((rule) => rule.kind === "connected-field" && rule.enabled);
}

const STATE_STORE_NAME = "catan-board";

interface CreateBoardStoreProps {
  field: FieldValue;
  template: TemplateValue;
  allRules: readonly Rule[];
  selectedRules: readonly Rule[];
}

function createBoardStore({
  field: initialField,
  template: initialTemplate,
  allRules,
  selectedRules,
}: CreateBoardStoreProps) {
  return createStore<BoardStoreState>()(
    persist(
      (set) => ({
        field: initialField,
        template: initialTemplate,
        brush: { kind: "add-slot" },
        rules: allRules.map((rule) => ({
          ...rule,
          enabled: selectedRules.some((selected) => selected.kind === rule.kind),
        })),
        resetBoard: () => {
          set({ field: initialField, template: initialTemplate });
        },
        setTileTypeCount: (type, next) => {
          set((state) => {
            const template = TemplateModel.setTileTypeCount(state.template, type, next);
            return template === state.template ? state : { template };
          });
        },
        setTokenCount: (token, next) => {
          set((state) => {
            const template = TemplateModel.setTokenCount(state.template, token, next);
            return template === state.template ? state : { template };
          });
        },
        addFieldSlot: (pos) => {
          set((state) => {
            const field = Layout.addFieldSlot(state.field, pos);
            return field === state.field ? state : { field };
          });
        },
        removeFieldSlot: (pos) => {
          set((state) => {
            const field = Layout.removeFieldSlot(state.field, pos, selectPreserveConnectivity(state));
            return field === state.field ? state : { field };
          });
        },
        setBrush: (brush) => {
          set({ brush });
        },
        setTileType: (pos, type) => {
          set((state) => {
            const field = FieldModel.setTileType(state.field, pos, type);
            return field === state.field ? state : { field };
          });
        },
        setTileToken: (pos, token) => {
          set((state) => {
            const field = FieldModel.setTileToken(state.field, pos, token);
            return field === state.field ? state : { field };
          });
        },
        toggleRule: (ruleKind) => {
          set((state) => ({
            rules: state.rules.map((rule) =>
              rule.kind === ruleKind && rule.requirement === "optional" ? { ...rule, enabled: !rule.enabled } : rule,
            ),
          }));
        },
      }),
      {
        name: STATE_STORE_NAME,
        storage: createJSONStorage(() => localStorage),
      },
    ),
  );
}

export type BoardStore = ReturnType<typeof createBoardStore>;

const BoardStoreContext = createContext<BoardStore | null>(null);

export function BoardStoreProvider({ children, ...props }: PropsWithChildren<CreateBoardStoreProps>) {
  const storeRef = useRef<BoardStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = createBoardStore(props);
  }

  return <BoardStoreContext.Provider value={storeRef.current}>{children}</BoardStoreContext.Provider>;
}

export function useBoardStore<T>(selector: (state: BoardStoreState) => T, equalityFn?: (left: T, right: T) => boolean) {
  const store = useContext(BoardStoreContext);
  if (!store) {
    throw new Error("useBoardStore must be used within a BoardStoreProvider");
  }

  return useStoreWithEqualityFn(store, selector, equalityFn);
}
