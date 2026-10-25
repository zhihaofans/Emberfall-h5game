/* v1.7.0 专项：自定义数量 / 批量出售 / 确认对话框 */
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
  await new Promise(r=>setTimeout(r,400));

  let pass=0, fail=0;
  const ok=(c,m)=>{ if(c){pass++;console.log('  ✅',m)} else {fail++;console.log('  ❌',m)} };

  console.log('== 1. 出售对话框渲染 ==');
  const ui = await page.evaluate(()=>{
    G.res.wood=25; G.gold=0;
    askSell('wood');
    const inp=document.getElementById('sellNum');
    return {
      open:document.getElementById('modal').classList.contains('show'),
      hasInput:!!inp,
      val:inp?inp.value:'',
      gain:document.getElementById('sellGain').textContent,
      txt:document.getElementById('modalcard').textContent,
    };
  });
  ok(ui.open && ui.hasInput && ui.val==='1', '对话框打开且数量默认 1');
  ok(ui.txt.includes('木材') && ui.txt.includes('库存 25') && ui.txt.includes('单价 1'), '显示资源名/库存/单价');
  ok(ui.gain==='1', '金币预览初始 1');

  console.log('== 2. 自定义数量 & 实时预览 ==');
  const preview = await page.evaluate(()=>{
    document.getElementById('sellNum').value=10;
    updateSellPreview();
    return {gain:document.getElementById('sellGain').textContent, val:document.getElementById('sellNum').value};
  });
  ok(preview.gain==='10' && preview.val==='10', `输入10 → 预览10金币 (${preview.gain})`);
  // 超量 clamp 到库存
  const clamp = await page.evaluate(()=>{
    document.getElementById('sellNum').value=999;
    updateSellPreview();
    return {val:document.getElementById('sellNum').value, gain:document.getElementById('sellGain').textContent};
  });
  ok(clamp.val==='25' && clamp.gain==='25', `超量 clamp 到库存25 (实际${clamp.val})`);

  console.log('== 3. 全部批量出售 ==');
  const all = await page.evaluate(()=>{
    setSellQty('all');
    return {val:document.getElementById('sellNum').value, gain:document.getElementById('sellGain').textContent};
  });
  ok(all.val==='25' && all.gain==='25', '「全部」按钮设为最大数量');

  console.log('== 4. 确认出售 ==');
  const sold = await page.evaluate(()=>{
    confirmSell();
    return {gold:G.gold, wood:G.res.wood, modalClosed:!document.getElementById('modal').classList.contains('show')};
  });
  ok(sold.gold===25 && sold.wood===0 && sold.modalClosed, `确认后：金币25/木材0/弹窗关闭 (实际${sold.gold}/${sold.wood})`);

  console.log('== 5. 快捷数量 1 ==');
  const quick1 = await page.evaluate(()=>{
    G.res.leather=10; G.gold=0;
    askSell('leather');
    setSellQty(1);
    const pv=document.getElementById('sellGain').textContent;
    confirmSell();
    return {gold:G.gold, leather:G.res.leather, pv};
  });
  ok(quick1.gold===8 && quick1.leather===9 && quick1.pv==='8', `快捷1个：金币8/皮革9 (${quick1.gold}/${quick1.leather})`);

  console.log('== 6. 边界保护 ==');
  const edge = await page.evaluate(()=>{
    G.res.stone=0;
    askSell('stone'); // 库存0 → 提示不弹窗
    const m1=document.getElementById('modal').classList.contains('show');
    closeModal();
    // 未定价资源
    G.res.foo=5;
    askSell('foo');
    const m2=document.getElementById('modal').classList.contains('show');
    closeModal();
    return {m1, m2};
  });
  ok(!edge.m1, '库存为0时不打开对话框');
  ok(!edge.m2, '未定价资源不打开对话框');

  ok(errors.length===0, '无 JS 报错'+(errors.length?' '+errors.join('|'):''));
  console.log('\n======== v1.7.0 专项: '+pass+' 通过, '+fail+' 失败 ========');
  await browser.close();
  process.exit(fail>0?1:0);
})();
