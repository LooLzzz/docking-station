import type {
  DockerContainer,
  DockerContainerResponse,
  DockerImage,
  DockerImageResponse,
  DockerStack,
  DockerStackResponse
} from '@/types'


export function parseDockerStackDates(stack: DockerStackResponse): DockerStack {
  return {
    ...stack,
    services: stack.services.map(parseDockerContainerDates),
  }
}

export function parseDockerContainerDates(container: DockerContainerResponse): DockerContainer {
  return {
    ...container,
    createdAt: new Date(container.createdAt),
    image: parseDockerImageDates(container.image),
  }
}

export function parseDockerImageDates(image: DockerImageResponse): DockerImage {
  return {
    ...image,
    createdAt: new Date(image.createdAt),
    latestUpdate: new Date(image.latestUpdate),
  }
}
