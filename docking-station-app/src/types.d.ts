
export interface AppSettings {
  autoUpdater: {
    enabled: boolean
    interval: number
    maxConcurrent: number
  }
  server: {
    cacheControlMaxAge: number
    ignoreComposeStackNameKeywords: string[]
    ignoreLabelFieldName: string
    possibleHomepageLabels: string[]
    possibleImageVersionLabels: string[]
    timeUntilUpdateIsMature: number
  }
  nodeEnv: 'development' | 'production'
  serverPort: number
  webPort: number
}

export interface DockerImageResponse {
  id: string
  createdAt: string
  hasUpdates: boolean
  imageName: string
  imageTag: string
  latestUpdate: string
  latestVersion?: string
  repoLocalDigest: string
  version?: string
}

export interface DockerImage extends DockerImageResponse {
  createdAt: Date
  latestUpdate: Date
}

export interface DockerContainerResponse {
  id: string
  createdAt: string
  uptime: string
  hasUpdates: boolean
  homepageUrl?: string
  image: DockerImageResponse
  labels: { [key: string]: string }
  name: string
  ports: {
    [key: string]: {
      hostIp: string
      hostPort: string
    }[]
  }
  stackName?: string
  serviceName?: string
  status: string
}

export interface DockerContainer extends DockerContainerResponse {
  createdAt: Date
  image: DockerImage
}

export interface DockerStackResponse {
  configFiles: string[]
  services: DockerContainerResponse[]
  created: int
  dead: int
  exited: int
  hasUpdates: boolean
  name: string
  paused: int
  restarting: int
  running: int
}

export interface DockerStack extends DockerStackResponse {
  services: DockerContainer[]
}

export interface DockerServiceUpdateRequest {
  inferEnvfile?: boolean
  pruneImages?: boolean
  restartContainers?: boolean
}

export interface DockerServiceUpdateResponse {
  success: boolean
  output: string[]
}

export interface DockerServiceUpdateWsMessage {
  stage: string
  message: string
}
