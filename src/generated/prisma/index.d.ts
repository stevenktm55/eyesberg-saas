
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Shop
 * 
 */
export type Shop = $Result.DefaultSelection<Prisma.$ShopPayload>
/**
 * Model Product
 * 
 */
export type Product = $Result.DefaultSelection<Prisma.$ProductPayload>
/**
 * Model Variant
 * 
 */
export type Variant = $Result.DefaultSelection<Prisma.$VariantPayload>
/**
 * Model Model3D
 * 
 */
export type Model3D = $Result.DefaultSelection<Prisma.$Model3DPayload>
/**
 * Model Design2D
 * 
 */
export type Design2D = $Result.DefaultSelection<Prisma.$Design2DPayload>
/**
 * Model Color
 * 
 */
export type Color = $Result.DefaultSelection<Prisma.$ColorPayload>
/**
 * Model Font
 * 
 */
export type Font = $Result.DefaultSelection<Prisma.$FontPayload>
/**
 * Model Logo
 * 
 */
export type Logo = $Result.DefaultSelection<Prisma.$LogoPayload>
/**
 * Model Configuration
 * 
 */
export type Configuration = $Result.DefaultSelection<Prisma.$ConfigurationPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Shops
 * const shops = await prisma.shop.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Shops
   * const shops = await prisma.shop.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.shop`: Exposes CRUD operations for the **Shop** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Shops
    * const shops = await prisma.shop.findMany()
    * ```
    */
  get shop(): Prisma.ShopDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.product`: Exposes CRUD operations for the **Product** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Products
    * const products = await prisma.product.findMany()
    * ```
    */
  get product(): Prisma.ProductDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.variant`: Exposes CRUD operations for the **Variant** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Variants
    * const variants = await prisma.variant.findMany()
    * ```
    */
  get variant(): Prisma.VariantDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.model3D`: Exposes CRUD operations for the **Model3D** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Model3DS
    * const model3DS = await prisma.model3D.findMany()
    * ```
    */
  get model3D(): Prisma.Model3DDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.design2D`: Exposes CRUD operations for the **Design2D** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Design2DS
    * const design2DS = await prisma.design2D.findMany()
    * ```
    */
  get design2D(): Prisma.Design2DDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.color`: Exposes CRUD operations for the **Color** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Colors
    * const colors = await prisma.color.findMany()
    * ```
    */
  get color(): Prisma.ColorDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.font`: Exposes CRUD operations for the **Font** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Fonts
    * const fonts = await prisma.font.findMany()
    * ```
    */
  get font(): Prisma.FontDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.logo`: Exposes CRUD operations for the **Logo** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Logos
    * const logos = await prisma.logo.findMany()
    * ```
    */
  get logo(): Prisma.LogoDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.configuration`: Exposes CRUD operations for the **Configuration** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Configurations
    * const configurations = await prisma.configuration.findMany()
    * ```
    */
  get configuration(): Prisma.ConfigurationDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.16.2
   * Query Engine version: 1c57fdcd7e44b29b9313256c76699e91c3ac3c43
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Shop: 'Shop',
    Product: 'Product',
    Variant: 'Variant',
    Model3D: 'Model3D',
    Design2D: 'Design2D',
    Color: 'Color',
    Font: 'Font',
    Logo: 'Logo',
    Configuration: 'Configuration'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "shop" | "product" | "variant" | "model3D" | "design2D" | "color" | "font" | "logo" | "configuration"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Shop: {
        payload: Prisma.$ShopPayload<ExtArgs>
        fields: Prisma.ShopFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ShopFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShopPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ShopFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShopPayload>
          }
          findFirst: {
            args: Prisma.ShopFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShopPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ShopFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShopPayload>
          }
          findMany: {
            args: Prisma.ShopFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShopPayload>[]
          }
          create: {
            args: Prisma.ShopCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShopPayload>
          }
          createMany: {
            args: Prisma.ShopCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ShopCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShopPayload>[]
          }
          delete: {
            args: Prisma.ShopDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShopPayload>
          }
          update: {
            args: Prisma.ShopUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShopPayload>
          }
          deleteMany: {
            args: Prisma.ShopDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ShopUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ShopUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShopPayload>[]
          }
          upsert: {
            args: Prisma.ShopUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShopPayload>
          }
          aggregate: {
            args: Prisma.ShopAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateShop>
          }
          groupBy: {
            args: Prisma.ShopGroupByArgs<ExtArgs>
            result: $Utils.Optional<ShopGroupByOutputType>[]
          }
          count: {
            args: Prisma.ShopCountArgs<ExtArgs>
            result: $Utils.Optional<ShopCountAggregateOutputType> | number
          }
        }
      }
      Product: {
        payload: Prisma.$ProductPayload<ExtArgs>
        fields: Prisma.ProductFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProductFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProductFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          findFirst: {
            args: Prisma.ProductFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProductFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          findMany: {
            args: Prisma.ProductFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>[]
          }
          create: {
            args: Prisma.ProductCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          createMany: {
            args: Prisma.ProductCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProductCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>[]
          }
          delete: {
            args: Prisma.ProductDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          update: {
            args: Prisma.ProductUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          deleteMany: {
            args: Prisma.ProductDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProductUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProductUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>[]
          }
          upsert: {
            args: Prisma.ProductUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          aggregate: {
            args: Prisma.ProductAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProduct>
          }
          groupBy: {
            args: Prisma.ProductGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProductGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProductCountArgs<ExtArgs>
            result: $Utils.Optional<ProductCountAggregateOutputType> | number
          }
        }
      }
      Variant: {
        payload: Prisma.$VariantPayload<ExtArgs>
        fields: Prisma.VariantFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VariantFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VariantPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VariantFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VariantPayload>
          }
          findFirst: {
            args: Prisma.VariantFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VariantPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VariantFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VariantPayload>
          }
          findMany: {
            args: Prisma.VariantFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VariantPayload>[]
          }
          create: {
            args: Prisma.VariantCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VariantPayload>
          }
          createMany: {
            args: Prisma.VariantCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VariantCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VariantPayload>[]
          }
          delete: {
            args: Prisma.VariantDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VariantPayload>
          }
          update: {
            args: Prisma.VariantUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VariantPayload>
          }
          deleteMany: {
            args: Prisma.VariantDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VariantUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.VariantUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VariantPayload>[]
          }
          upsert: {
            args: Prisma.VariantUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VariantPayload>
          }
          aggregate: {
            args: Prisma.VariantAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVariant>
          }
          groupBy: {
            args: Prisma.VariantGroupByArgs<ExtArgs>
            result: $Utils.Optional<VariantGroupByOutputType>[]
          }
          count: {
            args: Prisma.VariantCountArgs<ExtArgs>
            result: $Utils.Optional<VariantCountAggregateOutputType> | number
          }
        }
      }
      Model3D: {
        payload: Prisma.$Model3DPayload<ExtArgs>
        fields: Prisma.Model3DFieldRefs
        operations: {
          findUnique: {
            args: Prisma.Model3DFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Model3DPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.Model3DFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Model3DPayload>
          }
          findFirst: {
            args: Prisma.Model3DFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Model3DPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.Model3DFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Model3DPayload>
          }
          findMany: {
            args: Prisma.Model3DFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Model3DPayload>[]
          }
          create: {
            args: Prisma.Model3DCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Model3DPayload>
          }
          createMany: {
            args: Prisma.Model3DCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.Model3DCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Model3DPayload>[]
          }
          delete: {
            args: Prisma.Model3DDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Model3DPayload>
          }
          update: {
            args: Prisma.Model3DUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Model3DPayload>
          }
          deleteMany: {
            args: Prisma.Model3DDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.Model3DUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.Model3DUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Model3DPayload>[]
          }
          upsert: {
            args: Prisma.Model3DUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Model3DPayload>
          }
          aggregate: {
            args: Prisma.Model3DAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateModel3D>
          }
          groupBy: {
            args: Prisma.Model3DGroupByArgs<ExtArgs>
            result: $Utils.Optional<Model3DGroupByOutputType>[]
          }
          count: {
            args: Prisma.Model3DCountArgs<ExtArgs>
            result: $Utils.Optional<Model3DCountAggregateOutputType> | number
          }
        }
      }
      Design2D: {
        payload: Prisma.$Design2DPayload<ExtArgs>
        fields: Prisma.Design2DFieldRefs
        operations: {
          findUnique: {
            args: Prisma.Design2DFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Design2DPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.Design2DFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Design2DPayload>
          }
          findFirst: {
            args: Prisma.Design2DFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Design2DPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.Design2DFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Design2DPayload>
          }
          findMany: {
            args: Prisma.Design2DFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Design2DPayload>[]
          }
          create: {
            args: Prisma.Design2DCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Design2DPayload>
          }
          createMany: {
            args: Prisma.Design2DCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.Design2DCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Design2DPayload>[]
          }
          delete: {
            args: Prisma.Design2DDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Design2DPayload>
          }
          update: {
            args: Prisma.Design2DUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Design2DPayload>
          }
          deleteMany: {
            args: Prisma.Design2DDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.Design2DUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.Design2DUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Design2DPayload>[]
          }
          upsert: {
            args: Prisma.Design2DUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$Design2DPayload>
          }
          aggregate: {
            args: Prisma.Design2DAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDesign2D>
          }
          groupBy: {
            args: Prisma.Design2DGroupByArgs<ExtArgs>
            result: $Utils.Optional<Design2DGroupByOutputType>[]
          }
          count: {
            args: Prisma.Design2DCountArgs<ExtArgs>
            result: $Utils.Optional<Design2DCountAggregateOutputType> | number
          }
        }
      }
      Color: {
        payload: Prisma.$ColorPayload<ExtArgs>
        fields: Prisma.ColorFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ColorFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ColorPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ColorFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ColorPayload>
          }
          findFirst: {
            args: Prisma.ColorFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ColorPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ColorFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ColorPayload>
          }
          findMany: {
            args: Prisma.ColorFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ColorPayload>[]
          }
          create: {
            args: Prisma.ColorCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ColorPayload>
          }
          createMany: {
            args: Prisma.ColorCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ColorCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ColorPayload>[]
          }
          delete: {
            args: Prisma.ColorDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ColorPayload>
          }
          update: {
            args: Prisma.ColorUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ColorPayload>
          }
          deleteMany: {
            args: Prisma.ColorDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ColorUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ColorUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ColorPayload>[]
          }
          upsert: {
            args: Prisma.ColorUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ColorPayload>
          }
          aggregate: {
            args: Prisma.ColorAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateColor>
          }
          groupBy: {
            args: Prisma.ColorGroupByArgs<ExtArgs>
            result: $Utils.Optional<ColorGroupByOutputType>[]
          }
          count: {
            args: Prisma.ColorCountArgs<ExtArgs>
            result: $Utils.Optional<ColorCountAggregateOutputType> | number
          }
        }
      }
      Font: {
        payload: Prisma.$FontPayload<ExtArgs>
        fields: Prisma.FontFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FontFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FontPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FontFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FontPayload>
          }
          findFirst: {
            args: Prisma.FontFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FontPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FontFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FontPayload>
          }
          findMany: {
            args: Prisma.FontFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FontPayload>[]
          }
          create: {
            args: Prisma.FontCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FontPayload>
          }
          createMany: {
            args: Prisma.FontCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FontCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FontPayload>[]
          }
          delete: {
            args: Prisma.FontDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FontPayload>
          }
          update: {
            args: Prisma.FontUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FontPayload>
          }
          deleteMany: {
            args: Prisma.FontDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FontUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.FontUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FontPayload>[]
          }
          upsert: {
            args: Prisma.FontUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FontPayload>
          }
          aggregate: {
            args: Prisma.FontAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFont>
          }
          groupBy: {
            args: Prisma.FontGroupByArgs<ExtArgs>
            result: $Utils.Optional<FontGroupByOutputType>[]
          }
          count: {
            args: Prisma.FontCountArgs<ExtArgs>
            result: $Utils.Optional<FontCountAggregateOutputType> | number
          }
        }
      }
      Logo: {
        payload: Prisma.$LogoPayload<ExtArgs>
        fields: Prisma.LogoFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LogoFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogoPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LogoFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogoPayload>
          }
          findFirst: {
            args: Prisma.LogoFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogoPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LogoFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogoPayload>
          }
          findMany: {
            args: Prisma.LogoFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogoPayload>[]
          }
          create: {
            args: Prisma.LogoCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogoPayload>
          }
          createMany: {
            args: Prisma.LogoCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LogoCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogoPayload>[]
          }
          delete: {
            args: Prisma.LogoDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogoPayload>
          }
          update: {
            args: Prisma.LogoUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogoPayload>
          }
          deleteMany: {
            args: Prisma.LogoDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LogoUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LogoUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogoPayload>[]
          }
          upsert: {
            args: Prisma.LogoUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogoPayload>
          }
          aggregate: {
            args: Prisma.LogoAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLogo>
          }
          groupBy: {
            args: Prisma.LogoGroupByArgs<ExtArgs>
            result: $Utils.Optional<LogoGroupByOutputType>[]
          }
          count: {
            args: Prisma.LogoCountArgs<ExtArgs>
            result: $Utils.Optional<LogoCountAggregateOutputType> | number
          }
        }
      }
      Configuration: {
        payload: Prisma.$ConfigurationPayload<ExtArgs>
        fields: Prisma.ConfigurationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConfigurationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConfigurationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationPayload>
          }
          findFirst: {
            args: Prisma.ConfigurationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConfigurationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationPayload>
          }
          findMany: {
            args: Prisma.ConfigurationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationPayload>[]
          }
          create: {
            args: Prisma.ConfigurationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationPayload>
          }
          createMany: {
            args: Prisma.ConfigurationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ConfigurationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationPayload>[]
          }
          delete: {
            args: Prisma.ConfigurationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationPayload>
          }
          update: {
            args: Prisma.ConfigurationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationPayload>
          }
          deleteMany: {
            args: Prisma.ConfigurationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConfigurationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ConfigurationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationPayload>[]
          }
          upsert: {
            args: Prisma.ConfigurationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConfigurationPayload>
          }
          aggregate: {
            args: Prisma.ConfigurationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConfiguration>
          }
          groupBy: {
            args: Prisma.ConfigurationGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConfigurationGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConfigurationCountArgs<ExtArgs>
            result: $Utils.Optional<ConfigurationCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    shop?: ShopOmit
    product?: ProductOmit
    variant?: VariantOmit
    model3D?: Model3DOmit
    design2D?: Design2DOmit
    color?: ColorOmit
    font?: FontOmit
    logo?: LogoOmit
    configuration?: ConfigurationOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ShopCountOutputType
   */

  export type ShopCountOutputType = {
    products: number
    models3d: number
    designs2d: number
    colors: number
    fonts: number
    logos: number
    configurations: number
  }

  export type ShopCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    products?: boolean | ShopCountOutputTypeCountProductsArgs
    models3d?: boolean | ShopCountOutputTypeCountModels3dArgs
    designs2d?: boolean | ShopCountOutputTypeCountDesigns2dArgs
    colors?: boolean | ShopCountOutputTypeCountColorsArgs
    fonts?: boolean | ShopCountOutputTypeCountFontsArgs
    logos?: boolean | ShopCountOutputTypeCountLogosArgs
    configurations?: boolean | ShopCountOutputTypeCountConfigurationsArgs
  }

  // Custom InputTypes
  /**
   * ShopCountOutputType without action
   */
  export type ShopCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShopCountOutputType
     */
    select?: ShopCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ShopCountOutputType without action
   */
  export type ShopCountOutputTypeCountProductsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProductWhereInput
  }

  /**
   * ShopCountOutputType without action
   */
  export type ShopCountOutputTypeCountModels3dArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: Model3DWhereInput
  }

  /**
   * ShopCountOutputType without action
   */
  export type ShopCountOutputTypeCountDesigns2dArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: Design2DWhereInput
  }

  /**
   * ShopCountOutputType without action
   */
  export type ShopCountOutputTypeCountColorsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ColorWhereInput
  }

  /**
   * ShopCountOutputType without action
   */
  export type ShopCountOutputTypeCountFontsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FontWhereInput
  }

  /**
   * ShopCountOutputType without action
   */
  export type ShopCountOutputTypeCountLogosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LogoWhereInput
  }

  /**
   * ShopCountOutputType without action
   */
  export type ShopCountOutputTypeCountConfigurationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConfigurationWhereInput
  }


  /**
   * Count Type ProductCountOutputType
   */

  export type ProductCountOutputType = {
    variants: number
  }

  export type ProductCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    variants?: boolean | ProductCountOutputTypeCountVariantsArgs
  }

  // Custom InputTypes
  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductCountOutputType
     */
    select?: ProductCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeCountVariantsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VariantWhereInput
  }


  /**
   * Count Type Model3DCountOutputType
   */

  export type Model3DCountOutputType = {
    productsDefaulting: number
  }

  export type Model3DCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    productsDefaulting?: boolean | Model3DCountOutputTypeCountProductsDefaultingArgs
  }

  // Custom InputTypes
  /**
   * Model3DCountOutputType without action
   */
  export type Model3DCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model3DCountOutputType
     */
    select?: Model3DCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * Model3DCountOutputType without action
   */
  export type Model3DCountOutputTypeCountProductsDefaultingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProductWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Shop
   */

  export type AggregateShop = {
    _count: ShopCountAggregateOutputType | null
    _min: ShopMinAggregateOutputType | null
    _max: ShopMaxAggregateOutputType | null
  }

  export type ShopMinAggregateOutputType = {
    id: string | null
    shopDomain: string | null
    shopGid: string | null
    accessToken: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ShopMaxAggregateOutputType = {
    id: string | null
    shopDomain: string | null
    shopGid: string | null
    accessToken: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ShopCountAggregateOutputType = {
    id: number
    shopDomain: number
    shopGid: number
    accessToken: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ShopMinAggregateInputType = {
    id?: true
    shopDomain?: true
    shopGid?: true
    accessToken?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ShopMaxAggregateInputType = {
    id?: true
    shopDomain?: true
    shopGid?: true
    accessToken?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ShopCountAggregateInputType = {
    id?: true
    shopDomain?: true
    shopGid?: true
    accessToken?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ShopAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Shop to aggregate.
     */
    where?: ShopWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Shops to fetch.
     */
    orderBy?: ShopOrderByWithRelationInput | ShopOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ShopWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Shops from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Shops.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Shops
    **/
    _count?: true | ShopCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ShopMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ShopMaxAggregateInputType
  }

  export type GetShopAggregateType<T extends ShopAggregateArgs> = {
        [P in keyof T & keyof AggregateShop]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateShop[P]>
      : GetScalarType<T[P], AggregateShop[P]>
  }




  export type ShopGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ShopWhereInput
    orderBy?: ShopOrderByWithAggregationInput | ShopOrderByWithAggregationInput[]
    by: ShopScalarFieldEnum[] | ShopScalarFieldEnum
    having?: ShopScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ShopCountAggregateInputType | true
    _min?: ShopMinAggregateInputType
    _max?: ShopMaxAggregateInputType
  }

  export type ShopGroupByOutputType = {
    id: string
    shopDomain: string
    shopGid: string | null
    accessToken: string | null
    createdAt: Date
    updatedAt: Date
    _count: ShopCountAggregateOutputType | null
    _min: ShopMinAggregateOutputType | null
    _max: ShopMaxAggregateOutputType | null
  }

  type GetShopGroupByPayload<T extends ShopGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ShopGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ShopGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ShopGroupByOutputType[P]>
            : GetScalarType<T[P], ShopGroupByOutputType[P]>
        }
      >
    >


  export type ShopSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopDomain?: boolean
    shopGid?: boolean
    accessToken?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    products?: boolean | Shop$productsArgs<ExtArgs>
    models3d?: boolean | Shop$models3dArgs<ExtArgs>
    designs2d?: boolean | Shop$designs2dArgs<ExtArgs>
    colors?: boolean | Shop$colorsArgs<ExtArgs>
    fonts?: boolean | Shop$fontsArgs<ExtArgs>
    logos?: boolean | Shop$logosArgs<ExtArgs>
    configurations?: boolean | Shop$configurationsArgs<ExtArgs>
    _count?: boolean | ShopCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["shop"]>

  export type ShopSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopDomain?: boolean
    shopGid?: boolean
    accessToken?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["shop"]>

  export type ShopSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopDomain?: boolean
    shopGid?: boolean
    accessToken?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["shop"]>

  export type ShopSelectScalar = {
    id?: boolean
    shopDomain?: boolean
    shopGid?: boolean
    accessToken?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ShopOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "shopDomain" | "shopGid" | "accessToken" | "createdAt" | "updatedAt", ExtArgs["result"]["shop"]>
  export type ShopInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    products?: boolean | Shop$productsArgs<ExtArgs>
    models3d?: boolean | Shop$models3dArgs<ExtArgs>
    designs2d?: boolean | Shop$designs2dArgs<ExtArgs>
    colors?: boolean | Shop$colorsArgs<ExtArgs>
    fonts?: boolean | Shop$fontsArgs<ExtArgs>
    logos?: boolean | Shop$logosArgs<ExtArgs>
    configurations?: boolean | Shop$configurationsArgs<ExtArgs>
    _count?: boolean | ShopCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ShopIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ShopIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ShopPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Shop"
    objects: {
      products: Prisma.$ProductPayload<ExtArgs>[]
      models3d: Prisma.$Model3DPayload<ExtArgs>[]
      designs2d: Prisma.$Design2DPayload<ExtArgs>[]
      colors: Prisma.$ColorPayload<ExtArgs>[]
      fonts: Prisma.$FontPayload<ExtArgs>[]
      logos: Prisma.$LogoPayload<ExtArgs>[]
      configurations: Prisma.$ConfigurationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      shopDomain: string
      shopGid: string | null
      accessToken: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["shop"]>
    composites: {}
  }

  type ShopGetPayload<S extends boolean | null | undefined | ShopDefaultArgs> = $Result.GetResult<Prisma.$ShopPayload, S>

  type ShopCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ShopFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ShopCountAggregateInputType | true
    }

  export interface ShopDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Shop'], meta: { name: 'Shop' } }
    /**
     * Find zero or one Shop that matches the filter.
     * @param {ShopFindUniqueArgs} args - Arguments to find a Shop
     * @example
     * // Get one Shop
     * const shop = await prisma.shop.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ShopFindUniqueArgs>(args: SelectSubset<T, ShopFindUniqueArgs<ExtArgs>>): Prisma__ShopClient<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Shop that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ShopFindUniqueOrThrowArgs} args - Arguments to find a Shop
     * @example
     * // Get one Shop
     * const shop = await prisma.shop.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ShopFindUniqueOrThrowArgs>(args: SelectSubset<T, ShopFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ShopClient<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Shop that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShopFindFirstArgs} args - Arguments to find a Shop
     * @example
     * // Get one Shop
     * const shop = await prisma.shop.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ShopFindFirstArgs>(args?: SelectSubset<T, ShopFindFirstArgs<ExtArgs>>): Prisma__ShopClient<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Shop that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShopFindFirstOrThrowArgs} args - Arguments to find a Shop
     * @example
     * // Get one Shop
     * const shop = await prisma.shop.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ShopFindFirstOrThrowArgs>(args?: SelectSubset<T, ShopFindFirstOrThrowArgs<ExtArgs>>): Prisma__ShopClient<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Shops that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShopFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Shops
     * const shops = await prisma.shop.findMany()
     * 
     * // Get first 10 Shops
     * const shops = await prisma.shop.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const shopWithIdOnly = await prisma.shop.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ShopFindManyArgs>(args?: SelectSubset<T, ShopFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Shop.
     * @param {ShopCreateArgs} args - Arguments to create a Shop.
     * @example
     * // Create one Shop
     * const Shop = await prisma.shop.create({
     *   data: {
     *     // ... data to create a Shop
     *   }
     * })
     * 
     */
    create<T extends ShopCreateArgs>(args: SelectSubset<T, ShopCreateArgs<ExtArgs>>): Prisma__ShopClient<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Shops.
     * @param {ShopCreateManyArgs} args - Arguments to create many Shops.
     * @example
     * // Create many Shops
     * const shop = await prisma.shop.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ShopCreateManyArgs>(args?: SelectSubset<T, ShopCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Shops and returns the data saved in the database.
     * @param {ShopCreateManyAndReturnArgs} args - Arguments to create many Shops.
     * @example
     * // Create many Shops
     * const shop = await prisma.shop.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Shops and only return the `id`
     * const shopWithIdOnly = await prisma.shop.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ShopCreateManyAndReturnArgs>(args?: SelectSubset<T, ShopCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Shop.
     * @param {ShopDeleteArgs} args - Arguments to delete one Shop.
     * @example
     * // Delete one Shop
     * const Shop = await prisma.shop.delete({
     *   where: {
     *     // ... filter to delete one Shop
     *   }
     * })
     * 
     */
    delete<T extends ShopDeleteArgs>(args: SelectSubset<T, ShopDeleteArgs<ExtArgs>>): Prisma__ShopClient<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Shop.
     * @param {ShopUpdateArgs} args - Arguments to update one Shop.
     * @example
     * // Update one Shop
     * const shop = await prisma.shop.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ShopUpdateArgs>(args: SelectSubset<T, ShopUpdateArgs<ExtArgs>>): Prisma__ShopClient<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Shops.
     * @param {ShopDeleteManyArgs} args - Arguments to filter Shops to delete.
     * @example
     * // Delete a few Shops
     * const { count } = await prisma.shop.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ShopDeleteManyArgs>(args?: SelectSubset<T, ShopDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Shops.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShopUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Shops
     * const shop = await prisma.shop.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ShopUpdateManyArgs>(args: SelectSubset<T, ShopUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Shops and returns the data updated in the database.
     * @param {ShopUpdateManyAndReturnArgs} args - Arguments to update many Shops.
     * @example
     * // Update many Shops
     * const shop = await prisma.shop.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Shops and only return the `id`
     * const shopWithIdOnly = await prisma.shop.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ShopUpdateManyAndReturnArgs>(args: SelectSubset<T, ShopUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Shop.
     * @param {ShopUpsertArgs} args - Arguments to update or create a Shop.
     * @example
     * // Update or create a Shop
     * const shop = await prisma.shop.upsert({
     *   create: {
     *     // ... data to create a Shop
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Shop we want to update
     *   }
     * })
     */
    upsert<T extends ShopUpsertArgs>(args: SelectSubset<T, ShopUpsertArgs<ExtArgs>>): Prisma__ShopClient<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Shops.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShopCountArgs} args - Arguments to filter Shops to count.
     * @example
     * // Count the number of Shops
     * const count = await prisma.shop.count({
     *   where: {
     *     // ... the filter for the Shops we want to count
     *   }
     * })
    **/
    count<T extends ShopCountArgs>(
      args?: Subset<T, ShopCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ShopCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Shop.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShopAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ShopAggregateArgs>(args: Subset<T, ShopAggregateArgs>): Prisma.PrismaPromise<GetShopAggregateType<T>>

    /**
     * Group by Shop.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShopGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ShopGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ShopGroupByArgs['orderBy'] }
        : { orderBy?: ShopGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ShopGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetShopGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Shop model
   */
  readonly fields: ShopFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Shop.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ShopClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    products<T extends Shop$productsArgs<ExtArgs> = {}>(args?: Subset<T, Shop$productsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    models3d<T extends Shop$models3dArgs<ExtArgs> = {}>(args?: Subset<T, Shop$models3dArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$Model3DPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    designs2d<T extends Shop$designs2dArgs<ExtArgs> = {}>(args?: Subset<T, Shop$designs2dArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$Design2DPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    colors<T extends Shop$colorsArgs<ExtArgs> = {}>(args?: Subset<T, Shop$colorsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ColorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    fonts<T extends Shop$fontsArgs<ExtArgs> = {}>(args?: Subset<T, Shop$fontsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FontPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    logos<T extends Shop$logosArgs<ExtArgs> = {}>(args?: Subset<T, Shop$logosArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LogoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    configurations<T extends Shop$configurationsArgs<ExtArgs> = {}>(args?: Subset<T, Shop$configurationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConfigurationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Shop model
   */
  interface ShopFieldRefs {
    readonly id: FieldRef<"Shop", 'String'>
    readonly shopDomain: FieldRef<"Shop", 'String'>
    readonly shopGid: FieldRef<"Shop", 'String'>
    readonly accessToken: FieldRef<"Shop", 'String'>
    readonly createdAt: FieldRef<"Shop", 'DateTime'>
    readonly updatedAt: FieldRef<"Shop", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Shop findUnique
   */
  export type ShopFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Shop
     */
    select?: ShopSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Shop
     */
    omit?: ShopOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShopInclude<ExtArgs> | null
    /**
     * Filter, which Shop to fetch.
     */
    where: ShopWhereUniqueInput
  }

  /**
   * Shop findUniqueOrThrow
   */
  export type ShopFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Shop
     */
    select?: ShopSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Shop
     */
    omit?: ShopOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShopInclude<ExtArgs> | null
    /**
     * Filter, which Shop to fetch.
     */
    where: ShopWhereUniqueInput
  }

  /**
   * Shop findFirst
   */
  export type ShopFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Shop
     */
    select?: ShopSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Shop
     */
    omit?: ShopOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShopInclude<ExtArgs> | null
    /**
     * Filter, which Shop to fetch.
     */
    where?: ShopWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Shops to fetch.
     */
    orderBy?: ShopOrderByWithRelationInput | ShopOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Shops.
     */
    cursor?: ShopWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Shops from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Shops.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Shops.
     */
    distinct?: ShopScalarFieldEnum | ShopScalarFieldEnum[]
  }

  /**
   * Shop findFirstOrThrow
   */
  export type ShopFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Shop
     */
    select?: ShopSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Shop
     */
    omit?: ShopOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShopInclude<ExtArgs> | null
    /**
     * Filter, which Shop to fetch.
     */
    where?: ShopWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Shops to fetch.
     */
    orderBy?: ShopOrderByWithRelationInput | ShopOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Shops.
     */
    cursor?: ShopWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Shops from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Shops.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Shops.
     */
    distinct?: ShopScalarFieldEnum | ShopScalarFieldEnum[]
  }

  /**
   * Shop findMany
   */
  export type ShopFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Shop
     */
    select?: ShopSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Shop
     */
    omit?: ShopOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShopInclude<ExtArgs> | null
    /**
     * Filter, which Shops to fetch.
     */
    where?: ShopWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Shops to fetch.
     */
    orderBy?: ShopOrderByWithRelationInput | ShopOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Shops.
     */
    cursor?: ShopWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Shops from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Shops.
     */
    skip?: number
    distinct?: ShopScalarFieldEnum | ShopScalarFieldEnum[]
  }

  /**
   * Shop create
   */
  export type ShopCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Shop
     */
    select?: ShopSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Shop
     */
    omit?: ShopOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShopInclude<ExtArgs> | null
    /**
     * The data needed to create a Shop.
     */
    data: XOR<ShopCreateInput, ShopUncheckedCreateInput>
  }

  /**
   * Shop createMany
   */
  export type ShopCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Shops.
     */
    data: ShopCreateManyInput | ShopCreateManyInput[]
  }

  /**
   * Shop createManyAndReturn
   */
  export type ShopCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Shop
     */
    select?: ShopSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Shop
     */
    omit?: ShopOmit<ExtArgs> | null
    /**
     * The data used to create many Shops.
     */
    data: ShopCreateManyInput | ShopCreateManyInput[]
  }

  /**
   * Shop update
   */
  export type ShopUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Shop
     */
    select?: ShopSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Shop
     */
    omit?: ShopOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShopInclude<ExtArgs> | null
    /**
     * The data needed to update a Shop.
     */
    data: XOR<ShopUpdateInput, ShopUncheckedUpdateInput>
    /**
     * Choose, which Shop to update.
     */
    where: ShopWhereUniqueInput
  }

  /**
   * Shop updateMany
   */
  export type ShopUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Shops.
     */
    data: XOR<ShopUpdateManyMutationInput, ShopUncheckedUpdateManyInput>
    /**
     * Filter which Shops to update
     */
    where?: ShopWhereInput
    /**
     * Limit how many Shops to update.
     */
    limit?: number
  }

  /**
   * Shop updateManyAndReturn
   */
  export type ShopUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Shop
     */
    select?: ShopSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Shop
     */
    omit?: ShopOmit<ExtArgs> | null
    /**
     * The data used to update Shops.
     */
    data: XOR<ShopUpdateManyMutationInput, ShopUncheckedUpdateManyInput>
    /**
     * Filter which Shops to update
     */
    where?: ShopWhereInput
    /**
     * Limit how many Shops to update.
     */
    limit?: number
  }

  /**
   * Shop upsert
   */
  export type ShopUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Shop
     */
    select?: ShopSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Shop
     */
    omit?: ShopOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShopInclude<ExtArgs> | null
    /**
     * The filter to search for the Shop to update in case it exists.
     */
    where: ShopWhereUniqueInput
    /**
     * In case the Shop found by the `where` argument doesn't exist, create a new Shop with this data.
     */
    create: XOR<ShopCreateInput, ShopUncheckedCreateInput>
    /**
     * In case the Shop was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ShopUpdateInput, ShopUncheckedUpdateInput>
  }

  /**
   * Shop delete
   */
  export type ShopDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Shop
     */
    select?: ShopSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Shop
     */
    omit?: ShopOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShopInclude<ExtArgs> | null
    /**
     * Filter which Shop to delete.
     */
    where: ShopWhereUniqueInput
  }

  /**
   * Shop deleteMany
   */
  export type ShopDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Shops to delete
     */
    where?: ShopWhereInput
    /**
     * Limit how many Shops to delete.
     */
    limit?: number
  }

  /**
   * Shop.products
   */
  export type Shop$productsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    where?: ProductWhereInput
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    cursor?: ProductWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Shop.models3d
   */
  export type Shop$models3dArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model3D
     */
    select?: Model3DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Model3D
     */
    omit?: Model3DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Model3DInclude<ExtArgs> | null
    where?: Model3DWhereInput
    orderBy?: Model3DOrderByWithRelationInput | Model3DOrderByWithRelationInput[]
    cursor?: Model3DWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Model3DScalarFieldEnum | Model3DScalarFieldEnum[]
  }

  /**
   * Shop.designs2d
   */
  export type Shop$designs2dArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Design2D
     */
    select?: Design2DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Design2D
     */
    omit?: Design2DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Design2DInclude<ExtArgs> | null
    where?: Design2DWhereInput
    orderBy?: Design2DOrderByWithRelationInput | Design2DOrderByWithRelationInput[]
    cursor?: Design2DWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Design2DScalarFieldEnum | Design2DScalarFieldEnum[]
  }

  /**
   * Shop.colors
   */
  export type Shop$colorsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Color
     */
    select?: ColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Color
     */
    omit?: ColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ColorInclude<ExtArgs> | null
    where?: ColorWhereInput
    orderBy?: ColorOrderByWithRelationInput | ColorOrderByWithRelationInput[]
    cursor?: ColorWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ColorScalarFieldEnum | ColorScalarFieldEnum[]
  }

  /**
   * Shop.fonts
   */
  export type Shop$fontsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Font
     */
    select?: FontSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Font
     */
    omit?: FontOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FontInclude<ExtArgs> | null
    where?: FontWhereInput
    orderBy?: FontOrderByWithRelationInput | FontOrderByWithRelationInput[]
    cursor?: FontWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FontScalarFieldEnum | FontScalarFieldEnum[]
  }

  /**
   * Shop.logos
   */
  export type Shop$logosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Logo
     */
    select?: LogoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Logo
     */
    omit?: LogoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogoInclude<ExtArgs> | null
    where?: LogoWhereInput
    orderBy?: LogoOrderByWithRelationInput | LogoOrderByWithRelationInput[]
    cursor?: LogoWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LogoScalarFieldEnum | LogoScalarFieldEnum[]
  }

  /**
   * Shop.configurations
   */
  export type Shop$configurationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Configuration
     */
    select?: ConfigurationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Configuration
     */
    omit?: ConfigurationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfigurationInclude<ExtArgs> | null
    where?: ConfigurationWhereInput
    orderBy?: ConfigurationOrderByWithRelationInput | ConfigurationOrderByWithRelationInput[]
    cursor?: ConfigurationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ConfigurationScalarFieldEnum | ConfigurationScalarFieldEnum[]
  }

  /**
   * Shop without action
   */
  export type ShopDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Shop
     */
    select?: ShopSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Shop
     */
    omit?: ShopOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ShopInclude<ExtArgs> | null
  }


  /**
   * Model Product
   */

  export type AggregateProduct = {
    _count: ProductCountAggregateOutputType | null
    _min: ProductMinAggregateOutputType | null
    _max: ProductMaxAggregateOutputType | null
  }

  export type ProductMinAggregateOutputType = {
    id: string | null
    shopId: string | null
    productGid: string | null
    handle: string | null
    defaultModelId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProductMaxAggregateOutputType = {
    id: string | null
    shopId: string | null
    productGid: string | null
    handle: string | null
    defaultModelId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProductCountAggregateOutputType = {
    id: number
    shopId: number
    productGid: number
    handle: number
    defaultModelId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ProductMinAggregateInputType = {
    id?: true
    shopId?: true
    productGid?: true
    handle?: true
    defaultModelId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProductMaxAggregateInputType = {
    id?: true
    shopId?: true
    productGid?: true
    handle?: true
    defaultModelId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProductCountAggregateInputType = {
    id?: true
    shopId?: true
    productGid?: true
    handle?: true
    defaultModelId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ProductAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Product to aggregate.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Products
    **/
    _count?: true | ProductCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProductMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProductMaxAggregateInputType
  }

  export type GetProductAggregateType<T extends ProductAggregateArgs> = {
        [P in keyof T & keyof AggregateProduct]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProduct[P]>
      : GetScalarType<T[P], AggregateProduct[P]>
  }




  export type ProductGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProductWhereInput
    orderBy?: ProductOrderByWithAggregationInput | ProductOrderByWithAggregationInput[]
    by: ProductScalarFieldEnum[] | ProductScalarFieldEnum
    having?: ProductScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProductCountAggregateInputType | true
    _min?: ProductMinAggregateInputType
    _max?: ProductMaxAggregateInputType
  }

  export type ProductGroupByOutputType = {
    id: string
    shopId: string
    productGid: string
    handle: string
    defaultModelId: string | null
    createdAt: Date
    updatedAt: Date
    _count: ProductCountAggregateOutputType | null
    _min: ProductMinAggregateOutputType | null
    _max: ProductMaxAggregateOutputType | null
  }

  type GetProductGroupByPayload<T extends ProductGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProductGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProductGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProductGroupByOutputType[P]>
            : GetScalarType<T[P], ProductGroupByOutputType[P]>
        }
      >
    >


  export type ProductSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    productGid?: boolean
    handle?: boolean
    defaultModelId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    defaultModel?: boolean | Product$defaultModelArgs<ExtArgs>
    shop?: boolean | ShopDefaultArgs<ExtArgs>
    variants?: boolean | Product$variantsArgs<ExtArgs>
    _count?: boolean | ProductCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["product"]>

  export type ProductSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    productGid?: boolean
    handle?: boolean
    defaultModelId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    defaultModel?: boolean | Product$defaultModelArgs<ExtArgs>
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["product"]>

  export type ProductSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    productGid?: boolean
    handle?: boolean
    defaultModelId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    defaultModel?: boolean | Product$defaultModelArgs<ExtArgs>
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["product"]>

  export type ProductSelectScalar = {
    id?: boolean
    shopId?: boolean
    productGid?: boolean
    handle?: boolean
    defaultModelId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ProductOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "shopId" | "productGid" | "handle" | "defaultModelId" | "createdAt" | "updatedAt", ExtArgs["result"]["product"]>
  export type ProductInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    defaultModel?: boolean | Product$defaultModelArgs<ExtArgs>
    shop?: boolean | ShopDefaultArgs<ExtArgs>
    variants?: boolean | Product$variantsArgs<ExtArgs>
    _count?: boolean | ProductCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ProductIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    defaultModel?: boolean | Product$defaultModelArgs<ExtArgs>
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }
  export type ProductIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    defaultModel?: boolean | Product$defaultModelArgs<ExtArgs>
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }

  export type $ProductPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Product"
    objects: {
      defaultModel: Prisma.$Model3DPayload<ExtArgs> | null
      shop: Prisma.$ShopPayload<ExtArgs>
      variants: Prisma.$VariantPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      shopId: string
      productGid: string
      handle: string
      defaultModelId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["product"]>
    composites: {}
  }

  type ProductGetPayload<S extends boolean | null | undefined | ProductDefaultArgs> = $Result.GetResult<Prisma.$ProductPayload, S>

  type ProductCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProductFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProductCountAggregateInputType | true
    }

  export interface ProductDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Product'], meta: { name: 'Product' } }
    /**
     * Find zero or one Product that matches the filter.
     * @param {ProductFindUniqueArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProductFindUniqueArgs>(args: SelectSubset<T, ProductFindUniqueArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Product that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProductFindUniqueOrThrowArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProductFindUniqueOrThrowArgs>(args: SelectSubset<T, ProductFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Product that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindFirstArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProductFindFirstArgs>(args?: SelectSubset<T, ProductFindFirstArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Product that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindFirstOrThrowArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProductFindFirstOrThrowArgs>(args?: SelectSubset<T, ProductFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Products that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Products
     * const products = await prisma.product.findMany()
     * 
     * // Get first 10 Products
     * const products = await prisma.product.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const productWithIdOnly = await prisma.product.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProductFindManyArgs>(args?: SelectSubset<T, ProductFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Product.
     * @param {ProductCreateArgs} args - Arguments to create a Product.
     * @example
     * // Create one Product
     * const Product = await prisma.product.create({
     *   data: {
     *     // ... data to create a Product
     *   }
     * })
     * 
     */
    create<T extends ProductCreateArgs>(args: SelectSubset<T, ProductCreateArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Products.
     * @param {ProductCreateManyArgs} args - Arguments to create many Products.
     * @example
     * // Create many Products
     * const product = await prisma.product.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProductCreateManyArgs>(args?: SelectSubset<T, ProductCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Products and returns the data saved in the database.
     * @param {ProductCreateManyAndReturnArgs} args - Arguments to create many Products.
     * @example
     * // Create many Products
     * const product = await prisma.product.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Products and only return the `id`
     * const productWithIdOnly = await prisma.product.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProductCreateManyAndReturnArgs>(args?: SelectSubset<T, ProductCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Product.
     * @param {ProductDeleteArgs} args - Arguments to delete one Product.
     * @example
     * // Delete one Product
     * const Product = await prisma.product.delete({
     *   where: {
     *     // ... filter to delete one Product
     *   }
     * })
     * 
     */
    delete<T extends ProductDeleteArgs>(args: SelectSubset<T, ProductDeleteArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Product.
     * @param {ProductUpdateArgs} args - Arguments to update one Product.
     * @example
     * // Update one Product
     * const product = await prisma.product.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProductUpdateArgs>(args: SelectSubset<T, ProductUpdateArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Products.
     * @param {ProductDeleteManyArgs} args - Arguments to filter Products to delete.
     * @example
     * // Delete a few Products
     * const { count } = await prisma.product.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProductDeleteManyArgs>(args?: SelectSubset<T, ProductDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Products.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Products
     * const product = await prisma.product.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProductUpdateManyArgs>(args: SelectSubset<T, ProductUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Products and returns the data updated in the database.
     * @param {ProductUpdateManyAndReturnArgs} args - Arguments to update many Products.
     * @example
     * // Update many Products
     * const product = await prisma.product.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Products and only return the `id`
     * const productWithIdOnly = await prisma.product.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProductUpdateManyAndReturnArgs>(args: SelectSubset<T, ProductUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Product.
     * @param {ProductUpsertArgs} args - Arguments to update or create a Product.
     * @example
     * // Update or create a Product
     * const product = await prisma.product.upsert({
     *   create: {
     *     // ... data to create a Product
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Product we want to update
     *   }
     * })
     */
    upsert<T extends ProductUpsertArgs>(args: SelectSubset<T, ProductUpsertArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Products.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductCountArgs} args - Arguments to filter Products to count.
     * @example
     * // Count the number of Products
     * const count = await prisma.product.count({
     *   where: {
     *     // ... the filter for the Products we want to count
     *   }
     * })
    **/
    count<T extends ProductCountArgs>(
      args?: Subset<T, ProductCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProductCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Product.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProductAggregateArgs>(args: Subset<T, ProductAggregateArgs>): Prisma.PrismaPromise<GetProductAggregateType<T>>

    /**
     * Group by Product.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProductGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProductGroupByArgs['orderBy'] }
        : { orderBy?: ProductGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProductGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProductGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Product model
   */
  readonly fields: ProductFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Product.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProductClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    defaultModel<T extends Product$defaultModelArgs<ExtArgs> = {}>(args?: Subset<T, Product$defaultModelArgs<ExtArgs>>): Prisma__Model3DClient<$Result.GetResult<Prisma.$Model3DPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    shop<T extends ShopDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ShopDefaultArgs<ExtArgs>>): Prisma__ShopClient<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    variants<T extends Product$variantsArgs<ExtArgs> = {}>(args?: Subset<T, Product$variantsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VariantPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Product model
   */
  interface ProductFieldRefs {
    readonly id: FieldRef<"Product", 'String'>
    readonly shopId: FieldRef<"Product", 'String'>
    readonly productGid: FieldRef<"Product", 'String'>
    readonly handle: FieldRef<"Product", 'String'>
    readonly defaultModelId: FieldRef<"Product", 'String'>
    readonly createdAt: FieldRef<"Product", 'DateTime'>
    readonly updatedAt: FieldRef<"Product", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Product findUnique
   */
  export type ProductFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product findUniqueOrThrow
   */
  export type ProductFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product findFirst
   */
  export type ProductFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Products.
     */
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product findFirstOrThrow
   */
  export type ProductFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Products.
     */
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product findMany
   */
  export type ProductFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Products to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product create
   */
  export type ProductCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * The data needed to create a Product.
     */
    data: XOR<ProductCreateInput, ProductUncheckedCreateInput>
  }

  /**
   * Product createMany
   */
  export type ProductCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Products.
     */
    data: ProductCreateManyInput | ProductCreateManyInput[]
  }

  /**
   * Product createManyAndReturn
   */
  export type ProductCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * The data used to create many Products.
     */
    data: ProductCreateManyInput | ProductCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Product update
   */
  export type ProductUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * The data needed to update a Product.
     */
    data: XOR<ProductUpdateInput, ProductUncheckedUpdateInput>
    /**
     * Choose, which Product to update.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product updateMany
   */
  export type ProductUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Products.
     */
    data: XOR<ProductUpdateManyMutationInput, ProductUncheckedUpdateManyInput>
    /**
     * Filter which Products to update
     */
    where?: ProductWhereInput
    /**
     * Limit how many Products to update.
     */
    limit?: number
  }

  /**
   * Product updateManyAndReturn
   */
  export type ProductUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * The data used to update Products.
     */
    data: XOR<ProductUpdateManyMutationInput, ProductUncheckedUpdateManyInput>
    /**
     * Filter which Products to update
     */
    where?: ProductWhereInput
    /**
     * Limit how many Products to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Product upsert
   */
  export type ProductUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * The filter to search for the Product to update in case it exists.
     */
    where: ProductWhereUniqueInput
    /**
     * In case the Product found by the `where` argument doesn't exist, create a new Product with this data.
     */
    create: XOR<ProductCreateInput, ProductUncheckedCreateInput>
    /**
     * In case the Product was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProductUpdateInput, ProductUncheckedUpdateInput>
  }

  /**
   * Product delete
   */
  export type ProductDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter which Product to delete.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product deleteMany
   */
  export type ProductDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Products to delete
     */
    where?: ProductWhereInput
    /**
     * Limit how many Products to delete.
     */
    limit?: number
  }

  /**
   * Product.defaultModel
   */
  export type Product$defaultModelArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model3D
     */
    select?: Model3DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Model3D
     */
    omit?: Model3DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Model3DInclude<ExtArgs> | null
    where?: Model3DWhereInput
  }

  /**
   * Product.variants
   */
  export type Product$variantsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Variant
     */
    select?: VariantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Variant
     */
    omit?: VariantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VariantInclude<ExtArgs> | null
    where?: VariantWhereInput
    orderBy?: VariantOrderByWithRelationInput | VariantOrderByWithRelationInput[]
    cursor?: VariantWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VariantScalarFieldEnum | VariantScalarFieldEnum[]
  }

  /**
   * Product without action
   */
  export type ProductDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
  }


  /**
   * Model Variant
   */

  export type AggregateVariant = {
    _count: VariantCountAggregateOutputType | null
    _min: VariantMinAggregateOutputType | null
    _max: VariantMaxAggregateOutputType | null
  }

  export type VariantMinAggregateOutputType = {
    id: string | null
    productId: string | null
    variantGid: string | null
    presetId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VariantMaxAggregateOutputType = {
    id: string | null
    productId: string | null
    variantGid: string | null
    presetId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VariantCountAggregateOutputType = {
    id: number
    productId: number
    variantGid: number
    presetId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type VariantMinAggregateInputType = {
    id?: true
    productId?: true
    variantGid?: true
    presetId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VariantMaxAggregateInputType = {
    id?: true
    productId?: true
    variantGid?: true
    presetId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VariantCountAggregateInputType = {
    id?: true
    productId?: true
    variantGid?: true
    presetId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type VariantAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Variant to aggregate.
     */
    where?: VariantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Variants to fetch.
     */
    orderBy?: VariantOrderByWithRelationInput | VariantOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VariantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Variants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Variants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Variants
    **/
    _count?: true | VariantCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VariantMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VariantMaxAggregateInputType
  }

  export type GetVariantAggregateType<T extends VariantAggregateArgs> = {
        [P in keyof T & keyof AggregateVariant]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVariant[P]>
      : GetScalarType<T[P], AggregateVariant[P]>
  }




  export type VariantGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VariantWhereInput
    orderBy?: VariantOrderByWithAggregationInput | VariantOrderByWithAggregationInput[]
    by: VariantScalarFieldEnum[] | VariantScalarFieldEnum
    having?: VariantScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VariantCountAggregateInputType | true
    _min?: VariantMinAggregateInputType
    _max?: VariantMaxAggregateInputType
  }

  export type VariantGroupByOutputType = {
    id: string
    productId: string
    variantGid: string
    presetId: string | null
    createdAt: Date
    updatedAt: Date
    _count: VariantCountAggregateOutputType | null
    _min: VariantMinAggregateOutputType | null
    _max: VariantMaxAggregateOutputType | null
  }

  type GetVariantGroupByPayload<T extends VariantGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VariantGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VariantGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VariantGroupByOutputType[P]>
            : GetScalarType<T[P], VariantGroupByOutputType[P]>
        }
      >
    >


  export type VariantSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    variantGid?: boolean
    presetId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["variant"]>

  export type VariantSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    variantGid?: boolean
    presetId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["variant"]>

  export type VariantSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    variantGid?: boolean
    presetId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["variant"]>

  export type VariantSelectScalar = {
    id?: boolean
    productId?: boolean
    variantGid?: boolean
    presetId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type VariantOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "productId" | "variantGid" | "presetId" | "createdAt" | "updatedAt", ExtArgs["result"]["variant"]>
  export type VariantInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }
  export type VariantIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }
  export type VariantIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }

  export type $VariantPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Variant"
    objects: {
      product: Prisma.$ProductPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      productId: string
      variantGid: string
      presetId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["variant"]>
    composites: {}
  }

  type VariantGetPayload<S extends boolean | null | undefined | VariantDefaultArgs> = $Result.GetResult<Prisma.$VariantPayload, S>

  type VariantCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<VariantFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: VariantCountAggregateInputType | true
    }

  export interface VariantDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Variant'], meta: { name: 'Variant' } }
    /**
     * Find zero or one Variant that matches the filter.
     * @param {VariantFindUniqueArgs} args - Arguments to find a Variant
     * @example
     * // Get one Variant
     * const variant = await prisma.variant.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VariantFindUniqueArgs>(args: SelectSubset<T, VariantFindUniqueArgs<ExtArgs>>): Prisma__VariantClient<$Result.GetResult<Prisma.$VariantPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Variant that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {VariantFindUniqueOrThrowArgs} args - Arguments to find a Variant
     * @example
     * // Get one Variant
     * const variant = await prisma.variant.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VariantFindUniqueOrThrowArgs>(args: SelectSubset<T, VariantFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VariantClient<$Result.GetResult<Prisma.$VariantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Variant that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VariantFindFirstArgs} args - Arguments to find a Variant
     * @example
     * // Get one Variant
     * const variant = await prisma.variant.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VariantFindFirstArgs>(args?: SelectSubset<T, VariantFindFirstArgs<ExtArgs>>): Prisma__VariantClient<$Result.GetResult<Prisma.$VariantPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Variant that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VariantFindFirstOrThrowArgs} args - Arguments to find a Variant
     * @example
     * // Get one Variant
     * const variant = await prisma.variant.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VariantFindFirstOrThrowArgs>(args?: SelectSubset<T, VariantFindFirstOrThrowArgs<ExtArgs>>): Prisma__VariantClient<$Result.GetResult<Prisma.$VariantPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Variants that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VariantFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Variants
     * const variants = await prisma.variant.findMany()
     * 
     * // Get first 10 Variants
     * const variants = await prisma.variant.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const variantWithIdOnly = await prisma.variant.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VariantFindManyArgs>(args?: SelectSubset<T, VariantFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VariantPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Variant.
     * @param {VariantCreateArgs} args - Arguments to create a Variant.
     * @example
     * // Create one Variant
     * const Variant = await prisma.variant.create({
     *   data: {
     *     // ... data to create a Variant
     *   }
     * })
     * 
     */
    create<T extends VariantCreateArgs>(args: SelectSubset<T, VariantCreateArgs<ExtArgs>>): Prisma__VariantClient<$Result.GetResult<Prisma.$VariantPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Variants.
     * @param {VariantCreateManyArgs} args - Arguments to create many Variants.
     * @example
     * // Create many Variants
     * const variant = await prisma.variant.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VariantCreateManyArgs>(args?: SelectSubset<T, VariantCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Variants and returns the data saved in the database.
     * @param {VariantCreateManyAndReturnArgs} args - Arguments to create many Variants.
     * @example
     * // Create many Variants
     * const variant = await prisma.variant.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Variants and only return the `id`
     * const variantWithIdOnly = await prisma.variant.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VariantCreateManyAndReturnArgs>(args?: SelectSubset<T, VariantCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VariantPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Variant.
     * @param {VariantDeleteArgs} args - Arguments to delete one Variant.
     * @example
     * // Delete one Variant
     * const Variant = await prisma.variant.delete({
     *   where: {
     *     // ... filter to delete one Variant
     *   }
     * })
     * 
     */
    delete<T extends VariantDeleteArgs>(args: SelectSubset<T, VariantDeleteArgs<ExtArgs>>): Prisma__VariantClient<$Result.GetResult<Prisma.$VariantPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Variant.
     * @param {VariantUpdateArgs} args - Arguments to update one Variant.
     * @example
     * // Update one Variant
     * const variant = await prisma.variant.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VariantUpdateArgs>(args: SelectSubset<T, VariantUpdateArgs<ExtArgs>>): Prisma__VariantClient<$Result.GetResult<Prisma.$VariantPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Variants.
     * @param {VariantDeleteManyArgs} args - Arguments to filter Variants to delete.
     * @example
     * // Delete a few Variants
     * const { count } = await prisma.variant.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VariantDeleteManyArgs>(args?: SelectSubset<T, VariantDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Variants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VariantUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Variants
     * const variant = await prisma.variant.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VariantUpdateManyArgs>(args: SelectSubset<T, VariantUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Variants and returns the data updated in the database.
     * @param {VariantUpdateManyAndReturnArgs} args - Arguments to update many Variants.
     * @example
     * // Update many Variants
     * const variant = await prisma.variant.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Variants and only return the `id`
     * const variantWithIdOnly = await prisma.variant.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends VariantUpdateManyAndReturnArgs>(args: SelectSubset<T, VariantUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VariantPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Variant.
     * @param {VariantUpsertArgs} args - Arguments to update or create a Variant.
     * @example
     * // Update or create a Variant
     * const variant = await prisma.variant.upsert({
     *   create: {
     *     // ... data to create a Variant
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Variant we want to update
     *   }
     * })
     */
    upsert<T extends VariantUpsertArgs>(args: SelectSubset<T, VariantUpsertArgs<ExtArgs>>): Prisma__VariantClient<$Result.GetResult<Prisma.$VariantPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Variants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VariantCountArgs} args - Arguments to filter Variants to count.
     * @example
     * // Count the number of Variants
     * const count = await prisma.variant.count({
     *   where: {
     *     // ... the filter for the Variants we want to count
     *   }
     * })
    **/
    count<T extends VariantCountArgs>(
      args?: Subset<T, VariantCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VariantCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Variant.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VariantAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VariantAggregateArgs>(args: Subset<T, VariantAggregateArgs>): Prisma.PrismaPromise<GetVariantAggregateType<T>>

    /**
     * Group by Variant.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VariantGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VariantGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VariantGroupByArgs['orderBy'] }
        : { orderBy?: VariantGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VariantGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVariantGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Variant model
   */
  readonly fields: VariantFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Variant.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VariantClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    product<T extends ProductDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProductDefaultArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Variant model
   */
  interface VariantFieldRefs {
    readonly id: FieldRef<"Variant", 'String'>
    readonly productId: FieldRef<"Variant", 'String'>
    readonly variantGid: FieldRef<"Variant", 'String'>
    readonly presetId: FieldRef<"Variant", 'String'>
    readonly createdAt: FieldRef<"Variant", 'DateTime'>
    readonly updatedAt: FieldRef<"Variant", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Variant findUnique
   */
  export type VariantFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Variant
     */
    select?: VariantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Variant
     */
    omit?: VariantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VariantInclude<ExtArgs> | null
    /**
     * Filter, which Variant to fetch.
     */
    where: VariantWhereUniqueInput
  }

  /**
   * Variant findUniqueOrThrow
   */
  export type VariantFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Variant
     */
    select?: VariantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Variant
     */
    omit?: VariantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VariantInclude<ExtArgs> | null
    /**
     * Filter, which Variant to fetch.
     */
    where: VariantWhereUniqueInput
  }

  /**
   * Variant findFirst
   */
  export type VariantFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Variant
     */
    select?: VariantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Variant
     */
    omit?: VariantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VariantInclude<ExtArgs> | null
    /**
     * Filter, which Variant to fetch.
     */
    where?: VariantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Variants to fetch.
     */
    orderBy?: VariantOrderByWithRelationInput | VariantOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Variants.
     */
    cursor?: VariantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Variants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Variants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Variants.
     */
    distinct?: VariantScalarFieldEnum | VariantScalarFieldEnum[]
  }

  /**
   * Variant findFirstOrThrow
   */
  export type VariantFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Variant
     */
    select?: VariantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Variant
     */
    omit?: VariantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VariantInclude<ExtArgs> | null
    /**
     * Filter, which Variant to fetch.
     */
    where?: VariantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Variants to fetch.
     */
    orderBy?: VariantOrderByWithRelationInput | VariantOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Variants.
     */
    cursor?: VariantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Variants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Variants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Variants.
     */
    distinct?: VariantScalarFieldEnum | VariantScalarFieldEnum[]
  }

  /**
   * Variant findMany
   */
  export type VariantFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Variant
     */
    select?: VariantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Variant
     */
    omit?: VariantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VariantInclude<ExtArgs> | null
    /**
     * Filter, which Variants to fetch.
     */
    where?: VariantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Variants to fetch.
     */
    orderBy?: VariantOrderByWithRelationInput | VariantOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Variants.
     */
    cursor?: VariantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Variants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Variants.
     */
    skip?: number
    distinct?: VariantScalarFieldEnum | VariantScalarFieldEnum[]
  }

  /**
   * Variant create
   */
  export type VariantCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Variant
     */
    select?: VariantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Variant
     */
    omit?: VariantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VariantInclude<ExtArgs> | null
    /**
     * The data needed to create a Variant.
     */
    data: XOR<VariantCreateInput, VariantUncheckedCreateInput>
  }

  /**
   * Variant createMany
   */
  export type VariantCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Variants.
     */
    data: VariantCreateManyInput | VariantCreateManyInput[]
  }

  /**
   * Variant createManyAndReturn
   */
  export type VariantCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Variant
     */
    select?: VariantSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Variant
     */
    omit?: VariantOmit<ExtArgs> | null
    /**
     * The data used to create many Variants.
     */
    data: VariantCreateManyInput | VariantCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VariantIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Variant update
   */
  export type VariantUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Variant
     */
    select?: VariantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Variant
     */
    omit?: VariantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VariantInclude<ExtArgs> | null
    /**
     * The data needed to update a Variant.
     */
    data: XOR<VariantUpdateInput, VariantUncheckedUpdateInput>
    /**
     * Choose, which Variant to update.
     */
    where: VariantWhereUniqueInput
  }

  /**
   * Variant updateMany
   */
  export type VariantUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Variants.
     */
    data: XOR<VariantUpdateManyMutationInput, VariantUncheckedUpdateManyInput>
    /**
     * Filter which Variants to update
     */
    where?: VariantWhereInput
    /**
     * Limit how many Variants to update.
     */
    limit?: number
  }

  /**
   * Variant updateManyAndReturn
   */
  export type VariantUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Variant
     */
    select?: VariantSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Variant
     */
    omit?: VariantOmit<ExtArgs> | null
    /**
     * The data used to update Variants.
     */
    data: XOR<VariantUpdateManyMutationInput, VariantUncheckedUpdateManyInput>
    /**
     * Filter which Variants to update
     */
    where?: VariantWhereInput
    /**
     * Limit how many Variants to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VariantIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Variant upsert
   */
  export type VariantUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Variant
     */
    select?: VariantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Variant
     */
    omit?: VariantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VariantInclude<ExtArgs> | null
    /**
     * The filter to search for the Variant to update in case it exists.
     */
    where: VariantWhereUniqueInput
    /**
     * In case the Variant found by the `where` argument doesn't exist, create a new Variant with this data.
     */
    create: XOR<VariantCreateInput, VariantUncheckedCreateInput>
    /**
     * In case the Variant was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VariantUpdateInput, VariantUncheckedUpdateInput>
  }

  /**
   * Variant delete
   */
  export type VariantDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Variant
     */
    select?: VariantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Variant
     */
    omit?: VariantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VariantInclude<ExtArgs> | null
    /**
     * Filter which Variant to delete.
     */
    where: VariantWhereUniqueInput
  }

  /**
   * Variant deleteMany
   */
  export type VariantDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Variants to delete
     */
    where?: VariantWhereInput
    /**
     * Limit how many Variants to delete.
     */
    limit?: number
  }

  /**
   * Variant without action
   */
  export type VariantDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Variant
     */
    select?: VariantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Variant
     */
    omit?: VariantOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VariantInclude<ExtArgs> | null
  }


  /**
   * Model Model3D
   */

  export type AggregateModel3D = {
    _count: Model3DCountAggregateOutputType | null
    _min: Model3DMinAggregateOutputType | null
    _max: Model3DMaxAggregateOutputType | null
  }

  export type Model3DMinAggregateOutputType = {
    id: string | null
    shopId: string | null
    name: string | null
    glbUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type Model3DMaxAggregateOutputType = {
    id: string | null
    shopId: string | null
    name: string | null
    glbUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type Model3DCountAggregateOutputType = {
    id: number
    shopId: number
    name: number
    glbUrl: number
    materialsSchema: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type Model3DMinAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    glbUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type Model3DMaxAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    glbUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type Model3DCountAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    glbUrl?: true
    materialsSchema?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type Model3DAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Model3D to aggregate.
     */
    where?: Model3DWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Model3DS to fetch.
     */
    orderBy?: Model3DOrderByWithRelationInput | Model3DOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: Model3DWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Model3DS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Model3DS.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Model3DS
    **/
    _count?: true | Model3DCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Model3DMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Model3DMaxAggregateInputType
  }

  export type GetModel3DAggregateType<T extends Model3DAggregateArgs> = {
        [P in keyof T & keyof AggregateModel3D]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateModel3D[P]>
      : GetScalarType<T[P], AggregateModel3D[P]>
  }




  export type Model3DGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: Model3DWhereInput
    orderBy?: Model3DOrderByWithAggregationInput | Model3DOrderByWithAggregationInput[]
    by: Model3DScalarFieldEnum[] | Model3DScalarFieldEnum
    having?: Model3DScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Model3DCountAggregateInputType | true
    _min?: Model3DMinAggregateInputType
    _max?: Model3DMaxAggregateInputType
  }

  export type Model3DGroupByOutputType = {
    id: string
    shopId: string
    name: string
    glbUrl: string
    materialsSchema: JsonValue
    createdAt: Date
    updatedAt: Date
    _count: Model3DCountAggregateOutputType | null
    _min: Model3DMinAggregateOutputType | null
    _max: Model3DMaxAggregateOutputType | null
  }

  type GetModel3DGroupByPayload<T extends Model3DGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Model3DGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Model3DGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Model3DGroupByOutputType[P]>
            : GetScalarType<T[P], Model3DGroupByOutputType[P]>
        }
      >
    >


  export type Model3DSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    glbUrl?: boolean
    materialsSchema?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
    productsDefaulting?: boolean | Model3D$productsDefaultingArgs<ExtArgs>
    _count?: boolean | Model3DCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["model3D"]>

  export type Model3DSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    glbUrl?: boolean
    materialsSchema?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["model3D"]>

  export type Model3DSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    glbUrl?: boolean
    materialsSchema?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["model3D"]>

  export type Model3DSelectScalar = {
    id?: boolean
    shopId?: boolean
    name?: boolean
    glbUrl?: boolean
    materialsSchema?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type Model3DOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "shopId" | "name" | "glbUrl" | "materialsSchema" | "createdAt" | "updatedAt", ExtArgs["result"]["model3D"]>
  export type Model3DInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
    productsDefaulting?: boolean | Model3D$productsDefaultingArgs<ExtArgs>
    _count?: boolean | Model3DCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type Model3DIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }
  export type Model3DIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }

  export type $Model3DPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Model3D"
    objects: {
      shop: Prisma.$ShopPayload<ExtArgs>
      productsDefaulting: Prisma.$ProductPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      shopId: string
      name: string
      glbUrl: string
      materialsSchema: Prisma.JsonValue
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["model3D"]>
    composites: {}
  }

  type Model3DGetPayload<S extends boolean | null | undefined | Model3DDefaultArgs> = $Result.GetResult<Prisma.$Model3DPayload, S>

  type Model3DCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<Model3DFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Model3DCountAggregateInputType | true
    }

  export interface Model3DDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Model3D'], meta: { name: 'Model3D' } }
    /**
     * Find zero or one Model3D that matches the filter.
     * @param {Model3DFindUniqueArgs} args - Arguments to find a Model3D
     * @example
     * // Get one Model3D
     * const model3D = await prisma.model3D.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends Model3DFindUniqueArgs>(args: SelectSubset<T, Model3DFindUniqueArgs<ExtArgs>>): Prisma__Model3DClient<$Result.GetResult<Prisma.$Model3DPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Model3D that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {Model3DFindUniqueOrThrowArgs} args - Arguments to find a Model3D
     * @example
     * // Get one Model3D
     * const model3D = await prisma.model3D.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends Model3DFindUniqueOrThrowArgs>(args: SelectSubset<T, Model3DFindUniqueOrThrowArgs<ExtArgs>>): Prisma__Model3DClient<$Result.GetResult<Prisma.$Model3DPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Model3D that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Model3DFindFirstArgs} args - Arguments to find a Model3D
     * @example
     * // Get one Model3D
     * const model3D = await prisma.model3D.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends Model3DFindFirstArgs>(args?: SelectSubset<T, Model3DFindFirstArgs<ExtArgs>>): Prisma__Model3DClient<$Result.GetResult<Prisma.$Model3DPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Model3D that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Model3DFindFirstOrThrowArgs} args - Arguments to find a Model3D
     * @example
     * // Get one Model3D
     * const model3D = await prisma.model3D.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends Model3DFindFirstOrThrowArgs>(args?: SelectSubset<T, Model3DFindFirstOrThrowArgs<ExtArgs>>): Prisma__Model3DClient<$Result.GetResult<Prisma.$Model3DPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Model3DS that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Model3DFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Model3DS
     * const model3DS = await prisma.model3D.findMany()
     * 
     * // Get first 10 Model3DS
     * const model3DS = await prisma.model3D.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const model3DWithIdOnly = await prisma.model3D.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends Model3DFindManyArgs>(args?: SelectSubset<T, Model3DFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$Model3DPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Model3D.
     * @param {Model3DCreateArgs} args - Arguments to create a Model3D.
     * @example
     * // Create one Model3D
     * const Model3D = await prisma.model3D.create({
     *   data: {
     *     // ... data to create a Model3D
     *   }
     * })
     * 
     */
    create<T extends Model3DCreateArgs>(args: SelectSubset<T, Model3DCreateArgs<ExtArgs>>): Prisma__Model3DClient<$Result.GetResult<Prisma.$Model3DPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Model3DS.
     * @param {Model3DCreateManyArgs} args - Arguments to create many Model3DS.
     * @example
     * // Create many Model3DS
     * const model3D = await prisma.model3D.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends Model3DCreateManyArgs>(args?: SelectSubset<T, Model3DCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Model3DS and returns the data saved in the database.
     * @param {Model3DCreateManyAndReturnArgs} args - Arguments to create many Model3DS.
     * @example
     * // Create many Model3DS
     * const model3D = await prisma.model3D.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Model3DS and only return the `id`
     * const model3DWithIdOnly = await prisma.model3D.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends Model3DCreateManyAndReturnArgs>(args?: SelectSubset<T, Model3DCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$Model3DPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Model3D.
     * @param {Model3DDeleteArgs} args - Arguments to delete one Model3D.
     * @example
     * // Delete one Model3D
     * const Model3D = await prisma.model3D.delete({
     *   where: {
     *     // ... filter to delete one Model3D
     *   }
     * })
     * 
     */
    delete<T extends Model3DDeleteArgs>(args: SelectSubset<T, Model3DDeleteArgs<ExtArgs>>): Prisma__Model3DClient<$Result.GetResult<Prisma.$Model3DPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Model3D.
     * @param {Model3DUpdateArgs} args - Arguments to update one Model3D.
     * @example
     * // Update one Model3D
     * const model3D = await prisma.model3D.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends Model3DUpdateArgs>(args: SelectSubset<T, Model3DUpdateArgs<ExtArgs>>): Prisma__Model3DClient<$Result.GetResult<Prisma.$Model3DPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Model3DS.
     * @param {Model3DDeleteManyArgs} args - Arguments to filter Model3DS to delete.
     * @example
     * // Delete a few Model3DS
     * const { count } = await prisma.model3D.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends Model3DDeleteManyArgs>(args?: SelectSubset<T, Model3DDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Model3DS.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Model3DUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Model3DS
     * const model3D = await prisma.model3D.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends Model3DUpdateManyArgs>(args: SelectSubset<T, Model3DUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Model3DS and returns the data updated in the database.
     * @param {Model3DUpdateManyAndReturnArgs} args - Arguments to update many Model3DS.
     * @example
     * // Update many Model3DS
     * const model3D = await prisma.model3D.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Model3DS and only return the `id`
     * const model3DWithIdOnly = await prisma.model3D.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends Model3DUpdateManyAndReturnArgs>(args: SelectSubset<T, Model3DUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$Model3DPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Model3D.
     * @param {Model3DUpsertArgs} args - Arguments to update or create a Model3D.
     * @example
     * // Update or create a Model3D
     * const model3D = await prisma.model3D.upsert({
     *   create: {
     *     // ... data to create a Model3D
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Model3D we want to update
     *   }
     * })
     */
    upsert<T extends Model3DUpsertArgs>(args: SelectSubset<T, Model3DUpsertArgs<ExtArgs>>): Prisma__Model3DClient<$Result.GetResult<Prisma.$Model3DPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Model3DS.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Model3DCountArgs} args - Arguments to filter Model3DS to count.
     * @example
     * // Count the number of Model3DS
     * const count = await prisma.model3D.count({
     *   where: {
     *     // ... the filter for the Model3DS we want to count
     *   }
     * })
    **/
    count<T extends Model3DCountArgs>(
      args?: Subset<T, Model3DCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Model3DCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Model3D.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Model3DAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Model3DAggregateArgs>(args: Subset<T, Model3DAggregateArgs>): Prisma.PrismaPromise<GetModel3DAggregateType<T>>

    /**
     * Group by Model3D.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Model3DGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends Model3DGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: Model3DGroupByArgs['orderBy'] }
        : { orderBy?: Model3DGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, Model3DGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetModel3DGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Model3D model
   */
  readonly fields: Model3DFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Model3D.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__Model3DClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    shop<T extends ShopDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ShopDefaultArgs<ExtArgs>>): Prisma__ShopClient<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    productsDefaulting<T extends Model3D$productsDefaultingArgs<ExtArgs> = {}>(args?: Subset<T, Model3D$productsDefaultingArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Model3D model
   */
  interface Model3DFieldRefs {
    readonly id: FieldRef<"Model3D", 'String'>
    readonly shopId: FieldRef<"Model3D", 'String'>
    readonly name: FieldRef<"Model3D", 'String'>
    readonly glbUrl: FieldRef<"Model3D", 'String'>
    readonly materialsSchema: FieldRef<"Model3D", 'Json'>
    readonly createdAt: FieldRef<"Model3D", 'DateTime'>
    readonly updatedAt: FieldRef<"Model3D", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Model3D findUnique
   */
  export type Model3DFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model3D
     */
    select?: Model3DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Model3D
     */
    omit?: Model3DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Model3DInclude<ExtArgs> | null
    /**
     * Filter, which Model3D to fetch.
     */
    where: Model3DWhereUniqueInput
  }

  /**
   * Model3D findUniqueOrThrow
   */
  export type Model3DFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model3D
     */
    select?: Model3DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Model3D
     */
    omit?: Model3DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Model3DInclude<ExtArgs> | null
    /**
     * Filter, which Model3D to fetch.
     */
    where: Model3DWhereUniqueInput
  }

  /**
   * Model3D findFirst
   */
  export type Model3DFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model3D
     */
    select?: Model3DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Model3D
     */
    omit?: Model3DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Model3DInclude<ExtArgs> | null
    /**
     * Filter, which Model3D to fetch.
     */
    where?: Model3DWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Model3DS to fetch.
     */
    orderBy?: Model3DOrderByWithRelationInput | Model3DOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Model3DS.
     */
    cursor?: Model3DWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Model3DS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Model3DS.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Model3DS.
     */
    distinct?: Model3DScalarFieldEnum | Model3DScalarFieldEnum[]
  }

  /**
   * Model3D findFirstOrThrow
   */
  export type Model3DFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model3D
     */
    select?: Model3DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Model3D
     */
    omit?: Model3DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Model3DInclude<ExtArgs> | null
    /**
     * Filter, which Model3D to fetch.
     */
    where?: Model3DWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Model3DS to fetch.
     */
    orderBy?: Model3DOrderByWithRelationInput | Model3DOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Model3DS.
     */
    cursor?: Model3DWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Model3DS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Model3DS.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Model3DS.
     */
    distinct?: Model3DScalarFieldEnum | Model3DScalarFieldEnum[]
  }

  /**
   * Model3D findMany
   */
  export type Model3DFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model3D
     */
    select?: Model3DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Model3D
     */
    omit?: Model3DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Model3DInclude<ExtArgs> | null
    /**
     * Filter, which Model3DS to fetch.
     */
    where?: Model3DWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Model3DS to fetch.
     */
    orderBy?: Model3DOrderByWithRelationInput | Model3DOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Model3DS.
     */
    cursor?: Model3DWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Model3DS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Model3DS.
     */
    skip?: number
    distinct?: Model3DScalarFieldEnum | Model3DScalarFieldEnum[]
  }

  /**
   * Model3D create
   */
  export type Model3DCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model3D
     */
    select?: Model3DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Model3D
     */
    omit?: Model3DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Model3DInclude<ExtArgs> | null
    /**
     * The data needed to create a Model3D.
     */
    data: XOR<Model3DCreateInput, Model3DUncheckedCreateInput>
  }

  /**
   * Model3D createMany
   */
  export type Model3DCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Model3DS.
     */
    data: Model3DCreateManyInput | Model3DCreateManyInput[]
  }

  /**
   * Model3D createManyAndReturn
   */
  export type Model3DCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model3D
     */
    select?: Model3DSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Model3D
     */
    omit?: Model3DOmit<ExtArgs> | null
    /**
     * The data used to create many Model3DS.
     */
    data: Model3DCreateManyInput | Model3DCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Model3DIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Model3D update
   */
  export type Model3DUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model3D
     */
    select?: Model3DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Model3D
     */
    omit?: Model3DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Model3DInclude<ExtArgs> | null
    /**
     * The data needed to update a Model3D.
     */
    data: XOR<Model3DUpdateInput, Model3DUncheckedUpdateInput>
    /**
     * Choose, which Model3D to update.
     */
    where: Model3DWhereUniqueInput
  }

  /**
   * Model3D updateMany
   */
  export type Model3DUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Model3DS.
     */
    data: XOR<Model3DUpdateManyMutationInput, Model3DUncheckedUpdateManyInput>
    /**
     * Filter which Model3DS to update
     */
    where?: Model3DWhereInput
    /**
     * Limit how many Model3DS to update.
     */
    limit?: number
  }

  /**
   * Model3D updateManyAndReturn
   */
  export type Model3DUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model3D
     */
    select?: Model3DSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Model3D
     */
    omit?: Model3DOmit<ExtArgs> | null
    /**
     * The data used to update Model3DS.
     */
    data: XOR<Model3DUpdateManyMutationInput, Model3DUncheckedUpdateManyInput>
    /**
     * Filter which Model3DS to update
     */
    where?: Model3DWhereInput
    /**
     * Limit how many Model3DS to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Model3DIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Model3D upsert
   */
  export type Model3DUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model3D
     */
    select?: Model3DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Model3D
     */
    omit?: Model3DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Model3DInclude<ExtArgs> | null
    /**
     * The filter to search for the Model3D to update in case it exists.
     */
    where: Model3DWhereUniqueInput
    /**
     * In case the Model3D found by the `where` argument doesn't exist, create a new Model3D with this data.
     */
    create: XOR<Model3DCreateInput, Model3DUncheckedCreateInput>
    /**
     * In case the Model3D was found with the provided `where` argument, update it with this data.
     */
    update: XOR<Model3DUpdateInput, Model3DUncheckedUpdateInput>
  }

  /**
   * Model3D delete
   */
  export type Model3DDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model3D
     */
    select?: Model3DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Model3D
     */
    omit?: Model3DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Model3DInclude<ExtArgs> | null
    /**
     * Filter which Model3D to delete.
     */
    where: Model3DWhereUniqueInput
  }

  /**
   * Model3D deleteMany
   */
  export type Model3DDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Model3DS to delete
     */
    where?: Model3DWhereInput
    /**
     * Limit how many Model3DS to delete.
     */
    limit?: number
  }

  /**
   * Model3D.productsDefaulting
   */
  export type Model3D$productsDefaultingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    where?: ProductWhereInput
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    cursor?: ProductWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Model3D without action
   */
  export type Model3DDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model3D
     */
    select?: Model3DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Model3D
     */
    omit?: Model3DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Model3DInclude<ExtArgs> | null
  }


  /**
   * Model Design2D
   */

  export type AggregateDesign2D = {
    _count: Design2DCountAggregateOutputType | null
    _min: Design2DMinAggregateOutputType | null
    _max: Design2DMaxAggregateOutputType | null
  }

  export type Design2DMinAggregateOutputType = {
    id: string | null
    shopId: string | null
    name: string | null
    svgUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type Design2DMaxAggregateOutputType = {
    id: string | null
    shopId: string | null
    name: string | null
    svgUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type Design2DCountAggregateOutputType = {
    id: number
    shopId: number
    name: number
    svgUrl: number
    mappedRegions: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type Design2DMinAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    svgUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type Design2DMaxAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    svgUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type Design2DCountAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    svgUrl?: true
    mappedRegions?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type Design2DAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Design2D to aggregate.
     */
    where?: Design2DWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Design2DS to fetch.
     */
    orderBy?: Design2DOrderByWithRelationInput | Design2DOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: Design2DWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Design2DS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Design2DS.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Design2DS
    **/
    _count?: true | Design2DCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Design2DMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Design2DMaxAggregateInputType
  }

  export type GetDesign2DAggregateType<T extends Design2DAggregateArgs> = {
        [P in keyof T & keyof AggregateDesign2D]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDesign2D[P]>
      : GetScalarType<T[P], AggregateDesign2D[P]>
  }




  export type Design2DGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: Design2DWhereInput
    orderBy?: Design2DOrderByWithAggregationInput | Design2DOrderByWithAggregationInput[]
    by: Design2DScalarFieldEnum[] | Design2DScalarFieldEnum
    having?: Design2DScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Design2DCountAggregateInputType | true
    _min?: Design2DMinAggregateInputType
    _max?: Design2DMaxAggregateInputType
  }

  export type Design2DGroupByOutputType = {
    id: string
    shopId: string
    name: string
    svgUrl: string
    mappedRegions: JsonValue
    createdAt: Date
    updatedAt: Date
    _count: Design2DCountAggregateOutputType | null
    _min: Design2DMinAggregateOutputType | null
    _max: Design2DMaxAggregateOutputType | null
  }

  type GetDesign2DGroupByPayload<T extends Design2DGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Design2DGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Design2DGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Design2DGroupByOutputType[P]>
            : GetScalarType<T[P], Design2DGroupByOutputType[P]>
        }
      >
    >


  export type Design2DSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    svgUrl?: boolean
    mappedRegions?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["design2D"]>

  export type Design2DSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    svgUrl?: boolean
    mappedRegions?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["design2D"]>

  export type Design2DSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    svgUrl?: boolean
    mappedRegions?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["design2D"]>

  export type Design2DSelectScalar = {
    id?: boolean
    shopId?: boolean
    name?: boolean
    svgUrl?: boolean
    mappedRegions?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type Design2DOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "shopId" | "name" | "svgUrl" | "mappedRegions" | "createdAt" | "updatedAt", ExtArgs["result"]["design2D"]>
  export type Design2DInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }
  export type Design2DIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }
  export type Design2DIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }

  export type $Design2DPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Design2D"
    objects: {
      shop: Prisma.$ShopPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      shopId: string
      name: string
      svgUrl: string
      mappedRegions: Prisma.JsonValue
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["design2D"]>
    composites: {}
  }

  type Design2DGetPayload<S extends boolean | null | undefined | Design2DDefaultArgs> = $Result.GetResult<Prisma.$Design2DPayload, S>

  type Design2DCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<Design2DFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Design2DCountAggregateInputType | true
    }

  export interface Design2DDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Design2D'], meta: { name: 'Design2D' } }
    /**
     * Find zero or one Design2D that matches the filter.
     * @param {Design2DFindUniqueArgs} args - Arguments to find a Design2D
     * @example
     * // Get one Design2D
     * const design2D = await prisma.design2D.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends Design2DFindUniqueArgs>(args: SelectSubset<T, Design2DFindUniqueArgs<ExtArgs>>): Prisma__Design2DClient<$Result.GetResult<Prisma.$Design2DPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Design2D that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {Design2DFindUniqueOrThrowArgs} args - Arguments to find a Design2D
     * @example
     * // Get one Design2D
     * const design2D = await prisma.design2D.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends Design2DFindUniqueOrThrowArgs>(args: SelectSubset<T, Design2DFindUniqueOrThrowArgs<ExtArgs>>): Prisma__Design2DClient<$Result.GetResult<Prisma.$Design2DPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Design2D that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Design2DFindFirstArgs} args - Arguments to find a Design2D
     * @example
     * // Get one Design2D
     * const design2D = await prisma.design2D.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends Design2DFindFirstArgs>(args?: SelectSubset<T, Design2DFindFirstArgs<ExtArgs>>): Prisma__Design2DClient<$Result.GetResult<Prisma.$Design2DPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Design2D that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Design2DFindFirstOrThrowArgs} args - Arguments to find a Design2D
     * @example
     * // Get one Design2D
     * const design2D = await prisma.design2D.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends Design2DFindFirstOrThrowArgs>(args?: SelectSubset<T, Design2DFindFirstOrThrowArgs<ExtArgs>>): Prisma__Design2DClient<$Result.GetResult<Prisma.$Design2DPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Design2DS that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Design2DFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Design2DS
     * const design2DS = await prisma.design2D.findMany()
     * 
     * // Get first 10 Design2DS
     * const design2DS = await prisma.design2D.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const design2DWithIdOnly = await prisma.design2D.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends Design2DFindManyArgs>(args?: SelectSubset<T, Design2DFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$Design2DPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Design2D.
     * @param {Design2DCreateArgs} args - Arguments to create a Design2D.
     * @example
     * // Create one Design2D
     * const Design2D = await prisma.design2D.create({
     *   data: {
     *     // ... data to create a Design2D
     *   }
     * })
     * 
     */
    create<T extends Design2DCreateArgs>(args: SelectSubset<T, Design2DCreateArgs<ExtArgs>>): Prisma__Design2DClient<$Result.GetResult<Prisma.$Design2DPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Design2DS.
     * @param {Design2DCreateManyArgs} args - Arguments to create many Design2DS.
     * @example
     * // Create many Design2DS
     * const design2D = await prisma.design2D.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends Design2DCreateManyArgs>(args?: SelectSubset<T, Design2DCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Design2DS and returns the data saved in the database.
     * @param {Design2DCreateManyAndReturnArgs} args - Arguments to create many Design2DS.
     * @example
     * // Create many Design2DS
     * const design2D = await prisma.design2D.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Design2DS and only return the `id`
     * const design2DWithIdOnly = await prisma.design2D.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends Design2DCreateManyAndReturnArgs>(args?: SelectSubset<T, Design2DCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$Design2DPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Design2D.
     * @param {Design2DDeleteArgs} args - Arguments to delete one Design2D.
     * @example
     * // Delete one Design2D
     * const Design2D = await prisma.design2D.delete({
     *   where: {
     *     // ... filter to delete one Design2D
     *   }
     * })
     * 
     */
    delete<T extends Design2DDeleteArgs>(args: SelectSubset<T, Design2DDeleteArgs<ExtArgs>>): Prisma__Design2DClient<$Result.GetResult<Prisma.$Design2DPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Design2D.
     * @param {Design2DUpdateArgs} args - Arguments to update one Design2D.
     * @example
     * // Update one Design2D
     * const design2D = await prisma.design2D.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends Design2DUpdateArgs>(args: SelectSubset<T, Design2DUpdateArgs<ExtArgs>>): Prisma__Design2DClient<$Result.GetResult<Prisma.$Design2DPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Design2DS.
     * @param {Design2DDeleteManyArgs} args - Arguments to filter Design2DS to delete.
     * @example
     * // Delete a few Design2DS
     * const { count } = await prisma.design2D.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends Design2DDeleteManyArgs>(args?: SelectSubset<T, Design2DDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Design2DS.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Design2DUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Design2DS
     * const design2D = await prisma.design2D.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends Design2DUpdateManyArgs>(args: SelectSubset<T, Design2DUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Design2DS and returns the data updated in the database.
     * @param {Design2DUpdateManyAndReturnArgs} args - Arguments to update many Design2DS.
     * @example
     * // Update many Design2DS
     * const design2D = await prisma.design2D.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Design2DS and only return the `id`
     * const design2DWithIdOnly = await prisma.design2D.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends Design2DUpdateManyAndReturnArgs>(args: SelectSubset<T, Design2DUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$Design2DPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Design2D.
     * @param {Design2DUpsertArgs} args - Arguments to update or create a Design2D.
     * @example
     * // Update or create a Design2D
     * const design2D = await prisma.design2D.upsert({
     *   create: {
     *     // ... data to create a Design2D
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Design2D we want to update
     *   }
     * })
     */
    upsert<T extends Design2DUpsertArgs>(args: SelectSubset<T, Design2DUpsertArgs<ExtArgs>>): Prisma__Design2DClient<$Result.GetResult<Prisma.$Design2DPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Design2DS.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Design2DCountArgs} args - Arguments to filter Design2DS to count.
     * @example
     * // Count the number of Design2DS
     * const count = await prisma.design2D.count({
     *   where: {
     *     // ... the filter for the Design2DS we want to count
     *   }
     * })
    **/
    count<T extends Design2DCountArgs>(
      args?: Subset<T, Design2DCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Design2DCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Design2D.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Design2DAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Design2DAggregateArgs>(args: Subset<T, Design2DAggregateArgs>): Prisma.PrismaPromise<GetDesign2DAggregateType<T>>

    /**
     * Group by Design2D.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Design2DGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends Design2DGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: Design2DGroupByArgs['orderBy'] }
        : { orderBy?: Design2DGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, Design2DGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDesign2DGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Design2D model
   */
  readonly fields: Design2DFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Design2D.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__Design2DClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    shop<T extends ShopDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ShopDefaultArgs<ExtArgs>>): Prisma__ShopClient<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Design2D model
   */
  interface Design2DFieldRefs {
    readonly id: FieldRef<"Design2D", 'String'>
    readonly shopId: FieldRef<"Design2D", 'String'>
    readonly name: FieldRef<"Design2D", 'String'>
    readonly svgUrl: FieldRef<"Design2D", 'String'>
    readonly mappedRegions: FieldRef<"Design2D", 'Json'>
    readonly createdAt: FieldRef<"Design2D", 'DateTime'>
    readonly updatedAt: FieldRef<"Design2D", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Design2D findUnique
   */
  export type Design2DFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Design2D
     */
    select?: Design2DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Design2D
     */
    omit?: Design2DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Design2DInclude<ExtArgs> | null
    /**
     * Filter, which Design2D to fetch.
     */
    where: Design2DWhereUniqueInput
  }

  /**
   * Design2D findUniqueOrThrow
   */
  export type Design2DFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Design2D
     */
    select?: Design2DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Design2D
     */
    omit?: Design2DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Design2DInclude<ExtArgs> | null
    /**
     * Filter, which Design2D to fetch.
     */
    where: Design2DWhereUniqueInput
  }

  /**
   * Design2D findFirst
   */
  export type Design2DFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Design2D
     */
    select?: Design2DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Design2D
     */
    omit?: Design2DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Design2DInclude<ExtArgs> | null
    /**
     * Filter, which Design2D to fetch.
     */
    where?: Design2DWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Design2DS to fetch.
     */
    orderBy?: Design2DOrderByWithRelationInput | Design2DOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Design2DS.
     */
    cursor?: Design2DWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Design2DS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Design2DS.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Design2DS.
     */
    distinct?: Design2DScalarFieldEnum | Design2DScalarFieldEnum[]
  }

  /**
   * Design2D findFirstOrThrow
   */
  export type Design2DFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Design2D
     */
    select?: Design2DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Design2D
     */
    omit?: Design2DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Design2DInclude<ExtArgs> | null
    /**
     * Filter, which Design2D to fetch.
     */
    where?: Design2DWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Design2DS to fetch.
     */
    orderBy?: Design2DOrderByWithRelationInput | Design2DOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Design2DS.
     */
    cursor?: Design2DWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Design2DS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Design2DS.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Design2DS.
     */
    distinct?: Design2DScalarFieldEnum | Design2DScalarFieldEnum[]
  }

  /**
   * Design2D findMany
   */
  export type Design2DFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Design2D
     */
    select?: Design2DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Design2D
     */
    omit?: Design2DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Design2DInclude<ExtArgs> | null
    /**
     * Filter, which Design2DS to fetch.
     */
    where?: Design2DWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Design2DS to fetch.
     */
    orderBy?: Design2DOrderByWithRelationInput | Design2DOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Design2DS.
     */
    cursor?: Design2DWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Design2DS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Design2DS.
     */
    skip?: number
    distinct?: Design2DScalarFieldEnum | Design2DScalarFieldEnum[]
  }

  /**
   * Design2D create
   */
  export type Design2DCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Design2D
     */
    select?: Design2DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Design2D
     */
    omit?: Design2DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Design2DInclude<ExtArgs> | null
    /**
     * The data needed to create a Design2D.
     */
    data: XOR<Design2DCreateInput, Design2DUncheckedCreateInput>
  }

  /**
   * Design2D createMany
   */
  export type Design2DCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Design2DS.
     */
    data: Design2DCreateManyInput | Design2DCreateManyInput[]
  }

  /**
   * Design2D createManyAndReturn
   */
  export type Design2DCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Design2D
     */
    select?: Design2DSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Design2D
     */
    omit?: Design2DOmit<ExtArgs> | null
    /**
     * The data used to create many Design2DS.
     */
    data: Design2DCreateManyInput | Design2DCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Design2DIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Design2D update
   */
  export type Design2DUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Design2D
     */
    select?: Design2DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Design2D
     */
    omit?: Design2DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Design2DInclude<ExtArgs> | null
    /**
     * The data needed to update a Design2D.
     */
    data: XOR<Design2DUpdateInput, Design2DUncheckedUpdateInput>
    /**
     * Choose, which Design2D to update.
     */
    where: Design2DWhereUniqueInput
  }

  /**
   * Design2D updateMany
   */
  export type Design2DUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Design2DS.
     */
    data: XOR<Design2DUpdateManyMutationInput, Design2DUncheckedUpdateManyInput>
    /**
     * Filter which Design2DS to update
     */
    where?: Design2DWhereInput
    /**
     * Limit how many Design2DS to update.
     */
    limit?: number
  }

  /**
   * Design2D updateManyAndReturn
   */
  export type Design2DUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Design2D
     */
    select?: Design2DSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Design2D
     */
    omit?: Design2DOmit<ExtArgs> | null
    /**
     * The data used to update Design2DS.
     */
    data: XOR<Design2DUpdateManyMutationInput, Design2DUncheckedUpdateManyInput>
    /**
     * Filter which Design2DS to update
     */
    where?: Design2DWhereInput
    /**
     * Limit how many Design2DS to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Design2DIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Design2D upsert
   */
  export type Design2DUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Design2D
     */
    select?: Design2DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Design2D
     */
    omit?: Design2DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Design2DInclude<ExtArgs> | null
    /**
     * The filter to search for the Design2D to update in case it exists.
     */
    where: Design2DWhereUniqueInput
    /**
     * In case the Design2D found by the `where` argument doesn't exist, create a new Design2D with this data.
     */
    create: XOR<Design2DCreateInput, Design2DUncheckedCreateInput>
    /**
     * In case the Design2D was found with the provided `where` argument, update it with this data.
     */
    update: XOR<Design2DUpdateInput, Design2DUncheckedUpdateInput>
  }

  /**
   * Design2D delete
   */
  export type Design2DDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Design2D
     */
    select?: Design2DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Design2D
     */
    omit?: Design2DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Design2DInclude<ExtArgs> | null
    /**
     * Filter which Design2D to delete.
     */
    where: Design2DWhereUniqueInput
  }

  /**
   * Design2D deleteMany
   */
  export type Design2DDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Design2DS to delete
     */
    where?: Design2DWhereInput
    /**
     * Limit how many Design2DS to delete.
     */
    limit?: number
  }

  /**
   * Design2D without action
   */
  export type Design2DDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Design2D
     */
    select?: Design2DSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Design2D
     */
    omit?: Design2DOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Design2DInclude<ExtArgs> | null
  }


  /**
   * Model Color
   */

  export type AggregateColor = {
    _count: ColorCountAggregateOutputType | null
    _min: ColorMinAggregateOutputType | null
    _max: ColorMaxAggregateOutputType | null
  }

  export type ColorMinAggregateOutputType = {
    id: string | null
    shopId: string | null
    name: string | null
    hex: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ColorMaxAggregateOutputType = {
    id: string | null
    shopId: string | null
    name: string | null
    hex: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ColorCountAggregateOutputType = {
    id: number
    shopId: number
    name: number
    hex: number
    materialBindings: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ColorMinAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    hex?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ColorMaxAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    hex?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ColorCountAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    hex?: true
    materialBindings?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ColorAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Color to aggregate.
     */
    where?: ColorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Colors to fetch.
     */
    orderBy?: ColorOrderByWithRelationInput | ColorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ColorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Colors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Colors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Colors
    **/
    _count?: true | ColorCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ColorMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ColorMaxAggregateInputType
  }

  export type GetColorAggregateType<T extends ColorAggregateArgs> = {
        [P in keyof T & keyof AggregateColor]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateColor[P]>
      : GetScalarType<T[P], AggregateColor[P]>
  }




  export type ColorGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ColorWhereInput
    orderBy?: ColorOrderByWithAggregationInput | ColorOrderByWithAggregationInput[]
    by: ColorScalarFieldEnum[] | ColorScalarFieldEnum
    having?: ColorScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ColorCountAggregateInputType | true
    _min?: ColorMinAggregateInputType
    _max?: ColorMaxAggregateInputType
  }

  export type ColorGroupByOutputType = {
    id: string
    shopId: string
    name: string
    hex: string
    materialBindings: JsonValue
    createdAt: Date
    updatedAt: Date
    _count: ColorCountAggregateOutputType | null
    _min: ColorMinAggregateOutputType | null
    _max: ColorMaxAggregateOutputType | null
  }

  type GetColorGroupByPayload<T extends ColorGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ColorGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ColorGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ColorGroupByOutputType[P]>
            : GetScalarType<T[P], ColorGroupByOutputType[P]>
        }
      >
    >


  export type ColorSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    hex?: boolean
    materialBindings?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["color"]>

  export type ColorSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    hex?: boolean
    materialBindings?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["color"]>

  export type ColorSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    hex?: boolean
    materialBindings?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["color"]>

  export type ColorSelectScalar = {
    id?: boolean
    shopId?: boolean
    name?: boolean
    hex?: boolean
    materialBindings?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ColorOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "shopId" | "name" | "hex" | "materialBindings" | "createdAt" | "updatedAt", ExtArgs["result"]["color"]>
  export type ColorInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }
  export type ColorIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }
  export type ColorIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }

  export type $ColorPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Color"
    objects: {
      shop: Prisma.$ShopPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      shopId: string
      name: string
      hex: string
      materialBindings: Prisma.JsonValue
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["color"]>
    composites: {}
  }

  type ColorGetPayload<S extends boolean | null | undefined | ColorDefaultArgs> = $Result.GetResult<Prisma.$ColorPayload, S>

  type ColorCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ColorFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ColorCountAggregateInputType | true
    }

  export interface ColorDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Color'], meta: { name: 'Color' } }
    /**
     * Find zero or one Color that matches the filter.
     * @param {ColorFindUniqueArgs} args - Arguments to find a Color
     * @example
     * // Get one Color
     * const color = await prisma.color.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ColorFindUniqueArgs>(args: SelectSubset<T, ColorFindUniqueArgs<ExtArgs>>): Prisma__ColorClient<$Result.GetResult<Prisma.$ColorPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Color that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ColorFindUniqueOrThrowArgs} args - Arguments to find a Color
     * @example
     * // Get one Color
     * const color = await prisma.color.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ColorFindUniqueOrThrowArgs>(args: SelectSubset<T, ColorFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ColorClient<$Result.GetResult<Prisma.$ColorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Color that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ColorFindFirstArgs} args - Arguments to find a Color
     * @example
     * // Get one Color
     * const color = await prisma.color.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ColorFindFirstArgs>(args?: SelectSubset<T, ColorFindFirstArgs<ExtArgs>>): Prisma__ColorClient<$Result.GetResult<Prisma.$ColorPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Color that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ColorFindFirstOrThrowArgs} args - Arguments to find a Color
     * @example
     * // Get one Color
     * const color = await prisma.color.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ColorFindFirstOrThrowArgs>(args?: SelectSubset<T, ColorFindFirstOrThrowArgs<ExtArgs>>): Prisma__ColorClient<$Result.GetResult<Prisma.$ColorPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Colors that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ColorFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Colors
     * const colors = await prisma.color.findMany()
     * 
     * // Get first 10 Colors
     * const colors = await prisma.color.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const colorWithIdOnly = await prisma.color.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ColorFindManyArgs>(args?: SelectSubset<T, ColorFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ColorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Color.
     * @param {ColorCreateArgs} args - Arguments to create a Color.
     * @example
     * // Create one Color
     * const Color = await prisma.color.create({
     *   data: {
     *     // ... data to create a Color
     *   }
     * })
     * 
     */
    create<T extends ColorCreateArgs>(args: SelectSubset<T, ColorCreateArgs<ExtArgs>>): Prisma__ColorClient<$Result.GetResult<Prisma.$ColorPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Colors.
     * @param {ColorCreateManyArgs} args - Arguments to create many Colors.
     * @example
     * // Create many Colors
     * const color = await prisma.color.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ColorCreateManyArgs>(args?: SelectSubset<T, ColorCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Colors and returns the data saved in the database.
     * @param {ColorCreateManyAndReturnArgs} args - Arguments to create many Colors.
     * @example
     * // Create many Colors
     * const color = await prisma.color.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Colors and only return the `id`
     * const colorWithIdOnly = await prisma.color.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ColorCreateManyAndReturnArgs>(args?: SelectSubset<T, ColorCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ColorPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Color.
     * @param {ColorDeleteArgs} args - Arguments to delete one Color.
     * @example
     * // Delete one Color
     * const Color = await prisma.color.delete({
     *   where: {
     *     // ... filter to delete one Color
     *   }
     * })
     * 
     */
    delete<T extends ColorDeleteArgs>(args: SelectSubset<T, ColorDeleteArgs<ExtArgs>>): Prisma__ColorClient<$Result.GetResult<Prisma.$ColorPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Color.
     * @param {ColorUpdateArgs} args - Arguments to update one Color.
     * @example
     * // Update one Color
     * const color = await prisma.color.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ColorUpdateArgs>(args: SelectSubset<T, ColorUpdateArgs<ExtArgs>>): Prisma__ColorClient<$Result.GetResult<Prisma.$ColorPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Colors.
     * @param {ColorDeleteManyArgs} args - Arguments to filter Colors to delete.
     * @example
     * // Delete a few Colors
     * const { count } = await prisma.color.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ColorDeleteManyArgs>(args?: SelectSubset<T, ColorDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Colors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ColorUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Colors
     * const color = await prisma.color.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ColorUpdateManyArgs>(args: SelectSubset<T, ColorUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Colors and returns the data updated in the database.
     * @param {ColorUpdateManyAndReturnArgs} args - Arguments to update many Colors.
     * @example
     * // Update many Colors
     * const color = await prisma.color.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Colors and only return the `id`
     * const colorWithIdOnly = await prisma.color.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ColorUpdateManyAndReturnArgs>(args: SelectSubset<T, ColorUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ColorPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Color.
     * @param {ColorUpsertArgs} args - Arguments to update or create a Color.
     * @example
     * // Update or create a Color
     * const color = await prisma.color.upsert({
     *   create: {
     *     // ... data to create a Color
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Color we want to update
     *   }
     * })
     */
    upsert<T extends ColorUpsertArgs>(args: SelectSubset<T, ColorUpsertArgs<ExtArgs>>): Prisma__ColorClient<$Result.GetResult<Prisma.$ColorPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Colors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ColorCountArgs} args - Arguments to filter Colors to count.
     * @example
     * // Count the number of Colors
     * const count = await prisma.color.count({
     *   where: {
     *     // ... the filter for the Colors we want to count
     *   }
     * })
    **/
    count<T extends ColorCountArgs>(
      args?: Subset<T, ColorCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ColorCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Color.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ColorAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ColorAggregateArgs>(args: Subset<T, ColorAggregateArgs>): Prisma.PrismaPromise<GetColorAggregateType<T>>

    /**
     * Group by Color.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ColorGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ColorGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ColorGroupByArgs['orderBy'] }
        : { orderBy?: ColorGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ColorGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetColorGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Color model
   */
  readonly fields: ColorFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Color.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ColorClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    shop<T extends ShopDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ShopDefaultArgs<ExtArgs>>): Prisma__ShopClient<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Color model
   */
  interface ColorFieldRefs {
    readonly id: FieldRef<"Color", 'String'>
    readonly shopId: FieldRef<"Color", 'String'>
    readonly name: FieldRef<"Color", 'String'>
    readonly hex: FieldRef<"Color", 'String'>
    readonly materialBindings: FieldRef<"Color", 'Json'>
    readonly createdAt: FieldRef<"Color", 'DateTime'>
    readonly updatedAt: FieldRef<"Color", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Color findUnique
   */
  export type ColorFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Color
     */
    select?: ColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Color
     */
    omit?: ColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ColorInclude<ExtArgs> | null
    /**
     * Filter, which Color to fetch.
     */
    where: ColorWhereUniqueInput
  }

  /**
   * Color findUniqueOrThrow
   */
  export type ColorFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Color
     */
    select?: ColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Color
     */
    omit?: ColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ColorInclude<ExtArgs> | null
    /**
     * Filter, which Color to fetch.
     */
    where: ColorWhereUniqueInput
  }

  /**
   * Color findFirst
   */
  export type ColorFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Color
     */
    select?: ColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Color
     */
    omit?: ColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ColorInclude<ExtArgs> | null
    /**
     * Filter, which Color to fetch.
     */
    where?: ColorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Colors to fetch.
     */
    orderBy?: ColorOrderByWithRelationInput | ColorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Colors.
     */
    cursor?: ColorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Colors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Colors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Colors.
     */
    distinct?: ColorScalarFieldEnum | ColorScalarFieldEnum[]
  }

  /**
   * Color findFirstOrThrow
   */
  export type ColorFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Color
     */
    select?: ColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Color
     */
    omit?: ColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ColorInclude<ExtArgs> | null
    /**
     * Filter, which Color to fetch.
     */
    where?: ColorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Colors to fetch.
     */
    orderBy?: ColorOrderByWithRelationInput | ColorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Colors.
     */
    cursor?: ColorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Colors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Colors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Colors.
     */
    distinct?: ColorScalarFieldEnum | ColorScalarFieldEnum[]
  }

  /**
   * Color findMany
   */
  export type ColorFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Color
     */
    select?: ColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Color
     */
    omit?: ColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ColorInclude<ExtArgs> | null
    /**
     * Filter, which Colors to fetch.
     */
    where?: ColorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Colors to fetch.
     */
    orderBy?: ColorOrderByWithRelationInput | ColorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Colors.
     */
    cursor?: ColorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Colors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Colors.
     */
    skip?: number
    distinct?: ColorScalarFieldEnum | ColorScalarFieldEnum[]
  }

  /**
   * Color create
   */
  export type ColorCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Color
     */
    select?: ColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Color
     */
    omit?: ColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ColorInclude<ExtArgs> | null
    /**
     * The data needed to create a Color.
     */
    data: XOR<ColorCreateInput, ColorUncheckedCreateInput>
  }

  /**
   * Color createMany
   */
  export type ColorCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Colors.
     */
    data: ColorCreateManyInput | ColorCreateManyInput[]
  }

  /**
   * Color createManyAndReturn
   */
  export type ColorCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Color
     */
    select?: ColorSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Color
     */
    omit?: ColorOmit<ExtArgs> | null
    /**
     * The data used to create many Colors.
     */
    data: ColorCreateManyInput | ColorCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ColorIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Color update
   */
  export type ColorUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Color
     */
    select?: ColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Color
     */
    omit?: ColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ColorInclude<ExtArgs> | null
    /**
     * The data needed to update a Color.
     */
    data: XOR<ColorUpdateInput, ColorUncheckedUpdateInput>
    /**
     * Choose, which Color to update.
     */
    where: ColorWhereUniqueInput
  }

  /**
   * Color updateMany
   */
  export type ColorUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Colors.
     */
    data: XOR<ColorUpdateManyMutationInput, ColorUncheckedUpdateManyInput>
    /**
     * Filter which Colors to update
     */
    where?: ColorWhereInput
    /**
     * Limit how many Colors to update.
     */
    limit?: number
  }

  /**
   * Color updateManyAndReturn
   */
  export type ColorUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Color
     */
    select?: ColorSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Color
     */
    omit?: ColorOmit<ExtArgs> | null
    /**
     * The data used to update Colors.
     */
    data: XOR<ColorUpdateManyMutationInput, ColorUncheckedUpdateManyInput>
    /**
     * Filter which Colors to update
     */
    where?: ColorWhereInput
    /**
     * Limit how many Colors to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ColorIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Color upsert
   */
  export type ColorUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Color
     */
    select?: ColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Color
     */
    omit?: ColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ColorInclude<ExtArgs> | null
    /**
     * The filter to search for the Color to update in case it exists.
     */
    where: ColorWhereUniqueInput
    /**
     * In case the Color found by the `where` argument doesn't exist, create a new Color with this data.
     */
    create: XOR<ColorCreateInput, ColorUncheckedCreateInput>
    /**
     * In case the Color was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ColorUpdateInput, ColorUncheckedUpdateInput>
  }

  /**
   * Color delete
   */
  export type ColorDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Color
     */
    select?: ColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Color
     */
    omit?: ColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ColorInclude<ExtArgs> | null
    /**
     * Filter which Color to delete.
     */
    where: ColorWhereUniqueInput
  }

  /**
   * Color deleteMany
   */
  export type ColorDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Colors to delete
     */
    where?: ColorWhereInput
    /**
     * Limit how many Colors to delete.
     */
    limit?: number
  }

  /**
   * Color without action
   */
  export type ColorDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Color
     */
    select?: ColorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Color
     */
    omit?: ColorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ColorInclude<ExtArgs> | null
  }


  /**
   * Model Font
   */

  export type AggregateFont = {
    _count: FontCountAggregateOutputType | null
    _min: FontMinAggregateOutputType | null
    _max: FontMaxAggregateOutputType | null
  }

  export type FontMinAggregateOutputType = {
    id: string | null
    shopId: string | null
    name: string | null
    woffUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FontMaxAggregateOutputType = {
    id: string | null
    shopId: string | null
    name: string | null
    woffUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FontCountAggregateOutputType = {
    id: number
    shopId: number
    name: number
    woffUrl: number
    sdfMeta: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type FontMinAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    woffUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FontMaxAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    woffUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FontCountAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    woffUrl?: true
    sdfMeta?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type FontAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Font to aggregate.
     */
    where?: FontWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Fonts to fetch.
     */
    orderBy?: FontOrderByWithRelationInput | FontOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FontWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Fonts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Fonts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Fonts
    **/
    _count?: true | FontCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FontMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FontMaxAggregateInputType
  }

  export type GetFontAggregateType<T extends FontAggregateArgs> = {
        [P in keyof T & keyof AggregateFont]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFont[P]>
      : GetScalarType<T[P], AggregateFont[P]>
  }




  export type FontGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FontWhereInput
    orderBy?: FontOrderByWithAggregationInput | FontOrderByWithAggregationInput[]
    by: FontScalarFieldEnum[] | FontScalarFieldEnum
    having?: FontScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FontCountAggregateInputType | true
    _min?: FontMinAggregateInputType
    _max?: FontMaxAggregateInputType
  }

  export type FontGroupByOutputType = {
    id: string
    shopId: string
    name: string
    woffUrl: string
    sdfMeta: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: FontCountAggregateOutputType | null
    _min: FontMinAggregateOutputType | null
    _max: FontMaxAggregateOutputType | null
  }

  type GetFontGroupByPayload<T extends FontGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FontGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FontGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FontGroupByOutputType[P]>
            : GetScalarType<T[P], FontGroupByOutputType[P]>
        }
      >
    >


  export type FontSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    woffUrl?: boolean
    sdfMeta?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["font"]>

  export type FontSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    woffUrl?: boolean
    sdfMeta?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["font"]>

  export type FontSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    woffUrl?: boolean
    sdfMeta?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["font"]>

  export type FontSelectScalar = {
    id?: boolean
    shopId?: boolean
    name?: boolean
    woffUrl?: boolean
    sdfMeta?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type FontOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "shopId" | "name" | "woffUrl" | "sdfMeta" | "createdAt" | "updatedAt", ExtArgs["result"]["font"]>
  export type FontInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }
  export type FontIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }
  export type FontIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }

  export type $FontPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Font"
    objects: {
      shop: Prisma.$ShopPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      shopId: string
      name: string
      woffUrl: string
      sdfMeta: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["font"]>
    composites: {}
  }

  type FontGetPayload<S extends boolean | null | undefined | FontDefaultArgs> = $Result.GetResult<Prisma.$FontPayload, S>

  type FontCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FontFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FontCountAggregateInputType | true
    }

  export interface FontDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Font'], meta: { name: 'Font' } }
    /**
     * Find zero or one Font that matches the filter.
     * @param {FontFindUniqueArgs} args - Arguments to find a Font
     * @example
     * // Get one Font
     * const font = await prisma.font.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FontFindUniqueArgs>(args: SelectSubset<T, FontFindUniqueArgs<ExtArgs>>): Prisma__FontClient<$Result.GetResult<Prisma.$FontPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Font that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FontFindUniqueOrThrowArgs} args - Arguments to find a Font
     * @example
     * // Get one Font
     * const font = await prisma.font.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FontFindUniqueOrThrowArgs>(args: SelectSubset<T, FontFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FontClient<$Result.GetResult<Prisma.$FontPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Font that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FontFindFirstArgs} args - Arguments to find a Font
     * @example
     * // Get one Font
     * const font = await prisma.font.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FontFindFirstArgs>(args?: SelectSubset<T, FontFindFirstArgs<ExtArgs>>): Prisma__FontClient<$Result.GetResult<Prisma.$FontPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Font that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FontFindFirstOrThrowArgs} args - Arguments to find a Font
     * @example
     * // Get one Font
     * const font = await prisma.font.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FontFindFirstOrThrowArgs>(args?: SelectSubset<T, FontFindFirstOrThrowArgs<ExtArgs>>): Prisma__FontClient<$Result.GetResult<Prisma.$FontPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Fonts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FontFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Fonts
     * const fonts = await prisma.font.findMany()
     * 
     * // Get first 10 Fonts
     * const fonts = await prisma.font.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const fontWithIdOnly = await prisma.font.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FontFindManyArgs>(args?: SelectSubset<T, FontFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FontPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Font.
     * @param {FontCreateArgs} args - Arguments to create a Font.
     * @example
     * // Create one Font
     * const Font = await prisma.font.create({
     *   data: {
     *     // ... data to create a Font
     *   }
     * })
     * 
     */
    create<T extends FontCreateArgs>(args: SelectSubset<T, FontCreateArgs<ExtArgs>>): Prisma__FontClient<$Result.GetResult<Prisma.$FontPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Fonts.
     * @param {FontCreateManyArgs} args - Arguments to create many Fonts.
     * @example
     * // Create many Fonts
     * const font = await prisma.font.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FontCreateManyArgs>(args?: SelectSubset<T, FontCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Fonts and returns the data saved in the database.
     * @param {FontCreateManyAndReturnArgs} args - Arguments to create many Fonts.
     * @example
     * // Create many Fonts
     * const font = await prisma.font.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Fonts and only return the `id`
     * const fontWithIdOnly = await prisma.font.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FontCreateManyAndReturnArgs>(args?: SelectSubset<T, FontCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FontPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Font.
     * @param {FontDeleteArgs} args - Arguments to delete one Font.
     * @example
     * // Delete one Font
     * const Font = await prisma.font.delete({
     *   where: {
     *     // ... filter to delete one Font
     *   }
     * })
     * 
     */
    delete<T extends FontDeleteArgs>(args: SelectSubset<T, FontDeleteArgs<ExtArgs>>): Prisma__FontClient<$Result.GetResult<Prisma.$FontPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Font.
     * @param {FontUpdateArgs} args - Arguments to update one Font.
     * @example
     * // Update one Font
     * const font = await prisma.font.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FontUpdateArgs>(args: SelectSubset<T, FontUpdateArgs<ExtArgs>>): Prisma__FontClient<$Result.GetResult<Prisma.$FontPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Fonts.
     * @param {FontDeleteManyArgs} args - Arguments to filter Fonts to delete.
     * @example
     * // Delete a few Fonts
     * const { count } = await prisma.font.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FontDeleteManyArgs>(args?: SelectSubset<T, FontDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Fonts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FontUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Fonts
     * const font = await prisma.font.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FontUpdateManyArgs>(args: SelectSubset<T, FontUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Fonts and returns the data updated in the database.
     * @param {FontUpdateManyAndReturnArgs} args - Arguments to update many Fonts.
     * @example
     * // Update many Fonts
     * const font = await prisma.font.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Fonts and only return the `id`
     * const fontWithIdOnly = await prisma.font.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends FontUpdateManyAndReturnArgs>(args: SelectSubset<T, FontUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FontPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Font.
     * @param {FontUpsertArgs} args - Arguments to update or create a Font.
     * @example
     * // Update or create a Font
     * const font = await prisma.font.upsert({
     *   create: {
     *     // ... data to create a Font
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Font we want to update
     *   }
     * })
     */
    upsert<T extends FontUpsertArgs>(args: SelectSubset<T, FontUpsertArgs<ExtArgs>>): Prisma__FontClient<$Result.GetResult<Prisma.$FontPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Fonts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FontCountArgs} args - Arguments to filter Fonts to count.
     * @example
     * // Count the number of Fonts
     * const count = await prisma.font.count({
     *   where: {
     *     // ... the filter for the Fonts we want to count
     *   }
     * })
    **/
    count<T extends FontCountArgs>(
      args?: Subset<T, FontCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FontCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Font.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FontAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FontAggregateArgs>(args: Subset<T, FontAggregateArgs>): Prisma.PrismaPromise<GetFontAggregateType<T>>

    /**
     * Group by Font.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FontGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FontGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FontGroupByArgs['orderBy'] }
        : { orderBy?: FontGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FontGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFontGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Font model
   */
  readonly fields: FontFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Font.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FontClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    shop<T extends ShopDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ShopDefaultArgs<ExtArgs>>): Prisma__ShopClient<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Font model
   */
  interface FontFieldRefs {
    readonly id: FieldRef<"Font", 'String'>
    readonly shopId: FieldRef<"Font", 'String'>
    readonly name: FieldRef<"Font", 'String'>
    readonly woffUrl: FieldRef<"Font", 'String'>
    readonly sdfMeta: FieldRef<"Font", 'Json'>
    readonly createdAt: FieldRef<"Font", 'DateTime'>
    readonly updatedAt: FieldRef<"Font", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Font findUnique
   */
  export type FontFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Font
     */
    select?: FontSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Font
     */
    omit?: FontOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FontInclude<ExtArgs> | null
    /**
     * Filter, which Font to fetch.
     */
    where: FontWhereUniqueInput
  }

  /**
   * Font findUniqueOrThrow
   */
  export type FontFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Font
     */
    select?: FontSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Font
     */
    omit?: FontOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FontInclude<ExtArgs> | null
    /**
     * Filter, which Font to fetch.
     */
    where: FontWhereUniqueInput
  }

  /**
   * Font findFirst
   */
  export type FontFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Font
     */
    select?: FontSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Font
     */
    omit?: FontOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FontInclude<ExtArgs> | null
    /**
     * Filter, which Font to fetch.
     */
    where?: FontWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Fonts to fetch.
     */
    orderBy?: FontOrderByWithRelationInput | FontOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Fonts.
     */
    cursor?: FontWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Fonts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Fonts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Fonts.
     */
    distinct?: FontScalarFieldEnum | FontScalarFieldEnum[]
  }

  /**
   * Font findFirstOrThrow
   */
  export type FontFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Font
     */
    select?: FontSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Font
     */
    omit?: FontOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FontInclude<ExtArgs> | null
    /**
     * Filter, which Font to fetch.
     */
    where?: FontWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Fonts to fetch.
     */
    orderBy?: FontOrderByWithRelationInput | FontOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Fonts.
     */
    cursor?: FontWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Fonts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Fonts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Fonts.
     */
    distinct?: FontScalarFieldEnum | FontScalarFieldEnum[]
  }

  /**
   * Font findMany
   */
  export type FontFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Font
     */
    select?: FontSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Font
     */
    omit?: FontOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FontInclude<ExtArgs> | null
    /**
     * Filter, which Fonts to fetch.
     */
    where?: FontWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Fonts to fetch.
     */
    orderBy?: FontOrderByWithRelationInput | FontOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Fonts.
     */
    cursor?: FontWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Fonts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Fonts.
     */
    skip?: number
    distinct?: FontScalarFieldEnum | FontScalarFieldEnum[]
  }

  /**
   * Font create
   */
  export type FontCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Font
     */
    select?: FontSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Font
     */
    omit?: FontOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FontInclude<ExtArgs> | null
    /**
     * The data needed to create a Font.
     */
    data: XOR<FontCreateInput, FontUncheckedCreateInput>
  }

  /**
   * Font createMany
   */
  export type FontCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Fonts.
     */
    data: FontCreateManyInput | FontCreateManyInput[]
  }

  /**
   * Font createManyAndReturn
   */
  export type FontCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Font
     */
    select?: FontSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Font
     */
    omit?: FontOmit<ExtArgs> | null
    /**
     * The data used to create many Fonts.
     */
    data: FontCreateManyInput | FontCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FontIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Font update
   */
  export type FontUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Font
     */
    select?: FontSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Font
     */
    omit?: FontOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FontInclude<ExtArgs> | null
    /**
     * The data needed to update a Font.
     */
    data: XOR<FontUpdateInput, FontUncheckedUpdateInput>
    /**
     * Choose, which Font to update.
     */
    where: FontWhereUniqueInput
  }

  /**
   * Font updateMany
   */
  export type FontUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Fonts.
     */
    data: XOR<FontUpdateManyMutationInput, FontUncheckedUpdateManyInput>
    /**
     * Filter which Fonts to update
     */
    where?: FontWhereInput
    /**
     * Limit how many Fonts to update.
     */
    limit?: number
  }

  /**
   * Font updateManyAndReturn
   */
  export type FontUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Font
     */
    select?: FontSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Font
     */
    omit?: FontOmit<ExtArgs> | null
    /**
     * The data used to update Fonts.
     */
    data: XOR<FontUpdateManyMutationInput, FontUncheckedUpdateManyInput>
    /**
     * Filter which Fonts to update
     */
    where?: FontWhereInput
    /**
     * Limit how many Fonts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FontIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Font upsert
   */
  export type FontUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Font
     */
    select?: FontSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Font
     */
    omit?: FontOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FontInclude<ExtArgs> | null
    /**
     * The filter to search for the Font to update in case it exists.
     */
    where: FontWhereUniqueInput
    /**
     * In case the Font found by the `where` argument doesn't exist, create a new Font with this data.
     */
    create: XOR<FontCreateInput, FontUncheckedCreateInput>
    /**
     * In case the Font was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FontUpdateInput, FontUncheckedUpdateInput>
  }

  /**
   * Font delete
   */
  export type FontDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Font
     */
    select?: FontSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Font
     */
    omit?: FontOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FontInclude<ExtArgs> | null
    /**
     * Filter which Font to delete.
     */
    where: FontWhereUniqueInput
  }

  /**
   * Font deleteMany
   */
  export type FontDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Fonts to delete
     */
    where?: FontWhereInput
    /**
     * Limit how many Fonts to delete.
     */
    limit?: number
  }

  /**
   * Font without action
   */
  export type FontDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Font
     */
    select?: FontSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Font
     */
    omit?: FontOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FontInclude<ExtArgs> | null
  }


  /**
   * Model Logo
   */

  export type AggregateLogo = {
    _count: LogoCountAggregateOutputType | null
    _min: LogoMinAggregateOutputType | null
    _max: LogoMaxAggregateOutputType | null
  }

  export type LogoMinAggregateOutputType = {
    id: string | null
    shopId: string | null
    name: string | null
    fileUrl: string | null
    vector: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LogoMaxAggregateOutputType = {
    id: string | null
    shopId: string | null
    name: string | null
    fileUrl: string | null
    vector: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LogoCountAggregateOutputType = {
    id: number
    shopId: number
    name: number
    fileUrl: number
    vector: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LogoMinAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    fileUrl?: true
    vector?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LogoMaxAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    fileUrl?: true
    vector?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LogoCountAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    fileUrl?: true
    vector?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LogoAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Logo to aggregate.
     */
    where?: LogoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Logos to fetch.
     */
    orderBy?: LogoOrderByWithRelationInput | LogoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LogoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Logos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Logos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Logos
    **/
    _count?: true | LogoCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LogoMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LogoMaxAggregateInputType
  }

  export type GetLogoAggregateType<T extends LogoAggregateArgs> = {
        [P in keyof T & keyof AggregateLogo]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLogo[P]>
      : GetScalarType<T[P], AggregateLogo[P]>
  }




  export type LogoGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LogoWhereInput
    orderBy?: LogoOrderByWithAggregationInput | LogoOrderByWithAggregationInput[]
    by: LogoScalarFieldEnum[] | LogoScalarFieldEnum
    having?: LogoScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LogoCountAggregateInputType | true
    _min?: LogoMinAggregateInputType
    _max?: LogoMaxAggregateInputType
  }

  export type LogoGroupByOutputType = {
    id: string
    shopId: string
    name: string
    fileUrl: string
    vector: boolean
    createdAt: Date
    updatedAt: Date
    _count: LogoCountAggregateOutputType | null
    _min: LogoMinAggregateOutputType | null
    _max: LogoMaxAggregateOutputType | null
  }

  type GetLogoGroupByPayload<T extends LogoGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LogoGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LogoGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LogoGroupByOutputType[P]>
            : GetScalarType<T[P], LogoGroupByOutputType[P]>
        }
      >
    >


  export type LogoSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    fileUrl?: boolean
    vector?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["logo"]>

  export type LogoSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    fileUrl?: boolean
    vector?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["logo"]>

  export type LogoSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    fileUrl?: boolean
    vector?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["logo"]>

  export type LogoSelectScalar = {
    id?: boolean
    shopId?: boolean
    name?: boolean
    fileUrl?: boolean
    vector?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type LogoOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "shopId" | "name" | "fileUrl" | "vector" | "createdAt" | "updatedAt", ExtArgs["result"]["logo"]>
  export type LogoInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }
  export type LogoIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }
  export type LogoIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }

  export type $LogoPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Logo"
    objects: {
      shop: Prisma.$ShopPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      shopId: string
      name: string
      fileUrl: string
      vector: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["logo"]>
    composites: {}
  }

  type LogoGetPayload<S extends boolean | null | undefined | LogoDefaultArgs> = $Result.GetResult<Prisma.$LogoPayload, S>

  type LogoCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LogoFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LogoCountAggregateInputType | true
    }

  export interface LogoDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Logo'], meta: { name: 'Logo' } }
    /**
     * Find zero or one Logo that matches the filter.
     * @param {LogoFindUniqueArgs} args - Arguments to find a Logo
     * @example
     * // Get one Logo
     * const logo = await prisma.logo.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LogoFindUniqueArgs>(args: SelectSubset<T, LogoFindUniqueArgs<ExtArgs>>): Prisma__LogoClient<$Result.GetResult<Prisma.$LogoPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Logo that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LogoFindUniqueOrThrowArgs} args - Arguments to find a Logo
     * @example
     * // Get one Logo
     * const logo = await prisma.logo.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LogoFindUniqueOrThrowArgs>(args: SelectSubset<T, LogoFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LogoClient<$Result.GetResult<Prisma.$LogoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Logo that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogoFindFirstArgs} args - Arguments to find a Logo
     * @example
     * // Get one Logo
     * const logo = await prisma.logo.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LogoFindFirstArgs>(args?: SelectSubset<T, LogoFindFirstArgs<ExtArgs>>): Prisma__LogoClient<$Result.GetResult<Prisma.$LogoPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Logo that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogoFindFirstOrThrowArgs} args - Arguments to find a Logo
     * @example
     * // Get one Logo
     * const logo = await prisma.logo.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LogoFindFirstOrThrowArgs>(args?: SelectSubset<T, LogoFindFirstOrThrowArgs<ExtArgs>>): Prisma__LogoClient<$Result.GetResult<Prisma.$LogoPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Logos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogoFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Logos
     * const logos = await prisma.logo.findMany()
     * 
     * // Get first 10 Logos
     * const logos = await prisma.logo.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const logoWithIdOnly = await prisma.logo.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LogoFindManyArgs>(args?: SelectSubset<T, LogoFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LogoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Logo.
     * @param {LogoCreateArgs} args - Arguments to create a Logo.
     * @example
     * // Create one Logo
     * const Logo = await prisma.logo.create({
     *   data: {
     *     // ... data to create a Logo
     *   }
     * })
     * 
     */
    create<T extends LogoCreateArgs>(args: SelectSubset<T, LogoCreateArgs<ExtArgs>>): Prisma__LogoClient<$Result.GetResult<Prisma.$LogoPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Logos.
     * @param {LogoCreateManyArgs} args - Arguments to create many Logos.
     * @example
     * // Create many Logos
     * const logo = await prisma.logo.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LogoCreateManyArgs>(args?: SelectSubset<T, LogoCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Logos and returns the data saved in the database.
     * @param {LogoCreateManyAndReturnArgs} args - Arguments to create many Logos.
     * @example
     * // Create many Logos
     * const logo = await prisma.logo.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Logos and only return the `id`
     * const logoWithIdOnly = await prisma.logo.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LogoCreateManyAndReturnArgs>(args?: SelectSubset<T, LogoCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LogoPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Logo.
     * @param {LogoDeleteArgs} args - Arguments to delete one Logo.
     * @example
     * // Delete one Logo
     * const Logo = await prisma.logo.delete({
     *   where: {
     *     // ... filter to delete one Logo
     *   }
     * })
     * 
     */
    delete<T extends LogoDeleteArgs>(args: SelectSubset<T, LogoDeleteArgs<ExtArgs>>): Prisma__LogoClient<$Result.GetResult<Prisma.$LogoPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Logo.
     * @param {LogoUpdateArgs} args - Arguments to update one Logo.
     * @example
     * // Update one Logo
     * const logo = await prisma.logo.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LogoUpdateArgs>(args: SelectSubset<T, LogoUpdateArgs<ExtArgs>>): Prisma__LogoClient<$Result.GetResult<Prisma.$LogoPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Logos.
     * @param {LogoDeleteManyArgs} args - Arguments to filter Logos to delete.
     * @example
     * // Delete a few Logos
     * const { count } = await prisma.logo.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LogoDeleteManyArgs>(args?: SelectSubset<T, LogoDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Logos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogoUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Logos
     * const logo = await prisma.logo.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LogoUpdateManyArgs>(args: SelectSubset<T, LogoUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Logos and returns the data updated in the database.
     * @param {LogoUpdateManyAndReturnArgs} args - Arguments to update many Logos.
     * @example
     * // Update many Logos
     * const logo = await prisma.logo.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Logos and only return the `id`
     * const logoWithIdOnly = await prisma.logo.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LogoUpdateManyAndReturnArgs>(args: SelectSubset<T, LogoUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LogoPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Logo.
     * @param {LogoUpsertArgs} args - Arguments to update or create a Logo.
     * @example
     * // Update or create a Logo
     * const logo = await prisma.logo.upsert({
     *   create: {
     *     // ... data to create a Logo
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Logo we want to update
     *   }
     * })
     */
    upsert<T extends LogoUpsertArgs>(args: SelectSubset<T, LogoUpsertArgs<ExtArgs>>): Prisma__LogoClient<$Result.GetResult<Prisma.$LogoPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Logos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogoCountArgs} args - Arguments to filter Logos to count.
     * @example
     * // Count the number of Logos
     * const count = await prisma.logo.count({
     *   where: {
     *     // ... the filter for the Logos we want to count
     *   }
     * })
    **/
    count<T extends LogoCountArgs>(
      args?: Subset<T, LogoCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LogoCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Logo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogoAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LogoAggregateArgs>(args: Subset<T, LogoAggregateArgs>): Prisma.PrismaPromise<GetLogoAggregateType<T>>

    /**
     * Group by Logo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogoGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LogoGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LogoGroupByArgs['orderBy'] }
        : { orderBy?: LogoGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LogoGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLogoGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Logo model
   */
  readonly fields: LogoFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Logo.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LogoClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    shop<T extends ShopDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ShopDefaultArgs<ExtArgs>>): Prisma__ShopClient<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Logo model
   */
  interface LogoFieldRefs {
    readonly id: FieldRef<"Logo", 'String'>
    readonly shopId: FieldRef<"Logo", 'String'>
    readonly name: FieldRef<"Logo", 'String'>
    readonly fileUrl: FieldRef<"Logo", 'String'>
    readonly vector: FieldRef<"Logo", 'Boolean'>
    readonly createdAt: FieldRef<"Logo", 'DateTime'>
    readonly updatedAt: FieldRef<"Logo", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Logo findUnique
   */
  export type LogoFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Logo
     */
    select?: LogoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Logo
     */
    omit?: LogoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogoInclude<ExtArgs> | null
    /**
     * Filter, which Logo to fetch.
     */
    where: LogoWhereUniqueInput
  }

  /**
   * Logo findUniqueOrThrow
   */
  export type LogoFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Logo
     */
    select?: LogoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Logo
     */
    omit?: LogoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogoInclude<ExtArgs> | null
    /**
     * Filter, which Logo to fetch.
     */
    where: LogoWhereUniqueInput
  }

  /**
   * Logo findFirst
   */
  export type LogoFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Logo
     */
    select?: LogoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Logo
     */
    omit?: LogoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogoInclude<ExtArgs> | null
    /**
     * Filter, which Logo to fetch.
     */
    where?: LogoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Logos to fetch.
     */
    orderBy?: LogoOrderByWithRelationInput | LogoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Logos.
     */
    cursor?: LogoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Logos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Logos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Logos.
     */
    distinct?: LogoScalarFieldEnum | LogoScalarFieldEnum[]
  }

  /**
   * Logo findFirstOrThrow
   */
  export type LogoFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Logo
     */
    select?: LogoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Logo
     */
    omit?: LogoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogoInclude<ExtArgs> | null
    /**
     * Filter, which Logo to fetch.
     */
    where?: LogoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Logos to fetch.
     */
    orderBy?: LogoOrderByWithRelationInput | LogoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Logos.
     */
    cursor?: LogoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Logos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Logos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Logos.
     */
    distinct?: LogoScalarFieldEnum | LogoScalarFieldEnum[]
  }

  /**
   * Logo findMany
   */
  export type LogoFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Logo
     */
    select?: LogoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Logo
     */
    omit?: LogoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogoInclude<ExtArgs> | null
    /**
     * Filter, which Logos to fetch.
     */
    where?: LogoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Logos to fetch.
     */
    orderBy?: LogoOrderByWithRelationInput | LogoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Logos.
     */
    cursor?: LogoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Logos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Logos.
     */
    skip?: number
    distinct?: LogoScalarFieldEnum | LogoScalarFieldEnum[]
  }

  /**
   * Logo create
   */
  export type LogoCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Logo
     */
    select?: LogoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Logo
     */
    omit?: LogoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogoInclude<ExtArgs> | null
    /**
     * The data needed to create a Logo.
     */
    data: XOR<LogoCreateInput, LogoUncheckedCreateInput>
  }

  /**
   * Logo createMany
   */
  export type LogoCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Logos.
     */
    data: LogoCreateManyInput | LogoCreateManyInput[]
  }

  /**
   * Logo createManyAndReturn
   */
  export type LogoCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Logo
     */
    select?: LogoSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Logo
     */
    omit?: LogoOmit<ExtArgs> | null
    /**
     * The data used to create many Logos.
     */
    data: LogoCreateManyInput | LogoCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogoIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Logo update
   */
  export type LogoUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Logo
     */
    select?: LogoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Logo
     */
    omit?: LogoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogoInclude<ExtArgs> | null
    /**
     * The data needed to update a Logo.
     */
    data: XOR<LogoUpdateInput, LogoUncheckedUpdateInput>
    /**
     * Choose, which Logo to update.
     */
    where: LogoWhereUniqueInput
  }

  /**
   * Logo updateMany
   */
  export type LogoUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Logos.
     */
    data: XOR<LogoUpdateManyMutationInput, LogoUncheckedUpdateManyInput>
    /**
     * Filter which Logos to update
     */
    where?: LogoWhereInput
    /**
     * Limit how many Logos to update.
     */
    limit?: number
  }

  /**
   * Logo updateManyAndReturn
   */
  export type LogoUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Logo
     */
    select?: LogoSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Logo
     */
    omit?: LogoOmit<ExtArgs> | null
    /**
     * The data used to update Logos.
     */
    data: XOR<LogoUpdateManyMutationInput, LogoUncheckedUpdateManyInput>
    /**
     * Filter which Logos to update
     */
    where?: LogoWhereInput
    /**
     * Limit how many Logos to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogoIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Logo upsert
   */
  export type LogoUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Logo
     */
    select?: LogoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Logo
     */
    omit?: LogoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogoInclude<ExtArgs> | null
    /**
     * The filter to search for the Logo to update in case it exists.
     */
    where: LogoWhereUniqueInput
    /**
     * In case the Logo found by the `where` argument doesn't exist, create a new Logo with this data.
     */
    create: XOR<LogoCreateInput, LogoUncheckedCreateInput>
    /**
     * In case the Logo was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LogoUpdateInput, LogoUncheckedUpdateInput>
  }

  /**
   * Logo delete
   */
  export type LogoDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Logo
     */
    select?: LogoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Logo
     */
    omit?: LogoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogoInclude<ExtArgs> | null
    /**
     * Filter which Logo to delete.
     */
    where: LogoWhereUniqueInput
  }

  /**
   * Logo deleteMany
   */
  export type LogoDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Logos to delete
     */
    where?: LogoWhereInput
    /**
     * Limit how many Logos to delete.
     */
    limit?: number
  }

  /**
   * Logo without action
   */
  export type LogoDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Logo
     */
    select?: LogoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Logo
     */
    omit?: LogoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogoInclude<ExtArgs> | null
  }


  /**
   * Model Configuration
   */

  export type AggregateConfiguration = {
    _count: ConfigurationCountAggregateOutputType | null
    _min: ConfigurationMinAggregateOutputType | null
    _max: ConfigurationMaxAggregateOutputType | null
  }

  export type ConfigurationMinAggregateOutputType = {
    id: string | null
    shopId: string | null
    productGid: string | null
    variantGid: string | null
    thumbnailUrl: string | null
    createdBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ConfigurationMaxAggregateOutputType = {
    id: string | null
    shopId: string | null
    productGid: string | null
    variantGid: string | null
    thumbnailUrl: string | null
    createdBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ConfigurationCountAggregateOutputType = {
    id: number
    shopId: number
    productGid: number
    variantGid: number
    payloadJSON: number
    thumbnailUrl: number
    createdBy: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ConfigurationMinAggregateInputType = {
    id?: true
    shopId?: true
    productGid?: true
    variantGid?: true
    thumbnailUrl?: true
    createdBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ConfigurationMaxAggregateInputType = {
    id?: true
    shopId?: true
    productGid?: true
    variantGid?: true
    thumbnailUrl?: true
    createdBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ConfigurationCountAggregateInputType = {
    id?: true
    shopId?: true
    productGid?: true
    variantGid?: true
    payloadJSON?: true
    thumbnailUrl?: true
    createdBy?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ConfigurationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Configuration to aggregate.
     */
    where?: ConfigurationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Configurations to fetch.
     */
    orderBy?: ConfigurationOrderByWithRelationInput | ConfigurationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ConfigurationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Configurations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Configurations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Configurations
    **/
    _count?: true | ConfigurationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ConfigurationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ConfigurationMaxAggregateInputType
  }

  export type GetConfigurationAggregateType<T extends ConfigurationAggregateArgs> = {
        [P in keyof T & keyof AggregateConfiguration]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConfiguration[P]>
      : GetScalarType<T[P], AggregateConfiguration[P]>
  }




  export type ConfigurationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConfigurationWhereInput
    orderBy?: ConfigurationOrderByWithAggregationInput | ConfigurationOrderByWithAggregationInput[]
    by: ConfigurationScalarFieldEnum[] | ConfigurationScalarFieldEnum
    having?: ConfigurationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConfigurationCountAggregateInputType | true
    _min?: ConfigurationMinAggregateInputType
    _max?: ConfigurationMaxAggregateInputType
  }

  export type ConfigurationGroupByOutputType = {
    id: string
    shopId: string
    productGid: string
    variantGid: string | null
    payloadJSON: JsonValue
    thumbnailUrl: string | null
    createdBy: string | null
    createdAt: Date
    updatedAt: Date
    _count: ConfigurationCountAggregateOutputType | null
    _min: ConfigurationMinAggregateOutputType | null
    _max: ConfigurationMaxAggregateOutputType | null
  }

  type GetConfigurationGroupByPayload<T extends ConfigurationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConfigurationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConfigurationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConfigurationGroupByOutputType[P]>
            : GetScalarType<T[P], ConfigurationGroupByOutputType[P]>
        }
      >
    >


  export type ConfigurationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    productGid?: boolean
    variantGid?: boolean
    payloadJSON?: boolean
    thumbnailUrl?: boolean
    createdBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["configuration"]>

  export type ConfigurationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    productGid?: boolean
    variantGid?: boolean
    payloadJSON?: boolean
    thumbnailUrl?: boolean
    createdBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["configuration"]>

  export type ConfigurationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    productGid?: boolean
    variantGid?: boolean
    payloadJSON?: boolean
    thumbnailUrl?: boolean
    createdBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["configuration"]>

  export type ConfigurationSelectScalar = {
    id?: boolean
    shopId?: boolean
    productGid?: boolean
    variantGid?: boolean
    payloadJSON?: boolean
    thumbnailUrl?: boolean
    createdBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ConfigurationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "shopId" | "productGid" | "variantGid" | "payloadJSON" | "thumbnailUrl" | "createdBy" | "createdAt" | "updatedAt", ExtArgs["result"]["configuration"]>
  export type ConfigurationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }
  export type ConfigurationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }
  export type ConfigurationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    shop?: boolean | ShopDefaultArgs<ExtArgs>
  }

  export type $ConfigurationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Configuration"
    objects: {
      shop: Prisma.$ShopPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      shopId: string
      productGid: string
      variantGid: string | null
      payloadJSON: Prisma.JsonValue
      thumbnailUrl: string | null
      createdBy: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["configuration"]>
    composites: {}
  }

  type ConfigurationGetPayload<S extends boolean | null | undefined | ConfigurationDefaultArgs> = $Result.GetResult<Prisma.$ConfigurationPayload, S>

  type ConfigurationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ConfigurationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ConfigurationCountAggregateInputType | true
    }

  export interface ConfigurationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Configuration'], meta: { name: 'Configuration' } }
    /**
     * Find zero or one Configuration that matches the filter.
     * @param {ConfigurationFindUniqueArgs} args - Arguments to find a Configuration
     * @example
     * // Get one Configuration
     * const configuration = await prisma.configuration.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConfigurationFindUniqueArgs>(args: SelectSubset<T, ConfigurationFindUniqueArgs<ExtArgs>>): Prisma__ConfigurationClient<$Result.GetResult<Prisma.$ConfigurationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Configuration that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ConfigurationFindUniqueOrThrowArgs} args - Arguments to find a Configuration
     * @example
     * // Get one Configuration
     * const configuration = await prisma.configuration.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConfigurationFindUniqueOrThrowArgs>(args: SelectSubset<T, ConfigurationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConfigurationClient<$Result.GetResult<Prisma.$ConfigurationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Configuration that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfigurationFindFirstArgs} args - Arguments to find a Configuration
     * @example
     * // Get one Configuration
     * const configuration = await prisma.configuration.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConfigurationFindFirstArgs>(args?: SelectSubset<T, ConfigurationFindFirstArgs<ExtArgs>>): Prisma__ConfigurationClient<$Result.GetResult<Prisma.$ConfigurationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Configuration that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfigurationFindFirstOrThrowArgs} args - Arguments to find a Configuration
     * @example
     * // Get one Configuration
     * const configuration = await prisma.configuration.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConfigurationFindFirstOrThrowArgs>(args?: SelectSubset<T, ConfigurationFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConfigurationClient<$Result.GetResult<Prisma.$ConfigurationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Configurations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfigurationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Configurations
     * const configurations = await prisma.configuration.findMany()
     * 
     * // Get first 10 Configurations
     * const configurations = await prisma.configuration.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const configurationWithIdOnly = await prisma.configuration.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ConfigurationFindManyArgs>(args?: SelectSubset<T, ConfigurationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConfigurationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Configuration.
     * @param {ConfigurationCreateArgs} args - Arguments to create a Configuration.
     * @example
     * // Create one Configuration
     * const Configuration = await prisma.configuration.create({
     *   data: {
     *     // ... data to create a Configuration
     *   }
     * })
     * 
     */
    create<T extends ConfigurationCreateArgs>(args: SelectSubset<T, ConfigurationCreateArgs<ExtArgs>>): Prisma__ConfigurationClient<$Result.GetResult<Prisma.$ConfigurationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Configurations.
     * @param {ConfigurationCreateManyArgs} args - Arguments to create many Configurations.
     * @example
     * // Create many Configurations
     * const configuration = await prisma.configuration.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ConfigurationCreateManyArgs>(args?: SelectSubset<T, ConfigurationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Configurations and returns the data saved in the database.
     * @param {ConfigurationCreateManyAndReturnArgs} args - Arguments to create many Configurations.
     * @example
     * // Create many Configurations
     * const configuration = await prisma.configuration.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Configurations and only return the `id`
     * const configurationWithIdOnly = await prisma.configuration.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ConfigurationCreateManyAndReturnArgs>(args?: SelectSubset<T, ConfigurationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConfigurationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Configuration.
     * @param {ConfigurationDeleteArgs} args - Arguments to delete one Configuration.
     * @example
     * // Delete one Configuration
     * const Configuration = await prisma.configuration.delete({
     *   where: {
     *     // ... filter to delete one Configuration
     *   }
     * })
     * 
     */
    delete<T extends ConfigurationDeleteArgs>(args: SelectSubset<T, ConfigurationDeleteArgs<ExtArgs>>): Prisma__ConfigurationClient<$Result.GetResult<Prisma.$ConfigurationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Configuration.
     * @param {ConfigurationUpdateArgs} args - Arguments to update one Configuration.
     * @example
     * // Update one Configuration
     * const configuration = await prisma.configuration.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ConfigurationUpdateArgs>(args: SelectSubset<T, ConfigurationUpdateArgs<ExtArgs>>): Prisma__ConfigurationClient<$Result.GetResult<Prisma.$ConfigurationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Configurations.
     * @param {ConfigurationDeleteManyArgs} args - Arguments to filter Configurations to delete.
     * @example
     * // Delete a few Configurations
     * const { count } = await prisma.configuration.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ConfigurationDeleteManyArgs>(args?: SelectSubset<T, ConfigurationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Configurations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfigurationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Configurations
     * const configuration = await prisma.configuration.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ConfigurationUpdateManyArgs>(args: SelectSubset<T, ConfigurationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Configurations and returns the data updated in the database.
     * @param {ConfigurationUpdateManyAndReturnArgs} args - Arguments to update many Configurations.
     * @example
     * // Update many Configurations
     * const configuration = await prisma.configuration.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Configurations and only return the `id`
     * const configurationWithIdOnly = await prisma.configuration.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ConfigurationUpdateManyAndReturnArgs>(args: SelectSubset<T, ConfigurationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConfigurationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Configuration.
     * @param {ConfigurationUpsertArgs} args - Arguments to update or create a Configuration.
     * @example
     * // Update or create a Configuration
     * const configuration = await prisma.configuration.upsert({
     *   create: {
     *     // ... data to create a Configuration
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Configuration we want to update
     *   }
     * })
     */
    upsert<T extends ConfigurationUpsertArgs>(args: SelectSubset<T, ConfigurationUpsertArgs<ExtArgs>>): Prisma__ConfigurationClient<$Result.GetResult<Prisma.$ConfigurationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Configurations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfigurationCountArgs} args - Arguments to filter Configurations to count.
     * @example
     * // Count the number of Configurations
     * const count = await prisma.configuration.count({
     *   where: {
     *     // ... the filter for the Configurations we want to count
     *   }
     * })
    **/
    count<T extends ConfigurationCountArgs>(
      args?: Subset<T, ConfigurationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConfigurationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Configuration.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfigurationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ConfigurationAggregateArgs>(args: Subset<T, ConfigurationAggregateArgs>): Prisma.PrismaPromise<GetConfigurationAggregateType<T>>

    /**
     * Group by Configuration.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConfigurationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ConfigurationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConfigurationGroupByArgs['orderBy'] }
        : { orderBy?: ConfigurationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ConfigurationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConfigurationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Configuration model
   */
  readonly fields: ConfigurationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Configuration.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConfigurationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    shop<T extends ShopDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ShopDefaultArgs<ExtArgs>>): Prisma__ShopClient<$Result.GetResult<Prisma.$ShopPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Configuration model
   */
  interface ConfigurationFieldRefs {
    readonly id: FieldRef<"Configuration", 'String'>
    readonly shopId: FieldRef<"Configuration", 'String'>
    readonly productGid: FieldRef<"Configuration", 'String'>
    readonly variantGid: FieldRef<"Configuration", 'String'>
    readonly payloadJSON: FieldRef<"Configuration", 'Json'>
    readonly thumbnailUrl: FieldRef<"Configuration", 'String'>
    readonly createdBy: FieldRef<"Configuration", 'String'>
    readonly createdAt: FieldRef<"Configuration", 'DateTime'>
    readonly updatedAt: FieldRef<"Configuration", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Configuration findUnique
   */
  export type ConfigurationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Configuration
     */
    select?: ConfigurationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Configuration
     */
    omit?: ConfigurationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfigurationInclude<ExtArgs> | null
    /**
     * Filter, which Configuration to fetch.
     */
    where: ConfigurationWhereUniqueInput
  }

  /**
   * Configuration findUniqueOrThrow
   */
  export type ConfigurationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Configuration
     */
    select?: ConfigurationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Configuration
     */
    omit?: ConfigurationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfigurationInclude<ExtArgs> | null
    /**
     * Filter, which Configuration to fetch.
     */
    where: ConfigurationWhereUniqueInput
  }

  /**
   * Configuration findFirst
   */
  export type ConfigurationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Configuration
     */
    select?: ConfigurationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Configuration
     */
    omit?: ConfigurationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfigurationInclude<ExtArgs> | null
    /**
     * Filter, which Configuration to fetch.
     */
    where?: ConfigurationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Configurations to fetch.
     */
    orderBy?: ConfigurationOrderByWithRelationInput | ConfigurationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Configurations.
     */
    cursor?: ConfigurationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Configurations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Configurations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Configurations.
     */
    distinct?: ConfigurationScalarFieldEnum | ConfigurationScalarFieldEnum[]
  }

  /**
   * Configuration findFirstOrThrow
   */
  export type ConfigurationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Configuration
     */
    select?: ConfigurationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Configuration
     */
    omit?: ConfigurationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfigurationInclude<ExtArgs> | null
    /**
     * Filter, which Configuration to fetch.
     */
    where?: ConfigurationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Configurations to fetch.
     */
    orderBy?: ConfigurationOrderByWithRelationInput | ConfigurationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Configurations.
     */
    cursor?: ConfigurationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Configurations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Configurations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Configurations.
     */
    distinct?: ConfigurationScalarFieldEnum | ConfigurationScalarFieldEnum[]
  }

  /**
   * Configuration findMany
   */
  export type ConfigurationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Configuration
     */
    select?: ConfigurationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Configuration
     */
    omit?: ConfigurationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfigurationInclude<ExtArgs> | null
    /**
     * Filter, which Configurations to fetch.
     */
    where?: ConfigurationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Configurations to fetch.
     */
    orderBy?: ConfigurationOrderByWithRelationInput | ConfigurationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Configurations.
     */
    cursor?: ConfigurationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Configurations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Configurations.
     */
    skip?: number
    distinct?: ConfigurationScalarFieldEnum | ConfigurationScalarFieldEnum[]
  }

  /**
   * Configuration create
   */
  export type ConfigurationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Configuration
     */
    select?: ConfigurationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Configuration
     */
    omit?: ConfigurationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfigurationInclude<ExtArgs> | null
    /**
     * The data needed to create a Configuration.
     */
    data: XOR<ConfigurationCreateInput, ConfigurationUncheckedCreateInput>
  }

  /**
   * Configuration createMany
   */
  export type ConfigurationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Configurations.
     */
    data: ConfigurationCreateManyInput | ConfigurationCreateManyInput[]
  }

  /**
   * Configuration createManyAndReturn
   */
  export type ConfigurationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Configuration
     */
    select?: ConfigurationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Configuration
     */
    omit?: ConfigurationOmit<ExtArgs> | null
    /**
     * The data used to create many Configurations.
     */
    data: ConfigurationCreateManyInput | ConfigurationCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfigurationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Configuration update
   */
  export type ConfigurationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Configuration
     */
    select?: ConfigurationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Configuration
     */
    omit?: ConfigurationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfigurationInclude<ExtArgs> | null
    /**
     * The data needed to update a Configuration.
     */
    data: XOR<ConfigurationUpdateInput, ConfigurationUncheckedUpdateInput>
    /**
     * Choose, which Configuration to update.
     */
    where: ConfigurationWhereUniqueInput
  }

  /**
   * Configuration updateMany
   */
  export type ConfigurationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Configurations.
     */
    data: XOR<ConfigurationUpdateManyMutationInput, ConfigurationUncheckedUpdateManyInput>
    /**
     * Filter which Configurations to update
     */
    where?: ConfigurationWhereInput
    /**
     * Limit how many Configurations to update.
     */
    limit?: number
  }

  /**
   * Configuration updateManyAndReturn
   */
  export type ConfigurationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Configuration
     */
    select?: ConfigurationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Configuration
     */
    omit?: ConfigurationOmit<ExtArgs> | null
    /**
     * The data used to update Configurations.
     */
    data: XOR<ConfigurationUpdateManyMutationInput, ConfigurationUncheckedUpdateManyInput>
    /**
     * Filter which Configurations to update
     */
    where?: ConfigurationWhereInput
    /**
     * Limit how many Configurations to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfigurationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Configuration upsert
   */
  export type ConfigurationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Configuration
     */
    select?: ConfigurationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Configuration
     */
    omit?: ConfigurationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfigurationInclude<ExtArgs> | null
    /**
     * The filter to search for the Configuration to update in case it exists.
     */
    where: ConfigurationWhereUniqueInput
    /**
     * In case the Configuration found by the `where` argument doesn't exist, create a new Configuration with this data.
     */
    create: XOR<ConfigurationCreateInput, ConfigurationUncheckedCreateInput>
    /**
     * In case the Configuration was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConfigurationUpdateInput, ConfigurationUncheckedUpdateInput>
  }

  /**
   * Configuration delete
   */
  export type ConfigurationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Configuration
     */
    select?: ConfigurationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Configuration
     */
    omit?: ConfigurationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfigurationInclude<ExtArgs> | null
    /**
     * Filter which Configuration to delete.
     */
    where: ConfigurationWhereUniqueInput
  }

  /**
   * Configuration deleteMany
   */
  export type ConfigurationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Configurations to delete
     */
    where?: ConfigurationWhereInput
    /**
     * Limit how many Configurations to delete.
     */
    limit?: number
  }

  /**
   * Configuration without action
   */
  export type ConfigurationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Configuration
     */
    select?: ConfigurationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Configuration
     */
    omit?: ConfigurationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ConfigurationInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ShopScalarFieldEnum: {
    id: 'id',
    shopDomain: 'shopDomain',
    shopGid: 'shopGid',
    accessToken: 'accessToken',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ShopScalarFieldEnum = (typeof ShopScalarFieldEnum)[keyof typeof ShopScalarFieldEnum]


  export const ProductScalarFieldEnum: {
    id: 'id',
    shopId: 'shopId',
    productGid: 'productGid',
    handle: 'handle',
    defaultModelId: 'defaultModelId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ProductScalarFieldEnum = (typeof ProductScalarFieldEnum)[keyof typeof ProductScalarFieldEnum]


  export const VariantScalarFieldEnum: {
    id: 'id',
    productId: 'productId',
    variantGid: 'variantGid',
    presetId: 'presetId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type VariantScalarFieldEnum = (typeof VariantScalarFieldEnum)[keyof typeof VariantScalarFieldEnum]


  export const Model3DScalarFieldEnum: {
    id: 'id',
    shopId: 'shopId',
    name: 'name',
    glbUrl: 'glbUrl',
    materialsSchema: 'materialsSchema',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type Model3DScalarFieldEnum = (typeof Model3DScalarFieldEnum)[keyof typeof Model3DScalarFieldEnum]


  export const Design2DScalarFieldEnum: {
    id: 'id',
    shopId: 'shopId',
    name: 'name',
    svgUrl: 'svgUrl',
    mappedRegions: 'mappedRegions',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type Design2DScalarFieldEnum = (typeof Design2DScalarFieldEnum)[keyof typeof Design2DScalarFieldEnum]


  export const ColorScalarFieldEnum: {
    id: 'id',
    shopId: 'shopId',
    name: 'name',
    hex: 'hex',
    materialBindings: 'materialBindings',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ColorScalarFieldEnum = (typeof ColorScalarFieldEnum)[keyof typeof ColorScalarFieldEnum]


  export const FontScalarFieldEnum: {
    id: 'id',
    shopId: 'shopId',
    name: 'name',
    woffUrl: 'woffUrl',
    sdfMeta: 'sdfMeta',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type FontScalarFieldEnum = (typeof FontScalarFieldEnum)[keyof typeof FontScalarFieldEnum]


  export const LogoScalarFieldEnum: {
    id: 'id',
    shopId: 'shopId',
    name: 'name',
    fileUrl: 'fileUrl',
    vector: 'vector',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LogoScalarFieldEnum = (typeof LogoScalarFieldEnum)[keyof typeof LogoScalarFieldEnum]


  export const ConfigurationScalarFieldEnum: {
    id: 'id',
    shopId: 'shopId',
    productGid: 'productGid',
    variantGid: 'variantGid',
    payloadJSON: 'payloadJSON',
    thumbnailUrl: 'thumbnailUrl',
    createdBy: 'createdBy',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ConfigurationScalarFieldEnum = (typeof ConfigurationScalarFieldEnum)[keyof typeof ConfigurationScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    
  /**
   * Deep Input Types
   */


  export type ShopWhereInput = {
    AND?: ShopWhereInput | ShopWhereInput[]
    OR?: ShopWhereInput[]
    NOT?: ShopWhereInput | ShopWhereInput[]
    id?: StringFilter<"Shop"> | string
    shopDomain?: StringFilter<"Shop"> | string
    shopGid?: StringNullableFilter<"Shop"> | string | null
    accessToken?: StringNullableFilter<"Shop"> | string | null
    createdAt?: DateTimeFilter<"Shop"> | Date | string
    updatedAt?: DateTimeFilter<"Shop"> | Date | string
    products?: ProductListRelationFilter
    models3d?: Model3DListRelationFilter
    designs2d?: Design2DListRelationFilter
    colors?: ColorListRelationFilter
    fonts?: FontListRelationFilter
    logos?: LogoListRelationFilter
    configurations?: ConfigurationListRelationFilter
  }

  export type ShopOrderByWithRelationInput = {
    id?: SortOrder
    shopDomain?: SortOrder
    shopGid?: SortOrderInput | SortOrder
    accessToken?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    products?: ProductOrderByRelationAggregateInput
    models3d?: Model3DOrderByRelationAggregateInput
    designs2d?: Design2DOrderByRelationAggregateInput
    colors?: ColorOrderByRelationAggregateInput
    fonts?: FontOrderByRelationAggregateInput
    logos?: LogoOrderByRelationAggregateInput
    configurations?: ConfigurationOrderByRelationAggregateInput
  }

  export type ShopWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    shopDomain?: string
    shopGid?: string
    AND?: ShopWhereInput | ShopWhereInput[]
    OR?: ShopWhereInput[]
    NOT?: ShopWhereInput | ShopWhereInput[]
    accessToken?: StringNullableFilter<"Shop"> | string | null
    createdAt?: DateTimeFilter<"Shop"> | Date | string
    updatedAt?: DateTimeFilter<"Shop"> | Date | string
    products?: ProductListRelationFilter
    models3d?: Model3DListRelationFilter
    designs2d?: Design2DListRelationFilter
    colors?: ColorListRelationFilter
    fonts?: FontListRelationFilter
    logos?: LogoListRelationFilter
    configurations?: ConfigurationListRelationFilter
  }, "id" | "shopDomain" | "shopGid">

  export type ShopOrderByWithAggregationInput = {
    id?: SortOrder
    shopDomain?: SortOrder
    shopGid?: SortOrderInput | SortOrder
    accessToken?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ShopCountOrderByAggregateInput
    _max?: ShopMaxOrderByAggregateInput
    _min?: ShopMinOrderByAggregateInput
  }

  export type ShopScalarWhereWithAggregatesInput = {
    AND?: ShopScalarWhereWithAggregatesInput | ShopScalarWhereWithAggregatesInput[]
    OR?: ShopScalarWhereWithAggregatesInput[]
    NOT?: ShopScalarWhereWithAggregatesInput | ShopScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Shop"> | string
    shopDomain?: StringWithAggregatesFilter<"Shop"> | string
    shopGid?: StringNullableWithAggregatesFilter<"Shop"> | string | null
    accessToken?: StringNullableWithAggregatesFilter<"Shop"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Shop"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Shop"> | Date | string
  }

  export type ProductWhereInput = {
    AND?: ProductWhereInput | ProductWhereInput[]
    OR?: ProductWhereInput[]
    NOT?: ProductWhereInput | ProductWhereInput[]
    id?: StringFilter<"Product"> | string
    shopId?: StringFilter<"Product"> | string
    productGid?: StringFilter<"Product"> | string
    handle?: StringFilter<"Product"> | string
    defaultModelId?: StringNullableFilter<"Product"> | string | null
    createdAt?: DateTimeFilter<"Product"> | Date | string
    updatedAt?: DateTimeFilter<"Product"> | Date | string
    defaultModel?: XOR<Model3DNullableScalarRelationFilter, Model3DWhereInput> | null
    shop?: XOR<ShopScalarRelationFilter, ShopWhereInput>
    variants?: VariantListRelationFilter
  }

  export type ProductOrderByWithRelationInput = {
    id?: SortOrder
    shopId?: SortOrder
    productGid?: SortOrder
    handle?: SortOrder
    defaultModelId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    defaultModel?: Model3DOrderByWithRelationInput
    shop?: ShopOrderByWithRelationInput
    variants?: VariantOrderByRelationAggregateInput
  }

  export type ProductWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    productGid?: string
    AND?: ProductWhereInput | ProductWhereInput[]
    OR?: ProductWhereInput[]
    NOT?: ProductWhereInput | ProductWhereInput[]
    shopId?: StringFilter<"Product"> | string
    handle?: StringFilter<"Product"> | string
    defaultModelId?: StringNullableFilter<"Product"> | string | null
    createdAt?: DateTimeFilter<"Product"> | Date | string
    updatedAt?: DateTimeFilter<"Product"> | Date | string
    defaultModel?: XOR<Model3DNullableScalarRelationFilter, Model3DWhereInput> | null
    shop?: XOR<ShopScalarRelationFilter, ShopWhereInput>
    variants?: VariantListRelationFilter
  }, "id" | "productGid">

  export type ProductOrderByWithAggregationInput = {
    id?: SortOrder
    shopId?: SortOrder
    productGid?: SortOrder
    handle?: SortOrder
    defaultModelId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ProductCountOrderByAggregateInput
    _max?: ProductMaxOrderByAggregateInput
    _min?: ProductMinOrderByAggregateInput
  }

  export type ProductScalarWhereWithAggregatesInput = {
    AND?: ProductScalarWhereWithAggregatesInput | ProductScalarWhereWithAggregatesInput[]
    OR?: ProductScalarWhereWithAggregatesInput[]
    NOT?: ProductScalarWhereWithAggregatesInput | ProductScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Product"> | string
    shopId?: StringWithAggregatesFilter<"Product"> | string
    productGid?: StringWithAggregatesFilter<"Product"> | string
    handle?: StringWithAggregatesFilter<"Product"> | string
    defaultModelId?: StringNullableWithAggregatesFilter<"Product"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Product"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Product"> | Date | string
  }

  export type VariantWhereInput = {
    AND?: VariantWhereInput | VariantWhereInput[]
    OR?: VariantWhereInput[]
    NOT?: VariantWhereInput | VariantWhereInput[]
    id?: StringFilter<"Variant"> | string
    productId?: StringFilter<"Variant"> | string
    variantGid?: StringFilter<"Variant"> | string
    presetId?: StringNullableFilter<"Variant"> | string | null
    createdAt?: DateTimeFilter<"Variant"> | Date | string
    updatedAt?: DateTimeFilter<"Variant"> | Date | string
    product?: XOR<ProductScalarRelationFilter, ProductWhereInput>
  }

  export type VariantOrderByWithRelationInput = {
    id?: SortOrder
    productId?: SortOrder
    variantGid?: SortOrder
    presetId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    product?: ProductOrderByWithRelationInput
  }

  export type VariantWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    variantGid?: string
    AND?: VariantWhereInput | VariantWhereInput[]
    OR?: VariantWhereInput[]
    NOT?: VariantWhereInput | VariantWhereInput[]
    productId?: StringFilter<"Variant"> | string
    presetId?: StringNullableFilter<"Variant"> | string | null
    createdAt?: DateTimeFilter<"Variant"> | Date | string
    updatedAt?: DateTimeFilter<"Variant"> | Date | string
    product?: XOR<ProductScalarRelationFilter, ProductWhereInput>
  }, "id" | "variantGid">

  export type VariantOrderByWithAggregationInput = {
    id?: SortOrder
    productId?: SortOrder
    variantGid?: SortOrder
    presetId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: VariantCountOrderByAggregateInput
    _max?: VariantMaxOrderByAggregateInput
    _min?: VariantMinOrderByAggregateInput
  }

  export type VariantScalarWhereWithAggregatesInput = {
    AND?: VariantScalarWhereWithAggregatesInput | VariantScalarWhereWithAggregatesInput[]
    OR?: VariantScalarWhereWithAggregatesInput[]
    NOT?: VariantScalarWhereWithAggregatesInput | VariantScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Variant"> | string
    productId?: StringWithAggregatesFilter<"Variant"> | string
    variantGid?: StringWithAggregatesFilter<"Variant"> | string
    presetId?: StringNullableWithAggregatesFilter<"Variant"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Variant"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Variant"> | Date | string
  }

  export type Model3DWhereInput = {
    AND?: Model3DWhereInput | Model3DWhereInput[]
    OR?: Model3DWhereInput[]
    NOT?: Model3DWhereInput | Model3DWhereInput[]
    id?: StringFilter<"Model3D"> | string
    shopId?: StringFilter<"Model3D"> | string
    name?: StringFilter<"Model3D"> | string
    glbUrl?: StringFilter<"Model3D"> | string
    materialsSchema?: JsonFilter<"Model3D">
    createdAt?: DateTimeFilter<"Model3D"> | Date | string
    updatedAt?: DateTimeFilter<"Model3D"> | Date | string
    shop?: XOR<ShopScalarRelationFilter, ShopWhereInput>
    productsDefaulting?: ProductListRelationFilter
  }

  export type Model3DOrderByWithRelationInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    glbUrl?: SortOrder
    materialsSchema?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    shop?: ShopOrderByWithRelationInput
    productsDefaulting?: ProductOrderByRelationAggregateInput
  }

  export type Model3DWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: Model3DWhereInput | Model3DWhereInput[]
    OR?: Model3DWhereInput[]
    NOT?: Model3DWhereInput | Model3DWhereInput[]
    shopId?: StringFilter<"Model3D"> | string
    name?: StringFilter<"Model3D"> | string
    glbUrl?: StringFilter<"Model3D"> | string
    materialsSchema?: JsonFilter<"Model3D">
    createdAt?: DateTimeFilter<"Model3D"> | Date | string
    updatedAt?: DateTimeFilter<"Model3D"> | Date | string
    shop?: XOR<ShopScalarRelationFilter, ShopWhereInput>
    productsDefaulting?: ProductListRelationFilter
  }, "id">

  export type Model3DOrderByWithAggregationInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    glbUrl?: SortOrder
    materialsSchema?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: Model3DCountOrderByAggregateInput
    _max?: Model3DMaxOrderByAggregateInput
    _min?: Model3DMinOrderByAggregateInput
  }

  export type Model3DScalarWhereWithAggregatesInput = {
    AND?: Model3DScalarWhereWithAggregatesInput | Model3DScalarWhereWithAggregatesInput[]
    OR?: Model3DScalarWhereWithAggregatesInput[]
    NOT?: Model3DScalarWhereWithAggregatesInput | Model3DScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Model3D"> | string
    shopId?: StringWithAggregatesFilter<"Model3D"> | string
    name?: StringWithAggregatesFilter<"Model3D"> | string
    glbUrl?: StringWithAggregatesFilter<"Model3D"> | string
    materialsSchema?: JsonWithAggregatesFilter<"Model3D">
    createdAt?: DateTimeWithAggregatesFilter<"Model3D"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Model3D"> | Date | string
  }

  export type Design2DWhereInput = {
    AND?: Design2DWhereInput | Design2DWhereInput[]
    OR?: Design2DWhereInput[]
    NOT?: Design2DWhereInput | Design2DWhereInput[]
    id?: StringFilter<"Design2D"> | string
    shopId?: StringFilter<"Design2D"> | string
    name?: StringFilter<"Design2D"> | string
    svgUrl?: StringFilter<"Design2D"> | string
    mappedRegions?: JsonFilter<"Design2D">
    createdAt?: DateTimeFilter<"Design2D"> | Date | string
    updatedAt?: DateTimeFilter<"Design2D"> | Date | string
    shop?: XOR<ShopScalarRelationFilter, ShopWhereInput>
  }

  export type Design2DOrderByWithRelationInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    svgUrl?: SortOrder
    mappedRegions?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    shop?: ShopOrderByWithRelationInput
  }

  export type Design2DWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: Design2DWhereInput | Design2DWhereInput[]
    OR?: Design2DWhereInput[]
    NOT?: Design2DWhereInput | Design2DWhereInput[]
    shopId?: StringFilter<"Design2D"> | string
    name?: StringFilter<"Design2D"> | string
    svgUrl?: StringFilter<"Design2D"> | string
    mappedRegions?: JsonFilter<"Design2D">
    createdAt?: DateTimeFilter<"Design2D"> | Date | string
    updatedAt?: DateTimeFilter<"Design2D"> | Date | string
    shop?: XOR<ShopScalarRelationFilter, ShopWhereInput>
  }, "id">

  export type Design2DOrderByWithAggregationInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    svgUrl?: SortOrder
    mappedRegions?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: Design2DCountOrderByAggregateInput
    _max?: Design2DMaxOrderByAggregateInput
    _min?: Design2DMinOrderByAggregateInput
  }

  export type Design2DScalarWhereWithAggregatesInput = {
    AND?: Design2DScalarWhereWithAggregatesInput | Design2DScalarWhereWithAggregatesInput[]
    OR?: Design2DScalarWhereWithAggregatesInput[]
    NOT?: Design2DScalarWhereWithAggregatesInput | Design2DScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Design2D"> | string
    shopId?: StringWithAggregatesFilter<"Design2D"> | string
    name?: StringWithAggregatesFilter<"Design2D"> | string
    svgUrl?: StringWithAggregatesFilter<"Design2D"> | string
    mappedRegions?: JsonWithAggregatesFilter<"Design2D">
    createdAt?: DateTimeWithAggregatesFilter<"Design2D"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Design2D"> | Date | string
  }

  export type ColorWhereInput = {
    AND?: ColorWhereInput | ColorWhereInput[]
    OR?: ColorWhereInput[]
    NOT?: ColorWhereInput | ColorWhereInput[]
    id?: StringFilter<"Color"> | string
    shopId?: StringFilter<"Color"> | string
    name?: StringFilter<"Color"> | string
    hex?: StringFilter<"Color"> | string
    materialBindings?: JsonFilter<"Color">
    createdAt?: DateTimeFilter<"Color"> | Date | string
    updatedAt?: DateTimeFilter<"Color"> | Date | string
    shop?: XOR<ShopScalarRelationFilter, ShopWhereInput>
  }

  export type ColorOrderByWithRelationInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    hex?: SortOrder
    materialBindings?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    shop?: ShopOrderByWithRelationInput
  }

  export type ColorWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ColorWhereInput | ColorWhereInput[]
    OR?: ColorWhereInput[]
    NOT?: ColorWhereInput | ColorWhereInput[]
    shopId?: StringFilter<"Color"> | string
    name?: StringFilter<"Color"> | string
    hex?: StringFilter<"Color"> | string
    materialBindings?: JsonFilter<"Color">
    createdAt?: DateTimeFilter<"Color"> | Date | string
    updatedAt?: DateTimeFilter<"Color"> | Date | string
    shop?: XOR<ShopScalarRelationFilter, ShopWhereInput>
  }, "id">

  export type ColorOrderByWithAggregationInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    hex?: SortOrder
    materialBindings?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ColorCountOrderByAggregateInput
    _max?: ColorMaxOrderByAggregateInput
    _min?: ColorMinOrderByAggregateInput
  }

  export type ColorScalarWhereWithAggregatesInput = {
    AND?: ColorScalarWhereWithAggregatesInput | ColorScalarWhereWithAggregatesInput[]
    OR?: ColorScalarWhereWithAggregatesInput[]
    NOT?: ColorScalarWhereWithAggregatesInput | ColorScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Color"> | string
    shopId?: StringWithAggregatesFilter<"Color"> | string
    name?: StringWithAggregatesFilter<"Color"> | string
    hex?: StringWithAggregatesFilter<"Color"> | string
    materialBindings?: JsonWithAggregatesFilter<"Color">
    createdAt?: DateTimeWithAggregatesFilter<"Color"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Color"> | Date | string
  }

  export type FontWhereInput = {
    AND?: FontWhereInput | FontWhereInput[]
    OR?: FontWhereInput[]
    NOT?: FontWhereInput | FontWhereInput[]
    id?: StringFilter<"Font"> | string
    shopId?: StringFilter<"Font"> | string
    name?: StringFilter<"Font"> | string
    woffUrl?: StringFilter<"Font"> | string
    sdfMeta?: JsonNullableFilter<"Font">
    createdAt?: DateTimeFilter<"Font"> | Date | string
    updatedAt?: DateTimeFilter<"Font"> | Date | string
    shop?: XOR<ShopScalarRelationFilter, ShopWhereInput>
  }

  export type FontOrderByWithRelationInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    woffUrl?: SortOrder
    sdfMeta?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    shop?: ShopOrderByWithRelationInput
  }

  export type FontWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: FontWhereInput | FontWhereInput[]
    OR?: FontWhereInput[]
    NOT?: FontWhereInput | FontWhereInput[]
    shopId?: StringFilter<"Font"> | string
    name?: StringFilter<"Font"> | string
    woffUrl?: StringFilter<"Font"> | string
    sdfMeta?: JsonNullableFilter<"Font">
    createdAt?: DateTimeFilter<"Font"> | Date | string
    updatedAt?: DateTimeFilter<"Font"> | Date | string
    shop?: XOR<ShopScalarRelationFilter, ShopWhereInput>
  }, "id">

  export type FontOrderByWithAggregationInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    woffUrl?: SortOrder
    sdfMeta?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: FontCountOrderByAggregateInput
    _max?: FontMaxOrderByAggregateInput
    _min?: FontMinOrderByAggregateInput
  }

  export type FontScalarWhereWithAggregatesInput = {
    AND?: FontScalarWhereWithAggregatesInput | FontScalarWhereWithAggregatesInput[]
    OR?: FontScalarWhereWithAggregatesInput[]
    NOT?: FontScalarWhereWithAggregatesInput | FontScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Font"> | string
    shopId?: StringWithAggregatesFilter<"Font"> | string
    name?: StringWithAggregatesFilter<"Font"> | string
    woffUrl?: StringWithAggregatesFilter<"Font"> | string
    sdfMeta?: JsonNullableWithAggregatesFilter<"Font">
    createdAt?: DateTimeWithAggregatesFilter<"Font"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Font"> | Date | string
  }

  export type LogoWhereInput = {
    AND?: LogoWhereInput | LogoWhereInput[]
    OR?: LogoWhereInput[]
    NOT?: LogoWhereInput | LogoWhereInput[]
    id?: StringFilter<"Logo"> | string
    shopId?: StringFilter<"Logo"> | string
    name?: StringFilter<"Logo"> | string
    fileUrl?: StringFilter<"Logo"> | string
    vector?: BoolFilter<"Logo"> | boolean
    createdAt?: DateTimeFilter<"Logo"> | Date | string
    updatedAt?: DateTimeFilter<"Logo"> | Date | string
    shop?: XOR<ShopScalarRelationFilter, ShopWhereInput>
  }

  export type LogoOrderByWithRelationInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    fileUrl?: SortOrder
    vector?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    shop?: ShopOrderByWithRelationInput
  }

  export type LogoWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: LogoWhereInput | LogoWhereInput[]
    OR?: LogoWhereInput[]
    NOT?: LogoWhereInput | LogoWhereInput[]
    shopId?: StringFilter<"Logo"> | string
    name?: StringFilter<"Logo"> | string
    fileUrl?: StringFilter<"Logo"> | string
    vector?: BoolFilter<"Logo"> | boolean
    createdAt?: DateTimeFilter<"Logo"> | Date | string
    updatedAt?: DateTimeFilter<"Logo"> | Date | string
    shop?: XOR<ShopScalarRelationFilter, ShopWhereInput>
  }, "id">

  export type LogoOrderByWithAggregationInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    fileUrl?: SortOrder
    vector?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: LogoCountOrderByAggregateInput
    _max?: LogoMaxOrderByAggregateInput
    _min?: LogoMinOrderByAggregateInput
  }

  export type LogoScalarWhereWithAggregatesInput = {
    AND?: LogoScalarWhereWithAggregatesInput | LogoScalarWhereWithAggregatesInput[]
    OR?: LogoScalarWhereWithAggregatesInput[]
    NOT?: LogoScalarWhereWithAggregatesInput | LogoScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Logo"> | string
    shopId?: StringWithAggregatesFilter<"Logo"> | string
    name?: StringWithAggregatesFilter<"Logo"> | string
    fileUrl?: StringWithAggregatesFilter<"Logo"> | string
    vector?: BoolWithAggregatesFilter<"Logo"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Logo"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Logo"> | Date | string
  }

  export type ConfigurationWhereInput = {
    AND?: ConfigurationWhereInput | ConfigurationWhereInput[]
    OR?: ConfigurationWhereInput[]
    NOT?: ConfigurationWhereInput | ConfigurationWhereInput[]
    id?: StringFilter<"Configuration"> | string
    shopId?: StringFilter<"Configuration"> | string
    productGid?: StringFilter<"Configuration"> | string
    variantGid?: StringNullableFilter<"Configuration"> | string | null
    payloadJSON?: JsonFilter<"Configuration">
    thumbnailUrl?: StringNullableFilter<"Configuration"> | string | null
    createdBy?: StringNullableFilter<"Configuration"> | string | null
    createdAt?: DateTimeFilter<"Configuration"> | Date | string
    updatedAt?: DateTimeFilter<"Configuration"> | Date | string
    shop?: XOR<ShopScalarRelationFilter, ShopWhereInput>
  }

  export type ConfigurationOrderByWithRelationInput = {
    id?: SortOrder
    shopId?: SortOrder
    productGid?: SortOrder
    variantGid?: SortOrderInput | SortOrder
    payloadJSON?: SortOrder
    thumbnailUrl?: SortOrderInput | SortOrder
    createdBy?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    shop?: ShopOrderByWithRelationInput
  }

  export type ConfigurationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ConfigurationWhereInput | ConfigurationWhereInput[]
    OR?: ConfigurationWhereInput[]
    NOT?: ConfigurationWhereInput | ConfigurationWhereInput[]
    shopId?: StringFilter<"Configuration"> | string
    productGid?: StringFilter<"Configuration"> | string
    variantGid?: StringNullableFilter<"Configuration"> | string | null
    payloadJSON?: JsonFilter<"Configuration">
    thumbnailUrl?: StringNullableFilter<"Configuration"> | string | null
    createdBy?: StringNullableFilter<"Configuration"> | string | null
    createdAt?: DateTimeFilter<"Configuration"> | Date | string
    updatedAt?: DateTimeFilter<"Configuration"> | Date | string
    shop?: XOR<ShopScalarRelationFilter, ShopWhereInput>
  }, "id">

  export type ConfigurationOrderByWithAggregationInput = {
    id?: SortOrder
    shopId?: SortOrder
    productGid?: SortOrder
    variantGid?: SortOrderInput | SortOrder
    payloadJSON?: SortOrder
    thumbnailUrl?: SortOrderInput | SortOrder
    createdBy?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ConfigurationCountOrderByAggregateInput
    _max?: ConfigurationMaxOrderByAggregateInput
    _min?: ConfigurationMinOrderByAggregateInput
  }

  export type ConfigurationScalarWhereWithAggregatesInput = {
    AND?: ConfigurationScalarWhereWithAggregatesInput | ConfigurationScalarWhereWithAggregatesInput[]
    OR?: ConfigurationScalarWhereWithAggregatesInput[]
    NOT?: ConfigurationScalarWhereWithAggregatesInput | ConfigurationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Configuration"> | string
    shopId?: StringWithAggregatesFilter<"Configuration"> | string
    productGid?: StringWithAggregatesFilter<"Configuration"> | string
    variantGid?: StringNullableWithAggregatesFilter<"Configuration"> | string | null
    payloadJSON?: JsonWithAggregatesFilter<"Configuration">
    thumbnailUrl?: StringNullableWithAggregatesFilter<"Configuration"> | string | null
    createdBy?: StringNullableWithAggregatesFilter<"Configuration"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Configuration"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Configuration"> | Date | string
  }

  export type ShopCreateInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    products?: ProductCreateNestedManyWithoutShopInput
    models3d?: Model3DCreateNestedManyWithoutShopInput
    designs2d?: Design2DCreateNestedManyWithoutShopInput
    colors?: ColorCreateNestedManyWithoutShopInput
    fonts?: FontCreateNestedManyWithoutShopInput
    logos?: LogoCreateNestedManyWithoutShopInput
    configurations?: ConfigurationCreateNestedManyWithoutShopInput
  }

  export type ShopUncheckedCreateInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    products?: ProductUncheckedCreateNestedManyWithoutShopInput
    models3d?: Model3DUncheckedCreateNestedManyWithoutShopInput
    designs2d?: Design2DUncheckedCreateNestedManyWithoutShopInput
    colors?: ColorUncheckedCreateNestedManyWithoutShopInput
    fonts?: FontUncheckedCreateNestedManyWithoutShopInput
    logos?: LogoUncheckedCreateNestedManyWithoutShopInput
    configurations?: ConfigurationUncheckedCreateNestedManyWithoutShopInput
  }

  export type ShopUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    products?: ProductUpdateManyWithoutShopNestedInput
    models3d?: Model3DUpdateManyWithoutShopNestedInput
    designs2d?: Design2DUpdateManyWithoutShopNestedInput
    colors?: ColorUpdateManyWithoutShopNestedInput
    fonts?: FontUpdateManyWithoutShopNestedInput
    logos?: LogoUpdateManyWithoutShopNestedInput
    configurations?: ConfigurationUpdateManyWithoutShopNestedInput
  }

  export type ShopUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    products?: ProductUncheckedUpdateManyWithoutShopNestedInput
    models3d?: Model3DUncheckedUpdateManyWithoutShopNestedInput
    designs2d?: Design2DUncheckedUpdateManyWithoutShopNestedInput
    colors?: ColorUncheckedUpdateManyWithoutShopNestedInput
    fonts?: FontUncheckedUpdateManyWithoutShopNestedInput
    logos?: LogoUncheckedUpdateManyWithoutShopNestedInput
    configurations?: ConfigurationUncheckedUpdateManyWithoutShopNestedInput
  }

  export type ShopCreateManyInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ShopUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ShopUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProductCreateInput = {
    id?: string
    productGid: string
    handle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    defaultModel?: Model3DCreateNestedOneWithoutProductsDefaultingInput
    shop: ShopCreateNestedOneWithoutProductsInput
    variants?: VariantCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateInput = {
    id?: string
    shopId: string
    productGid: string
    handle: string
    defaultModelId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    variants?: VariantUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    handle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    defaultModel?: Model3DUpdateOneWithoutProductsDefaultingNestedInput
    shop?: ShopUpdateOneRequiredWithoutProductsNestedInput
    variants?: VariantUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    handle?: StringFieldUpdateOperationsInput | string
    defaultModelId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    variants?: VariantUncheckedUpdateManyWithoutProductNestedInput
  }

  export type ProductCreateManyInput = {
    id?: string
    shopId: string
    productGid: string
    handle: string
    defaultModelId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProductUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    handle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProductUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    handle?: StringFieldUpdateOperationsInput | string
    defaultModelId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VariantCreateInput = {
    id?: string
    variantGid: string
    presetId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    product: ProductCreateNestedOneWithoutVariantsInput
  }

  export type VariantUncheckedCreateInput = {
    id?: string
    productId: string
    variantGid: string
    presetId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VariantUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    variantGid?: StringFieldUpdateOperationsInput | string
    presetId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    product?: ProductUpdateOneRequiredWithoutVariantsNestedInput
  }

  export type VariantUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    variantGid?: StringFieldUpdateOperationsInput | string
    presetId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VariantCreateManyInput = {
    id?: string
    productId: string
    variantGid: string
    presetId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VariantUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    variantGid?: StringFieldUpdateOperationsInput | string
    presetId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VariantUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    variantGid?: StringFieldUpdateOperationsInput | string
    presetId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type Model3DCreateInput = {
    id?: string
    name: string
    glbUrl: string
    materialsSchema: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    shop: ShopCreateNestedOneWithoutModels3dInput
    productsDefaulting?: ProductCreateNestedManyWithoutDefaultModelInput
  }

  export type Model3DUncheckedCreateInput = {
    id?: string
    shopId: string
    name: string
    glbUrl: string
    materialsSchema: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    productsDefaulting?: ProductUncheckedCreateNestedManyWithoutDefaultModelInput
  }

  export type Model3DUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    glbUrl?: StringFieldUpdateOperationsInput | string
    materialsSchema?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shop?: ShopUpdateOneRequiredWithoutModels3dNestedInput
    productsDefaulting?: ProductUpdateManyWithoutDefaultModelNestedInput
  }

  export type Model3DUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    glbUrl?: StringFieldUpdateOperationsInput | string
    materialsSchema?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    productsDefaulting?: ProductUncheckedUpdateManyWithoutDefaultModelNestedInput
  }

  export type Model3DCreateManyInput = {
    id?: string
    shopId: string
    name: string
    glbUrl: string
    materialsSchema: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type Model3DUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    glbUrl?: StringFieldUpdateOperationsInput | string
    materialsSchema?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type Model3DUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    glbUrl?: StringFieldUpdateOperationsInput | string
    materialsSchema?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type Design2DCreateInput = {
    id?: string
    name: string
    svgUrl: string
    mappedRegions: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    shop: ShopCreateNestedOneWithoutDesigns2dInput
  }

  export type Design2DUncheckedCreateInput = {
    id?: string
    shopId: string
    name: string
    svgUrl: string
    mappedRegions: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type Design2DUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    svgUrl?: StringFieldUpdateOperationsInput | string
    mappedRegions?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shop?: ShopUpdateOneRequiredWithoutDesigns2dNestedInput
  }

  export type Design2DUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    svgUrl?: StringFieldUpdateOperationsInput | string
    mappedRegions?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type Design2DCreateManyInput = {
    id?: string
    shopId: string
    name: string
    svgUrl: string
    mappedRegions: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type Design2DUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    svgUrl?: StringFieldUpdateOperationsInput | string
    mappedRegions?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type Design2DUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    svgUrl?: StringFieldUpdateOperationsInput | string
    mappedRegions?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ColorCreateInput = {
    id?: string
    name: string
    hex: string
    materialBindings: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    shop: ShopCreateNestedOneWithoutColorsInput
  }

  export type ColorUncheckedCreateInput = {
    id?: string
    shopId: string
    name: string
    hex: string
    materialBindings: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ColorUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    hex?: StringFieldUpdateOperationsInput | string
    materialBindings?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shop?: ShopUpdateOneRequiredWithoutColorsNestedInput
  }

  export type ColorUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    hex?: StringFieldUpdateOperationsInput | string
    materialBindings?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ColorCreateManyInput = {
    id?: string
    shopId: string
    name: string
    hex: string
    materialBindings: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ColorUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    hex?: StringFieldUpdateOperationsInput | string
    materialBindings?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ColorUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    hex?: StringFieldUpdateOperationsInput | string
    materialBindings?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FontCreateInput = {
    id?: string
    name: string
    woffUrl: string
    sdfMeta?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    shop: ShopCreateNestedOneWithoutFontsInput
  }

  export type FontUncheckedCreateInput = {
    id?: string
    shopId: string
    name: string
    woffUrl: string
    sdfMeta?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FontUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    woffUrl?: StringFieldUpdateOperationsInput | string
    sdfMeta?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shop?: ShopUpdateOneRequiredWithoutFontsNestedInput
  }

  export type FontUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    woffUrl?: StringFieldUpdateOperationsInput | string
    sdfMeta?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FontCreateManyInput = {
    id?: string
    shopId: string
    name: string
    woffUrl: string
    sdfMeta?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FontUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    woffUrl?: StringFieldUpdateOperationsInput | string
    sdfMeta?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FontUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    woffUrl?: StringFieldUpdateOperationsInput | string
    sdfMeta?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LogoCreateInput = {
    id?: string
    name: string
    fileUrl: string
    vector?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    shop: ShopCreateNestedOneWithoutLogosInput
  }

  export type LogoUncheckedCreateInput = {
    id?: string
    shopId: string
    name: string
    fileUrl: string
    vector?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LogoUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    vector?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shop?: ShopUpdateOneRequiredWithoutLogosNestedInput
  }

  export type LogoUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    vector?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LogoCreateManyInput = {
    id?: string
    shopId: string
    name: string
    fileUrl: string
    vector?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LogoUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    vector?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LogoUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    vector?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConfigurationCreateInput = {
    id?: string
    productGid: string
    variantGid?: string | null
    payloadJSON: JsonNullValueInput | InputJsonValue
    thumbnailUrl?: string | null
    createdBy?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    shop: ShopCreateNestedOneWithoutConfigurationsInput
  }

  export type ConfigurationUncheckedCreateInput = {
    id?: string
    shopId: string
    productGid: string
    variantGid?: string | null
    payloadJSON: JsonNullValueInput | InputJsonValue
    thumbnailUrl?: string | null
    createdBy?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ConfigurationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    variantGid?: NullableStringFieldUpdateOperationsInput | string | null
    payloadJSON?: JsonNullValueInput | InputJsonValue
    thumbnailUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shop?: ShopUpdateOneRequiredWithoutConfigurationsNestedInput
  }

  export type ConfigurationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    variantGid?: NullableStringFieldUpdateOperationsInput | string | null
    payloadJSON?: JsonNullValueInput | InputJsonValue
    thumbnailUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConfigurationCreateManyInput = {
    id?: string
    shopId: string
    productGid: string
    variantGid?: string | null
    payloadJSON: JsonNullValueInput | InputJsonValue
    thumbnailUrl?: string | null
    createdBy?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ConfigurationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    variantGid?: NullableStringFieldUpdateOperationsInput | string | null
    payloadJSON?: JsonNullValueInput | InputJsonValue
    thumbnailUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConfigurationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    variantGid?: NullableStringFieldUpdateOperationsInput | string | null
    payloadJSON?: JsonNullValueInput | InputJsonValue
    thumbnailUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type ProductListRelationFilter = {
    every?: ProductWhereInput
    some?: ProductWhereInput
    none?: ProductWhereInput
  }

  export type Model3DListRelationFilter = {
    every?: Model3DWhereInput
    some?: Model3DWhereInput
    none?: Model3DWhereInput
  }

  export type Design2DListRelationFilter = {
    every?: Design2DWhereInput
    some?: Design2DWhereInput
    none?: Design2DWhereInput
  }

  export type ColorListRelationFilter = {
    every?: ColorWhereInput
    some?: ColorWhereInput
    none?: ColorWhereInput
  }

  export type FontListRelationFilter = {
    every?: FontWhereInput
    some?: FontWhereInput
    none?: FontWhereInput
  }

  export type LogoListRelationFilter = {
    every?: LogoWhereInput
    some?: LogoWhereInput
    none?: LogoWhereInput
  }

  export type ConfigurationListRelationFilter = {
    every?: ConfigurationWhereInput
    some?: ConfigurationWhereInput
    none?: ConfigurationWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ProductOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type Model3DOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type Design2DOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ColorOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type FontOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LogoOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ConfigurationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ShopCountOrderByAggregateInput = {
    id?: SortOrder
    shopDomain?: SortOrder
    shopGid?: SortOrder
    accessToken?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ShopMaxOrderByAggregateInput = {
    id?: SortOrder
    shopDomain?: SortOrder
    shopGid?: SortOrder
    accessToken?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ShopMinOrderByAggregateInput = {
    id?: SortOrder
    shopDomain?: SortOrder
    shopGid?: SortOrder
    accessToken?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type Model3DNullableScalarRelationFilter = {
    is?: Model3DWhereInput | null
    isNot?: Model3DWhereInput | null
  }

  export type ShopScalarRelationFilter = {
    is?: ShopWhereInput
    isNot?: ShopWhereInput
  }

  export type VariantListRelationFilter = {
    every?: VariantWhereInput
    some?: VariantWhereInput
    none?: VariantWhereInput
  }

  export type VariantOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ProductCountOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    productGid?: SortOrder
    handle?: SortOrder
    defaultModelId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProductMaxOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    productGid?: SortOrder
    handle?: SortOrder
    defaultModelId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProductMinOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    productGid?: SortOrder
    handle?: SortOrder
    defaultModelId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProductScalarRelationFilter = {
    is?: ProductWhereInput
    isNot?: ProductWhereInput
  }

  export type VariantCountOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    variantGid?: SortOrder
    presetId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VariantMaxOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    variantGid?: SortOrder
    presetId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VariantMinOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    variantGid?: SortOrder
    presetId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type Model3DCountOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    glbUrl?: SortOrder
    materialsSchema?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type Model3DMaxOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    glbUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type Model3DMinOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    glbUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type Design2DCountOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    svgUrl?: SortOrder
    mappedRegions?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type Design2DMaxOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    svgUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type Design2DMinOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    svgUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ColorCountOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    hex?: SortOrder
    materialBindings?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ColorMaxOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    hex?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ColorMinOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    hex?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type FontCountOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    woffUrl?: SortOrder
    sdfMeta?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FontMaxOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    woffUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FontMinOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    woffUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type LogoCountOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    fileUrl?: SortOrder
    vector?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LogoMaxOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    fileUrl?: SortOrder
    vector?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LogoMinOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    fileUrl?: SortOrder
    vector?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type ConfigurationCountOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    productGid?: SortOrder
    variantGid?: SortOrder
    payloadJSON?: SortOrder
    thumbnailUrl?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ConfigurationMaxOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    productGid?: SortOrder
    variantGid?: SortOrder
    thumbnailUrl?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ConfigurationMinOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    productGid?: SortOrder
    variantGid?: SortOrder
    thumbnailUrl?: SortOrder
    createdBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProductCreateNestedManyWithoutShopInput = {
    create?: XOR<ProductCreateWithoutShopInput, ProductUncheckedCreateWithoutShopInput> | ProductCreateWithoutShopInput[] | ProductUncheckedCreateWithoutShopInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutShopInput | ProductCreateOrConnectWithoutShopInput[]
    createMany?: ProductCreateManyShopInputEnvelope
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
  }

  export type Model3DCreateNestedManyWithoutShopInput = {
    create?: XOR<Model3DCreateWithoutShopInput, Model3DUncheckedCreateWithoutShopInput> | Model3DCreateWithoutShopInput[] | Model3DUncheckedCreateWithoutShopInput[]
    connectOrCreate?: Model3DCreateOrConnectWithoutShopInput | Model3DCreateOrConnectWithoutShopInput[]
    createMany?: Model3DCreateManyShopInputEnvelope
    connect?: Model3DWhereUniqueInput | Model3DWhereUniqueInput[]
  }

  export type Design2DCreateNestedManyWithoutShopInput = {
    create?: XOR<Design2DCreateWithoutShopInput, Design2DUncheckedCreateWithoutShopInput> | Design2DCreateWithoutShopInput[] | Design2DUncheckedCreateWithoutShopInput[]
    connectOrCreate?: Design2DCreateOrConnectWithoutShopInput | Design2DCreateOrConnectWithoutShopInput[]
    createMany?: Design2DCreateManyShopInputEnvelope
    connect?: Design2DWhereUniqueInput | Design2DWhereUniqueInput[]
  }

  export type ColorCreateNestedManyWithoutShopInput = {
    create?: XOR<ColorCreateWithoutShopInput, ColorUncheckedCreateWithoutShopInput> | ColorCreateWithoutShopInput[] | ColorUncheckedCreateWithoutShopInput[]
    connectOrCreate?: ColorCreateOrConnectWithoutShopInput | ColorCreateOrConnectWithoutShopInput[]
    createMany?: ColorCreateManyShopInputEnvelope
    connect?: ColorWhereUniqueInput | ColorWhereUniqueInput[]
  }

  export type FontCreateNestedManyWithoutShopInput = {
    create?: XOR<FontCreateWithoutShopInput, FontUncheckedCreateWithoutShopInput> | FontCreateWithoutShopInput[] | FontUncheckedCreateWithoutShopInput[]
    connectOrCreate?: FontCreateOrConnectWithoutShopInput | FontCreateOrConnectWithoutShopInput[]
    createMany?: FontCreateManyShopInputEnvelope
    connect?: FontWhereUniqueInput | FontWhereUniqueInput[]
  }

  export type LogoCreateNestedManyWithoutShopInput = {
    create?: XOR<LogoCreateWithoutShopInput, LogoUncheckedCreateWithoutShopInput> | LogoCreateWithoutShopInput[] | LogoUncheckedCreateWithoutShopInput[]
    connectOrCreate?: LogoCreateOrConnectWithoutShopInput | LogoCreateOrConnectWithoutShopInput[]
    createMany?: LogoCreateManyShopInputEnvelope
    connect?: LogoWhereUniqueInput | LogoWhereUniqueInput[]
  }

  export type ConfigurationCreateNestedManyWithoutShopInput = {
    create?: XOR<ConfigurationCreateWithoutShopInput, ConfigurationUncheckedCreateWithoutShopInput> | ConfigurationCreateWithoutShopInput[] | ConfigurationUncheckedCreateWithoutShopInput[]
    connectOrCreate?: ConfigurationCreateOrConnectWithoutShopInput | ConfigurationCreateOrConnectWithoutShopInput[]
    createMany?: ConfigurationCreateManyShopInputEnvelope
    connect?: ConfigurationWhereUniqueInput | ConfigurationWhereUniqueInput[]
  }

  export type ProductUncheckedCreateNestedManyWithoutShopInput = {
    create?: XOR<ProductCreateWithoutShopInput, ProductUncheckedCreateWithoutShopInput> | ProductCreateWithoutShopInput[] | ProductUncheckedCreateWithoutShopInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutShopInput | ProductCreateOrConnectWithoutShopInput[]
    createMany?: ProductCreateManyShopInputEnvelope
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
  }

  export type Model3DUncheckedCreateNestedManyWithoutShopInput = {
    create?: XOR<Model3DCreateWithoutShopInput, Model3DUncheckedCreateWithoutShopInput> | Model3DCreateWithoutShopInput[] | Model3DUncheckedCreateWithoutShopInput[]
    connectOrCreate?: Model3DCreateOrConnectWithoutShopInput | Model3DCreateOrConnectWithoutShopInput[]
    createMany?: Model3DCreateManyShopInputEnvelope
    connect?: Model3DWhereUniqueInput | Model3DWhereUniqueInput[]
  }

  export type Design2DUncheckedCreateNestedManyWithoutShopInput = {
    create?: XOR<Design2DCreateWithoutShopInput, Design2DUncheckedCreateWithoutShopInput> | Design2DCreateWithoutShopInput[] | Design2DUncheckedCreateWithoutShopInput[]
    connectOrCreate?: Design2DCreateOrConnectWithoutShopInput | Design2DCreateOrConnectWithoutShopInput[]
    createMany?: Design2DCreateManyShopInputEnvelope
    connect?: Design2DWhereUniqueInput | Design2DWhereUniqueInput[]
  }

  export type ColorUncheckedCreateNestedManyWithoutShopInput = {
    create?: XOR<ColorCreateWithoutShopInput, ColorUncheckedCreateWithoutShopInput> | ColorCreateWithoutShopInput[] | ColorUncheckedCreateWithoutShopInput[]
    connectOrCreate?: ColorCreateOrConnectWithoutShopInput | ColorCreateOrConnectWithoutShopInput[]
    createMany?: ColorCreateManyShopInputEnvelope
    connect?: ColorWhereUniqueInput | ColorWhereUniqueInput[]
  }

  export type FontUncheckedCreateNestedManyWithoutShopInput = {
    create?: XOR<FontCreateWithoutShopInput, FontUncheckedCreateWithoutShopInput> | FontCreateWithoutShopInput[] | FontUncheckedCreateWithoutShopInput[]
    connectOrCreate?: FontCreateOrConnectWithoutShopInput | FontCreateOrConnectWithoutShopInput[]
    createMany?: FontCreateManyShopInputEnvelope
    connect?: FontWhereUniqueInput | FontWhereUniqueInput[]
  }

  export type LogoUncheckedCreateNestedManyWithoutShopInput = {
    create?: XOR<LogoCreateWithoutShopInput, LogoUncheckedCreateWithoutShopInput> | LogoCreateWithoutShopInput[] | LogoUncheckedCreateWithoutShopInput[]
    connectOrCreate?: LogoCreateOrConnectWithoutShopInput | LogoCreateOrConnectWithoutShopInput[]
    createMany?: LogoCreateManyShopInputEnvelope
    connect?: LogoWhereUniqueInput | LogoWhereUniqueInput[]
  }

  export type ConfigurationUncheckedCreateNestedManyWithoutShopInput = {
    create?: XOR<ConfigurationCreateWithoutShopInput, ConfigurationUncheckedCreateWithoutShopInput> | ConfigurationCreateWithoutShopInput[] | ConfigurationUncheckedCreateWithoutShopInput[]
    connectOrCreate?: ConfigurationCreateOrConnectWithoutShopInput | ConfigurationCreateOrConnectWithoutShopInput[]
    createMany?: ConfigurationCreateManyShopInputEnvelope
    connect?: ConfigurationWhereUniqueInput | ConfigurationWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ProductUpdateManyWithoutShopNestedInput = {
    create?: XOR<ProductCreateWithoutShopInput, ProductUncheckedCreateWithoutShopInput> | ProductCreateWithoutShopInput[] | ProductUncheckedCreateWithoutShopInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutShopInput | ProductCreateOrConnectWithoutShopInput[]
    upsert?: ProductUpsertWithWhereUniqueWithoutShopInput | ProductUpsertWithWhereUniqueWithoutShopInput[]
    createMany?: ProductCreateManyShopInputEnvelope
    set?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    disconnect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    delete?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    update?: ProductUpdateWithWhereUniqueWithoutShopInput | ProductUpdateWithWhereUniqueWithoutShopInput[]
    updateMany?: ProductUpdateManyWithWhereWithoutShopInput | ProductUpdateManyWithWhereWithoutShopInput[]
    deleteMany?: ProductScalarWhereInput | ProductScalarWhereInput[]
  }

  export type Model3DUpdateManyWithoutShopNestedInput = {
    create?: XOR<Model3DCreateWithoutShopInput, Model3DUncheckedCreateWithoutShopInput> | Model3DCreateWithoutShopInput[] | Model3DUncheckedCreateWithoutShopInput[]
    connectOrCreate?: Model3DCreateOrConnectWithoutShopInput | Model3DCreateOrConnectWithoutShopInput[]
    upsert?: Model3DUpsertWithWhereUniqueWithoutShopInput | Model3DUpsertWithWhereUniqueWithoutShopInput[]
    createMany?: Model3DCreateManyShopInputEnvelope
    set?: Model3DWhereUniqueInput | Model3DWhereUniqueInput[]
    disconnect?: Model3DWhereUniqueInput | Model3DWhereUniqueInput[]
    delete?: Model3DWhereUniqueInput | Model3DWhereUniqueInput[]
    connect?: Model3DWhereUniqueInput | Model3DWhereUniqueInput[]
    update?: Model3DUpdateWithWhereUniqueWithoutShopInput | Model3DUpdateWithWhereUniqueWithoutShopInput[]
    updateMany?: Model3DUpdateManyWithWhereWithoutShopInput | Model3DUpdateManyWithWhereWithoutShopInput[]
    deleteMany?: Model3DScalarWhereInput | Model3DScalarWhereInput[]
  }

  export type Design2DUpdateManyWithoutShopNestedInput = {
    create?: XOR<Design2DCreateWithoutShopInput, Design2DUncheckedCreateWithoutShopInput> | Design2DCreateWithoutShopInput[] | Design2DUncheckedCreateWithoutShopInput[]
    connectOrCreate?: Design2DCreateOrConnectWithoutShopInput | Design2DCreateOrConnectWithoutShopInput[]
    upsert?: Design2DUpsertWithWhereUniqueWithoutShopInput | Design2DUpsertWithWhereUniqueWithoutShopInput[]
    createMany?: Design2DCreateManyShopInputEnvelope
    set?: Design2DWhereUniqueInput | Design2DWhereUniqueInput[]
    disconnect?: Design2DWhereUniqueInput | Design2DWhereUniqueInput[]
    delete?: Design2DWhereUniqueInput | Design2DWhereUniqueInput[]
    connect?: Design2DWhereUniqueInput | Design2DWhereUniqueInput[]
    update?: Design2DUpdateWithWhereUniqueWithoutShopInput | Design2DUpdateWithWhereUniqueWithoutShopInput[]
    updateMany?: Design2DUpdateManyWithWhereWithoutShopInput | Design2DUpdateManyWithWhereWithoutShopInput[]
    deleteMany?: Design2DScalarWhereInput | Design2DScalarWhereInput[]
  }

  export type ColorUpdateManyWithoutShopNestedInput = {
    create?: XOR<ColorCreateWithoutShopInput, ColorUncheckedCreateWithoutShopInput> | ColorCreateWithoutShopInput[] | ColorUncheckedCreateWithoutShopInput[]
    connectOrCreate?: ColorCreateOrConnectWithoutShopInput | ColorCreateOrConnectWithoutShopInput[]
    upsert?: ColorUpsertWithWhereUniqueWithoutShopInput | ColorUpsertWithWhereUniqueWithoutShopInput[]
    createMany?: ColorCreateManyShopInputEnvelope
    set?: ColorWhereUniqueInput | ColorWhereUniqueInput[]
    disconnect?: ColorWhereUniqueInput | ColorWhereUniqueInput[]
    delete?: ColorWhereUniqueInput | ColorWhereUniqueInput[]
    connect?: ColorWhereUniqueInput | ColorWhereUniqueInput[]
    update?: ColorUpdateWithWhereUniqueWithoutShopInput | ColorUpdateWithWhereUniqueWithoutShopInput[]
    updateMany?: ColorUpdateManyWithWhereWithoutShopInput | ColorUpdateManyWithWhereWithoutShopInput[]
    deleteMany?: ColorScalarWhereInput | ColorScalarWhereInput[]
  }

  export type FontUpdateManyWithoutShopNestedInput = {
    create?: XOR<FontCreateWithoutShopInput, FontUncheckedCreateWithoutShopInput> | FontCreateWithoutShopInput[] | FontUncheckedCreateWithoutShopInput[]
    connectOrCreate?: FontCreateOrConnectWithoutShopInput | FontCreateOrConnectWithoutShopInput[]
    upsert?: FontUpsertWithWhereUniqueWithoutShopInput | FontUpsertWithWhereUniqueWithoutShopInput[]
    createMany?: FontCreateManyShopInputEnvelope
    set?: FontWhereUniqueInput | FontWhereUniqueInput[]
    disconnect?: FontWhereUniqueInput | FontWhereUniqueInput[]
    delete?: FontWhereUniqueInput | FontWhereUniqueInput[]
    connect?: FontWhereUniqueInput | FontWhereUniqueInput[]
    update?: FontUpdateWithWhereUniqueWithoutShopInput | FontUpdateWithWhereUniqueWithoutShopInput[]
    updateMany?: FontUpdateManyWithWhereWithoutShopInput | FontUpdateManyWithWhereWithoutShopInput[]
    deleteMany?: FontScalarWhereInput | FontScalarWhereInput[]
  }

  export type LogoUpdateManyWithoutShopNestedInput = {
    create?: XOR<LogoCreateWithoutShopInput, LogoUncheckedCreateWithoutShopInput> | LogoCreateWithoutShopInput[] | LogoUncheckedCreateWithoutShopInput[]
    connectOrCreate?: LogoCreateOrConnectWithoutShopInput | LogoCreateOrConnectWithoutShopInput[]
    upsert?: LogoUpsertWithWhereUniqueWithoutShopInput | LogoUpsertWithWhereUniqueWithoutShopInput[]
    createMany?: LogoCreateManyShopInputEnvelope
    set?: LogoWhereUniqueInput | LogoWhereUniqueInput[]
    disconnect?: LogoWhereUniqueInput | LogoWhereUniqueInput[]
    delete?: LogoWhereUniqueInput | LogoWhereUniqueInput[]
    connect?: LogoWhereUniqueInput | LogoWhereUniqueInput[]
    update?: LogoUpdateWithWhereUniqueWithoutShopInput | LogoUpdateWithWhereUniqueWithoutShopInput[]
    updateMany?: LogoUpdateManyWithWhereWithoutShopInput | LogoUpdateManyWithWhereWithoutShopInput[]
    deleteMany?: LogoScalarWhereInput | LogoScalarWhereInput[]
  }

  export type ConfigurationUpdateManyWithoutShopNestedInput = {
    create?: XOR<ConfigurationCreateWithoutShopInput, ConfigurationUncheckedCreateWithoutShopInput> | ConfigurationCreateWithoutShopInput[] | ConfigurationUncheckedCreateWithoutShopInput[]
    connectOrCreate?: ConfigurationCreateOrConnectWithoutShopInput | ConfigurationCreateOrConnectWithoutShopInput[]
    upsert?: ConfigurationUpsertWithWhereUniqueWithoutShopInput | ConfigurationUpsertWithWhereUniqueWithoutShopInput[]
    createMany?: ConfigurationCreateManyShopInputEnvelope
    set?: ConfigurationWhereUniqueInput | ConfigurationWhereUniqueInput[]
    disconnect?: ConfigurationWhereUniqueInput | ConfigurationWhereUniqueInput[]
    delete?: ConfigurationWhereUniqueInput | ConfigurationWhereUniqueInput[]
    connect?: ConfigurationWhereUniqueInput | ConfigurationWhereUniqueInput[]
    update?: ConfigurationUpdateWithWhereUniqueWithoutShopInput | ConfigurationUpdateWithWhereUniqueWithoutShopInput[]
    updateMany?: ConfigurationUpdateManyWithWhereWithoutShopInput | ConfigurationUpdateManyWithWhereWithoutShopInput[]
    deleteMany?: ConfigurationScalarWhereInput | ConfigurationScalarWhereInput[]
  }

  export type ProductUncheckedUpdateManyWithoutShopNestedInput = {
    create?: XOR<ProductCreateWithoutShopInput, ProductUncheckedCreateWithoutShopInput> | ProductCreateWithoutShopInput[] | ProductUncheckedCreateWithoutShopInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutShopInput | ProductCreateOrConnectWithoutShopInput[]
    upsert?: ProductUpsertWithWhereUniqueWithoutShopInput | ProductUpsertWithWhereUniqueWithoutShopInput[]
    createMany?: ProductCreateManyShopInputEnvelope
    set?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    disconnect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    delete?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    update?: ProductUpdateWithWhereUniqueWithoutShopInput | ProductUpdateWithWhereUniqueWithoutShopInput[]
    updateMany?: ProductUpdateManyWithWhereWithoutShopInput | ProductUpdateManyWithWhereWithoutShopInput[]
    deleteMany?: ProductScalarWhereInput | ProductScalarWhereInput[]
  }

  export type Model3DUncheckedUpdateManyWithoutShopNestedInput = {
    create?: XOR<Model3DCreateWithoutShopInput, Model3DUncheckedCreateWithoutShopInput> | Model3DCreateWithoutShopInput[] | Model3DUncheckedCreateWithoutShopInput[]
    connectOrCreate?: Model3DCreateOrConnectWithoutShopInput | Model3DCreateOrConnectWithoutShopInput[]
    upsert?: Model3DUpsertWithWhereUniqueWithoutShopInput | Model3DUpsertWithWhereUniqueWithoutShopInput[]
    createMany?: Model3DCreateManyShopInputEnvelope
    set?: Model3DWhereUniqueInput | Model3DWhereUniqueInput[]
    disconnect?: Model3DWhereUniqueInput | Model3DWhereUniqueInput[]
    delete?: Model3DWhereUniqueInput | Model3DWhereUniqueInput[]
    connect?: Model3DWhereUniqueInput | Model3DWhereUniqueInput[]
    update?: Model3DUpdateWithWhereUniqueWithoutShopInput | Model3DUpdateWithWhereUniqueWithoutShopInput[]
    updateMany?: Model3DUpdateManyWithWhereWithoutShopInput | Model3DUpdateManyWithWhereWithoutShopInput[]
    deleteMany?: Model3DScalarWhereInput | Model3DScalarWhereInput[]
  }

  export type Design2DUncheckedUpdateManyWithoutShopNestedInput = {
    create?: XOR<Design2DCreateWithoutShopInput, Design2DUncheckedCreateWithoutShopInput> | Design2DCreateWithoutShopInput[] | Design2DUncheckedCreateWithoutShopInput[]
    connectOrCreate?: Design2DCreateOrConnectWithoutShopInput | Design2DCreateOrConnectWithoutShopInput[]
    upsert?: Design2DUpsertWithWhereUniqueWithoutShopInput | Design2DUpsertWithWhereUniqueWithoutShopInput[]
    createMany?: Design2DCreateManyShopInputEnvelope
    set?: Design2DWhereUniqueInput | Design2DWhereUniqueInput[]
    disconnect?: Design2DWhereUniqueInput | Design2DWhereUniqueInput[]
    delete?: Design2DWhereUniqueInput | Design2DWhereUniqueInput[]
    connect?: Design2DWhereUniqueInput | Design2DWhereUniqueInput[]
    update?: Design2DUpdateWithWhereUniqueWithoutShopInput | Design2DUpdateWithWhereUniqueWithoutShopInput[]
    updateMany?: Design2DUpdateManyWithWhereWithoutShopInput | Design2DUpdateManyWithWhereWithoutShopInput[]
    deleteMany?: Design2DScalarWhereInput | Design2DScalarWhereInput[]
  }

  export type ColorUncheckedUpdateManyWithoutShopNestedInput = {
    create?: XOR<ColorCreateWithoutShopInput, ColorUncheckedCreateWithoutShopInput> | ColorCreateWithoutShopInput[] | ColorUncheckedCreateWithoutShopInput[]
    connectOrCreate?: ColorCreateOrConnectWithoutShopInput | ColorCreateOrConnectWithoutShopInput[]
    upsert?: ColorUpsertWithWhereUniqueWithoutShopInput | ColorUpsertWithWhereUniqueWithoutShopInput[]
    createMany?: ColorCreateManyShopInputEnvelope
    set?: ColorWhereUniqueInput | ColorWhereUniqueInput[]
    disconnect?: ColorWhereUniqueInput | ColorWhereUniqueInput[]
    delete?: ColorWhereUniqueInput | ColorWhereUniqueInput[]
    connect?: ColorWhereUniqueInput | ColorWhereUniqueInput[]
    update?: ColorUpdateWithWhereUniqueWithoutShopInput | ColorUpdateWithWhereUniqueWithoutShopInput[]
    updateMany?: ColorUpdateManyWithWhereWithoutShopInput | ColorUpdateManyWithWhereWithoutShopInput[]
    deleteMany?: ColorScalarWhereInput | ColorScalarWhereInput[]
  }

  export type FontUncheckedUpdateManyWithoutShopNestedInput = {
    create?: XOR<FontCreateWithoutShopInput, FontUncheckedCreateWithoutShopInput> | FontCreateWithoutShopInput[] | FontUncheckedCreateWithoutShopInput[]
    connectOrCreate?: FontCreateOrConnectWithoutShopInput | FontCreateOrConnectWithoutShopInput[]
    upsert?: FontUpsertWithWhereUniqueWithoutShopInput | FontUpsertWithWhereUniqueWithoutShopInput[]
    createMany?: FontCreateManyShopInputEnvelope
    set?: FontWhereUniqueInput | FontWhereUniqueInput[]
    disconnect?: FontWhereUniqueInput | FontWhereUniqueInput[]
    delete?: FontWhereUniqueInput | FontWhereUniqueInput[]
    connect?: FontWhereUniqueInput | FontWhereUniqueInput[]
    update?: FontUpdateWithWhereUniqueWithoutShopInput | FontUpdateWithWhereUniqueWithoutShopInput[]
    updateMany?: FontUpdateManyWithWhereWithoutShopInput | FontUpdateManyWithWhereWithoutShopInput[]
    deleteMany?: FontScalarWhereInput | FontScalarWhereInput[]
  }

  export type LogoUncheckedUpdateManyWithoutShopNestedInput = {
    create?: XOR<LogoCreateWithoutShopInput, LogoUncheckedCreateWithoutShopInput> | LogoCreateWithoutShopInput[] | LogoUncheckedCreateWithoutShopInput[]
    connectOrCreate?: LogoCreateOrConnectWithoutShopInput | LogoCreateOrConnectWithoutShopInput[]
    upsert?: LogoUpsertWithWhereUniqueWithoutShopInput | LogoUpsertWithWhereUniqueWithoutShopInput[]
    createMany?: LogoCreateManyShopInputEnvelope
    set?: LogoWhereUniqueInput | LogoWhereUniqueInput[]
    disconnect?: LogoWhereUniqueInput | LogoWhereUniqueInput[]
    delete?: LogoWhereUniqueInput | LogoWhereUniqueInput[]
    connect?: LogoWhereUniqueInput | LogoWhereUniqueInput[]
    update?: LogoUpdateWithWhereUniqueWithoutShopInput | LogoUpdateWithWhereUniqueWithoutShopInput[]
    updateMany?: LogoUpdateManyWithWhereWithoutShopInput | LogoUpdateManyWithWhereWithoutShopInput[]
    deleteMany?: LogoScalarWhereInput | LogoScalarWhereInput[]
  }

  export type ConfigurationUncheckedUpdateManyWithoutShopNestedInput = {
    create?: XOR<ConfigurationCreateWithoutShopInput, ConfigurationUncheckedCreateWithoutShopInput> | ConfigurationCreateWithoutShopInput[] | ConfigurationUncheckedCreateWithoutShopInput[]
    connectOrCreate?: ConfigurationCreateOrConnectWithoutShopInput | ConfigurationCreateOrConnectWithoutShopInput[]
    upsert?: ConfigurationUpsertWithWhereUniqueWithoutShopInput | ConfigurationUpsertWithWhereUniqueWithoutShopInput[]
    createMany?: ConfigurationCreateManyShopInputEnvelope
    set?: ConfigurationWhereUniqueInput | ConfigurationWhereUniqueInput[]
    disconnect?: ConfigurationWhereUniqueInput | ConfigurationWhereUniqueInput[]
    delete?: ConfigurationWhereUniqueInput | ConfigurationWhereUniqueInput[]
    connect?: ConfigurationWhereUniqueInput | ConfigurationWhereUniqueInput[]
    update?: ConfigurationUpdateWithWhereUniqueWithoutShopInput | ConfigurationUpdateWithWhereUniqueWithoutShopInput[]
    updateMany?: ConfigurationUpdateManyWithWhereWithoutShopInput | ConfigurationUpdateManyWithWhereWithoutShopInput[]
    deleteMany?: ConfigurationScalarWhereInput | ConfigurationScalarWhereInput[]
  }

  export type Model3DCreateNestedOneWithoutProductsDefaultingInput = {
    create?: XOR<Model3DCreateWithoutProductsDefaultingInput, Model3DUncheckedCreateWithoutProductsDefaultingInput>
    connectOrCreate?: Model3DCreateOrConnectWithoutProductsDefaultingInput
    connect?: Model3DWhereUniqueInput
  }

  export type ShopCreateNestedOneWithoutProductsInput = {
    create?: XOR<ShopCreateWithoutProductsInput, ShopUncheckedCreateWithoutProductsInput>
    connectOrCreate?: ShopCreateOrConnectWithoutProductsInput
    connect?: ShopWhereUniqueInput
  }

  export type VariantCreateNestedManyWithoutProductInput = {
    create?: XOR<VariantCreateWithoutProductInput, VariantUncheckedCreateWithoutProductInput> | VariantCreateWithoutProductInput[] | VariantUncheckedCreateWithoutProductInput[]
    connectOrCreate?: VariantCreateOrConnectWithoutProductInput | VariantCreateOrConnectWithoutProductInput[]
    createMany?: VariantCreateManyProductInputEnvelope
    connect?: VariantWhereUniqueInput | VariantWhereUniqueInput[]
  }

  export type VariantUncheckedCreateNestedManyWithoutProductInput = {
    create?: XOR<VariantCreateWithoutProductInput, VariantUncheckedCreateWithoutProductInput> | VariantCreateWithoutProductInput[] | VariantUncheckedCreateWithoutProductInput[]
    connectOrCreate?: VariantCreateOrConnectWithoutProductInput | VariantCreateOrConnectWithoutProductInput[]
    createMany?: VariantCreateManyProductInputEnvelope
    connect?: VariantWhereUniqueInput | VariantWhereUniqueInput[]
  }

  export type Model3DUpdateOneWithoutProductsDefaultingNestedInput = {
    create?: XOR<Model3DCreateWithoutProductsDefaultingInput, Model3DUncheckedCreateWithoutProductsDefaultingInput>
    connectOrCreate?: Model3DCreateOrConnectWithoutProductsDefaultingInput
    upsert?: Model3DUpsertWithoutProductsDefaultingInput
    disconnect?: Model3DWhereInput | boolean
    delete?: Model3DWhereInput | boolean
    connect?: Model3DWhereUniqueInput
    update?: XOR<XOR<Model3DUpdateToOneWithWhereWithoutProductsDefaultingInput, Model3DUpdateWithoutProductsDefaultingInput>, Model3DUncheckedUpdateWithoutProductsDefaultingInput>
  }

  export type ShopUpdateOneRequiredWithoutProductsNestedInput = {
    create?: XOR<ShopCreateWithoutProductsInput, ShopUncheckedCreateWithoutProductsInput>
    connectOrCreate?: ShopCreateOrConnectWithoutProductsInput
    upsert?: ShopUpsertWithoutProductsInput
    connect?: ShopWhereUniqueInput
    update?: XOR<XOR<ShopUpdateToOneWithWhereWithoutProductsInput, ShopUpdateWithoutProductsInput>, ShopUncheckedUpdateWithoutProductsInput>
  }

  export type VariantUpdateManyWithoutProductNestedInput = {
    create?: XOR<VariantCreateWithoutProductInput, VariantUncheckedCreateWithoutProductInput> | VariantCreateWithoutProductInput[] | VariantUncheckedCreateWithoutProductInput[]
    connectOrCreate?: VariantCreateOrConnectWithoutProductInput | VariantCreateOrConnectWithoutProductInput[]
    upsert?: VariantUpsertWithWhereUniqueWithoutProductInput | VariantUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: VariantCreateManyProductInputEnvelope
    set?: VariantWhereUniqueInput | VariantWhereUniqueInput[]
    disconnect?: VariantWhereUniqueInput | VariantWhereUniqueInput[]
    delete?: VariantWhereUniqueInput | VariantWhereUniqueInput[]
    connect?: VariantWhereUniqueInput | VariantWhereUniqueInput[]
    update?: VariantUpdateWithWhereUniqueWithoutProductInput | VariantUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: VariantUpdateManyWithWhereWithoutProductInput | VariantUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: VariantScalarWhereInput | VariantScalarWhereInput[]
  }

  export type VariantUncheckedUpdateManyWithoutProductNestedInput = {
    create?: XOR<VariantCreateWithoutProductInput, VariantUncheckedCreateWithoutProductInput> | VariantCreateWithoutProductInput[] | VariantUncheckedCreateWithoutProductInput[]
    connectOrCreate?: VariantCreateOrConnectWithoutProductInput | VariantCreateOrConnectWithoutProductInput[]
    upsert?: VariantUpsertWithWhereUniqueWithoutProductInput | VariantUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: VariantCreateManyProductInputEnvelope
    set?: VariantWhereUniqueInput | VariantWhereUniqueInput[]
    disconnect?: VariantWhereUniqueInput | VariantWhereUniqueInput[]
    delete?: VariantWhereUniqueInput | VariantWhereUniqueInput[]
    connect?: VariantWhereUniqueInput | VariantWhereUniqueInput[]
    update?: VariantUpdateWithWhereUniqueWithoutProductInput | VariantUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: VariantUpdateManyWithWhereWithoutProductInput | VariantUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: VariantScalarWhereInput | VariantScalarWhereInput[]
  }

  export type ProductCreateNestedOneWithoutVariantsInput = {
    create?: XOR<ProductCreateWithoutVariantsInput, ProductUncheckedCreateWithoutVariantsInput>
    connectOrCreate?: ProductCreateOrConnectWithoutVariantsInput
    connect?: ProductWhereUniqueInput
  }

  export type ProductUpdateOneRequiredWithoutVariantsNestedInput = {
    create?: XOR<ProductCreateWithoutVariantsInput, ProductUncheckedCreateWithoutVariantsInput>
    connectOrCreate?: ProductCreateOrConnectWithoutVariantsInput
    upsert?: ProductUpsertWithoutVariantsInput
    connect?: ProductWhereUniqueInput
    update?: XOR<XOR<ProductUpdateToOneWithWhereWithoutVariantsInput, ProductUpdateWithoutVariantsInput>, ProductUncheckedUpdateWithoutVariantsInput>
  }

  export type ShopCreateNestedOneWithoutModels3dInput = {
    create?: XOR<ShopCreateWithoutModels3dInput, ShopUncheckedCreateWithoutModels3dInput>
    connectOrCreate?: ShopCreateOrConnectWithoutModels3dInput
    connect?: ShopWhereUniqueInput
  }

  export type ProductCreateNestedManyWithoutDefaultModelInput = {
    create?: XOR<ProductCreateWithoutDefaultModelInput, ProductUncheckedCreateWithoutDefaultModelInput> | ProductCreateWithoutDefaultModelInput[] | ProductUncheckedCreateWithoutDefaultModelInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutDefaultModelInput | ProductCreateOrConnectWithoutDefaultModelInput[]
    createMany?: ProductCreateManyDefaultModelInputEnvelope
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
  }

  export type ProductUncheckedCreateNestedManyWithoutDefaultModelInput = {
    create?: XOR<ProductCreateWithoutDefaultModelInput, ProductUncheckedCreateWithoutDefaultModelInput> | ProductCreateWithoutDefaultModelInput[] | ProductUncheckedCreateWithoutDefaultModelInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutDefaultModelInput | ProductCreateOrConnectWithoutDefaultModelInput[]
    createMany?: ProductCreateManyDefaultModelInputEnvelope
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
  }

  export type ShopUpdateOneRequiredWithoutModels3dNestedInput = {
    create?: XOR<ShopCreateWithoutModels3dInput, ShopUncheckedCreateWithoutModels3dInput>
    connectOrCreate?: ShopCreateOrConnectWithoutModels3dInput
    upsert?: ShopUpsertWithoutModels3dInput
    connect?: ShopWhereUniqueInput
    update?: XOR<XOR<ShopUpdateToOneWithWhereWithoutModels3dInput, ShopUpdateWithoutModels3dInput>, ShopUncheckedUpdateWithoutModels3dInput>
  }

  export type ProductUpdateManyWithoutDefaultModelNestedInput = {
    create?: XOR<ProductCreateWithoutDefaultModelInput, ProductUncheckedCreateWithoutDefaultModelInput> | ProductCreateWithoutDefaultModelInput[] | ProductUncheckedCreateWithoutDefaultModelInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutDefaultModelInput | ProductCreateOrConnectWithoutDefaultModelInput[]
    upsert?: ProductUpsertWithWhereUniqueWithoutDefaultModelInput | ProductUpsertWithWhereUniqueWithoutDefaultModelInput[]
    createMany?: ProductCreateManyDefaultModelInputEnvelope
    set?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    disconnect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    delete?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    update?: ProductUpdateWithWhereUniqueWithoutDefaultModelInput | ProductUpdateWithWhereUniqueWithoutDefaultModelInput[]
    updateMany?: ProductUpdateManyWithWhereWithoutDefaultModelInput | ProductUpdateManyWithWhereWithoutDefaultModelInput[]
    deleteMany?: ProductScalarWhereInput | ProductScalarWhereInput[]
  }

  export type ProductUncheckedUpdateManyWithoutDefaultModelNestedInput = {
    create?: XOR<ProductCreateWithoutDefaultModelInput, ProductUncheckedCreateWithoutDefaultModelInput> | ProductCreateWithoutDefaultModelInput[] | ProductUncheckedCreateWithoutDefaultModelInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutDefaultModelInput | ProductCreateOrConnectWithoutDefaultModelInput[]
    upsert?: ProductUpsertWithWhereUniqueWithoutDefaultModelInput | ProductUpsertWithWhereUniqueWithoutDefaultModelInput[]
    createMany?: ProductCreateManyDefaultModelInputEnvelope
    set?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    disconnect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    delete?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    update?: ProductUpdateWithWhereUniqueWithoutDefaultModelInput | ProductUpdateWithWhereUniqueWithoutDefaultModelInput[]
    updateMany?: ProductUpdateManyWithWhereWithoutDefaultModelInput | ProductUpdateManyWithWhereWithoutDefaultModelInput[]
    deleteMany?: ProductScalarWhereInput | ProductScalarWhereInput[]
  }

  export type ShopCreateNestedOneWithoutDesigns2dInput = {
    create?: XOR<ShopCreateWithoutDesigns2dInput, ShopUncheckedCreateWithoutDesigns2dInput>
    connectOrCreate?: ShopCreateOrConnectWithoutDesigns2dInput
    connect?: ShopWhereUniqueInput
  }

  export type ShopUpdateOneRequiredWithoutDesigns2dNestedInput = {
    create?: XOR<ShopCreateWithoutDesigns2dInput, ShopUncheckedCreateWithoutDesigns2dInput>
    connectOrCreate?: ShopCreateOrConnectWithoutDesigns2dInput
    upsert?: ShopUpsertWithoutDesigns2dInput
    connect?: ShopWhereUniqueInput
    update?: XOR<XOR<ShopUpdateToOneWithWhereWithoutDesigns2dInput, ShopUpdateWithoutDesigns2dInput>, ShopUncheckedUpdateWithoutDesigns2dInput>
  }

  export type ShopCreateNestedOneWithoutColorsInput = {
    create?: XOR<ShopCreateWithoutColorsInput, ShopUncheckedCreateWithoutColorsInput>
    connectOrCreate?: ShopCreateOrConnectWithoutColorsInput
    connect?: ShopWhereUniqueInput
  }

  export type ShopUpdateOneRequiredWithoutColorsNestedInput = {
    create?: XOR<ShopCreateWithoutColorsInput, ShopUncheckedCreateWithoutColorsInput>
    connectOrCreate?: ShopCreateOrConnectWithoutColorsInput
    upsert?: ShopUpsertWithoutColorsInput
    connect?: ShopWhereUniqueInput
    update?: XOR<XOR<ShopUpdateToOneWithWhereWithoutColorsInput, ShopUpdateWithoutColorsInput>, ShopUncheckedUpdateWithoutColorsInput>
  }

  export type ShopCreateNestedOneWithoutFontsInput = {
    create?: XOR<ShopCreateWithoutFontsInput, ShopUncheckedCreateWithoutFontsInput>
    connectOrCreate?: ShopCreateOrConnectWithoutFontsInput
    connect?: ShopWhereUniqueInput
  }

  export type ShopUpdateOneRequiredWithoutFontsNestedInput = {
    create?: XOR<ShopCreateWithoutFontsInput, ShopUncheckedCreateWithoutFontsInput>
    connectOrCreate?: ShopCreateOrConnectWithoutFontsInput
    upsert?: ShopUpsertWithoutFontsInput
    connect?: ShopWhereUniqueInput
    update?: XOR<XOR<ShopUpdateToOneWithWhereWithoutFontsInput, ShopUpdateWithoutFontsInput>, ShopUncheckedUpdateWithoutFontsInput>
  }

  export type ShopCreateNestedOneWithoutLogosInput = {
    create?: XOR<ShopCreateWithoutLogosInput, ShopUncheckedCreateWithoutLogosInput>
    connectOrCreate?: ShopCreateOrConnectWithoutLogosInput
    connect?: ShopWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type ShopUpdateOneRequiredWithoutLogosNestedInput = {
    create?: XOR<ShopCreateWithoutLogosInput, ShopUncheckedCreateWithoutLogosInput>
    connectOrCreate?: ShopCreateOrConnectWithoutLogosInput
    upsert?: ShopUpsertWithoutLogosInput
    connect?: ShopWhereUniqueInput
    update?: XOR<XOR<ShopUpdateToOneWithWhereWithoutLogosInput, ShopUpdateWithoutLogosInput>, ShopUncheckedUpdateWithoutLogosInput>
  }

  export type ShopCreateNestedOneWithoutConfigurationsInput = {
    create?: XOR<ShopCreateWithoutConfigurationsInput, ShopUncheckedCreateWithoutConfigurationsInput>
    connectOrCreate?: ShopCreateOrConnectWithoutConfigurationsInput
    connect?: ShopWhereUniqueInput
  }

  export type ShopUpdateOneRequiredWithoutConfigurationsNestedInput = {
    create?: XOR<ShopCreateWithoutConfigurationsInput, ShopUncheckedCreateWithoutConfigurationsInput>
    connectOrCreate?: ShopCreateOrConnectWithoutConfigurationsInput
    upsert?: ShopUpsertWithoutConfigurationsInput
    connect?: ShopWhereUniqueInput
    update?: XOR<XOR<ShopUpdateToOneWithWhereWithoutConfigurationsInput, ShopUpdateWithoutConfigurationsInput>, ShopUncheckedUpdateWithoutConfigurationsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type ProductCreateWithoutShopInput = {
    id?: string
    productGid: string
    handle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    defaultModel?: Model3DCreateNestedOneWithoutProductsDefaultingInput
    variants?: VariantCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateWithoutShopInput = {
    id?: string
    productGid: string
    handle: string
    defaultModelId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    variants?: VariantUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductCreateOrConnectWithoutShopInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutShopInput, ProductUncheckedCreateWithoutShopInput>
  }

  export type ProductCreateManyShopInputEnvelope = {
    data: ProductCreateManyShopInput | ProductCreateManyShopInput[]
  }

  export type Model3DCreateWithoutShopInput = {
    id?: string
    name: string
    glbUrl: string
    materialsSchema: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    productsDefaulting?: ProductCreateNestedManyWithoutDefaultModelInput
  }

  export type Model3DUncheckedCreateWithoutShopInput = {
    id?: string
    name: string
    glbUrl: string
    materialsSchema: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    productsDefaulting?: ProductUncheckedCreateNestedManyWithoutDefaultModelInput
  }

  export type Model3DCreateOrConnectWithoutShopInput = {
    where: Model3DWhereUniqueInput
    create: XOR<Model3DCreateWithoutShopInput, Model3DUncheckedCreateWithoutShopInput>
  }

  export type Model3DCreateManyShopInputEnvelope = {
    data: Model3DCreateManyShopInput | Model3DCreateManyShopInput[]
  }

  export type Design2DCreateWithoutShopInput = {
    id?: string
    name: string
    svgUrl: string
    mappedRegions: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type Design2DUncheckedCreateWithoutShopInput = {
    id?: string
    name: string
    svgUrl: string
    mappedRegions: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type Design2DCreateOrConnectWithoutShopInput = {
    where: Design2DWhereUniqueInput
    create: XOR<Design2DCreateWithoutShopInput, Design2DUncheckedCreateWithoutShopInput>
  }

  export type Design2DCreateManyShopInputEnvelope = {
    data: Design2DCreateManyShopInput | Design2DCreateManyShopInput[]
  }

  export type ColorCreateWithoutShopInput = {
    id?: string
    name: string
    hex: string
    materialBindings: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ColorUncheckedCreateWithoutShopInput = {
    id?: string
    name: string
    hex: string
    materialBindings: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ColorCreateOrConnectWithoutShopInput = {
    where: ColorWhereUniqueInput
    create: XOR<ColorCreateWithoutShopInput, ColorUncheckedCreateWithoutShopInput>
  }

  export type ColorCreateManyShopInputEnvelope = {
    data: ColorCreateManyShopInput | ColorCreateManyShopInput[]
  }

  export type FontCreateWithoutShopInput = {
    id?: string
    name: string
    woffUrl: string
    sdfMeta?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FontUncheckedCreateWithoutShopInput = {
    id?: string
    name: string
    woffUrl: string
    sdfMeta?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FontCreateOrConnectWithoutShopInput = {
    where: FontWhereUniqueInput
    create: XOR<FontCreateWithoutShopInput, FontUncheckedCreateWithoutShopInput>
  }

  export type FontCreateManyShopInputEnvelope = {
    data: FontCreateManyShopInput | FontCreateManyShopInput[]
  }

  export type LogoCreateWithoutShopInput = {
    id?: string
    name: string
    fileUrl: string
    vector?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LogoUncheckedCreateWithoutShopInput = {
    id?: string
    name: string
    fileUrl: string
    vector?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LogoCreateOrConnectWithoutShopInput = {
    where: LogoWhereUniqueInput
    create: XOR<LogoCreateWithoutShopInput, LogoUncheckedCreateWithoutShopInput>
  }

  export type LogoCreateManyShopInputEnvelope = {
    data: LogoCreateManyShopInput | LogoCreateManyShopInput[]
  }

  export type ConfigurationCreateWithoutShopInput = {
    id?: string
    productGid: string
    variantGid?: string | null
    payloadJSON: JsonNullValueInput | InputJsonValue
    thumbnailUrl?: string | null
    createdBy?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ConfigurationUncheckedCreateWithoutShopInput = {
    id?: string
    productGid: string
    variantGid?: string | null
    payloadJSON: JsonNullValueInput | InputJsonValue
    thumbnailUrl?: string | null
    createdBy?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ConfigurationCreateOrConnectWithoutShopInput = {
    where: ConfigurationWhereUniqueInput
    create: XOR<ConfigurationCreateWithoutShopInput, ConfigurationUncheckedCreateWithoutShopInput>
  }

  export type ConfigurationCreateManyShopInputEnvelope = {
    data: ConfigurationCreateManyShopInput | ConfigurationCreateManyShopInput[]
  }

  export type ProductUpsertWithWhereUniqueWithoutShopInput = {
    where: ProductWhereUniqueInput
    update: XOR<ProductUpdateWithoutShopInput, ProductUncheckedUpdateWithoutShopInput>
    create: XOR<ProductCreateWithoutShopInput, ProductUncheckedCreateWithoutShopInput>
  }

  export type ProductUpdateWithWhereUniqueWithoutShopInput = {
    where: ProductWhereUniqueInput
    data: XOR<ProductUpdateWithoutShopInput, ProductUncheckedUpdateWithoutShopInput>
  }

  export type ProductUpdateManyWithWhereWithoutShopInput = {
    where: ProductScalarWhereInput
    data: XOR<ProductUpdateManyMutationInput, ProductUncheckedUpdateManyWithoutShopInput>
  }

  export type ProductScalarWhereInput = {
    AND?: ProductScalarWhereInput | ProductScalarWhereInput[]
    OR?: ProductScalarWhereInput[]
    NOT?: ProductScalarWhereInput | ProductScalarWhereInput[]
    id?: StringFilter<"Product"> | string
    shopId?: StringFilter<"Product"> | string
    productGid?: StringFilter<"Product"> | string
    handle?: StringFilter<"Product"> | string
    defaultModelId?: StringNullableFilter<"Product"> | string | null
    createdAt?: DateTimeFilter<"Product"> | Date | string
    updatedAt?: DateTimeFilter<"Product"> | Date | string
  }

  export type Model3DUpsertWithWhereUniqueWithoutShopInput = {
    where: Model3DWhereUniqueInput
    update: XOR<Model3DUpdateWithoutShopInput, Model3DUncheckedUpdateWithoutShopInput>
    create: XOR<Model3DCreateWithoutShopInput, Model3DUncheckedCreateWithoutShopInput>
  }

  export type Model3DUpdateWithWhereUniqueWithoutShopInput = {
    where: Model3DWhereUniqueInput
    data: XOR<Model3DUpdateWithoutShopInput, Model3DUncheckedUpdateWithoutShopInput>
  }

  export type Model3DUpdateManyWithWhereWithoutShopInput = {
    where: Model3DScalarWhereInput
    data: XOR<Model3DUpdateManyMutationInput, Model3DUncheckedUpdateManyWithoutShopInput>
  }

  export type Model3DScalarWhereInput = {
    AND?: Model3DScalarWhereInput | Model3DScalarWhereInput[]
    OR?: Model3DScalarWhereInput[]
    NOT?: Model3DScalarWhereInput | Model3DScalarWhereInput[]
    id?: StringFilter<"Model3D"> | string
    shopId?: StringFilter<"Model3D"> | string
    name?: StringFilter<"Model3D"> | string
    glbUrl?: StringFilter<"Model3D"> | string
    materialsSchema?: JsonFilter<"Model3D">
    createdAt?: DateTimeFilter<"Model3D"> | Date | string
    updatedAt?: DateTimeFilter<"Model3D"> | Date | string
  }

  export type Design2DUpsertWithWhereUniqueWithoutShopInput = {
    where: Design2DWhereUniqueInput
    update: XOR<Design2DUpdateWithoutShopInput, Design2DUncheckedUpdateWithoutShopInput>
    create: XOR<Design2DCreateWithoutShopInput, Design2DUncheckedCreateWithoutShopInput>
  }

  export type Design2DUpdateWithWhereUniqueWithoutShopInput = {
    where: Design2DWhereUniqueInput
    data: XOR<Design2DUpdateWithoutShopInput, Design2DUncheckedUpdateWithoutShopInput>
  }

  export type Design2DUpdateManyWithWhereWithoutShopInput = {
    where: Design2DScalarWhereInput
    data: XOR<Design2DUpdateManyMutationInput, Design2DUncheckedUpdateManyWithoutShopInput>
  }

  export type Design2DScalarWhereInput = {
    AND?: Design2DScalarWhereInput | Design2DScalarWhereInput[]
    OR?: Design2DScalarWhereInput[]
    NOT?: Design2DScalarWhereInput | Design2DScalarWhereInput[]
    id?: StringFilter<"Design2D"> | string
    shopId?: StringFilter<"Design2D"> | string
    name?: StringFilter<"Design2D"> | string
    svgUrl?: StringFilter<"Design2D"> | string
    mappedRegions?: JsonFilter<"Design2D">
    createdAt?: DateTimeFilter<"Design2D"> | Date | string
    updatedAt?: DateTimeFilter<"Design2D"> | Date | string
  }

  export type ColorUpsertWithWhereUniqueWithoutShopInput = {
    where: ColorWhereUniqueInput
    update: XOR<ColorUpdateWithoutShopInput, ColorUncheckedUpdateWithoutShopInput>
    create: XOR<ColorCreateWithoutShopInput, ColorUncheckedCreateWithoutShopInput>
  }

  export type ColorUpdateWithWhereUniqueWithoutShopInput = {
    where: ColorWhereUniqueInput
    data: XOR<ColorUpdateWithoutShopInput, ColorUncheckedUpdateWithoutShopInput>
  }

  export type ColorUpdateManyWithWhereWithoutShopInput = {
    where: ColorScalarWhereInput
    data: XOR<ColorUpdateManyMutationInput, ColorUncheckedUpdateManyWithoutShopInput>
  }

  export type ColorScalarWhereInput = {
    AND?: ColorScalarWhereInput | ColorScalarWhereInput[]
    OR?: ColorScalarWhereInput[]
    NOT?: ColorScalarWhereInput | ColorScalarWhereInput[]
    id?: StringFilter<"Color"> | string
    shopId?: StringFilter<"Color"> | string
    name?: StringFilter<"Color"> | string
    hex?: StringFilter<"Color"> | string
    materialBindings?: JsonFilter<"Color">
    createdAt?: DateTimeFilter<"Color"> | Date | string
    updatedAt?: DateTimeFilter<"Color"> | Date | string
  }

  export type FontUpsertWithWhereUniqueWithoutShopInput = {
    where: FontWhereUniqueInput
    update: XOR<FontUpdateWithoutShopInput, FontUncheckedUpdateWithoutShopInput>
    create: XOR<FontCreateWithoutShopInput, FontUncheckedCreateWithoutShopInput>
  }

  export type FontUpdateWithWhereUniqueWithoutShopInput = {
    where: FontWhereUniqueInput
    data: XOR<FontUpdateWithoutShopInput, FontUncheckedUpdateWithoutShopInput>
  }

  export type FontUpdateManyWithWhereWithoutShopInput = {
    where: FontScalarWhereInput
    data: XOR<FontUpdateManyMutationInput, FontUncheckedUpdateManyWithoutShopInput>
  }

  export type FontScalarWhereInput = {
    AND?: FontScalarWhereInput | FontScalarWhereInput[]
    OR?: FontScalarWhereInput[]
    NOT?: FontScalarWhereInput | FontScalarWhereInput[]
    id?: StringFilter<"Font"> | string
    shopId?: StringFilter<"Font"> | string
    name?: StringFilter<"Font"> | string
    woffUrl?: StringFilter<"Font"> | string
    sdfMeta?: JsonNullableFilter<"Font">
    createdAt?: DateTimeFilter<"Font"> | Date | string
    updatedAt?: DateTimeFilter<"Font"> | Date | string
  }

  export type LogoUpsertWithWhereUniqueWithoutShopInput = {
    where: LogoWhereUniqueInput
    update: XOR<LogoUpdateWithoutShopInput, LogoUncheckedUpdateWithoutShopInput>
    create: XOR<LogoCreateWithoutShopInput, LogoUncheckedCreateWithoutShopInput>
  }

  export type LogoUpdateWithWhereUniqueWithoutShopInput = {
    where: LogoWhereUniqueInput
    data: XOR<LogoUpdateWithoutShopInput, LogoUncheckedUpdateWithoutShopInput>
  }

  export type LogoUpdateManyWithWhereWithoutShopInput = {
    where: LogoScalarWhereInput
    data: XOR<LogoUpdateManyMutationInput, LogoUncheckedUpdateManyWithoutShopInput>
  }

  export type LogoScalarWhereInput = {
    AND?: LogoScalarWhereInput | LogoScalarWhereInput[]
    OR?: LogoScalarWhereInput[]
    NOT?: LogoScalarWhereInput | LogoScalarWhereInput[]
    id?: StringFilter<"Logo"> | string
    shopId?: StringFilter<"Logo"> | string
    name?: StringFilter<"Logo"> | string
    fileUrl?: StringFilter<"Logo"> | string
    vector?: BoolFilter<"Logo"> | boolean
    createdAt?: DateTimeFilter<"Logo"> | Date | string
    updatedAt?: DateTimeFilter<"Logo"> | Date | string
  }

  export type ConfigurationUpsertWithWhereUniqueWithoutShopInput = {
    where: ConfigurationWhereUniqueInput
    update: XOR<ConfigurationUpdateWithoutShopInput, ConfigurationUncheckedUpdateWithoutShopInput>
    create: XOR<ConfigurationCreateWithoutShopInput, ConfigurationUncheckedCreateWithoutShopInput>
  }

  export type ConfigurationUpdateWithWhereUniqueWithoutShopInput = {
    where: ConfigurationWhereUniqueInput
    data: XOR<ConfigurationUpdateWithoutShopInput, ConfigurationUncheckedUpdateWithoutShopInput>
  }

  export type ConfigurationUpdateManyWithWhereWithoutShopInput = {
    where: ConfigurationScalarWhereInput
    data: XOR<ConfigurationUpdateManyMutationInput, ConfigurationUncheckedUpdateManyWithoutShopInput>
  }

  export type ConfigurationScalarWhereInput = {
    AND?: ConfigurationScalarWhereInput | ConfigurationScalarWhereInput[]
    OR?: ConfigurationScalarWhereInput[]
    NOT?: ConfigurationScalarWhereInput | ConfigurationScalarWhereInput[]
    id?: StringFilter<"Configuration"> | string
    shopId?: StringFilter<"Configuration"> | string
    productGid?: StringFilter<"Configuration"> | string
    variantGid?: StringNullableFilter<"Configuration"> | string | null
    payloadJSON?: JsonFilter<"Configuration">
    thumbnailUrl?: StringNullableFilter<"Configuration"> | string | null
    createdBy?: StringNullableFilter<"Configuration"> | string | null
    createdAt?: DateTimeFilter<"Configuration"> | Date | string
    updatedAt?: DateTimeFilter<"Configuration"> | Date | string
  }

  export type Model3DCreateWithoutProductsDefaultingInput = {
    id?: string
    name: string
    glbUrl: string
    materialsSchema: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    shop: ShopCreateNestedOneWithoutModels3dInput
  }

  export type Model3DUncheckedCreateWithoutProductsDefaultingInput = {
    id?: string
    shopId: string
    name: string
    glbUrl: string
    materialsSchema: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type Model3DCreateOrConnectWithoutProductsDefaultingInput = {
    where: Model3DWhereUniqueInput
    create: XOR<Model3DCreateWithoutProductsDefaultingInput, Model3DUncheckedCreateWithoutProductsDefaultingInput>
  }

  export type ShopCreateWithoutProductsInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    models3d?: Model3DCreateNestedManyWithoutShopInput
    designs2d?: Design2DCreateNestedManyWithoutShopInput
    colors?: ColorCreateNestedManyWithoutShopInput
    fonts?: FontCreateNestedManyWithoutShopInput
    logos?: LogoCreateNestedManyWithoutShopInput
    configurations?: ConfigurationCreateNestedManyWithoutShopInput
  }

  export type ShopUncheckedCreateWithoutProductsInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    models3d?: Model3DUncheckedCreateNestedManyWithoutShopInput
    designs2d?: Design2DUncheckedCreateNestedManyWithoutShopInput
    colors?: ColorUncheckedCreateNestedManyWithoutShopInput
    fonts?: FontUncheckedCreateNestedManyWithoutShopInput
    logos?: LogoUncheckedCreateNestedManyWithoutShopInput
    configurations?: ConfigurationUncheckedCreateNestedManyWithoutShopInput
  }

  export type ShopCreateOrConnectWithoutProductsInput = {
    where: ShopWhereUniqueInput
    create: XOR<ShopCreateWithoutProductsInput, ShopUncheckedCreateWithoutProductsInput>
  }

  export type VariantCreateWithoutProductInput = {
    id?: string
    variantGid: string
    presetId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VariantUncheckedCreateWithoutProductInput = {
    id?: string
    variantGid: string
    presetId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VariantCreateOrConnectWithoutProductInput = {
    where: VariantWhereUniqueInput
    create: XOR<VariantCreateWithoutProductInput, VariantUncheckedCreateWithoutProductInput>
  }

  export type VariantCreateManyProductInputEnvelope = {
    data: VariantCreateManyProductInput | VariantCreateManyProductInput[]
  }

  export type Model3DUpsertWithoutProductsDefaultingInput = {
    update: XOR<Model3DUpdateWithoutProductsDefaultingInput, Model3DUncheckedUpdateWithoutProductsDefaultingInput>
    create: XOR<Model3DCreateWithoutProductsDefaultingInput, Model3DUncheckedCreateWithoutProductsDefaultingInput>
    where?: Model3DWhereInput
  }

  export type Model3DUpdateToOneWithWhereWithoutProductsDefaultingInput = {
    where?: Model3DWhereInput
    data: XOR<Model3DUpdateWithoutProductsDefaultingInput, Model3DUncheckedUpdateWithoutProductsDefaultingInput>
  }

  export type Model3DUpdateWithoutProductsDefaultingInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    glbUrl?: StringFieldUpdateOperationsInput | string
    materialsSchema?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shop?: ShopUpdateOneRequiredWithoutModels3dNestedInput
  }

  export type Model3DUncheckedUpdateWithoutProductsDefaultingInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    glbUrl?: StringFieldUpdateOperationsInput | string
    materialsSchema?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ShopUpsertWithoutProductsInput = {
    update: XOR<ShopUpdateWithoutProductsInput, ShopUncheckedUpdateWithoutProductsInput>
    create: XOR<ShopCreateWithoutProductsInput, ShopUncheckedCreateWithoutProductsInput>
    where?: ShopWhereInput
  }

  export type ShopUpdateToOneWithWhereWithoutProductsInput = {
    where?: ShopWhereInput
    data: XOR<ShopUpdateWithoutProductsInput, ShopUncheckedUpdateWithoutProductsInput>
  }

  export type ShopUpdateWithoutProductsInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    models3d?: Model3DUpdateManyWithoutShopNestedInput
    designs2d?: Design2DUpdateManyWithoutShopNestedInput
    colors?: ColorUpdateManyWithoutShopNestedInput
    fonts?: FontUpdateManyWithoutShopNestedInput
    logos?: LogoUpdateManyWithoutShopNestedInput
    configurations?: ConfigurationUpdateManyWithoutShopNestedInput
  }

  export type ShopUncheckedUpdateWithoutProductsInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    models3d?: Model3DUncheckedUpdateManyWithoutShopNestedInput
    designs2d?: Design2DUncheckedUpdateManyWithoutShopNestedInput
    colors?: ColorUncheckedUpdateManyWithoutShopNestedInput
    fonts?: FontUncheckedUpdateManyWithoutShopNestedInput
    logos?: LogoUncheckedUpdateManyWithoutShopNestedInput
    configurations?: ConfigurationUncheckedUpdateManyWithoutShopNestedInput
  }

  export type VariantUpsertWithWhereUniqueWithoutProductInput = {
    where: VariantWhereUniqueInput
    update: XOR<VariantUpdateWithoutProductInput, VariantUncheckedUpdateWithoutProductInput>
    create: XOR<VariantCreateWithoutProductInput, VariantUncheckedCreateWithoutProductInput>
  }

  export type VariantUpdateWithWhereUniqueWithoutProductInput = {
    where: VariantWhereUniqueInput
    data: XOR<VariantUpdateWithoutProductInput, VariantUncheckedUpdateWithoutProductInput>
  }

  export type VariantUpdateManyWithWhereWithoutProductInput = {
    where: VariantScalarWhereInput
    data: XOR<VariantUpdateManyMutationInput, VariantUncheckedUpdateManyWithoutProductInput>
  }

  export type VariantScalarWhereInput = {
    AND?: VariantScalarWhereInput | VariantScalarWhereInput[]
    OR?: VariantScalarWhereInput[]
    NOT?: VariantScalarWhereInput | VariantScalarWhereInput[]
    id?: StringFilter<"Variant"> | string
    productId?: StringFilter<"Variant"> | string
    variantGid?: StringFilter<"Variant"> | string
    presetId?: StringNullableFilter<"Variant"> | string | null
    createdAt?: DateTimeFilter<"Variant"> | Date | string
    updatedAt?: DateTimeFilter<"Variant"> | Date | string
  }

  export type ProductCreateWithoutVariantsInput = {
    id?: string
    productGid: string
    handle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    defaultModel?: Model3DCreateNestedOneWithoutProductsDefaultingInput
    shop: ShopCreateNestedOneWithoutProductsInput
  }

  export type ProductUncheckedCreateWithoutVariantsInput = {
    id?: string
    shopId: string
    productGid: string
    handle: string
    defaultModelId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProductCreateOrConnectWithoutVariantsInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutVariantsInput, ProductUncheckedCreateWithoutVariantsInput>
  }

  export type ProductUpsertWithoutVariantsInput = {
    update: XOR<ProductUpdateWithoutVariantsInput, ProductUncheckedUpdateWithoutVariantsInput>
    create: XOR<ProductCreateWithoutVariantsInput, ProductUncheckedCreateWithoutVariantsInput>
    where?: ProductWhereInput
  }

  export type ProductUpdateToOneWithWhereWithoutVariantsInput = {
    where?: ProductWhereInput
    data: XOR<ProductUpdateWithoutVariantsInput, ProductUncheckedUpdateWithoutVariantsInput>
  }

  export type ProductUpdateWithoutVariantsInput = {
    id?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    handle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    defaultModel?: Model3DUpdateOneWithoutProductsDefaultingNestedInput
    shop?: ShopUpdateOneRequiredWithoutProductsNestedInput
  }

  export type ProductUncheckedUpdateWithoutVariantsInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    handle?: StringFieldUpdateOperationsInput | string
    defaultModelId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ShopCreateWithoutModels3dInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    products?: ProductCreateNestedManyWithoutShopInput
    designs2d?: Design2DCreateNestedManyWithoutShopInput
    colors?: ColorCreateNestedManyWithoutShopInput
    fonts?: FontCreateNestedManyWithoutShopInput
    logos?: LogoCreateNestedManyWithoutShopInput
    configurations?: ConfigurationCreateNestedManyWithoutShopInput
  }

  export type ShopUncheckedCreateWithoutModels3dInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    products?: ProductUncheckedCreateNestedManyWithoutShopInput
    designs2d?: Design2DUncheckedCreateNestedManyWithoutShopInput
    colors?: ColorUncheckedCreateNestedManyWithoutShopInput
    fonts?: FontUncheckedCreateNestedManyWithoutShopInput
    logos?: LogoUncheckedCreateNestedManyWithoutShopInput
    configurations?: ConfigurationUncheckedCreateNestedManyWithoutShopInput
  }

  export type ShopCreateOrConnectWithoutModels3dInput = {
    where: ShopWhereUniqueInput
    create: XOR<ShopCreateWithoutModels3dInput, ShopUncheckedCreateWithoutModels3dInput>
  }

  export type ProductCreateWithoutDefaultModelInput = {
    id?: string
    productGid: string
    handle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    shop: ShopCreateNestedOneWithoutProductsInput
    variants?: VariantCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateWithoutDefaultModelInput = {
    id?: string
    shopId: string
    productGid: string
    handle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    variants?: VariantUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductCreateOrConnectWithoutDefaultModelInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutDefaultModelInput, ProductUncheckedCreateWithoutDefaultModelInput>
  }

  export type ProductCreateManyDefaultModelInputEnvelope = {
    data: ProductCreateManyDefaultModelInput | ProductCreateManyDefaultModelInput[]
  }

  export type ShopUpsertWithoutModels3dInput = {
    update: XOR<ShopUpdateWithoutModels3dInput, ShopUncheckedUpdateWithoutModels3dInput>
    create: XOR<ShopCreateWithoutModels3dInput, ShopUncheckedCreateWithoutModels3dInput>
    where?: ShopWhereInput
  }

  export type ShopUpdateToOneWithWhereWithoutModels3dInput = {
    where?: ShopWhereInput
    data: XOR<ShopUpdateWithoutModels3dInput, ShopUncheckedUpdateWithoutModels3dInput>
  }

  export type ShopUpdateWithoutModels3dInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    products?: ProductUpdateManyWithoutShopNestedInput
    designs2d?: Design2DUpdateManyWithoutShopNestedInput
    colors?: ColorUpdateManyWithoutShopNestedInput
    fonts?: FontUpdateManyWithoutShopNestedInput
    logos?: LogoUpdateManyWithoutShopNestedInput
    configurations?: ConfigurationUpdateManyWithoutShopNestedInput
  }

  export type ShopUncheckedUpdateWithoutModels3dInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    products?: ProductUncheckedUpdateManyWithoutShopNestedInput
    designs2d?: Design2DUncheckedUpdateManyWithoutShopNestedInput
    colors?: ColorUncheckedUpdateManyWithoutShopNestedInput
    fonts?: FontUncheckedUpdateManyWithoutShopNestedInput
    logos?: LogoUncheckedUpdateManyWithoutShopNestedInput
    configurations?: ConfigurationUncheckedUpdateManyWithoutShopNestedInput
  }

  export type ProductUpsertWithWhereUniqueWithoutDefaultModelInput = {
    where: ProductWhereUniqueInput
    update: XOR<ProductUpdateWithoutDefaultModelInput, ProductUncheckedUpdateWithoutDefaultModelInput>
    create: XOR<ProductCreateWithoutDefaultModelInput, ProductUncheckedCreateWithoutDefaultModelInput>
  }

  export type ProductUpdateWithWhereUniqueWithoutDefaultModelInput = {
    where: ProductWhereUniqueInput
    data: XOR<ProductUpdateWithoutDefaultModelInput, ProductUncheckedUpdateWithoutDefaultModelInput>
  }

  export type ProductUpdateManyWithWhereWithoutDefaultModelInput = {
    where: ProductScalarWhereInput
    data: XOR<ProductUpdateManyMutationInput, ProductUncheckedUpdateManyWithoutDefaultModelInput>
  }

  export type ShopCreateWithoutDesigns2dInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    products?: ProductCreateNestedManyWithoutShopInput
    models3d?: Model3DCreateNestedManyWithoutShopInput
    colors?: ColorCreateNestedManyWithoutShopInput
    fonts?: FontCreateNestedManyWithoutShopInput
    logos?: LogoCreateNestedManyWithoutShopInput
    configurations?: ConfigurationCreateNestedManyWithoutShopInput
  }

  export type ShopUncheckedCreateWithoutDesigns2dInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    products?: ProductUncheckedCreateNestedManyWithoutShopInput
    models3d?: Model3DUncheckedCreateNestedManyWithoutShopInput
    colors?: ColorUncheckedCreateNestedManyWithoutShopInput
    fonts?: FontUncheckedCreateNestedManyWithoutShopInput
    logos?: LogoUncheckedCreateNestedManyWithoutShopInput
    configurations?: ConfigurationUncheckedCreateNestedManyWithoutShopInput
  }

  export type ShopCreateOrConnectWithoutDesigns2dInput = {
    where: ShopWhereUniqueInput
    create: XOR<ShopCreateWithoutDesigns2dInput, ShopUncheckedCreateWithoutDesigns2dInput>
  }

  export type ShopUpsertWithoutDesigns2dInput = {
    update: XOR<ShopUpdateWithoutDesigns2dInput, ShopUncheckedUpdateWithoutDesigns2dInput>
    create: XOR<ShopCreateWithoutDesigns2dInput, ShopUncheckedCreateWithoutDesigns2dInput>
    where?: ShopWhereInput
  }

  export type ShopUpdateToOneWithWhereWithoutDesigns2dInput = {
    where?: ShopWhereInput
    data: XOR<ShopUpdateWithoutDesigns2dInput, ShopUncheckedUpdateWithoutDesigns2dInput>
  }

  export type ShopUpdateWithoutDesigns2dInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    products?: ProductUpdateManyWithoutShopNestedInput
    models3d?: Model3DUpdateManyWithoutShopNestedInput
    colors?: ColorUpdateManyWithoutShopNestedInput
    fonts?: FontUpdateManyWithoutShopNestedInput
    logos?: LogoUpdateManyWithoutShopNestedInput
    configurations?: ConfigurationUpdateManyWithoutShopNestedInput
  }

  export type ShopUncheckedUpdateWithoutDesigns2dInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    products?: ProductUncheckedUpdateManyWithoutShopNestedInput
    models3d?: Model3DUncheckedUpdateManyWithoutShopNestedInput
    colors?: ColorUncheckedUpdateManyWithoutShopNestedInput
    fonts?: FontUncheckedUpdateManyWithoutShopNestedInput
    logos?: LogoUncheckedUpdateManyWithoutShopNestedInput
    configurations?: ConfigurationUncheckedUpdateManyWithoutShopNestedInput
  }

  export type ShopCreateWithoutColorsInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    products?: ProductCreateNestedManyWithoutShopInput
    models3d?: Model3DCreateNestedManyWithoutShopInput
    designs2d?: Design2DCreateNestedManyWithoutShopInput
    fonts?: FontCreateNestedManyWithoutShopInput
    logos?: LogoCreateNestedManyWithoutShopInput
    configurations?: ConfigurationCreateNestedManyWithoutShopInput
  }

  export type ShopUncheckedCreateWithoutColorsInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    products?: ProductUncheckedCreateNestedManyWithoutShopInput
    models3d?: Model3DUncheckedCreateNestedManyWithoutShopInput
    designs2d?: Design2DUncheckedCreateNestedManyWithoutShopInput
    fonts?: FontUncheckedCreateNestedManyWithoutShopInput
    logos?: LogoUncheckedCreateNestedManyWithoutShopInput
    configurations?: ConfigurationUncheckedCreateNestedManyWithoutShopInput
  }

  export type ShopCreateOrConnectWithoutColorsInput = {
    where: ShopWhereUniqueInput
    create: XOR<ShopCreateWithoutColorsInput, ShopUncheckedCreateWithoutColorsInput>
  }

  export type ShopUpsertWithoutColorsInput = {
    update: XOR<ShopUpdateWithoutColorsInput, ShopUncheckedUpdateWithoutColorsInput>
    create: XOR<ShopCreateWithoutColorsInput, ShopUncheckedCreateWithoutColorsInput>
    where?: ShopWhereInput
  }

  export type ShopUpdateToOneWithWhereWithoutColorsInput = {
    where?: ShopWhereInput
    data: XOR<ShopUpdateWithoutColorsInput, ShopUncheckedUpdateWithoutColorsInput>
  }

  export type ShopUpdateWithoutColorsInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    products?: ProductUpdateManyWithoutShopNestedInput
    models3d?: Model3DUpdateManyWithoutShopNestedInput
    designs2d?: Design2DUpdateManyWithoutShopNestedInput
    fonts?: FontUpdateManyWithoutShopNestedInput
    logos?: LogoUpdateManyWithoutShopNestedInput
    configurations?: ConfigurationUpdateManyWithoutShopNestedInput
  }

  export type ShopUncheckedUpdateWithoutColorsInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    products?: ProductUncheckedUpdateManyWithoutShopNestedInput
    models3d?: Model3DUncheckedUpdateManyWithoutShopNestedInput
    designs2d?: Design2DUncheckedUpdateManyWithoutShopNestedInput
    fonts?: FontUncheckedUpdateManyWithoutShopNestedInput
    logos?: LogoUncheckedUpdateManyWithoutShopNestedInput
    configurations?: ConfigurationUncheckedUpdateManyWithoutShopNestedInput
  }

  export type ShopCreateWithoutFontsInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    products?: ProductCreateNestedManyWithoutShopInput
    models3d?: Model3DCreateNestedManyWithoutShopInput
    designs2d?: Design2DCreateNestedManyWithoutShopInput
    colors?: ColorCreateNestedManyWithoutShopInput
    logos?: LogoCreateNestedManyWithoutShopInput
    configurations?: ConfigurationCreateNestedManyWithoutShopInput
  }

  export type ShopUncheckedCreateWithoutFontsInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    products?: ProductUncheckedCreateNestedManyWithoutShopInput
    models3d?: Model3DUncheckedCreateNestedManyWithoutShopInput
    designs2d?: Design2DUncheckedCreateNestedManyWithoutShopInput
    colors?: ColorUncheckedCreateNestedManyWithoutShopInput
    logos?: LogoUncheckedCreateNestedManyWithoutShopInput
    configurations?: ConfigurationUncheckedCreateNestedManyWithoutShopInput
  }

  export type ShopCreateOrConnectWithoutFontsInput = {
    where: ShopWhereUniqueInput
    create: XOR<ShopCreateWithoutFontsInput, ShopUncheckedCreateWithoutFontsInput>
  }

  export type ShopUpsertWithoutFontsInput = {
    update: XOR<ShopUpdateWithoutFontsInput, ShopUncheckedUpdateWithoutFontsInput>
    create: XOR<ShopCreateWithoutFontsInput, ShopUncheckedCreateWithoutFontsInput>
    where?: ShopWhereInput
  }

  export type ShopUpdateToOneWithWhereWithoutFontsInput = {
    where?: ShopWhereInput
    data: XOR<ShopUpdateWithoutFontsInput, ShopUncheckedUpdateWithoutFontsInput>
  }

  export type ShopUpdateWithoutFontsInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    products?: ProductUpdateManyWithoutShopNestedInput
    models3d?: Model3DUpdateManyWithoutShopNestedInput
    designs2d?: Design2DUpdateManyWithoutShopNestedInput
    colors?: ColorUpdateManyWithoutShopNestedInput
    logos?: LogoUpdateManyWithoutShopNestedInput
    configurations?: ConfigurationUpdateManyWithoutShopNestedInput
  }

  export type ShopUncheckedUpdateWithoutFontsInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    products?: ProductUncheckedUpdateManyWithoutShopNestedInput
    models3d?: Model3DUncheckedUpdateManyWithoutShopNestedInput
    designs2d?: Design2DUncheckedUpdateManyWithoutShopNestedInput
    colors?: ColorUncheckedUpdateManyWithoutShopNestedInput
    logos?: LogoUncheckedUpdateManyWithoutShopNestedInput
    configurations?: ConfigurationUncheckedUpdateManyWithoutShopNestedInput
  }

  export type ShopCreateWithoutLogosInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    products?: ProductCreateNestedManyWithoutShopInput
    models3d?: Model3DCreateNestedManyWithoutShopInput
    designs2d?: Design2DCreateNestedManyWithoutShopInput
    colors?: ColorCreateNestedManyWithoutShopInput
    fonts?: FontCreateNestedManyWithoutShopInput
    configurations?: ConfigurationCreateNestedManyWithoutShopInput
  }

  export type ShopUncheckedCreateWithoutLogosInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    products?: ProductUncheckedCreateNestedManyWithoutShopInput
    models3d?: Model3DUncheckedCreateNestedManyWithoutShopInput
    designs2d?: Design2DUncheckedCreateNestedManyWithoutShopInput
    colors?: ColorUncheckedCreateNestedManyWithoutShopInput
    fonts?: FontUncheckedCreateNestedManyWithoutShopInput
    configurations?: ConfigurationUncheckedCreateNestedManyWithoutShopInput
  }

  export type ShopCreateOrConnectWithoutLogosInput = {
    where: ShopWhereUniqueInput
    create: XOR<ShopCreateWithoutLogosInput, ShopUncheckedCreateWithoutLogosInput>
  }

  export type ShopUpsertWithoutLogosInput = {
    update: XOR<ShopUpdateWithoutLogosInput, ShopUncheckedUpdateWithoutLogosInput>
    create: XOR<ShopCreateWithoutLogosInput, ShopUncheckedCreateWithoutLogosInput>
    where?: ShopWhereInput
  }

  export type ShopUpdateToOneWithWhereWithoutLogosInput = {
    where?: ShopWhereInput
    data: XOR<ShopUpdateWithoutLogosInput, ShopUncheckedUpdateWithoutLogosInput>
  }

  export type ShopUpdateWithoutLogosInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    products?: ProductUpdateManyWithoutShopNestedInput
    models3d?: Model3DUpdateManyWithoutShopNestedInput
    designs2d?: Design2DUpdateManyWithoutShopNestedInput
    colors?: ColorUpdateManyWithoutShopNestedInput
    fonts?: FontUpdateManyWithoutShopNestedInput
    configurations?: ConfigurationUpdateManyWithoutShopNestedInput
  }

  export type ShopUncheckedUpdateWithoutLogosInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    products?: ProductUncheckedUpdateManyWithoutShopNestedInput
    models3d?: Model3DUncheckedUpdateManyWithoutShopNestedInput
    designs2d?: Design2DUncheckedUpdateManyWithoutShopNestedInput
    colors?: ColorUncheckedUpdateManyWithoutShopNestedInput
    fonts?: FontUncheckedUpdateManyWithoutShopNestedInput
    configurations?: ConfigurationUncheckedUpdateManyWithoutShopNestedInput
  }

  export type ShopCreateWithoutConfigurationsInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    products?: ProductCreateNestedManyWithoutShopInput
    models3d?: Model3DCreateNestedManyWithoutShopInput
    designs2d?: Design2DCreateNestedManyWithoutShopInput
    colors?: ColorCreateNestedManyWithoutShopInput
    fonts?: FontCreateNestedManyWithoutShopInput
    logos?: LogoCreateNestedManyWithoutShopInput
  }

  export type ShopUncheckedCreateWithoutConfigurationsInput = {
    id?: string
    shopDomain: string
    shopGid?: string | null
    accessToken?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    products?: ProductUncheckedCreateNestedManyWithoutShopInput
    models3d?: Model3DUncheckedCreateNestedManyWithoutShopInput
    designs2d?: Design2DUncheckedCreateNestedManyWithoutShopInput
    colors?: ColorUncheckedCreateNestedManyWithoutShopInput
    fonts?: FontUncheckedCreateNestedManyWithoutShopInput
    logos?: LogoUncheckedCreateNestedManyWithoutShopInput
  }

  export type ShopCreateOrConnectWithoutConfigurationsInput = {
    where: ShopWhereUniqueInput
    create: XOR<ShopCreateWithoutConfigurationsInput, ShopUncheckedCreateWithoutConfigurationsInput>
  }

  export type ShopUpsertWithoutConfigurationsInput = {
    update: XOR<ShopUpdateWithoutConfigurationsInput, ShopUncheckedUpdateWithoutConfigurationsInput>
    create: XOR<ShopCreateWithoutConfigurationsInput, ShopUncheckedCreateWithoutConfigurationsInput>
    where?: ShopWhereInput
  }

  export type ShopUpdateToOneWithWhereWithoutConfigurationsInput = {
    where?: ShopWhereInput
    data: XOR<ShopUpdateWithoutConfigurationsInput, ShopUncheckedUpdateWithoutConfigurationsInput>
  }

  export type ShopUpdateWithoutConfigurationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    products?: ProductUpdateManyWithoutShopNestedInput
    models3d?: Model3DUpdateManyWithoutShopNestedInput
    designs2d?: Design2DUpdateManyWithoutShopNestedInput
    colors?: ColorUpdateManyWithoutShopNestedInput
    fonts?: FontUpdateManyWithoutShopNestedInput
    logos?: LogoUpdateManyWithoutShopNestedInput
  }

  export type ShopUncheckedUpdateWithoutConfigurationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopDomain?: StringFieldUpdateOperationsInput | string
    shopGid?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    products?: ProductUncheckedUpdateManyWithoutShopNestedInput
    models3d?: Model3DUncheckedUpdateManyWithoutShopNestedInput
    designs2d?: Design2DUncheckedUpdateManyWithoutShopNestedInput
    colors?: ColorUncheckedUpdateManyWithoutShopNestedInput
    fonts?: FontUncheckedUpdateManyWithoutShopNestedInput
    logos?: LogoUncheckedUpdateManyWithoutShopNestedInput
  }

  export type ProductCreateManyShopInput = {
    id?: string
    productGid: string
    handle: string
    defaultModelId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type Model3DCreateManyShopInput = {
    id?: string
    name: string
    glbUrl: string
    materialsSchema: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type Design2DCreateManyShopInput = {
    id?: string
    name: string
    svgUrl: string
    mappedRegions: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ColorCreateManyShopInput = {
    id?: string
    name: string
    hex: string
    materialBindings: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FontCreateManyShopInput = {
    id?: string
    name: string
    woffUrl: string
    sdfMeta?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LogoCreateManyShopInput = {
    id?: string
    name: string
    fileUrl: string
    vector?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ConfigurationCreateManyShopInput = {
    id?: string
    productGid: string
    variantGid?: string | null
    payloadJSON: JsonNullValueInput | InputJsonValue
    thumbnailUrl?: string | null
    createdBy?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProductUpdateWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    handle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    defaultModel?: Model3DUpdateOneWithoutProductsDefaultingNestedInput
    variants?: VariantUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    handle?: StringFieldUpdateOperationsInput | string
    defaultModelId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    variants?: VariantUncheckedUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateManyWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    handle?: StringFieldUpdateOperationsInput | string
    defaultModelId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type Model3DUpdateWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    glbUrl?: StringFieldUpdateOperationsInput | string
    materialsSchema?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    productsDefaulting?: ProductUpdateManyWithoutDefaultModelNestedInput
  }

  export type Model3DUncheckedUpdateWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    glbUrl?: StringFieldUpdateOperationsInput | string
    materialsSchema?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    productsDefaulting?: ProductUncheckedUpdateManyWithoutDefaultModelNestedInput
  }

  export type Model3DUncheckedUpdateManyWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    glbUrl?: StringFieldUpdateOperationsInput | string
    materialsSchema?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type Design2DUpdateWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    svgUrl?: StringFieldUpdateOperationsInput | string
    mappedRegions?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type Design2DUncheckedUpdateWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    svgUrl?: StringFieldUpdateOperationsInput | string
    mappedRegions?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type Design2DUncheckedUpdateManyWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    svgUrl?: StringFieldUpdateOperationsInput | string
    mappedRegions?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ColorUpdateWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    hex?: StringFieldUpdateOperationsInput | string
    materialBindings?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ColorUncheckedUpdateWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    hex?: StringFieldUpdateOperationsInput | string
    materialBindings?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ColorUncheckedUpdateManyWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    hex?: StringFieldUpdateOperationsInput | string
    materialBindings?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FontUpdateWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    woffUrl?: StringFieldUpdateOperationsInput | string
    sdfMeta?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FontUncheckedUpdateWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    woffUrl?: StringFieldUpdateOperationsInput | string
    sdfMeta?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FontUncheckedUpdateManyWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    woffUrl?: StringFieldUpdateOperationsInput | string
    sdfMeta?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LogoUpdateWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    vector?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LogoUncheckedUpdateWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    vector?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LogoUncheckedUpdateManyWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    fileUrl?: StringFieldUpdateOperationsInput | string
    vector?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConfigurationUpdateWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    variantGid?: NullableStringFieldUpdateOperationsInput | string | null
    payloadJSON?: JsonNullValueInput | InputJsonValue
    thumbnailUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConfigurationUncheckedUpdateWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    variantGid?: NullableStringFieldUpdateOperationsInput | string | null
    payloadJSON?: JsonNullValueInput | InputJsonValue
    thumbnailUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConfigurationUncheckedUpdateManyWithoutShopInput = {
    id?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    variantGid?: NullableStringFieldUpdateOperationsInput | string | null
    payloadJSON?: JsonNullValueInput | InputJsonValue
    thumbnailUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdBy?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VariantCreateManyProductInput = {
    id?: string
    variantGid: string
    presetId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VariantUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    variantGid?: StringFieldUpdateOperationsInput | string
    presetId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VariantUncheckedUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    variantGid?: StringFieldUpdateOperationsInput | string
    presetId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VariantUncheckedUpdateManyWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    variantGid?: StringFieldUpdateOperationsInput | string
    presetId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProductCreateManyDefaultModelInput = {
    id?: string
    shopId: string
    productGid: string
    handle: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProductUpdateWithoutDefaultModelInput = {
    id?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    handle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    shop?: ShopUpdateOneRequiredWithoutProductsNestedInput
    variants?: VariantUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateWithoutDefaultModelInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    handle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    variants?: VariantUncheckedUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateManyWithoutDefaultModelInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    productGid?: StringFieldUpdateOperationsInput | string
    handle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}