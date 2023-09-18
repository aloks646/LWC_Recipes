public with sharing class FetchMetadataInfoCtrlInLwc {
    
    @AuraEnabled(cacheable=true)
    public static MetadataWrapper fetchAllMetadataName(){
        MetadataWrapper mWrapper = new MetadataWrapper();
        List<MetadataWrapper> mWrapperList = new List<MetadataWrapper>();
        //List<String> metadataName = new List<String>{'ApexClass', 'ApexTrigger', 'ApexPage', 'ApexComponent'};
        Map<String, String> metadataMap = new Map<String, String>();
        metadataMap.put('ApexClass', 'Apex Classes');
        metadataMap.put('ApexTrigger', 'Trigger');
        metadataMap.put('ApexPage', 'Visualforce Page');
        metadataMap.put('ApexComponent', 'Visualforce Component');
        
        try{       
            for(String str: metadataMap.keySet()){
                MetadataWrapper result = iterateAllMetadata(str, metadataMap.get(str));
                mWrapperList.add(result);
            }
            
            User usr = [select Id, LocaleSidKey From User Where Id =:UserInfo.getUserId() LIMIT 1];
            mWrapper.userLocale = usr.LocaleSidKey;
            mWrapper.metadataList = mWrapperList;
            return mWrapper;
        }
        catch(Exception e){
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    private static MetadataWrapper iterateAllMetadata(String metadataName, String label){
        try{
            MetadataWrapper mWrapper = new MetadataWrapper();
            String finalQuery = 'Select count() From '+metadataName;
            Integer totalRecords = Database.countQuery((string)finalQuery, AccessLevel.USER_MODE);
            
            mWrapper.metadataLabel = label + ' ('+ totalRecords + ')'; 
            mWrapper.metadataValue = metadataName;
            return mWrapper;
        }
        catch(Exception e){
            throw new AuraHandledException(e.getMessage()); 
        }
    }
    
    @AuraEnabled
    public static MetadataRecordWrapper fetchAllMetadataRecord(String metadataName, String searchKey, Integer currentPageNumber, Integer pageSize){
        MetadataRecordWrapper recordWrapperReturn = new MetadataRecordWrapper();
        List<MetadataRecordWrapper> recordWrapperList = new List<MetadataRecordWrapper>();
        String dynamicQuery = 'SELECT Id, NamespacePrefix, Name, ApiVersion, CreatedDate, CreatedById, LastModifiedDate, LastModifiedById';
        String finalCountQuery = 'Select count() From '+metadataName;
        Integer offset = (currentPageNumber - 1)* pageSize;
        try{
            if(metadataName.equals('ApexClass') || metadataName.equals('ApexTrigger')){
                dynamicQuery+= ', Status, Body'; 
            }
            else if(metadataName.equals('ApexPage') || metadataName.equals('ApexComponent')){
                dynamicQuery+= ', MasterLabel, Markup'; 
            }
            
            dynamicQuery+= ' From '+ metadataName;
            if(String.isNotBlank(searchKey)){
                searchKey = '%' + searchKey + '%';
                dynamicQuery+= ' Where Name Like :searchKey';
                finalCountQuery+= ' Where Name Like :searchKey';
            }
            dynamicQuery+= ' Order by Name ASC Limit :pageSize OFFSET :offset';
                
            List<sObject> recordList = Database.query((String)dynamicQuery, AccessLevel.USER_MODE);
            Integer totalRecords = Database.countQuery((string)finalCountQuery, AccessLevel.USER_MODE);
            Map<String, User> userMap = new Map<String, User>([Select Id, Name From User WITH SECURITY_ENFORCED]);
            for(sObject record: recordList){
                recordWrapperList.add(new MetadataRecordWrapper(record, metadataName, userMap)); 
            }
            recordWrapperReturn.totalRecords = totalRecords;
            recordWrapperReturn.recordList = recordWrapperList;
            return recordWrapperReturn;
        }
        catch(Exception e){
            throw new AuraHandledException(e.getMessage()); 
        }
    }
    
    
    public class MetadataWrapper{
        @AuraEnabled
        public String metadataLabel{get; set;}
        @AuraEnabled
        public String metadataValue{get; set;}
        @AuraEnabled
        public String userLocale {get; set;}
         @AuraEnabled
        public List<MetadataWrapper> metadataList {get; set;}
    }
    
    public class MetadataRecordWrapper{
        @AuraEnabled
        public Integer totalRecords {get; set;}
        @AuraEnabled
        public List<MetadataRecordWrapper> recordList {get; set;}
        
        @AuraEnabled
        public String id {get; set;}
        @AuraEnabled
        public String name {get; set;}
        @AuraEnabled
        public Double apiVersion {get; set;}
        @AuraEnabled
        public String namespace {get; set;}
        @AuraEnabled
        public DateTime createdDate {get; set;}
        @AuraEnabled
        public DateTime lastModifiedDate {get; set;}
        @AuraEnabled
        public String createdBy {get; set;}
        @AuraEnabled
        public String lastModifiedBy {get; set;}
        @AuraEnabled
        public String status {get; set;}
        @AuraEnabled
        public String masterLabel {get; set;}
        @AuraEnabled
        public String body {get; set;}
        @AuraEnabled
        public Boolean isApex {get; set;}
        @AuraEnabled
        public Map<String, Object> test {get; set;}
        
        public MetadataRecordWrapper(){}
        
        public MetadataRecordWrapper(sObject record, String metadataName, Map<String, User> userMap){
            this.id = (String)record.get('Id');
            this.name = (String)record.get('Name');
            this.apiVersion = (Double)record.get('ApiVersion');
            this.namespace = (String)record.get('NamespacePrefix');
            this.createdDate = (DateTime)record.get('CreatedDate');
            this.lastModifiedDate = (DateTime)record.get('LastModifiedDate');
            this.createdBy = (String)(userMap.get((String)record.get('CreatedById'))).get('Name');
            this.lastModifiedBy = (String)(userMap.get((String)record.get('LastModifiedById'))).get('Name');
            if(metadataName.equals('ApexClass') || metadataName.equals('ApexTrigger')){
                this.status = (String)record.get('Status');
                this.body = (String)record.get('Body');
                this.isApex = true;
            }
            else if(metadataName.equals('ApexPage') || metadataName.equals('ApexComponent')){
                this.masterLabel = (String)record.get('MasterLabel');
                this.body = (String)record.get('Markup');
                this.isApex = false;
            }
        }
    }
    
}