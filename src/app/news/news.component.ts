import { Component, HostListener } from '@angular/core';
import { VariablePassingService } from '../variable-passing.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NewsModalComponent } from './news-modal/news-modal.component';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrl: './news.component.css'
})
export class NewsComponent {
  filteredData: any[]
  filteredDataSet1: any[]
  filteredDataSet2: any[]
  dataPresent1: boolean
  dataPresent2: boolean 

  isSmall: boolean;
  isMedium: boolean;
  isLarge: boolean;

  constructor(private variablePassingService: VariablePassingService, private modalService: NgbModal) {
    this.checkWindowSize(window.innerWidth);
  }

  ngOnInit() {
    this.variablePassingService.newsdatapasser.subscribe(newsData => {
      this.renderNews(newsData)
    })
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.checkWindowSize(event.target.innerWidth);
  }

  private checkWindowSize(width: number): void {
    this.isSmall = width < 768;
    this.isMedium = width >= 768 && width <= 991;
    this.isLarge = width > 991;
  }

  renderNews(newsData) {
    let count = 0;
    this.filteredData = []
    this.filteredDataSet1 = []
    this.filteredDataSet2 = []
    this.dataPresent1 = false
    this.dataPresent2 = false

    for(let datum of newsData) {
      if(datum.image !== "") {
        this.filteredData.push(datum)
        count++
      }
      if(count === 20) {
        break
      }
    }

    for(let i = 0; i < this.filteredData.length; i++) {
      if(i % 2 === 0) {
        this.filteredDataSet1.push(this.filteredData[i])
      } else {
        this.filteredDataSet2.push(this.filteredData[i])
      }
    }
    if(this.filteredDataSet1.length === 0) {
      this.dataPresent1 = false
    } else {
      this.dataPresent1 = true
    }

    if(this.filteredDataSet2.length === 0) {
      this.dataPresent2 = false
    } else {
      this.dataPresent2 = true
    }
  }

  openModal(news) {
    let modalRef = this.modalService.open(NewsModalComponent)
    modalRef.componentInstance.newsdata = news
  }
}
