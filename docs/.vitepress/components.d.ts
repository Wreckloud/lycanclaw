// 组件声明文件
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Waline客户端类型声明
declare module '@waline/client' {
  export function init(options: any): any
} 