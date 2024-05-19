import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import moment from 'moment';

@Component({
  selector: 'app-news-modal',
  templateUrl: './news-modal.component.html',
  styleUrl: './news-modal.component.css'
})
export class NewsModalComponent {
  @Input() newsdata: any;
  newsdate: string;
  newsurl: string;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {
    this.newsdate = moment(this.newsdata.datetime * 1000).format('MMMM DD, YYYY')
    this.newsurl = this.newsdata.url
  }
}
