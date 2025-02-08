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
      enable: false,
    })
    .toArray();
  const filteredResult = result.map(({ name }) => ({
    name,
  }));
  res.status(200).json({ data: filteredResult });
}
