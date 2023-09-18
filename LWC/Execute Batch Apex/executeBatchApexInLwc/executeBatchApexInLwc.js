import { LightningElement, wire } from 'lwc';
import fetchAllBatchApex from '@salesforce/apex/ExecuteBatchApexInLwcCtrl.fetchAllBatchApex';
import executeBatchApex from '@salesforce/apex/ExecuteBatchApexInLwcCtrl.executeBatchApex';
import getJobDetails from '@salesforce/apex/ExecuteBatchApexInLwcCtrl.getJobDetails';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { reduceErrors } from 'c/libErrorInLwc';

export default class ExecuteBatchApexInLwc extends LightningElement {

	disableBatchSize = true;
	disableExecuteBatch = true;
	disableBatchOption = false;
	batchApexList;
	selectedBatchApex;
	batchSize = 0;
	batchJobId;
	totalJobItems;
	jobItemsProcessed;
	executedPercentage = 0;
	executedIndicator = 0;
	isBatchCompleted = false;

	// get all batch apex name
	@wire(fetchAllBatchApex)
	wiredResult({ data, error }) {
		if (data) {
			let arr = [];
			data.forEach(elem => {
				arr.push({ label: elem.Name, value: elem.Name });
			});
			this.batchApexList = arr;
		}
		else if (error) {
			const message = reduceErrors(error).join(', ');
			this.handleShowToast("", message, "error", "pester");
			this.batchApexList = undefined;
		}
	}

	get batachApexOptions() {
		return this.batchApexList;
	}
	handleBatchNameChange(event) {
		this.refreshData();
		this.batchSize = 0;
		this.selectedBatchApex = event.detail.value;
		this.disableBatchSize = false;
		this.batchSize = 0;
		this.disableExecuteBatch = true;
	}

	handleBatchSizeChange(event) {
		this.batchSize = event.target.value;
		this.disableExecuteBatch = false;
		if (!this.batchSize) {
			this.disableExecuteBatch = true;
		}
	}

	async handleExecuteBatchButton() {
		this.refreshData();
		if (this.batchSize <= 0 || this.batchSize > 2000) {
			this.handleShowToast("", 'Batch size must be in range of 1-2000', "warning", "pester");
		}

		else {
			await this.handleExecuteBatch();
		}
	}

	//execute the batch class
	async handleExecuteBatch() {
		await executeBatchApex({ className: this.selectedBatchApex, chunkSize: this.batchSize })
			.then(result => {
				if (result) {
					this.batchJobId = result;
					this.getBatchStatus();
				}
			})
			.catch(error => {
				const message = reduceErrors(error).join(', ');
				this.handleShowToast("", message, "error", "pester");
			})
	}

	//get the batch status
	async getBatchStatus() {
		await getJobDetails({ jobId: this.batchJobId })
			.then(res => {
				if (res[0]) {
					this.disableBatchOption = true;
					this.disableBatchSize = true;
					this.disableExecuteBatch = true;
					this.totalJobItems = res[0].TotalJobItems;
					this.jobItemsProcessed = res[0].JobItemsProcessed;
					if (res[0].TotalJobItems !== 0 && res[0].TotalJobItems == res[0].JobItemsProcessed) {
						this.isBatchCompleted = true;
					}
					if (this.totalJobItems > 0) {
						this.executedPercentage = ((this.jobItemsProcessed / this.totalJobItems) * 100).toFixed(2);
					}
					this.executedIndicator = Math.floor(Number(this.executedPercentage));
					this.refreshBatchOnInterval();
				}
			}).catch(error => {
				const message = reduceErrors(error).join(', ');
				this.handleShowToast("", message, "error", "pester");
			})
	}

	refreshBatchOnInterval() {
		this._interval = setInterval(() => {
			if (this.isBatchCompleted) {
				clearInterval(this._interval);
				this.disableBatchOption = false;
				this.disableBatchSize = false;
				this.disableExecuteBatch = false;
			} else {
				this.getBatchStatus();
			}
		}, 2000);
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

	refreshData() {
		this.batchJobId = '';
		this.totalJobItems = 0;
		this.jobItemsProcessed = 0;
		this.executedPercentage = 0;
		this.executedIndicator = 0;
		this.isBatchCompleted = false;
	}
}