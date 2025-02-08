export function isGameClear() {
  // 获取所有 cookies
  const cookies = document.cookie;

  // 使用正则表达式查找名为 gameClear 的 cookie
  const match = cookies.match(/(?:^|;\s*)gameClear=([^;]*)/);

  // 如果存在 gameClear，则解析其值并判断是否大于 0
  if (match) {
    const gameClearValue = parseInt(match[1], 10); // 将值转换为整数
    return gameClearValue > 0;
  }

  // 如果没有找到 gameClear，返回 false
  return false;
}
