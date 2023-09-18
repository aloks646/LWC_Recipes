public with sharing class ExecuteBatchApexInLwcCtrl {
    
    @AuraEnabled(cacheable=true)
    public static List<ApexClass> fetchAllBatchApex(){
        List<ApexClass> batchApexList = new List<ApexClass>();
        try{
            List<ApexClass> lstApexClasses = [Select Id, Name, Body From ApexClass Where Name!='ExecuteBatchApexInLwcCtrl' 
                                              WITH SECURITY_ENFORCED ORDER BY Name ASC LIMIT 49999];
            
            for(ApexClass ac: lstApexClasses){
                if(ac.Body.contains('Database.Batchable') && ac.Body.contains('start(Database.BatchableContext ') &&
                   ac.Body.contains('void execute(Database.BatchableContext ') && ac.Body.contains('void finish(Database.BatchableContext ')){
                       ApexClass data = new ApexClass();
                       data.Id = ac.Id;
                       data.Name = ac.Name;
                       batchApexList.add(data); 
                       
                   }
            }
            
            if(!batchApexList.isEmpty()){
                return batchApexList; 
            }
            return null;
        }
        catch(Exception e){
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    
    @AuraEnabled
    public static string executeBatchApex(String className, Integer chunkSize){
        try {
            Type batchInstance = Type.forName(className);
            Id batchJobId = Database.executeBatch((Database.Batchable<sObject>)batchInstance.newInstance(), chunkSize);
            return batchJobId;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }   
    
    @AuraEnabled
    public static List<AsyncApexJob> getJobDetails(String jobId){
        try {
            List<AsyncApexJob> asyncJobList = [SELECT Id, Status, JobItemsProcessed, TotalJobItems,
                                               NumberOfErrors FROM AsyncApexJob Where Id =: jobId];
            return asyncJobList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}