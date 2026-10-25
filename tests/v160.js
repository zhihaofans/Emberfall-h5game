/* v1.6.0 专项：二维码导出 / 扫码导入 / 压缩存档格式 */
const puppeteer = require('puppeteer-core');
const URL = require('./_env').URL;

(async ()=>{
  const browser = await puppeteer.launch({
    executablePath:require('./_env').CHROMIUM,
    headless:'new', args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']
  });
  const page = await browser.newPage();
  await page.setViewport({width:390,height:844});
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  await page.goto(URL, {waitUntil:'networkidle0'});
  await new Promise(r=>setTimeout(r,600));

  let pass=0, fail=0;
  const ok=(c,m)=>{ if(c){pass++;console.log('  ✅',m)} else {fail++;console.log('  ❌',m)} };

  console.log('== 1. 内联库加载 ==');
  const libs = await page.evaluate(()=>({qrcode:typeof qrcode, lz:typeof LZString, jsqr:typeof jsQR}));
  ok(libs.qrcode==='function', 'qrcode 生成库已加载');
  ok(libs.lz==='object'||libs.lz==='function', 'LZString 已加载');
  ok(lib_ok(libs.jsqr), 'jsQR 已加载 ('+libs.jsqr+')');

  console.log('== 2. 压缩存档格式 EMQR1 ==');
  const qr = await page.evaluate(()=>{
    G.day=42;
    const c=exportQRCode();
    const back=LZString.decompressFromBase64(c.slice(6));
    const data=JSON.parse(back);
    return {prefix:c.slice(0,6), len:c.length, ok:data.tag==='EMBER'&&data.g.day===42, rawLen:serialize().length, jsonLen:back.length};
  });
  ok(qr.prefix==='EMQR1:', 'QR 代码前缀 EMQR1:');
  ok(qr.ok, 'LZ 压缩/解压往返一致 (第'+qr.jsonLen+'字符JSON)');
  ok(qr.len < qr.rawLen, `压缩有效 (${qr.rawLen} → ${qr.len})`);

  console.log('== 3. 导出页二维码渲染 ==');
  await page.evaluate(()=>openExport());
  await new Promise(r=>setTimeout(r,400));
  const qrUI = await page.evaluate(()=>{
    const box=document.getElementById('qrCanvasBox');
    const cv=box?box.querySelector('canvas'):null;
    return {hasBox:!!box, hasCanvas:!!cv, w:cv?cv.width:0, hasCopy:!!document.getElementById('exportArea'), txt:document.getElementById('exportArea').value.slice(0,6)};
  });
  ok(qrUI.hasCanvas && qrUI.w>100, `二维码 canvas 已渲染 (${qrUI.w}px)`);
  ok(qrUI.txt==='EMBER:', '复制/下载仍用完整代码');
  await page.evaluate(()=>closeModal());

  console.log('== 4. 统一解析三种格式 ==');
  const parseTest = await page.evaluate(()=>{
    G.day=10;
    const ember=exportCode();
    const emqr=exportQRCode();
    const r1=parseImportCode(ember);
    const r2=parseImportCode(emqr);
    const r3=parseImportCode('EMBER1:'+toB64(JSON.stringify({tag:'EMBER1',v:1,g:{day:3,hp:50}})));
    const r4=parseImportCode('garbage');
    return {r1:!!r1&&r1.g.day===10, r2:!!r2&&r2.g.day===10, r3:!!r3&&r3.g.day===3, r4:r4===null};
  });
  ok(parseTest.r1, 'EMBER: 解析成功');
  ok(parseTest.r2, 'EMQR1: 解析成功');
  ok(parseTest.r3, 'EMBER1: 旧版解析成功');
  ok(parseTest.r4, '无效内容返回 null');

  console.log('== 5. 扫码导入流程（无摄像头环境安全降级）==');
  const scanUI = await page.evaluate(()=>{
    openImport();
    const hasBtn=[...document.querySelectorAll('#modalcard .mbtn')].some(b=>b.textContent.includes('扫码导入'));
    closeModal();
    return hasBtn;
  });
  ok(scanUI, '导入页含扫码按钮');
  // 无摄像头环境调用 startScanner 应安全降级不崩溃
  const safe = await page.evaluate(()=>{ try{ startScanner(); return true }catch(e){ return 'err:'+e.message } });
  ok(safe===true, 'startScanner 在无摄像头环境安全返回');
  // 模拟扫码结果导入
  const simScan = await page.evaluate(()=>{
    G.day=33; save();
    const code=exportQRCode();
    const parsed=parseImportCode(code);
    if(!parsed) return {ok:false};
    G=parsed.g; logBuffer=[];
    localStorage.setItem(SAVE_KEY, serialize());
    return {ok:G.day===33, day:G.day};
  });
  ok(simScan.ok, '模拟扫码→导入成功 (第'+simScan.day+'天)');
  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|').slice(0,200):''));
  console.log('\n======== v1.6.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);

  function lib_ok(t){ return t==='function'||t==='object' }
})();
