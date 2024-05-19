import { Component, ElementRef, OnInit, AfterViewInit, ViewChild, NgZone, ChangeDetectorRef, HostListener } from '@angular/core';
import { APIService } from '../../api.service';
import { VariablePassingService } from '../../variable-passing.service';
import { race, Observable, Subject, Subscription, debounceTime, delay, distinctUntilChanged, forkJoin, interval, startWith, switchMap, takeUntil, tap, timer } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TransactionBuyModalComponent } from '../../transaction-buy-modal/transaction-buy-modal.component';
import { TransactionSellModalComponent } from '../../transaction-sell-modal/transaction-sell-modal.component';

import moment from 'moment';

import * as Highcharts from 'highcharts/highstock';
import indicators from 'highcharts/indicators/indicators';
import vbp from 'highcharts/indicators/volume-by-price';


import { IntervalService } from '../../interval.service';
import { DatabaseService } from '../../database.service';
import { StateService } from '../../state.service';

indicators(Highcharts);
vbp(Highcharts);

@Component({
  selector: 'app-company-info',
  templateUrl: './company-info.component.html',
  styleUrl: './company-info.component.css'
})
export class CompanyInfoComponent {
  currentSymbol: string;
  prevInputSymbol: string;
  prevURLSymbol: string;

  summaryData: any;
  latestData: any;
  Highcharts: any = Highcharts;
  hourlyChartData: any;
  newsData: any;
  peersData: any;
  chartData: any;
  recommendationData: any;
  insiderData: any;
  earningsData: any;

  profileLoaded: boolean = false;
  latestLoaded: boolean = false;
  hourlyChartLoaded: boolean = false;
  newsLoaded: boolean = false;
  peersLoaded: boolean = false;
  chartLoaded: boolean = false;
  recommendationsLoaded: boolean = false;
  insiderLoaded: boolean = false;
  earningsLoaded: boolean = false;
  stillLoading: boolean = false;
  presentInWatchlist: boolean;
  presentInPortfolio: boolean;
  stockBought: boolean;
  stockSold: boolean;

  additionalSearch: boolean = false;
  navigating: boolean = false;
  tickerInvalid: boolean = false;
  blankInput: boolean = false;
  validDataPresent: boolean = false;

  isSmall: boolean;

  // Profile fields
  ticker: string;
  company: string;
  exchange: string;
  logourl: string;
  ipo: string;
  industry: string;
  companySite: string;

  // Latest fields
  currentPrice: string;
  changeInPrice: string;
  percentChange: string;
  timeString: string;
  priceRise: boolean;
  priceClasses: string;

  // Market State
  marketClass: string;
  marketStateFlag: boolean;
  marketStateInnerHTML: string;
  marketClosingTimeString: string;

  // Summary fields
  highPrice: string;
  lowPrice: string;
  prevClose: string;
  openPrice: string;
  links: object[] = [];

  // Chart fields
  ohlc: any[]
  volume: any[]

  // Insight fields
  trends: object;
  mspr: object;
  change: object;
  categories: any[];
  estimates: any[];
  actuals: any[];

  hourlyChartOptions: Highcharts.Options;
  historicalChartOptions: Highcharts.Options;
  trendsChartOptions: Highcharts.Options;
  earningsChartOptions: Highcharts.Options;

  // watchlist fields
  watchlistAppended: boolean;
  watchlistUnappended: boolean;

  private initialRenderSubscription: Subscription = new Subscription();
  private routerSubscription: Subscription = new Subscription();
  private tickerSubscription: Subscription = new Subscription();
  private dataValiditySubscription: Subscription = new Subscription();
  private blankSubscription: Subscription = new Subscription();
  private dataFetchSubscription: Subscription = new Subscription();
  private tickerValiditySubscription: Subscription = new Subscription();
  private intervalSubscription: Subscription = new Subscription();
  private stopTimer$ = new Subject<void>();
  private subscriptions: Subscription[] = [];
  private intervalId: any;

  constructor(private apiService: APIService, private variablePassingService: VariablePassingService, private databaseService: DatabaseService, private modalService: NgbModal, private stateService: StateService, private intervalService: IntervalService, private router: Router, private route: ActivatedRoute, private ngZone: NgZone) {
    this.checkWindowSize(window.innerWidth);
  }

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.url === '/portfolio' || event.url === '/watchlist') {
        if(this.stateService.hasData(this.currentSymbol)) {
          let storedData = this.stateService.getData(this.currentSymbol)
          storedData[1] = this.latestData
          this.stateService.setData(this.currentSymbol, storedData)
        }
      }
    });

    this.routerSubscription = this.route.paramMap.subscribe(params => {
      if(params.get('symbol') != 'home' && !this.additionalSearch){
        this.unsubscribeAll()
        this.navigating = true
        this.variablePassingService.changeTicker(params.get('symbol'))
        this.currentSymbol = params.get('symbol')
        this.router.navigateByUrl('/search/' + params.get('symbol'))
        if (this.stateService.hasData(params.get('symbol'))) {
          this.summaryData = this.stateService.getData(params.get('symbol'));
          let cachedData = this.stateService.getData(params.get('symbol'))
          this.renderData(cachedData[0], cachedData[1], cachedData[2], cachedData[3], cachedData[4], cachedData[5], cachedData[6], cachedData[7], cachedData[8])
        } else {
          this.fetchTickerData(params.get('symbol'))
        };
        this.checkInWatchlist(this.currentSymbol)
        this.checkInPortfolio(this.currentSymbol)
        this.setupPeriodicDataFetching();
        setTimeout(() => this.navigating = false);
      }
      this.additionalSearch = false
    })

    this.tickerSubscription = this.variablePassingService.currentTicker.subscribe(ticker => {
      if(ticker && ticker!== 'home' && ticker.replace(/\s/g, '') !== '' && !this.navigating) {
          this.unsubscribeAll()
          this.router.navigateByUrl('/search/' + ticker)
          this.additionalSearch = true
          this.currentSymbol = ticker
          this.checkInWatchlist(this.currentSymbol)
          this.checkInPortfolio(this.currentSymbol)
          this.fetchTickerData(ticker)
          this.setupPeriodicDataFetching()
      }
    })

    this.dataValiditySubscription = this.variablePassingService.dataValid.subscribe(value => {
      this.validDataPresent = value
    })

    this.blankSubscription = this.variablePassingService.tickerBlank.subscribe(value => {
      this.blankInput = value
    })

    const resetSubscription = this.variablePassingService.resetObservable$.subscribe(() => {
      this.unsubscribeAll();
    });
    this.subscriptions.push(resetSubscription, this.intervalSubscription, this.initialRenderSubscription);
  }

  ngOnDestroy(): void {
    this.stopTimer$.next();
    this.stopTimer$.complete();
    this.unsubscribeAll();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }
    if (this.initialRenderSubscription) {
      this.initialRenderSubscription.unsubscribe();
    }

    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }

    if (this.blankSubscription) {
      this.blankSubscription.unsubscribe();
    }

    if (this.dataValiditySubscription) {
      this.dataValiditySubscription.unsubscribe();
    }

    if (this.tickerSubscription) {
      this.tickerSubscription.unsubscribe();
    }

    if (this.dataFetchSubscription) {
      this.dataFetchSubscription.unsubscribe();
    }

    if (this.tickerValiditySubscription) {
      this.tickerValiditySubscription.unsubscribe();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.checkWindowSize(event.target.innerWidth);
  }

  private checkWindowSize(width: number): void {
    this.isSmall = width < 768;
  }

  private setupPeriodicDataFetching() {
    this.unsubscribeAll()
    this.ngZone.runOutsideAngular(() => {
      this.intervalSubscription = interval(15000).pipe(takeUntil(this.stopTimer$), switchMap(() => this.getCompanyLatest(this.currentSymbol))
      ).subscribe(() => {
        this.ngZone.run(() => {
          this.initialRenderSubscription = this.variablePassingService.intialRender.subscribe(renderDone => {
            if(renderDone && this.latestData.isMarketOpen) {
              this.renderLatest(this.latestData)
            }
          })
        });
      });
    });
  }

  unsubscribeAll() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  exitBlankInput() {
    this.variablePassingService.changeBlankTicker(false)
  }

  fetchTickerData(ticker: string) {
    this.stillLoading = true
    forkJoin({
      profile: this.apiService.fetchCompanyProfile(ticker),
      latest: this.apiService.fetchCompanyLatest(ticker),
      hourly: this.apiService.fetchCompanyHourlyChart(ticker),
      news: this.apiService.fetchCompanyNews(ticker),
      peers: this.apiService.fetchCompanyPeers(ticker),
      chart: this.apiService.fetchCompanyChart(ticker),
      recommendation: this.apiService.fetchCompanyRecommendation(ticker),
      insider: this.apiService.fetchCompanySentiment(ticker),
      earnings: this.apiService.fetchCompanyEarnings(ticker),
      // ...add other API calls similarly
    }).pipe(delay(10)).subscribe({
      next: (results) => {
        this.summaryData = results.profile;
        this.latestData = results.latest;
        this.hourlyChartData = results.hourly;
        this.newsData = results.news;
        this.peersData = results.peers;
        this.chartData = results.chart;
        this.recommendationData = results.recommendation;
        this.insiderData = results.insider;
        this.earningsData = results.earnings
      },
      error: (error) => {
        console.error(error);
        this.stillLoading = false;
      },
      complete: () => {
        this.stillLoading = false;
        this.stateService.setData(this.currentSymbol, [this.summaryData, this.latestData, this.hourlyChartData, this.newsData, this.peersData, this.chartData, this.recommendationData, this.insiderData, this.earningsData])
        this.renderData(this.summaryData, this.latestData, this.hourlyChartData, this.newsData, this.peersData, this.chartData, this.recommendationData, this.insiderData, this.earningsData)
      }
    });
  }

  showAlertForDuration(alertActive: string) {  
    const hideAlert$ = timer(5000);

    hideAlert$.subscribe(() => {
      this[alertActive] = false; // Hide the alert after 5 seconds
    });
  }

  openBuyTransactionModal() {
    let modalRef = this.modalService.open(TransactionBuyModalComponent)
    let currentLatest = this.latestData
    currentLatest.ticker = this.ticker
    currentLatest.company = this.summaryData.name
    modalRef.componentInstance.inputdata = currentLatest
    modalRef.result.then(
      (result) => {
        if(result === 'buy-successful') {
          this.stockBought = true
          this.showAlertForDuration('stockBought')
          this.presentInPortfolio = true
        }
      }
    )
  }

  openSellTransactionModal() {
    let modalRef = this.modalService.open(TransactionSellModalComponent)
    let currentLatest = this.latestData
    currentLatest.ticker = this.ticker
    currentLatest.company = this.summaryData.name
    modalRef.componentInstance.inputdata = currentLatest
    modalRef.result.then(
      (result) => {
        if(result === 'sell-successful') {
          this.stockSold = true
          this.showAlertForDuration('stockSold')
        } else if(result === 'sell-all-successful') {
          this.presentInPortfolio = false
          this.stockSold = true
          this.showAlertForDuration('stockSold')
        }
      }
    )
  }

  checkInPortfolio(ticker: string) {
    this.databaseService.fetchCurrentPortfolio().subscribe({
      next: (portfolio) => {
        if(portfolio.includes(ticker)) {
          this.presentInPortfolio = true
        } else {
          this.presentInPortfolio = false
        }
      },
      error: (err) => {
        console.error(err)
      }
    })
  }

  checkInWatchlist(ticker: string) {
    this.databaseService.fetchWatchlist().subscribe({
      next: (watchlist) => {
        if(watchlist.includes(ticker)) {
          this.presentInWatchlist = true
        } else {
          this.presentInWatchlist = false
        }
      },
      error: (err) => {
        console.error(err)
      }
    })
  }

  addToWatchlist() {
    this.presentInWatchlist = true
    this.watchlistAppended = true
    this.showAlertForDuration('watchlistAppended')
    this.databaseService.modifyWatchlist('ADD', this.ticker).subscribe({
      next: (data) => data
    })
  }

  removeFromWatchlist() {
    this.watchlistUnappended = true
    this.presentInWatchlist = false
    this.showAlertForDuration('watchlistUnappended')
    this.databaseService.modifyWatchlist('REMOVE', this.ticker).subscribe({
      next: (data) => data
    })
  }

  getCompanyLatest(ticker: string): Observable<any> {
    return this.apiService.fetchCompanyLatest(ticker).pipe(
      tap({
        next: (data) => {
          this.latestData = data;
        },
        error: (error) => console.error(error),
        complete: () => {
          this.latestLoaded = true
        }
      })
    );
  }

  renderData(summary, latest, hourly, news, peers, chart, recommendation, insider, earnings) {
    this.tickerValiditySubscription = this.variablePassingService.tickerValidity.subscribe(value => {
      this.tickerInvalid = value
    })

    if(Object.keys(summary).length === 0){
      this.variablePassingService.changeTickerValidity(true)
      //this.showAlertForDuration('tickerInvalid')
      return
    }
    this.variablePassingService.changeDataValidity(true)
    this.renderProfile(summary)
    this.renderLatest(latest)
    this.renderSummaryChart(hourly)
    this.renderPeers(peers)
    this.renderNews(news)
    this.renderHistoricalChart(chart)
    this.renderInsights(insider, recommendation, earnings)
  }

  renderProfile(summary) {
    this.ticker = summary.ticker
    this.company = summary.name
    this.exchange = summary.exchange
    this.logourl = summary.logo
    this.ipo = summary.ipo
    this.industry = summary.finnhubIndustry
    this.companySite = summary.weburl
  }

  renderLatest(latest) {
    this.currentPrice = latest.c
    this.changeInPrice = latest.d
    this.percentChange = latest.dp

    if(latest.dp >= 0) {
      this.priceRise = true;
      this.priceClasses = "text-success"
    } else {
      this.priceRise = false;
      this.priceClasses = "text-danger"
    }

    var displayTime = new Date((latest.t * 1000) + (latest.difference))
    this.timeString = moment(displayTime).format('YYYY-MM-DD HH:mm:ss')

    var closingTime = new Date(latest.t * 1000)
    this.marketClosingTimeString = moment(closingTime).format('YYYY-MM-DD HH:mm:ss')

    this.marketStateFlag = latest.isMarketOpen
    if(this.marketStateFlag) {
      this.marketClass = "text-success font-small font-weight-bold d-flex justify-content-center"
      this.marketStateInnerHTML = "Market Open"
    } else {
      this.marketClass = "text-danger font-small font-weight-bold d-flex justify-content-center"
      this.marketStateInnerHTML = "Market Closed on " + this.marketClosingTimeString
    }
    
    if(!this.variablePassingService.checkRenderStatus()) {
      this.variablePassingService.changeRenderStatus(true)
    }

    this.highPrice = String(latest.h)
    this.openPrice = String(latest.o)
    this.lowPrice = String(latest.l)
    this.prevClose = String(latest.pc)
  }

  renderSummaryChart(hourly) {
    let fetchedData = hourly.results
    let hourlyPriceData = []
    let chartColor: string;

    if(Number(this.percentChange) >= 0) {
      chartColor = 'green'
    } else {
      chartColor = 'red'
    }

    if(fetchedData.length !== 0) {
      for(let i = 0; i < fetchedData.length; i++) {
        hourlyPriceData.push([fetchedData[i].t, fetchedData[i].c])
      }
    }

    this.hourlyChartOptions = {
      chart: {
        type: 'line',
        backgroundColor: '#f6f6f6',
    },

      title: {
          text: `${this.ticker} Hourly Price Variation`,
      },

      xAxis: {
        type: 'datetime',
          accessibility: {
              enabled: false
          }
      },

      yAxis: {
        opposite: true,
        title: {
          text: ''
        },
        labels: {
          x: -15,
          y: -5
        },
        tickAmount: 5
      },

      legend: {
          enabled: false
      },

      scrollbar: {
        enabled: true
    },

      credits: {
          enabled: true
      },

      rangeSelector: {
          enabled: false // Disable the range selector
      },

      navigator: {
          enabled: false // Disable the scrollbar
      },

      series: [{
          type: 'line',
          name: this.ticker,
          data: hourlyPriceData,
          color: chartColor,
          marker: {
            enabled: false, // Markers are not visible by default
            states: {
              hover: {
                enabled: true, // Markers are visible when hovered
                radius: 5 // Size of the marker when hovered
              }
            }
          }
      }]
    }
  }

  renderPeers(peers) {
    this.links = []
    for(let peer of peers) {
      if(peer.includes('.')) {
        continue
      } else {
        this.links.push({
          link: ['/search/' + peer],
          text: peer
        })
      }
    }
  }

  renderNews(news) {
    this.variablePassingService.passNewsData(news)
  }

  renderHistoricalChart(chart) {
    this.ohlc = []
    this.volume = []

    for(let datum of chart.results) {
      this.ohlc.push([
        datum.t,
        datum.o,
        datum.h,
        datum.l,
        datum.c
      ])

      this.volume.push([
        datum.t,
        datum.v
      ])
    }
    
      this.historicalChartOptions = {
        chart: {
          backgroundColor: '#f6f6f6'
        },
        rangeSelector: {
          allButtonsEnabled: true,
          buttons: [
      {type: 'month', count: 1, text: '1m'},
      {type: 'month', count: 3, text: '3m'},
      {type: 'month', count: 6, text: '6m'},
      { type: 'ytd', text: 'YTD' },
      { type: 'year', count: 1, text: '1y' },
      { type: 'all', text: 'All' }
    ],
          enabled: true,
          selected: 2
        },
        title: {
          text: `${this.ticker} ` + 'Historical'
        },
        subtitle: {
          text: 'With SMA and Volume by Price technical indicators'
        },
        navigator: {
          enabled: true,
        },
        scrollbar: {
          enabled: true
        },
        xAxis: {
          type: 'datetime'
        },
        credits: {
            enabled: false
        },
        exporting: {
          enabled: false
      },
        yAxis: [{
          startOnTick: false,
          endOnTick: false,
          labels: {
            align: 'right',
            x: -3
          },
          title: {
            text: 'OHLC'
          },
          height: '60%',
          lineWidth: 2,
          
        }, {
          labels: {
            align: 'right',
            x: -3
          },
          title: {
            text: 'Volume'
          },
          top: '65%',
          height: '35%',
          offset: 0,
          lineWidth: 2,
          tickAmount: 4
        }],
        tooltip: {
          split: true
        },
        plotOptions: {
          series: {
            dataGrouping: {
              enabled: false
            }
          }
        },
        series: [{
          showInLegend: false,
          type: 'candlestick',
          name: `${this.ticker}`,
          id: 'stock',
          zIndex: 2,
          data: this.ohlc
        }, {
          showInLegend: false,
          type: 'column',
          name: 'Volume',
          id: 'volume',
          data: this.volume,
          yAxis: 1
        }, {
          type: 'vbp',
          linkedTo: 'stock',
          params: {
            volumeSeriesID: 'volume'
          },
          dataLabels: {
            enabled: false
          },
          zoneLines: {
            enabled: false
          }
        }, {
          type: 'sma',
          linkedTo: 'stock',
          zIndex: 1,
          marker: {
            enabled: false
          }
      }]
    }
}

roundToTwoDecimalPlaces(num: number): number {
  var rounded = Math.round(num * 100) / 100;
  return rounded % 1 === 0 ? rounded : rounded;
}

  renderInsights(insider, recommendation, earnings) {
    this.mspr = {total: 0, positive: 0, negative: 0}
    this.change = {total: 0, positive: 0, negative: 0}
    
    for(let inside of insider.data) {
      if(inside.mspr >= 0) {
        this.mspr['positive'] += inside.mspr
      } else {
        this.mspr['negative'] += inside.mspr
      }

      if(inside.change >= 0) {
        this.change['positive'] += inside.change
      } else {
        this.change['negative'] += inside.change
      }
    }
    this.mspr['total'] = Number(this.mspr['positive']) + Number(this.mspr['negative'])
    this.change['total'] = this.change['positive'] + this.change['negative']
    this.mspr['positive'] = this.roundToTwoDecimalPlaces(this.mspr['positive'])
    this.mspr['negative'] = this.roundToTwoDecimalPlaces(this.mspr['negative'])
    this.mspr['total'] = this.roundToTwoDecimalPlaces(this.mspr['total'])
    this.change['positive'] = this.roundToTwoDecimalPlaces(this.change['positive'])
    this.change['negative'] = this.roundToTwoDecimalPlaces(this.change['negative'])
    this.change['total'] = this.roundToTwoDecimalPlaces(this.change['total'])

    this.trends = {
      b: [],
      h: [],
      s: [],
      sb: [],
      ss: [],
      dates: []
    }

    this.categories = []
    this.estimates = []
    this.actuals = []

    for(let recom of recommendation) {
      this.trends['b'].push(recom['buy'])
      this.trends['s'].push(recom['sell'])
      this.trends['h'].push(recom['hold'])
      this.trends['sb'].push(recom['strongBuy'])
      this.trends['ss'].push(recom['strongSell'])
      this.trends['dates'].push(recom['period'])
    }

    this.trendsChartOptions = {
      chart: {
        type: 'column',
        backgroundColor: '#f6f6f6'
    },
    title: {
        text: 'Recommendation Trends',
        align: 'center'
    },
    xAxis: {
        categories: this.trends['dates']
    },
    yAxis: {
        min: 0,
        title: {
            text: '#Analysis'
        },
        stackLabels: {
            enabled: false
        }
    },
    legend: {
        align: 'center',
        verticalAlign: 'bottom',
        y: 0,
        floating: false,
        backgroundColor:'#f6f6f6',
        shadow: false
    },
    tooltip: {
        headerFormat: '<b>{point.x}</b><br/>',
        pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
    },
    plotOptions: {
        column: {
            stacking: 'normal',
            dataLabels: {
                enabled: true
            }
        }
    },
    credits: {
          enabled: false
      },
      exporting: {
        enabled: false
    },
    series: [{
      type: 'column',
      name: 'Strong Buy',
      data: this.trends['sb'],
      color: '#1A6334'
  }, {
    type: 'column',
      name: 'Buy',
      data: this.trends['b'],
      color: '#24AF51'
  }, {
    type: 'column',
      name: 'Hold',
      data: this.trends['h'],
      color: '#B07E28'
  },  {
    type: 'column',
      name: 'Sell',
      data: this.trends['s'],
      color: '#F15053'
  }, {
    type: 'column',
      name: 'Strong Sell',
      data: this.trends['ss'],
      color: '#752B2C'
  }]
    }

    for(let earning of earnings) {
      this.categories.push(`${earning.period}<br>Surprise: ${earning.surprise}`)
      this.estimates.push(earning.estimate)
      this.actuals.push(earning.actual)
    }

    this.earningsChartOptions = {
      chart: {
        type: 'spline',
        backgroundColor: '#f6f6f6'
    },
    title: {
        text: 'Historical EPS Surprises'
    },
    xAxis: {
        categories: this.categories,
        accessibility: {
            description: 'Months of the year'
        }
    },
    yAxis: {
        title: {
            text: 'Quarterly EPS'
        },
    },
    tooltip: {
        shared: true
    },
    credits: {
          enabled: false
      },
      exporting: {
        enabled: false
    },
    series: [{
      type: 'spline',
        name: 'Actual',
        marker: {
        		radius: 4,
            symbol: 'circle'
        },
        data: this.actuals,
        label: {
            enabled: false // Explicitly disable data labels for this series
        }

    }, {
      type: 'spline',
        name: 'Estimate',
        marker: {
        		radius: 4,
            symbol: 'diamond'
        },
        data: this.estimates,
        label: {
            enabled: false // Explicitly disable data labels for this series
        }
    }]
    }
  }
}
