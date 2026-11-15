import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient, QueryObserver, focusManager, onlineManager } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/lib/queryPolicy.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {manualQueryPolicy,identityChanged}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const settle=()=>new Promise(resolve=>setTimeout(resolve,15));
test('session refreshes preserve the current account cache identity',()=>{
 assert.equal(identityChanged('admin-1','admin-1'),false);
 assert.equal(identityChanged('admin-1',null),true);
 assert.equal(identityChanged('admin-1','admin-2'),true);
});
test('data is read once, retained across navigation/focus/reconnect, and fetched again only on explicit refresh',async()=>{
 const client=new QueryClient({defaultOptions:{queries:manualQueryPolicy}});client.mount();let calls=0;
 const options={queryKey:['console','test-records'],queryFn:async()=>{calls++;return [{id:calls}]}};
 const observer=new QueryObserver(client,options);let unsubscribe=observer.subscribe(()=>{});
 try{
 await settle();assert.equal(calls,1);
 focusManager.setFocused(false);focusManager.setFocused(true);
 onlineManager.setOnline(false);onlineManager.setOnline(true);
 await settle();assert.equal(calls,1);
 await client.invalidateQueries({queryKey:['console'],refetchType:'none'});
 unsubscribe();unsubscribe=observer.subscribe(()=>{});
 await settle();assert.equal(calls,1);
 await observer.refetch();assert.equal(calls,2);
 }finally{unsubscribe();client.unmount();client.clear();focusManager.setFocused(undefined);onlineManager.setOnline(true)}
});
