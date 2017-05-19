import { Injectable } from '@angular/core';
import { Response, Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';
import 'rxjs/add/operator/map';
import { HttpService } from '../../services/http.service';
import { TransactionalInformation } from '../../entities/transactionalinformation.entity'
import { IEnumerableResponse } from '../../entities/IEnumerableResponse.Entity'
import { UrlBuilderService } from '../../services/urlbuilder.service';
import { Headers, RequestOptions, Request, RequestMethod } from '@angular/http';
import { UUID } from 'angular2-uuid';
export declare enum ListOptions {
    All,
    MatchAssetId,
    MatchEntityId
};

@Injectable()
export class AzureMediaService {
    //#region Private Properties

    private baseUrl: string ;
    private access_tocken: string;
    private client_secret: string;
    private client_id: string;
    private scope: string = "urn:WindowsAzureMediaServices";
    private token_expiry: Date;
    private headers : Headers 
    private mediaProcessorId: string;
     
    //#endregion

    //#region Constructor

    constructor(private httpService: Http  , private urlBuilderService: UrlBuilderService) {
    }

    //#endregion

    //#region public Methods
    //https://docs.microsoft.com/en-us/azure/media-services/media-services-rest-connect-programmatically
    public setAcessTocken()  {
        let acsUrl: string = "https://wamsprodglobal001acs.accesscontrol.windows.net/v2/OAuth2-13";
        let body = {
         "grant_type": "client_credentials" ,
         "client_id": encodeURIComponent(this.client_id) ,
         "client_secret": encodeURIComponent(this.client_secret) ,
         "scope": encodeURIComponent(this.scope)
        };
       
        let headers = new Headers({
            'Content-Type': 'application/x-www-form-urlencoded',
            "Expect": "100-continue"
        });
      
        let options = new RequestOptions({ headers: headers });

        
        this.httpService.post(acsUrl, body, options).subscribe((response) => {
            if (response.ok) {
                var result = JSON.parse(response.json());
                var now = new Date();
                this.access_tocken = 'Bearer ' + result.acces_tocken;
                now.setSeconds(now.getSeconds() + Number(result.expires_in))
                this.token_expiry = now;
                this.headers =  new Headers({
                    "Content-Type": "application/json;odata=verbose",
                    "Accept": "application/json;odata=verbose",
                    "DataServiceVersion": "3.0",
                    "MaxDataServiceVersion": "3.0",
                    "x-ms-version": "2.11",
                    "Authorization": this.access_tocken

                });
            }
        }); 

    }

    public  setRedirectURL(accessToken : string) {

        let amsUri: string = "https://media.windows.net/";
        let headers = new Headers({
            "Accept": "application/json",
            "Authorization": accessToken,
            "x-ms-version": "2.11"
        });
       
        let options : RequestOptions = new RequestOptions({ headers: headers });
        this.httpService.get(amsUri, options).subscribe((response) => {
            if (response.status == 301) {
                this.baseUrl = response.headers.get('location');
            }
        });

        }
    //https://docs.microsoft.com/en-gb/rest/api/media/operations/mediaprocessor
    public getMediaProcessors() {
        let options: RequestOptions = new RequestOptions({ headers: this.headers });
        this.httpService.get(this.baseUrl + "MediaProcessors", options).subscribe((response) => {
            if (response.ok) {
                var result = JSON.parse(response.json());
                this.mediaProcessorId = result;
                return result;
            }
        });
    }
    //https://docs.microsoft.com/en-gb/rest/api/media/operations/asset

    public createAsset() {
        let body = { "Name": "ASSET" + UUID.UUID() };
        let options: RequestOptions = new RequestOptions({ headers: this.headers });
        this.httpService.post(this.baseUrl + "Assets", body, options).subscribe((response) => {
            var asset = JSON.parse(response.json());
            return asset.Id;
        });

    }
    public listAsset(assetId: string) {
       
            let options: RequestOptions = new RequestOptions({ headers: this.headers });
            this.httpService.get(this.baseUrl + "Assets(*" + assetId + ")*", options).subscribe((response) => {
                var asset = JSON.parse(response.json());
                return asset;
            });

    }

    public mergeAssset(assetId: string,data :any) {
       
        // MERGE
        let options: RequestOptions = new RequestOptions({ headers: this.headers,method:"MERGE",body: JSON.stringify(data)});
        this.httpService.request(this.baseUrl + "Assets(" + assetId + ")", options).subscribe((response) => {
            var asset = JSON.parse(response.json());
            return asset;
        });

    }

    public deleteAsset(assetId: string) {
       
        let options: RequestOptions = new RequestOptions({ headers: this.headers });
        this.httpService.delete(this.baseUrl + "Assets(" + assetId + ")", options).subscribe((response) => {
            var asset = JSON.parse(response.json());
            return asset;
        });
    }


    //https://docs.microsoft.com/en-gb/rest/api/media/operations/assetfile

    public listAssetFiles(assetId: string, assetFileId: string, fileOptions: ListOptions) {
       
        let options: RequestOptions = new RequestOptions({ headers: this.headers });
        if (fileOptions == ListOptions.All) {
            this.httpService.get(this.baseUrl + "Files", options).subscribe((response) => {
                var asset = JSON.parse(response.json());
                return asset;
            });
        } else if (fileOptions == ListOptions.MatchAssetId) {
            this.httpService.get(this.baseUrl + "/Assets(" + assetId + ")/Files", options).subscribe((response) => {
                var asset = JSON.parse(response.json());
                return asset;
            });
        } else if (fileOptions == ListOptions.MatchEntityId) {
            this.httpService.get(this.baseUrl + "/Files(*" + assetFileId + ")", options).subscribe((response) => {
                var asset = JSON.parse(response.json());
                return asset;
            });
        }

    }


    public updateAsssetFile(fileId: string, data: any) {
       
        // MERGE
        let options: RequestOptions = new RequestOptions({ headers: this.headers, method: "MERGE", body: JSON.stringify(data) });
        this.httpService.request(this.baseUrl + "Files(" + fileId + ")", options).subscribe((response) => {
            var asset = JSON.parse(response.json());
            return asset;
        });

    }

    //https://docs.microsoft.com/en-gb/rest/api/media/operations/accesspolicy

    public  createAccessPolicy(data: any) {
       

        let options: RequestOptions = new RequestOptions({ headers: this.headers, body: JSON.stringify(data) });
        this.httpService.post(this.baseUrl + "AccessPolicies", options).subscribe((response) => {
            var policy = JSON.parse(response.json());
            return policy;
        });
    }

    public listAccessPolicies(assetId: string, policyId: string, listOptions: ListOptions) {
        
        let options: RequestOptions = new RequestOptions({ headers: this.headers });
        if (listOptions == ListOptions.All) {
            this.httpService.get(this.baseUrl + "AccessPolicies", options).subscribe((response) => {
                var asset = JSON.parse(response.json());
                return asset;
            });
        } else if (listOptions == ListOptions.MatchAssetId) {
            this.httpService.get(this.baseUrl + "/Assets(" + assetId + ")/AccessPolicies", options).subscribe((response) => {
                var asset = JSON.parse(response.json());
                return asset;
            });
        } else if (listOptions == ListOptions.MatchEntityId) {
            this.httpService.get(this.baseUrl + "/AccessPolicies(*" + policyId + ")", options).subscribe((response) => {
                var asset = JSON.parse(response.json());
                return asset;
            });
        }

    }

    public deleteAccessPolicy(policyId : string) {
        

        let options: RequestOptions = new RequestOptions({ headers: this.headers });
        this.httpService.delete(this.baseUrl + "AccessPolicies(*" + policyId + "*)", options).subscribe((response) => {
            var asset = JSON.parse(response.json());
            return asset;
        });
    }

    //https://docs.microsoft.com/en-gb/rest/api/media/operations/locator

    public createLocator(data: any) {
       
     
        let options: RequestOptions = new RequestOptions({ headers: this.headers,body :data });
        this.httpService.post(this.baseUrl + "Locators",  options).subscribe((response) => {
            var asset = JSON.parse(response.json());
            return asset.Id;
        });
    }


    public listLocators(assetId:string,locatorId:string,listOptions:ListOptions) {
        
        let options: RequestOptions = new RequestOptions({ headers: this.headers });
        if (listOptions == ListOptions.All) {
            this.httpService.get(this.baseUrl + "Locators", options).subscribe((response) => {
                var asset = JSON.parse(response.json());
                return asset;
            });
        } else if (listOptions == ListOptions.MatchAssetId) {
            this.httpService.get(this.baseUrl + "/Assets(" + assetId + ")/Locators", options).subscribe((response) => {
                var asset = JSON.parse(response.json());
                return asset;
            });
        } else if (listOptions == ListOptions.MatchEntityId) {
            this.httpService.get(this.baseUrl + "/Locators(*" + locatorId + ")", options).subscribe((response) => {
                var asset = JSON.parse(response.json());
                return asset;
            });
        }
    }

    public updateLocators(locatorId: string, data: any) {
        
        // MERGE
        let options: RequestOptions = new RequestOptions({ headers: this.headers, method: "MERGE", body: JSON.stringify(data) });
        this.httpService.request(this.baseUrl + "Locators(" + locatorId + ")", options).subscribe((response) => {
            var asset = JSON.parse(response.json());
            return asset;
        });

    }

    public deleteLocator(locatorId: string) {
         let options: RequestOptions = new RequestOptions({ headers: this.headers });
        this.httpService.delete(this.baseUrl + "Locators(*" + locatorId + "*)", options).subscribe((response) => {
            var asset = JSON.parse(response.json());
            return asset;
        });
   
    }


    //https://docs.microsoft.com/en-gb/rest/api/media/operations/job
    public createJob(assetId : string, encoder: any) {

        let url: string = this.baseUrl + "Assets('" + encodeURIComponent(assetId) + "')";
        let data = {
            'Name': 'EncodeVideo-' + UUID.UUID(),
            'InputMediaAssets': [{ '__metadata': { 'uri': url } }],
            'Tasks': [{
                'Configuration': encoder,
                'MediaProcessorId': this.mediaProcessorId,
                'TaskBody': "<?xml version=\"1.0\" encoding=\"utf-8\"?><taskBody><inputAsset>JobInputAsset(0)</inputAsset><outputAsset>JobOutputAsset(0)</outputAsset></taskBody>"
            }]
        };

        let options: RequestOptions = new RequestOptions({ headers: this.headers, body: data});
        this.httpService.post(this.baseUrl + "Jobs", options).subscribe((response) => {
            var result = JSON.parse(response.json());
            return result.Id;
        });
    }

    public listJobs( jobId: string, listOptions: ListOptions) {

        let options: RequestOptions = new RequestOptions({ headers: this.headers });
        if (listOptions == ListOptions.All) {
            this.httpService.get(this.baseUrl + "Jobs", options).subscribe((response) => {
                var asset = JSON.parse(response.json());
                return asset;
            });
        } else if (listOptions == ListOptions.MatchEntityId) {
            this.httpService.get(this.baseUrl + "/Jobs(*" + encodeURIComponent(jobId) + ")", options).subscribe((response) => {
                var asset = JSON.parse(response.json());
                return asset;
            });
        }
    }

    public deleteJob(jobId: string) {
        let options: RequestOptions = new RequestOptions({ headers: this.headers });
        this.httpService.delete(this.baseUrl + "Jobs(*" + encodeURIComponent(jobId) + "*)", options).subscribe((response) => {
            var asset = JSON.parse(response.json());
            return asset;
        });

    }

    public cancelJob(jobId: string) {
        let options: RequestOptions = new RequestOptions({ headers: this.headers });
        this.httpService.get(this.baseUrl + "CancelJob?jobid="+encodeURIComponent(jobId), options).subscribe((response) => {
            var result = JSON.parse(response.json());
            return result;
        });
    }


    public getEncodeStatus(jobId: string) {
        let options: RequestOptions = new RequestOptions({ headers: this.headers });
        this.httpService.get(this.baseUrl + "Jobs('"+encodeURIComponent(jobId)+"')/State", options).subscribe((response) => {
            var result = JSON.parse(response.json());
            return result;
        });
    }

    public getOutputAsset(jobId: string) {
        let options: RequestOptions = new RequestOptions({ headers: this.headers });
        this.httpService.get(this.baseUrl + "Jobs('" + encodeURIComponent(jobId) + "')/OutputMediaAssets", options).subscribe((response) => {
            var result = JSON.parse(response.json());
            return result;
        });
    }


    //https://docs.microsoft.com/en-gb/rest/api/media/operations/notificationendpoint

    public listNotificationEndpoints() {
        let options: RequestOptions = new RequestOptions({ headers: this.headers });
        this.httpService.get(this.baseUrl + "NotificationEndPoints", options).subscribe((response) => {
            var result = JSON.parse(response.json());
            return result;
        });
    }


    //Input format to create end point

    //<?xml version= "1.0" encoding= "utf-8" ?>
    //    <entry xmlns="http://www.w3.org/2005/Atom" xmlns: d = "http://schemas.microsoft.com/ado/2007/08/dataservices" xmlns: m = "http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" >
    //        <id />
    //        < title /> 
    //        <updated>2013 - 04 - 21T21: 44:14Z< /updated>
    //            < author > <name / > </author>
    //            <content type="application/xml" >
    //              <m:properties >
    //                <d:EndPointAddress > endpointpueu1 < /d:EndPointAddress>
    //                <d:EndPointType m: type = "Edm.Int32" > 1 < /d:EndPointType >
    //                <d:Id m: null = "true" />
    //                    <d:Name > EndPointName1 < /d:Name>
    //              </m:properties >
    //        </content>
    //     </entry>  
    public createNotificationEndpoint(data: any) {
        let options: RequestOptions = new RequestOptions({ headers: this.headers, body: data });
        this.httpService.post(this.baseUrl + "NotificationEndPoints", options).subscribe((response) => {
            var result = JSON.parse(response.json());
            return result;
        });
        
    }

    public updateNotificationEndpoint(endPointId: string, data: any) {

        // MERGE
        let options: RequestOptions = new RequestOptions({ headers: this.headers, method: "MERGE", body: data });
        this.httpService.request(this.baseUrl + "NotificationEndPoints(" + encodeURIComponent(endPointId) + ")", options).subscribe((response) => {
            var result = JSON.parse(response.json());
            return result;
        });

    }

//Outputformat

// <?xml version= "1.0" encoding= "utf-8" ?>
//    <entry xml: base = "https://media.windows.net/api/"
//     xmlns = "http://www.w3.org/2005/Atom" xmlns: d = "http://schemas.microsoft.com/ado/2007/08/dataservices"
//      xmlns: m = "http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" >
//    <id>https://media.windows.net/api/NotificationEndPoints('nb%3Anepid%3AUUID%3A6286704e-e69f-454e-80e0-7fda53ce7dba')</id>
//<category term="Microsoft.Cloud.Media.Vod.Rest.Data.Models.NotificationEndPoint" scheme= "http://schemas.microsoft.com/ado/2007/08/dataservices/scheme" />
//    <link rel="edit" title= "NotificationEndPoint" href= "NotificationEndPoints('nb%3Anepid%3AUUID%3A6286704e-e69f-454e-80e0-7fda53ce7dba')" />
//        <title />
//        < updated > 2013 - 08 - 02T06: 25:33Z< /updated>
//            < author > <name /></author>
//            <content type="application/xml" >
//                <m:properties >
//                    <d:Id > nb:nepid: UUID: 6286704e-e69f - 454e-80e0- 7fda53ce7dba< /d:Id>
//                     < d:Name > 62abde48- 420f- 4f76- 9ca4- 9ba1d8852f38< /d:Name>
//                     < d:Created m: type = "Edm.DateTime" > 2013 - 08 - 02T06: 25:02.48< /d:Created>
//                     < d:EndPointAddress > b71b6ac6 - e598 - 4fdf- b5cb - e8494cb955ef < /d:EndPointAddress>
//                     < d:EndPointType m: type = "Edm.Int32" > 1 < /d:EndPointType>
//                 < /m:properties>
//             < /content>
//     < /entry>

    public getNotificationEndpoint(endPointId: string) {
        let options: RequestOptions = new RequestOptions({ headers: this.headers });
        this.httpService.get(this.baseUrl + "NotificationEndPoints('" + encodeURIComponent(endPointId) + "')", options).subscribe((response) => {
            var result = JSON.parse(response.json());
            return result;
        });
    }

    public deleteNotificationEndpoint(endPointId: string) {
        let options: RequestOptions = new RequestOptions({ headers: this.headers });
        this.httpService.delete(this.baseUrl + "NotificationEndPoints('" + encodeURIComponent(endPointId) + "')", options).subscribe((response) => {
            var result = JSON.parse(response.json());
            return result;
        });

    }

    //#endregion
}