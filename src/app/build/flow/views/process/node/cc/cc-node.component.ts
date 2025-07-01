import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-cc-node',
  templateUrl: './cc-node.component.html',
  styleUrls: ['./cc-node.component.less']
})
export class CcNodeComponent {
  @Input() readonly = false;
  @Input() modelValue: any;
  @Input() branch: any[] = [];
  @Input() index = 0;
  @Output() modelValueChange = new EventEmitter<any>();
  @Output() select = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() insertNode = new EventEmitter<any>();

  showErr = false;
  errInfo: any = null;

  onSelect() {
    this.select.emit(this.modelValue);
  }

  onDelete() {
    this.delete.emit({
      branch: this.branch,
      index: this.index
    });
  }

  onInsertNode(type: string) {
    this.insertNode.emit({
      branch: this.branch,
      index: this.index,
      type: type
    });
  }
}
