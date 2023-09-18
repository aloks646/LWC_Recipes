import { LightningElement, wire, track } from 'lwc';
import fetchAllMetadataName from '@salesforce/apex/FetchMetadataInfoCtrlInLwc.fetchAllMetadataName';
import fetchAllMetadataRecord from '@salesforce/apex/FetchMetadataInfoCtrlInLwc.fetchAllMetadataRecord';
import { reduceErrors } from 'c/libErrorInLwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import TIME_ZONE from '@salesforce/i18n/timeZone';

const timeZone = TIME_ZONE;
export default class MetadataExplorerInLwc extends LightningElement {

	@track metadataList;
	selectedValue = '';
	searchKey = '';
	baseUrl;
	@track metadataRecordList;
	totalRecords = 0;
	showSpinner = false;
	hasNoRecord = false;
	hasSearchNoRecord = false;

	currentPageNumber = 1;
	pageSize = 10;
	start = 0;
	end = 0;
	totalPages = 0;
	recordFetchSize = 0;
	paginationData = {};

	userLocale;

	connectedCallback() {
		this.showSpinner = true;
		this.baseUrl = window.location.origin;
	}


	// fetch all metadata name and it's record size
	@wire(fetchAllMetadataName)
	wiredResult({ data, error }) {
		if (data) {
			this.showSpinner = false;
			if (Array.isArray(data.metadataList) && data.metadataList.length > 0) {
				let arr = [];
				data.metadataList.forEach(elem => {
					arr.push({ label: elem.metadataLabel, value: elem.metadataValue });
				});
				this.metadataList = arr;
				let userLocale = data.userLocale.split('_');
				this.userLocale = userLocale[0] + '-' + userLocale[1];
			}
		}
		else if (error) {
			this.showSpinner = false;
			const message = reduceErrors(error).join(', ');
			this.handleShowToast("", message, "error", "pester");
		}
	}

	async handleMetadataChange(event) {
		this.searchKey = '';
		this.currentPageNumber = 1;
		this.selectedValue = event.detail.value;
		this.showSpinner = true;
		await this.handleMetadataRecord();
	}

	async handleInputChange(event) {
		this.searchKey = event.target.value;
		this.showSpinner = true;
		if (this.selectedValue) {
			await this.handleMetadataRecord();
		}
		else {
			this.showSpinner = false;
		}
	}


	// fetch all metadata records
	async handleMetadataRecord() {
		await fetchAllMetadataRecord({ metadataName: this.selectedValue, searchKey: this.searchKey, currentPageNumber: this.currentPageNumber, pageSize: this.pageSize })
			.then(result => {
				this.showSpinner = false;
				this.hasNoRecord = false;
				this.hasSearchNoRecord = false;
				this.totalRecords = result.totalRecords;
				const arr = result.recordList;
				if (arr && Array.isArray(arr) && arr.length > 0) {
					const options = {
						year: "numeric", month: "numeric", day: "numeric",
						hour: "numeric", minute: "numeric", hour12: true, timeZone: timeZone,
					};

					let fValue;
					arr.forEach(elem => {
						elem.showCode = false;
						elem.viewHide = 'View';
						if (elem.createdDate) {
							fValue = new Date(elem.createdDate);
							fValue = new Intl.DateTimeFormat(this.userLocale, options).format(fValue);
							elem.createdDate = fValue;
						}
						if (elem.lastModifiedDate) {
							fValue = new Date(elem.lastModifiedDate);
							fValue = new Intl.DateTimeFormat(this.userLocale, options).format(fValue);
							elem.lastModifiedDate = fValue;
						}
					});
					this.metadataRecordList = arr;
					this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
					const value = (this.currentPageNumber - 1) * this.pageSize;
					this.start = value + 1;
					this.end = value + this.metadataRecordList.length;
					this.paginationData = { 'totalPages': this.totalPages, 'totalRecords': this.totalRecords, 'start': this.start, 'end': this.end };
				}
				else {
					this.totalRecords = result.totalRecords;
					this.metadataRecordList = undefined;
					if (this.totalRecords <= 0 && !this.searchKey) {
						this.hasNoRecord = true;
						this.hasSearchNoRecord = false;
					}
					else {
						this.hasSearchNoRecord = true;
						this.hasNoRecord = false;
					}
				}
			})
			.catch(error => {
				this.showSpinner = false;
				this.metadataRecordList = undefined;
				const message = reduceErrors(error).join(', ');
				this.handleShowToast("", message, "error", "pester");
			})
	}

	async handlePaginationButtonAction(event) {
		this.currentPageNumber = event.detail.currentPageNumber;
		this.pageSize = event.detail.pageSize;
		this.showSpinner = true;
		await this.handleMetadataRecord();
	}

	handleRecordButton(event) {
		const buttonLabel = event.target.label;
		const id = event.currentTarget.dataset.id;
		if (buttonLabel === 'Edit') {
			let url = this.baseUrl + '/lightning/setup/' + this.selectedValue;
			if (this.selectedValue === 'ApexClass') {
				url += 'es/page?address=%2F' + id;
			}
			else {
				url += 's/page?address=%2F' + id;
			}
			window.open(url);
		}

		else if (buttonLabel === 'View') {
			this.metadataRecordList = this.metadataRecordList.map(elem => {
				if (elem.id == id) {
					elem.showCode = true;
					elem.viewHide = 'Hide';
				}
				return elem;
			})
		}

		else if (buttonLabel === 'Hide') {
			this.metadataRecordList = this.metadataRecordList.map(elem => {
				if (elem.id == id) {
					elem.showCode = false;
					elem.viewHide = 'View';
				}
				return elem;
			})
		}
	}

	get metadataOption() {
		return this.metadataList;
	}

	get placeHolder() {
		let search = 'Search ';
		if (this.selectedValue === 'ApexClass') {
			return search + 'Apex Classes';
		}
		else if (this.selectedValue === 'ApexTrigger') {
			return search + 'Trigger';
		}
		else if (this.selectedValue === 'ApexPage') {
			return search + 'Visualforce Page';
		}
		else if (this.selectedValue === 'ApexComponent') {
			return search + 'Visualforce Component';
		}
		return search;
	}


	get hasNoRecordMessage() {
		let search = 'No ';
		if (this.selectedValue === 'ApexClass') {
			search += 'Apex Class(es) are';
		}
		else if (this.selectedValue === 'ApexTrigger') {
			search += 'Trigger(s) are';
		}
		else if (this.selectedValue === 'ApexPage') {
			search += 'Visualforce Page(s) are';
		}
		else if (this.selectedValue === 'ApexComponent') {
			search += 'Visualforce Component(s) are';
		}
		return !this.searchKey ? search + ' Available' : search + ' Found...';
	}

	handleShowToast(title, message, variant, mode) {
		const event = new ShowToastEvent({
			title: title,
			message: message,
			variant: variant,
			mode: mode
		});
		this.dispatchEvent(event);
	}
}