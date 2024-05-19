import { Component } from '@angular/core';
import { APIService } from '../api.service';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { VariablePassingService } from '../variable-passing.service';
import { StateService } from '../state.service';


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent {
  autocompleteData = []
  finalAutoCompleteCompanies: Observable<any[]>
  mainForm = new FormControl();
  storedForm = new FormControl();
  isLoading: boolean;
  inputTicker: string;
  selectedOption: string

  constructor(private apiService: APIService, private variablePassingService: VariablePassingService, private stateService: StateService, private router: Router, private http: HttpClient, private route: ActivatedRoute) {
    this.isLoading = false;
    this.autocompleteData = [];

    this.mainForm.valueChanges.pipe(
      debounceTime(280),
    )
    .subscribe(value => {
      this.autocompleteData = [];
      this.storedForm.setValue("");
      if (!value || value.length == 0) {
        this.isLoading = false;
        this.autocompleteData = [];
        this.storedForm.setValue("");
      } else {
        this.isLoading = true;
        this.apiService.fetchAutocompleteData(value.trim())
        .subscribe(res => {
          this.autocompleteData = res;
          this.storedForm.setValue(value);
          this.isLoading = false;
        });
      }
    })

    this.finalAutoCompleteCompanies = this.storedForm.valueChanges.pipe(
      map(company => {
        return this.autocompleteData.slice()
      })
    )
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if(params.symbol != 'home') {
        this.mainForm.setValue(params.symbol)
      }
    })
  }

  optionSelect(option: any) {
    this.selectedOption = option
    this.variablePassingService.changeTicker(option)
    this.variablePassingService.triggerReset()
  }

  searchClick(event: Event) {
    event.preventDefault();
    this.inputTicker = this.mainForm.value
    this.variablePassingService.changeTicker(this.inputTicker);
    if(this.inputTicker === undefined || this.inputTicker.replace(/\s/g, '') === '') {
      this.variablePassingService.changeBlankTicker(true)
    }
  }

  resetClick() {
    this.mainForm.setValue('')
    this.variablePassingService.changeTicker('home')
    this.variablePassingService.changeTickerValidity(false)
    this.variablePassingService.changeDataValidity(false)
    this.variablePassingService.triggerReset();
    this.stateService.clearStore()
    this.router.navigate(['/'])
  }
}
