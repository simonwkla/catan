// Force the Node binding to avoid accidentally loading the browser/wasm build
import type { Field, ValidField } from "../entity/field";
import type { Template } from "../entity/template";
import { Tile, TileType, type ValidTile } from "../entity/tile";
import { Token, token as tokenFns } from "../entity/token";
import { Template as TemplateFns } from "../entity/template";
import { init } from "z3-solver";

function axialNeighbors(pos: { q: number; r: number }): { q: number; r: number }[] {
  const deltas = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];
  return deltas.map((d) => ({ q: pos.q + d.q, r: pos.r + d.r }));
}

function buildAdjacencyPairs(field: Field): [number, number][] {
  const indexByKey = new Map<string, number>();
  field.tiles.forEach((t, i) => indexByKey.set(`${t.pos.q}:${t.pos.r}`, i));

  const pairs: [number, number][] = [];
  field.tiles.forEach((t, i) => {
    const ns = axialNeighbors(t.pos);
    for (const n of ns) {
      const j = indexByKey.get(`${n.q}:${n.r}`);
      if (j !== undefined && j > i) pairs.push([i, j]);
    }
  });
  return pairs;
}

const ALL_VALID_TILE_TYPES: ReadonlyArray<ValidTile["type"]> = Tile.validTileTypes;
const ALL_LAND_TILE_TYPES: ReadonlyArray<ValidTile["type"]> = [
  TileType.Desert,
  ...Tile.resourceTileTypes,
];

const TOKEN_NONE = 0; // internal marker for no-token (water/desert)

function mapEnumValues<T extends string>(values: readonly T[]): Map<T, number> {
  const m = new Map<T, number>();
  values.forEach((v, i) => m.set(v, i + 1)); // start at 1 to reserve 0 for NONE-token
  return m;
}

const TOKEN_ORDER: Token[] = [
  Token.Two,
  Token.Three,
  Token.Four,
  Token.Five,
  Token.Six,
  Token.Eight,
  Token.Nine,
  Token.Ten,
  Token.Eleven,
  Token.Twelve,
];

const HIGH_TOKENS = new Set<Token>([Token.Six, Token.Eight]);

export async function solve(field: Field, template: Template): Promise<ValidField> {
  if (!TemplateFns.isCompatibleWithField(template, field)) {
    throw new Error("given template is incompatible with field");
  }

  const { Context } = await init();
  const Z3 = Context("catan");

  // Enumerations → Int encodings
  const TILE_TYPE_DOMAIN: ValidTile["type"][] = ALL_VALID_TILE_TYPES.slice();
  const TILE_TYPE_TO_INT = mapEnumValues(TILE_TYPE_DOMAIN);
  const INT_TO_TILE_TYPE = new Map<number, ValidTile["type"]>(
    TILE_TYPE_DOMAIN.map((t) => [TILE_TYPE_TO_INT.get(t)!, t]),
  );

  const TOKEN_DOMAIN: number[] = [TOKEN_NONE, ...TOKEN_ORDER.map((t) => TOKEN_ORDER.indexOf(t) + 1)];
  const TOKEN_TO_INT = new Map<Token, number>(TOKEN_ORDER.map((t, i) => [t, i + 1]));
  const INT_TO_TOKEN = new Map<number, Token>(TOKEN_ORDER.map((t, i) => [i + 1, t]));

  const isResourceType = (tt: ValidTile["type"]) => Tile.resourceTileTypes.includes(tt as any);

  const solver = new Z3.Solver();
  const n = field.tiles.length;
  const typeVars = Array.from({ length: n }, (_, i) => Z3.Int.const(`type_${i}`));
  const tokenVars = Array.from({ length: n }, (_, i) => Z3.Int.const(`token_${i}`));

  // Per-tile domain constraints
  for (let i = 0; i < n; i++) {
    const tile = field.tiles[i];

    // Allowed type domain per tile (empty → any valid, placeholder → land only, fixed → itself)
    let baseAllowedTypes: ReadonlyArray<ValidTile["type"]>;
    if (Tile.isValid(tile)) {
      baseAllowedTypes = [tile.type];
    } else if (tile.type === TileType.Placeholder) {
      baseAllowedTypes = ALL_LAND_TILE_TYPES;
    } else {
      // empty → any valid tile
      baseAllowedTypes = TILE_TYPE_DOMAIN;
    }

    // Respect template: only types that exist in template with positive remaining capacity are in play.
    // We cannot know remaining per-position, but we do allow all from template (>0). Counts will constrain globally.
    const allowedTypes = baseAllowedTypes.filter((tt) => (template.tileTypesMap as any)[tt] > 0);

    const allowedTypeExprs = allowedTypes.map((tt) => typeVars[i].eq(TILE_TYPE_TO_INT.get(tt)!));
    if (allowedTypeExprs.length === 0) {
      throw new Error("No allowed tile types remain for a tile given the template and position");
    }
    console.log("allowedTypeExprs", allowedTypes);
    //solver.add(Z3.Or(...allowedTypeExprs));

    // Token domain per-tile
    /*if (Tile.isValid(tile) && Tile.isResource(tile)) {
      // Fixed resource tile with fixed token (if present)
      if (tile.token) {
        const tInt = TOKEN_TO_INT.get(tile.token)!;
        solver.add(tokenVars[i].eq(tInt));
      } else {
        // Should not happen in ValidTile typing; still permit any non-NONE token from template
        const allowedTokenExprs = TOKEN_ORDER.filter((tk) => (template.tokensMap as any)[tk] > 0).map((tk) =>
          tokenVars[i].eq(TOKEN_TO_INT.get(tk)!),
        );
        solver.add(Z3.Or(...allowedTokenExprs));
      }
      // Also pin type to its fixed one
      solver.add(typeVars[i].eq(TILE_TYPE_TO_INT.get(tile.type)!));
    } else if (Tile.isValid(tile) && (tile.type === TileType.Water || tile.type === TileType.Desert)) {
      solver.add(tokenVars[i].eq(TOKEN_NONE));
      solver.add(typeVars[i].eq(TILE_TYPE_TO_INT.get(tile.type)!));
    } else {
      // placeholder or empty — token depends on chosen type
      // If resource → token != NONE and must be one of template tokens; else → token == NONE
      const resourceTypeInts = Tile.resourceTileTypes
        .filter((t) => (template.tileTypesMap as any)[t] > 0)
        .map((t) => TILE_TYPE_TO_INT.get(t as ValidTile["type"])!);

      const nonResourceTypeInts = TILE_TYPE_DOMAIN.filter((tt) => !isResourceType(tt)).map(
        (tt) => TILE_TYPE_TO_INT.get(tt)!,
      );

      const isTypeResource = Z3.Or(...resourceTypeInts.map((v) => typeVars[i].eq(v)));
      const isTypeNonResource = Z3.Or(...nonResourceTypeInts.map((v) => typeVars[i].eq(v)));

      // token == NONE when non-resource (water or desert)
      solver.add(Z3.Or(isTypeResource, isTypeNonResource));
      solver.add(Z3.Implies(isTypeNonResource, tokenVars[i].eq(TOKEN_NONE)));

      // token ∈ allowed template tokens when resource
      const allowedTokenExprs = TOKEN_ORDER.filter((tk) => (template.tokensMap as any)[tk] > 0).map((tk) =>
        tokenVars[i].eq(TOKEN_TO_INT.get(tk)!),
      );
      // If no tokens configured, resource cannot be chosen; counts will guard this. Still keep a guard to avoid empty Or
      if (allowedTokenExprs.length > 0) {
        solver.add(Z3.Implies(isTypeResource, Z3.Or(...allowedTokenExprs)));
      }
    }*/
  }

  // Global count constraints for tile types
  /*for (const tt of TILE_TYPE_DOMAIN) {
    const target = (template.tileTypesMap as any)[tt] ?? 0;
    const ttInt = TILE_TYPE_TO_INT.get(tt)!;
    const indicators = typeVars.map((v) => Z3.If(v.eq(ttInt), Z3.Int.val(1), Z3.Int.val(0)) as any);
    const sum = indicators.reduce((acc, x) => acc.add(x), Z3.Int.val(0));
    solver.add(sum.eq(target));
  }

  // Global count constraints for tokens
  for (const tk of TOKEN_ORDER) {
    const target = template.tokensMap[tk] ?? 0;
    const tkInt = TOKEN_TO_INT.get(tk)!;
    const indicators = tokenVars.map((v) => Z3.If(v.eq(tkInt), Z3.Int.val(1), Z3.Int.val(0)) as any);
    const sum = indicators.reduce((acc, x) => acc.add(x), Z3.Int.val(0));
    solver.add(sum.eq(target));
  }

  // Helper sets and predicates
  const resourceTypeIntsAll = Tile.resourceTileTypes
    .filter((t) => (template.tileTypesMap as any)[t] > 0)
    .map((t) => TILE_TYPE_TO_INT.get(t as ValidTile["type"])!);
  const isRes = (idx: number) => Z3.Or(...resourceTypeIntsAll.map((v) => typeVars[idx].eq(v)));

  // Adjacent constraints
  const neighbors = buildAdjacencyPairs(field);
  for (const [i, j] of neighbors) {
    // No adjacent 6 and 8
    const isHigh = (v: any) => Z3.Or(v.eq(TOKEN_TO_INT.get(Token.Six)!), v.eq(TOKEN_TO_INT.get(Token.Eight)!));
    solver.add(Z3.Not(Z3.And(isHigh(tokenVars[i]), isHigh(tokenVars[j]))));

    // New rules:
    // - Neighbouring tiles cannot have same resource
    solver.add(Z3.Implies(Z3.And(isRes(i), isRes(j)), typeVars[i].neq(typeVars[j])));

    // - Neighbouring tiles cannot have same token value (when both have tokens)
    solver.add(
      Z3.Implies(
        Z3.And(tokenVars[i].neq(TOKEN_NONE), tokenVars[j].neq(TOKEN_NONE)),
        tokenVars[i].neq(tokenVars[j]),
      ),
    );
  }

  // Balance the probabilities over the same resource
  // Compute pip expression from token var
  const pipExpr = (v: any) => {
    // Chain of Ifs mapping token code -> pips
    let expr: any = Z3.Int.val(0);
    for (const tk of TOKEN_ORDER) {
      const tInt = TOKEN_TO_INT.get(tk)!;
      const p = tokenFns.pips(tk);
      expr = Z3.If(v.eq(tInt), Z3.Int.val(p), expr) as any;
    }
    return expr;
  };

  // Sum of pips per resource type
  const resourceTypesPresent = Tile.resourceTileTypes.filter((rt) => (template.tileTypesMap as any)[rt] > 0) as ValidTile["type"][];
  const pipSumByResource = new Map<ValidTile["type"], any>();
  for (const rt of resourceTypesPresent) {
    const rtInt = TILE_TYPE_TO_INT.get(rt)!;
    let sum: any = Z3.Int.val(0);
    for (let i = 0; i < n; i++) {
      const contrib = Z3.If(typeVars[i].eq(rtInt), pipExpr(tokenVars[i]), Z3.Int.val(0)) as any;
      sum = sum.add(contrib);
    }
    pipSumByResource.set(rt, sum);
  }
  const resList = Array.from(pipSumByResource.entries());
  for (let a = 0; a < resList.length; a++) {
    for (let b = a + 1; b < resList.length; b++) {
      const sa = resList[a][1];
      const sb = resList[b][1];
      const diff = sa.sub(sb);
      solver.add(diff.le(1));
      solver.add(diff.ge(-1));
    }
  }

  // Maximum of 11 pips per intersection
  const dirs = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];
  const indexByKey = new Map<string, number>();
  field.tiles.forEach((t, i) => indexByKey.set(`${t.pos.q}:${t.pos.r}`, i));
  const intersectionSet = new Set<string>();
  const intersections: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const p = field.tiles[i].pos;
    for (let k = 0; k < 6; k++) {
      const a = { q: p.q + dirs[k].q, r: p.r + dirs[k].r };
      const bdir = dirs[(k + 5) % 6];
      const b = { q: p.q + bdir.q, r: p.r + bdir.r };
      const j = indexByKey.get(`${a.q}:${a.r}`);
      const l = indexByKey.get(`${b.q}:${b.r}`);
      if (j !== undefined && l !== undefined) {
        const tri = [i, j, l].sort((x, y) => x - y);
        const key = tri.join(":");
        if (!intersectionSet.has(key)) {
          intersectionSet.add(key);
          intersections.push([tri[0], tri[1], tri[2]]);
        }
      }
    }
  }
  for (const [a, b, c] of intersections) {
    const s = pipExpr(tokenVars[a]).add(pipExpr(tokenVars[b])).add(pipExpr(tokenVars[c]));
    solver.add(s.le(11));
  }*/

  console.log("Solver checking");
  const result = await solver.check();
  if (result !== "sat") {
    throw new Error(`Solver returned ${result}`);
  }

  const model = solver.model();
  const tiles: ValidTile[] = field.tiles.map((tile, i) => {
    const tInt = Number((model.get(typeVars[i]) as any).value());
    const type = INT_TO_TILE_TYPE.get(tInt)!;
    const pos = tile.pos;

    if (type === TileType.Water) {
      return { type, pos } as ValidTile;
    }
    if (type === TileType.Desert) {
      return { type, pos } as ValidTile;
    }

    const tkVal = Number((model.get(tokenVars[i]) as any).value());
    const tk = INT_TO_TOKEN.get(tkVal);
    if (!tk) {
      // Defensive: resource must have a token according to constraints
      throw new Error("Model produced resource without token");
    }

    return {
      type: type as any,
      token: tk,
      pos,
    } as ValidTile;
  });

  return { tiles };
}

export const Z3Solver = { solve };
