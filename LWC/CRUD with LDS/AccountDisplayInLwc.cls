public with sharing class AccountDisplayInLwc {
    @AuraEnabled(cacheable=true)
    public static List<Account> fetchAccount(){
        try {
            List<Account> acctList = [Select Id, Name, Phone, Rating, Industry, Email__c, AccountNumber From Account WITH SECURITY_ENFORCED ORDER BY Name];
            if(!acctList.isEmpty()) {
                return acctList;
            }
            return null;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}