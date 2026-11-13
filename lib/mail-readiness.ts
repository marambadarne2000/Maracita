export function mailReadiness(sender?:string|null,provider?:string){
 if(provider==='gmail'&&sender)return {mode:'gmail',publicRecoveryReady:true};
 const domain=sender?.trim().toLowerCase().split('@').at(-1);
 if(!domain)return {mode:'not_configured',publicRecoveryReady:false};
 if(domain==='resend.dev')return {mode:'test_only',publicRecoveryReady:false};
 if(['gmail.com','googlemail.com','outlook.com','hotmail.com','yahoo.com','icloud.com','live.com'].includes(domain))return {mode:'domain_required',publicRecoveryReady:false};
 return {mode:'custom_domain',publicRecoveryReady:null};
}
