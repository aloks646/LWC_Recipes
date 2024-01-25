import { LightningElement, api, wire, track } from 'lwc';
import fetchAccount from '@salesforce/apex/AccountDisplayInLwc.fetchAccount';
import { refreshApex } from '@salesforce/apex';
import { createRecord, deleteRecord, updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { reduceErrors } from 'c/libErrorInLwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import ACCOUNT_OBJECT from "@salesforce/schema/Account";
import { NavigationMixin } from 'lightning/navigation';

const actions = [
    { label: 'View', name: 'view' },
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' }
];

const columns = [
    { label: 'Account Name', fieldName: 'Name', type: 'text' },
    { label: 'Phone', fieldName: 'Phone', type: 'phone' },
    { label: 'Rating', fieldName: 'Rating', type: 'text' },
    { label: 'Industry', fieldName: 'Industry', type: 'text' },
    { label: 'Email', fieldName: 'Email__c', type: 'email' },
    { label: 'Account Number', fieldName: 'AccountNumber', type: 'text' },
    { label: '', type: 'action', typeAttributes: { rowActions: actions } }
];
export default class CreateReadUpdateDeleteWithLdsInLwc extends NavigationMixin(LightningElement) {

    accountColumnList = columns;
    accountRecordList;
    error;
    showSpinner = false;
    isModalOpen = false;
    accountRecordSize = 0;
    @track modalData = {};
    accountRecordId = '';
    accountRecordName = '';
    recdTypeId = '';
    paginationData = {};

    currentPageNumber = 1;
    pageSize = 10;
    totalPages = 1;
    paginationList = [];

    // to get all details for account object like fields, childRelationship, all account's recordType, etc.
    @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT }) //   @wire(getObjectInfos, { objectApiNames: [ACCOUNT_OBJECT, OPPORTUNITY_OBJECT] })
    wiredResult({ data, error }) {
        if (data) {
            for (let key in data.recordTypeInfos) {
                if (data.recordTypeInfos[key].defaultRecordTypeMapping) {
                    this.recdTypeId = key;
                    break;
                }
            }
        }
        else if (error) {
            console.log('Error while get record types');
            this.lstRecordTypes = '';
        }
    }


    // to fetch all accounts record
    @wire(fetchAccount)
    accountResult(result) {
        this.showSpinner = true;
        if (result) {
            this.accountRecordList = result;
            if (Array.isArray(result.data)) {
                this.accountRecordSize = result.data.length;
                this.totalPages = Math.ceil(this.accountRecordSize / this.pageSize);
                this.handlePaginationList();
            }
            if (result.error) {
                this.error = JSON.stringify(result.error);
            }
        }
        this.showSpinner = false;
    }

    // set title
    get subTitle() {
        return `Accounts (${this.accountRecordSize})`;
    }

    handleNewAccount() {
        this.isModalOpen = true;
        this.modalData.modalHeader = 'New Account';
        this.modalData.recordActionType = 'new';
        this.modalData.recdTypeId = this.recdTypeId;
    }

    handleRowAction(event) {
        const action = event.detail.action.name;
        const row = event.detail.row;
        this.accountRecordId = row.Id;
        this.accountRecordName = row.Name;
        switch (action) {
            case 'view':
                this.navigateToRecordPage(this.accountRecordId);
                break;

            case 'edit':
                this.modalData.modalHeader = 'Edit ' + this.accountRecordName;
                this.modalData.recordActionType = 'edit';
                this.modalData.recdTypeId = this.recdTypeId;
                this.modalData.accountRecord = row;
                this.isModalOpen = true;
                break;

            case 'delete':
                this.modalData.modalHeader = 'Delete Account';
                this.modalData.recordActionType = 'delete';
                this.isModalOpen = true;
                break;
        }
    }

    async handleModalButtonAction(event) {
        const modalButtonAction = event.detail.modalButtonAction;
        if (modalButtonAction === 'delete') {
            this.isModalOpen = false;
            await this.handleDeleteRecord(this.accountRecordId, this.accountRecordName);
        }

        else if (modalButtonAction === 'save' || modalButtonAction === 'saveAndNew') {
            const inputRecord = event.detail.inputRecord;
            if (this.modalData.recordActionType === 'edit') {
                await this.handleEditRecord(inputRecord);
            }
            else if (this.modalData.recordActionType === 'new') {
                await this.handleCreateRecord(inputRecord);
            }

            if (modalButtonAction === 'saveAndNew') {
                this.handleNewAccount();
            }
        }

        else if (modalButtonAction === 'cancel') {
            this.isModalOpen = false;
        }
    }

    // navigate to view record
    navigateToRecordPage(acctId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: acctId,
                actionName: 'view'
            }
        });
    }

    // delete record functionality
    async handleDeleteRecord(acctId, acctName) {
        await deleteRecord(acctId)
            .then(result => {
                this.handleShowToast("", 'Account \"' + acctName + '\" was deleted.', "success", "dismissible");

                // Display fresh data in the datatable
                return this.refresh();
            })
            .catch(error => {
                const message = reduceErrors(error).join(', ');
                this.handleShowToast("Error deleting record", message, "error", "pester");
            })
    }


    // create record
    async handleCreateRecord(inputRecord) {
        await createRecord(inputRecord)
            .then(result => {
                this.recId = result.id;
                this.handleShowToast('', 'Account \"' + inputRecord.fields.Name + '\" was created.', 'success', 'dismissible');
                this.isModalOpen = false;
                // Display fresh data in the datatable
                return this.refresh();
            })
            .catch(error => {
                const message = reduceErrors(error).join(', ');
                this.handleShowToast("", message, "error", "pester");
            });
    }


    // Edit record
    async handleEditRecord(inputRecord) {
        await updateRecord(inputRecord)
            .then(result => {
                this.recId = result.id;
                this.handleShowToast('', 'Account \"' + inputRecord.fields.Name + '\" was saved.', 'success', 'dismissible');
                this.isModalOpen = false;
                // Display fresh data in the datatable
                return this.refresh();
            })
            .catch(error => {
                const message = reduceErrors(error).join(', ');
                this.handleShowToast("", message, "error", "pester");
            });
    }


    // handle show Toast event functionality
    handleShowToast(title, message, variant, mode) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(event);
    }

    async refresh() {
        await refreshApex(this.accountRecordList);
    }


    // pagination
    handlePaginationList() {
        const paginationList = [];
        let start = 0, end = 0;
        const recordList = this.accountRecordList.data;
        let counter = (this.currentPageNumber - 1) * this.pageSize;
        for (; counter < (this.currentPageNumber * this.pageSize); counter++) {
            if (counter >= this.accountRecordSize) {
                break;
            }
            paginationList.push(recordList[counter]);
        }
        start = (this.currentPageNumber - 1) * this.pageSize + 1;
        end = counter;
        this.paginationList = paginationList;
        this.paginationData = {
            'currentPageNumber': this.currentPageNumber, 'pageSize': this.pageSize,
            'totalPages': this.totalPages, 'totalRecords': this.accountRecordSize, 'start': start, 'end': end
        };
    }

    handlePaginationButtonAction(event) {
        this.currentPageNumber = event.detail.currentPageNumber;
        this.pageSize = event.detail.pageSize;
        this.totalPages = event.detail.totalPages;
        this.handlePaginationList();
    }

}