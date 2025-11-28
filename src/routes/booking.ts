import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { requireAuth } from "../middlewares/auth.js";
import * as db from "../database/booking.js";
import {
  bookingCreateValidator,
  bookingUpdateValidator,
  bookingQueryValidator
} from "../validators/bookingValidator.js";

import type { PostgrestError } from "@supabase/supabase-js";

const bookingApp = new Hono();

bookingApp.get("/", requireAuth, bookingQueryValidator, async (c) => {
  const query = c.req.valid("query");
  const sb = c.get("supabase");

  const defaultResponse: PaginatedListResponse<Booking> = {
    data: [],
    count: 0,
    offset: query.offset || 0,
    limit: query.limit || 10,
  };

  try {
    const user = c.get("user");

    if (!user) {
  throw new HTTPException(401, { message: "Unauthorized" });
}
    const response = await db.getBookingsForUser(
      sb,
      user.id,
       query
      );
    console.log("Fetched bookings:", response.data?.length, "rows");
    console.log(JSON.stringify(response.data, null, 2));

    return c.json({ ...defaultResponse, ...response });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return c.json(defaultResponse);
  }
});
bookingApp.get("/:id", requireAuth, async (c) => {
  const { id } = c.req.param();
  const sb = c.get("supabase");
  const user = c.get("user")!;

  try {
    const booking = await db.getBooking(sb, id);
    if (!booking) throw new Error("Booking not found");

    if (booking.user_id !== user.id && user.role !== "admin") {
      throw new HTTPException(403, {
        res: c.json({ error: "Not allowed to view this booking" }, 403)
      });
    }

    return c.json(booking, 200);
  } catch (error) {
    console.error("Error fetching booking:", error);
    throw new HTTPException(404, {
      res: c.json({ error: "Booking not found" }, 404),
    });
  }
});


bookingApp.post("/", requireAuth, bookingCreateValidator,  async (c) => {
  const sb = c.get("supabase");
  const user = c.get("user")!; // logged-in user
  const newBooking = c.req.valid("json");

  try {
    newBooking.user_id = user.id;

    const booking = await db.createBooking(sb, newBooking as NewBooking);
    return c.json(booking, 201);
  } catch (error: unknown) {
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

bookingApp.put("/:id", requireAuth, bookingUpdateValidator, async (c) => {
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