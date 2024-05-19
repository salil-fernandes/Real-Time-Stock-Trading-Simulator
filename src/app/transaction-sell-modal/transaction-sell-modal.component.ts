import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DatabaseService } from '../database.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-transaction-sell-modal',
  templateUrl: './transaction-sell-modal.component.html',
  styleUrl: './transaction-sell-modal.component.css'
})
export class TransactionSellModalComponent {
  @Input() inputdata: any
  stockTicker: string
  currentStockObject: any
  stockObject: any
  currentPrice: any
  currentBalance: any
  quantity: number = 0
  insufficientQuantity: boolean
  unavailable: boolean = true

  newBalance: any

  constructor(private databaseService: DatabaseService, public activeModal: NgbActiveModal) {}

  ngOnInit() {
    this.stockTicker = this.inputdata.ticker
    this.currentPrice = this.inputdata.c

    forkJoin({
      balance: this.databaseService.fetchBalance(),
      stock: this.databaseService.fetchStockPortfolio(this.stockTicker)
    }).subscribe({
      next: (results) => {
        this.currentBalance = results.balance[0].balance.toFixed(2)
        this.currentStockObject = results.stock[0]
      }
    })
  }

  onQuantityChange(newQuantity: any){
    if(this.currentStockObject.quantity - this.quantity < 0 || newQuantity === 0 || newQuantity === null || newQuantity === undefined) {
      this.insufficientQuantity = true
      this.unavailable = true
    } else {
      this.insufficientQuantity = false
      this.unavailable = false
    }
  }

  checkIfSellAll() {
    if(this.currentStockObject['quantity'] - this.quantity === 0) {
      this.sellShares(true)
    } else {
      this.sellShares(false)
    }   
  }
  

  sellShares(sellingAll) {
    this.stockObject = {}
    this.newBalance = 0
    if(sellingAll) {
      this.newBalance = (Number(this.currentBalance) + Number(this.currentStockObject.current * this.quantity)).toFixed(2)
      forkJoin({
        balanceupdate: this.databaseService.modifyWallet(this.newBalance),
        updateportfolio: this.databaseService.modifyPortfolio('REMOVE', this.stockTicker),
        removestock: this.databaseService.sellAllShares(this.stockTicker)
      }).subscribe({
        next: (results) => {
          this.activeModal.close('sell-all-successful')
        }
      })
    } else {
      this.stockObject.quantity = Number(Number(this.currentStockObject.quantity) - Number(this.quantity)).toFixed(2)
      this.stockObject.total = Number(Number(this.currentStockObject.total) - (Number(this.quantity) * Number(this.currentStockObject.costpershare))).toFixed(2)
      this.stockObject.costpershare = (Number(this.stockObject.total) / Number(this.stockObject.quantity)).toFixed(2)
      this.stockObject.current = (Number(this.currentPrice)).toFixed(2)
      this.stockObject.change = (Number(this.stockObject.current) - Number(this.stockObject.costpershare)).toFixed(2)
      this.stockObject.market = Number(Number(this.stockObject.quantity) * Number(this.stockObject.current)).toFixed(2)
      this.newBalance = Number(Number(this.currentBalance) + Number(this.currentPrice * this.quantity)).toFixed(2)
      this.databaseService.fetchStockPortfolio(this.stockTicker).subscribe({
        next: (stock) => {
          
          forkJoin({
            balanceupdate: this.databaseService.modifyWallet(this.newBalance),
            stocksell: this.databaseService.mainPortfolioSell(this.stockTicker, this.stockObject)
          }).subscribe({
            next: (results) => {
              this.activeModal.close('sell-successful')
            }
          })
        }
      })
    }
  }
}