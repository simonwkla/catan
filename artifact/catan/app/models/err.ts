export type Exception = {
  readonly kind: string;
  readonly message: string;
};

export type UnsolvableError = Exception & {
  readonly kind: "unsolvable";
  readonly type: "unknown" | "unsat";
};
