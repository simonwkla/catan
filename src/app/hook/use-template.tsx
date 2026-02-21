import { createContext, type PropsWithChildren, useContext, useRef } from "react";
import { createJSONStorage, persist, subscribeWithSelector } from "zustand/middleware";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { createStore, type StateCreator } from "zustand/vanilla";
import { fn, obj } from "@/lib/std";
import { VectorAx } from "@/lib/vec";
import {
  type Brush,
  type Field,
  isResourceTileType,
  type Template,
  type Tile,
  type TileTypeValue,
  type Token,
  type TokenValue,
  type ValidTileTypeValue,
} from "@/models";

interface TemplateSlice {
  field: Field;
  template: Template;
  brush: Brush;
  selectedTilePos: VectorAx | null;
  reset: () => void;
  setTileTypeCount: (type: ValidTileTypeValue, next: number) => void;
  setTokenCount: (token: TokenValue, next: number) => void;
  incTileTypeCount: (type: ValidTileTypeValue) => void;
  decTileTypeCount: (type: ValidTileTypeValue) => void;
  getTile: (pos: VectorAx) => Tile | null;
  updateTile: (tile: Tile) => void;
  clearTile: (pos: VectorAx) => void;
  selectTile: (pos: VectorAx) => void;
  selectBrush: (brush: Brush) => void;
  setTileType: (pos: VectorAx, type: TileTypeValue) => void;
  setTileToken: (pos: VectorAx, token: Token | null) => void;
  getFieldTokenCount: () => Record<TokenValue, number>;
  getFieldTypeCount: () => Record<ValidTileTypeValue, number>;

  getTemplateTokenResourceTilesDiff: () => {
    tokenCount: number;
    resourceTilesCount: number;
  };
}

const STATE_STORE_NAME = "catan-state";

interface CreateTemplateSliceProps {
  field: Field;
  template: Template;
}

const createTemplateSlice: (props: CreateTemplateSliceProps) => StateCreator<TemplateSlice> =
  (props) => (set, get) => ({
    field: props.field,
    template: props.template,
    brush: { kind: "select" },
    selectedTilePos: null,
    // resolves a tile by position
    getTile: (pos: VectorAx) => {
      return get().field.tiles.find((t) => VectorAx.equals(t.pos, pos)) ?? null;
    },

    reset: () => {
      set({
        field: props.field,
        template: props.template,
        brush: { kind: "select" },
        selectedTilePos: null,
      });
    },

    setTileTypeCount: (type: ValidTileTypeValue, next: number) => {
      set((state) => ({
        template: {
          ...state.template,
          tileTypesMap: { ...state.template.tileTypesMap, [type]: Math.max(0, next) },
        },
      }));
    },
    setTokenCount: (token: TokenValue, next: number) => {
      set((state) => ({
        template: {
          ...state.template,
          tokensMap: { ...state.template.tokensMap, [token]: Math.max(0, next) },
        },
      }));
    },
    decTileTypeCount: (type: ValidTileTypeValue) => {
      const current = get().template.tileTypesMap[type];
      get().setTileTypeCount(type, current - 1);
    },
    incTileTypeCount: (type: ValidTileTypeValue) => {
      const current = get().template.tileTypesMap[type];
      get().setTileTypeCount(type, current + 1);
    },
    // upserts a tile in the field
    updateTile: (tile: Tile) => {
      set((state) => ({
        field: {
          tiles: state.field.tiles.map((t) => (VectorAx.equals(t.pos, tile.pos) ? tile : t)),
        },
      }));
    },
    // removes type and token from a tile
    clearTile: (pos: VectorAx) => {
      get().updateTile({
        pos,
        type: "empty",
        token: null,
      });
    },
    // selects a tile by position
    selectTile: (pos: VectorAx) => {
      set({ selectedTilePos: pos });
    },
    // updates the token of a tile
    setTileToken: (pos: VectorAx, token: Token | null) => {
      const tile = get().getTile(pos);
      if (!tile) {
        return;
      }

      if (token && !isResourceTileType(tile.type)) {
        return;
      }

      get().updateTile({
        ...tile,
        token,
      });
    },
    // updates the type of a tile
    setTileType: (pos: VectorAx, type: TileTypeValue) => {
      const tile = get().getTile(pos);
      if (!tile) {
        return;
      }
      get().updateTile({
        ...tile,
        token: isResourceTileType(type) ? tile.token : null,
        type,
      });
    },
    // selects a brush
    selectBrush: (brush: Brush) => {
      set({ brush });
    },
    getFieldTokenCount: () => {
      // get any tokens that are > count on the field
      const { template, field } = get();

      // num tokens in template - tokens in field
      const fieldTokenCountMap = obj.fromEntries(
        obj.getEntries(template.tokensMap).map(([token, _count]) => {
          const fCount = tileCountByToken(field, token);
          return [token, fCount];
        }),
      );

      return fieldTokenCountMap;
    },
    getFieldTypeCount: () => {
      const { template, field } = get();

      const fieldTypeCountMap = obj.fromEntries(
        obj.getEntries(template.tileTypesMap).map(([tileType, _count]) => {
          const fCount = tileCountByType(field, tileType);
          return [tileType, fCount];
        }),
      );

      return fieldTypeCountMap;
    },
    getTemplateTokenResourceTilesDiff: () => {
      const { template } = get();

      const tokenCount = obj.getEntries(template.tokensMap).reduce((acc, [_, count]) => acc + count, 0);
      const resourceTilesCount = obj
        .getEntries(template.tileTypesMap)
        .filter(([type]) => isResourceTileType(type))
        .reduce((acc, [_, count]) => acc + count, 0);

      return {
        tokenCount,
        resourceTilesCount,
      };
    },
  });

function tileCountByToken(field: Field, token: TokenValue): number {
  return field.tiles.filter((t) => t.token?.value === token).length;
}

function tileCountByType(field: Field, type: TileTypeValue): number {
  return field.tiles.filter((t) => t.type === type).length;
}

type CreateTemplateStoreProps = CreateTemplateSliceProps;
type TemplateStoreState = TemplateSlice & {
  selectedTile: Tile | null;
};

const createTemplateStore = ({ field, template }: CreateTemplateStoreProps) => {
  const store = createStore<TemplateStoreState>()(
    subscribeWithSelector(
      persist(
        (set, get, api) => {
          const templateSlice = createTemplateSlice({ field, template })(set, get, api);
          return {
            ...templateSlice,
            selectedTile: null,
          };
        },
        {
          name: STATE_STORE_NAME,
          version: 1,
          storage: createJSONStorage(() => localStorage),
        },
      ),
    ),
  );

  store.subscribe(
    (state) => ({
      selectedTilePos: state.selectedTilePos,
    }),
    (newState) => {
      store.setState({
        selectedTile: fn.applyOptional(newState.selectedTilePos, store.getState().getTile),
      });
    },
    {
      equalityFn: (a, b) => a.selectedTilePos === b.selectedTilePos,
    },
  );

  return store;
};

export type TemplateStore = ReturnType<typeof createTemplateStore>;

export interface TemplateStoreContext {
  store: TemplateStore;
}

export const TemplateStoreContext = createContext<TemplateStoreContext | null>(null);

export function TemplateStoreProvider({ children, ...props }: PropsWithChildren<CreateTemplateStoreProps>) {
  const storeRef = useRef<TemplateStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = createTemplateStore(props);
  }

  return <TemplateStoreContext.Provider value={{ store: storeRef.current }}>{children}</TemplateStoreContext.Provider>;
}

export function useTemplateStore<T>(
  selector: (state: TemplateStoreState) => T,
  equalityFn?: (left: T, right: T) => boolean,
) {
  const context = useContext(TemplateStoreContext);
  if (!context) {
    throw new Error("useTemplateStore must be used within a TemplateStoreProvider");
  }

  return useStoreWithEqualityFn(context.store, selector, equalityFn);
}
