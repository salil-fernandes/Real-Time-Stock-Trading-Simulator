import { Component, HostListener, OnInit } from '@angular/core';
import { DatabaseService } from '../database.service';
import { APIService } from '../api.service';
import { forkJoin, map } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrl: './watchlist.component.css'
})
export class WatchlistComponent {

  stillLoading: boolean = true
  watchlist: any[]
  watchlistIsEmpty: boolean
  combinedData: any[]

  isSmall: boolean

  constructor(private databaseService: DatabaseService, private apiService: APIService, private router: Router) {
    this.checkWindowSize(window.innerWidth);
  }

  ngOnInit() {
    this.databaseService.fetchWatchlist().subscribe({
      next: (list) => {
        if (list && list.length) {
            this.watchlist = list;
            this.watchlistIsEmpty = false

          const dataRequests = list.map((ticker: string) => {
            return forkJoin({
              profile: this.apiService.fetchCompanyProfile(ticker),
              latest: this.apiService.fetchCompanyLatest(ticker)
            }).pipe(
              map(({profile, latest}) => ({ticker, profile, latest}))
            );
          });

          forkJoin(dataRequests).subscribe({
            next: (results) => {
              this.combinedData = results;
              this.stillLoading = false
              this.renderWatchlist(this.combinedData); // Contains profile and peers data for each ticker
            },
            error: (error) => console.error('Error fetching data', error)
          });
        } else {
          this.stillLoading = false
          this.watchlistIsEmpty = true
        }
      }
    })
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.checkWindowSize(event.target.innerWidth);
  }

  private checkWindowSize(width: number): void {
    this.isSmall = width < 500;
  }

  renderWatchlist(combinedData) {
    for(let stock of combinedData) {
      if(stock.latest.dp >= 0) {
        stock.color = "text-success"
      } else {
        stock.color = "text-danger"
      }
    }
  }

  onClickRedirection(ticker: string) {
    this.router.navigateByUrl('/search/' + ticker)
  }

  removeFromWatchlist(index: number): void {
    const elementToRemove = (el) => el === this.combinedData[index].ticker
    this.databaseService.modifyWatchlist('REMOVE', this.combinedData[index].ticker).subscribe({
      next: (data) => data
    })
    this.watchlist.splice(this.watchlist.findIndex(elementToRemove), 1);
    this.combinedData.splice(index, 1)
    if(this.watchlist.length === 0) {
      this.watchlistIsEmpty = true
    }
  }
}
