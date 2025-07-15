import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';

@Component({
  selector: 'erupt-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.less']
})
export class NodeComponent implements AfterViewInit {
  @Input() headerColor = '';
  @Input() headerIcon = '';
  @Input() content = '';
  @Input() readonly = false;
  @Input() model: any;
  @Input() showError = false;
  @Input() errorInfo = '';
  @Input() showClose = true;
  @Input() showBody = true;
  @Input() placeholder = '请设置';

  @Output() modelChange = new EventEmitter<any>();
  @Output() select = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() insertNode = new EventEmitter<string>();

  @ViewChild('nodeNameInput', { static: false }) nodeNameInput!: ElementRef;

  enableEdit = false;

  ngAfterViewInit() {
    // 组件初始化后的处理
  }

  onEnableEdit() {
    if (!this.readonly) {
      this.enableEdit = true;
      setTimeout(() => {
        if (this.nodeNameInput) {
          this.nodeNameInput.nativeElement.focus();
        }
      });
    }
  }

  onBlur() {
    this.enableEdit = false;
  }

  onSelect() {
    this.select.emit();
  }

  onDelete() {
    this.delete.emit();
  }

  onInsertNode(type: string) {
    this.insertNode.emit(type);
  }
}
