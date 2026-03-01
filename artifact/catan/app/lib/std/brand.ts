export declare const __brand: unique symbol;
type StringBrand<B extends string> = { readonly [__brand]: B };
type SymbolBrand<B extends symbol> = { readonly [K in B]: true };
type BrandType = symbol | string;
export type Brand<B extends BrandType> = B extends symbol ? SymbolBrand<B> : StringBrand<Extract<B, string>>;
export type Opaque<T, B extends BrandType> = T & Brand<B>;

export type Branded<T, B extends BrandType> = T & Brand<B>;

type OpaqueApi<T, B extends BrandType> = {
  from: (value: T) => Opaque<T, B>;
};

type OpaqueFactory = <T, B extends BrandType>() => OpaqueApi<T, B>;

export const opaque: OpaqueFactory = <T, B extends BrandType>() => ({
  from: (value: T) => value as Opaque<T, B>,
});

export type OpaqueOf<F> = F extends OpaqueApi<infer _T, infer _B> ? ReturnType<F["from"]> : never;
