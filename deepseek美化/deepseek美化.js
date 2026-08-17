// ==UserScript==
// @name         DeepSeek 美化
// @namespace    http://tampermonkey.net/
// @version      11.0
// @description  气泡分割样式 + 自定义颜色/圆角/内边距/间距 + 头像
// @author       Maid
// @match        https://chat.deepseek.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // ============================================================
    //  SVG 头像常量
    // ============================================================
    var SVG_DS = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" fill="#4D6BFE"/></svg>';

    var SVG_USER = '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M16,29A13,13,0,1,1,29,16,13,13,0,0,1,16,29ZM16,5A11,11,0,1,0,27,16,11,11,0,0,0,16,5Z" fill="currentColor"/><path d="M16,17a5,5,0,1,1,5-5A5,5,0,0,1,16,17Zm0-8a3,3,0,1,0,3,3A3,3,0,0,0,16,9Z" fill="currentColor"/><path d="M25.55,24a1,1,0,0,1-.74-.32A11.35,11.35,0,0,0,16.46,20h-.92a11.27,11.27,0,0,0-7.85,3.16,1,1,0,0,1-1.38-1.44A13.24,13.24,0,0,1,15.54,18h.92a13.39,13.39,0,0,1,9.82,4.32A1,1,0,0,1,25.55,24Z" fill="currentColor"/></svg>';

    // ============================================================
    //  存储键 & 默认值
    // ============================================================
    var SK = {
        aiBg: 'ds_g_ai_bg', userBg: 'ds_g_user_bg',
        aiText: 'ds_g_ai_txt', userText: 'ds_g_user_txt', thinkText: 'ds_g_think_txt',
        radius: 'ds_g_radius', padding: 'ds_g_padding', gap: 'ds_g_gap'
    };
    var DEF = {
        aiBg: '#007AFF', userBg: '#07C160',
        aiText: '#ffffff', userText: '#ffffff', thinkText: '',
        radius: 12, padding: 14, gap: 10
    };

    function gv(k, d) { return GM_getValue(k, d); }
    function sv(k, v) { GM_setValue(k, v); }

    // ============================================================
    //  样式 CSS
    // ============================================================
    GM_addStyle(
        /* CSS 变量（:root 仅设默认值，JS 通过 inline style 覆盖） */
        ':root{--ds-ai-bg:#007AFF;--ds-user-bg:#07C160;--ds-ai-text:#fff;--ds-user-text:#fff;--ds-radius:12px;--ds-radius-lg:20px;--ds-padding:14px;--ds-gap:10px}\n' +
        /* 预加载层 */
        'div.ds-markdown{background:var(--ds-ai-bg);color:var(--ds-ai-text);border-radius:var(--ds-radius);padding:var(--ds-padding);margin-left:46px}\n' +
        '.fbb737a4{background:var(--ds-user-bg);color:var(--ds-user-text);border-radius:var(--ds-radius-lg);border-top-right-radius:6px;padding:var(--ds-padding);margin-right:46px}\n' +
        'div.ds-markdown hr{visibility:hidden;border:none;height:0;margin:calc(var(--ds-padding) + var(--ds-gap) / 2) 0}\n' +
        /* 思维链重置（--ds-thinking-text 无值时回退到 DS 官方变量） */
        '.ds-in-thinking,.e1675d8b div.ds-markdown,[class*="ds-thinking"] div.ds-markdown,[class*="think-block"] div.ds-markdown,[class*="thought"] div.ds-markdown{background:transparent;color:var(--ds-thinking-text,var(--dsw-alias-label-secondary));border-radius:0;padding:0;margin-left:0}\n' +
        '.ds-in-thinking hr,.e1675d8b div.ds-markdown hr,[class*="ds-thinking"] div.ds-markdown hr,[class*="think-block"] div.ds-markdown hr{display:none}\n' +
        /* JS 精确层 */
        '.ds-ai-styled{background:var(--ds-ai-bg);color:var(--ds-ai-text);border-radius:var(--ds-radius);padding:var(--ds-padding);margin-bottom:var(--ds-gap);position:relative;margin-left:46px}\n' +
        '.ds-ai-styled.ds-ai-first{border-radius:var(--ds-radius-lg);border-top-left-radius:6px}\n' +
        '.ds-ai-styled hr{display:none}\n' +
        '.ds-ai-styled pre,.ds-user-styled pre{border-radius:var(--ds-radius);margin:10px 0}\n' +
        '.ds-ai-styled blockquote{border-left:3px solid rgba(255,255,255,0.5);background:rgba(255,255,255,0.1);padding:8px 14px;border-radius:0 10px 10px 0;margin:8px 0}\n' +
        /* 防撤回 TIP 提示样式（兼容 Deepseek防撤回.js） */
        '.ds-ai-styled [style*="WARNING"],.ds-ai-styled .ds-recall-tip{display:inline-block;background:rgba(255,149,0,0.2);color:#FF9500;border:1px solid rgba(255,149,0,0.3);border-radius:6px;padding:4px 10px;font-size:13px;margin:8px 0}\n' +
        '.ds-user-styled{background:var(--ds-user-bg);color:var(--ds-user-text);border-radius:var(--ds-radius-lg);border-top-right-radius:6px;padding:var(--ds-padding);border:none;outline:none;position:relative;margin-right:46px}\n' +
        /* 头像 */
        '.ds-avatar{width:36px;height:36px;border-radius:50%;position:absolute;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:10}\n' +
        '.ds-avatar svg{width:22px;height:22px}\n' +
        '.ds-avatar-ai{background:rgba(77,107,254,0.15);left:-46px;top:0}\n' +
        '.ds-avatar-user{background:rgba(7,193,96,0.15);color:#07C160;right:-46px;top:0}\n' +
        '.ds-thinking-header{position:relative;margin-left:46px}\n' +
        '.ds-thinking-header .ds-avatar-ai{left:-46px;top:0;transform:none}\n' +
        /* 设置按钮 */
        '#ds-color-btn{position:fixed;right:20px;bottom:24px;width:42px;height:42px;border-radius:50%;background:rgba(0,0,0,0.65);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:2px solid rgba(255,255,255,0.25);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2147483647;box-shadow:0 2px 12px rgba(0,0,0,0.4)}\n' +
        '#ds-color-btn svg{width:20px;height:20px;fill:rgba(255,255,255,0.9)}\n' +
        /* 面板 */
        '#ds-color-panel{position:fixed;right:20px;bottom:76px;background:rgba(30,30,30,0.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:20px;z-index:2147483646;display:none;min-width:280px;box-shadow:0 8px 32px rgba(0,0,0,0.35)}\n' +
        '#ds-color-panel.show{display:block}\n' +
        '.ds-sec{margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.08)}\n' +
        '.ds-sec:last-of-type{margin-bottom:0;padding-bottom:0;border-bottom:none}\n' +
        '.ds-sec-t{color:rgba(255,255,255,0.4);font-size:11px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px}\n' +
        '.ds-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}\n' +
        '.ds-row:last-child{margin-bottom:0}\n' +
        '.ds-lbl{color:rgba(255,255,255,0.8);font-size:14px;font-family:-apple-system,BlinkMacSystemFont,sans-serif}\n' +
        '.ds-pick{width:36px;height:36px;border:2px solid rgba(255,255,255,0.2);border-radius:10px;cursor:pointer;padding:0;background:none;-webkit-appearance:none}\n' +
        '.ds-pick::-webkit-color-swatch-wrapper{padding:0}\n' +
        '.ds-pick::-webkit-color-swatch{border:none;border-radius:7px}\n' +
        '.ds-pick-wrap{display:flex;align-items:center;gap:6px}\n' +
        '.ds-auto{font-size:11px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:2px 6px;border-radius:4px;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.5);background:transparent;cursor:pointer}\n' +
        '.ds-auto.on{color:#007AFF;border-color:#007AFF;background:rgba(0,122,255,0.12)}\n' +
        '.ds-sl-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}\n' +
        '.ds-sl-row:last-child{margin-bottom:0}\n' +
        '.ds-sl-lbl{color:rgba(255,255,255,0.8);font-size:14px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;min-width:48px}\n' +
        '.ds-sl{flex:1;height:4px;-webkit-appearance:none;appearance:none;background:rgba(255,255,255,0.15);border-radius:2px;outline:none}\n' +
        '.ds-sl::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#fff;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.3)}\n' +
        '.ds-sl-val{color:rgba(255,255,255,0.5);font-size:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;min-width:30px;text-align:right}\n' +
        '.ds-rst{width:100%;margin-top:14px;padding:8px 0;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:rgba(255,255,255,0.7);font-size:13px;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,sans-serif}\n' +
        '.ds-rst:hover{background:rgba(255,255,255,0.15)}'
    );

    // ============================================================
    //  样式应用
    // ============================================================
    function applyStyles() {
        var r = document.documentElement;
        r.style.setProperty('--ds-ai-bg', gv(SK.aiBg, DEF.aiBg));
        r.style.setProperty('--ds-user-bg', gv(SK.userBg, DEF.userBg));
        r.style.setProperty('--ds-ai-text', gv(SK.aiText, DEF.aiText));
        r.style.setProperty('--ds-user-text', gv(SK.userText, DEF.userText));
        r.style.setProperty('--ds-radius', gv(SK.radius, DEF.radius) + 'px');
        r.style.setProperty('--ds-radius-lg', (gv(SK.radius, DEF.radius) + 8) + 'px');
        r.style.setProperty('--ds-padding', gv(SK.padding, DEF.padding) + 'px');
        r.style.setProperty('--ds-gap', gv(SK.gap, DEF.gap) + 'px');
        // 思维链文字：空字符串=自动跟随 DS 主题，不设 inline variable 让 CSS fallback 生效
        var tt = gv(SK.thinkText, DEF.thinkText);
        if (tt) { r.style.setProperty('--ds-thinking-text', tt); }
        else { r.style.removeProperty('--ds-thinking-text'); }
    }

    // ============================================================
    //  设置面板
    // ============================================================
    var panelVisible = false;

    function mkSlider(label, val, min, max, onChg) {
        var row = document.createElement('div');
        row.className = 'ds-sl-row';
        var lbl = document.createElement('span');
        lbl.className = 'ds-sl-lbl';
        lbl.textContent = label;
        var sl = document.createElement('input');
        sl.type = 'range'; sl.className = 'ds-sl';
        sl.min = min; sl.max = max; sl.value = val;
        var vt = document.createElement('span');
        vt.className = 'ds-sl-val';
        vt.textContent = val + 'px';
        sl.addEventListener('input', function() { vt.textContent = sl.value + 'px'; onChg(parseInt(sl.value, 10)); applyStyles(); });
        row.appendChild(lbl); row.appendChild(sl); row.appendChild(vt);
        return { row: row, sl: sl, vt: vt };
    }

    function mkColorRow(label, color, onChg) {
        var row = document.createElement('div');
        row.className = 'ds-row';
        var lbl = document.createElement('span');
        lbl.className = 'ds-lbl';
        lbl.textContent = label;
        var pick = document.createElement('input');
        pick.type = 'color'; pick.className = 'ds-pick';
        pick.value = color;
        pick.addEventListener('input', function() { onChg(pick.value); applyStyles(); });
        row.appendChild(lbl); row.appendChild(pick);
        return { row: row, pick: pick };
    }

    function createSettingsUI() {
        if (document.getElementById('ds-color-btn')) return;

        var btn = document.createElement('button');
        btn.id = 'ds-color-btn';
        btn.title = '气泡样式设置';
        btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.24.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0112 22zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5a.54.54 0 00-.14-.35c-.41-.46-.63-1.05-.63-1.65a2.5 2.5 0 012.5-2.5H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7z"/><circle cx="6.5" cy="11.5" r="1.5"/><circle cx="9.5" cy="7.5" r="1.5"/><circle cx="14.5" cy="7.5" r="1.5"/><circle cx="17.5" cy="11.5" r="1.5"/></svg>';
        document.body.appendChild(btn);

        var panel = document.createElement('div');
        panel.id = 'ds-color-panel';

        // —— AI 颜色 ——
        var aiSec = document.createElement('div');
        aiSec.className = 'ds-sec';
        var aiT = document.createElement('div');
        aiT.className = 'ds-sec-t';
        aiT.textContent = 'AI';
        aiSec.appendChild(aiT);
        var aiBgR = mkColorRow('气泡', gv(SK.aiBg, DEF.aiBg), function(v) { sv(SK.aiBg, v); });
        var aiTxtR = mkColorRow('文字', gv(SK.aiText, DEF.aiText), function(v) { sv(SK.aiText, v); });
        aiSec.appendChild(aiBgR.row);
        aiSec.appendChild(aiTxtR.row);

        // —— 用户颜色 ——
        var userSec = document.createElement('div');
        userSec.className = 'ds-sec';
        var userT = document.createElement('div');
        userT.className = 'ds-sec-t';
        userT.textContent = '用户';
        userSec.appendChild(userT);
        var userBgR = mkColorRow('气泡', gv(SK.userBg, DEF.userBg), function(v) { sv(SK.userBg, v); });
        var userTxtR = mkColorRow('文字', gv(SK.userText, DEF.userText), function(v) { sv(SK.userText, v); });
        userSec.appendChild(userBgR.row);
        userSec.appendChild(userTxtR.row);

        // —— 思维链颜色 ——
        var thinkSec = document.createElement('div');
        thinkSec.className = 'ds-sec';
        var thinkT = document.createElement('div');
        thinkT.className = 'ds-sec-t';
        thinkT.textContent = '思维链';
        thinkSec.appendChild(thinkT);

        // 思维链文字行：颜色选择器 + 自动按钮
        var thinkRow = document.createElement('div');
        thinkRow.className = 'ds-row';
        var thinkLbl = document.createElement('span');
        thinkLbl.className = 'ds-lbl';
        thinkLbl.textContent = '文字';
        var thinkWrap = document.createElement('div');
        thinkWrap.className = 'ds-pick-wrap';
        var thinkPick = document.createElement('input');
        thinkPick.type = 'color'; thinkPick.className = 'ds-pick';
        var storedThink = gv(SK.thinkText, DEF.thinkText);
        var isAuto = !storedThink;
        thinkPick.value = storedThink || '#8e8e93';
        thinkPick.disabled = isAuto;
        thinkPick.style.opacity = isAuto ? '0.3' : '1';
        thinkPick.addEventListener('input', function() {
            sv(SK.thinkText, thinkPick.value);
            thinkPick.style.opacity = '1';
            thinkPick.disabled = false;
            autoBtn.classList.remove('on');
            applyStyles();
        });
        var autoBtn = document.createElement('button');
        autoBtn.className = 'ds-auto' + (isAuto ? ' on' : '');
        autoBtn.textContent = '自动';
        autoBtn.addEventListener('click', function() {
            sv(SK.thinkText, '');
            thinkPick.value = '#8e8e93';
            thinkPick.disabled = true;
            thinkPick.style.opacity = '0.3';
            autoBtn.classList.add('on');
            applyStyles();
        });
        thinkWrap.appendChild(thinkPick);
        thinkWrap.appendChild(autoBtn);
        thinkRow.appendChild(thinkLbl);
        thinkRow.appendChild(thinkWrap);
        thinkSec.appendChild(thinkRow);

        // —— 布局 ——
        var layoutSec = document.createElement('div');
        layoutSec.className = 'ds-sec';
        var layT = document.createElement('div');
        layT.className = 'ds-sec-t';
        layT.textContent = '布局';
        layoutSec.appendChild(layT);
        var radiusC = mkSlider('圆角', gv(SK.radius, DEF.radius), 0, 30, function(v) { sv(SK.radius, v); });
        var padC = mkSlider('内边距', gv(SK.padding, DEF.padding), 4, 30, function(v) { sv(SK.padding, v); });
        var gapC = mkSlider('间距', gv(SK.gap, DEF.gap), 0, 30, function(v) { sv(SK.gap, v); });
        layoutSec.appendChild(radiusC.row);
        layoutSec.appendChild(padC.row);
        layoutSec.appendChild(gapC.row);

        // —— 恢复默认 ——
        var rstBtn = document.createElement('button');
        rstBtn.className = 'ds-rst';
        rstBtn.textContent = '恢复默认';
        rstBtn.addEventListener('click', function() {
            sv(SK.aiBg, DEF.aiBg); sv(SK.userBg, DEF.userBg);
            sv(SK.aiText, DEF.aiText); sv(SK.userText, DEF.userText);
            sv(SK.thinkText, DEF.thinkText);
            sv(SK.radius, DEF.radius); sv(SK.padding, DEF.padding); sv(SK.gap, DEF.gap);
            aiBgR.pick.value = DEF.aiBg; aiTxtR.pick.value = DEF.aiText;
            userBgR.pick.value = DEF.userBg; userTxtR.pick.value = DEF.userText;
            thinkPick.value = '#8e8e93'; thinkPick.disabled = true; thinkPick.style.opacity = '0.3';
            autoBtn.classList.add('on');
            radiusC.sl.value = DEF.radius; radiusC.vt.textContent = DEF.radius + 'px';
            padC.sl.value = DEF.padding; padC.vt.textContent = DEF.padding + 'px';
            gapC.sl.value = DEF.gap; gapC.vt.textContent = DEF.gap + 'px';
            applyStyles();
        });

        // —— 导出 / 导入 ——
        var ioRow = document.createElement('div');
        ioRow.style.cssText = 'display:flex;gap:8px;margin-top:10px';

        var exportBtn = document.createElement('button');
        exportBtn.className = 'ds-rst';
        exportBtn.style.cssText = 'flex:1;margin-top:0';
        exportBtn.textContent = '导出';
        exportBtn.addEventListener('click', function() {
            var config = {};
            for (var k in SK) { if (SK.hasOwnProperty(k)) config[k] = gv(SK[k], DEF[k]); }
            var blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'deepseek-bubble-config.json';
            a.click();
            URL.revokeObjectURL(a.href);
        });

        var importBtn = document.createElement('button');
        importBtn.className = 'ds-rst';
        importBtn.style.cssText = 'flex:1;margin-top:0';
        importBtn.textContent = '导入';

        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', function() {
            var file = fileInput.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var config = JSON.parse(e.target.result);
                    // 写入存储
                    for (var k in SK) {
                        if (SK.hasOwnProperty(k) && config.hasOwnProperty(k)) {
                            sv(SK[k], config[k]);
                        }
                    }
                    // 刷新 UI
                    aiBgR.pick.value = gv(SK.aiBg, DEF.aiBg);
                    aiTxtR.pick.value = gv(SK.aiText, DEF.aiText);
                    userBgR.pick.value = gv(SK.userBg, DEF.userBg);
                    userTxtR.pick.value = gv(SK.userText, DEF.userText);
                    var tt = gv(SK.thinkText, DEF.thinkText);
                    if (tt) {
                        thinkPick.value = tt; thinkPick.disabled = false; thinkPick.style.opacity = '1';
                        autoBtn.classList.remove('on');
                    } else {
                        thinkPick.value = '#8e8e93'; thinkPick.disabled = true; thinkPick.style.opacity = '0.3';
                        autoBtn.classList.add('on');
                    }
                    radiusC.sl.value = gv(SK.radius, DEF.radius); radiusC.vt.textContent = gv(SK.radius, DEF.radius) + 'px';
                    padC.sl.value = gv(SK.padding, DEF.padding); padC.vt.textContent = gv(SK.padding, DEF.padding) + 'px';
                    gapC.sl.value = gv(SK.gap, DEF.gap); gapC.vt.textContent = gv(SK.gap, DEF.gap) + 'px';
                    applyStyles();
                } catch(err) {}
            };
            reader.readAsText(file);
            fileInput.value = '';
        });
        document.body.appendChild(fileInput);

        importBtn.addEventListener('click', function() { fileInput.click(); });

        ioRow.appendChild(exportBtn);
        ioRow.appendChild(importBtn);

        panel.appendChild(aiSec);
        panel.appendChild(userSec);
        panel.appendChild(thinkSec);
        panel.appendChild(layoutSec);
        panel.appendChild(rstBtn);
        panel.appendChild(ioRow);
        document.body.appendChild(panel);

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            panelVisible = !panelVisible;
            panel.classList.toggle('show', panelVisible);
        });
        document.addEventListener('click', function(e) {
            if (panelVisible && !panel.contains(e.target) && e.target !== btn) {
                panelVisible = false;
                panel.classList.remove('show');
            }
        });
    }

    // ============================================================
    //  头像注入
    // ============================================================
    var avatarDone = new WeakSet();

    function createAvatar(type) {
        var el = document.createElement('div');
        el.className = 'ds-avatar ds-avatar-' + type;
        el.innerHTML = type === 'ai' ? SVG_DS : SVG_USER;
        return el;
    }

    function findThinkingHeader(el) {
        var prev = el.previousElementSibling;
        while (prev) { if (prev.textContent.indexOf('已思考') !== -1) return prev; prev = prev.previousElementSibling; }
        var p = el.parentElement;
        if (p) { var pp = p.previousElementSibling; while (pp) { if (pp.textContent.indexOf('已思考') !== -1) return pp; pp = pp.previousElementSibling; } }
        return null;
    }

    function injectAiAvatar(el) {
        if (avatarDone.has(el)) return; avatarDone.add(el);
        var av = createAvatar('ai'), hdr = findThinkingHeader(el);
        if (hdr) { if (hdr.querySelector('.ds-avatar-ai')) return; hdr.classList.add('ds-thinking-header'); hdr.appendChild(av); }
        else { el.appendChild(av); }
    }

    function injectUserAvatar(el) {
        if (avatarDone.has(el)) return; avatarDone.add(el);
        el.appendChild(createAvatar('user'));
    }

    // ============================================================
    //  气泡分割
    // ============================================================
    var SEL = { userMsg: '._9663006', userBubble: '.fbb737a4', aiMarkdown: 'div.ds-markdown' };
    var processedMessages = new WeakSet();
    var messageLastChange = new Map(), messageSnapshot = new Map(), pendingSplits = new Map();
    var STABLE_THRESHOLD = 800;

    function isInInputArea(el) {
        try {
            if (el.closest('textarea,[contenteditable="true"],[role="textbox"]')) return true;
            var p = el;
            while (p && p !== document.body) {
                var cn = p.className || '';
                if (typeof cn === 'string' && (cn.indexOf('chat-input') !== -1 || cn.indexOf('composer') !== -1 || cn.indexOf('input-area') !== -1 || cn.indexOf('prompt') !== -1 || cn.indexOf('editor') !== -1)) return true;
                p = p.parentElement;
            }
        } catch(e) {}
        return false;
    }

    function getMessageId(el) {
        var t = el.textContent.slice(0, 100), h = 0;
        for (var i = 0; i < t.length; i++) { h = ((h << 5) - h) + t.charCodeAt(i); h |= 0; }
        return h.toString(36);
    }

    function styleUserBubbles() {
        try { document.querySelectorAll(SEL.userBubble).forEach(function(el) { if (isInInputArea(el)) return; if (!el.classList.contains('ds-user-styled')) el.classList.add('ds-user-styled'); injectUserAvatar(el); }); } catch(e) {}
    }

    function isStillStreaming(el) {
        try {
            if (el.querySelector('.ds-loading-dots, .loading, [class*="loading"]')) return true;
            var c = el.innerHTML, id = getMessageId(el), now = Date.now();
            var lc = messageSnapshot.get(id), lt = messageLastChange.get(id) || 0;
            if (c !== lc) { messageSnapshot.set(id, c); messageLastChange.set(id, now); return true; }
            return (now - lt) < STABLE_THRESHOLD;
        } catch(e) { return false; }
    }

    function collectFragments(nodes) {
        var frags = [], cur = [];
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (n.nodeType === 1 && n.nodeName === 'HR') { if (cur.length) { frags.push(cur); cur = []; } }
            else if (n.nodeType === 1 && n.nodeName === 'DIV' && n.querySelector(':scope > hr')) {
                Array.from(n.childNodes).forEach(function(ch) {
                    if (ch.nodeType === 1 && ch.nodeName === 'HR') { if (cur.length) { frags.push(cur); cur = []; } } else cur.push(ch);
                });
            } else cur.push(n);
        }
        if (cur.length) frags.push(cur);
        return frags;
    }

    function splitAiMessage(md) {
        var par = md.parentNode; if (!par) return;
        var frags = collectFragments(Array.from(md.childNodes));
        if (frags.length <= 1) { md.classList.add('ds-ai-styled', 'ds-ai-first'); processedMessages.add(md); injectAiAvatar(md); return; }
        var bubs = frags.map(function(ns, i) {
            var b = document.createElement('div'); b.className = 'ds-ai-styled';
            if (i === 0) b.classList.add('ds-ai-first');
            b.setAttribute('data-ds-bubble', 'true');
            ns.forEach(function(n) { b.appendChild(n); }); return b;
        });
        processedMessages.add(md);
        bubs.forEach(function(b) { par.insertBefore(b, md); });
        md.remove();
        injectAiAvatar(bubs[0]);
    }

    function isThinkingBlock(el) {
        if (el.classList.contains('ds-in-thinking')) return true;
        var n = el;
        while (n && n !== document.body) {
            var cn = n.className || '';
            if (typeof cn === 'string') {
                if (cn.indexOf('e1675d8b') !== -1 || cn.indexOf('ds-thinking') !== -1) { el.classList.add('ds-in-thinking'); return true; }
                if ((cn.indexOf('think') !== -1 && cn.indexOf('block') !== -1) || (cn.indexOf('thought') !== -1 && cn.indexOf('container') !== -1)) { el.classList.add('ds-in-thinking'); return true; }
            }
            if (n.nodeType === 1) {
                var sp = n.querySelector(':scope > span, :scope > div > span');
                if (sp && sp.textContent.indexOf('已思考') !== -1 && n === el.parentElement) { el.classList.add('ds-in-thinking'); return true; }
            }
            n = n.parentElement;
        }
        return false;
    }

    function processAiMessage(md) {
        if (md.getAttribute('data-ds-bubble') === 'true' || isInInputArea(md) || isThinkingBlock(md) || md.closest(SEL.userMsg) || processedMessages.has(md)) return;
        if (!md.classList.contains('ds-ai-styled')) { md.classList.add('ds-ai-styled', 'ds-ai-first'); injectAiAvatar(md); }
        if (isStillStreaming(md)) return;
        if (!md.querySelector('hr')) { processedMessages.add(md); return; }
        var id = getMessageId(md); if (pendingSplits.has(id)) return;
        pendingSplits.set(id, true); splitAiMessage(md);
    }

    function processAllMessages() {
        try { document.querySelectorAll(SEL.aiMarkdown).forEach(function(md) { if (!isThinkingBlock(md) && !md.closest(SEL.userMsg) && !isInInputArea(md)) processAiMessage(md); }); } catch(e) {}
    }

    // ============================================================
    //  初始化
    // ============================================================
    function debounce(fn, d) { var t; return function() { var c = this, a = arguments; clearTimeout(t); t = setTimeout(function() { fn.apply(c, a); }, d); }; }

    var initDone = false, lastUrl = location.href;

    function init() {
        if (initDone) return; initDone = true;
        applyStyles(); createSettingsUI();
        styleUserBubbles(); processAllMessages();
        var dp = debounce(function() { styleUserBubbles(); processAllMessages(); }, 200);
        new MutationObserver(function() { dp(); }).observe(document.body, { childList: true, subtree: true });
        setInterval(function() { styleUserBubbles(); processAllMessages(); }, 1500);
        setInterval(function() {
            if (location.href !== lastUrl) {
                lastUrl = location.href; messageLastChange.clear(); messageSnapshot.clear(); pendingSplits.clear(); initDone = false;
                setTimeout(function() { initDone = true; applyStyles(); createSettingsUI(); styleUserBubbles(); processAllMessages(); }, 600);
            }
        }, 500);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
