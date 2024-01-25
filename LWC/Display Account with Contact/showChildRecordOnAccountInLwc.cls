public with sharing class showChildRecordOnAccountInLwc {

    @AuraEnabled
    public static AccountWrapper fetchAccountWithContact(Integer pageSize, Integer currentPageNumber){
        AccountWrapper acctWrapper = new AccountWrapper();
        List<AccountWrapper> acctListWrapper = new List<AccountWrapper>();
        Integer offset = (currentPageNumber - 1) * pageSize;
        try {
            List<Account> accountList = [Select Id, Name, Phone, Industry, Email__c, (Select Id, AccountId, FirstName, LastName, Phone From Contacts) 
                                         From Account WITH SECURITY_ENFORCED ORDER BY Name LIMIT:pageSize OFFSET:offset];
            Integer countTotal = [Select count() From Account WITH SECURITY_ENFORCED];
            Integer counter = offset;
            for(Account acct: accountList){
                counter++;
                acctListWrapper.add(new AccountWrapper(acct, counter));
            }
            acctWrapper.countTotal = countTotal;
            acctWrapper.acctListWrapper = acctListWrapper;
            return acctWrapper;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    public class AccountWrapper{
        @AuraEnabled
        public Integer SrNo {get; set;}
        @AuraEnabled
        public String acctId {get; set;}
        @AuraEnabled
        public String acctName {get; set;}
        @AuraEnabled
        public String acctPhone {get; set;}
        @AuraEnabled
        public String acctIndustry {get; set;}
        @AuraEnabled
        public String acctEmail {get; set;}
        @AuraEnabled
        public Integer countTotal {get; set;}
        @AuraEnabled
        public List<AccountWrapper> acctListWrapper { get; set; }
        @AuraEnabled
        public Boolean hasNoContact {get; set;}
        @AuraEnabled
        public List<ContactWrapper> contListWrapper {get; set;}
        Integer contCounter = 0;
        public AccountWrapper(){}
        public AccountWrapper(Account acct, Integer counter){
            this.SrNo = counter;
            this.acctId = acct.Id;
            this.acctName = acct.Name;
            this.acctPhone = acct.Phone;
            this.acctIndustry = acct.Industry;
            this.acctEmail = acct.Email__c;
            if(acct.Contacts.size() > 0){
                contListWrapper = new List<ContactWrapper>();
                this.hasNoContact = false;
                this.contCounter = 0;
                for(Contact cont: acct.Contacts){
                    this.contCounter++;
                    this.contListWrapper.add(new ContactWrapper(cont, this.contCounter));
                }
            }
            else{
               this.hasNoContact = true; 
            }
        }
    }
    
    public class ContactWrapper{
        @AuraEnabled
        public Integer SrNo {get; set;}
        @AuraEnabled
        public String contId {get; set;}
        @AuraEnabled
        public String contAccountId {get; set;}
        @AuraEnabled
        public String contFirstName {get; set;}
        @AuraEnabled
        public String contLastName {get; set;}
        @AuraEnabled
        public String contPhone {get; set;}
        
        public ContactWrapper(Contact cont, Integer counter){
            this.SrNo = counter;
            this.contId = cont.Id;
            this.contAccountId = cont.AccountId;
            this.contFirstName = cont.FirstName;
            this.contLastName = cont.LastName;
            this.contPhone = cont.Phone;      
        }
    }
}