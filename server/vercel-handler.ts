import { app } from "./app.ts"

export const config = {
  runtime: "nodejs",
}

export function GET(request: Request) {
  return app.fetch(request)
}

export function PUT(request: Request) {
  return app.fetch(request)
}
