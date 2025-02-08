import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const cookieStore = await cookies();
  let gameClear: any = cookieStore.get("gameClear");
  let newGameClear = parseInt(gameClear?.value ?? 0) + 1;
  cookieStore.set({
    name: "gameClear",
    value: newGameClear.toString(),
    expires: new Date(Date.now() + 11945 * 365 * 24 * 60 * 60 * 1000),
  });

  return Response.json({ message: "Success" });
}
