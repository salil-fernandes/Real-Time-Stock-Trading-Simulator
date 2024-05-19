import { Component, HostListener } from '@angular/core';
import { DatabaseService } from '../database.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TransactionBuyModalComponent } from '../transaction-buy-modal/transaction-buy-modal.component';
import { TransactionSellModalComponent } from '../transaction-sell-modal/transaction-sell-modal.component';
import { APIService } from '../api.service';
import { delay, forkJoin, timer } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css'
})
export class PortfolioComponent {
  isSmall: boolean
  
  loading: boolean
  visible: boolean = true
  stockTicker: string
  emptyPortfolio: boolean
  walletBalance: number
  stockSold: boolean
  stockBought: boolean

  stocks: any
  fetchedLatest: any
  fetchedStock: any
  stockToRender: any[] = []

  constructor(private databaseService: DatabaseService, private apiService: APIService, private modalService: NgbModal, private router: Router) {}

  ngOnInit() {
    this.fetchBasic()
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.checkWindowSize(event.target.innerWidth);
  }

  private checkWindowSize(width: number): void {
    this.isSmall = width < 768;
  }

  onClickRedirection(ticker: string) {
    this.router.navigateByUrl('/search/' + ticker)
  }

  showAlertForDuration(alertActive: string) {  
    const hideAlert$ = timer(5000);

    hideAlert$.subscribe(() => {
      this[alertActive] = false; // Hide the alert after 5 seconds
    });
  }

  fetchBasic() {
    this.loading = true
    forkJoin({
      balance: this.databaseService.fetchBalance(),
      stocklist: this.databaseService.fetchCurrentPortfolio()
    }).pipe(delay(10)).subscribe({
      next: (results) => {
        this.walletBalance = results.balance[0].balance.toFixed(2);
        this.stocks = results.stocklist
      },
      error: (error) => {
        console.error(error);
      },
      complete: () => {
        if(this.stocks.length !== 0) {
          this.fetchAllData(this.stocks)
          this.visible = true
        } else {
          this.loading = false
          this.emptyPortfolio = true
          this.visible = false
        }
      }
    });
  }

  fetchAllData(stocklist) {
    const allRequests = []

    if(stocklist.length === 0) {
      this.emptyPortfolio = true
      this.loading = false
      return
    } else {
      this.emptyPortfolio = false
    }

    this.fetchedLatest = []
    this.fetchedStock = []

    for(let ticker of stocklist) {
      let request = forkJoin({
        latest: this.apiService.fetchCompanyLatest(ticker),
        storedstock: this.databaseService.fetchStockPortfolio(ticker),
      }).pipe(delay(10))

      allRequests.push(request)
    }

    forkJoin(allRequests).subscribe({
      next: (resultsArray) => {
        resultsArray.forEach((results) => {
          this.fetchedLatest.push(results.latest);
          this.fetchedStock.push(results.storedstock[0]);
        });
      },
      error: (error) => {
        console.error(error);
      },
      complete: () => {
        //this.renderPortfolio(this.fetchedLatest, this.fetchedStock);
        this.updateAfterTransaction(this.fetchedLatest, this.fetchedStock)
      }
    });
  }

  renderPortfolio(fetchedLatest, fetchedStock) {
    for(let datum of fetchedStock) {
      if(datum.change > 0.00) {
        datum.color = 'text-success'
      } else if(datum.change === 0.00) {
        datum.color = 'black'
      } else if(datum.change < 0.00) {
        datum.color = 'text-danger'
      }
    }
    this.loading = false
  }

  updateAfterTransaction(fetchedLatest, fetchedStock) {
    for(let i = 0; i < fetchedStock.length; i++) {
      fetchedStock[i].current = Number(fetchedLatest[i].c).toFixed(2)
      fetchedStock[i].market = (Number(fetchedStock[i].quantity) * Number(fetchedStock[i].current)).toFixed(2)
      fetchedStock[i].change = (Number(fetchedStock[i].current) - Number(fetchedStock[i].costpershare)).toFixed(2)
    }
    this.renderPortfolio(fetchedLatest, fetchedStock)
  }

  buyMoreStock(i) {
    this.stockTicker = this.stocks[i]
    let modalRef = this.modalService.open(TransactionBuyModalComponent)
    let currentLatest = this.fetchedLatest[i]
    currentLatest.ticker = this.stocks[i]
    currentLatest.company = this.fetchedStock[i].company
    modalRef.componentInstance.inputdata = currentLatest
    modalRef.result.then(
      (result) => {
        if(result === 'buy-successful'){
          this.stockBought = true
          this.showAlertForDuration('stockBought')
          this.fetchBasic()
          this.updateAfterTransaction(this.fetchedLatest, this.fetchedStock)
        }
      }
    )
  }

  sellSomeStock(i) {
    this.stockTicker = this.stocks[i]
    let modalRef = this.modalService.open(TransactionSellModalComponent)
    let currentLatest = this.fetchedLatest[i]
    currentLatest.ticker = this.stocks[i]
    currentLatest.company = this.fetchedStock[i].company
    modalRef.componentInstance.inputdata = currentLatest
    modalRef.result.then(
      (result) => {
        if(result === 'sell-all-successful' || result === 'sell-successful') {
          this.stockSold = true
          this.showAlertForDuration('stockSold')
          this.fetchBasic()
          this.updateAfterTransaction(this.fetchedLatest, this.fetchedStock)
        }
      }
    )
  }
}
