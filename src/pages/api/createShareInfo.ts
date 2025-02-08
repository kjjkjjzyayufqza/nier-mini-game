import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../lib/mongodb";

type ResponseData = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    res.status(400).json({ message: "Error 1" });
  }
  if (!req.cookies?.["id"]) {
    res.status(400).json({ message: "Error 2" });
    return;
  }
  if (!req.body?.content || !req.body?.region) {
    res.status(400).json({ message: "Error 3" });
    return;
  }

  const client = await clientPromise;
  const collection = client.db("nier").collection("player");
  const isNotExists =
    (
      await collection
        .find({
          id: req.cookies?.["id"],
        })
        .toArray()
    ).length === 0;

  if (isNotExists) {
    res.status(400).json({ message: "Error" });
    return;
  }

  // 新增数据
  await collection.updateOne(
    { id: req.cookies?.["id"] },
    {
      $set: {
        content: req.body.content,
        region: req.body.region,
        updatedAt: new Date(),
      },
    }
  );

  res.status(200).json({ message: "Success" });
}
