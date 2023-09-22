import { LightningElement, api, track, wire } from 'lwc';
import getPicklistFieldValue from '@salesforce/apex/CRUDwithApexInLwc.getPicklistFieldValue';

export default class LibModalBox2InLwc extends LightningElement {

    @api modalData = {};
    accountRecordMap = {};
    ratingPicklistValue = [];
    industryPicklistValue = [];
    error;

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
            this.accountRecordMap.acctId = this.modalData.accountRecord.acctId;
            this.accountRecordMap.acctName = this.modalData.accountRecord.acctName;
            this.accountRecordMap.acctPhone = this.modalData.accountRecord.acctPhone;
            this.accountRecordMap.acctRating = this.modalData.accountRecord.acctRating ? this.modalData.accountRecord.acctRating : '';
            this.accountRecordMap.acctIndustry = this.modalData.accountRecord.acctIndustry ? this.modalData.accountRecord.acctIndustry : '';
            this.accountRecordMap.acctEmail = this.modalData.accountRecord.acctEmail;
            this.accountRecordMap.acctAccountNumber = this.modalData.accountRecord.acctAccountNumber;
        }
    }

    renderedCallback() {
    }

    // get picklist fields value
    @wire(getPicklistFieldValue)
    wiredResult({ data, error }) {
        if (data) {
            this.ratingPicklistValue = this.handlePicklistData(data, 'ratingOptions');
            this.industryPicklistValue = this.handlePicklistData(data, 'industryOptions');
            this.error = undefined;
        }
        else if (error) {
            this.error = JSON.stringify(error);
        }
    }

    handlePicklistData(data, fieldName) {
        const fields = data[fieldName];
        let arr = [{ label: '--None--', value: '' }];
        for (let key in fields) {
            arr.push({ label: fields[key], value: key });
        }
        return arr;
    }


    handleInputChange(event) {
        const inputFieldName = event.target.name;
        this.accountRecordMap[inputFieldName] = event.target.value;
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
                const custmEvent = new CustomEvent('modalbuttonaction', {
                    detail: { 'modalButtonAction': modalButtonAction, 'inputRecord': this.accountRecordMap }
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


    //validate record form
    handleValidateRecordForm() {
        let allValid = true;
        const fields = this.template.querySelectorAll('.validate');
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