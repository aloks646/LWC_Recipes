import { LightningElement, track } from 'lwc';
import fetchAccountWithContact from '@salesforce/apex/showChildRecordOnAccountInLwc.fetchAccountWithContact';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { reduceErrors } from 'c/libErrorInLwc';

export default class ShowAccountWithContactInLwc extends LightningElement {

	totalRecords = 0;
	@track accountList = [];
	showSpinner = false;
	hasRecord = false;
	hasNoRecord = false;
	contactList = [];

	pageSize = 10;
	currentPageNumber = 1;
	start = 0;
	end = 0;
	recordFetchSize = 0;
	totalPages = 1;
	paginationData = {};
	isModalOpen = false;

	async connectedCallback() {
		await this.handleAccountFetch();
	}

	async handleAccountFetch() {
		this.showSpinner = true;
		await fetchAccountWithContact({ pageSize: this.pageSize, currentPageNumber: this.currentPageNumber })
			.then(result => {
				//console.log('result==> '+JSON.stringify(result));
				this.totalRecords = result['countTotal'];
				const acctListWrapper = result['acctListWrapper'];
				if (acctListWrapper && Array.isArray(acctListWrapper) && acctListWrapper.length > 0) {
					this.accountList = acctListWrapper;
					this.recordFetchSize = acctListWrapper.length;

					this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
					this.start = (this.currentPageNumber - 1) * this.pageSize + 1;
					this.end = (this.currentPageNumber - 1) * this.pageSize + this.recordFetchSize;

					this.paginationData = { 'totalPages': this.totalPages, 'totalRecords': this.totalRecords, 'start': this.start, 'end': this.end };
					this.hasRecord = true;
					this.hasNoRecord = false;
				}
				else {
					this.hasRecord = false;
					this.hasNoRecord = true;
				}
			})
			.catch(error => {
				const message = reduceErrors(error).join(', ');
				this.handleShowToast("", message, "error", "pester");
			})
			.finally(() => {
				this.showSpinner = false;
			});
	}

	get subTitle() {
		return `Account with Contacts (${this.totalRecords})`;
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

	handlePaginationButtonAction(event) {
		this.currentPageNumber = event.detail.currentPageNumber;
		this.pageSize = event.detail.pageSize;
		this.totalPages = event.detail.totalPages;
		this.handleAccountFetch();
	}

	handleContactView(event) {
		const index = event.currentTarget.dataset.index;
		this.contactList = this.accountList[index]['contListWrapper'];
		console.log('contact==> ' + JSON.stringify(this.contactList));
		this.isModalOpen = true;
	}

	handleCloseModal() {
		this.isModalOpen = false;
	}
}