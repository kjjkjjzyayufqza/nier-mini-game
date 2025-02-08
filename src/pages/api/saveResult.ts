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
    res.status(400).json({ message: "Error" });
  }
  if (!req.cookies?.["id"]) {
    res.status(400).json({ message: "Error" });
  }
  if (!req.body?.name) {
    res.status(400).json({ message: "Error" });
    return;
  }
  if (!req.body?.score && typeof req.body?.score !== "number") {
    res.status(400).json({ message: "Error" });
    return;
  }
  const score = parseInt(req.body.score as any);
  if (score > 1000000) {
    res.status(400).json({ message: "Error" });
    return;
  }

  const client = await clientPromise;
  const collection = client.db("nier").collection("player");
  const existsData = await collection.findOne({
    id: req.cookies?.["id"],
  });

  if (existsData) {
    // 更新数据
    await collection.updateOne(
      {
        id: req.cookies?.["id"],
      },
      {
        $set: {
          name: req.body.name,
          score: score,
          updatedAt: new Date(),
        },
      }
    );
    res.status(200).json({ message: "Success" });
    return;
  } else {
    // 新增数据
    await collection.insertOne({
      enable: true,
      id: req.cookies?.["id"],
      name: req.body.name,
      score: score,
      content: "",
      region: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    res.status(200).json({ message: "Success" });
    return;
  }
}
