import { LightningElement, wire, api, track } from 'lwc';
import createRecord from '@salesforce/apex/CreateAccountWithBulkContactInLwc.createRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { reduceErrors } from 'c/libErrorInLwc';

export default class CreateAccountWithBulkContactInLwc extends NavigationMixin(LightningElement) {

	newRowsAdded = 1;
	@track accountData = {
		acctName: '',
		acctPhone: '',
		acctEmail: ''
	};

	@track contactData = {
		srNo: 1,
		contFirstName: '',
		contLastName: '',
		contPhone: '',
		contEmail: ''
	};

	@track accountInputRecordMap = {};
	@track contactListItems = [];

	connectedCallback() {
		this.handleResetData();
	}

	handleResetData() {
		this.newRowsAdded = 1;
		this.accountInputRecordMap = Object.assign({}, this.accountData);
		let obj = Object.assign({}, this.contactData);
		this.contactListItems = [{ ...obj }];
	}

	handleAddNewRowButton() {
		const count = this.contactListItems.length;
		for (let i = 1; i <= this.newRowsAdded; i++) {
			this.contactListItems.push({ srNo: count + i });
		}
	}

	handleAccountInputChange(event) {
		const name = event.currentTarget.dataset.name;
		this.accountInputRecordMap[name] = event.target.value;
	}

	handleContactInputChange(event) {
		const index = event.currentTarget.dataset.index;
		const name = event.currentTarget.dataset.name;
		this.contactListItems[index][name] = event.target.value;
	}

	handleRowAddInput(event) {
		this.newRowsAdded = event.target.value;
	}

	handleRemoveRow(event) {
		const count = this.contactListItems.length;
		const index = event.currentTarget.dataset.index;
		if (count > 1) {
			this.contactListItems.splice(index, 1);
			for (let i = 0; i < this.contactListItems.length; i++) {
				this.contactListItems[i].srNo = i + 1;
			}
		}
		else if (count === 1) {
			this.handleShowToast("", "You must have atleat a Contact item!", "warning", "dismissible");
		}
	}

	handleFormButtonAction(event) {
		const buttonName = event.target.name;
		if (buttonName === 'cancel') {
			this.handleResetData();
		}
		else if (buttonName === 'save' || buttonName === 'saveAndNew') {
			if (this.validateForm('.validateAccount')) {
				const allValid = this.validateForm('.validateContact');
				if (allValid) {
					this.handleSubmitRecords(buttonName);
				}
				else if (!allValid) {
					this.handleShowToast("", "No Contact item Found!", "warning", "dismissible");
				}
			}
		}
	}

	validateForm(className) {
		let allValid = true;
		const fields = this.template.querySelectorAll(className);
		if (fields) {
			fields.forEach(field => {
				if (!field.checkValidity()) {
					allValid = false;
					field.reportValidity();
				}
			});
		}
		return allValid;
	}

	async handleSubmitRecords(buttonName) {
		await createRecord({ accountRecord: JSON.stringify(this.accountInputRecordMap), contactRecord: JSON.stringify(this.contactListItems) })
			.then(result => {
				this.handleShowToast("", "Account with Contact(s) are created.", "success", "dismissible");
				this.handleResetData();
				if (buttonName === 'save') {
					this.navigateToAccountRecordPage(result);
				}
			})
			.catch(error => {
				const message = reduceErrors(error).join(', ');
				this.handleShowToast("", message, "error", "pester");
			})
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

	navigateToAccountRecordPage(accountId) {
		this[NavigationMixin.Navigate]({
			type: 'standard__recordPage',
			attributes: {
				recordId: accountId,
				actionName: 'view',
				objectApiName: 'Account'
			}
		});
	}
}