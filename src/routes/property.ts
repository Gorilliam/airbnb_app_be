import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { requireAuth } from "../middlewares/auth.js";
import * as db from "../database/property.js";
import {
  propertyValidator,
  propertyQueryValidator,
} from "../validators/propertyValidator.js";
import type { PostgrestError } from "@supabase/supabase-js";

const propertyApp = new Hono();


propertyApp.get("/", propertyQueryValidator, async (c) => {
  const query = c.req.valid("query");
  const sb = c.get("supabase");

  const defaultResponse: PaginatedListResponse<Property> = {
    data: [],
    count: 0,
    offset: query.offset || 0,
    limit: query.limit || 10,
  };

  try {
    const response = await db.getProperties(sb, query);
    return c.json({
      ...defaultResponse,
      ...response,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return c.json(defaultResponse);
  }
});



propertyApp.get("/:id", async (c) => {
  const { id } = c.req.param();
  const sb = c.get("supabase");

  try {
    const property = await db.getProperty(sb, id);
    return c.json(property, 200);
  } catch (error) {
    console.error("Error fetching property:", error);
    throw new HTTPException(404, {
      res: c.json({ error: "Property not found" }, 404),
    });
  }
});

propertyApp.post("/", requireAuth, propertyValidator, async (c) => {
  const sb = c.get("supabase");
  const user = c.get("user")!; // current logged-in user
  const newProperty: NewProperty = c.req.valid("json");

  try {
    // attach user_id automatically
    newProperty.user_id = user.id;

    const property = await db.createProperty(sb, newProperty);
    return c.json(property, 201);
  } catch (error: unknown) {
    console.error("Error creating property:", error);

    if ((error as PostgrestError).code === "23505") {
      throw new HTTPException(409, {
        res: c.json({ error: "Duplicate property ID" }, 409),
      });
    }

    throw new HTTPException(400, {
      res: c.json({ error: "Property could not be created" }, 400),
    });
  }
});


propertyApp.put("/:id", requireAuth, propertyValidator, async (c) => {
  const { id } = c.req.param();
  const sb = c.get("supabase");
  const user = c.get("user")!;
  const newProperty: NewProperty = c.req.valid("json");

  try {
    const existing = await db.getProperty(sb, id);

    if (!existing) throw new Error("Not found");

    if (existing.user_id !== user.id) {
      throw new HTTPException(403, {
        res: c.json({ error: "Not allowed to update this property" }, 403),
      });
    }

    const property = await db.updateProperty(sb, id, newProperty);
    return c.json(property, 200);
  } catch (error) {
    console.error("Error updating property:", error);
    throw new HTTPException(404, {
      res: c.json({ error: "Failed to update property" }, 404),
    });
  }
});


propertyApp.delete("/:id", requireAuth, async (c) => {
  const { id } = c.req.param();
  const sb = c.get("supabase");

  try {
    const property = await db.deleteProperty(sb, id);
    if (!property) throw new Error("Property not found");
    return c.json({ message: "Property deleted successfully" }, 200);
  } catch (error) {
    console.error("Error deleting property:", error);
    return c.json({ error: "Failed to delete property" }, 404);
  }
});

export default propertyApp;
