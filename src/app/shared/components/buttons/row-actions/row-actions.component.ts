import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-row-actions',
  templateUrl: './row-actions.component.html',
  styleUrls: ['./row-actions.component.scss'],
})
export class RowActionsComponent {
  @Input() disabled = false;
  @Input() showRemove = true;

  @Output() add = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();

  onAdd(): void {
    if (this.disabled) {
      return;
    }

    this.add.emit();
  }

  onRemove(): void {
    if (this.disabled) {
      return;
    }

    this.remove.emit();
  }
}
