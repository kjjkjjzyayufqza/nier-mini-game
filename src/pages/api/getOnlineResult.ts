import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../lib/mongodb";

type ResponseData = {
  message?: string;
  data?: any[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "GET") {
    res.status(400).json({ message: "Error" });
  }

  const client = await clientPromise;
  const collection = client.db("nier").collection("player");
  // 获取数据
  const result = await collection
    .find({
      enable: true,
    })
    .sort({ score: -1 })
    .toArray();
  const filteredResult = result
    .filter((e) => e.id != req.cookies?.["id"])
    .map(({ _id, name, content, region, score }) => ({
      name,
      content,
      region,
      score,
    }));
  res.status(200).json({ data: filteredResult });
}
