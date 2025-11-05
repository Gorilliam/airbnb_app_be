import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { requireAuth } from "../middlewares/auth.js";
import * as db from "../database/booking.js";
import {
  bookingValidator,
  bookingQueryValidator,
} from "../validators/bookingValidator.js";
import type { PostgrestError } from "@supabase/supabase-js";

const bookingApp = new Hono();

bookingApp.get("/", bookingQueryValidator, async (c) => {
  const query = c.req.valid("query");
  const sb = c.get("supabase");

  const defaultResponse: PaginatedListResponse<Booking> = {
    data: [],
    count: 0,
    offset: query.offset || 0,
    limit: query.limit || 10,
  };

  try {
    const response = await db.getBookings(sb, query);
    return c.json({ ...defaultResponse, ...response });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return c.json(defaultResponse);
  }
});

bookingApp.get("/:id", async (c) => {
  const { id } = c.req.param();
  const sb = c.get("supabase");

  try {
    const booking = await db.getBooking(sb, id);
    return c.json(booking, 200);
  } catch (error) {
    console.error("Error fetching booking:", error);
    throw new HTTPException(404, {
      res: c.json({ error: "Booking not found" }, 404),
    });
  }
});


bookingApp.post("/", requireAuth, bookingValidator, async (c) => {
  const sb = c.get("supabase");
  const user = c.get("user")!; // logged-in user
  const newBooking = c.req.valid("json");

  try {
    newBooking.user_id = user.id;

    const booking = await db.createBooking(sb, newBooking as NewBooking);
    return c.json(booking, 201);
  } catch (error: any) {
    console.error("Error creating booking:", error);

    if ((error as PostgrestError).code === "23503") {
      throw new HTTPException(400, {
        res: c.json({ error: "Invalid property or user reference" }, 400),
      });
    }

    throw new HTTPException(400, {
      res: c.json({ error: "Booking could not be created" }, 400),
    });
  }
});

bookingApp.put("/:id", requireAuth, bookingValidator, async (c) => {
  const { id } = c.req.param();
  const sb = c.get("supabase");
  const newBooking: Partial<NewBooking> = c.req.valid("json");

  try {
    const booking = await db.updateBooking(sb, id, newBooking);
    if (!booking) throw new Error("Booking not found");
    return c.json(booking, 200);
  } catch (error) {
    console.error("Error updating booking:", error);
    throw new HTTPException(404, {
      res: c.json({ error: "Failed to update booking" }, 404),
    });
  }
});

bookingApp.delete("/:id", requireAuth, async (c) => {
  const { id } = c.req.param();
  const sb = c.get("supabase");

  try {
    const booking = await db.deleteBooking(sb, id);
    if (!booking) throw new Error("Booking not found");
    return c.json({ message: "Booking deleted successfully" }, 200);
  } catch (error) {
    console.error("Error deleting booking:", error);
    return c.json({ error: "Failed to delete booking" }, 404);
  }
});

export default bookingApp;
