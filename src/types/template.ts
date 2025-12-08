import type { Service, ServiceType } from "./service"

/**
 * 模板变量
 */
export interface TemplateVariable {
  name: string                    // 变量名（如 PORT, HOST）
  label: string                   // 显示标签
  type: "string" | "number" | "boolean" | "path" | "select"
  defaultValue?: string | number | boolean
  required?: boolean
  description?: string
  options?: string[]              // select 类型的选项
  placeholder?: string
  validation?: {
    pattern?: string              // 正则表达式
    min?: number                  // 最小值（number 类型）
    max?: number                  // 最大值（number 类型）
    minLength?: number            // 最小长度（string 类型）
    maxLength?: number            // 最大长度（string 类型）
  }
}

/**
 * 服务模板
 */
export interface ServiceTemplate {
  id: string
  name: string
  description: string
  category: "database" | "cache" | "web" | "middleware" | "custom"
  icon?: string
  serviceType: ServiceType
  
  // 模板配置
  template: Partial<Service>
  
  // 模板变量
  variables: TemplateVariable[]
  
  // 元数据
  author?: string
  version?: string
  tags?: string[]
  createdAt?: string
  updatedAt?: string
  
  // 是否为系统内置模板
  isBuiltIn?: boolean
}

/**
 * 模板应用结果
 */
export interface TemplateApplyResult {
  service: Partial<Service>
  warnings?: string[]
}

/**
 * 模板验证结果
 */
export interface TemplateValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * 模板分类
 */
export const TEMPLATE_CATEGORIES = {
  database: "数据库",
  cache: "缓存",
  web: "Web 服务",
  middleware: "中间件",
  custom: "自定义",
} as const

/**
 * 内置模板 ID
 */
export const BUILTIN_TEMPLATE_IDS = {
  TOMCAT: "builtin-tomcat",
  REDIS: "builtin-redis",
  NGINX: "builtin-nginx",
  MYSQL: "builtin-mysql",
  NODEJS: "builtin-nodejs",
  PYTHON: "builtin-python",
} as const
