import {Component, EventEmitter, Output} from '@angular/core';
import {nodeType} from '../../process-nodes';

@Component({
  selector: 'app-insert-btn',
  templateUrl: './insert-btn.component.html',
  styleUrls: ['./insert-btn.component.less']
})
export class InsertBtnComponent {
  @Output() insertNode = new EventEmitter<string>();

  nodeList = Object.keys(nodeType)
    .filter(v => (nodeType as any)[v].name)
    .map(v => {
        console.log({
            type: v,
            ...(nodeType as any)[v]
        });
      return {
        type: v,
        ...(nodeType as any)[v]
      };
    });

  onInsertNode(type: string) {
    this.insertNode.emit(type);
  }
}
