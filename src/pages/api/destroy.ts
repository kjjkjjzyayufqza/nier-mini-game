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
    return;
  }

  const client = await clientPromise;
  const collection = client.db("nier").collection("player");
  const existsData = await collection.findOne({
    id: req.cookies?.["id"],
  });

  if (!existsData) {
    res.status(400).json({ message: "Error" });
    return;
  }

  // 更新数据
  await collection.updateOne(
    {
      id: req.cookies?.["id"],
    },
    {
      $set: {
        enable: false,
        updatedAt: new Date(),
      },
    }
  );

  res
    .status(200)
    .json({ message: "THANK YOU... " + `${existsData?.name ?? "PLAYER"}` });
}
