import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry";

// 创建线条（使用 LineGeometry 和 LineMaterial）
export const createLine = (
  points: number[][],
  color: string,
  dashed = false,
  dashSize = 0.005,
  gapSize = 0.005,
  lineWidth = 3 // 新增 lineWidth 参数，默认值为 1
) => {
  // 创建 LineGeometry
  const geometry = new LineSegmentsGeometry();
  geometry.setPositions(points.flat()); // 设置顶点坐标

  // 创建 LineMaterial
  const material = new LineMaterial({
    color: color,
    linewidth: lineWidth, // 设置线宽
    dashed: dashed, // 是否使用虚线
    dashSize: dashed ? dashSize : 0, // 虚线的长度
    gapSize: dashed ? gapSize : 0, // 虚线的间隔
  });

  // 创建 LineSegments2
  const line = new LineSegments2(geometry, material);

  // 调整线的分辨率（必须设置，否则线条可能无法正确显示）
  line.computeLineDistances(); // 如果是虚线，必须调用此方法

  return line;
};
