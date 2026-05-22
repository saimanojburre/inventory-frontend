import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-search-select',
  templateUrl: './search-select.component.html',
  styleUrls: ['./search-select.component.scss'],
})
export class SearchSelectComponent implements OnInit, OnChanges, OnDestroy {
  @Input() items: any[] = [];
  @Input() label = 'Select';
  @Input() bindLabel = 'name';
  @Input() control!: FormControl;

  @Output() selectionChange = new EventEmitter<any>();

  searchCtrl = new FormControl('');
  filteredItems: any[] = [];

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.filteredItems = [...this.items];

    this.searchCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.filterItems(value || '');
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.filteredItems = [...this.items];
      this.filterItems(this.searchCtrl.value || '');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onOpenedChange(opened: boolean): void {
    if (opened) {
      this.filterItems('');
      return;
    }

    this.searchCtrl.setValue('', {
      emitEvent: false,
    });
  }

  filterItems(value: string): void {
    const search = value.toLowerCase().trim();

    this.filteredItems = this.items.filter((item) => {
      return (item[this.bindLabel] || '')
        .toString()
        .toLowerCase()
        .includes(search);
    });
  }

  onSelection(value: any): void {
    this.selectionChange.emit(value);

    this.searchCtrl.setValue('', {
      emitEvent: false,
    });

    this.filteredItems = [...this.items];
  }
}
