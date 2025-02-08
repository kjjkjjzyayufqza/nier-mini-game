import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: "id",
    value: "",
    expires: new Date(Date.now() + 11945 * 365 * 24 * 60 * 60 * 1000),
  });

  return Response.json({ message: "All data has been deleted" });
}
