import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { optionalAuth } from './middlewares/auth.js'

import dotenv from "dotenv"
dotenv.config();

import propertyApp from './routes/property.js';
import authApp from './routes/auth.js';
import bookingApp from './routes/booking.js';

const app = new Hono({
  strict: false,
});

const serverStartTime = Date.now();

app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
      "https://airbnb-fe-fawn.vercel.app",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use("*", optionalAuth)  

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route("/auth", authApp);
app.route("/properties", propertyApp);
app.route("/bookings", bookingApp);

app.get("/health", (c) => {
  const now = Date.now();
  const uptimeSeconds = Math.floor((now - serverStartTime) / 1000);

  return c.json({
    status: "ok",
    message: "Service is healthy",
    uptime: uptimeSeconds,
    startedAt: new Date(serverStartTime).toISOString(),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    console.log("managed risk error");
    return err.getResponse();
  }
  console.log("unexpected error", err);
  return c.json({ error: "Internal server error" }, 500);
});

serve({
  fetch: app.fetch,
  port: Number(process.env.HONO_PORT) || 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
