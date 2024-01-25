import { LightningElement, api, track } from 'lwc';

export default class LibPaginationInLwc extends LightningElement {

	@api paginationData = {};
	currentPageNumber = 1;
	pageSize = "10";

	renderedCallback() {
	}

	handlePaginationButton(event) {
		const pageButtonName = event.target.name;
		if (pageButtonName === 'first') {
			this.currentPageNumber = 1;
		}
		else if (pageButtonName === 'next') {
			this.currentPageNumber++;
		}
		else if (pageButtonName === 'previous') {
			this.currentPageNumber--;
		}
		else if (pageButtonName === 'last') {
			this.currentPageNumber = this.paginationData.totalPages;
		}

		const custmEvent = new CustomEvent('paginationbuttonaction', {
			detail: {
				'currentPageNumber': this.currentPageNumber, 'pageSize': parseInt(this.pageSize),
				'totalPages': this.paginationData.totalPages
			}
		});
		this.dispatchEvent(custmEvent);
	}

	get buttonDisabled1() {
		if (this.currentPageNumber === 1) {
			return true;
		}
	}

	get buttonDisabled2() {
		if (this.currentPageNumber === this.paginationData.totalPages) {
			return true;
		}
	}

	get pageSizeOption() {
		const arr = ["5", "10", "20", "50"];
		const pageList = [];
		arr.forEach(elem => {
			pageList.push({ label: elem, value: elem });
		});
		return pageList;
	}

	handlePageSizeChange(event) {
		this.pageSize = event.detail.value;
		const accountRecordSize = this.paginationData.accountRecordSize;
		const totalPages = Math.ceil(accountRecordSize / parseInt(this.pageSize));
		this.currentPageNumber = 1;
		const custmEvent = new CustomEvent('paginationbuttonaction', {
			detail: { 'currentPageNumber': this.currentPageNumber, 'pageSize': parseInt(this.pageSize), 'totalPages': totalPages }
		});
		this.dispatchEvent(custmEvent);
	}
}