import { env } from "process"

export const getImageFromKey = (key: string) => {
  return  "https://stock-read-worker.useradius.workers.dev/file?key=" + key
}