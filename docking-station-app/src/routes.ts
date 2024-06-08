
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
  updateComposeStack: (stack: string) => `api/stacks/${stack}`,
  /** `POST` */
  updateComposeStackService: (stack: string, service: string) => `api/stacks/${stack}/${service}`,
}
