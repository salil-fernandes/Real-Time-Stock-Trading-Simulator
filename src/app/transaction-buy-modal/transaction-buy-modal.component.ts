import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DatabaseService } from '../database.service';
import { delay, forkJoin } from 'rxjs';

@Component({
  selector: 'app-transaction-buy-modal',
  templateUrl: './transaction-buy-modal.component.html',
  styleUrl: './transaction-buy-modal.component.css'
})
export class TransactionBuyModalComponent {
  @Input() inputdata: any
  stockTicker: string
  stockObject: any
  currentPrice: any
  currentBalance: any
  newBalance: any
  quantity: number = 0
  insufficientBalance: boolean
  unavailable: boolean = true

  constructor(private databaseService: DatabaseService, public activeModal: NgbActiveModal) {}

  ngOnInit() {
    this.stockTicker = this.inputdata.ticker
    this.currentPrice = this.inputdata.c
    this.databaseService.fetchBalance().subscribe({
      next: (value) => {
        this.currentBalance = value[0].balance.toFixed(2)
      }
    })
  }

  onQuantityChange(newQuantity: any){
    if(this.currentBalance - newQuantity * this.currentPrice < 0 || newQuantity === 0 || newQuantity === null) {
      this.insufficientBalance = true
      this.unavailable = true
    } else {
      this.insufficientBalance = false
      this.unavailable = false
    }
  }

  checkIfFirst() {
    this.databaseService.fetchCurrentPortfolio().subscribe({
      next: (portlist) => {
        if(!portlist.includes(this.stockTicker)) {
          this.buyShares(false)
        } else {
          this.buyShares(true)
        }
      }
    })
  }

  buyShares(presentInPortfolio) {
    this.stockObject = {}
    this.newBalance = 0
    if(!presentInPortfolio) {
      this.stockObject.name = "portfolio-stock"
      this.stockObject.ticker = this.stockTicker
      this.stockObject.company = this.inputdata.company
      this.stockObject.quantity = Number(this.quantity).toFixed(2)
      this.stockObject.costpershare = ((Number(this.quantity) * Number(this.currentPrice)) / Number(this.quantity)).toFixed(2)
      this.stockObject.total = (Number(this.quantity) * Number(this.currentPrice)).toFixed(2)
      this.stockObject.current = Number(this.currentPrice).toFixed(2)
      this.stockObject.change = Number(Number(this.currentPrice) - Number(this.stockObject.costpershare)).toFixed(2)
      this.stockObject.market = (Number(this.stockObject.current) * Number(this.stockObject.quantity)).toFixed(2)
      this.newBalance = Number(Number(this.currentBalance) - Number(this.stockObject.total)).toFixed(2)
      forkJoin({
        balanceupdate: this.databaseService.modifyWallet(this.newBalance),
        listupdate: this.databaseService.modifyPortfolio('ADD', this.stockTicker),
        insert: this.databaseService.firstPortfolioBuy(this.stockObject)
      }).subscribe({
        next: (results) => {
          this.activeModal.close('buy-successful')
        }
      })
    } else {
      this.databaseService.fetchStockPortfolio(this.stockTicker).subscribe({
        next: (stock) => {
          let fetchedStock = stock[0]
          this.stockObject.name = "portfolio-stock"
          this.stockObject.ticker = this.stockTicker
          this.stockObject.company = this.inputdata.company
          this.stockObject.quantity = (Number(fetchedStock.quantity) + Number(this.quantity)).toFixed(2)
          this.stockObject.costpershare = Number((((Number(fetchedStock.costpershare) * Number(fetchedStock.quantity)) + (Number(this.currentPrice) * Number(this.quantity))) / (Number(this.quantity) + Number(fetchedStock.quantity))).toFixed(2))
          this.stockObject.total = (Number(fetchedStock.total) + (Number(this.quantity) * Number(this.currentPrice))).toFixed(2)
          this.stockObject.current = Number(this.currentPrice).toFixed(2)
          this.stockObject.change = (Number(this.currentPrice) - Number(this.stockObject.costpershare)).toFixed(2)
          this.stockObject.market = (Number(this.stockObject.quantity) * Number(this.stockObject.current)).toFixed(2)
          this.newBalance = (Number(this.currentBalance) - (Number(this.quantity) * Number(this.currentPrice))).toFixed(2)
          forkJoin({
            balanceupdate: this.databaseService.modifyWallet(this.newBalance),
            stockbuy: this.databaseService.mainPortfolioBuy(this.stockTicker, this.stockObject)
          }).subscribe({
            next: (results) => {
              this.activeModal.close('buy-successful')
            }
          })
        }
      })
    }
  }
}
