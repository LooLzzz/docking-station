
export interface DockerImageResponse {
  id: string
  createdAt: string
  hasUpdates: boolean
  imageName: string
  imageTag: string
  repoLocalDigest: string
  repoRemoteDigest: string
}

export interface DockerImage extends DockerImageResponse {
  createdAt: Date
}

export interface DockerContainerResponse {
  id: string
  createdAt: string
  hasUpdates: boolean
  image: DockerImageResponse
  // labels: { [key: string]: string }
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

export interface DockerStackUpdateRequest {
  stack: string
  inferEnvfile?: boolean
  pruneImages?: boolean
  restartContainers?: boolean
}
