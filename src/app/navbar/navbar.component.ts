import { Component } from '@angular/core';
import { VariablePassingService } from '../variable-passing.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  
  tickerSymbol: string = 'home';
  isNavbarExpanded = false;

  constructor(private variablePassingService: VariablePassingService) {}

  ngOnInit() {
    this.variablePassingService.currentTicker.subscribe(ticker => {
      if (ticker) {
        this.tickerSymbol = ticker;
      }
    });
  }
}
