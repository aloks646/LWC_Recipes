public with sharing class CRUDwithApexInLwc {
    @AuraEnabled
    public static AccountWrapper viewAllAccount(Integer pageSize, Integer currentPageNumber){
        AccountWrapper accountWrap = new AccountWrapper();
        List<AccountWrapper> wrapList = new List<AccountWrapper>();
        
        Integer offset = (currentPageNumber - 1)*pageSize;
        try {
            List<Account> accountList = [Select Id, Name, Phone, Rating, Industry, Email__c, AccountNumber From Account 
                                         WITH SECURITY_ENFORCED ORDER BY Name ASC LIMIT:pageSize OFFSET:offset];
            
            Integer totalRecordSize = [Select count() From Account WITH SECURITY_ENFORCED];
            
            if(totalRecordSize > 0){
                for(Account acct: accountList){
                    wrapList.add(new AccountWrapper(acct));
                }
                accountWrap.accountList = wrapList;
                accountWrap.totalRecordSize = totalRecordSize;
                return accountWrap;
            }
            return null;
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    //upsert record
    @AuraEnabled
    public static String upsertAccountRecord(String accountRecord, Boolean isNew){
        AccountWrapper acctWrapper;
        try {
            acctWrapper = (AccountWrapper) JSON.deserialize(accountRecord, AccountWrapper.class);
            Account acct = new Account();
            acct.Id = isNew ? null : acctWrapper.acctId;
            acct.Name = acctWrapper.acctName;
            acct.Phone = acctWrapper.acctPhone;
            acct.Rating = acctWrapper.acctRating;
            acct.Industry = acctWrapper.acctIndustry;
            acct.Email__c = acctWrapper.acctEmail;
            acct.AccountNumber = acctWrapper.acctAccountNumber;
            upsert acct;
            return isNew ? 'created.' : 'saved.';
        }  
        catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        } 
    }
    
    
    // delete record
    @AuraEnabled
    public static Boolean deleteAccountRecord(String acctId){
        try {
            delete new Account(Id = acctId);
            return true;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    
    // to fetch Account's picklist fields option
    @AuraEnabled(cacheable=true)
    public static WrapperClass getPicklistFieldValue(){
        WrapperClass wClass = new WrapperClass();
        wClass.ratingOptions = fetchPicklistValue('Rating');
        wClass.industryOptions = fetchPicklistValue('Industry');
        return wClass;
    }
    
    private static Map<String, String> fetchPicklistValue(String picklistFieldName){
        Map<String, String> options = new Map<String, String>();
        Schema.DescribeFieldResult fieldResult = schema.getGlobalDescribe().get('Account').getDescribe().fields.getMap().get(picklistFieldName).getDescribe();
        List<Schema.PicklistEntry> pValues = fieldResult.getPicklistValues();
        for (Schema.PicklistEntry p: pValues) {
            options.put(p.getValue(), p.getLabel());
        }
        return options;
    }
    
    
    // Account Wrapper
    public with sharing class AccountWrapper{
        @AuraEnabled
        public String acctId { get; set; }
        @AuraEnabled
        public String acctName { get; set; }
        @AuraEnabled
        public String acctPhone { get; set; }
        @AuraEnabled
        public String acctRating { get; set; }
        @AuraEnabled
        public String acctIndustry { get; set; }
        @AuraEnabled
        public String acctEmail { get; set; }
        @AuraEnabled
        public String acctAccountNumber { get; set; }
        
        @AuraEnabled
        public Integer totalRecordSize { get; set; }
        @AuraEnabled
        public List<AccountWrapper> accountList { get; set; }
        
        public AccountWrapper(Account acct){
            this.acctId = acct.Id;
            this.acctName = acct.Name;
            this.acctPhone = acct.Phone;
            this.acctRating = acct.Rating;
            this.acctIndustry = acct.Industry;
            this.acctEmail = acct.Email__c;
        }
        public AccountWrapper(){}
    }
    
    // wrapper class for picklistfield
    public with sharing class WrapperClass{
        @AuraEnabled
        public Map<String, String> ratingOptions {get; set;}
        @AuraEnabled
        public Map<String, String> industryOptions {get; set;}
    }  
}