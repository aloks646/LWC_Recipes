import { LightningElement, api, wire, track } from 'lwc';
import { getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import PHONE_FIELD from '@salesforce/schema/Account.Phone';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';
import RATING_FIELD from '@salesforce/schema/Account.Rating';
import EMAIL_FIELD from '@salesforce/schema/Account.Email__c';
import ACCOUNT_NUMBER_FIELD from '@salesforce/schema/Account.AccountNumber';
import ID_FIELD from "@salesforce/schema/Account.Id";

export default class LibModalBoxInLwc extends LightningElement {

	@api isModalOpen = false;
	@api modalData = {};
	ratingPicklistValue = [];
	industryPicklistValue = [];
	accountRecordMap = {};

	connectedCallback() {
		this.accountRecordMap = {};
		if (this.modalData.recordActionType === 'new') {
			this.accountRecordMap.acctName = '';
			this.accountRecordMap.acctPhone = '';
			this.accountRecordMap.acctRating = '';
			this.accountRecordMap.acctIndustry = '';
			this.accountRecordMap.acctEmail = '';
			this.accountRecordMap.acctAccountNumber = '';
		}
		else if (this.modalData.recordActionType === 'edit') {
			this.accountRecordMap.acctId = this.modalData.accountRecord.Id;
			this.accountRecordMap.acctName = this.modalData.accountRecord.Name;
			this.accountRecordMap.acctPhone = this.modalData.accountRecord.Phone;
			this.accountRecordMap.acctRating = this.modalData.accountRecord.Rating ? this.modalData.accountRecord.Rating : '';
			this.accountRecordMap.acctIndustry = this.modalData.accountRecord.Industry ? this.modalData.accountRecord.Industry : '';
			this.accountRecordMap.acctEmail = this.modalData.accountRecord.Email__c;
			this.accountRecordMap.acctAccountNumber = this.modalData.accountRecord.AccountNumber;
		}
	}

	handleInputChange(event) {
		const inputFieldName = event.target.name;
		this.accountRecordMap[inputFieldName] = event.target.value;
	}

	// get picklist option by wire adapter
	@wire(getPicklistValuesByRecordType, { recordTypeId: '$modalData.recdTypeId', objectApiName: ACCOUNT_OBJECT })
	wiredPicklist({ data, error }) {
		if (data) {
			this.ratingPicklistValue = this.handlePicklistValue(data.picklistFieldValues, 'Rating');
			this.industryPicklistValue = this.handlePicklistValue(data.picklistFieldValues, 'Industry');
		}
		else if (error) {
			this.ratingPicklistValue = [];
			this.industryPicklistValue = [];
		}
	}

	handlePicklistValue(data, picklistField) {
		const value = data[picklistField].values;
		let arr = [{ label: '--None--', value: '' }];
		value.forEach(elem => {
			arr.push({ label: elem.label, value: elem.value });
		})
		return arr;
	}

	handleModalButtonAction(event) {
		const modalButtonAction = event.target.name;
		if (modalButtonAction === 'cancel' || modalButtonAction === 'delete') {
			const custmEvent = new CustomEvent('modalbuttonaction', {
				detail: { 'modalButtonAction': modalButtonAction }
			});
			this.dispatchEvent(custmEvent);
		}

		else if (modalButtonAction === 'save' || modalButtonAction === 'saveAndNew') {
			if (this.handleValidateRecordForm()) {
				const inputRecord = this.handleRecordFormation();
				const custmEvent = new CustomEvent('modalbuttonaction', {
					detail: { 'modalButtonAction': modalButtonAction, 'inputRecord': inputRecord }
				});
				this.dispatchEvent(custmEvent);
			}
		}
	}

	handleModalButtonClose() {
		const modalButtonAction = 'cancel';
		const custmEvent = new CustomEvent('modalbuttonaction', {
			detail: { 'modalButtonAction': modalButtonAction }
		});
		this.dispatchEvent(custmEvent);
	}

	// to validate record form
	handleValidateRecordForm() {
		let allValid = true;
		const fields = this.template.querySelectorAll(".validate");
		fields.forEach(field => {
			if (!field.checkValidity()) {
				allValid = false;
				field.reportValidity();
			}
		});
		return allValid;
	}


	// create final record to insert/update
	handleRecordFormation() {
		const fields = {};
		const inputRecord = {};
		fields[NAME_FIELD.fieldApiName] = this.accountRecordMap.acctName;
		fields[PHONE_FIELD.fieldApiName] = this.accountRecordMap.acctPhone;
		fields[RATING_FIELD.fieldApiName] = this.accountRecordMap.acctRating;
		fields[INDUSTRY_FIELD.fieldApiName] = this.accountRecordMap.acctIndustry;
		fields[EMAIL_FIELD.fieldApiName] = this.accountRecordMap.acctEmail;
		fields[ACCOUNT_NUMBER_FIELD.fieldApiName] = this.accountRecordMap.acctAccountNumber;
		if (this.modalData.recordActionType === 'edit') {
			fields[ID_FIELD.fieldApiName] = this.accountRecordMap.acctId;
		}

		if (this.modalData.recordActionType === 'new') {
			inputRecord.apiName = ACCOUNT_OBJECT.objectApiName;
		}
		inputRecord.fields = fields;

		return inputRecord;
	}

	// to set modal's body and footer according to new, edit, delete action
	get typeOfRecordAction() {
		if (this.modalData.recordActionType !== 'delete') {
			return true;
		}
		return null;
	}

	get ratingOptions() {
		return this.ratingPicklistValue;
	}

	get industryOptions() {
		return this.industryPicklistValue;
	}
}