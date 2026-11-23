// Offline smoke test voor auth-gate, cloud-synchronisatie en dossierverwijdering.
// RLS-beveiliging moet daarnaast op een echte Supabase-database getest worden.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

async function testAuthenticatedFlow() {
  const nodes = {};
  const listeners = {};
  const writes = [];
  const deletes = [];
  let loaded = null;
  const user = {id:"b62dc92a-aaac-4e5d-94e1-ef8fe510c123",email:"tester@example.org"};
  function el(id) {
    return nodes[id] ?? (nodes[id]={hidden:false,disabled:false,textContent:"",dataset:{},addEventListener(k,fn){this[k]=fn}});
  }
  const doc = {
    visibilityState:"visible",
    getElementById:el,
    addEventListener(k,fn){listeners[k]=fn;}
  };
  const db = {
    auth: {
      getSession: async()=>({data:{session:{access_token:"test"}}}),
      getUser: async()=>({data:{user}}),
      onAuthStateChange(){},
      signInWithPassword: async()=>({data:{session:{access_token:"test"}},error:null}),
      signUp:async()=>({data:{user},error:null}),
      resetPasswordForEmail:async()=>({error:null}),
      updateUser:async()=>({error:null}),
      signOut: async()=>({error:null})
    },
    from(name){
      assert.equal(name,"groeikompas_dossiers");
      return {
        select(){
          return {eq(k,v) {
            assert.equal(k,"owner_id");
            assert.equal(v,user.id);
            return {order:async()=>({data:[{id:"case-1",name:"MKB Casus",data:{problem:"Marketingvraagstuk"}}],error:null})};
          }};
        },
        upsert(rows,options){
          assert.equal(options.onConflict,"owner_id,id");
          writes.push(...rows);
          return Promise.resolve({error:null});
        },
        delete(){
          const filters={};
          const result={eq(k,v){filters[k]=v;return result;},
            then(resolve){deletes.push(filters);return Promise.resolve({error:null}).then(resolve);}};
          return result;
        }
      };
    }
  };
  const w={
    GROEIKOMPAS_SUPABASE:{url:"https://demo.supabase.co",publishableKey:"sb_publishable_test"},
    supabase:{createClient:(url,key,opts)=>{
      assert.equal(url,"https://demo.supabase.co");
      assert.equal(key,"sb_publishable_test");
      assert.equal(opts.auth.flowType,"pkce");
      return db;
    }},
    location:{origin:"https://preview.vercel.app",pathname:"/",reload(){}},
    addEventListener(){},
    startGroeikompas:(rows,u)=>{loaded={rows,u};}
  };
  const ctx=vm.createContext({window:w,document:doc,Map,Set,Date,JSON,Promise,setTimeout,clearTimeout,alert(){}});
  vm.runInContext(fs.readFileSync("assets/cloud-auth.js","utf8"),ctx);
  await w.GroeikompasCloud.init();
  assert.equal(loaded.rows[0].id,"case-1");
  assert.equal(loaded.u.id,user.id);
  assert.equal(el("authGate").hidden,true);
  assert.equal(el("appShell").hidden,false);

  w.GroeikompasCloud.queueSave({id:"case-1",name:"MKB Casus",data:{problem:"Verbeterde data"}});
  await w.GroeikompasCloud.flushAll();
  assert.equal(writes[0].owner_id,user.id);
  assert.equal(writes[0].data.problem,"Verbeterde data");
  assert.equal(el("cloudStatus").textContent,"Opgeslagen in beveiligde database");

  await w.GroeikompasCloud.deleteCase("case-1");
  assert.equal(deletes[0].owner_id,user.id);
  assert.equal(deletes[0].id,"case-1");
}

async function testNotSignedIn() {
  const nodes={};
  const doc={getElementById(id){return nodes[id]??(nodes[id]={textContent:"",hidden:false,disabled:false,value:"",addEventListener(k,fn){this[k]=fn},reportValidity(){return true}})},
    addEventListener(){}};
  const w={
    GROEIKOMPAS_SUPABASE:{url:"https://demo.supabase.co",publishableKey:"sb_publishable_test"},
    location:{origin:"https://preview.vercel.app",pathname:"/"},
    addEventListener(){},
    supabase:{createClient:()=>({
      auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){},signUp:async()=>({data:{user:{id:"test"}},error:null}),signInWithPassword:async()=>({data:{session:{}},error:null}),resetPasswordForEmail:async()=>({error:null})}
    })},
    startGroeikompas:()=>{throw Error("Unauthenticated app must not render");}
  };
  const ctx=vm.createContext({window:w,document:doc,Map,Set,Date,JSON,Promise,setTimeout,clearTimeout});
  vm.runInContext(fs.readFileSync("assets/cloud-auth.js","utf8"),ctx);
  await w.GroeikompasCloud.init();
  assert.equal(nodes.authGate.hidden,false);
  assert.equal(nodes.appShell.hidden,true);
  assert.equal(nodes.emailAuthForm.hidden,false);
  nodes.toggleAuthMode.click();
  assert.equal(nodes.authSubmit.textContent,"Account aanmaken");
}

(async()=>{
  await testAuthenticatedFlow();
  await testNotSignedIn();
  console.log("PASS: Email signup/login gate and scoped Supabase dossier saves/deletes (offline mocks)");
})().catch(e=>{console.error(e);process.exitCode=1;});
