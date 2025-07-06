import {Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren} from '@angular/core';
import {NodeComponents, nodeType} from '@flow/process-nodes';
import {reloadNodeId} from '@flow/utils/process-util';

@Component({
  selector: 'app-gateway-node',
  templateUrl: './gateway-node.component.html',
  styleUrls: ['./gateway-node.component.less']
})
export class GatewayNodeComponent {
  @Input() readonly = false;
  @Input() modelValue: any;
  @Input() branch: any[] = [];
  @Input() index = 0;

  @Output() modelValueChange = new EventEmitter<any>();
  @Output() select = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() insertNode = new EventEmitter<any>();

  @ViewChildren('node') nodeRefs!: QueryList<ElementRef>;

  NodeComponents = NodeComponents;

  /**
   * 插入节点
   * @param branch 该节点要插入的支路（节点数组）
   * @param i 插入哪个元素后面的索引，实际插入位置为i+1
   * @param type 要插入的节点类型
   */
  insertNodeFun(branch: any[], i: number, type: string) {
    if (nodeType[type] && nodeType[type].create) {
      const newNode = nodeType[type].create();
      branch.splice(i + 1, 0, newNode);
    } else {
      // this.message.warning('请在ProcessNodes.ts内配置该节点');
    }
  }

  /**
   * 删除某个元素
   * @param branch 要删除的元素所在支路
   * @param i 删除的元素在该支路内索引位置
   */
  deleteNode(branch: any[], i: number) {
    branch.splice(i, 1);
  }

  // 添加网关分支
  addBranch() {
    const index = this.modelValue.branch.length - 1;
    const type = this.modelValue.props.type;
    if ((nodeType as any)[type]) {
      this.modelValue.props.branch.splice(index, 0, (nodeType as any)[type].createSelf(index + 1));
      this.modelValue.branch.splice(index, 0, []);
    } else {
      // this.message.warning('请在ProcessNodes.ts内配置该节点');
    }
  }

  deepCopy(obj: any) {
    return JSON.parse(JSON.stringify(obj));
  }

  // 复制一个分支
  copyBranch(i: number) {
    // 复制条件
    const cd = this.deepCopy(this.modelValue.props.branch[i]);
    cd.name = cd.name + '-copy';
    // 复制整个分支
    const bh = this.deepCopy(this.modelValue.branch[i]);
    // 重载节点id
    reloadNodeId(cd);
    reloadNodeId(bh);
    // 插入到新位置
    this.modelValue.props.branch.splice(i + 1, 0, cd);
    this.modelValue.branch.splice(i + 1, 0, bh);
  }

  // 删除网关分支
  deleteBranch(i: number) {
    if (this.modelValue.branch.length <= 2) {
      // 只有两个分支，那么就直接删除整个网关
      this.delete.emit({
        branch: this.branch,
        index: this.index
      });
    } else {
      // 直接删除此分支
      this.modelValue.props.branch.splice(i, 1);
      this.modelValue.branch.splice(i, 1);
    }
  }

  // 左移分支
  moveL(i: number) {
    this.exchange(this.modelValue.props.branch, i, i - 1);
    this.exchange(this.modelValue.branch, i, i - 1);
  }

  // 右移分支
  moveR(i: number) {
    this.exchange(this.modelValue.props.branch, i, i + 1);
    this.exchange(this.modelValue.branch, i, i + 1);
  }

  // 交换数组俩元素位置
  exchange(arr: any[], si: number, ti: number) {
    const temp = arr[si];
    arr[si] = arr[ti];
    arr[ti] = temp;
  }

  selectFun(nd: any, i: number) {
    if (!(i === this.modelValue.branch.length - 1
        && this.modelValue.props.type !== 'Parallel')) {
      // this.select.emit(nd);
    }
  }

  validate(errs: any[]) {
    if (this.nodeRefs) {
      this.nodeRefs.forEach(ref => {
        const component = ref.nativeElement.__ngContext__;
        if (component && component.validate) {
          component.validate(errs);
        }
      });
    }
  }
}
