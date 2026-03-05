import type { FastifyCorsOptions } from '@fastify/cors'
import type { SwaggerOptions as FastifySwaggerOptions } from '@fastify/swagger'
import type { FastifySwaggerUiOptions } from '@fastify/swagger-ui'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import type { FastifyBaseLogger, FastifyInstance } from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyMultipart from '@fastify/multipart'
import { fastifySchedule } from '@fastify/schedule'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { loggerService } from '@logger'
import { configManager } from '@main/services/ConfigManager'
import { Schema } from '@main/types/server'
import { isDev } from '@main/utils/systeminfo'
import { APP_DESC, APP_NAME, APP_VERSION } from '@shared/config/appinfo'
import { LOG_MODULE } from '@shared/config/logger'
import { CacheService } from '@shared/modules/cache'
import fastify from 'fastify'
import StatusCodes from 'http-status-codes'
import qs from 'qs'
import {
  HttpErrorResponseSchema,
  HttpRedirectResponseSchema,
  HttpSuccessResponseSchema,
} from './schemas/base'

import { registerCoreTasks } from './task'

const logger = loggerService.withContext(LOG_MODULE.FASTIFY)

export class FastifyService {
  private static instance: FastifyService | null = null
  private server: FastifyInstance | null = null
  private PORT: number = 9978

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): FastifyService {
    if (!FastifyService.instance) {
      FastifyService.instance = new FastifyService()
    }
    return FastifyService.instance
  }

  public async start(): Promise<boolean> {
    if (this.server) {
      return true
    }

    try {
      this.server = fastify({
        logger: isDev ? { level: 'debug' } : false,
        routerOptions: {
          ignoreTrailingSlash: true, // 忽略路径末尾的斜杠
          maxParamLength: 1024 * 10, // 最大参数长度 10KB
          querystringParser: (str: string) => qs.parse(str), // 自定义查询字符串解析器
        },
        forceCloseConnections: true, // 强制关闭连接
        bodyLimit: 3 * 1024 * 1024, // 最大请求体大小 3MB
        trustProxy: true, // 信任代理
        requestTimeout: 60_000, // 请求超时 60s
        connectionTimeout: 65_000, // 连接超时 65s
        ajv: {
          customOptions: {
            allErrors: true, // 显示所有错误
            coerceTypes: 'array', // 强制类型转换为数组
            removeAdditional: true, // 移除额外的属性
            // useDefaults: true,  // 使用默认值
          },
        },
      })

      this.server.withTypeProvider<TypeBoxTypeProvider>() // 启用 TypeBox 类型提供器
      this.server.log = this.customLogger() // 自定义日志记录器

      this.registerHandlers()
      this.registerHooks()
      this.registerSchemas()
      await this.registerPlugins()
      // await this.registerRoutes();

      await this.server!.ready() // Finalize server setup
      await this.registerSchedules()

      if (isDev || configManager.debug) {
        this.server!.swagger()
      } // swagger documentation
      await this.server!.listen({ port: this.PORT, host: '0.0.0.0' })
    }
    catch (error) {
      logger.error(`Fastify Service Start Failed: ${(error as Error).message}`)
    }

    return this.status()
  }

  /**
   * 停止 Fastify 服务
   * @async
   * @returns {Promise<boolean>} 如果服务已停止则返回 true，否则返回 false
   */
  public async stop(): Promise<boolean> {
    if (this.server) {
      try {
        this.server.server.close()
        await this.server.close()
        this.server = null
      }
      catch (error) {
        logger.error(`Fastify Service Stop Failed: ${(error as Error).message}`)
      }
    }

    return !this.status()
  }

  /**
   * 重启 Fastify 服务
   * @async
   * @returns {Promise<boolean>} 如果服务已重启则返回 true，否则返回 false
   */
  public async restart(): Promise<boolean> {
    if (this.server) {
      return true
    }

    try {
      await this.stop()
      await this.start()
    }
    catch (error) {
      logger.error(`Fastify Service Restart Failed: ${(error as Error).message}`)
    }

    return this.status()
  }

  /**
   * 检查 Fastify 服务是否已启动
   * @returns {boolean} 如果服务已启动则返回 true，否则返回 false
   */
  public status(): boolean {
    return !!this.server
  }

  /**
   * 注册 Server 错误处理程序
   * @private
   * @async
   * @returns {Promise<void>}
   */
  private async registerHandlers(): Promise<void> {
    this.server!.setErrorHandler((error: Error, _request, reply) => {
      logger.error(`Fastify Service Uncaught Exception: ${error.message}`)

      reply
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send({ code: -1, msg: `Internal Server Error - ${error.name}`, data: error.message })
    })
  }

  /**
   * 注册 Server 超时处理程序
   * @private
   * @async
   * @returns {Promise<void>}
   */
  private async registerHooks(): Promise<void> {
    this.server!.addHook('onTimeout', async (req, reply) => {
      logger.warn(`Fastify Response Timeout: ${req.url}`)
      reply
        .status(StatusCodes.REQUEST_TIMEOUT)
        .send({ code: -1, msg: 'Request Timeout', data: null })
    })
  }

  /**
   * 注册 Server 响应体 Schema
   * @private
   * @async
   * @returns {Promise<void>}
   */
  private async registerSchemas(): Promise<void> {
    this.server!.addSchema({ ...HttpSuccessResponseSchema, $id: Schema.ApiReponseSuccess })
    this.server!.addSchema({ ...HttpErrorResponseSchema, $id: Schema.ApiReponseError })
    this.server!.addSchema({ ...HttpRedirectResponseSchema, $id: Schema.ApiReponseRedirect })
  }

  /**
   * 注册 Server 插件
   * @private
   * @async
   * @returns {Promise<void>}
   */
  private async registerPlugins(): Promise<void> {
    // Register CORS
    await this.server!.register(fastifyCors, {
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      origin: '*',
    } as FastifyCorsOptions)

    // Register multipart
    await this.server!.register(fastifyMultipart)

    // Register schedule
    await this.server!.register(fastifySchedule)

    // Register cache
    this.server!.decorate('cache', CacheService)

    // Register swagger
    if (isDev || configManager.debug) {
      await this.server!.register(fastifySwagger, {
        openapi: {
          info: {
            title: `${APP_NAME} - openapi`,
            description: APP_DESC,
            version: APP_VERSION,
            license: {
              name: 'License',
              url: 'https://www.gnu.org/licenses/agpl-3.0.html',
            },
          },
          externalDocs: {
            url: 'https://swagger.io',
            description: 'Find out more about Swagger',
          },
        },
      } as FastifySwaggerOptions)

      await this.server!.register(fastifySwaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: false,
          tryItOutEnabled: true,
          layout: 'BaseLayout',
        },
        staticCSP: true,
        transformSpecificationClone: true,
      } as FastifySwaggerUiOptions)
    }
  }

  /**
   * 注册 Server 路由
   * @private
   * @async
   * @returns {Promise<void>}
   */
  // private async registerRoutes(): Promise<void> {
  //   const config = {
  //     routeTimeout: 0,
  //     routeTimeoutMessage: JSON.stringify({ code: 408, msg: 'Request Timeout' }),
  //     routeTimeoutGracefully: true, // Trigger onResponse hook even after timeout
  //   };

  //   const routes = routeModules;
  //   for (const { plugin, prefix } of routes) {
  //     await this.server!.register(plugin, prefix ? { ...config, prefix } : { ...config });
  //   }
  // }

  /**
   * 注册 Server 自定义日志记录器
   * @private
   * @returns {FastifyBaseLogger} 自定义日志记录器
   */
  private customLogger(): FastifyBaseLogger {
    return {
      info: (o: any, ...n: any[]) => logger.info(o, ...(n as any)),
      debug: (o: any, ...n: any[]) => logger.debug(o, ...(n as any)),
      warn: (o: any, ...n: any[]) => logger.warn(o, ...(n as any)),
      error: (o: any, ...n: any[]) => logger.error(o, ...(n as any)),
      fatal: (o: any, ...n: any[]) => logger.error(o, ...(n as any)),
      trace: (o: any, ...n: any[]) => logger.debug(o, ...(n as any)),
      silent: () => {},
      child: () => this.customLogger(),
      level: 'info',
    }
  }

  /**
   * 注册定时任务
   */
  private async registerSchedules(): Promise<void> {
    if (!this.server) { return }

    registerCoreTasks(this.server)
  }
}

export const fastifyService = FastifyService.getInstance()
