import type {
  TObject,
  ObjectOptions as TObjectOptions,
  TProperties,
  TSchema,
} from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'

/**
 * Create a schema with a string enumeration type
 */
export function StringEnum<T extends string[]>(values: [...T]) {
  return Type.Unsafe<T[number]>({ type: 'string', enum: values })
}

/**
 * Create a schema with a number enumeration type
 */
export function NumberEnum<T extends number[]>(values: [...T]) {
  return Type.Unsafe<T[number]>({ type: 'number', enum: values })
}

/**
 * Enumeration of response status codes
 */
export enum ResponseCode {
  SUCCESS = 0,
  ERROR = -1,
}

/**
 * Convert object properties to nullable
 */
export function Nullable<T extends TObject>(schema: T) {
  return Type.Object(
    Object.fromEntries(
      Object.entries(schema.properties).map(([k, v]) => [k, Type.Union([v, Type.Null()])]),
    ) as TProperties,
    { ...schema, properties: undefined },
  )
}

/**
 * Generic HTTP response schema constructor
 */
function createHttpResponseSchema<T extends TSchema = any>(code: number, msgSchema: TSchema, dataSchema?: T, options?: TObjectOptions) {
  return Type.Object(
    {
      code: Type.Literal(code, { format: 'int32', example: code }),
      msg: msgSchema,
      data: Type.Optional(
        dataSchema
          ? Type.Union([dataSchema, Type.Null()])
          : Type.Any({ description: 'response data' }),
      ),
    },
    options,
  )
}

/**
 * HTTP success/error/redirect response schema
 */
export function createHttpSuccessResponseSchema<T extends TSchema = any>(dataSchema?: T, options?: TObjectOptions) {
  return createHttpResponseSchema(ResponseCode.SUCCESS, Type.Literal('ok'), dataSchema, options)
}

export function createHttpErrorResponseSchema<T extends TSchema = any>(dataSchema?: T, options?: TObjectOptions) {
  return createHttpResponseSchema(ResponseCode.ERROR, Type.String(), dataSchema, options)
}

export function createHttpRedirectResponseSchema() {
  return Type.Object(
    { headers: Type.Object({ location: Type.String({ format: 'uri' }) }) },
    { additionalProperties: false },
  )
}

/**
 * Predefined Response Modes
 */
export const HttpSuccessResponseSchema = createHttpSuccessResponseSchema()
export const HttpErrorResponseSchema = createHttpErrorResponseSchema()
export const HttpRedirectResponseSchema = createHttpRedirectResponseSchema()

/**
 * Generic response schema
 */
export const ResponseSchema = {
  200: HttpSuccessResponseSchema,
  301: HttpRedirectResponseSchema,
  302: HttpRedirectResponseSchema,
  400: HttpErrorResponseSchema,
  500: HttpErrorResponseSchema,
}

/**
 * Create a routing schema with standard responses
 */
export function createRouteSchema<T extends TSchema = TSchema, R extends TSchema = TSchema>(requestSchema?: T, responseDataSchema?: R) {
  return {
    ...(requestSchema ? { body: requestSchema } : {}),
    response: {
      200: createHttpSuccessResponseSchema(responseDataSchema),
      301: HttpRedirectResponseSchema,
      302: HttpRedirectResponseSchema,
      400: createHttpErrorResponseSchema(responseDataSchema),
      500: createHttpErrorResponseSchema(responseDataSchema),
    },
  }
}
