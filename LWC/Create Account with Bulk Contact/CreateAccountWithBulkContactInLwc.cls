public with sharing class CreateAccountWithBulkContactInLwc {
    
    @AuraEnabled
    public static String createRecord(String accountRecord, String contactRecord){
        Savepoint sp = Database.setSavepoint();
        try{
            AccountWrapper acctWrapper = (AccountWrapper) JSON.deserialize(accountRecord, AccountWrapper.class);
            List<ContactWrapper> contWrapper = (List<ContactWrapper>) JSON.deserialize(contactRecord, List<ContactWrapper>.class);
            
            // Account Record to insert
            Account acctountTonsert = new Account();
            acctountTonsert.Name = acctWrapper.acctName;
            acctountTonsert.Phone = acctWrapper.acctPhone;
            acctountTonsert.Email__c = acctWrapper.acctEmail;
            insert acctountTonsert;
            
            
            // List<Contact> Record to insert
            List<Contact> contactListToInsert = new List<Contact>();
            for(ContactWrapper cwr: contWrapper){
                Contact cont = new Contact();
                cont.FirstName = cwr.contFirstName;
                cont.LastName = cwr.contLastName;
                cont.Phone = cwr.contPhone;
                cont.Email = cwr.contEmail;
                cont.AccountId = acctountTonsert.Id;
                contactListToInsert.add(cont);
            }
            insert contactListToInsert;
            return acctountTonsert.Id;
        }
        catch(Exception e){
            Database.rollback(sp);
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    public class AccountWrapper{
        @AuraEnabled
        public String acctName { get; set; }
        @AuraEnabled
        public String acctPhone { get; set; }
        @AuraEnabled
        public String acctEmail { get; set; }
    }
    
    public class ContactWrapper{
        @AuraEnabled
        public String contFirstName { get; set; }
        @AuraEnabled
        public String contLastName { get; set; }
        @AuraEnabled
        public String contPhone { get; set; }
        @AuraEnabled
        public String contEmail { get; set; }
    }
    
}