export function getRandNodeId(): string {
  return 'node_' + Math.random().toString(36).substr(2, 9);
}


export function reloadNodeId(node: any): void {
  if (node && typeof node === 'object') {
    if (node.id) {
      node.id = getRandNodeId();
    }
    // 递归处理子节点
    if (node.branch && Array.isArray(node.branch)) {
      node.branch.forEach((child: any) => reloadNodeId(child));
    }
    if (node.props && node.props.branch && Array.isArray(node.props.branch)) {
      node.props.branch.forEach((child: any) => reloadNodeId(child));
    }
  }
}
