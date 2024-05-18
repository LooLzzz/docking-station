
const BACKEND_HOST = process.env.BACKEND_HOST ?? 'localhost'
const BACKEND_PORT = process.env.BACKEND_PORT ?? 3001
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`

export const apiRoutes = {
  getSettings: `${BACKEND_URL}/settings`, // GET
  updateSettings: `${BACKEND_URL}/settings`, // PATCH

  getAllMonitoredWebsites: `${BACKEND_URL}/monitor`, // GET
  createMonitoredWebsite: `${BACKEND_URL}/monitor`, // PUT
  deleteMonitoredWebsite: (id: number) => `${BACKEND_URL}/monitor/${id}`, // DELETE
  updateMonitoredWebsite: (id: number) => `${BACKEND_URL}/monitor/${id}`, // PATCH

  getWebsiteHistory: (id: number) => `${BACKEND_URL}/history/${id}`, // GET
  clearWebsiteHistory: (id: number) => `${BACKEND_URL}/history/${id}`, // DELETE
  getLatestWebsiteHistory: (id: number) => `${BACKEND_URL}/history/${id}/latest`, // GET
}
