import {
  Component,
  Input,
  ContentChildren,
  QueryList,
  ElementRef,
  AfterContentInit,
} from '@angular/core';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
})
export class PageHeaderComponent implements AfterContentInit {
  @Input() title = '';
  @Input() subtitle = '';

  hasProjectedContent = false;

  @ContentChildren('*', {
    descendants: true,
    read: ElementRef,
  })
  projectedContent!: QueryList<ElementRef>;

  ngAfterContentInit(): void {
    this.hasProjectedContent = this.projectedContent.length > 0;
  }
}
