// Docker服务器连接类型
export type ConnectionType = 'local' | 'tcp' | 'tls' | 'ssh';

// Docker服务器状态
export type ServerStatus = 'online' | 'offline' | 'unknown' | 'error';

// Docker服务器配置
export interface DockerServer {
  id: string;
  name: string;
  description?: string;
  connection_type: ConnectionType;
  host?: string;
  port?: number;
  ca_cert?: string;
  client_cert?: string;
  client_key?: string;
  status: ServerStatus;
  last_check_time?: string;
  last_error?: string;
  latency?: number;
  is_default: number;
  tags?: string;
  created_at: string;
  updated_at: string;
}

// 容器状态
export type ContainerState = 'created' | 'running' | 'paused' | 'restarting' | 'removing' | 'exited' | 'dead';

// 容器端口映射
export interface ContainerPort {
  IP?: string;
  PrivatePort: number;
  PublicPort?: number;
  Type: string;
}

// 容器信息
export interface Container {
  id: string;
  name: string;
  image: string;
  imageId: string;
  command: string;
  created: number;
  state: ContainerState;
  status: string;
  ports: ContainerPort[];
  labels: Record<string, string>;
  mounts: any[];
  networks: string[];
}

// 容器详情
export interface ContainerDetail {
  id: string;
  name: string;
  created: string;
  path: string;
  args: string[];
  state: {
    Status: string;
    Running: boolean;
    Paused: boolean;
    Restarting: boolean;
    OOMKilled: boolean;
    Dead: boolean;
    Pid: number;
    ExitCode: number;
    Error: string;
    StartedAt: string;
    FinishedAt: string;
  };
  image: string;
  config: any;
  networkSettings: any;
  mounts: any[];
  hostConfig: any;
}

// 容器统计信息
export interface ContainerStats {
  cpu: number;
  memory: {
    usage: number;
    limit: number;
    percent: string;
  };
  network: any;
  blockIO: any;
}

// 镜像信息
export interface Image {
  id: string;
  tags: string[];
  digests: string[];
  created: number;
  size: number;
  virtualSize: number;
  labels: Record<string, string>;
  containers: number;
}

// 网络信息
export interface Network {
  id: string;
  name: string;
  driver: string;
  scope: string;
  internal: boolean;
  ipam: any;
  containers: any;
  options: Record<string, string>;
  labels: Record<string, string>;
}

// 卷信息
export interface Volume {
  name: string;
  driver: string;
  mountpoint: string;
  created: string;
  labels: Record<string, string>;
  scope: string;
  options: Record<string, string>;
}

// 系统信息
export interface SystemInfo {
  containers: number;
  containersRunning: number;
  containersPaused: number;
  containersStopped: number;
  images: number;
  dockerVersion: string;
  apiVersion: string;
  os: string;
  arch: string;
  cpus: number;
  memory: number;
  serverTime: string;
}

// 审计日志
export interface AuditLog {
  id: number;
  server_id: string;
  action: string;
  resource_type: 'container' | 'image' | 'volume' | 'network';
  resource_id: string;
  resource_name?: string;
  status: 'success' | 'failed';
  error_message?: string;
  user_info?: string;
  created_at: string;
}

// 服务器表单数据
export interface ServerFormData {
  name: string;
  description?: string;
  connection_type: ConnectionType;
  host?: string;
  port?: number;
  is_default?: boolean;
  tags?: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
