/* Versioned, portable JSON files. Validate every field before touching the chart. */
(function () {
  'use strict';
  const FORMAT = 'xiaoliu-fengshui', VERSION = 1, LIMIT = 16 * 1024 * 1024;
  const GUA = ['乾','坎','艮','震','巽','離','坤','兌'];
  const $ = id => document.getElementById(id);
  function fail(message) { throw new Error(message); }
  function obj(v, name) { if (!v || typeof v !== 'object' || Array.isArray(v)) fail(name + '格式不正確。'); return v; }
  function num(v, min, max, name, integer = false) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) fail(name + '超出範圍。');
    return v;
  }
  function bool(v, name) { if (typeof v !== 'boolean') fail(name + '格式不正確。'); return v; }
  function choice(v, choices, name) { if (!choices.includes(v)) fail(name + '不正確。'); return v; }
  function date(v) {
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) fail('觀測日期不正確。');
    const d = new Date(v + 'T12:00:00Z');
    if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0,10) !== v || +v.slice(0,4) < 1900 || +v.slice(0,4) > 2099) fail('觀測日期請使用 1900–2099 年的有效日期。');
    return v;
  }
  function person(v, required) {
    obj(v, '命主資料');
    const year = !required && v.year === null ? null : num(v.year,1900,2099,'出生年',true);
    const month = v.month === null ? null : num(v.month,1,12,'出生月',true);
    const day = v.day === null ? null : num(v.day,1,31,'出生日',true);
    if (year !== null && month !== null && day !== null) date(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`);
    return {year,month,day,gender:choice(v.gender,['male','female'],'性別')};
  }
  function list(v, allowed, name) {
    if (!Array.isArray(v) || v.length > allowed.length || new Set(v).size !== v.length || v.some(x => !allowed.includes(x))) fail(name + '格式不正確。');
    return [...v];
  }
  function validate(data) {
    obj(data, '檔案');
    if (data.format !== FORMAT) fail('這不是本工具的排盤存檔，請選擇由「存檔」下載的 JSON。');
    if (data.version !== VERSION) fail('此存檔版本尚不支援，請更新工具後再讀取。');
    if (typeof data.caseName !== 'string' || data.caseName.length > 80) fail('案件名稱不得超過 80 字。');
    const z = obj(data.zibai,'紫白設定'), x = obj(data.xuankong,'玄空設定');
    return {
      format:FORMAT, version:VERSION,
      savedAt:typeof data.savedAt === 'string' ? data.savedAt.slice(0,40) : '', caseName:data.caseName,
      mode:choice(data.mode,['zibai','xuankong'],'頁面'), heading:num(data.heading,0,359.999999999,'方位角度'),
      zibai:{personA:person(z.personA,true),personB:person(z.personB,false),houseGua:choice(z.houseGua,GUA,'宅卦'),date:date(z.date),
        qiMode:bool(z.qiMode,'五氣'),locked:bool(z.locked,'鎖定'),layers:list(z.layers,[1,2,3,4,5],'星氣選項'),openPalaces:list(z.openPalaces,GUA,'展開宮位')},
      xuankong:{period:num(x.period,1,9,'建宅元運',true),currentPeriod:num(x.currentPeriod,1,9,'當前元運',true),view:choice(x.view,['plate','overlay'],'宅盤檢視'),detailsOpen:bool(x.detailsOpen,'玄空詳解')},
      overlay:window.XKOverlay.validateState(data.overlay)
    };
  }
  async function capture() {
    await window.XKOverlay.whenImageReady();
    return validate({format:FORMAT,version:VERSION,savedAt:new Date().toISOString(),caseName:$('case-name').value.trim(),
      mode:document.body.classList.contains('mode-xk')?'xuankong':'zibai',heading:window.ZiBaiPageState.heading(),
      zibai:window.ZiBaiPageState.snapshot(),xuankong:window.XKPageState.snapshot(),overlay:window.XKOverlay.snapshot()});
  }
  async function loadText(text) {
    if (typeof text !== 'string' || text.length > LIMIT) fail('檔案過大，請使用 16 MB 以下的排盤存檔。');
    let json; try { json = JSON.parse(text.replace(/^\uFEFF/,'')); } catch (_) { fail('無法讀取 JSON，原本的排盤未變更。'); }
    const data = validate(json);
    // Image decode can fail; complete it before mutating any fields or live sensors.
    await window.XKOverlay.prepareState(data.overlay);
    window.ZiBaiPageState.restore(data.zibai,data.heading);
    window.XKPageState.restore(data.xuankong,data.mode);
    window.XKOverlay.restore(data.overlay);
    $('case-name').value = data.caseName;
    return data;
  }
  function message(text,error=false) { $('file-status').textContent=text; $('file-status').dataset.state=error?'error':'ready'; }
  function busy(value) { $('save-file-btn').disabled=value; $('load-file-btn').disabled=value; }
  document.addEventListener('DOMContentLoaded', () => {
    $('save-file-btn').addEventListener('click', async () => {
      busy(true);
      try {
        const data = await capture();
        const content = JSON.stringify(data,null,2);
        const blob = new Blob([content],{type:'application/json;charset=utf-8'});
        if (blob.size > LIMIT) fail('平面圖使存檔超過 16 MB，請換用較小的圖片。');
        const url = URL.createObjectURL(blob), a = document.createElement('a');
        const name = (data.caseName || '陽宅風水').replace(/[\x00-\x1f<>:"/\\|?*]/g,'_').slice(0,80);
        a.href=url; a.download=name+'-'+new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'.json';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url),60000);
        message('已建立存檔，請在下載項目或「檔案」中保留 JSON；之後可按「讀取」還原。');
      } catch (e) { message(e.message || '存檔失敗，請再試一次。',true); }
      finally { busy(false); }
    });
    $('load-file-btn').addEventListener('click', () => $('load-file-input').click());
    $('load-file-input').addEventListener('change', async event => {
      const file = event.target.files[0]; if (!file) return;
      busy(true); message('正在讀取…');
      try {
        if (file.size > LIMIT) fail('檔案過大，請使用 16 MB 以下的排盤存檔。');
        const data = await loadText(await file.text());
        message(`已讀取「${data.caseName || '未命名排盤'}」，方位已固定為 ${data.heading.toFixed(1)}°。`);
      } catch (e) { message((e.message || '讀取失敗。') + ' 目前排盤保持不變。',true); }
      finally { event.target.value=''; busy(false); }
    });
  });
  window.FengShuiFiles = {capture,loadText,validate};
})();
