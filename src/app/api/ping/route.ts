import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const cookieStore = await cookies();
  const id = cookieStore.get("id");
  if (id?.value) {
    return Response.json({ message: "Success" });
  }

  cookieStore.set({
    name: "id",
    value: uuidv4(),
    expires: new Date(Date.now() + 11945 * 365 * 24 * 60 * 60 * 1000),
  });

  return Response.json({ message: "Success" });
}
