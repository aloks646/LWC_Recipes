import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { reduceErrors } from 'c/libErrorInLwc';
import viewAllAccount from '@salesforce/apex/CRUDwithApexInLwc.viewAllAccount';
import deleteAccountRecord from '@salesforce/apex/CRUDwithApexInLwc.deleteAccountRecord';
import upsertAccountRecord from '@salesforce/apex/CRUDwithApexInLwc.upsertAccountRecord';


export default class CreateReadUpdateDeleteWithApexInLwc extends NavigationMixin(LightningElement) {

    @track accountList = [];
    recordFetchSize = 0;
    totalRecordSize = 0;
    error;
    paginationData = {};
    accountId = '';
    accountName = '';
    hasRecord = false;
    hasNoRecord = false;
    wrapperData = {};

    currentPageNumber = 1;
    pageSize = 10;
    totalPages = 1;
    start = 0;
    end = 0;

    modalData = {}
    showSpinner = false;
    isModalOpen = false;
    isNew = false;
    isUpsert = false;

    async connectedCallback() {
        await this.handleFetchAllRecord();
    }

    async handleFetchAllRecord() {
        this.showSpinner = true;
        await viewAllAccount({ pageSize: this.pageSize, currentPageNumber: this.currentPageNumber })
            .then(result => {
                this.wrapperData = result;
                if (result.accountList && (Array.isArray(result.accountList) && result.accountList.length > 0)) {
                    this.hasRecord = true;
                    this.hasNoRecord = false;
                    this.handlePaginationList();
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

    //Pagination
    handlePaginationList() {
        const arr = this.wrapperData.accountList;
        this.start = (this.currentPageNumber - 1) * this.pageSize + 1;
        this.accountList = arr.map((elem, index) => ({ index: this.start + index, ...elem }));

        this.recordFetchSize = arr.length;
        this.end = (this.currentPageNumber - 1) * this.pageSize + this.recordFetchSize;

        this.totalRecordSize = this.wrapperData.totalRecordSize;
        this.totalPages = Math.ceil(this.totalRecordSize / this.pageSize);
        this.paginationData = {
            'pageSize': this.pageSize, 'totalPages': this.totalPages,
            'totalRecords': this.totalRecordSize, 'start': this.start, 'end': this.end
        };
    }

    handlePaginationButtonAction(event) {
        this.currentPageNumber = event.detail.currentPageNumber;
        this.pageSize = event.detail.pageSize;
        this.totalPages = event.detail.totalPages;
        this.handleFetchAllRecord();
    }


    // lightning-card title
    get subTitle() {
        return `Accounts (${this.totalRecordSize})`;
    }


    // Navigate to View Record
    navigateToRecordPage() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.accountId,
                actionName: 'view'
            }
        });
    }

    handleNewAccountButton() {
        this.modalData.modalHeader = 'New Account';
        this.modalData.recordActionType = 'new';
        this.modalData.accountRecord = {};
        this.isModalOpen = true;
        this.isNew = true;
    }

    handleRowAction(event) {
        const rowAction = event.detail.value;
        const index = event.currentTarget.dataset.id;
        const row = this.accountList[index];
        this.accountId = row.acctId;
        this.accountName = row.acctName;
        switch (rowAction) {
            case 'view':
                this.navigateToRecordPage();
                break;

            case 'edit':
                this.modalData.modalHeader = 'Edit ' + this.accountName;
                this.modalData.recordActionType = 'edit';
                this.modalData.accountRecord = row;
                this.isModalOpen = true;
                this.isNew = false;
                break;

            case 'delete':
                this.modalData.modalHeader = 'Delete Account';
                this.modalData.recordActionType = 'delete';
                this.isModalOpen = true;
                break;

        }
    }

    async handleModalButtonAction(event) {
        this.isUpsert = false;
        const modalButtonAction = event.detail.modalButtonAction;
        if (modalButtonAction === 'delete') {
            this.isModalOpen = false;
            await this.handleDeleteRecord();
        }

        else if (modalButtonAction === 'save' || modalButtonAction === 'saveAndNew') {
            const inputRecord = event.detail.inputRecord;
            await this.handleUpsertRecord(JSON.stringify(inputRecord), inputRecord.acctName);

            if (modalButtonAction === 'saveAndNew' && this.isUpsert === true) {
                this.handleNewAccountButton();
            }
        }

        else if (modalButtonAction === 'cancel') {
            this.isModalOpen = false;
        }
    }


    // delete record functionality
    async handleDeleteRecord() {
        await deleteAccountRecord({ acctId: this.accountId })
            .then(result => {
                if (result) {
                    this.handleShowToast("", 'Account \"' + this.accountName + '\" was deleted.', "success", "dismissible");
                    this.handleFetchAllRecord();
                }
            })
            .catch(error => {
                const message = reduceErrors(error).join(', ');
                this.handleShowToast("Error deleting record", message, "error", "pester");
            })
    }

    // upsert record functionality
    async handleUpsertRecord(inputRecord, acctName) {
        await upsertAccountRecord({ accountRecord: inputRecord, isNew: this.isNew })
            .then(result => {
                this.isModalOpen = false;
                const message = result;
                this.handleShowToast('', 'Account \"' + acctName + '\" was ' + message, 'success', 'dismissible');
                this.handleFetchAllRecord();
                this.isUpsert = true;
            })
            .catch(error => {
                this.isUpsert = false;
                const message = reduceErrors(error).join(', ');
                this.handleShowToast("", message, "error", "pester");
            })
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
}