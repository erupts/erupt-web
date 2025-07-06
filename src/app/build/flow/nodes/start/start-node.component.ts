import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-start-node',
  templateUrl: './start-node.component.html',
  styleUrls: ['./start-node.component.less']
})
export class StartNodeComponent {
  @Input() readonly = false;
  @Input() model: any;
  @Input() branch: any[] = [];
  @Input() index = 0;
  @Output() modelChange = new EventEmitter<any>();
  @Output() select = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() insertNode = new EventEmitter<any>();

  showErr = false;
  errInfo: any = null;

  validate(err: any[]) {
    // 开始节点无需验证
  }

  onSelect() {
    this.select.emit(this.model);
  }

  onInsertNode(type: string) {
    this.insertNode.emit({
      branch: this.branch,
      index: this.index,
      type: type
    });
  }
}
