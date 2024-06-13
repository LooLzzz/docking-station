
export const apiRoutes = {
  /** `GET` */
  getAppSettings: 'api/settings',
  /** `GET` */
  getStats: 'api/stats',

  /** `GET` */
  listComposeStacks: 'api/stacks',
  /** `GET` */
  getComposeStack: (stack: string) => `api/stacks/${stack}`,
  /** `GET` */
  getComposeService: (stack: string, service: string) => `api/stacks/${stack}/${service}`,

  /** `POST` */
  createUpdateComposeStackServiceTask: (stack: string, service: string) => `api/stacks/${stack}/${service}/task`,
  /** `GET` */
  pollUpdateComposeStackServiceTask: (stack: string, service: string) => `api/stacks/${stack}/${service}/task`,
}
