import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-search-select',
  templateUrl: './search-select.component.html',
  styleUrls: ['./search-select.component.scss'],
})
export class SearchSelectComponent {
  @Input() items: any[] = [];

  @Input() label = 'Select';

  @Input() bindLabel = 'name';

  @Input() control!: FormControl;

  @Output() selectionChange = new EventEmitter<any>();

  searchCtrl = new FormControl('');

  filteredItems: any[] = [];

  ngOnInit(): void {
    this.searchCtrl.valueChanges.subscribe((value: any) => {
      this.filterItems(value);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.filteredItems = [...this.items];
    }
  }

  filterItems(value: string): void {
    const search = value?.toLowerCase() || '';

    this.filteredItems = this.items.filter((item) =>
      (item[this.bindLabel] || '').toString().toLowerCase().includes(search),
    );
  }

  onSelection(value: any): void {
    this.selectionChange.emit(value);
    this.searchCtrl.setValue('');
  }
}
